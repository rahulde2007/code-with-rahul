import {
  getAdminSupabase,
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

  let supabase;
  try {
    supabase = getAdminSupabase();
  } catch (err: any) {
    console.error('Supabase initialization error in views API:', err?.message || err);
    return res.status(500).json({ error: 'Database service configuration error.' });
  }

  // Handle GET request: read single blog viewCount or batch/all blog views
  if (req.method === 'GET') {
    const query = parseRequestQuery(req);
    const slug = query.slug?.trim();

    if (slug) {
      if (!SLUG_REGEX.test(slug)) {
        return res.status(400).json({ error: 'Valid blog slug is required.' });
      }

      try {
        const { data, error } = await supabase
          .from('blog_views')
          .select('view_count')
          .eq('blog_slug', slug)
          .maybeSingle();

        if (error) {
          console.error('Error fetching view count in GET /api/views:', error.message || error);
          return res.status(500).json({ error: error.message || 'Failed to fetch view count.' });
        }

        const viewCount =
          typeof data?.view_count === 'number'
            ? data.view_count
            : Number(data?.view_count) || 0;

        return res.status(200).json({ viewCount, slug });
      } catch (err: any) {
        console.error('Unexpected error in GET /api/views:', err?.message || err);
        return res.status(500).json({ error: err?.message || 'Internal server error.' });
      }
    } else {
      // Return all blog views for listing page
      try {
        const { data, error } = await supabase
          .from('blog_views')
          .select('blog_slug, view_count');

        if (error) {
          console.error('Error fetching all views in GET /api/views:', error.message || error);
          return res.status(500).json({ error: error.message || 'Failed to fetch all views.' });
        }

        const views: Record<string, number> = {};
        if (Array.isArray(data)) {
          for (const row of data) {
            if (row?.blog_slug) {
              views[row.blog_slug] =
                typeof row.view_count === 'number'
                  ? row.view_count
                  : Number(row.view_count) || 0;
            }
          }
        }

        return res.status(200).json({ views });
      } catch (err: any) {
        console.error('Unexpected error in GET /api/views:', err?.message || err);
        return res.status(500).json({ error: err?.message || 'Internal server error.' });
      }
    }
  }

  // Handle POST request: increment view count for a canonical blog slug
  if (req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const rawSlug = body.slug ?? (req as any).body?.slug;
      const slug = typeof rawSlug === 'string' ? rawSlug.trim() : '';

      const rawVisitorId = body.visitorId ?? (req as any).body?.visitorId;
      const visitorId = typeof rawVisitorId === 'string' ? rawVisitorId.trim() : '';

      if (!slug || !SLUG_REGEX.test(slug)) {
        return res.status(400).json({ error: 'Valid blog slug is required.' });
      }

      let shouldIncrement = true;

      // If visitorId is provided, check blog_view_visitors table to avoid duplicate increments
      if (visitorId && VISITOR_ID_REGEX.test(visitorId)) {
        const { error: visitorError } = await supabase
          .from('blog_view_visitors')
          .insert({
            blog_slug: slug,
            visitor_id: visitorId,
          });

        if (visitorError) {
          // 23505 = duplicate key violation (same visitor already recorded for this slug)
          if (visitorError.code === '23505') {
            shouldIncrement = false;
          } else if (visitorError.code === 'PGRST205' || visitorError.code === '42P01') {
            // Table blog_view_visitors does not exist yet; gracefully allow increment
            shouldIncrement = true;
          } else {
            console.warn('Notice from blog_view_visitors table insert:', visitorError.message || visitorError);
          }
        }
      }

      // Fetch current view count from blog_views
      const { data: existingData, error: fetchError } = await supabase
        .from('blog_views')
        .select('view_count')
        .eq('blog_slug', slug)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error querying blog_views in POST /api/views:', fetchError.message || fetchError);
        return res.status(500).json({ error: fetchError.message || 'Failed to read blog views.' });
      }

      const currentCount =
        typeof existingData?.view_count === 'number'
          ? existingData.view_count
          : Number(existingData?.view_count) || 0;

      if (!shouldIncrement) {
        // Visitor already recorded; return current view count without incrementing
        return res.status(200).json({ viewCount: currentCount, slug });
      }

      const nextCount = currentCount + 1;

      const { error: upsertError } = await supabase
        .from('blog_views')
        .upsert(
          {
            blog_slug: slug,
            view_count: nextCount,
          },
          { onConflict: 'blog_slug' }
        );

      if (upsertError) {
        console.error('Error upserting blog_views in POST /api/views:', upsertError.message || upsertError);
        return res.status(500).json({ error: upsertError.message || 'Failed to update view count.' });
      }

      return res.status(200).json({ viewCount: nextCount, slug });
    } catch (err: any) {
      console.error('Unexpected error in POST /api/views:', err?.message || err);
      return res.status(500).json({ error: err?.message || 'Internal server error.' });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
