-- Add technical skills field to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS technical_skills JSONB DEFAULT '[]'::jsonb;