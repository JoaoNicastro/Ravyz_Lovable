-- =====================================================
-- SECURITY FIX: Protect Candidate PII with Consent System
-- =====================================================

-- 1. Create candidate_contact_consent table
CREATE TABLE IF NOT EXISTS public.candidate_contact_consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL,
  company_id UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by_application BOOLEAN DEFAULT false,
  application_id UUID,
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(candidate_id, company_id)
);

-- Enable RLS on consent table
ALTER TABLE public.candidate_contact_consent ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to check consent
CREATE OR REPLACE FUNCTION public.has_contact_consent(
  _company_id UUID,
  _candidate_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.candidate_contact_consent
    WHERE company_id = _company_id
      AND candidate_id = _candidate_id
      AND revoked_at IS NULL
  );
$$;

-- 3. Create masking functions for sensitive fields
CREATE OR REPLACE FUNCTION public.mask_cpf(cpf TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN cpf IS NULL THEN NULL
    WHEN LENGTH(cpf) >= 4 THEN '***.' || RIGHT(cpf, 3) || '-**'
    ELSE '***'
  END;
$$;

CREATE OR REPLACE FUNCTION public.mask_email(email TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN email IS NULL THEN NULL
    WHEN POSITION('@' IN email) > 1 THEN 
      LEFT(email, 2) || '***@' || SPLIT_PART(email, '@', 2)
    ELSE '***'
  END;
$$;

CREATE OR REPLACE FUNCTION public.mask_phone(phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN phone IS NULL THEN NULL
    WHEN LENGTH(phone) >= 4 THEN '(**) ****-' || RIGHT(phone, 4)
    ELSE '****'
  END;
$$;

CREATE OR REPLACE FUNCTION public.mask_name(full_name TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN full_name IS NULL THEN NULL
    ELSE SPLIT_PART(full_name, ' ', 1) || ' ' || LEFT(SPLIT_PART(full_name, ' ', 2), 1) || '.'
  END;
$$;

-- 4. Create safe view for candidate profiles with automatic masking
CREATE OR REPLACE VIEW public.candidate_profiles_safe AS
SELECT 
  cp.id,
  cp.user_id,
  -- Conditionally mask sensitive fields based on company consent
  CASE 
    WHEN auth.jwt() ->> 'user_id' = cp.user_id::text THEN cp.full_name
    WHEN EXISTS (
      SELECT 1 FROM company_profiles comp
      WHERE comp.user_id = auth.uid()
        AND public.has_contact_consent(comp.id, cp.id)
    ) THEN cp.full_name
    ELSE public.mask_name(cp.full_name)
  END AS full_name,
  
  CASE 
    WHEN auth.jwt() ->> 'user_id' = cp.user_id::text THEN cp.email
    WHEN EXISTS (
      SELECT 1 FROM company_profiles comp
      WHERE comp.user_id = auth.uid()
        AND public.has_contact_consent(comp.id, cp.id)
    ) THEN cp.email
    ELSE public.mask_email(cp.email)
  END AS email,
  
  CASE 
    WHEN auth.jwt() ->> 'user_id' = cp.user_id::text THEN cp.phone
    WHEN EXISTS (
      SELECT 1 FROM company_profiles comp
      WHERE comp.user_id = auth.uid()
        AND public.has_contact_consent(comp.id, cp.id)
    ) THEN cp.phone
    ELSE public.mask_phone(cp.phone)
  END AS phone,
  
  CASE 
    WHEN auth.jwt() ->> 'user_id' = cp.user_id::text THEN cp.cpf
    WHEN EXISTS (
      SELECT 1 FROM company_profiles comp
      WHERE comp.user_id = auth.uid()
        AND public.has_contact_consent(comp.id, cp.id)
    ) THEN cp.cpf
    ELSE public.mask_cpf(cp.cpf)
  END AS cpf,
  
  -- Hide date_of_birth completely from companies, show age range instead
  CASE 
    WHEN auth.jwt() ->> 'user_id' = cp.user_id::text THEN cp.date_of_birth
    ELSE NULL
  END AS date_of_birth,
  
  CASE 
    WHEN cp.date_of_birth IS NOT NULL THEN
      CASE 
        WHEN EXTRACT(YEAR FROM age(cp.date_of_birth)) < 25 THEN '18-24'
        WHEN EXTRACT(YEAR FROM age(cp.date_of_birth)) < 35 THEN '25-34'
        WHEN EXTRACT(YEAR FROM age(cp.date_of_birth)) < 45 THEN '35-44'
        WHEN EXTRACT(YEAR FROM age(cp.date_of_birth)) < 55 THEN '45-54'
        ELSE '55+'
      END
    ELSE NULL
  END AS age_range,
  
  -- Hide exact gender, only show if it matches job requirements
  CASE 
    WHEN auth.jwt() ->> 'user_id' = cp.user_id::text THEN cp.gender
    ELSE NULL
  END AS gender,
  
  -- Non-sensitive fields (always visible)
  cp.headline,
  cp.current_position,
  cp.location,
  cp.years_experience,
  cp.avatar_url,
  cp.skills,
  cp.preferred_roles,
  cp.archetype,
  cp.career_goals,
  cp.key_achievements,
  cp.education,
  cp.languages,
  cp.preferences,
  cp.linkedin_data,
  cp.pillar_scores,
  cp.skills_vector,
  cp.validation_score,
  cp.resume_score,
  cp.created_at,
  cp.updated_at
FROM public.candidate_profiles cp;

-- 5. Add RLS policies for consent table
CREATE POLICY "Candidates can view consent for their profile"
ON public.candidate_contact_consent
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = candidate_contact_consent.candidate_id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Companies can view consent they have"
ON public.candidate_contact_consent
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM company_profiles comp
    WHERE comp.id = candidate_contact_consent.company_id
      AND comp.user_id = auth.uid()
  )
);

CREATE POLICY "Consent granted automatically on application"
ON public.candidate_contact_consent
FOR INSERT
WITH CHECK (
  granted_by_application = true
  AND EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = candidate_contact_consent.candidate_id
      AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Candidates can revoke consent"
ON public.candidate_contact_consent
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = candidate_contact_consent.candidate_id
      AND cp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM candidate_profiles cp
    WHERE cp.id = candidate_contact_consent.candidate_id
      AND cp.user_id = auth.uid()
  )
);

-- 6. Create trigger to grant consent automatically when candidate applies to a job
CREATE OR REPLACE FUNCTION public.grant_contact_consent_on_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  -- Get the company_id for the job
  SELECT company_id INTO v_company_id
  FROM jobs
  WHERE id = NEW.job_id;
  
  -- Grant consent (INSERT ON CONFLICT DO NOTHING to handle duplicates)
  INSERT INTO candidate_contact_consent (
    candidate_id,
    company_id,
    granted_by_application,
    application_id
  )
  VALUES (
    NEW.candidate_id,
    v_company_id,
    true,
    NEW.id
  )
  ON CONFLICT (candidate_id, company_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_grant_consent_on_application
AFTER INSERT ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.grant_contact_consent_on_application();

-- 7. Add comment explaining the security model
COMMENT ON VIEW public.candidate_profiles_safe IS 
'Safe view for candidate profiles that automatically masks PII (CPF, email, phone, date_of_birth, full_name) from companies unless explicit consent has been granted. Consent is automatically granted when a candidate applies to a job.';

COMMENT ON TABLE public.candidate_contact_consent IS
'Tracks which companies have permission to view candidate PII. Consent is automatically granted when candidate applies to a job and can be revoked by the candidate.';