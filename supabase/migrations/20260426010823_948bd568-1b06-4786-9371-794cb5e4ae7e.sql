-- =============================================================
-- 1) NOVA COLUNA owner_admin_id NAS TABELAS-CHAVE
-- =============================================================
ALTER TABLE public.google_forms_config
  ADD COLUMN IF NOT EXISTS owner_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.action_plans
  ADD COLUMN IF NOT EXISTS owner_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.company_notes
  ADD COLUMN IF NOT EXISTS owner_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gfc_owner_admin ON public.google_forms_config(owner_admin_id);
CREATE INDEX IF NOT EXISTS idx_action_plans_owner_admin ON public.action_plans(owner_admin_id);
CREATE INDEX IF NOT EXISTS idx_company_notes_owner_admin ON public.company_notes(owner_admin_id);

-- =============================================================
-- 2) BACKFILL: associar dados existentes ao primeiro admin
-- =============================================================
DO $$
DECLARE
  _first_admin uuid;
BEGIN
  SELECT user_id INTO _first_admin
  FROM public.user_roles
  WHERE role = 'admin'::app_role
    AND parent_admin_id IS NULL
  ORDER BY 1
  LIMIT 1;

  IF _first_admin IS NOT NULL THEN
    UPDATE public.google_forms_config SET owner_admin_id = _first_admin WHERE owner_admin_id IS NULL;
    UPDATE public.action_plans       SET owner_admin_id = COALESCE(public.get_account_owner(user_id), _first_admin) WHERE owner_admin_id IS NULL;
    UPDATE public.company_notes      SET owner_admin_id = COALESCE(public.get_account_owner(user_id), _first_admin) WHERE owner_admin_id IS NULL;
  END IF;
END $$;

-- =============================================================
-- 3) TRIGGER: preencher owner_admin_id automaticamente
-- =============================================================
CREATE OR REPLACE FUNCTION public.set_owner_admin_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_admin_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.owner_admin_id := public.get_account_owner(auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_owner_admin_gfc ON public.google_forms_config;
CREATE TRIGGER trg_set_owner_admin_gfc
  BEFORE INSERT ON public.google_forms_config
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_admin_id();

DROP TRIGGER IF EXISTS trg_set_owner_admin_action_plans ON public.action_plans;
CREATE TRIGGER trg_set_owner_admin_action_plans
  BEFORE INSERT ON public.action_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_admin_id();

DROP TRIGGER IF EXISTS trg_set_owner_admin_company_notes ON public.company_notes;
CREATE TRIGGER trg_set_owner_admin_company_notes
  BEFORE INSERT ON public.company_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_owner_admin_id();

-- =============================================================
-- 4) HELPERS para policies em tabelas filhas
-- =============================================================
CREATE OR REPLACE FUNCTION public.config_owner_admin(_config_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT owner_admin_id FROM public.google_forms_config WHERE id = _config_id;
$$;

CREATE OR REPLACE FUNCTION public.config_owner_admin_text(_config_id text)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT owner_admin_id FROM public.google_forms_config WHERE id::text = _config_id;
$$;

CREATE OR REPLACE FUNCTION public.action_plan_owner_admin(_plan_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT owner_admin_id FROM public.action_plans WHERE id = _plan_id;
$$;

-- =============================================================
-- 5) RLS — google_forms_config
-- =============================================================
DROP POLICY IF EXISTS "admin_manage_google_forms_config" ON public.google_forms_config;
DROP POLICY IF EXISTS "Authenticated users can read configs" ON public.google_forms_config;
DROP POLICY IF EXISTS "Anyone can read active form configs" ON public.google_forms_config;

-- Público (link da pesquisa) continua podendo LER configs ativas
CREATE POLICY "Public can read active configs"
  ON public.google_forms_config FOR SELECT TO anon
  USING (is_active = true);

-- Família vê suas próprias empresas
CREATE POLICY "Family sees own companies"
  ON public.google_forms_config FOR SELECT TO authenticated
  USING (
    owner_admin_id IS NULL
    OR public.get_account_owner(auth.uid()) = owner_admin_id
  );

-- Admin da família cria empresas
CREATE POLICY "Admin family inserts companies"
  ON public.google_forms_config FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Admin da família atualiza/exclui suas empresas
CREATE POLICY "Admin family updates own companies"
  ON public.google_forms_config FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND public.get_account_owner(auth.uid()) = owner_admin_id
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND public.get_account_owner(auth.uid()) = owner_admin_id
  );

CREATE POLICY "Admin family deletes own companies"
  ON public.google_forms_config FOR DELETE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND public.get_account_owner(auth.uid()) = owner_admin_id
  );

-- =============================================================
-- 6) RLS — action_plans
-- =============================================================
DROP POLICY IF EXISTS "Users can view action plans" ON public.action_plans;
DROP POLICY IF EXISTS "Users can create action plans" ON public.action_plans;
DROP POLICY IF EXISTS "Users can update action plans" ON public.action_plans;
DROP POLICY IF EXISTS "Users can delete action plans" ON public.action_plans;

