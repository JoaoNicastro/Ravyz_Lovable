import { supabase } from '@/integrations/supabase/client';
import { 
  CandidateCulturalResponse, 
  CandidateProfessionalResponse, 
  CandidateDreamJobResponse,
  CompanyJobResponse,
  MatchingResult
} from './schemas';

// Candidate data persistence
export async function saveCandidateCultural(candidateId: string, responses: CandidateCulturalResponse) {
  const { error } = await supabase
    .from('questionnaire_responses')
    .upsert({
      candidate_id: candidateId,
      category: 'cultural',
      responses: responses,
      calculated_score: calculateCulturalScore(responses),
    });

  if (error) throw error;
}

export async function saveCandidateProfessional(candidateId: string, responses: CandidateProfessionalResponse) {
  const { error } = await supabase
    .from('questionnaire_responses')
    .upsert({
      candidate_id: candidateId,
      category: 'professional',
      responses: responses,
      calculated_score: calculateProfessionalScore(responses),
    });

  if (error) throw error;
}

export async function saveCandidateDreamJob(candidateId: string, dreamJob: CandidateDreamJobResponse) {
  const { error } = await supabase
    .from('candidate_profiles')
    .update({
      preferences: {
        dreamJob: dreamJob,
        completionLevel: 100
      }
    })
    .eq('id', candidateId);

  if (error) throw error;
}

export async function saveCompanyJob(companyId: string, jobData: CompanyJobResponse & { description?: string; location?: string }) {
  // Map work model to database enum
  const workModelMap: Record<string, string> = {
    'Presencial': 'onsite',
    'Remoto': 'remote',
    'Híbrido': 'hybrid'
  };

  const { data, error } = await supabase
    .from('jobs')
    .insert({
      company_id: companyId,
      title: jobData.title,
      description: jobData.description || '',
      location: jobData.location || '',
      salary_min: jobData.salaryMin,
      salary_max: jobData.salaryMax,
      work_model: workModelMap[jobData.workModel] as 'remote' | 'hybrid' | 'onsite',
      requirements: {
        experienceLevel: jobData.experienceLevel,
        hardSkills: jobData.hardSkills,
        softSkillsIntensity: jobData.softSkillsIntensity,
        benefits: jobData.benefits,
        department: jobData.department,
      },
      skills_vector: {
        hardSkills: jobData.hardSkills,
        softSkills: Object.keys(jobData.softSkillsIntensity),
      },
      status: 'active'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Data retrieval functions
export async function getCandidateProfile(userId: string) {
  const { data, error } = await supabase
    .from('candidate_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getCandidateResponses(candidateId: string, category?: 'cultural' | 'professional' | 'technical') {
  let query = supabase
    .from('questionnaire_responses')
    .select('*')
    .eq('candidate_id', candidateId);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getLatestResumeAnalysis(candidateId: string) {
  const { data, error } = await supabase
    .from('resume_analyses')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data;
}

export async function getCompanyProfile(userId: string) {
  const { data, error } = await supabase
    .from('company_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getCompanyJobs(companyId: string) {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getJobMatches(jobId: string) {
  const { data, error } = await supabase
    .from('matching_results')
    .select(`
      *,
      candidate_profiles:candidate_id (
        id,
        headline,
        location,
        years_experience,
        avatar_url
      )
    `)
    .eq('job_id', jobId)
    .gte('expires_at', new Date().toISOString())
    .order('match_percentage', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getCandidateMatches(candidateId: string) {
  const { data, error } = await supabase
    .from('matching_results')
    .select(`
      *,
      jobs:job_id (
        id,
        title,
        company_id,
        salary_min,
        salary_max,
        work_model,
        location,
        company_profiles:company_id (
          company_name,
          logo_url
        )
      )
    `)
    .eq('candidate_id', candidateId)
    .gte('expires_at', new Date().toISOString())
    .order('match_percentage', { ascending: false });

  if (error) throw error;
  return data;
}

// Matching results persistence
export async function saveMatchingResult(result: Omit<MatchingResult, 'calculatedAt' | 'expiresAt'>) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const { data, error } = await supabase
    .from('matching_results')
    .upsert({
      candidate_id: result.candidateId,
      job_id: result.jobId,
      match_percentage: result.matchPercentage,
      score_breakdown: result.scoreBreakdown,
      factors_analyzed: result.factorsAnalyzed,
      explanation: result.explanation,
      is_demo_match: result.isDemoMatch,
      calculated_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getMatchingResult(candidateId: string, jobId: string) {
  const { data, error } = await supabase
    .from('matching_results')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('job_id', jobId)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// Applications
export async function createApplication(candidateId: string, jobId: string, coverLetter?: string) {
  const { data, error } = await supabase
    .from('applications')
    .insert({
      candidate_id: candidateId,
      job_id: jobId,
      cover_letter: coverLetter,
      status: 'applied'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getCandidateApplications(candidateId: string) {
  const { data, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs:job_id (
        id,
        title,
        company_id,
        salary_min,
        salary_max,
        work_model,
        location,
        company_profiles:company_id (
          company_name,
          logo_url
        )
      )
    `)
    .eq('candidate_id', candidateId)
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Score calculation helpers
function calculateCulturalScore(responses: CandidateCulturalResponse): number {
  // Simple scoring algorithm - can be enhanced
  let score = 0;
  let totalQuestions = 0;

  // Work style scores (normalize to 0-100)
  Object.values(responses.workStyle).forEach(value => {
    score += (value / 5) * 100;
    totalQuestions++;
  });

  // Culture preferences scores
  Object.values(responses.culturePreferences).forEach(value => {
    score += (value / 5) * 100;
    totalQuestions++;
  });

  // Location completeness bonus
  if (responses.location.preferredStates.length > 0) score += 100;
  if (responses.location.workModel.length > 0) score += 100;
  totalQuestions += 2;

  // Compensation completeness bonus
  if (responses.compensation.expectedMin > 0) score += 100;
  if (responses.compensation.expectedMax > 0) score += 100;
  totalQuestions += 2;

  return totalQuestions > 0 ? Math.round(score / totalQuestions) : 0;
}

function calculateProfessionalScore(responses: CandidateProfessionalResponse): number {
  const values = Object.values(responses);
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round((total / (values.length * 5)) * 100);
}

// Update validation score in candidate profile
export async function updateValidationScore(candidateId: string) {
  // Get all questionnaire responses for this candidate
  const responses = await getCandidateResponses(candidateId);
  
  let totalScore = 0;
  let scoreCount = 0;

  responses.forEach(response => {
    if (response.calculated_score) {
      totalScore += response.calculated_score;
      scoreCount++;
    }
  });

  const validationScore = scoreCount > 0 ? totalScore / scoreCount : 0;

  const { error } = await supabase
    .from('candidate_profiles')
    .update({
      validation_score: validationScore
    })
    .eq('id', candidateId);

  if (error) throw error;
  return validationScore;
}