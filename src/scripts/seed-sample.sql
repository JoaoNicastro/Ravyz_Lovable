-- ========================================
-- SAMPLE SQL SEED SCRIPT
-- ========================================
-- This script shows examples of how to insert sample data
-- For bulk import, use the TypeScript seed script instead

-- ========================================
-- SEED SAMPLE JOBS
-- ========================================

INSERT INTO public.jobs (
  id,
  company_id,
  title,
  description,
  requirements,
  pillar_scores,
  archetype,
  status,
  location,
  created_at
) VALUES
  (
    '83d81bff-e6bb-472c-adef-b54bf2b0e87a',
    'test-company-123',
    'Cloud Engineer 1',
    'Test job for matching validation.',
    '["AWS", "GraphQL"]'::jsonb,
    '{"Autonomia": 5, "Liderança": 3, "TrabalhoGrupo": 4, "Risco": 1, "Ambição": 4}'::jsonb,
    'Gestor',
    'active',
    'Curitiba, PR',
    '2025-09-30T01:21:05.129320Z'
  ),
  (
    'c5988ad4-7e39-40ba-9746-9d8ce68893ed',
    'test-company-123',
    'Cloud Engineer 2',
    'Test job for matching validation.',
    '[".NET", "C#", "Go", "TypeScript"]'::jsonb,
    '{"Autonomia": 1, "Liderança": 4, "TrabalhoGrupo": 3, "Risco": 5, "Ambição": 3}'::jsonb,
    'Visionário',
    'active',
    'Remote',
    '2025-09-30T01:21:05.129402Z'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  requirements = EXCLUDED.requirements,
  pillar_scores = EXCLUDED.pillar_scores,
  archetype = EXCLUDED.archetype,
  status = EXCLUDED.status,
  location = EXCLUDED.location,
  updated_at = now();

-- ========================================
-- SEED SAMPLE CANDIDATES
-- ========================================

INSERT INTO public.candidate_profiles (
  id,
  user_id,
  full_name,
  email,
  phone,
  location,
  years_experience,
  skills,
  pillar_scores,
  archetype,
  headline,
  created_at
) VALUES
  (
    '43079430-ba94-4abf-b5a4-a83a9e51cce0',
    '43079430-ba94-4abf-b5a4-a83a9e51cce0', -- Using same UUID for mock data
    'Candidate 1 Test',
    'candidate1@example.com',
    '+55 11 92679-9935',
    'São Paulo, SP',
    3,
    '["CI/CD", "Docker", "FastAPI", "GraphQL"]'::jsonb,
    '{"Compensation": 5, "Ambiente": 4, "Propósito": 1, "Crescimento": 1}'::jsonb,
    'Protagonista',
    'Backend Engineer',
    '2025-09-30T01:21:05.126270Z'
  ),
  (
    '62b1fa0d-60cd-40a6-92ca-3cd2d31ce8a6',
    '62b1fa0d-60cd-40a6-92ca-3cd2d31ce8a6',
    'Candidate 2 Test',
    'candidate2@example.com',
    '+55 11 91106-3615',
    'Recife, PE',
    7,
    '["Airflow", "CI/CD", "Docker", "Flask", "GCP", "Kafka", "Tailwind", "TypeScript"]'::jsonb,
    '{"Compensation": 4, "Ambiente": 3, "Propósito": 3, "Crescimento": 2}'::jsonb,
    'Guardião',
    'Frontend Engineer',
    '2025-09-30T01:21:05.126437Z'
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  location = EXCLUDED.location,
  years_experience = EXCLUDED.years_experience,
  skills = EXCLUDED.skills,
  pillar_scores = EXCLUDED.pillar_scores,
  archetype = EXCLUDED.archetype,
  headline = EXCLUDED.headline,
  updated_at = now();

-- ========================================
-- VERIFY DATA
-- ========================================

-- Check jobs count
SELECT COUNT(*) as total_jobs FROM public.jobs WHERE status = 'active';

-- Check candidates count
SELECT COUNT(*) as total_candidates FROM public.candidate_profiles;

-- Show sample jobs
SELECT id, title, location, status, created_at 
FROM public.jobs 
ORDER BY created_at DESC 
LIMIT 5;

-- Show sample candidates
SELECT id, full_name, headline, location, years_experience 
FROM public.candidate_profiles 
ORDER BY created_at DESC 
LIMIT 5;
