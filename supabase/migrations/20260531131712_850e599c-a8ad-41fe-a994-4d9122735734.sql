DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.roadmap_usage'::regclass
      AND polname = 'No direct user access to roadmap usage'
  ) THEN
    CREATE POLICY "No direct user access to roadmap usage"
    ON public.roadmap_usage
    AS RESTRICTIVE
    FOR ALL
    TO anon, authenticated
    USING (false)
    WITH CHECK (false);
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.get_user_tier(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_tier(uuid) TO service_role;
