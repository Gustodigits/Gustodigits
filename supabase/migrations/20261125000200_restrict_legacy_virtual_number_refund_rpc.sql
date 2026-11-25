-- The legacy refund RPC is an internal service/admin helper.
-- Do not expose this SECURITY DEFINER function to browser roles.
REVOKE EXECUTE ON FUNCTION public.cancel_virtual_number_and_refund(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_virtual_number_and_refund(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_virtual_number_and_refund(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_virtual_number_and_refund(uuid, text) TO service_role;
