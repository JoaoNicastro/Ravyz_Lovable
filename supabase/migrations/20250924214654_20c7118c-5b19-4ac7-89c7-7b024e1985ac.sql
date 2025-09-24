-- Phase 1: Critical Database Security Fixes

-- First, create security definer functions to break RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_candidate_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_company_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.company_profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.user_owns_candidate_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.candidate_profiles WHERE id = profile_id AND user_id = auth.uid());
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.user_owns_company_profile(profile_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(SELECT 1 FROM public.company_profiles WHERE id = profile_id AND user_id = auth.uid());
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.user_can_view_candidate_through_match(candidate_profile_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM matching_results mr
    JOIN jobs j ON mr.job_id = j.id
    JOIN company_profiles cp ON j.company_id = cp.id
    WHERE mr.candidate_id = candidate_profile_id 
    AND cp.user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Companies can view candidate profiles when matching" ON public.candidate_profiles;
DROP POLICY IF EXISTS "Candidates can view own matching results" ON public.matching_results;
DROP POLICY IF EXISTS "Companies can view matching results for their jobs" ON public.matching_results;
DROP POLICY IF EXISTS "System can insert/update matching results" ON public.matching_results;
DROP POLICY IF EXISTS "Candidates can manage own applications" ON public.applications;
DROP POLICY IF EXISTS "Companies can view applications to their jobs" ON public.applications;
DROP POLICY IF EXISTS "Companies can update application status for their jobs" ON public.applications;
DROP POLICY IF EXISTS "Candidates can manage own questionnaire responses" ON public.questionnaire_responses;
DROP POLICY IF EXISTS "Candidates can manage own resume analyses" ON public.resume_analyses;
DROP POLICY IF EXISTS "Companies can view candidate resumes when there's a match" ON public.resume_analyses;

-- Create new secure policies using security definer functions
CREATE POLICY "Companies can view candidate profiles when matching" 
ON public.candidate_profiles FOR SELECT 
USING (public.user_can_view_candidate_through_match(id));

CREATE POLICY "Candidates can view own matching results" 
ON public.matching_results FOR SELECT 
USING (public.user_owns_candidate_profile(candidate_id));

CREATE POLICY "Companies can view matching results for their jobs" 
ON public.matching_results FOR SELECT 
USING (EXISTS(
  SELECT 1 FROM jobs j 
  WHERE j.id = job_id 
  AND public.user_owns_company_profile(j.company_id)
));

-- Restrict matching results to service role only for insert/update/delete
CREATE POLICY "Service role can manage matching results" 
ON public.matching_results FOR ALL 
USING (auth.role() = 'service_role');

-- Fix applications policies
CREATE POLICY "Candidates can manage own applications" 
ON public.applications FOR ALL 
USING (public.user_owns_candidate_profile(candidate_id));

CREATE POLICY "Companies can view applications to their jobs" 
ON public.applications FOR SELECT 
USING (EXISTS(
  SELECT 1 FROM jobs j 
  WHERE j.id = job_id 
  AND public.user_owns_company_profile(j.company_id)
));

CREATE POLICY "Companies can update application status for their jobs" 
ON public.applications FOR UPDATE 
USING (EXISTS(
  SELECT 1 FROM jobs j 
  WHERE j.id = job_id 
  AND public.user_owns_company_profile(j.company_id)
));

-- Fix questionnaire responses policy
CREATE POLICY "Candidates can manage own questionnaire responses" 
ON public.questionnaire_responses FOR ALL 
USING (public.user_owns_candidate_profile(candidate_id));

-- Fix resume analyses policies
CREATE POLICY "Candidates can manage own resume analyses" 
ON public.resume_analyses FOR ALL 
USING (public.user_owns_candidate_profile(candidate_id));

CREATE POLICY "Companies can view candidate resumes when there's a match" 
ON public.resume_analyses FOR SELECT 
USING (public.user_can_view_candidate_through_match(candidate_id));

-- Make user_id columns NOT NULL (with data validation)
-- First ensure all existing records have user_id
UPDATE public.candidate_profiles SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE public.company_profiles SET user_id = auth.uid() WHERE user_id IS NULL;

-- Now make the columns NOT NULL
ALTER TABLE public.candidate_profiles ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.company_profiles ALTER COLUMN user_id SET NOT NULL;