-- Phase 1: Restrict job visibility to authenticated users only
DROP POLICY IF EXISTS "Candidates can view active jobs" ON public.jobs;

CREATE POLICY "Authenticated users can view active jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (status = 'active'::job_status);

-- Phase 2: Add database-level input validation constraints
-- Add length constraints to candidate_profiles
ALTER TABLE public.candidate_profiles
ADD CONSTRAINT candidate_profiles_full_name_length CHECK (char_length(full_name) <= 200),
ADD CONSTRAINT candidate_profiles_email_length CHECK (char_length(email) <= 255),
ADD CONSTRAINT candidate_profiles_phone_length CHECK (char_length(phone) <= 20),
ADD CONSTRAINT candidate_profiles_location_length CHECK (char_length(location) <= 500),
ADD CONSTRAINT candidate_profiles_current_position_length CHECK (char_length(current_position) <= 300),
ADD CONSTRAINT candidate_profiles_headline_length CHECK (char_length(headline) <= 500),
ADD CONSTRAINT candidate_profiles_career_goals_length CHECK (char_length(career_goals) <= 2000),
ADD CONSTRAINT candidate_profiles_key_achievements_length CHECK (char_length(key_achievements) <= 5000);

-- Add email format validation
ALTER TABLE public.candidate_profiles
ADD CONSTRAINT candidate_profiles_email_format CHECK (
  email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Add phone format validation (basic - allows various international formats)
ALTER TABLE public.candidate_profiles
ADD CONSTRAINT candidate_profiles_phone_format CHECK (
  phone IS NULL OR phone ~* '^[+]?[0-9\s\-\(\)]{7,20}$'
);

-- Add validation to company_profiles
ALTER TABLE public.company_profiles
ADD CONSTRAINT company_profiles_company_name_length CHECK (char_length(company_name) <= 300),
ADD CONSTRAINT company_profiles_location_length CHECK (char_length(location) <= 500),
ADD CONSTRAINT company_profiles_description_length CHECK (char_length(description) <= 5000),
ADD CONSTRAINT company_profiles_industry_length CHECK (char_length(industry) <= 200);

-- Add validation to jobs table
ALTER TABLE public.jobs
ADD CONSTRAINT jobs_title_length CHECK (char_length(title) <= 300),
ADD CONSTRAINT jobs_location_length CHECK (char_length(location) <= 500),
ADD CONSTRAINT jobs_description_length CHECK (char_length(description) <= 10000);

-- Add comment explaining the security improvements
COMMENT ON POLICY "Authenticated users can view active jobs" ON public.jobs IS 
'Security fix: Restricts job visibility to authenticated users only to prevent public data exposure';