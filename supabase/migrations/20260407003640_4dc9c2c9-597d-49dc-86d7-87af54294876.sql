
-- Create enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user', 'company_user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Drop CHECK constraint that blocks type change
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_company_user_check;

-- Drop trigger
DROP TRIGGER IF EXISTS trg_validate_user_role ON public.user_roles;
DROP TRIGGER IF EXISTS validate_user_role_trigger ON public.user_roles;

-- Replace validate function
CREATE OR REPLACE FUNCTION public.validate_user_role()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  RETURN NEW;
END;
$function$;

-- Drop dependent RLS policies
DROP POLICY IF EXISTS "admin_manage_google_forms_config" ON public.google_forms_config;
DROP POLICY IF EXISTS "admin_read_audit_logs" ON public.audit_logs;

-- Drop has_role
DROP FUNCTION IF EXISTS public.has_role(uuid, text);

-- Drop unique constraint that references role column
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;

-- Convert column
ALTER TABLE public.user_roles 
  ALTER COLUMN role DROP DEFAULT,
  ALTER COLUMN role TYPE public.app_role USING role::public.app_role,
  ALTER COLUMN role SET DEFAULT 'user'::public.app_role;

-- Recreate unique constraint
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Recreate CHECK constraint with enum
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_company_user_check 
  CHECK ((role::text <> 'company_user') OR (company_id IS NOT NULL));

-- Recreate has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role::public.app_role
  );
END;
$function$;

-- Recreate RLS policies
CREATE POLICY "admin_manage_google_forms_config" ON public.google_forms_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin_read_audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Recreate trigger
CREATE TRIGGER trg_validate_user_role
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_role();
