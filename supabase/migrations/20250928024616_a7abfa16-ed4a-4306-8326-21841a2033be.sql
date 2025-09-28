-- Add missing columns to candidate_profiles table
ALTER TABLE public.candidate_profiles 
ADD COLUMN IF NOT EXISTS pillar_scores JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS archetype TEXT;

-- Add columns to jobs table for company assessments  
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS pillar_scores JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS archetype TEXT;