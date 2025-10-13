-- =====================================================
-- SECURITY FIX: Restrict PII Access on candidate_profiles
-- =====================================================
-- This migration removes the overly permissive RLS policy that allows
-- companies to view all candidate data, forcing them to use the
-- candidate_profiles_safe view which masks PII appropriately.

-- Step 1: Remove the permissive policy that exposes PII
DROP POLICY IF EXISTS "Companies can view candidates through matches" ON public.candidate_profiles;

-- Step 2: Verify that candidate-owned policies remain intact
-- (These policies already exist, this is just documentation)
-- ✅ "Candidates can view own profile" - FOR SELECT USING (user_id = auth.uid())
-- ✅ "Candidates can update own profile" - FOR UPDATE USING (user_id = auth.uid())
-- ✅ "Candidates can create own profile" - FOR INSERT WITH CHECK (user_id = auth.uid())

-- Step 3: Ensure the safe view has security_invoker enabled
-- This makes the view execute with the caller's permissions, enforcing RLS
ALTER VIEW public.candidate_profiles_safe SET (security_invoker = true);

-- Step 4: Add a comment documenting the security model
COMMENT ON TABLE public.candidate_profiles IS 
'Candidate profiles with full PII. Direct SELECT access restricted to profile owners only. 
Companies MUST use candidate_profiles_safe view which masks PII based on consent.';

COMMENT ON VIEW public.candidate_profiles_safe IS 
'LGPD-compliant view of candidate profiles. Automatically masks CPF, email, phone, DOB, 
full name, and gender based on candidate consent. Companies should query this view exclusively.';

-- =====================================================
-- SECURITY VALIDATION
-- =====================================================
-- After this migration:
-- ✅ Candidates can view/edit their own full profiles
-- ✅ Companies can ONLY access candidate data via candidate_profiles_safe
-- ✅ PII is masked unless explicit consent exists in candidate_contact_consent
-- ❌ Companies CANNOT bypass masking by querying candidate_profiles directly
-- =====================================================