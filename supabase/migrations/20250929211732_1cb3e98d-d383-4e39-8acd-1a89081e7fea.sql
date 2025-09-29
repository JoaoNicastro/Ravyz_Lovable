-- Corrigir recursão infinita entre company_profiles e jobs

-- 1. Criar função SECURITY DEFINER para checar vagas ativas sem RLS recursivo
CREATE OR REPLACE FUNCTION public.company_has_active_jobs(_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists(
    select 1
    from public.jobs j
    where j.company_id = _company_id
      and j.status = 'active'
  );
$$;

-- 2. Atualizar política de jobs para usar função SECURITY DEFINER
DROP POLICY IF EXISTS "Companies can manage own jobs" ON public.jobs;

CREATE POLICY "Companies can manage own jobs"
ON public.jobs
FOR ALL
TO authenticated
USING (public.user_owns_company_profile(company_id))
WITH CHECK (public.user_owns_company_profile(company_id));

-- 3. Atualizar política de company_profiles para usar função SECURITY DEFINER
DROP POLICY IF EXISTS "Authenticated users can view company profiles with active jobs" ON public.company_profiles;

CREATE POLICY "Authenticated users can view company profiles with active jobs"
ON public.company_profiles
FOR SELECT
TO authenticated
USING (public.company_has_active_jobs(id));