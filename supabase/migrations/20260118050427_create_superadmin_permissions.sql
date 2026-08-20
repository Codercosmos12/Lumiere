/*
  # Create Superadmin Permissions and Functions
  
  1. New Functions
    - `is_superadmin(_user_id uuid)` - Check if user has superadmin role
    - `is_admin_or_superadmin(_user_id uuid)` - Check if user has admin or superadmin role
    - `get_user_role(_user_id uuid)` - Get the highest role for a user
    - `assign_self_superadmin()` - Allow authenticated user to assign themselves as superadmin (one-time use)
  
  2. Security Updates
    - Update RLS policies on user_roles to give superadmin full access
    - Superadmin has all admin permissions plus additional privileges
    - Add policy to allow superadmin to view all user roles
    - Add policy to allow superadmin to manage all roles
  
  3. Important Notes
    - Superadmin has complete database owner access
    - Superadmin can add/manage item lists and all admin features
    - Use the `assign_self_superadmin()` function once while authenticated to grant yourself superadmin role
*/

-- Create function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$$;

-- Create function to check if user is admin or superadmin
CREATE OR REPLACE FUNCTION public.is_admin_or_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'superadmin')
  )
$$;

-- Create function to get user's highest role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'superadmin') THEN 'superadmin'
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin') THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'moderator') THEN 'moderator'
      ELSE 'user'
    END
$$;

-- Create function for user to self-assign superadmin role (use this once while logged in)
CREATE OR REPLACE FUNCTION public.assign_self_superadmin()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user
  current_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'You must be authenticated to assign superadmin role';
  END IF;
  
  -- Check if superadmin role already exists for this user
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = current_user_id AND role = 'superadmin') THEN
    RETURN 'You already have the superadmin role';
  END IF;
  
  -- Assign superadmin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'superadmin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN 'Superadmin role assigned successfully';
END;
$$;

-- Drop existing restrictive policies that don't account for superadmin
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create new policies that include superadmin
CREATE POLICY "Superadmin can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Superadmin can manage all roles"
ON public.user_roles
FOR ALL
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Admins can manage non-superadmin roles"
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin') 
  AND role != 'superadmin'
);
