-- Pre-approved complimentary access (HBCU Alumni Bulletproof CI Toolkit
-- Program, testers): an admin lists emails before signup; the first time the
-- matching account proves ownership of the email (signup verification or
-- login), the server claims the row and enables a billing_access_grant.
-- Claiming is one-shot: revoking the grant later via the admin toggle is not
-- undone by another login.

CREATE TABLE IF NOT EXISTS public.billing_preapproved_emails (
  email text PRIMARY KEY CHECK (email = lower(email) AND length(email) <= 254),
  note text NOT NULL DEFAULT '',
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz
);

ALTER TABLE public.billing_preapproved_emails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.billing_preapproved_emails FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.billing_preapproved_emails TO project_admin;

CREATE OR REPLACE FUNCTION public.claim_preapproved_billing_access(p_user_id uuid, p_email text)
RETURNS boolean LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_creator uuid;
BEGIN
  UPDATE public.billing_preapproved_emails
    SET claimed_by = p_user_id, claimed_at = now()
    WHERE email = lower(p_email) AND claimed_by IS NULL
    RETURNING created_by INTO v_creator;
  IF v_creator IS NULL THEN RETURN false; END IF;
  INSERT INTO public.billing_access_grants (user_id, enabled, granted_by)
  VALUES (p_user_id, true, v_creator)
  ON CONFLICT (user_id) DO UPDATE SET enabled = true,
    granted_by = EXCLUDED.granted_by, updated_at = now();
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.claim_preapproved_billing_access(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_preapproved_billing_access(uuid, text) TO project_admin;
