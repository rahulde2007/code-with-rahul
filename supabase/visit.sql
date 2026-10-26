-- Supabase Schema for Site Visitor Count
-- Run this in your Supabase Dashboard -> SQL Editor

CREATE TABLE IF NOT EXISTS public.site_visitors (
  visitor_id TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_stats (
  id INT PRIMARY KEY DEFAULT 1,
  visitor_count INTEGER NOT NULL DEFAULT 0
);

-- In case site_stats already exists without id or visitor_count column:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_stats') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'site_stats' AND column_name = 'visitor_count') THEN
      ALTER TABLE public.site_stats ADD COLUMN visitor_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'site_stats' AND column_name = 'id') THEN
      ALTER TABLE public.site_stats ADD COLUMN id INT DEFAULT 1;
    END IF;
  END IF;
END $$;

-- Ensure default stats row exists with id = 1
INSERT INTO public.site_stats (id, visitor_count)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS) on both tables (no public policies; access via service_role serverless function)
ALTER TABLE public.site_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;

-- Atomic RPC function to record a visit safely without race conditions
CREATE OR REPLACE FUNCTION public.record_site_visit(visitor_id_input TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted BOOLEAN := false;
  v_new_count INT := 0;
BEGIN
  -- 1. Try to record visitor atomically
  INSERT INTO public.site_visitors (visitor_id)
  VALUES (visitor_id_input)
  ON CONFLICT (visitor_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted THEN
    -- 2. New visitor: increment visitor_count atomically
    INSERT INTO public.site_stats (id, visitor_count)
    VALUES (1, 1)
    ON CONFLICT (id)
    DO UPDATE SET visitor_count = public.site_stats.visitor_count + 1
    RETURNING visitor_count INTO v_new_count;

    RETURN json_build_object('success', true, 'isNewVisitor', true, 'visitorCount', v_new_count);
  ELSE
    -- 3. Returning visitor: return current count without incrementing
    SELECT COALESCE(visitor_count, 0) INTO v_new_count
    FROM public.site_stats
    WHERE id = 1;

    RETURN json_build_object('success', true, 'isNewVisitor', false, 'visitorCount', v_new_count);
  END IF;
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.record_site_visit(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_site_visit(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.record_site_visit(TEXT) TO authenticated;
