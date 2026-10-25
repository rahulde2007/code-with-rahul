-- Supabase SQL Function for Atomic Blog Post Likes
-- Run this in your Supabase Project's SQL Editor (Dashboard -> SQL Editor -> New Query)

CREATE OR REPLACE FUNCTION public.increment_like(slug_input TEXT, visitor_id_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted BOOLEAN := false;
  v_new_count INT := 0;
BEGIN
  -- 1. Try to record visitor like atomically in post_like_visitors
  -- If (post_slug, visitor_id) already exists, ON CONFLICT DO NOTHING prevents duplicates
  INSERT INTO public.post_like_visitors (post_slug, visitor_id)
  VALUES (slug_input, visitor_id_input)
  ON CONFLICT (post_slug, visitor_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted THEN
    -- 2. New like: increment like_count in post_likes in the same transaction
    INSERT INTO public.post_likes (post_slug, like_count)
    VALUES (slug_input, 1)
    ON CONFLICT (post_slug)
    DO UPDATE SET like_count = public.post_likes.like_count + 1
    RETURNING like_count INTO v_new_count;

    RETURN json_build_object('success', true, 'alreadyLiked', false, 'like_count', v_new_count);
  ELSE
    -- 3. Visitor already liked: fetch and return current like_count without incrementing
    SELECT COALESCE(like_count, 0) INTO v_new_count
    FROM public.post_likes
    WHERE post_slug = slug_input;

    RETURN json_build_object('success', true, 'alreadyLiked', true, 'like_count', v_new_count);
  END IF;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.increment_like(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_like(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_like(TEXT, TEXT) TO authenticated;
