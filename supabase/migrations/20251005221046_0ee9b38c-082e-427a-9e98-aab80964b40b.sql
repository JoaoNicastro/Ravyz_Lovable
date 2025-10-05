-- Fix PII exposure by restricting candidate_profiles access and using candidate_profiles_safe view

-- 1. Drop the old policy that allows companies direct access to candidate_profiles
DROP POLICY IF EXISTS "Companies can view candidate profiles when matching (limited)" ON public.candidate_profiles;

-- 2. Create restrictive policy on candidate_profiles - only candidates see their own data
CREATE POLICY "Only candidates can view own profile"
ON public.candidate_profiles
FOR SELECT
USING (user_id = auth.uid());

-- 3. Grant SELECT on candidate_profiles_safe view to authenticated users
-- The view has built-in masking logic based on consent
GRANT SELECT ON public.candidate_profiles_safe TO authenticated;

-- 4. Add helpful comments
COMMENT ON TABLE public.candidate_profiles IS
'Contains raw candidate PII. Direct access restricted to profile owners only. Companies MUST use candidate_profiles_safe view which automatically masks PII based on consent in candidate_contact_consent table.';

COMMENT ON VIEW public.candidate_profiles_safe IS
'LGPD-compliant view that automatically masks candidate PII (CPF, email, phone, DOB, gender) unless: 1) User views own profile, or 2) Company has explicit consent in candidate_contact_consent table. Always use this view instead of candidate_profiles when displaying candidate data to companies.';

COMMENT ON POLICY "Only candidates can view own profile" ON public.candidate_profiles IS
'Restricts direct access to raw PII. Companies must query candidate_profiles_safe view for automatic LGPD-compliant masking.';