CREATE POLICY "Family sees own action plans"
  ON public.action_plans FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (owner_admin_id IS NOT NULL AND public.get_account_owner(auth.uid()) = owner_admin_id)
  );

CREATE POLICY "Family creates action plans"
  ON public.action_plans FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family updates own action plans"
  ON public.action_plans FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR (owner_admin_id IS NOT NULL AND public.get_account_owner(auth.uid()) = owner_admin_id)
  );

CREATE POLICY "Family deletes own action plans"
  ON public.action_plans FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR (owner_admin_id IS NOT NULL AND public.get_account_owner(auth.uid()) = owner_admin_id)
  );

-- =============================================================
-- 7) RLS — action_plan_tasks (deriva família via action_plan_id)
-- =============================================================
DROP POLICY IF EXISTS "Users can view tasks" ON public.action_plan_tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON public.action_plan_tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON public.action_plan_tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON public.action_plan_tasks;

CREATE POLICY "Family sees own tasks"
  ON public.action_plan_tasks FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.action_plans ap
      WHERE ap.id = action_plan_tasks.action_plan_id
        AND (ap.user_id = auth.uid()
             OR (ap.owner_admin_id IS NOT NULL AND public.get_account_owner(auth.uid()) = ap.owner_admin_id))
    )
  );

CREATE POLICY "Family inserts tasks"
  ON public.action_plan_tasks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.action_plans ap
      WHERE ap.id = action_plan_tasks.action_plan_id
        AND (ap.user_id = auth.uid()
             OR (ap.owner_admin_id IS NOT NULL AND public.get_account_owner(auth.uid()) = ap.owner_admin_id))
    )
  );

CREATE POLICY "Family updates tasks"
  ON public.action_plan_tasks FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.action_plans ap
      WHERE ap.id = action_plan_tasks.action_plan_id
        AND (ap.user_id = auth.uid()
             OR (ap.owner_admin_id IS NOT NULL AND public.get_account_owner(auth.uid()) = ap.owner_admin_id))
    )
  );

CREATE POLICY "Family deletes tasks"
  ON public.action_plan_tasks FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.action_plans ap
      WHERE ap.id = action_plan_tasks.action_plan_id
        AND (ap.user_id = auth.uid()
             OR (ap.owner_admin_id IS NOT NULL AND public.get_account_owner(auth.uid()) = ap.owner_admin_id))
    )
  );

-- =============================================================
-- 8) RLS — company_notes
-- =============================================================
DROP POLICY IF EXISTS "Users can view all company notes" ON public.company_notes;
DROP POLICY IF EXISTS "Users can create notes" ON public.company_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.company_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.company_notes;

CREATE POLICY "Family sees own notes"
  ON public.company_notes FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR (owner_admin_id IS NOT NULL AND public.get_account_owner(auth.uid()) = owner_admin_id)
  );

CREATE POLICY "Family creates notes"
  ON public.company_notes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Family updates own notes"
  ON public.company_notes FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR (owner_admin_id IS NOT NULL AND public.get_account_owner(auth.uid()) = owner_admin_id)
  );

CREATE POLICY "Family deletes own notes"
  ON public.company_notes FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR (owner_admin_id IS NOT NULL AND public.get_account_owner(auth.uid()) = owner_admin_id)
  );

-- =============================================================
-- 9) RLS — survey_responses (deriva família via config_id)
-- =============================================================
DROP POLICY IF EXISTS "Authenticated users can read responses" ON public.survey_responses;

CREATE POLICY "Family sees own survey responses"
  ON public.survey_responses FOR SELECT TO authenticated
  USING (
    public.config_owner_admin(config_id) IS NULL
    OR public.get_account_owner(auth.uid()) = public.config_owner_admin(config_id)
  );

-- INSERT (anon e authenticated) já existe e permanece

-- =============================================================
-- 10) RLS — survey_sessions (deriva família via config_id)
-- =============================================================
DROP POLICY IF EXISTS "Authenticated can read all sessions" ON public.survey_sessions;

CREATE POLICY "Family sees own sessions"
  ON public.survey_sessions FOR SELECT TO authenticated
  USING (
    public.config_owner_admin(config_id) IS NULL
    OR public.get_account_owner(auth.uid()) = public.config_owner_admin(config_id)
  );

-- =============================================================
-- 11) RLS — sync_logs (deriva família via config_id)
-- =============================================================
DROP POLICY IF EXISTS "Authenticated users can read sync_logs" ON public.sync_logs;

CREATE POLICY "Family sees own sync logs"
  ON public.sync_logs FOR SELECT TO authenticated
  USING (
    config_id IS NULL
    OR public.config_owner_admin(config_id) IS NULL
    OR public.get_account_owner(auth.uid()) = public.config_owner_admin(config_id)
  );