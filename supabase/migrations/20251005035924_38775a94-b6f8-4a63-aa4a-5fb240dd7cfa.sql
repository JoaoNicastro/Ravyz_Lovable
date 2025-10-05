-- Add new fields to jobs table for candidate preferences
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS gender_preference TEXT DEFAULT 'indiferente',
ADD COLUMN IF NOT EXISTS age_ranges JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS education_levels JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS preferred_institutions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS industries JSONB DEFAULT '[]'::jsonb;