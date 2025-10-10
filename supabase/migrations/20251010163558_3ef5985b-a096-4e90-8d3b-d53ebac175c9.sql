-- Fix candidate_profiles_safe security issue by adding RLS policy for company access through matches
-- This addresses the critical security vulnerability where all authenticated users could access candidate data

-- Add RLS policy to candidate_profiles table to allow companies to view candidates when there's a match
-- The candidate_profiles_safe view (with security_invoker=true) will inherit this policy
CREATE POLICY "Companies can view candidates through matches"
ON public.candidate_profiles
FOR SELECT
USING (
  -- Allow if user owns the profile (already covered by existing policy, but explicit here)
  user_id = auth.uid() 
  OR 
  -- Allow if company has a match with this candidate
  user_can_view_candidate_through_match(id)
);

-- Add comment explaining the security model
COMMENT ON POLICY "Companies can view candidates through matches" ON public.candidate_profiles IS
'Allows companies to view candidate profiles only when there is an active match in matching_results. The candidate_profiles_safe view automatically masks PII unless explicit consent exists in candidate_contact_consent table. This prevents unauthorized data scraping while enabling legitimate matching functionality.';

-- Verify RLS is enabled on candidate_profiles (should already be enabled)
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;

-- Grant SELECT on candidate_profiles to authenticated users (required for view access)
GRANT SELECT ON public.candidate_profiles TO authenticated;

-- Ensure candidate_profiles_safe view remains accessible
GRANT SELECT ON public.candidate_profiles_safe TO authenticated;