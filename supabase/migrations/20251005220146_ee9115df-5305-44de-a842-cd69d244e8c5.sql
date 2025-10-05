-- Update RLS policy on candidate_profiles to enforce consent-based PII protection

-- Drop the old overly permissive policy
DROP POLICY IF EXISTS "Companies can view candidate profiles when matching" ON public.candidate_profiles;

-- Create new restrictive policy that allows companies to see profiles only through matches
-- but the sensitive fields will be masked unless consent is granted
CREATE POLICY "Companies can view candidate profiles when matching (limited)"
ON public.candidate_profiles
FOR SELECT
USING (
  -- Candidates can always see their own profile
  user_id = auth.uid()
  OR
  -- Companies can view profiles of candidates with >= 75% match to their jobs
  user_can_view_candidate_through_match(id)
);

-- Note: The above policy allows access, but the actual PII data will be masked
-- by the application layer unless explicit consent exists in candidate_contact_consent table
-- Companies should use the candidate_profiles_safe view for automatic masking

-- Add a helpful comment
COMMENT ON POLICY "Companies can view candidate profiles when matching (limited)" ON public.candidate_profiles IS
'Allows companies to view candidate profiles only when there is a >= 75% match. Sensitive PII (CPF, email, phone, DOB, full name) should be masked by the application layer unless consent is granted in candidate_contact_consent table. Use candidate_profiles_safe view for automatic masking.';