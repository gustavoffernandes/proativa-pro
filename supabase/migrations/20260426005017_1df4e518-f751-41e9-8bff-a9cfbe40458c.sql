-- 1) Adiciona coluna parent_admin_id
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS parent_admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_roles_parent_admin_id
  ON public.user_roles(parent_admin_id);

-- 2) Função para obter o "dono" da conta (admin raiz da família)
CREATE OR REPLACE FUNCTION public.get_account_owner(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT parent_admin_id FROM public.user_roles WHERE user_id = _user_id AND parent_admin_id IS NOT NULL LIMIT 1),
    _user_id
  );
$$;

-- 3) Política RLS: cada usuário só vê roles da sua família
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;

CREATE POLICY "Users see own family roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR public.get_account_owner(auth.uid()) = public.get_account_owner(user_id)
  );
