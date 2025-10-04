-- Add new fields to candidate_profiles table
ALTER TABLE public.candidate_profiles 
ADD COLUMN cpf TEXT,
ADD COLUMN gender TEXT,
ADD COLUMN languages JSONB DEFAULT '[]'::jsonb,
ADD COLUMN education JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the structure
COMMENT ON COLUMN public.candidate_profiles.languages IS 'Array of objects: [{language: string, level: string}]';
COMMENT ON COLUMN public.candidate_profiles.education IS 'Array of objects: [{degree: string, field: string, institution: string, status: string, completionYear: number}]';