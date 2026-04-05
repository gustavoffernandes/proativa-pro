
CREATE OR REPLACE FUNCTION public.validate_user_role()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.role NOT IN ('admin', 'user', 'company_user') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin, user, or company_user', NEW.role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_user_role
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_role();
