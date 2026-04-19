-- Tabela de planos
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  is_highlight boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  -- Limites
  max_companies integer NOT NULL DEFAULT 1,
  max_surveys integer NOT NULL DEFAULT 1,
  max_respondents integer NOT NULL DEFAULT 20,
  max_users integer NOT NULL DEFAULT 1,
  -- Recursos
  feature_pdf_report boolean NOT NULL DEFAULT false,
  feature_excel_export boolean NOT NULL DEFAULT false,
  feature_risk_matrix boolean NOT NULL DEFAULT false,
  feature_sector_filters boolean NOT NULL DEFAULT false,
  feature_priority_support boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active plans"
  ON public.plans FOR SELECT TO authenticated
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage plans"
  ON public.plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserção dos planos
INSERT INTO public.plans (slug, name, description, is_highlight, sort_order, max_companies, max_surveys, max_respondents, max_users, feature_pdf_report, feature_excel_export, feature_risk_matrix, feature_sector_filters, feature_priority_support) VALUES
  ('starter', 'Starter', 'Pequenas empresas e consultores independentes.', false, 1, 1, 1, 20, 1, true, true, false, false, false),
  ('profissional', 'Profissional', 'Empresas e consultorias SST em crescimento.', true, 2, 10, 10, 200, 2, true, true, true, true, false),
  ('empresarial', 'Empresarial', 'Grandes operações, redes e consultorias.', false, 3, 25, 50, 500, 5, true, true, true, true, true);

-- Vincular plano ao perfil (já existe coluna plan_id text — vamos usar uuid em coluna nova para FK)
ALTER TABLE public.profiles
  ADD COLUMN current_plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL;

-- Política: admins podem atualizar qualquer profile (para alterar o plano)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));