-- One-time, idempotent correction of duplicate virtual-number refund credits.
-- Only the excess refund amount per affected user is reversed.
-- Original refund transactions are retained for audit; no legitimate credits are removed.
DO $$
DECLARE
  r record;
  v_ref text;
  v_existing integer;
BEGIN
  FOR r IN
    WITH order_refs AS (
      SELECT o.id, o.user_id,
        round(coalesce(nullif(o.customer_price_ngn,0), nullif(o.price,0), 0)::numeric, 2) AS expected_refund,
        array_remove(ARRAY[
          'virtual-number-refund:' || o.id::text,
          o.activation_id,
          o.provider_activation_id,
          o.numpool_order_id,
          o.client_request_id,
          'pending:' || o.client_request_id
        ], NULL) AS refs
      FROM public.virtual_number_orders o
    ),
    per_order AS (
      SELECT o.id, o.user_id, o.expected_refund,
        coalesce(sum(t.amount), 0) AS refunded_total
      FROM order_refs o
      LEFT JOIN public.transactions t
        ON t.user_id = o.user_id
       AND t.type = 'wallet_refund'
       AND t.status = 'completed'
       AND t.reference = ANY(o.refs)
      GROUP BY o.id, o.user_id, o.expected_refund
    )
    SELECT user_id,
      round(sum(greatest(refunded_total - expected_refund, 0)), 2) AS excess
    FROM per_order
    GROUP BY user_id
    HAVING sum(greatest(refunded_total - expected_refund, 0)) > 0
    ORDER BY user_id
  LOOP
    v_ref := 'duplicate-refund-reversal:v1:' || r.user_id::text;
    PERFORM pg_advisory_xact_lock(hashtextextended(v_ref, 0));

    SELECT count(*) INTO v_existing
    FROM public.transactions
    WHERE user_id = r.user_id
      AND reference = v_ref
      AND type = 'duplicate_refund_reversal'
      AND status = 'completed';

    IF v_existing = 0 THEN
      UPDATE public.wallet
      SET balance = coalesce(balance, 0) - r.excess,
          updated_at = now()
      WHERE "user-id" = r.user_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet missing for affected user %', r.user_id;
      END IF;

      INSERT INTO public.transactions (
        user_id, type, amount, status, description, reference
      ) VALUES (
        r.user_id,
        'duplicate_refund_reversal',
        -r.excess,
        'completed',
        'Reversal of duplicate virtual-number refund credits; original refund history retained.',
        v_ref
      );
    END IF;
  END LOOP;
END;
$$;
