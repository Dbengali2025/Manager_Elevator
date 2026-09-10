-- Append to migration 007 with its COMMIT removed. Always end in ROLLBACK.
DO $$
DECLARE member_id uuid; admin_id uuid; acquired boolean;
BEGIN
  SELECT u.id INTO member_id FROM public.users u JOIN auth.users a ON a.id = u.id WHERE u.role = 'user' LIMIT 1;
  SELECT id INTO admin_id FROM public.users WHERE role = 'admin' LIMIT 1;
  IF member_id IS NULL OR admin_id IS NULL THEN RAISE EXCEPTION 'Test requires an existing member and admin'; END IF;
  PERFORM set_config('request.jwt.claims', json_build_object('sub', member_id, 'role', 'authenticated')::text, true);
  IF public.has_billing_access() THEN RAISE EXCEPTION 'Unpaid member has access'; END IF;
  IF has_table_privilege('authenticated', 'public.billing_subscriptions', 'INSERT') OR
     has_table_privilege('authenticated', 'public.billing_access_grants', 'UPDATE') OR
     has_function_privilege('authenticated', 'public.set_billing_access_grant(uuid,boolean,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Member can mutate billing';
  END IF;
  INSERT INTO public.billing_customers (user_id, stripe_customer_id) VALUES (member_id, 'cus_rollback_test');
  acquired := public.acquire_billing_checkout_lock(member_id, '11111111-1111-4111-8111-111111111111');
  IF NOT acquired OR public.acquire_billing_checkout_lock(member_id, '22222222-2222-4222-8222-222222222222') THEN
    RAISE EXCEPTION 'Checkout lock failed';
  END IF;
  PERFORM public.sync_billing_subscription('sub_rollback_test', 'cus_rollback_test', member_id, 'active', 'monthly', now() + interval '1 month', false, now());
  IF NOT public.has_billing_access() THEN RAISE EXCEPTION 'Paid member denied'; END IF;
  -- Cancellation scheduled at period end retains access.
  PERFORM public.sync_billing_subscription('sub_rollback_test', 'cus_rollback_test', member_id, 'active', 'monthly', now() + interval '1 month', true, now() + interval '1 second');
  IF NOT public.has_billing_access() THEN RAISE EXCEPTION 'Scheduled cancellation lost prepaid access'; END IF;
  PERFORM public.sync_billing_subscription('sub_rollback_test', 'cus_rollback_test', member_id, 'canceled', 'monthly', now() + interval '1 month', false, now() + interval '2 seconds');
  -- Old delivery cannot restore active status; duplicate delivery is harmless.
  PERFORM public.sync_billing_subscription('sub_rollback_test', 'cus_rollback_test', member_id, 'active', 'monthly', now() + interval '1 month', false, now());
  PERFORM public.sync_billing_subscription('sub_rollback_test', 'cus_rollback_test', member_id, 'canceled', 'monthly', now() + interval '1 month', false, now() + interval '2 seconds');
  IF public.has_billing_access() THEN RAISE EXCEPTION 'Canceled subscription regained access'; END IF;
  PERFORM public.set_billing_access_grant(member_id, true, admin_id);
  IF NOT public.has_billing_access() THEN RAISE EXCEPTION 'Complimentary access denied'; END IF;
  PERFORM public.set_billing_access_grant(member_id, false, admin_id);
  IF public.has_billing_access() THEN RAISE EXCEPTION 'Revoked grant still allows access'; END IF;
  PERFORM public.sync_billing_subscription('sub_rollback_test', 'cus_rollback_test', member_id, 'active', 'annual', now() - interval '1 second', false, now() + interval '3 seconds');
  IF public.has_billing_access() THEN RAISE EXCEPTION 'Expired subscription has access'; END IF;
END $$;

SET LOCAL ROLE authenticated;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.lesson_resources) OR EXISTS (SELECT 1 FROM public.book_embeddings) THEN
    RAISE EXCEPTION 'Unpaid member can read paid content directly';
  END IF;
  BEGIN
    UPDATE public.users SET role = 'admin' WHERE id = auth.uid();
    RAISE EXCEPTION USING MESSAGE = 'Role escalation succeeded', ERRCODE = 'XX000';
  EXCEPTION WHEN raise_exception OR insufficient_privilege THEN
    NULL;
  END;
END $$;
RESET ROLE;
ROLLBACK;
