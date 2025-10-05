-- Add new columns to company_profiles table
ALTER TABLE public.company_profiles 
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS cnpj text,
ADD COLUMN IF NOT EXISTS founded_year integer,
ADD COLUMN IF NOT EXISTS employee_count integer,
ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}'::jsonb;

-- Add comment to social_links column
COMMENT ON COLUMN public.company_profiles.social_links IS 'JSON object containing social media links (linkedin, twitter, facebook, etc.)';