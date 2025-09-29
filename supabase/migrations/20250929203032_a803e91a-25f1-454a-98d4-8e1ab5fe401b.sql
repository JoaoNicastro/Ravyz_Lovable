-- Add personal information columns to candidate_profiles
ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add professional information columns to candidate_profiles
ALTER TABLE candidate_profiles 
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS current_position TEXT,
ADD COLUMN IF NOT EXISTS key_achievements TEXT,
ADD COLUMN IF NOT EXISTS preferred_roles JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS career_goals TEXT;

-- Add comments for documentation
COMMENT ON COLUMN candidate_profiles.full_name IS 'Full name of the candidate';
COMMENT ON COLUMN candidate_profiles.date_of_birth IS 'Date of birth';
COMMENT ON COLUMN candidate_profiles.email IS 'Contact email';
COMMENT ON COLUMN candidate_profiles.phone IS 'Contact phone number';
COMMENT ON COLUMN candidate_profiles.skills IS 'Array of candidate skills';
COMMENT ON COLUMN candidate_profiles.current_position IS 'Current job position';
COMMENT ON COLUMN candidate_profiles.key_achievements IS 'Key professional achievements';
COMMENT ON COLUMN candidate_profiles.preferred_roles IS 'Array of preferred job roles';
COMMENT ON COLUMN candidate_profiles.career_goals IS 'Career goals and aspirations';