
-- 1. Enable RLS on roadmap_usage (no policies = service_role only)
ALTER TABLE public.roadmap_usage ENABLE ROW LEVEL SECURITY;

-- 2. Unique index for atomic upserts
CREATE UNIQUE INDEX IF NOT EXISTS roadmap_usage_ip_fp_month_key
  ON public.roadmap_usage (ip_hash, fingerprint, month);

-- 3. Atomic increment function
CREATE OR REPLACE FUNCTION public.increment_roadmap_usage(
  _ip_hash text,
  _fingerprint text,
  _month text,
  _email text
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count integer;
BEGIN
  INSERT INTO public.roadmap_usage (ip_hash, fingerprint, month, count, last_email)
  VALUES (_ip_hash, _fingerprint, _month, 1, _email)
  ON CONFLICT (ip_hash, fingerprint, month)
  DO UPDATE SET
    count = roadmap_usage.count + 1,
    last_email = COALESCE(EXCLUDED.last_email, roadmap_usage.last_email),
    updated_at = now()
  RETURNING count INTO _count;
  RETURN _count;
END;
$$;

-- 4. Grants
REVOKE ALL ON public.roadmap_usage FROM anon, authenticated;
GRANT ALL ON public.roadmap_usage TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_roadmap_usage(text, text, text, text) TO service_role;
