import { supabase } from '@/integrations/supabase/client';
import { maskCandidateData } from '@/lib/data-masking';
import { hasContactConsent } from './consentService';

export interface MatchData {
  job_id: string;
  job_title: string;
  company_name: string;
  company_id: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  requirements: any;
  benefits: string[];
  match_percentage: number;
  interview_probability: number;
  ranking: { position: number; total: number } | null;
  match_reasons: string[];
  job_stats: {
    total_candidates: number;
    days_open: number;
    interview_rate: number;
    hire_rate: number;
    competition_level: 'Baixa' | 'Moderada' | 'Alta';
  };
  created_at: string;
}

/**
 * Get candidate matches from Supabase
 * @param candidateId - ID of the candidate profile
 * @returns Array of match data with job and company details
 */
export async function getCandidateMatches(candidateId: string): Promise<MatchData[]> {
  try {
    // Fetch candidate profile to get preferred roles/interests
    const { data: candidateProfile, error: candidateError } = await supabase
      .from('candidate_profiles')
      .select('preferred_roles')
      .eq('id', candidateId)
      .single();

    if (candidateError) throw candidateError;

    // Fetch matching results with job and company data
    const { data: matches, error: matchError } = await supabase
      .from('matching_results')
      .select(`
        *,
        jobs:job_id (
          id,
          title,
          location,
          salary_min,
          salary_max,
          requirements,
          description,
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
      .gte('match_percentage', 75)
      .order('match_percentage', { ascending: false })
      .limit(20);

    if (matchError) throw matchError;
    if (!matches) return [];

    // Extract candidate's preferred roles/areas
    const candidateInterests = Array.isArray(candidateProfile?.preferred_roles) 
      ? candidateProfile.preferred_roles as string[]
      : [];
    
    // Filter matches by candidate's area of interest
    const filteredMatches = matches.filter((match: any) => {
      const job = match.jobs;
      if (!job) return false;

      // If no interests specified, show all matches >= 75%
      if (candidateInterests.length === 0) return true;

      // Check if job title or requirements match candidate interests
      const jobTitle = job.title?.toLowerCase() || '';
      const jobDescription = job.description?.toLowerCase() || '';
      const jobRequirements = JSON.stringify(job.requirements || {}).toLowerCase();

      return candidateInterests.some((interest: string) => {
        const interestLower = interest.toLowerCase();
        return jobTitle.includes(interestLower) || 
               jobDescription.includes(interestLower) ||
               jobRequirements.includes(interestLower);
      });
    }).slice(0, 5);

    // Transform data to match interface
    const matchesData: MatchData[] = await Promise.all(
      filteredMatches.map(async (match: any) => {
        const job = match.jobs;
        const company = job?.company_profiles;

        // Calculate job statistics
        const jobStats = await calculateJobStats(job.id);

        // Extract match reasons from score breakdown
        const matchReasons = extractMatchReasons(match.score_breakdown, match.match_percentage);

        // Calculate days open
        const daysOpen = Math.floor(
          (new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          job_id: job.id,
          job_title: job.title,
          company_name: company?.company_name || 'Empresa',
          company_id: company?.id || '',
          location: job.location || 'Remote',
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          requirements: job.requirements || {},
          benefits: extractBenefits(job.requirements),
          match_percentage: match.match_percentage,
          interview_probability: calculateInterviewProbability(match.match_percentage, jobStats),
          ranking: null, // TODO: Calculate ranking
          match_reasons: matchReasons,
          job_stats: {
            ...jobStats,
            days_open: daysOpen,
          },
          created_at: job.created_at,
        };
      })
    );

    return matchesData;
  } catch (error) {
    console.error('Error fetching candidate matches:', error);
    return [];
  }
}

/**
 * Calculate job statistics
 */
async function calculateJobStats(jobId: string) {
  try {
    // Get total candidates for this job
    const { data: applications, error } = await supabase
      .from('applications')
      .select('status')
      .eq('job_id', jobId);

    if (error) throw error;

    const totalCandidates = applications?.length || 0;
    // For now, use simple approximations since we don't have all status types
    const interviewed = applications?.filter((app) => 
      app.status === 'interview_scheduled'
    ).length || 0;
    const accepted = applications?.filter((app) => app.status === 'accepted').length || 0;

    const interviewRate = totalCandidates > 0 ? (interviewed / totalCandidates) * 100 : 0;
    const hireRate = totalCandidates > 0 ? (accepted / totalCandidates) * 100 : 0;

    // Determine competition level based on candidate count
    let competitionLevel: 'Baixa' | 'Moderada' | 'Alta' = 'Baixa';
    if (totalCandidates > 50) competitionLevel = 'Alta';
    else if (totalCandidates > 20) competitionLevel = 'Moderada';

    return {
      total_candidates: totalCandidates,
      interview_rate: Math.round(interviewRate),
      hire_rate: Math.round(hireRate),
      competition_level: competitionLevel,
      days_open: 0, // Will be calculated in parent function
    };
  } catch (error) {
    console.error('Error calculating job stats:', error);
    return {
      total_candidates: 0,
      interview_rate: 0,
      hire_rate: 0,
      competition_level: 'Baixa' as const,
      days_open: 0,
    };
  }
}

/**
 * Extract match reasons from score breakdown
 */
function extractMatchReasons(scoreBreakdown: any, matchPercentage: number): string[] {
  const reasons: string[] = [];

  if (!scoreBreakdown) {
    return ['Perfil compatível com a vaga'];
  }

  // Check pillar compatibility
  const pillarScores = Object.entries(scoreBreakdown);
  const highScorePillars = pillarScores
    .filter(([_, score]) => (score as number) >= 80)
    .map(([pillar]) => pillar);

  if (highScorePillars.length > 0) {
    reasons.push(`Perfil comportamental altamente compatível`);
  }

  // Check technical skills
  if (matchPercentage >= 90) {
    reasons.push('Skills técnicas 96% compatíveis');
  } else if (matchPercentage >= 80) {
    reasons.push('Skills técnicas altamente compatíveis');
  } else if (matchPercentage >= 70) {
    reasons.push('Skills técnicas compatíveis');
  }

  // Check experience
  if (scoreBreakdown.Crescimento >= 80 || scoreBreakdown.Ambiente >= 80) {
    reasons.push('Experiência relevante alinhada');
  }

  // Default reason if no specific ones
  if (reasons.length === 0) {
    reasons.push('Perfil compatível com os requisitos da vaga');
  }

  return reasons.slice(0, 3); // Return max 3 reasons
}

/**
 * Extract benefits from job requirements
 */
function extractBenefits(requirements: any): string[] {
  const benefits: string[] = [];
  
  if (!requirements) return ['Benefícios competitivos'];

  // Common benefits to look for
  const benefitKeywords = {
    'stock': 'Stock Options',
    'equity': 'Stock Options',
    'health': 'Plano de Saúde Premium',
    'healthcare': 'Plano de Saúde Premium',
    'remote': 'Home Office',
    'flexible': 'Horário Flexível',
    'vacation': 'Férias Flexíveis',
    'bonus': 'Bônus Anual',
  };

  const reqString = JSON.stringify(requirements).toLowerCase();
  
  Object.entries(benefitKeywords).forEach(([keyword, benefit]) => {
    if (reqString.includes(keyword) && !benefits.includes(benefit)) {
      benefits.push(benefit);
    }
  });

  // Add default benefits if none found
  if (benefits.length === 0) {
    benefits.push('Plano de Saúde', 'Vale Refeição', 'Home Office');
  }

  return benefits.slice(0, 4); // Return max 4 benefits
}

/**
 * Calculate interview probability based on match percentage and competition
 */
function calculateInterviewProbability(matchPercentage: number, jobStats: any): number {
  // Base probability from match percentage
  let probability = matchPercentage;

  // Adjust based on competition level
  if (jobStats.competition_level === 'Alta') {
    probability = probability * 0.7; // Reduce by 30%
  } else if (jobStats.competition_level === 'Moderada') {
    probability = probability * 0.85; // Reduce by 15%
  }

  // Adjust based on interview rate
  if (jobStats.interview_rate > 0) {
    probability = (probability + jobStats.interview_rate) / 2;
  }

  return Math.min(Math.round(probability), 99); // Cap at 99%
}

/**
 * Get company's job matches with masked candidate data
 * Candidate PII is masked unless explicit consent is given
 * This protects candidates from identity theft and spam
 */
export async function getCompanyJobMatches(
  companyId: string,
  jobId?: string
): Promise<any[]> {
  try {
    let query = supabase
      .from('matching_results')
      .select(`
        *,
        candidate_profiles (
          id,
          full_name,
          email,
          phone,
          cpf,
          date_of_birth,
          current_position,
          location,
          headline,
          avatar_url,
          skills,
          years_experience,
          archetype
        ),
        jobs!inner (
          id,
          title,
          company_id
        )
      `)
      .eq('jobs.company_id', companyId)
      .gte('match_percentage', 50)
      .order('match_percentage', { ascending: false });

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching company matches:', error);
      return [];
    }

    if (!data) return [];

    // Mask candidate data based on consent
    const maskedMatches = await Promise.all(
      data.map(async (match: any) => {
        const candidate = match.candidate_profiles;
        if (!candidate) return match;

        // Check if candidate has given consent to this company
        const consent = await hasContactConsent(
          match.candidate_id,
          companyId,
          match.job_id
        );

        return {
          ...match,
          candidate_profiles: maskCandidateData(candidate, consent),
        };
      })
    );

    return maskedMatches;
  } catch (error) {
    console.error('Error fetching company job matches:', error);
    return [];
  }
}
