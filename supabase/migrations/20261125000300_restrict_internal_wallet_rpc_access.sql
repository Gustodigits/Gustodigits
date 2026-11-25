-- Restrict wallet-mutating internal RPCs to the trusted service role.
-- The Grizzly Edge Function calls reserve_grizzly_virtual_number with the
-- service-role client; browser clients must never choose another user's ID/amount.
REVOKE EXECUTE ON FUNCTION public.reserve_grizzly_virtual_number(uuid, numeric, text, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reserve_grizzly_virtual_number(uuid, numeric, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reserve_grizzly_virtual_number(uuid, numeric, text, text, text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_grizzly_virtual_number(uuid, numeric, text, text, text, text, text) TO service_role;

-- Wallet initialization requires a signed-in user; do not expose it to anon.
REVOKE EXECUTE ON FUNCTION public.ensure_my_wallet() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_my_wallet() FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_wallet() TO authenticated;

-- This function is invoked by the auth.users trigger, not by browser RPC.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
