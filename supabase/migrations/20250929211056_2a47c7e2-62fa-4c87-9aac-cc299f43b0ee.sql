-- Remove a política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Authenticated users can view basic company info for job listing" ON company_profiles;

-- Remove a política redundante do service_role
DROP POLICY IF EXISTS "Service role can view all company profiles" ON company_profiles;

-- Criar uma política simples e segura para visualização de perfis de empresas
-- Empresas podem ver seus próprios perfis
-- Esta política já existe, então não precisa recriar

-- Adicionar política para candidatos poderem ver perfis de empresas com vagas ativas
-- Usando uma subquery simples sem recursão
CREATE POLICY "Authenticated users can view company profiles with active jobs"
ON company_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM jobs 
    WHERE jobs.company_id = company_profiles.id 
    AND jobs.status = 'active'
  )
);