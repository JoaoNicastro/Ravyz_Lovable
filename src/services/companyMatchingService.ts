import { supabase } from '@/integrations/supabase/client';

// Note: PII masking is now handled by the candidate_profiles_safe database view
// which automatically masks CPF, email, phone, DOB, and gender based on consent

export interface CompanyMatchData {
  candidate_id: string;
  candidate_name: string;
  candidate_headline: string;
  candidate_location: string;
  candidate_email: string;
  candidate_phone: string;
  years_experience: number;
  skills: string[];
  archetype: string;
  match_percentage: number;
  pillar_breakdown: Record<string, number>;
  application_status?: 'applied' | 'viewed' | 'interview_scheduled' | 'accepted' | 'rejected';
}

export interface JobMatchSummary {
  job_id: string;
  job_title: string;
  job_location: string;
  job_archetype: string;
  matches: CompanyMatchData[];
}

/**
 * Get all matches for company jobs
 * @param companyId - ID of the company profile
 * @returns Array of job matches with candidate details
 */
export async function getCompanyJobMatches(companyId: string): Promise<JobMatchSummary[]> {
  try {
    // Fetch company jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, location, archetype, pillar_scores')
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (jobsError) throw jobsError;
    if (!jobs || jobs.length === 0) return [];

    // Fetch matching results for all jobs
    // Use candidate_profiles_safe view for automatic LGPD-compliant PII masking
    const jobIds = jobs.map(j => j.id);
    const { data: matches, error: matchError } = await supabase
      .from('matching_results')
      .select(`
        *,
        candidate_profiles_safe:candidate_id (
          id,
          full_name,
          headline,
          location,
          email,
          phone,
          years_experience,
          skills,
          archetype
        )
      `)
      .in('job_id', jobIds)
      .gte('match_percentage', 75)
      .order('match_percentage', { ascending: false });

    if (matchError) throw matchError;
    if (!matches) return [];

    // Fetch applications separately to avoid foreign key issues
    const { data: applications } = await supabase
      .from('applications')
      .select('job_id, candidate_id, status')
      .in('job_id', jobIds);

    // Group matches by job
    const jobMatches: JobMatchSummary[] = jobs.map(job => {
      const jobMatchesData = matches
        .filter(m => m.job_id === job.id)
        .map(match => {
          // PII is automatically masked by candidate_profiles_safe view based on consent
          const candidate = match.candidate_profiles_safe as any;
          const application = applications?.find(
            app => app.job_id === job.id && app.candidate_id === candidate.id
          );

          return {
            candidate_id: candidate.id,
            candidate_name: candidate.full_name || 'Candidato',
            candidate_headline: candidate.headline || '',
            candidate_location: candidate.location || '',
            candidate_email: candidate.email || '',
            candidate_phone: candidate.phone || '',
            years_experience: candidate.years_experience || 0,
            skills: Array.isArray(candidate.skills) ? candidate.skills : [],
            archetype: candidate.archetype || '',
            match_percentage: match.match_percentage,
            pillar_breakdown: (match.score_breakdown && typeof match.score_breakdown === 'object' && !Array.isArray(match.score_breakdown))
              ? match.score_breakdown as Record<string, number>
              : {},
            application_status: application?.status,
          };
        });

      return {
        job_id: job.id,
        job_title: job.title,
        job_location: job.location || '',
        job_archetype: job.archetype || '',
        matches: jobMatchesData,
      };
    });

    return jobMatches;
  } catch (error) {
    console.error('Error fetching company job matches:', error);
    return [];
  }
}

/**
 * Get company statistics
 */
export async function getCompanyStats(companyId: string) {
  try {
    // Get total active jobs
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id')
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (jobsError) throw jobsError;

    // Get total matches >= 75%
    const jobIds = jobs?.map(j => j.id) || [];
    const { data: matches, error: matchError } = await supabase
      .from('matching_results')
      .select('id')
      .in('job_id', jobIds)
      .gte('match_percentage', 75);

    if (matchError) throw matchError;

    // Get top match score
    const { data: topMatch } = await supabase
      .from('matching_results')
      .select('match_percentage')
      .in('job_id', jobIds)
      .order('match_percentage', { ascending: false })
      .limit(1)
      .single();

    return {
      activeJobs: jobs?.length || 0,
      totalMatches: matches?.length || 0,
      topMatchScore: topMatch?.match_percentage || 0,
    };
  } catch (error) {
    console.error('Error fetching company stats:', error);
    return {
      activeJobs: 0,
      totalMatches: 0,
      topMatchScore: 0,
    };
  }
}
