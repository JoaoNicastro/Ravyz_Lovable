-- Security hardening migration
-- 1. Make avatars bucket private and add RLS policies
-- 2. Move PostgreSQL extensions to extensions schema
-- 3. Add deprecation comments to unused users table columns

-- ============================================================================
-- PART 1: Secure avatars storage bucket
-- ============================================================================

-- Make avatars bucket private
UPDATE storage.buckets 
SET public = false 
WHERE name = 'avatars';

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Companies can view consented avatars" ON storage.objects;

-- Policy 1: Users can upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 2: Users can view their own avatars
CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Companies can view candidate avatars only with consent
CREATE POLICY "Companies can view consented avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  EXISTS (
    SELECT 1 
    FROM candidate_contact_consent ccc
    JOIN candidate_profiles cp ON ccc.candidate_id = cp.id
    JOIN company_profiles comp ON ccc.company_id = comp.id
    WHERE cp.user_id::text = (storage.foldername(name))[1]
    AND comp.user_id = auth.uid()
    AND ccc.revoked_at IS NULL
  )
);

-- Policy 4: Users can update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- PART 2: Move PostgreSQL extensions to extensions schema (best practice)
-- ============================================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Note: Moving existing extensions requires superuser privileges and careful handling
-- For safety, we'll document this but not execute automatically
COMMENT ON SCHEMA extensions IS 'Schema for PostgreSQL extensions (best practice separation)';

-- ============================================================================
-- PART 3: Mark deprecated fields in users table
-- ============================================================================

-- Add deprecation comments to indicate these fields are no longer used
COMMENT ON COLUMN public.users.active_profile IS 
  'DEPRECATED: This field is no longer used. The active profile is now determined by the user_roles table using get_user_primary_role() function. This column is kept for backwards compatibility only and will be removed in a future migration.';

COMMENT ON COLUMN public.users.profiles IS 
  'DEPRECATED: This field is no longer used. User roles are now stored in the user_roles table. This column is kept for backwards compatibility only and will be removed in a future migration.';

-- ============================================================================
-- PART 4: Add security documentation comments
-- ============================================================================

COMMENT ON VIEW public.candidate_profiles_safe IS 
  'Security-hardened view of candidate_profiles that masks PII (email, phone, CPF, full name). This is the ONLY authorized access path for companies to view candidate data. Companies must use this view, not the base table. RLS policies on candidate_profiles prevent direct company access to enforce PII protection.';

COMMENT ON TABLE public.candidate_contact_consent IS
  'Tracks explicit consent from candidates for companies to access their contact information. Required for companies to view unmasked candidate data. Consent can be granted via job application (granted_by_application=true) or manually, and can be revoked by candidates at any time.';

COMMENT ON FUNCTION public.has_role IS
  'Security definer function to check user roles without triggering recursive RLS. Used in RLS policies to prevent infinite recursion. This is the proper way to check roles in policies.';
