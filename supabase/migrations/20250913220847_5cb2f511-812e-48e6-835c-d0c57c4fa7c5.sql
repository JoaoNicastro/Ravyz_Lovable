-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matching_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_profiles(user_uuid UUID)
RETURNS profile_type[] AS $$
  SELECT profiles FROM public.users WHERE id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert their profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Candidate profiles policies
CREATE POLICY "Candidates can view own profile" ON public.candidate_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Candidates can update own profile" ON public.candidate_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Candidates can create own profile" ON public.candidate_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Companies can view candidate profiles when matching" ON public.candidate_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matching_results mr
      JOIN public.jobs j ON mr.job_id = j.id
      JOIN public.company_profiles cp ON j.company_id = cp.id
      WHERE mr.candidate_id = candidate_profiles.id 
      AND cp.user_id = auth.uid()
    )
  );

-- Company profiles policies
CREATE POLICY "Companies can view own profile" ON public.company_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Companies can update own profile" ON public.company_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Companies can create own profile" ON public.company_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Anyone can view company profiles for public listings" ON public.company_profiles
  FOR SELECT USING (true);

-- Jobs table policies
CREATE POLICY "Companies can manage own jobs" ON public.jobs
  FOR ALL USING (
    company_id IN (
      SELECT id FROM public.company_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Candidates can view active jobs" ON public.jobs
  FOR SELECT USING (status = 'active');

-- Resume analyses policies
CREATE POLICY "Candidates can manage own resume analyses" ON public.resume_analyses
  FOR ALL USING (
    candidate_id IN (
      SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can view candidate resumes when there's a match" ON public.resume_analyses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.matching_results mr
      JOIN public.jobs j ON mr.job_id = j.id
      JOIN public.company_profiles cp ON j.company_id = cp.id
      WHERE mr.candidate_id = resume_analyses.candidate_id 
      AND cp.user_id = auth.uid()
    )
  );

-- Questionnaire responses policies
CREATE POLICY "Candidates can manage own questionnaire responses" ON public.questionnaire_responses
  FOR ALL USING (
    candidate_id IN (
      SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()
    )
  );

-- Applications policies
CREATE POLICY "Candidates can manage own applications" ON public.applications
  FOR ALL USING (
    candidate_id IN (
      SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can view applications to their jobs" ON public.applications
  FOR SELECT USING (
    job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.company_profiles cp ON j.company_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can update application status for their jobs" ON public.applications
  FOR UPDATE USING (
    job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.company_profiles cp ON j.company_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

-- Matching results policies
CREATE POLICY "Candidates can view own matching results" ON public.matching_results
  FOR SELECT USING (
    candidate_id IN (
      SELECT id FROM public.candidate_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Companies can view matching results for their jobs" ON public.matching_results
  FOR SELECT USING (
    job_id IN (
      SELECT j.id FROM public.jobs j
      JOIN public.company_profiles cp ON j.company_id = cp.id
      WHERE cp.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert/update matching results" ON public.matching_results
  FOR ALL USING (true);

-- Skill embeddings policies (public read-only for matching system)
CREATE POLICY "Anyone can view skill embeddings" ON public.skill_embeddings
  FOR SELECT USING (true);

CREATE POLICY "System can manage skill embeddings" ON public.skill_embeddings
  FOR ALL USING (auth.role() = 'service_role');

-- Audit logs policies
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
  FOR ALL USING (user_id = auth.uid());

-- Create trigger functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_candidate_profiles_updated_at 
  BEFORE UPDATE ON public.candidate_profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_profiles_updated_at 
  BEFORE UPDATE ON public.company_profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
  BEFORE UPDATE ON public.jobs 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at 
  BEFORE UPDATE ON public.applications 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
  BEFORE UPDATE ON public.notification_preferences 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();