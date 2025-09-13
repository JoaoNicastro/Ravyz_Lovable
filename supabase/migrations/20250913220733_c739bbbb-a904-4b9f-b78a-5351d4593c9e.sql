-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Create enums for better type safety
CREATE TYPE profile_type AS ENUM ('candidate', 'company');
CREATE TYPE work_model AS ENUM ('remote', 'hybrid', 'onsite');
CREATE TYPE job_status AS ENUM ('active', 'paused', 'closed');
CREATE TYPE application_status AS ENUM ('applied', 'viewed', 'rejected', 'accepted', 'interview_scheduled');
CREATE TYPE questionnaire_category AS ENUM ('cultural', 'professional', 'technical');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    oauth_provider TEXT,
    oauth_id TEXT,
    profiles profile_type[] DEFAULT '{}',
    active_profile profile_type,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT valid_active_profile CHECK (
        active_profile IS NULL OR active_profile = ANY(profiles)
    )
);

-- Create candidate profiles
CREATE TABLE public.candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    avatar_url TEXT,
    headline TEXT,
    location TEXT,
    years_experience INTEGER DEFAULT 0,
    validation_score DECIMAL(5,2) DEFAULT 0,
    resume_score DECIMAL(5,2) DEFAULT 0,
    skills_vector JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}', -- salary expectations, work model, etc.
    linkedin_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id)
);

-- Create company profiles
CREATE TABLE public.company_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    description TEXT,
    location TEXT,
    company_culture JSONB DEFAULT '{}',
    size_category TEXT, -- startup, small, medium, large, enterprise
    industry TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id)
);

-- Create jobs table
CREATE TABLE public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.company_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    requirements JSONB DEFAULT '{}', -- skills, experience, education
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    work_model work_model DEFAULT 'hybrid',
    location TEXT,
    status job_status DEFAULT 'active',
    skills_vector JSONB DEFAULT '{}',
    priority_score INTEGER DEFAULT 50, -- for job ranking
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create resume analyses with versioning
CREATE TABLE public.resume_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    file_url TEXT,
    original_filename TEXT,
    extracted_data JSONB DEFAULT '{}',
    technical_score DECIMAL(5,2) DEFAULT 0,
    soft_skills_score DECIMAL(5,2) DEFAULT 0,
    overall_score DECIMAL(5,2) DEFAULT 0,
    ai_suggestions JSONB DEFAULT '[]',
    skills_extracted JSONB DEFAULT '[]',
    experience_summary JSONB DEFAULT '{}',
    processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(candidate_id, version)
);

-- Create questionnaire responses
CREATE TABLE public.questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
    category questionnaire_category NOT NULL,
    responses JSONB NOT NULL,
    calculated_score DECIMAL(5,2) DEFAULT 0,
    completion_time_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(candidate_id, category)
);

-- Create applications
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    status application_status DEFAULT 'applied',
    cover_letter TEXT,
    applied_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(candidate_id, job_id)
);

-- Create matching results with caching
CREATE TABLE public.matching_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidate_profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    match_percentage DECIMAL(5,2) NOT NULL,
    score_breakdown JSONB NOT NULL, -- technical, cultural, salary, location scores
    explanation TEXT,
    factors_analyzed JSONB DEFAULT '{}',
    is_demo_match BOOLEAN DEFAULT false,
    calculated_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
    
    UNIQUE(candidate_id, job_id)
);

-- Create skill embeddings for vector search
CREATE TABLE public.skill_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT UNIQUE NOT NULL,
    embedding vector(384), -- Using sentence-transformers dimension
    category TEXT,
    aliases TEXT[], -- alternative names for the skill
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create audit logs for transparency
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- create, update, delete, view
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create notification preferences
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    match_notifications BOOLEAN DEFAULT true,
    application_updates BOOLEAN DEFAULT true,
    weekly_digest BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX idx_candidate_profiles_user_id ON public.candidate_profiles(user_id);
CREATE INDEX idx_company_profiles_user_id ON public.company_profiles(user_id);
CREATE INDEX idx_jobs_company_status ON public.jobs(company_id, status);
CREATE INDEX idx_jobs_location ON public.jobs(location) WHERE status = 'active';
CREATE INDEX idx_resume_analyses_candidate_version ON public.resume_analyses(candidate_id, version DESC);
CREATE INDEX idx_applications_candidate ON public.applications(candidate_id);
CREATE INDEX idx_applications_job ON public.applications(job_id);
CREATE INDEX idx_matching_results_candidate ON public.matching_results(candidate_id);
CREATE INDEX idx_matching_results_job ON public.matching_results(job_id);
CREATE INDEX idx_matching_results_expires ON public.matching_results(expires_at);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_time ON public.audit_logs(user_id, created_at DESC);

-- Create GIN indexes for JSONB fields
CREATE INDEX idx_candidate_skills_gin ON public.candidate_profiles USING gin(skills_vector);
CREATE INDEX idx_job_requirements_gin ON public.jobs USING gin(requirements);
CREATE INDEX idx_resume_skills_gin ON public.resume_analyses USING gin(skills_extracted);

-- Create vector similarity index
CREATE INDEX idx_skill_embeddings_vector ON public.skill_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);