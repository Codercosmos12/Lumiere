
-- 1. Fix user_roles policies: only superadmins can manage roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Superadmins can manage all roles
CREATE POLICY "Superadmins can manage roles"
ON public.user_roles
FOR ALL
USING (is_superadmin(auth.uid()))
WITH CHECK (is_superadmin(auth.uid()));

-- Superadmins can view all roles
CREATE POLICY "Superadmins can view all roles"
ON public.user_roles
FOR SELECT
USING (is_superadmin(auth.uid()));

-- 2. Protect superadmin rows: create a trigger to prevent modifying/deleting superadmin roles
CREATE OR REPLACE FUNCTION public.protect_superadmin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On DELETE: prevent deleting superadmin role rows
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'superadmin' THEN
      RAISE EXCEPTION 'Cannot delete superadmin role';
    END IF;
    RETURN OLD;
  END IF;

  -- On UPDATE: prevent changing superadmin role to something else
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'superadmin' AND NEW.role != 'superadmin' THEN
      RAISE EXCEPTION 'Cannot demote superadmin';
    END IF;
    -- Prevent promoting to superadmin (only direct DB access should do this)
    IF NEW.role = 'superadmin' AND OLD.role != 'superadmin' THEN
      RAISE EXCEPTION 'Cannot promote to superadmin via application';
    END IF;
  END IF;

  -- On INSERT: prevent creating new superadmin roles via application
  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'superadmin' THEN
      RAISE EXCEPTION 'Cannot create superadmin role via application';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_superadmin_role_trigger
BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.protect_superadmin_role();

-- 3. Fix products delete policy: only superadmins can delete
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Superadmins can delete products"
ON public.products
FOR DELETE
USING (is_superadmin(auth.uid()));

-- 4. Allow admins/superadmins to view all profiles for user management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin_or_superadmin(auth.uid()));
