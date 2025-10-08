-- Drop and recreate candidate_profiles_safe view as SECURITY INVOKER
-- This fixes the security definer view issue

DROP VIEW IF EXISTS candidate_profiles_safe;

CREATE VIEW candidate_profiles_safe
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  -- Mask full_name unless user owns profile or company has consent
  CASE
    WHEN auth.uid() = user_id THEN full_name
    WHEN EXISTS (
      SELECT 1 FROM company_profiles comp
      WHERE comp.user_id = auth.uid() 
      AND has_contact_consent(comp.id, cp.id)
    ) THEN full_name
    ELSE mask_name(full_name)
  END AS full_name,
  -- Mask email unless user owns profile or company has consent
  CASE
    WHEN auth.uid() = user_id THEN email
    WHEN EXISTS (
      SELECT 1 FROM company_profiles comp
      WHERE comp.user_id = auth.uid() 
      AND has_contact_consent(comp.id, cp.id)
    ) THEN email
    ELSE mask_email(email)
  END AS email,
  -- Mask phone unless user owns profile or company has consent
  CASE
    WHEN auth.uid() = user_id THEN phone
    WHEN EXISTS (
      SELECT 1 FROM company_profiles comp
      WHERE comp.user_id = auth.uid() 
      AND has_contact_consent(comp.id, cp.id)
    ) THEN phone
    ELSE mask_phone(phone)
  END AS phone,
  -- Mask CPF unless user owns profile or company has consent
  CASE
    WHEN auth.uid() = user_id THEN cpf
    WHEN EXISTS (
      SELECT 1 FROM company_profiles comp
      WHERE comp.user_id = auth.uid() 
      AND has_contact_consent(comp.id, cp.id)
    ) THEN cpf
    ELSE mask_cpf(cpf)
  END AS cpf,
  -- Hide exact date of birth unless user owns profile
  CASE
    WHEN auth.uid() = user_id THEN date_of_birth
    ELSE NULL
  END AS date_of_birth,
  -- Show age range to everyone
  CASE
    WHEN date_of_birth IS NOT NULL THEN
      CASE
        WHEN EXTRACT(year FROM age(date_of_birth)) < 25 THEN '18-24'
        WHEN EXTRACT(year FROM age(date_of_birth)) < 35 THEN '25-34'
        WHEN EXTRACT(year FROM age(date_of_birth)) < 45 THEN '35-44'
        WHEN EXTRACT(year FROM age(date_of_birth)) < 55 THEN '45-54'
        ELSE '55+'
      END
    ELSE NULL
  END AS age_range,
  -- Hide gender unless user owns profile
  CASE
    WHEN auth.uid() = user_id THEN gender
    ELSE NULL
  END AS gender,
  headline,
  current_position,
  location,
  years_experience,
  avatar_url,
  skills,
  preferred_roles,
  archetype,
  career_goals,
  key_achievements,
  education,
  languages,
  preferences,
  linkedin_data,
  pillar_scores,
  skills_vector,
  validation_score,
  resume_score,
  created_at,
  updated_at
FROM candidate_profiles cp;

-- Enable RLS on the view
ALTER VIEW candidate_profiles_safe SET (security_invoker = true);

-- Grant access to authenticated users
GRANT SELECT ON candidate_profiles_safe TO authenticated;