import {
  getAdminSupabase,
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

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (err: any) {
    console.error('Supabase initialization error in visit API:', err?.message || err);
    return res.status(500).json({ error: 'Database service configuration error.' });
  }

  // Handle GET request: only read site_stats.visitor_count and return { visitorCount }
  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('site_stats')
        .select('visitor_count')
        .eq('id', 1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching visitor count in GET /api/visit:', error.message || error);
        return res.status(500).json({ error: error.message || 'Failed to fetch visitor count.' });
      }

      const count =
        typeof data?.visitor_count === 'number'
          ? data.visitor_count
          : Number(data?.visitor_count) || 0;

      return res.status(200).json({ visitorCount: count });
    } catch (err: any) {
      console.error('Unexpected error in GET /api/visit:', err?.message || err);
      return res.status(500).json({ error: err?.message || 'Internal server error.' });
    }
  }

  // Handle POST request: record visitorId and update count
  if (req.method === 'POST') {
    let body: any;
    try {
      body = await parseRequestBody(req);
    } catch (parseErr: any) {
      console.error('Error parsing request body in POST /api/visit:', parseErr?.message || parseErr);
      return res.status(400).json({ error: 'Invalid request body.' });
    }

    const rawVisitorId = body?.visitorId ?? (req as any).body?.visitorId;
    const visitorId = typeof rawVisitorId === 'string' ? rawVisitorId.trim() : '';

    if (!visitorId || !VISITOR_ID_REGEX.test(visitorId)) {
      return res.status(400).json({ error: 'Valid visitorId is required.' });
    }

    try {
      // 1. Insert visitorId into site_visitors table
      const { error: insertError } = await supabase
        .from('site_visitors')
        .insert({ visitor_id: visitorId });

      if (insertError) {
        // 23505 = duplicate key violation (returning visitor)
        if (
          insertError.code === '23505' ||
          insertError.message?.includes('duplicate key') ||
          insertError.message?.includes('unique constraint')
        ) {
          // Returning visitor: do not increment count, read and return current visitor_count
          const { data: currentStats, error: statsError } = await supabase
            .from('site_stats')
            .select('visitor_count')
            .eq('id', 1)
            .maybeSingle();

          if (statsError) {
            console.error('Error fetching site_stats for returning visitor:', statsError.message || statsError);
            return res.status(500).json({ error: statsError.message || 'Failed to fetch visitor count.' });
          }

          const count =
            typeof currentStats?.visitor_count === 'number'
              ? currentStats.visitor_count
              : Number(currentStats?.visitor_count) || 0;

          return res.status(200).json({ visitorCount: count });
        }

        console.error('Error inserting into site_visitors:', insertError.message || insertError);
        return res.status(500).json({ error: insertError.message || 'Failed to record site visitor.' });
      }

      // 2. Insert succeeded (new visitor): increment site_stats.visitor_count +1
      const { data: currentStats, error: fetchStatsError } = await supabase
        .from('site_stats')
        .select('visitor_count')
        .eq('id', 1)
        .maybeSingle();

      if (fetchStatsError) {
        console.error('Error fetching site_stats before increment:', fetchStatsError.message || fetchStatsError);
        return res.status(500).json({ error: fetchStatsError.message || 'Failed to fetch visitor count.' });
      }

      const currentCount =
        typeof currentStats?.visitor_count === 'number'
          ? currentStats.visitor_count
          : Number(currentStats?.visitor_count) || 0;

      const nextCount = currentCount + 1;

      const { data: updatedStats, error: updateError } = await supabase
        .from('site_stats')
        .upsert(
          { id: 1, visitor_count: nextCount },
          { onConflict: 'id' }
        )
        .select('visitor_count')
        .single();

      if (updateError) {
        console.error('Error updating site_stats visitor_count:', updateError.message || updateError);
        return res.status(500).json({ error: updateError.message || 'Failed to update visitor count.' });
      }

      const finalCount =
        typeof updatedStats?.visitor_count === 'number'
          ? updatedStats.visitor_count
          : nextCount;

      return res.status(200).json({ visitorCount: finalCount });
    } catch (err: any) {
      console.error('Unexpected error in POST /api/visit:', err?.message || err);
      return res.status(500).json({ error: err?.message || 'Internal server error.' });
    }
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
