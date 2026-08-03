-- Manager Elevator — enable row-level security
--
-- Before this migration every table had RLS disabled while both `anon` and
-- `authenticated` held SELECT/INSERT/UPDATE/DELETE on all of them. Any signed-in
-- user could therefore read or modify any other user's rows through the REST
-- API, including setting their own users.role to 'admin'. Isolation was
-- enforced only by each server action remembering to filter on user_id.
--
-- `project_admin` owns every table and has BYPASSRLS, so the service-key path
-- (admin tooling, seed scripts) is unaffected by anything below.

-- ---------------------------------------------------------------------------
-- Helpers
--
-- SECURITY DEFINER so they can read the owning tables without being subject to
-- the very policies that call them (which would recurse on `users`).
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.owns_conversation(conv_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conv_id AND c.user_id = auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM public;
REVOKE ALL ON FUNCTION public.owns_conversation(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_conversation(uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- User-owned tables: one row belongs to exactly one user via user_id.
-- Admins may read everyone's rows (Dana's dashboard) but only write their own.
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  t text;
  owned_tables text[] := ARRAY[
    'conversations',
    'improvement_opportunities',
    'manager_value_surveys',
    'milestones',
    'success_nuggets',
    'user_progress',
    'war_battle_sessions',
    'winning_solutions'
  ];
BEGIN
  FOREACH t IN ARRAY owned_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_delete', t);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT USING (user_id = auth.uid() OR public.is_admin())',
      t || '_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT WITH CHECK (user_id = auth.uid())',
      t || '_insert', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())',
      t || '_update', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE USING (user_id = auth.uid())',
      t || '_delete', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- users: the owning column is `id`, not `user_id`.
-- ---------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;

CREATE POLICY users_select ON public.users
  FOR SELECT USING (id = auth.uid() OR public.is_admin());

-- Signup creates the caller's own profile row and nobody else's. The role check
-- matters: without it a user could POST their own row with role='admin' before
-- the app inserts it. Granting admin is a service-key operation, and the service
-- key bypasses RLS.
CREATE POLICY users_insert ON public.users
  FOR INSERT WITH CHECK (id = auth.uid() AND role = 'user');

CREATE POLICY users_update ON public.users
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- No DELETE policy: account deletion is not a user-facing operation.

-- ---------------------------------------------------------------------------
-- messages: ownership is indirect, through the parent conversation.
-- ---------------------------------------------------------------------------

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS messages_select ON public.messages;
DROP POLICY IF EXISTS messages_insert ON public.messages;
DROP POLICY IF EXISTS messages_update ON public.messages;
DROP POLICY IF EXISTS messages_delete ON public.messages;

CREATE POLICY messages_select ON public.messages
  FOR SELECT USING (public.owns_conversation(conversation_id) OR public.is_admin());
CREATE POLICY messages_insert ON public.messages
  FOR INSERT WITH CHECK (public.owns_conversation(conversation_id));
CREATE POLICY messages_update ON public.messages
  FOR UPDATE USING (public.owns_conversation(conversation_id))
  WITH CHECK (public.owns_conversation(conversation_id));
CREATE POLICY messages_delete ON public.messages
  FOR DELETE USING (public.owns_conversation(conversation_id));

-- ---------------------------------------------------------------------------
-- Shared content: the book corpus behind the CI Professor and the lesson
-- resource index. Every signed-in user reads these; nobody writes them at
-- runtime (the seed scripts use the service key, which bypasses RLS).
-- ---------------------------------------------------------------------------

ALTER TABLE public.book_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS book_embeddings_select ON public.book_embeddings;
DROP POLICY IF EXISTS lesson_resources_select ON public.lesson_resources;

CREATE POLICY book_embeddings_select ON public.book_embeddings FOR SELECT USING (true);
CREATE POLICY lesson_resources_select ON public.lesson_resources FOR SELECT USING (true);

-- ---------------------------------------------------------------------------
-- Grants
--
-- RLS constrains which rows are visible; grants constrain which tables and
-- columns can be touched at all. Both are needed — a table-level UPDATE grant
-- covers every column, so restricting `role` means re-granting column by column.
-- ---------------------------------------------------------------------------

-- `anon` is never used: the API gateway rejects tokenless requests outright.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Shared content is read-only for end users.
REVOKE INSERT, UPDATE, DELETE ON public.book_embeddings FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lesson_resources FROM authenticated;

-- A user must never be able to promote themselves, change the email their
-- identity is keyed on, or repoint their row at another account.
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (
  full_name,
  hbcu_alma_mater,
  company_name,
  industry,
  role_title,
  onboarding_completed,
  ci_experience_level,
  miestro_linked,
  onboarding_step,
  updated_at
) ON public.users TO authenticated;

REVOKE DELETE ON public.users FROM authenticated;
