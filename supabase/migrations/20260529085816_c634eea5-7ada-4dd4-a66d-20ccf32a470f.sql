
REVOKE EXECUTE ON FUNCTION public.increment_roadmap_usage(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_roadmap_usage(text, text, text, text) TO service_role;
