import crypto from 'crypto';
import {
  getAdminSupabase,
  getClientIp,
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

  // Handle POST request: record visitor via salted SHA-256 hash and update count
  if (req.method === 'POST') {
    // 1. Require VISITOR_HASH_SALT environment variable (no fallback string)
    const salt = process.env.VISITOR_HASH_SALT;
    if (!salt) {
      console.error('Server configuration error: VISITOR_HASH_SALT environment variable is required.');
      return res.status(500).json({ error: 'Server security configuration error.' });
    }

    const clientIp = getClientIp(req);

    // 2. Localhost guard: do not record visits on localhost
    const host = typeof req.headers?.host === 'string' ? req.headers.host : '';
    const isLocal =
      host.includes('localhost') ||
      host.includes('127.0.0.1') ||
      clientIp === '127.0.0.1' ||
      clientIp === '::1' ||
      clientIp === '::ffff:127.0.0.1';

    if (isLocal) {
      const { data: currentStats } = await supabase
        .from('site_stats')
        .select('visitor_count')
        .eq('id', 1)
        .maybeSingle();

      const count =
        typeof currentStats?.visitor_count === 'number'
          ? currentStats.visitor_count
          : Number(currentStats?.visitor_count) || 0;

      return res.status(200).json({ visitorCount: count });
    }

    // 3. Extract User-Agent and create salted SHA-256 hash (never persist raw IP or User-Agent)
    const rawUa = req.headers?.['user-agent'];
    const userAgent = Array.isArray(rawUa) ? rawUa[0] : (typeof rawUa === 'string' ? rawUa : '');

    const hash = crypto
      .createHash('sha256')
      .update(`${salt}:${clientIp}:${userAgent}`)
      .digest('hex');

    // 4. Parse request body to check incoming localStorage visitorId
    let body: any;
    try {
      body = await parseRequestBody(req);
    } catch (parseErr: any) {
      console.error('Error parsing request body in POST /api/visit:', parseErr?.message || parseErr);
      return res.status(400).json({ error: 'Invalid request body.' });
    }

    const rawBodyVisitorId = body?.visitorId ?? (req as any).body?.visitorId;
    const bodyVisitorId = typeof rawBodyVisitorId === 'string' ? rawBodyVisitorId.trim() : '';

    try {
      // 5. Dual check: verify if either the IP hash or the localStorage ID has already visited
      const idsToCheck = [hash];
      if (bodyVisitorId && VISITOR_ID_REGEX.test(bodyVisitorId) && bodyVisitorId !== hash) {
        idsToCheck.push(bodyVisitorId);
      }

      const { data: existingVisitor, error: checkError } = await supabase
        .from('site_visitors')
        .select('visitor_id')
        .in('visitor_id', idsToCheck)
        .limit(1)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing visitor in POST /api/visit:', checkError);
        return res.status(500).json({ error: 'Database service error.' });
      }

      if (existingVisitor) {
        // Returning visitor: do not increment count, read and return current visitor_count
        const { data: currentStats, error: statsError } = await supabase
          .from('site_stats')
          .select('visitor_count')
          .eq('id', 1)
          .maybeSingle();

        if (statsError && statsError.code !== 'PGRST116') {
          console.error('Error fetching site_stats for returning visitor:', statsError);
          return res.status(500).json({ error: 'Failed to fetch visitor count.' });
        }

        const count =
          typeof currentStats?.visitor_count === 'number'
            ? currentStats.visitor_count
            : Number(currentStats?.visitor_count) || 0;

        return res.status(200).json({ visitorCount: count });
      }

      // 6. Insert salted hash as visitor ID into site_visitors table
      const { error: insertError } = await supabase
        .from('site_visitors')
        .insert({ visitor_id: hash });

      if (insertError) {
        // 23505 = duplicate key violation (concurrent insert)
        if (
          insertError.code === '23505' ||
          insertError.message?.includes('duplicate key') ||
          insertError.message?.includes('unique constraint')
        ) {
          // Returning visitor: do not increment count
          const { data: currentStats, error: statsError } = await supabase
            .from('site_stats')
            .select('visitor_count')
            .eq('id', 1)
            .maybeSingle();

          if (statsError && statsError.code !== 'PGRST116') {
            console.error('Error fetching site_stats after duplicate insert:', statsError);
            return res.status(500).json({ error: 'Failed to fetch visitor count.' });
          }

          const count =
            typeof currentStats?.visitor_count === 'number'
              ? currentStats.visitor_count
              : Number(currentStats?.visitor_count) || 0;

          return res.status(200).json({ visitorCount: count });
        }

        console.error('Error inserting into site_visitors:', insertError);
        return res.status(500).json({ error: 'Failed to record site visitor.' });
      }

      // 7. Insert succeeded (brand new visitor): increment site_stats.visitor_count +1
      const { data: currentStats, error: fetchStatsError } = await supabase
        .from('site_stats')
        .select('visitor_count')
        .eq('id', 1)
        .maybeSingle();

      if (fetchStatsError && fetchStatsError.code !== 'PGRST116') {
        console.error('Error fetching site_stats before increment in POST /api/visit:', fetchStatsError);
        return res.status(500).json({ error: 'Failed to fetch visitor count.' });
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
        console.error('Error updating site_stats visitor_count in POST /api/visit:', updateError);
        return res.status(500).json({ error: 'Failed to update visitor count.' });
      }

      const finalCount =
        typeof updatedStats?.visitor_count === 'number'
          ? updatedStats.visitor_count
          : nextCount;

      return res.status(200).json({ visitorCount: finalCount });
    } catch (err: any) {
      console.error('Unexpected error in POST /api/visit:', err?.message || err);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
