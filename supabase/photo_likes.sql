-- Supabase Schema for Gallery Photo Likes
-- Run this in your Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS public.photo_likes (
  photo_id TEXT PRIMARY KEY,
  like_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.photo_like_visitors (
  photo_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (photo_id, visitor_id)
);

-- Enable Row Level Security (RLS) on both tables with no public policies
-- (Access is handled securely via serverless functions using service_role key)
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_like_visitors ENABLE ROW LEVEL SECURITY;

-- Atomic RPC function to increment photo likes safely without race conditions
CREATE OR REPLACE FUNCTION public.increment_photo_like(photo_id_input TEXT, visitor_id_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted BOOLEAN := false;
  v_new_count INT := 0;
BEGIN
  -- 1. Try to record visitor like atomically
  INSERT INTO public.photo_like_visitors (photo_id, visitor_id)
  VALUES (photo_id_input, visitor_id_input)
  ON CONFLICT (photo_id, visitor_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted THEN
    -- 2. New like: increment like_count in photo_likes atomically
    INSERT INTO public.photo_likes (photo_id, like_count)
    VALUES (photo_id_input, 1)
    ON CONFLICT (photo_id)
    DO UPDATE SET like_count = public.photo_likes.like_count + 1
    RETURNING like_count INTO v_new_count;

    RETURN json_build_object('success', true, 'alreadyLiked', false, 'like_count', v_new_count);
  ELSE
    -- 3. Visitor already liked: return current like_count without incrementing
    SELECT COALESCE(like_count, 0) INTO v_new_count
    FROM public.photo_likes
    WHERE photo_id = photo_id_input;

    RETURN json_build_object('success', true, 'alreadyLiked', true, 'like_count', v_new_count);
  END IF;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.increment_photo_like(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_photo_like(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_photo_like(TEXT, TEXT) TO authenticated;
