-- Create storage bucket for resumes
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', false);

-- Create RLS policies for resume uploads
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own resumes"
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own resumes"
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'resumes' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Companies can view resumes through matches
CREATE POLICY "Companies can view candidate resumes through matches"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  EXISTS (
    SELECT 1 FROM matching_results mr
    JOIN candidate_profiles cp ON mr.candidate_id = cp.id
    JOIN jobs j ON mr.job_id = j.id
    JOIN company_profiles comp ON j.company_id = comp.id
    WHERE comp.user_id = auth.uid()
    AND cp.user_id::text = (storage.foldername(name))[1]
  )
);