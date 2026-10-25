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
  if (isRateLimited(ip, 60, 60 * 1000)) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (err: any) {
    console.error('Supabase initialization error in likes API:', err.message);
    return res.status(500).json({ error: 'Database service configuration error.' });
  }

  // Handle GET request: return like count and whether visitor has liked
  if (req.method === 'GET') {
    const query = parseRequestQuery(req);
    const slug = query.slug?.trim();
    const visitorId = query.visitorId?.trim();

    if (!slug || !SLUG_REGEX.test(slug)) {
      return res.status(400).json({ error: 'Valid post slug is required.' });
    }

    try {
      const [likeResult, visitorResult] = await Promise.all([
        supabase
          .from('post_likes')
          .select('like_count')
          .eq('post_slug', slug)
          .maybeSingle(),
        visitorId && VISITOR_ID_REGEX.test(visitorId)
          ? supabase
              .from('post_like_visitors')
              .select('visitor_id')
              .eq('post_slug', slug)
              .eq('visitor_id', visitorId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (likeResult.error) {
        console.error('Error fetching post likes:', likeResult.error);
        return res.status(500).json({ error: 'Failed to fetch like count.' });
      }

      const likeCount = likeResult.data?.like_count ?? 0;
      const hasLiked = Boolean(visitorResult.data);

      return res.status(200).json({
        like_count: typeof likeCount === 'number' ? likeCount : Number(likeCount) || 0,
        hasLiked,
      });
    } catch (error: any) {
      console.error('Unexpected error in GET /api/likes:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  // Handle POST request: record like and increment count atomically
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
      // 1. First attempt: call Postgres RPC `increment_like` if defined
      const { data: rpcData, error: rpcError } = await supabase.rpc('increment_like', {
        slug_input: slug,
        visitor_id_input: visitorId,
      });

      if (!rpcError && rpcData) {
        // RPC executed successfully
        const parsed = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
        return res.status(200).json({
          success: true,
          alreadyLiked: Boolean(parsed.alreadyLiked),
          like_count: Number(parsed.like_count) || 0,
        });
      }

      // 2. Fallback if RPC is not installed: Atomic composite PK insertion followed by increment
      // Primary key on post_like_visitors is (post_slug, visitor_id)
      const { error: insertError } = await supabase
        .from('post_like_visitors')
        .insert({ post_slug: slug, visitor_id: visitorId });

      if (insertError) {
        // Code 23505 is PostgreSQL unique constraint violation
        if (insertError.code === '23505') {
          const { data: currentData } = await supabase
            .from('post_likes')
            .select('like_count')
            .eq('post_slug', slug)
            .maybeSingle();

          return res.status(200).json({
            success: true,
            alreadyLiked: true,
            like_count: currentData?.like_count ?? 0,
          });
        }

        console.error('Error inserting into post_like_visitors:', insertError);
        return res.status(500).json({ error: 'Failed to record like.' });
      }

      // New visitor like recorded! Increment post_likes.like_count
      const { data: existingLike } = await supabase
        .from('post_likes')
        .select('like_count')
        .eq('post_slug', slug)
        .maybeSingle();

      const nextCount = (existingLike?.like_count ?? 0) + 1;

      const { data: updatedLike, error: updateError } = await supabase
        .from('post_likes')
        .upsert(
          { post_slug: slug, like_count: nextCount },
          { onConflict: 'post_slug' }
        )
        .select('like_count')
        .single();

      if (updateError) {
        console.error('Error updating post_likes:', updateError);
        return res.status(500).json({ error: 'Failed to update like count.' });
      }

      return res.status(200).json({
        success: true,
        alreadyLiked: false,
        like_count: updatedLike?.like_count ?? nextCount,
      });
    } catch (error: any) {
      console.error('Unexpected error in POST /api/likes:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
