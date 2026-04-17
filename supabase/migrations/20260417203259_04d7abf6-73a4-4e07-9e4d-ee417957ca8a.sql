-- ==========================================
-- 1. TABELA DE PLANOS (CATÁLOGO)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  billing_interval text NOT NULL DEFAULT 'month',
  max_companies integer NOT NULL DEFAULT 1,
  max_surveys integer NOT NULL DEFAULT 1,
  max_respondents integer NOT NULL DEFAULT 20,
  max_users integer NOT NULL DEFAULT 1,
  features jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read active plans"
ON public.plans FOR SELECT TO authenticated
USING (is_active = true);

CREATE POLICY "Anon can read active plans"
ON public.plans FOR SELECT TO anon
USING (is_active = true);

CREATE POLICY "super_admin_manage_plans"
ON public.plans FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- 2. SUBSCRIPTIONS: vincular a plans
-- ==========================================
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS plan_id uuid REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS max_surveys integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ==========================================
-- 3. USER_ROLES: parent_admin_id (herança)
-- ==========================================
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS parent_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_parent_admin ON public.user_roles(parent_admin_id);

-- ==========================================
-- 4. FUNÇÃO: assinatura efetiva
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_effective_subscription(_user_id uuid)
RETURNS TABLE (
  subscription_id uuid,
  owner_user_id uuid,
  plan_id uuid,
  plan_name text,
  status text,
  max_companies integer,
  max_surveys integer,
  max_users integer,
  max_responses_per_month integer,
  features jsonb,
  expires_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _owner_id uuid;
BEGIN
  -- Resolve quem é o "dono" da conta: o admin pai, ou o próprio se for admin
  SELECT COALESCE(ur.parent_admin_id, ur.user_id)
    INTO _owner_id
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
  LIMIT 1;

  IF _owner_id IS NULL THEN
    _owner_id := _user_id;
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    s.plan_id,
    COALESCE(p.name, s.plan_name),
    s.status,
    COALESCE(p.max_companies, s.max_companies),
    COALESCE(p.max_surveys, s.max_surveys),
    COALESCE(p.max_users, s.max_users),
    COALESCE(p.max_respondents, s.max_responses_per_month),
    COALESCE(p.features, s.features),
    s.expires_at
  FROM public.subscriptions s
  LEFT JOIN public.plans p ON p.id = s.plan_id
  WHERE s.user_id = _owner_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

-- Permitir que qualquer usuário autenticado leia a sua assinatura efetiva
GRANT EXECUTE ON FUNCTION public.get_effective_subscription(uuid) TO authenticated, anon;

-- Política extra em subscriptions: usuários filhos podem ver a assinatura do admin pai
CREATE POLICY "members_can_read_parent_subscription"
ON public.subscriptions FOR SELECT TO authenticated
USING (
  user_id IN (
    SELECT COALESCE(parent_admin_id, user_id)
    FROM public.user_roles
    WHERE user_id = auth.uid()
  )
);

-- ==========================================
-- 5. SEED DOS PLANOS PADRÃO
-- ==========================================
INSERT INTO public.plans (slug, name, description, price_cents, max_companies, max_surveys, max_respondents, max_users, features, sort_order)
VALUES
  ('starter', 'Starter', 'Pequenas empresas e consultores independentes.', 0,
    1, 1, 20, 1,
    '{"pdfReport": true, "excelExport": true, "riskMatrix": false, "sectorFilters": false, "support": false}'::jsonb, 1),
  ('profissional', 'Profissional', 'Empresas e consultorias SST em crescimento.', 0,
    10, 10, 200, 2,
    '{"pdfReport": true, "excelExport": true, "riskMatrix": true, "sectorFilters": true, "support": false}'::jsonb, 2),
  ('empresarial', 'Empresarial', 'Grandes operações, redes e consultorias.', 0,
    25, 50, 500, 5,
    '{"pdfReport": true, "excelExport": true, "riskMatrix": true, "sectorFilters": true, "support": true}'::jsonb, 3)
ON CONFLICT (slug) DO NOTHING;