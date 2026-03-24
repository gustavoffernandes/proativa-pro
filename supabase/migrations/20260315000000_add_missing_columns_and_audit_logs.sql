-- ============================================================
-- 1. ADD COLUMN sector → google_forms_config
--    (setor de atuação da empresa)
-- ============================================================
ALTER TABLE public.google_forms_config ADD COLUMN IF NOT EXISTS sector TEXT;

-- ============================================================
-- 2. ADD COLUMN employee_count → google_forms_config
--    (quantidade de colaboradores da empresa)
-- ============================================================
ALTER TABLE public.google_forms_config ADD COLUMN IF NOT EXISTS employee_count INTEGER;

-- ============================================================
-- 3. ADD COLUMN form_title → google_forms_config
--    (título customizado do formulário)
-- ============================================================
ALTER TABLE public.google_forms_config ADD COLUMN IF NOT EXISTS form_title TEXT;

-- ============================================================
-- 4. ADD COLUMN updated_at → google_forms_config
--    (coluna ausente; o trigger já existe no migration 20260302125444)
-- ============================================================
ALTER TABLE public.google_forms_config
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- ============================================================
-- 5. ADD COLUMN company_id + FK → user_roles
--    (vincula usuário a uma empresa específica)
-- ============================================================
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS company_id UUID;

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_company_id_fkey;

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_company_id_fkey
  FOREIGN KEY (company_id)
  REFERENCES public.google_forms_config(id)
  ON DELETE CASCADE;

-- ============================================================
-- 6. CREATE TABLE audit_logs
--    (rastreabilidade de ações administrativas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   TEXT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  ip_address  TEXT,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_read_audit_logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "service_role_write_audit_logs"
  ON public.audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS audit_logs_user_id_idx    ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_idx     ON public.audit_logs(action);
