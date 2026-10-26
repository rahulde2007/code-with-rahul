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

const PHOTO_ID_REGEX = /^[a-zA-Z0-9_-]{1,100}$/;
const VISITOR_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  const ip = getClientIp(req);

  // Rate limiting check: 60 requests per minute per IP
  if (isRateLimited(`photo-likes:${ip}`, 60, 60 * 1000)) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
    });
  }

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (err: any) {
    console.error('Supabase initialization error in photo-likes API:', err.message);
    return res.status(500).json({ error: 'Database service configuration error.' });
  }

  // Handle GET request: support both single photoId and batch/bulk load
  if (req.method === 'GET') {
    const query = parseRequestQuery(req);
    const photoId = query.photoId?.trim();
    const visitorId = query.visitorId?.trim();
    const photoIdsParam = query.photoIds?.trim();

    // Case 1: Batch / Bulk GET (no single photoId provided, or photoIdsParam provided)
    if (!photoId) {
      try {
        let photoQuery = supabase.from('photo_likes').select('photo_id, like_count');
        if (photoIdsParam) {
          const ids = photoIdsParam
            .split(',')
            .map((id) => id.trim())
            .filter((id) => PHOTO_ID_REGEX.test(id));
          if (ids.length > 0) {
            photoQuery = photoQuery.in('photo_id', ids);
          }
        }

        const [likesResult, visitorsResult] = await Promise.all([
          photoQuery,
          visitorId && VISITOR_ID_REGEX.test(visitorId)
            ? supabase
                .from('photo_like_visitors')
                .select('photo_id')
                .eq('visitor_id', visitorId)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (likesResult.error) {
          // If table doesn't exist yet in Supabase, return empty counts gracefully
          if (
            likesResult.error.message?.includes('relation "public.photo_likes" does not exist') ||
            likesResult.error.code === '42P01'
          ) {
            return res.status(200).json({ counts: {}, userLikes: [] });
          }
          console.error('Error fetching batch photo likes:', likesResult.error);
          return res.status(500).json({ error: 'Failed to fetch photo likes.' });
        }

        const counts: Record<string, number> = {};
        if (Array.isArray(likesResult.data)) {
          for (const item of likesResult.data) {
            if (item.photo_id) {
              counts[item.photo_id] =
                typeof item.like_count === 'number'
                  ? item.like_count
                  : Number(item.like_count) || 0;
            }
          }
        }

        const userLikes: string[] = [];
        if (Array.isArray(visitorsResult.data)) {
          for (const item of visitorsResult.data) {
            if (item.photo_id) {
              userLikes.push(item.photo_id);
            }
          }
        }

        return res.status(200).json({ counts, userLikes });
      } catch (error: any) {
        console.error('Unexpected error in batch GET /api/photo-likes:', error);
        return res.status(500).json({ error: 'Internal server error.' });
      }
    }

    // Case 2: Single photo GET
    if (!PHOTO_ID_REGEX.test(photoId)) {
      return res.status(400).json({ error: 'Valid photoId is required.' });
    }

    try {
      const [likeResult, visitorResult] = await Promise.all([
        supabase
          .from('photo_likes')
          .select('like_count')
          .eq('photo_id', photoId)
          .maybeSingle(),
        visitorId && VISITOR_ID_REGEX.test(visitorId)
          ? supabase
              .from('photo_like_visitors')
              .select('visitor_id')
              .eq('photo_id', photoId)
              .eq('visitor_id', visitorId)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (likeResult.error) {
        if (
          likeResult.error.message?.includes('relation "public.photo_likes" does not exist') ||
          likeResult.error.code === '42P01'
        ) {
          return res.status(200).json({ like_count: 0, hasLiked: false });
        }
        console.error('Error fetching single photo likes:', likeResult.error);
        return res.status(500).json({ error: 'Failed to fetch photo likes.' });
      }

      const likeCount = likeResult.data?.like_count ?? 0;
      const hasLiked = Boolean(visitorResult.data);

      return res.status(200).json({
        like_count: typeof likeCount === 'number' ? likeCount : Number(likeCount) || 0,
        hasLiked,
      });
    } catch (error: any) {
      console.error('Unexpected error in single GET /api/photo-likes:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  // Handle POST request: record photo like atomically
  if (req.method === 'POST') {
    const body = await parseRequestBody(req);
    const photoId = typeof body?.photoId === 'string' ? body.photoId.trim() : '';
    const visitorId = typeof body?.visitorId === 'string' ? body.visitorId.trim() : '';

    if (!photoId || !PHOTO_ID_REGEX.test(photoId)) {
      return res.status(400).json({ error: 'Invalid or missing photoId.' });
    }

    if (!visitorId || !VISITOR_ID_REGEX.test(visitorId)) {
      return res.status(400).json({ error: 'Invalid or missing visitorId.' });
    }

    try {
      // 1. First attempt: call Postgres RPC `increment_photo_like` if defined
      const { data: rpcData, error: rpcError } = await supabase.rpc('increment_photo_like', {
        photo_id_input: photoId,
        visitor_id_input: visitorId,
      });

      if (!rpcError && rpcData) {
        const parsed = typeof rpcData === 'string' ? JSON.parse(rpcData) : rpcData;
        return res.status(200).json({
          success: true,
          alreadyLiked: Boolean(parsed.alreadyLiked),
          like_count: Number(parsed.like_count) || 0,
        });
      }

      // 2. Fallback if RPC is not installed: Atomic composite PK insertion followed by increment
      // Primary key on photo_like_visitors is (photo_id, visitor_id)
      const { error: insertError } = await supabase
        .from('photo_like_visitors')
        .insert({ photo_id: photoId, visitor_id: visitorId });

      if (insertError) {
        // Code 23505 is PostgreSQL unique constraint violation
        if (insertError.code === '23505') {
          const { data: currentData } = await supabase
            .from('photo_likes')
            .select('like_count')
            .eq('photo_id', photoId)
            .maybeSingle();

          return res.status(200).json({
            success: true,
            alreadyLiked: true,
            like_count: currentData?.like_count ?? 0,
          });
        }

        console.error('Error inserting into photo_like_visitors:', insertError);
        return res.status(500).json({ error: 'Failed to record photo like.' });
      }

      // New visitor like recorded! Increment photo_likes.like_count
      const { data: existingLike } = await supabase
        .from('photo_likes')
        .select('like_count')
        .eq('photo_id', photoId)
        .maybeSingle();

      const nextCount = (existingLike?.like_count ?? 0) + 1;

      const { data: updatedLike, error: updateError } = await supabase
        .from('photo_likes')
        .upsert(
          { photo_id: photoId, like_count: nextCount },
          { onConflict: 'photo_id' }
        )
        .select('like_count')
        .single();

      if (updateError) {
        console.error('Error updating photo_likes:', updateError);
        return res.status(500).json({ error: 'Failed to update photo like count.' });
      }

      return res.status(200).json({
        success: true,
        alreadyLiked: false,
        like_count: updatedLike?.like_count ?? nextCount,
      });
    } catch (error: any) {
      console.error('Unexpected error in POST /api/photo-likes:', error);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
