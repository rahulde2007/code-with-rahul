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
const VISITOR_ID_REGEX = /^[a-zA-Z0-9_-]{6,128}$/;

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).json({});
  }

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
    console.error('Supabase initialization error in photo-likes API:', err?.message || err);
    return res.status(500).json({ error: 'Database service configuration error.' });
  }

  // Handle GET request: support single photoId and batch GET
  if (req.method === 'GET') {
    const query = parseRequestQuery(req);
    const photoId = query.photoId?.trim();
    const visitorId = query.visitorId?.trim();
    const photoIdsParam = query.photoIds?.trim();

    // 1. Single photo GET: ?photoId=...&visitorId=...
    if (photoId) {
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
          console.error('Error fetching single photo likes:', likeResult.error.message || likeResult.error);
          return res.status(500).json({ error: likeResult.error.message || 'Failed to fetch photo likes.' });
        }

        const count =
          typeof likeResult.data?.like_count === 'number'
            ? likeResult.data.like_count
            : Number(likeResult.data?.like_count) || 0;
        const hasLiked = Boolean(visitorResult.data);

        return res.status(200).json({
          likeCount: count,
          like_count: count,
          hasLiked,
        });
      } catch (err: any) {
        console.error('Unexpected error in single GET /api/photo-likes:', err?.message || err);
        return res.status(500).json({ error: err?.message || 'Internal server error.' });
      }
    }

    // 2. Batch GET: ?photoIds=a,b,c&visitorId=... (or ?visitorId=...)
    try {
      let photoQuery = supabase.from('photo_likes').select('photo_id, like_count');
      const requestedIds: string[] = [];

      if (photoIdsParam) {
        const ids = photoIdsParam
          .split(',')
          .map((id) => id.trim())
          .filter((id) => PHOTO_ID_REGEX.test(id));
        if (ids.length > 0) {
          requestedIds.push(...ids);
          photoQuery = photoQuery.in('photo_id', ids);
        }
      }

      let visitorQuery =
        visitorId && VISITOR_ID_REGEX.test(visitorId)
          ? supabase
              .from('photo_like_visitors')
              .select('photo_id')
              .eq('visitor_id', visitorId)
          : null;

      if (visitorQuery && requestedIds.length > 0) {
        visitorQuery = visitorQuery.in('photo_id', requestedIds);
      }

      const [likesResult, visitorsResult] = await Promise.all([
        photoQuery,
        visitorQuery ? visitorQuery : Promise.resolve({ data: [], error: null }),
      ]);

      if (likesResult.error) {
        console.error('Error fetching batch photo likes:', likesResult.error.message || likesResult.error);
        return res.status(500).json({ error: likesResult.error.message || 'Failed to fetch photo likes.' });
      }

      const counts: Record<string, number> = {};
      const hasLiked: Record<string, boolean> = {};
      const userLikes: string[] = [];
      const likes: Record<string, { likeCount: number; hasLiked: boolean }> = {};

      // Seed with requested IDs if available
      for (const id of requestedIds) {
        counts[id] = 0;
        hasLiked[id] = false;
        likes[id] = { likeCount: 0, hasLiked: false };
      }

      if (Array.isArray(likesResult.data)) {
        for (const item of likesResult.data) {
          if (item.photo_id) {
            const count =
              typeof item.like_count === 'number'
                ? item.like_count
                : Number(item.like_count) || 0;
            counts[item.photo_id] = count;
          }
        }
      }

      if (Array.isArray(visitorsResult.data)) {
        for (const item of visitorsResult.data) {
          if (item.photo_id) {
            hasLiked[item.photo_id] = true;
            userLikes.push(item.photo_id);
          }
        }
      }

      // Populate hasLiked and likes mapping for all present counts
      for (const [key, count] of Object.entries(counts)) {
        const isLiked = Boolean(hasLiked[key]);
        hasLiked[key] = isLiked;
        likes[key] = {
          likeCount: count,
          hasLiked: isLiked,
        };
      }

      return res.status(200).json({
        counts,
        hasLiked,
        userLikes,
        likes,
      });
    } catch (err: any) {
      console.error('Unexpected error in batch GET /api/photo-likes:', err?.message || err);
      return res.status(500).json({ error: err?.message || 'Internal server error.' });
    }
  }

  // Handle POST request: record photo like atomically
  if (req.method === 'POST') {
    let body: any;
    try {
      body = await parseRequestBody(req);
    } catch (parseErr: any) {
      console.error('Error parsing request body in POST /api/photo-likes:', parseErr?.message || parseErr);
      return res.status(400).json({ error: 'Invalid request body.' });
    }

    const photoId = typeof body?.photoId === 'string' ? body.photoId.trim() : '';
    const visitorId = typeof body?.visitorId === 'string' ? body.visitorId.trim() : '';
    const action = typeof body?.action === 'string' ? body.action.trim() : 'like';

    if (!photoId) {
      return res.status(400).json({ error: 'photoId is required.' });
    }
    if (!visitorId) {
      return res.status(400).json({ error: 'visitorId is required.' });
    }

    if (!PHOTO_ID_REGEX.test(photoId)) {
      return res.status(400).json({ error: 'Invalid photoId format.' });
    }
    if (!VISITOR_ID_REGEX.test(visitorId)) {
      return res.status(400).json({ error: 'Invalid visitorId format.' });
    }

    // Optional unlike handling: isolated strictly to this photoId
    if (action === 'unlike') {
      try {
        const { error: deleteError } = await supabase
          .from('photo_like_visitors')
          .delete()
          .eq('photo_id', photoId)
          .eq('visitor_id', visitorId);

        if (deleteError) {
          console.error('Error deleting from photo_like_visitors:', deleteError.message || deleteError);
          return res.status(500).json({ error: deleteError.message || 'Failed to unlike photo.' });
        }

        const { data: currentData, error: fetchError } = await supabase
          .from('photo_likes')
          .select('like_count')
          .eq('photo_id', photoId)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching current like count during unlike:', fetchError.message || fetchError);
          return res.status(500).json({ error: fetchError.message || 'Failed to fetch like count.' });
        }

        const currentCount =
          typeof currentData?.like_count === 'number'
            ? currentData.like_count
            : Number(currentData?.like_count) || 0;

        const nextCount = Math.max(0, currentCount - 1);

        const { data: updatedData, error: updateError } = await supabase
          .from('photo_likes')
          .upsert(
            { photo_id: photoId, like_count: nextCount },
            { onConflict: 'photo_id' }
          )
          .select('like_count')
          .single();

        if (updateError) {
          console.error('Error updating photo_likes during unlike:', updateError.message || updateError);
          return res.status(500).json({ error: updateError.message || 'Failed to update like count.' });
        }

        const finalCount =
          typeof updatedData?.like_count === 'number'
            ? updatedData.like_count
            : nextCount;

        return res.status(200).json({
          success: true,
          likeCount: finalCount,
          like_count: finalCount,
          hasLiked: false,
          alreadyLiked: false,
        });
      } catch (err: any) {
        console.error('Unexpected error in unlike POST /api/photo-likes:', err?.message || err);
        return res.status(500).json({ error: err?.message || 'Internal server error.' });
      }
    }

    // Like action: record visitor and increment count
    try {
      // 1. Insert visitor record into photo_like_visitors
      const { error: insertError } = await supabase
        .from('photo_like_visitors')
        .insert({ photo_id: photoId, visitor_id: visitorId });

      if (insertError) {
        // 23505 = duplicate primary key (photo_id, visitor_id) -> already liked
        if (
          insertError.code === '23505' ||
          insertError.message?.includes('duplicate key') ||
          insertError.message?.includes('unique constraint')
        ) {
          // Returning like: do not increment count, read and return current like_count
          const { data: currentData, error: fetchError } = await supabase
            .from('photo_likes')
            .select('like_count')
            .eq('photo_id', photoId)
            .maybeSingle();

          if (fetchError) {
            console.error('Error fetching like count for duplicate visitor:', fetchError.message || fetchError);
            return res.status(500).json({ error: fetchError.message || 'Failed to fetch like count.' });
          }

          const count =
            typeof currentData?.like_count === 'number'
              ? currentData.like_count
              : Number(currentData?.like_count) || 0;

          return res.status(200).json({
            success: true,
            likeCount: count,
            like_count: count,
            hasLiked: true,
            alreadyLiked: true,
          });
        }

        console.error('Error inserting into photo_like_visitors:', insertError.message || insertError);
        return res.status(500).json({ error: insertError.message || 'Failed to record photo like.' });
      }

      // 2. Insert succeeded -> New unique like! Increment photo_likes.like_count +1
      const { data: currentData, error: fetchError } = await supabase
        .from('photo_likes')
        .select('like_count')
        .eq('photo_id', photoId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching current like count before increment:', fetchError.message || fetchError);
        return res.status(500).json({ error: fetchError.message || 'Failed to fetch like count.' });
      }

      const currentCount =
        typeof currentData?.like_count === 'number'
          ? currentData.like_count
          : Number(currentData?.like_count) || 0;

      const nextCount = currentCount + 1;

      const { data: updatedData, error: updateError } = await supabase
        .from('photo_likes')
        .upsert(
          { photo_id: photoId, like_count: nextCount },
          { onConflict: 'photo_id' }
        )
        .select('like_count')
        .single();

      if (updateError) {
        console.error('Error updating photo_likes count:', updateError.message || updateError);
        return res.status(500).json({ error: updateError.message || 'Failed to update like count.' });
      }

      const finalCount =
        typeof updatedData?.like_count === 'number'
          ? updatedData.like_count
          : nextCount;

      return res.status(200).json({
        success: true,
        likeCount: finalCount,
        like_count: finalCount,
        hasLiked: true,
        alreadyLiked: false,
      });
    } catch (err: any) {
      console.error('Unexpected error in POST /api/photo-likes:', err?.message || err);
      return res.status(500).json({ error: err?.message || 'Internal server error.' });
    }
  }

  res.setHeader('Allow', 'GET, POST, OPTIONS');
  return res.status(405).json({ error: 'Method Not Allowed' });
}
