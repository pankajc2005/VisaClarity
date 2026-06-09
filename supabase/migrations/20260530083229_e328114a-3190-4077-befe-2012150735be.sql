-- Lock down SECURITY DEFINER functions added in the previous migration.
REVOKE EXECUTE ON FUNCTION public.create_free_subscription_on_signup() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_tier(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_tier(uuid) TO authenticated, service_role;