-- ============================================
-- RBAC Implementation - Fix Privilege Escalation
-- ============================================

-- 1. Create role enum (skip if exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('candidate', 'company', 'admin');
  END IF;
END$$;

-- 2. Create user_roles table if not exists
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policy if it exists, then create
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid());

-- 4. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 5. Function to grant roles (server-side only)
CREATE OR REPLACE FUNCTION public.grant_user_role(
  _user_id UUID,
  _role app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify corresponding profile exists
  IF _role = 'candidate' THEN
    IF NOT EXISTS(SELECT 1 FROM public.candidate_profiles WHERE user_id = _user_id) THEN
      RAISE EXCEPTION 'Cannot grant candidate role: no candidate_profile exists';
    END IF;
  ELSIF _role = 'company' THEN
    IF NOT EXISTS(SELECT 1 FROM public.company_profiles WHERE user_id = _user_id) THEN
      RAISE EXCEPTION 'Cannot grant company role: no company_profile exists';
    END IF;
  END IF;
  
  INSERT INTO public.user_roles (user_id, role, granted_by)
  VALUES (_user_id, _role, auth.uid())
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 6. Function to revoke roles (server-side only)
CREATE OR REPLACE FUNCTION public.revoke_user_role(
  _user_id UUID,
  _role app_role
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_roles
  WHERE user_id = _user_id AND role = _role;
END;
$$;

-- 7. Migrate existing data from users.active_profile to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 
  CASE u.active_profile::text
    WHEN 'candidate' THEN 'candidate'::app_role
    WHEN 'company' THEN 'company'::app_role
  END
FROM public.users u
WHERE u.active_profile IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = u.id
  )
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Remove UPDATE capability for active_profile from users table
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert their profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Create restricted policies
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- 9. Create function to get user's primary role
CREATE OR REPLACE FUNCTION public.get_user_primary_role(_user_id UUID)
RETURNS app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role 
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'company' THEN 2
      WHEN 'candidate' THEN 3
    END
  LIMIT 1;
$$;

-- 10. Trigger to automatically grant role when profile is created
CREATE OR REPLACE FUNCTION public.auto_grant_role_on_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'candidate_profiles' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'candidate')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSIF TG_TABLE_NAME = 'company_profiles' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'company')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop and recreate triggers
DROP TRIGGER IF EXISTS grant_candidate_role_on_profile_creation ON public.candidate_profiles;
DROP TRIGGER IF EXISTS grant_company_role_on_profile_creation ON public.company_profiles;

CREATE TRIGGER grant_candidate_role_on_profile_creation
AFTER INSERT ON public.candidate_profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_grant_role_on_profile_creation();

CREATE TRIGGER grant_company_role_on_profile_creation
AFTER INSERT ON public.company_profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_grant_role_on_profile_creation();

-- 11. Add helpful comment
COMMENT ON TABLE public.user_roles IS 'Stores user roles for RBAC. Roles can only be granted/revoked via security definer functions to prevent privilege escalation.';