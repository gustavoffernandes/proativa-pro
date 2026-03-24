-- Adicionar coluna company_id à tabela user_roles
ALTER TABLE public.user_roles 
ADD COLUMN company_id uuid REFERENCES public.google_forms_config(id) ON DELETE SET NULL;

-- Constraint: company_user deve ter company_id
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_company_user_check 
CHECK (role != 'company_user' OR company_id IS NOT NULL);
