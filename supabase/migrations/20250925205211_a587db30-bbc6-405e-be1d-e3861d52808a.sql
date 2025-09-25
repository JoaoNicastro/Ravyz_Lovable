-- Remove overly permissive public policy on company_profiles
DROP POLICY IF EXISTS "Anyone can view company profiles for public listings" ON public.company_profiles;

-- Create restricted policy for authenticated users to view basic company info for job listings only
-- This allows viewing only company_name, logo_url, and location for active job listings
CREATE POLICY "Authenticated users can view basic company info for job listings" 
ON public.company_profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.company_id = company_profiles.id 
    AND jobs.status = 'active'
  )
);

-- Create policy for service role to access all company profiles (for system operations)
CREATE POLICY "Service role can view all company profiles" 
ON public.company_profiles 
FOR SELECT 
USING (auth.role() = 'service_role');