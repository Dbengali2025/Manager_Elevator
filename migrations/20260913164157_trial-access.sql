-- 7-day free trial: has_billing_access() gates every app table through the
-- paid_access_required RLS policy, so it must honor the trial window or
-- trial members see an empty platform. The window is 7 days from the
-- public.users row's created_at — keep in sync with TRIAL_DAYS in
-- src/lib/billing.ts, which drives the app-level gate and the Module 1-only
-- download rule during the trial.
CREATE OR REPLACE FUNCTION public.has_billing_access()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT auth.uid() IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.billing_access_grants WHERE user_id = auth.uid() AND enabled)
    OR EXISTS (SELECT 1 FROM public.billing_subscriptions WHERE user_id = auth.uid()
      AND status = 'active' AND plan IS NOT NULL AND current_period_end > now())
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()
      AND created_at + interval '7 days' > now())
  );
$function$;
