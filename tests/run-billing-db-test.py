"""Run the billing migration and assertions in an isolated temporary PostgreSQL.

Requires initdb, pg_ctl and psql on PATH. Never connects to the app database.
"""
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]

fixture = """
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE project_admin BYPASSRLS;
GRANT authenticated TO project_admin;
CREATE SCHEMA auth AUTHORIZATION project_admin;
CREATE SCHEMA storage AUTHORIZATION project_admin;
GRANT ALL ON SCHEMA public TO project_admin;
GRANT USAGE ON SCHEMA public, auth TO authenticated, anon;
SET ROLE project_admin;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
 SELECT (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
$$;
CREATE TABLE public.users (id uuid PRIMARY KEY, role text NOT NULL DEFAULT 'user');
CREATE TABLE storage.buckets (name text PRIMARY KEY, public boolean, updated_at timestamptz);
INSERT INTO storage.buckets VALUES ('lesson-resources', true, now());
INSERT INTO auth.users VALUES ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');
INSERT INTO public.users VALUES ('11111111-1111-4111-8111-111111111111', 'user'), ('22222222-2222-4222-8222-222222222222', 'admin');
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.users TO authenticated;
CREATE POLICY member_profile ON public.users TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['user_progress','milestones','war_battle_sessions',
 'improvement_opportunities','winning_solutions','success_nuggets','conversations',
 'messages','lesson_completions','lesson_resources','manager_value_surveys','book_embeddings'] LOOP
  EXECUTE format('CREATE TABLE public.%I (id uuid DEFAULT gen_random_uuid())', t);
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  EXECUTE format('GRANT SELECT ON public.%I TO authenticated', t);
  EXECUTE format('CREATE POLICY initial_read ON public.%I FOR SELECT USING (true)', t);
  EXECUTE format('INSERT INTO public.%I DEFAULT VALUES', t);
 END LOOP;
END $$;
RESET ROLE;
"""

with tempfile.TemporaryDirectory(prefix="manager-billing-db-", dir="/private/tmp") as directory:
    cluster = Path(directory) / "data"
    subprocess.run(["initdb", "-D", str(cluster), "-A", "trust", "--no-locale"], check=True, capture_output=True)
    try:
        subprocess.run(["pg_ctl", "-D", str(cluster), "-l", str(Path(directory) / "postgres.log"),
                        "-o", f"-k {directory} -c listen_addresses=''", "-w", "start"], check=True, capture_output=True)
        migration = (ROOT / "src/db/migrations/007_billing.sql").read_text()
        assert migration.rstrip().endswith("COMMIT;")
        assertions = (ROOT / "tests/billing-rls.sql").read_text()
        sql = fixture + "SET ROLE project_admin;\n" + migration.rsplit("COMMIT;", 1)[0] + assertions
        result = subprocess.run(["psql", "-h", directory, "-d", "postgres", "-v", "ON_ERROR_STOP=1"],
                                input=sql, text=True, capture_output=True)
        if result.returncode:
            print(result.stderr)
            raise SystemExit(result.returncode)
        print("Billing migration and PostgreSQL access-control assertions passed; transaction rolled back.")
    finally:
        subprocess.run(["pg_ctl", "-D", str(cluster), "-m", "immediate", "-w", "stop"], capture_output=True)
