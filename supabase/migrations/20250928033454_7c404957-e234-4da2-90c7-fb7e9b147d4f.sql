-- Create match_feedback table
CREATE TABLE public.match_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
  feedback TEXT NOT NULL CHECK (feedback IN ('interested', 'not_interested', 'advance', 'reject')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add feedback_status column to matching_results
ALTER TABLE public.matching_results 
ADD COLUMN feedback_status TEXT DEFAULT NULL;

-- Enable RLS on match_feedback
ALTER TABLE public.match_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for match_feedback
CREATE POLICY "Candidates can view own feedback"
ON public.match_feedback
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.candidate_profiles cp 
  WHERE cp.id = match_feedback.candidate_id 
  AND cp.user_id = auth.uid()
));

CREATE POLICY "Companies can view feedback for their jobs"
ON public.match_feedback
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.company_profiles cp 
  WHERE cp.id = match_feedback.company_id 
  AND cp.user_id = auth.uid()
));

CREATE POLICY "Candidates can insert own feedback"
ON public.match_feedback
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.candidate_profiles cp 
  WHERE cp.id = match_feedback.candidate_id 
  AND cp.user_id = auth.uid()
));

CREATE POLICY "Companies can insert feedback for their jobs"
ON public.match_feedback
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.company_profiles cp 
  WHERE cp.id = match_feedback.company_id 
  AND cp.user_id = auth.uid()
));

-- Enable realtime for match_feedback and matching_results
ALTER TABLE public.match_feedback REPLICA IDENTITY FULL;
ALTER TABLE public.matching_results REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_feedback;
ALTER PUBLICATION supabase_realtime ADD TABLE public.matching_results;