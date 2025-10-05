import { supabase } from '@/integrations/supabase/client';

// PII Masking utilities
const maskCPF = (cpf: string | null): string => {
  if (!cpf) return '';
  return cpf.length >= 4 ? `***.***.${cpf.slice(-3)}-**` : '***';
};

const maskEmail = (email: string | null): string => {
  if (!email) return '';
  const atIndex = email.indexOf('@');
  if (atIndex > 1) {
    return `${email.slice(0, 2)}***@${email.split('@')[1]}`;
  }
  return '***';
};

const maskPhone = (phone: string | null): string => {
  if (!phone) return '';
  return phone.length >= 4 ? `(**) ****-${phone.slice(-4)}` : '****';
};

const maskName = (fullName: string | null): string => {
  if (!fullName) return 'Candidato';
  const parts = fullName.split(' ');
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1].charAt(0)}.`;
  }
  return parts[0] || 'Candidato';
};

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
    const jobIds = jobs.map(j => j.id);
    const { data: matches, error: matchError } = await supabase
      .from('matching_results')
      .select(`
        *,
        candidate_profiles:candidate_id (
          id,
          full_name,
          headline,
          location,
          email,
          phone,
          years_experience,
          skills,
          archetype,
          cpf
        )
      `)
      .in('job_id', jobIds)
      .gte('match_percentage', 75)
      .order('match_percentage', { ascending: false });

    if (matchError) throw matchError;
    if (!matches) return [];

    // Check consent for all unique candidates
    const candidateIds = [...new Set(matches.map(m => m.candidate_id))];
    const { data: consents } = await supabase
      .from('candidate_contact_consent')
      .select('candidate_id, company_id')
      .eq('company_id', companyId)
      .in('candidate_id', candidateIds)
      .is('revoked_at', null);

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
          const candidate = match.candidate_profiles as any;
          const application = applications?.find(
            app => app.job_id === job.id && app.candidate_id === candidate.id
          );

          // Check if company has consent to view this candidate's PII
          const hasConsent = consents?.some(
            c => c.candidate_id === candidate.id && c.company_id === companyId
          );

          return {
            candidate_id: candidate.id,
            // Apply masking based on consent
            candidate_name: hasConsent ? (candidate.full_name || 'Candidato') : maskName(candidate.full_name),
            candidate_headline: candidate.headline || '',
            candidate_location: candidate.location || '',
            candidate_email: hasConsent ? (candidate.email || '') : maskEmail(candidate.email),
            candidate_phone: hasConsent ? (candidate.phone || '') : maskPhone(candidate.phone),
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
