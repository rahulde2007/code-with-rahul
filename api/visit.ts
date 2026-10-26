import {
  getAdminSupabase,
  getClientIp,
  isRateLimited,
  parseRequestBody,
} from './_utils.js';

interface ApiRequest {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  query?: Record<string, string | string[] | undefined>;
  body?: any;
}

interface ApiResponse {
  status(code: number): ApiResponse;
  setHeader(name: string, value: string): void;
  json(body: unknown): void;
}

const VISITOR_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }

  const ip = getClientIp(req);

  // Rate limiting check: 60 requests per minute per IP
  if (isRateLimited(`visit:${ip}`, 60, 60 * 1000)) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (err: any) {
    console.error('Supabase initialization error in visit API:', err.message);
    return res.status(500).json({ error: 'Database service configuration error.' });
  }

  // Handle GET request: return current visitor count without incrementing
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('site_stats')
        .select('visitor_count')
        .eq('id', 1)
        .maybeSingle();

      if (error) {
        if (
          error.message?.includes('relation "public.site_stats" does not exist') ||
          error.code === '42P01'
        ) {
          return res.status(200).json({ visitorCount: 0 });
        }
        console.error('Error fetching visitor count in GET /api/visit:', error);
        return res.status(500).json({ error: 'Failed to fetch visitor count.' });
      }

      const count =
        typeof data?.visitor_count === 'number'
          ? data.visitor_count
          : Number(data?.visitor_count) || 0;

      return res.status(200).json({ visitorCount: count });
    } catch (error: any) {
      console.error('Unexpected error in GET /api/visit:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  // Handle POST request: record unique visitor and increment count atomically
  if (req.method === 'POST') {
    const body = await parseRequestBody(req);
    const visitorId = typeof body?.visitorId === 'string' ? body.visitorId.trim() : '';

    if (!visitorId || !VISITOR_ID_REGEX.test(visitorId)) {
      return res.status(400).json({ error: 'Invalid or missing visitorId.' });
    }

    try {
      // 1. First attempt: call Postgres RPC `record_site_visit` if defined
      const { data: rpcData, error: rpcError } = await supabase.rpc('record_site_visit', {
        visitor_id_input: visitorId,
      });

      if (!rpcError && rpcData) {
        const parsed = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
        return res.status(200).json({
          visitorCount: Number(parsed.visitorCount) || 0,
          isNewVisitor: Boolean(parsed.isNewVisitor),
        });
      }

      // 2. Fallback: try inserting visitor_id into site_visitors table
      // PostgreSQL unique constraint error code is 23505
      const { error: insertError } = await supabase
        .from('site_visitors')
        .insert({ visitor_id: visitorId });

      if (insertError) {
        if (insertError.code === '23505') {
          // Returning visitor! Do not increment count, just return current count
          const { data: currentStats } = await supabase
            .from('site_stats')
            .select('visitor_count')
            .eq('id', 1)
            .maybeSingle();

          const count =
            typeof currentStats?.visitor_count === 'number'
              ? currentStats.visitor_count
              : Number(currentStats?.visitor_count) || 0;

          return res.status(200).json({
            visitorCount: count,
            isNewVisitor: false,
          });
        }

        // Handle case where table is not yet created in Supabase
        if (
          insertError.message?.includes('relation "public.site_visitors" does not exist') ||
          insertError.code === '42P01'
        ) {
          return res.status(200).json({ visitorCount: 0, isNewVisitor: false });
        }

        console.error('Error inserting into site_visitors:', insertError);
        return res.status(500).json({ error: 'Failed to record site visit.' });
      }

      // New visitor successfully recorded! Increment site_stats.visitor_count
      const { data: existingStats } = await supabase
        .from('site_stats')
        .select('visitor_count')
        .eq('id', 1)
        .maybeSingle();

      const nextCount = (Number(existingStats?.visitor_count) || 0) + 1;

      const { data: updatedStats, error: updateError } = await supabase
        .from('site_stats')
        .upsert(
          { id: 1, visitor_count: nextCount },
          { onConflict: 'id' }
        )
        .select('visitor_count')
        .single();

      if (updateError) {
        console.error('Error updating site_stats:', updateError);
        return res.status(500).json({ error: 'Failed to update visitor count.' });
      }

      return res.status(200).json({
        visitorCount:
          typeof updatedStats?.visitor_count === 'number'
            ? updatedStats.visitor_count
            : nextCount,
        isNewVisitor: true,
      });
    } catch (error: any) {
      console.error('Unexpected error in POST /api/visit:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
