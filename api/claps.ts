import {
  getAdminSupabase,
  getClientIp,
  isRateLimited,
  parseRequestBody,
  parseRequestQuery,
} from './_utils';

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
    console.error('Supabase initialization error in claps API:', err.message);
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
        // If table doesn't exist yet, return 0 gracefully
        if (
          clapResult.error.message?.includes('relation "public.post_claps" does not exist') ||
          clapResult.error.code === '42P01'
        ) {
          return res.status(200).json({ clap_count: 0, hasClapped: false });
        }
        console.error('Error fetching post claps:', clapResult.error);
        return res.status(500).json({ error: 'Failed to fetch clap count.' });
      }

      const clapCount = clapResult.data?.clap_count ?? 0;
      const hasClapped = Boolean(visitorResult.data);

      return res.status(200).json({
        clap_count: typeof clapCount === 'number' ? clapCount : Number(clapCount) || 0,
        hasClapped,
      });
    } catch (error: any) {
      console.error('Unexpected error in GET /api/claps:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  // Handle POST request: record clap and increment count atomically
  if (req.method === 'POST') {
    const body = await parseRequestBody(req);
    const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
    const visitorId = typeof body?.visitorId === 'string' ? body.visitorId.trim() : '';

    if (!slug || !SLUG_REGEX.test(slug)) {
      return res.status(400).json({ error: 'Invalid or missing slug.' });
    }

    if (!visitorId || !VISITOR_ID_REGEX.test(visitorId)) {
      return res.status(400).json({ error: 'Invalid or missing visitorId.' });
    }

    try {
      // 1. First attempt: call Postgres RPC `increment_clap` if defined
      const { data: rpcData, error: rpcError } = await supabase.rpc('increment_clap', {
        slug_input: slug,
        visitor_id_input: visitorId,
      });

      if (!rpcError && rpcData) {
        const parsed = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
        return res.status(200).json({
          success: true,
          alreadyClapped: Boolean(parsed.alreadyClapped),
          clap_count: Number(parsed.clap_count) || 0,
        });
      }

      // 2. Fallback if RPC is not installed: Atomic composite PK insertion followed by increment
      // Primary key on post_clap_visitors is (post_slug, visitor_id)
      const { error: insertError } = await supabase
        .from('post_clap_visitors')
        .insert({ post_slug: slug, visitor_id: visitorId });

      if (insertError) {
        // Code 23505 is PostgreSQL unique constraint violation
        if (insertError.code === '23505') {
          const { data: currentData } = await supabase
            .from('post_claps')
            .select('clap_count')
            .eq('post_slug', slug)
            .maybeSingle();

          return res.status(200).json({
            success: true,
            alreadyClapped: true,
            clap_count: currentData?.clap_count ?? 0,
          });
        }

        console.error('Error inserting into post_clap_visitors:', insertError);
        return res.status(500).json({ error: 'Failed to record clap.' });
      }

      // New visitor clap recorded! Increment post_claps.clap_count
      const { data: existingClap } = await supabase
        .from('post_claps')
        .select('clap_count')
        .eq('post_slug', slug)
        .maybeSingle();

      const nextCount = (existingClap?.clap_count ?? 0) + 1;

      const { data: updatedClap, error: updateError } = await supabase
        .from('post_claps')
        .upsert(
          { post_slug: slug, clap_count: nextCount },
          { onConflict: 'post_slug' }
        )
        .select('clap_count')
        .single();

      if (updateError) {
        console.error('Error updating post_claps:', updateError);
        return res.status(500).json({ error: 'Failed to update clap count.' });
      }

      return res.status(200).json({
        success: true,
        alreadyClapped: false,
        clap_count: updatedClap?.clap_count ?? nextCount,
      });
    } catch (error: any) {
      console.error('Unexpected error in POST /api/claps:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
