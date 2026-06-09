
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tk_bootstrap_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tk_sync_sold_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tk_set_updated_at() FROM PUBLIC, anon, authenticated;
