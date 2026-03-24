
-- ============================================================
-- 1. Função SECURITY DEFINER para checar role (evita recursão RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- ============================================================
-- 2. Corrigir RLS de google_forms_config (somente admin pode gerenciar)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert configs" ON public.google_forms_config;
DROP POLICY IF EXISTS "Authenticated users can update configs" ON public.google_forms_config;
DROP POLICY IF EXISTS "Authenticated users can delete configs" ON public.google_forms_config;

CREATE POLICY "admin_manage_google_forms_config"
  ON public.google_forms_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 3. Corrigir RLS de survey_responses (leitura autenticados, escrita service role)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Authenticated users can delete responses" ON public.survey_responses;

CREATE POLICY "service_role_write_survey_responses"
  ON public.survey_responses FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- 4. Corrigir RLS de sync_logs (escrita apenas service role)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert sync_logs" ON public.sync_logs;
DROP POLICY IF EXISTS "Authenticated users can delete sync_logs" ON public.sync_logs;

CREATE POLICY "service_role_write_sync_logs"
  ON public.sync_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
