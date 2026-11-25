-- Prevent duplicate wallet refunds when the same virtual-number order is
-- reached through different cancellation/refund entry points.
CREATE OR REPLACE FUNCTION public.refund_virtual_number_purchase(
  p_user_id uuid,
  p_order_id uuid,
  p_reason text DEFAULT 'Virtual number purchase failed or cancelled'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order public.virtual_number_orders%ROWTYPE;
  v_amount numeric(14,2);
  v_balance numeric(14,2);
  v_reference text;
  v_already_refunded boolean;
BEGIN
  IF p_user_id IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'Missing user or order ID';
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended('virtual-number-refund:' || p_order_id::text, 0)
  );

  SELECT * INTO v_order
    FROM public.virtual_number_orders
   WHERE id = p_order_id AND user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Virtual number order not found';
  END IF;

  v_reference := 'virtual-number-refund:' || v_order.id::text;

  -- All legacy identifiers are aliases for this same order/refund.
  SELECT EXISTS (
    SELECT 1 FROM public.transactions t
     WHERE t.user_id = p_user_id
       AND t.type = 'wallet_refund'
       AND t.status = 'completed'
       AND (
         t.reference = v_reference
         OR t.reference = v_order.activation_id
         OR t.reference = v_order.provider_activation_id
         OR t.reference = v_order.numpool_order_id
         OR t.reference = v_order.client_request_id
         OR t.reference = 'pending:' || v_order.client_request_id
       )
  ) INTO v_already_refunded;

  IF v_already_refunded THEN
    RETURN jsonb_build_object(
      'ok', true, 'success', true, 'already_refunded', true,
      'order_id', v_order.id, 'status', v_order.status
    );
  END IF;

  v_amount := round(coalesce(
    nullif(v_order.customer_price_ngn, 0),
    nullif(v_order.price, 0), 0
  )::numeric, 2);

  IF v_amount <= 0 THEN
    RAISE EXCEPTION 'Refund amount could not be determined';
  END IF;

  INSERT INTO public.wallet ("user-id", balance)
  VALUES (p_user_id, 0)
  ON CONFLICT ("user-id") DO NOTHING;

  SELECT balance INTO v_balance
    FROM public.wallet
   WHERE "user-id" = p_user_id
   FOR UPDATE;

  UPDATE public.wallet
     SET balance = coalesce(balance, 0) + v_amount,
         updated_at = now()
   WHERE "user-id" = p_user_id
   RETURNING balance INTO v_balance;

  INSERT INTO public.transactions (
    user_id, type, amount, status, description, reference
  ) VALUES (
    p_user_id, 'wallet_refund', v_amount, 'completed',
    left(coalesce(p_reason, 'Virtual number refund'), 250), v_reference
  );

  UPDATE public.virtual_number_orders
     SET status = CASE
       WHEN lower(coalesce(p_reason, '')) LIKE '%cancel%' THEN 'cancelled'
       ELSE 'refunded'
     END,
     updated_at = now()
   WHERE id = v_order.id;

  RETURN jsonb_build_object(
    'ok', true, 'success', true, 'already_refunded', false,
    'refunded', v_amount, 'balance', v_balance, 'order_id', v_order.id
  );
END;
$function$;

-- Keep the legacy activation-ID entry point, but route it through the
-- canonical order-ID-based idempotency guard.
CREATE OR REPLACE FUNCTION public.cancel_virtual_number_and_refund(
  p_user_id uuid,
  p_activation_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order public.virtual_number_orders%ROWTYPE;
BEGIN
  IF p_user_id IS NULL OR NULLIF(trim(p_activation_id), '') IS NULL THEN
    RAISE EXCEPTION 'Missing user or activation ID';
  END IF;

  SELECT * INTO v_order
    FROM public.virtual_number_orders
   WHERE user_id = p_user_id
     AND (
       activation_id = p_activation_id
       OR provider_activation_id = p_activation_id
       OR numpool_order_id = p_activation_id
       OR numpool_order_id = 'grizzly:' || p_activation_id
     )
   ORDER BY created_at DESC
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Virtual number order not found';
  END IF;

  RETURN public.refund_virtual_number_purchase(
    p_user_id, v_order.id, 'Virtual number purchase cancelled'
  );
END;
$function$;
