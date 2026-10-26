import {
  getAdminSupabase,
  getClientIp,
  isRateLimited,
  parseRequestBody,
  parseRequestQuery,
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

const SLUG_REGEX = /^[a-zA-Z0-9_-]{1,200}$/;
const VISITOR_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }

  const ip = getClientIp(req);

  // Rate limiting check: 60 requests per minute per IP
  if (isRateLimited(`claps:${ip}`, 60, 60 * 1000)) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (err: any) {
    console.error('Supabase initialization error in claps API:', err?.message || err);
    return res.status(500).json({ error: 'Database service configuration error.' });
  }

  // Handle GET request: return clap count and whether visitor has clapped
  if (req.method === 'GET') {
    const query = parseRequestQuery(req);
    const slug = query.slug?.trim();
    const visitorId = query.visitorId?.trim();

    if (!slug || !SLUG_REGEX.test(slug)) {
      return res.status(400).json({ error: 'Valid post slug is required.' });
    }

    try {
      const [clapResult, visitorResult] = await Promise.all([
        supabase
          .from('post_claps')
          .select('clap_count')
          .eq('post_slug', slug)
          .maybeSingle(),
        visitorId && VISITOR_ID_REGEX.test(visitorId)
          ? supabase
              .from('post_clap_visitors')
              .select('visitor_id')
              .eq('post_slug', slug)
              .eq('visitor_id', visitorId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (clapResult.error) {
        console.error('Error fetching post claps in GET /api/claps:', clapResult.error);
        return res.status(500).json({ error: 'Failed to fetch clap count.' });
      }

      if (visitorResult.error) {
        console.error('Error checking visitor clap status in GET /api/claps:', visitorResult.error);
      }

      const rawCount = clapResult.data?.clap_count;
      const count = typeof rawCount === 'number' ? rawCount : Number(rawCount) || 0;
      const hasClapped = Boolean(visitorResult.data?.visitor_id);

      return res.status(200).json({
        clapCount: count,
        clap_count: count,
        hasClapped,
      });
    } catch (error: any) {
      console.error('Unexpected error in GET /api/claps:', error?.message || error);
      return res.status(500).json({ error: error?.message || 'Internal server error.' });
    }
  }

  // Handle POST request: record clap and increment count atomically
  if (req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const rawSlug = body.slug ?? (req as any).body?.slug;
      const slug = typeof rawSlug === 'string' ? rawSlug.trim() : '';

      const rawVisitorId = body.visitorId ?? (req as any).body?.visitorId;
      const visitorId = typeof rawVisitorId === 'string' ? rawVisitorId.trim() : '';

      if (!slug || !SLUG_REGEX.test(slug)) {
        return res.status(400).json({ error: 'Valid post slug is required.' });
      }

      if (!visitorId || !VISITOR_ID_REGEX.test(visitorId)) {
        return res.status(400).json({ error: 'Valid visitorId is required.' });
      }

      // Try inserting into post_clap_visitors (primary key (post_slug, visitor_id))
      const { error: insertError } = await supabase
        .from('post_clap_visitors')
        .insert({ post_slug: slug, visitor_id: visitorId });

      if (insertError) {
        // Code 23505 is PostgreSQL unique constraint violation: already clapped!
        if (insertError.code === '23505') {
          const { data: currentData, error: readError } = await supabase
            .from('post_claps')
            .select('clap_count')
            .eq('post_slug', slug)
            .maybeSingle();

          if (readError && readError.code !== 'PGRST116') {
            console.error('Error reading post_claps after duplicate insert:', readError);
          }

          const rawCount = currentData?.clap_count;
          const count = typeof rawCount === 'number' ? rawCount : Number(rawCount) || 0;

          return res.status(200).json({
            success: true,
            alreadyClapped: true,
            clapCount: count,
            clap_count: count,
          });
        }

        console.error('Error inserting into post_clap_visitors in POST /api/claps:', insertError);
        return res.status(500).json({ error: insertError.message || 'Failed to record clap.' });
      }

      // New visitor clap recorded! Increment post_claps.clap_count
      const { data: existingClap, error: fetchError } = await supabase
        .from('post_claps')
        .select('clap_count')
        .eq('post_slug', slug)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error reading post_claps in POST /api/claps:', fetchError);
        return res.status(500).json({ error: fetchError.message || 'Failed to read clap count.' });
      }

      const currentCount = typeof existingClap?.clap_count === 'number'
        ? existingClap.clap_count
        : Number(existingClap?.clap_count) || 0;

      const nextCount = currentCount + 1;

      const { data: updatedClap, error: updateError } = await supabase
        .from('post_claps')
        .upsert(
          { post_slug: slug, clap_count: nextCount },
          { onConflict: 'post_slug' }
        )
        .select('clap_count')
        .single();

      if (updateError) {
        console.error('Error updating post_claps in POST /api/claps:', updateError);
        return res.status(500).json({ error: updateError.message || 'Failed to update clap count.' });
      }

      const finalCount = updatedClap?.clap_count ?? nextCount;
      return res.status(200).json({
        success: true,
        alreadyClapped: false,
        clapCount: finalCount,
        clap_count: finalCount,
      });
    } catch (error: any) {
      console.error('Unexpected error in POST /api/claps:', error?.message || error);
      return res.status(500).json({ error: error?.message || 'Internal server error.' });
    }
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
