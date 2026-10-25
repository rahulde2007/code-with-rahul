-- Supabase Schema for Blog Post Claps
-- Run this in your Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS public.post_claps (
  post_slug TEXT PRIMARY KEY,
  clap_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.post_clap_visitors (
  post_slug TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_slug, visitor_id)
);

-- Enable Row Level Security (RLS) on both tables with no public policies
-- (Access is handled securely via serverless functions using service_role key)
ALTER TABLE public.post_claps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_clap_visitors ENABLE ROW LEVEL SECURITY;

-- Atomic RPC function to increment claps safely without race conditions
CREATE OR REPLACE FUNCTION public.increment_clap(slug_input TEXT, visitor_id_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted BOOLEAN := false;
  v_new_count INT := 0;
BEGIN
  -- 1. Try to record visitor clap atomically
  INSERT INTO public.post_clap_visitors (post_slug, visitor_id)
  VALUES (slug_input, visitor_id_input)
  ON CONFLICT (post_slug, visitor_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted THEN
    -- 2. New clap: increment clap_count in post_claps atomically
    INSERT INTO public.post_claps (post_slug, clap_count)
    VALUES (slug_input, 1)
    ON CONFLICT (post_slug)
    DO UPDATE SET clap_count = public.post_claps.clap_count + 1
    RETURNING clap_count INTO v_new_count;

    RETURN json_build_object('success', true, 'alreadyClapped', false, 'clap_count', v_new_count);
  ELSE
    -- 3. Visitor already clapped: return current clap_count without incrementing
    SELECT COALESCE(clap_count, 0) INTO v_new_count
    FROM public.post_claps
    WHERE post_slug = slug_input;

    RETURN json_build_object('success', true, 'alreadyClapped', true, 'clap_count', v_new_count);
  END IF;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.increment_clap(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_clap(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_clap(TEXT, TEXT) TO authenticated;
