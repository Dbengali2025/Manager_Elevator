-- Apply with the payment deployment, after configuring Stripe. This gates
-- existing non-admin accounts as well as new accounts; no automatic free tier.

CREATE TABLE IF NOT EXISTS public.billing_customers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL UNIQUE,
  checkout_lock_until timestamptz,
  checkout_lock_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  stripe_subscription_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL REFERENCES public.billing_customers(stripe_customer_id),
  status text NOT NULL,
  plan text CHECK (plan IN ('monthly', 'annual')),
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  observed_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS billing_subscriptions_user_id ON public.billing_subscriptions(user_id);
CREATE TABLE IF NOT EXISTS public.billing_access_grants (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  granted_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Billing is service-written only. In particular, profile updates cannot grant
-- paid access, associate another customer's ID, or change subscription state.
ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_access_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_customers, public.billing_subscriptions, public.billing_access_grants FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.billing_customers, public.billing_subscriptions, public.billing_access_grants TO project_admin;

CREATE OR REPLACE FUNCTION public.sync_billing_subscription(
  p_subscription_id text, p_customer_id text, p_user_id uuid,
  p_status text, p_plan text, p_period_end timestamptz,
  p_cancel_at_period_end boolean, p_observed_at timestamptz
) RETURNS void LANGUAGE sql SET search_path = '' AS $$
  INSERT INTO public.billing_subscriptions AS current (
    stripe_subscription_id, stripe_customer_id, user_id, status, plan,
    current_period_end, cancel_at_period_end, observed_at
  ) VALUES (p_subscription_id, p_customer_id, p_user_id, p_status, p_plan,
    p_period_end, p_cancel_at_period_end, p_observed_at)
  ON CONFLICT (stripe_subscription_id) DO UPDATE SET
    status = EXCLUDED.status, plan = EXCLUDED.plan,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    observed_at = EXCLUDED.observed_at
  WHERE current.observed_at <= EXCLUDED.observed_at;
$$;

CREATE OR REPLACE FUNCTION public.acquire_billing_checkout_lock(p_user_id uuid, p_lock_id uuid)
RETURNS boolean LANGUAGE sql SET search_path = '' AS $$
  WITH locked AS (
    UPDATE public.billing_customers SET checkout_lock_until = now() + interval '2 minutes', checkout_lock_id = p_lock_id
    WHERE user_id = p_user_id AND (checkout_lock_until IS NULL OR checkout_lock_until < now())
    RETURNING user_id
  ) SELECT EXISTS (SELECT 1 FROM locked);
$$;

REVOKE ALL ON FUNCTION public.sync_billing_subscription(text,text,uuid,text,text,timestamptz,boolean,timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.acquire_billing_checkout_lock(uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_billing_subscription(text,text,uuid,text,text,timestamptz,boolean,timestamptz) TO project_admin;
GRANT EXECUTE ON FUNCTION public.acquire_billing_checkout_lock(uuid,uuid) TO project_admin;

CREATE OR REPLACE FUNCTION public.set_billing_access_grant(p_user_id uuid, p_enabled boolean, p_admin_id uuid)
RETURNS void LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = p_admin_id AND role = 'admin') THEN
    RAISE EXCEPTION 'Administrator required';
  END IF;
  INSERT INTO public.billing_access_grants (user_id, enabled, granted_by)
  VALUES (p_user_id, p_enabled, p_admin_id)
  ON CONFLICT (user_id) DO UPDATE SET enabled = EXCLUDED.enabled,
    granted_by = EXCLUDED.granted_by, updated_at = now();
END $$;
REVOKE ALL ON FUNCTION public.set_billing_access_grant(uuid,boolean,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_billing_access_grant(uuid,boolean,uuid) TO project_admin;

CREATE OR REPLACE FUNCTION public.has_billing_access()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.billing_access_grants WHERE user_id = auth.uid() AND enabled)
    OR EXISTS (SELECT 1 FROM public.billing_subscriptions WHERE user_id = auth.uid()
      AND status = 'active' AND plan IS NOT NULL AND current_period_end > now())
  );
$$;
REVOKE ALL ON FUNCTION public.has_billing_access() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_billing_access() TO anon, authenticated, project_admin;

-- Existing ownership policies continue to apply. Restrictive policies add a
-- subscription requirement even to direct requests against the BaaS API.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['user_progress', 'milestones', 'war_battle_sessions',
    'improvement_opportunities', 'winning_solutions', 'success_nuggets',
    'conversations', 'messages', 'lesson_completions', 'lesson_resources',
    'manager_value_surveys', 'book_embeddings']
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS paid_access_required ON public.%I', table_name);
      EXECUTE format('CREATE POLICY paid_access_required ON public.%I AS RESTRICTIVE FOR ALL TO PUBLIC USING ((SELECT public.has_billing_access())) WITH CHECK ((SELECT public.has_billing_access()))', table_name);
    END IF;
  END LOOP;
END $$;

-- Admin bypass is safe only when members cannot promote their own profile.
CREATE OR REPLACE FUNCTION public.protect_billing_admin_role()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    IF (TG_OP = 'INSERT' AND NEW.role IS DISTINCT FROM 'user')
      OR (TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role) THEN
      RAISE EXCEPTION 'Only an administrator can change account roles';
    END IF;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS protect_billing_admin_role ON public.users;
CREATE TRIGGER protect_billing_admin_role BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_billing_admin_role();

-- Lesson-resource bucket privacy is applied separately; storage.buckets is not writable from this migration role.
