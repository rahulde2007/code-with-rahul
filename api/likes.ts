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
  if (isRateLimited(`likes:${ip}`, 60, 60 * 1000)) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (err: any) {
    console.error('Supabase initialization error in likes API:', err?.message || err);
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
        console.error('Error fetching post likes in GET /api/likes:', likeResult.error);
        return res.status(500).json({ error: 'Failed to fetch like count.' });
      }

      if (visitorResult.error) {
        console.error('Error checking visitor like status in GET /api/likes:', visitorResult.error);
      }

      const rawCount = likeResult.data?.like_count;
      const count = typeof rawCount === 'number' ? rawCount : Number(rawCount) || 0;
      const hasLiked = Boolean(visitorResult.data?.visitor_id);

      return res.status(200).json({
        likeCount: count,
        like_count: count,
        hasLiked,
      });
    } catch (error: any) {
      console.error('Unexpected error in GET /api/likes:', error?.message || error);
      return res.status(500).json({ error: error?.message || 'Internal server error.' });
    }
  }

  // Handle POST request: record like and increment count atomically
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

      // Try inserting into post_like_visitors (primary key (post_slug, visitor_id))
      const { error: insertError } = await supabase
        .from('post_like_visitors')
        .insert({ post_slug: slug, visitor_id: visitorId });

      if (insertError) {
        // Code 23505 is PostgreSQL unique constraint violation: already liked!
        if (insertError.code === '23505') {
          const { data: currentData, error: readError } = await supabase
            .from('post_likes')
            .select('like_count')
            .eq('post_slug', slug)
            .maybeSingle();

          if (readError && readError.code !== 'PGRST116') {
            console.error('Error reading post_likes after duplicate insert:', readError);
          }

          const rawCount = currentData?.like_count;
          const count = typeof rawCount === 'number' ? rawCount : Number(rawCount) || 0;

          return res.status(200).json({
            success: true,
            alreadyLiked: true,
            likeCount: count,
            like_count: count,
          });
        }

        console.error('Error inserting into post_like_visitors in POST /api/likes:', insertError);
        return res.status(500).json({ error: insertError.message || 'Failed to record like.' });
      }

      // New visitor like recorded! Increment post_likes.like_count
      const { data: existingLike, error: fetchError } = await supabase
        .from('post_likes')
        .select('like_count')
        .eq('post_slug', slug)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error reading post_likes in POST /api/likes:', fetchError);
        return res.status(500).json({ error: fetchError.message || 'Failed to read like count.' });
      }

      const currentCount = typeof existingLike?.like_count === 'number'
        ? existingLike.like_count
        : Number(existingLike?.like_count) || 0;

      const nextCount = currentCount + 1;

      const { data: updatedLike, error: updateError } = await supabase
        .from('post_likes')
        .upsert(
          { post_slug: slug, like_count: nextCount },
          { onConflict: 'post_slug' }
        )
        .select('like_count')
        .single();

      if (updateError) {
        console.error('Error updating post_likes in POST /api/likes:', updateError);
        return res.status(500).json({ error: updateError.message || 'Failed to update like count.' });
      }

      const finalCount = updatedLike?.like_count ?? nextCount;
      return res.status(200).json({
        success: true,
        alreadyLiked: false,
        likeCount: finalCount,
        like_count: finalCount,
      });
    } catch (error: any) {
      console.error('Unexpected error in POST /api/likes:', error?.message || error);
      return res.status(500).json({ error: error?.message || 'Internal server error.' });
    }
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
