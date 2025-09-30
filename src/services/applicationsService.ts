import { supabase } from '@/integrations/supabase/client';

export interface ApplicationData {
  id: string;
  job_id: string;
  applied_at: string;
  status: 'applied' | 'viewed' | 'interview_scheduled' | 'accepted' | 'rejected';
  jobs?: {
    id: string;
    title: string;
    description: string;
    location: string;
    salary_min: number;
    salary_max: number;
    requirements: any;
    created_at: string;
    company_profiles?: {
      id: string;
      company_name: string;
      description: string;
      industry: string;
    };
  };
}

/**
 * Get the candidate profile ID for the current authenticated user
 */
export async function getCurrentCandidateProfileId(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('❌ No authenticated user found');
      return null;
    }

    const { data, error } = await supabase
      .from('candidate_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('❌ Error fetching candidate profile:', error);
      throw error;
    }

    if (!data) {
      console.error('❌ No candidate profile found for user:', user.id);
      return null;
    }

    console.log('✅ Found candidate profile ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ Error in getCurrentCandidateProfileId:', error);
    return null;
  }
}

/**
 * Apply to a job
 */
export async function applyToJob(jobId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📝 Starting application process for job:', jobId);

    // Get candidate profile ID
    const candidateId = await getCurrentCandidateProfileId();
    
    if (!candidateId) {
      console.error('❌ No candidate profile found');
      return {
        success: false,
        error: 'Seu perfil de candidato ainda não está completo. Complete seu perfil primeiro.'
      };
    }

    console.log('✅ Candidate ID found:', candidateId);

    // Validate that the job exists in Supabase
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, status')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError) {
      console.error('❌ Error checking job existence:', jobError);
      throw jobError;
    }

    if (!job) {
      console.error('❌ Job not found in Supabase:', jobId);
      return {
        success: false,
        error: 'Vaga não encontrada. Esta vaga pode estar usando dados de demonstração que ainda não foram cadastrados no sistema.'
      };
    }

    if (job.status !== 'active') {
      console.error('❌ Job is not active:', job.status);
      return {
        success: false,
        error: 'Esta vaga não está mais disponível para candidaturas.'
      };
    }

    console.log('✅ Job validated:', job.title);

    // Check if already applied
    const { data: existingApplication, error: checkError } = await supabase
      .from('applications')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing application:', checkError);
      throw checkError;
    }

    if (existingApplication) {
      console.log('⚠️ Already applied to this job');
      return {
        success: false,
        error: 'Você já se candidatou a esta vaga.'
      };
    }

    // Insert application
    console.log('💾 Inserting application:', { candidate_id: candidateId, job_id: jobId });
    
    const { data, error } = await supabase
      .from('applications')
      .insert({
        candidate_id: candidateId,
        job_id: jobId,
        status: 'applied',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting application:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('✅ Successfully applied to job:', data);
    return { success: true };

  } catch (error: any) {
    console.error('❌ Error in applyToJob:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Não foi possível enviar a candidatura';
    
    if (error.code === 'PGRST116') {
      errorMessage = 'Vaga não encontrada no sistema';
    } else if (error.code === '23503') {
      errorMessage = 'Erro de validação: perfil de candidato ou vaga inválidos. Verifique se seu perfil está completo.';
    } else if (error.code === '42501') {
      errorMessage = 'Você não tem permissão para realizar esta ação. Verifique se está logado corretamente.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Get all applications for the current candidate
 */
export async function getCandidateApplications(): Promise<ApplicationData[]> {
  try {
    const candidateId = await getCurrentCandidateProfileId();
    
    if (!candidateId) {
      console.error('❌ No candidate profile ID found');
      return [];
    }

    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs (
          id,
          title,
          description,
          location,
          salary_min,
          salary_max,
          requirements,
          created_at,
          company_profiles:company_id (
            id,
            company_name,
            description,
            industry
          )
        )
      `)
      .eq('candidate_id', candidateId)
      .order('applied_at', { ascending: false });

    if (error) {
      console.error('❌ Error loading applications:', error);
      throw error;
    }

    console.log('✅ Loaded applications:', data?.length);
    return data || [];

  } catch (error) {
    console.error('❌ Error in getCandidateApplications:', error);
    return [];
  }
}
