-- Remove duplicate RLS policy on candidate_profiles table
-- Keeping "Candidates can view own profile" and removing "Only candidates can view own profile"
-- Both policies have identical logic: (user_id = auth.uid())

DROP POLICY IF EXISTS "Only candidates can view own profile" ON public.candidate_profiles;