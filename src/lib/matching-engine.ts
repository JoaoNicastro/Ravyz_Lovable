import { MatchingFactors, ScoreBreakdown, MATCHING_WEIGHTS, PillarBreakdown, MatchRavyzResult } from './schemas';
import { supabase } from '@/integrations/supabase/client';

// MATCH RAVYZ Data Interfaces
export interface CandidateRavyzData {
  id: string;
  pillar_scores: {
    Compensation?: number;
    Ambiente?: number;
    Propósito?: number;
    Crescimento?: number;
  };
  archetype: string;
  // Professional data for hybrid matching
  yearsExperience?: number;
  skills?: string[];
  location?: string;
  workModel?: string[];
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  resumeScore?: number;
  currentPosition?: string;
  education?: any[];
  languages?: string[];
  // Legacy fields for backward compatibility
  culturalResponses?: Record<string, any>;
  professionalResponses?: Record<string, any>;
  dreamJob?: Record<string, any>;
}

export interface JobRavyzData {
  id: string;
  pillar_scores: {
    Autonomia?: number;
    Liderança?: number;
    TrabalhoGrupo?: number;
    Risco?: number;
    Ambição?: number;
  };
  archetype: string;
  // Job requirements for hybrid matching
  title?: string;
  department?: string;
  experienceLevel?: string;
  minExperience?: number;
  requiredSkills?: string[];
  technicalSkills?: string[];
  hardSkills?: string[];
  softSkillsIntensity?: Record<string, number>;
  salaryMin?: number;
  salaryMax?: number;
  workModel?: string;
  location?: string;
  languagesRequired?: string[];
  educationRequired?: string[];
  roleType?: string;
  requirements?: Record<string, any>;
}

// Legacy interfaces for backward compatibility
export interface CandidateData {
  id: string;
  yearsExperience: number;
  skills: string[];
  location: string[];
  workModel: string[];
  expectedSalaryMin: number;
  expectedSalaryMax: number;
  resumeScore: number;
  culturalResponses: Record<string, any>;
  professionalResponses: Record<string, any>;
  dreamJob: Record<string, any>;
}

export interface JobData {
  id: string;
  title: string;
  department: string;
  experienceLevel: string;
  hardSkills: string[];
  softSkillsIntensity: Record<string, number>;
  salaryMin: number;
  salaryMax: number;
  workModel: string;
  location: string;
  requirements: Record<string, any>;
}

export class MatchingEngine {
  
  // Define standard pillar order for vectorization (using exact names from mock data)
  private readonly CANDIDATE_PILLAR_ORDER = ['Compensation', 'Ambiente', 'Propósito', 'Crescimento'];
  private readonly JOB_PILLAR_ORDER = ['Ambição', 'TrabalhoGrupo', 'Liderança', 'Autonomia', 'Risco'];

  /**
   * Convert pillar scores to normalized vector
   */
  private candidatePillarsToVector(pillars: Record<string, number>): number[] {
    return this.CANDIDATE_PILLAR_ORDER.map(pillar => pillars[pillar] || 3); // Default neutral score
  }

  private jobPillarsToVector(pillars: Record<string, number>): number[] {
    return this.JOB_PILLAR_ORDER.map(pillar => pillars[pillar] || 3); // Default neutral score
  }

  /**
   * Calculate vector magnitude (L2 norm)
   */
  private vectorMagnitude(vector: number[]): number {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  /**
   * Calculate dot product of two vectors
   */
  private dotProduct(vectorA: number[], vectorB: number[]): number {
    return vectorA.reduce((sum, val, i) => sum + val * vectorB[i], 0);
  }

  /**
   * Calculate cosine similarity between two vectors
   * Returns value between 0 and 1 (higher = more similar)
   */
  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    const dotProd = this.dotProduct(vectorA, vectorB);
    const magnitudeA = this.vectorMagnitude(vectorA);
    const magnitudeB = this.vectorMagnitude(vectorB);
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    
    return dotProd / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate compatibility matrix for multiple candidates vs multiple jobs
   */
  public calculateCompatibilityMatrix(
    candidates: CandidateRavyzData[], 
    jobs: JobRavyzData[]
  ): Array<Array<{
    candidate_id: string;
    job_id: string;
    compatibility_score: number;
    candidate_archetype: string;
    job_archetype: string;
    pillar_breakdown: PillarBreakdown;
    base_similarity: number;
    archetype_boost: number;
  }>> {
    const results: Array<Array<any>> = [];

    // Convert all candidates to vectors
    const candidateVectors = candidates.map(c => ({
      id: c.id,
      vector: this.candidatePillarsToVector(c.pillar_scores || {}),
      archetype: c.archetype,
      pillars: c.pillar_scores || {}
    }));

    // Convert all jobs to vectors  
    const jobVectors = jobs.map(j => ({
      id: j.id,
      vector: this.jobPillarsToVector(j.pillar_scores || {}),
      archetype: j.archetype,
      pillars: j.pillar_scores || {}
    }));

    // Calculate matrix: for each candidate, calculate similarity with all jobs
    candidateVectors.forEach(candidate => {
      const candidateResults: any[] = [];
      
      jobVectors.forEach(job => {
        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(candidate.vector, job.vector);
        
        // Convert similarity (0-1) to percentage (0-100)
        const baseScore = similarity * 100;
        
        // Calculate archetype boost
        const archetypeBoost = this.calculateArchetypeBoost(candidate.archetype, job.archetype);
        
        // Apply boost (never exceed 100)
        const finalScore = Math.min(100, baseScore + archetypeBoost);
        
        // Calculate detailed pillar breakdown for display
        const pillarBreakdown = this.calculatePillarBreakdown(candidate.pillars, job.pillars);
        
        candidateResults.push({
          candidate_id: candidate.id,
          job_id: job.id,
          compatibility_score: Math.round(finalScore),
          candidate_archetype: candidate.archetype,
          job_archetype: job.archetype,
          pillar_breakdown: pillarBreakdown,
          base_similarity: Math.round(baseScore),
          archetype_boost: archetypeBoost
        });
      });
      
      results.push(candidateResults);
    });

    return results;
  }

  /**
   * Calculate all matches for given candidates and jobs, return flat array sorted by score
   */
  public calculateAllMatches(
    candidates: CandidateRavyzData[], 
    jobs: JobRavyzData[]
  ): Array<{
    candidate_id: string;
    job_id: string;
    compatibility_score: number;
    candidate_archetype: string;
    job_archetype: string;
    pillar_breakdown: PillarBreakdown;
    base_similarity: number;
    archetype_boost: number;
  }> {
    const matrix = this.calculateCompatibilityMatrix(candidates, jobs);
    
    // Flatten matrix and sort by compatibility score
    return matrix
      .flat()
      .sort((a, b) => b.compatibility_score - a.compatibility_score);
  }

  /**
   * Legacy pillar breakdown calculation for detailed display
   */
  private calculatePillarBreakdown(candidatePillars: Record<string, number>, jobPillars: Record<string, number>): PillarBreakdown {
    const pillarBreakdown: PillarBreakdown = {};
    
    // Map candidate pillars to job pillars based on MATCH RAVYZ methodology
    // Using exact pillar names from mock data (case-sensitive)
    const pillarMappings = [
      { candidate: 'Compensation', job: 'Ambição', name: 'Compensação' },
      { candidate: 'Ambiente', job: 'TrabalhoGrupo', name: 'Ambiente' },
      { candidate: 'Propósito', job: 'Liderança', name: 'Propósito' },
      { candidate: 'Crescimento', job: 'Autonomia', name: 'Crescimento' },
    ];

    // Calculate compatibility for each pillar mapping
    pillarMappings.forEach(({ candidate: candidatePillar, job: jobPillar, name }) => {
      const candidateScore = candidatePillars[candidatePillar] || 0;
      const jobScore = jobPillars[jobPillar] || 0;
      
      // Calculate absolute difference (normalized 1-5 scale)
      const difference = Math.abs(candidateScore - jobScore);
      
      // Apply MATCH RAVYZ formula: Compatibility = 100% - (difference * 20)
      const compatibility = Math.max(0, 100 - (difference * 20));
      
      pillarBreakdown[name as keyof PillarBreakdown] = compatibility;
    });

    // Handle job risk pillar separately - compare against candidate growth/risk tolerance
    if (jobPillars['Risco'] !== undefined) {
      const candidateRiskTolerance = candidatePillars['Crescimento'] || 3;
      const jobRiskScore = jobPillars['Risco'] || 0;
      const difference = Math.abs(candidateRiskTolerance - jobRiskScore);
      const compatibility = Math.max(0, 100 - (difference * 20));
      
      pillarBreakdown['Risco' as keyof PillarBreakdown] = compatibility;
    }

    return pillarBreakdown;
  }

  /**
   * MATCH RAVYZ: Calculate archetype compatibility boost
   * Exact match = +10%, close match = +5%
   */
  private calculateArchetypeBoost(candidateArchetype: string, jobArchetype: string): number {
    // Exact archetype match = +10% boost
    if (candidateArchetype === jobArchetype) {
      return 10;
    }

    // Define archetype proximities for +5% boost (updated based on MATCH RAVYZ methodology)
    const archetypeProximities: Record<string, string[]> = {
      'Protagonista': ['Transformador', 'Visionário', 'Estrategista'],
      'Construtor': ['Mobilizador', 'Guardião', 'Colaborador'],
      'Visionário': ['Protagonista', 'Idealista', 'Estrategista'],
      'Mobilizador': ['Construtor', 'Colaborador', 'Explorador'],
      'Guardião': ['Construtor', 'Pragmático', 'Equilibrado'],
      'Explorador': ['Transformador', 'Estrategista', 'Mobilizador'],
      'Colaborador': ['Mobilizador', 'Idealista', 'Construtor'],
      'Equilibrado': ['Guardião', 'Pragmático', 'Construtor'],
      'Estrategista': ['Visionário', 'Protagonista', 'Explorador'],
      'Transformador': ['Protagonista', 'Explorador', 'Visionário'],
      'Idealista': ['Visionário', 'Colaborador'],
      'Pragmático': ['Guardião', 'Equilibrado'],
      'Proativo': ['Explorador', 'Transformador', 'Protagonista']
    };

    const proximities = archetypeProximities[candidateArchetype] || [];
    
    if (proximities.includes(jobArchetype)) {
      return 5;
    }

    return 0; // No compatibility boost
  }

  /**
   * MATCH RAVYZ: Generate explanation for the match
   */
  private generateRavyzExplanation(
    candidateArchetype: string,
    jobArchetype: string,
    pillarBreakdown: PillarBreakdown,
    compatibilityScore: number,
    archetypeBoost: number
  ): string {
    const explanations: string[] = [];

    // Overall assessment
    if (compatibilityScore >= 85) {
      explanations.push('Match excelente! Alta compatibilidade comportamental e de valores.');
    } else if (compatibilityScore >= 70) {
      explanations.push('Bom match! Boa compatibilidade entre perfil do candidato e necessidades da vaga.');
    } else if (compatibilityScore >= 50) {
      explanations.push('Match moderado. Algumas diferenças no perfil comportamental.');
    } else {
      explanations.push('Match baixo. Significativas diferenças comportamentais identificadas.');
    }

    // Archetype analysis
    if (archetypeBoost === 10) {
      explanations.push(`Arquétipos idênticos (${candidateArchetype}) - perfeito alinhamento de perfil.`);
    } else if (archetypeBoost === 5) {
      explanations.push(`Arquétipos compatíveis (${candidateArchetype} e ${jobArchetype}) - boa sinergia esperada.`);
    } else {
      explanations.push(`Arquétipos diferentes (${candidateArchetype} vs ${jobArchetype}) - pode requerer adaptação.`);
    }

    // Pillar analysis - highlight strongest and weakest
    const pillarEntries = Object.entries(pillarBreakdown).filter(([_, score]) => score !== undefined);
    if (pillarEntries.length > 0) {
      const sortedPillars = pillarEntries.sort(([_, a], [__, b]) => (b as number) - (a as number));
      const strongest = sortedPillars[0];
      const weakest = sortedPillars[sortedPillars.length - 1];

      if (strongest[1] as number >= 80) {
        explanations.push(`Forte alinhamento em ${strongest[0]} (${Math.round(strongest[1] as number)}%).`);
      }

      if ((weakest[1] as number) < 60) {
        explanations.push(`Maior diferença em ${weakest[0]} (${Math.round(weakest[1] as number)}%) - ponto de atenção.`);
      }
    }

    return explanations.join(' ');
  }

  /**
   * MATCH RAVYZ: Single match calculation using cosine similarity
   */
  public async calculateRavyzMatchSingle(candidate: CandidateRavyzData, job: JobRavyzData): Promise<{
    candidate_id: string;
    job_id: string;
    compatibility_score: number;
    candidate_archetype: string;
    job_archetype: string;
    pillar_breakdown: PillarBreakdown;
    base_similarity: number;
    archetype_boost: number;
    explanation: string;
  }> {
    // Convert to vectors and calculate cosine similarity
    const candidateVector = this.candidatePillarsToVector(candidate.pillar_scores || {});
    const jobVector = this.jobPillarsToVector(job.pillar_scores || {});
    
    const similarity = this.cosineSimilarity(candidateVector, jobVector);
    const baseScore = similarity * 100;
    
    // Calculate archetype boost
    const archetypeBoost = this.calculateArchetypeBoost(candidate.archetype, job.archetype);
    
    // Apply boost (never exceed 100)
    const finalScore = Math.min(100, baseScore + archetypeBoost);
    
    // Calculate detailed pillar breakdown for display
    const pillarBreakdown = this.calculatePillarBreakdown(
      candidate.pillar_scores || {},
      job.pillar_scores || {}
    );
    
    // Generate explanation
    const explanation = this.generateRavyzExplanation(
      candidate.archetype,
      job.archetype,
      pillarBreakdown,
      finalScore,
      archetypeBoost
    );

    return {
      candidate_id: candidate.id,
      job_id: job.id,
      compatibility_score: Math.round(finalScore),
      candidate_archetype: candidate.archetype,
      job_archetype: job.archetype,
      pillar_breakdown: pillarBreakdown,
      base_similarity: Math.round(baseScore),
      archetype_boost: archetypeBoost,
      explanation
    };
  }

  /**
   * MATCH RAVYZ: Main matching function (legacy compatibility)
   */
  public async calculateRavyzMatch(candidate: CandidateRavyzData, job: JobRavyzData): Promise<{
    compatibility_score: number;
    candidate_archetype: string;
    job_archetype: string;
    pilar_breakdown: PillarBreakdown;
    archetype_boost: number;
    explanation: string;
  }> {
    const result = await this.calculateRavyzMatchSingle(candidate, job);
    
    return {
      compatibility_score: result.compatibility_score,
      candidate_archetype: result.candidate_archetype,
      job_archetype: result.job_archetype,
      pilar_breakdown: result.pillar_breakdown,
      archetype_boost: result.archetype_boost,
      explanation: result.explanation
    };
  }

  /**
   * MATCH RAVYZ: Save match result to database
   */
  public async saveRavyzMatchResult(
    candidateId: string, 
    jobId: string, 
    matchResult: {
      compatibility_score: number;
      candidate_archetype: string;
      job_archetype: string;
      pilar_breakdown: PillarBreakdown;
      archetype_boost: number;
      explanation: string;
    },
    isDemoMatch: boolean = false
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const { error } = await supabase
      .from('matching_results')
      .upsert({
        candidate_id: candidateId,
        job_id: jobId,
        match_percentage: matchResult.compatibility_score,
        score_breakdown: {
          ravyz_compatibility: matchResult.compatibility_score,
          archetype_boost: matchResult.archetype_boost,
          pillar_average: Object.values(matchResult.pilar_breakdown)
            .filter(score => score !== undefined)
            .reduce((sum: number, score) => sum + Number(score), 0) / 
            Object.values(matchResult.pilar_breakdown).filter(score => score !== undefined).length || 1
        },
        factors_analyzed: {
          candidate_archetype: matchResult.candidate_archetype,
          job_archetype: matchResult.job_archetype,
          pilar_breakdown: matchResult.pilar_breakdown,
          archetype_boost: matchResult.archetype_boost
        },
        explanation: matchResult.explanation,
        is_demo_match: isDemoMatch,
        calculated_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      throw new Error(`Failed to save match result: ${error.message}`);
    }
  }

  /**
   * MATCH RAVYZ: Helper function to run complete matching workflow
   */
  public async runCompleteRavyzMatch(
    candidateId: string,
    jobId: string,
    candidateData: CandidateRavyzData,
    jobData: JobRavyzData,
    isDemoMatch: boolean = false
  ): Promise<{
    compatibility_score: number;
    candidate_archetype: string;
    job_archetype: string;
    pilar_breakdown: PillarBreakdown;
    archetype_boost: number;
    explanation: string;
  }> {
    // Calculate the match
    const matchResult = await this.calculateRavyzMatch(candidateData, jobData);
    
    // Save to database
    await this.saveRavyzMatchResult(candidateId, jobId, matchResult, isDemoMatch);
    
    return matchResult;
  }

  // === LEGACY METHODS FOR BACKWARD COMPATIBILITY ===

  /**
   * Calculate skills compatibility score
   */
  private calculateSkillsScore(candidate: CandidateData, job: JobData): { score: number; details: Record<string, number> } {
    const candidateSkills = candidate.skills.map(s => s.toLowerCase());
    const jobSkills = job.hardSkills.map(s => s.toLowerCase());
    
    let totalMatches = 0;
    const skillDetails: Record<string, number> = {};
    
    for (const jobSkill of jobSkills) {
      const match = candidateSkills.find(cs => 
        cs.includes(jobSkill) || jobSkill.includes(cs) || 
        this.calculateSkillSimilarity(cs, jobSkill) > 0.8
      );
      
      if (match) {
        totalMatches++;
        skillDetails[jobSkill] = 1;
      } else {
        skillDetails[jobSkill] = 0;
      }
    }
    
    const score = jobSkills.length > 0 ? (totalMatches / jobSkills.length) * 100 : 0;
    return { score, details: skillDetails };
  }

  /**
   * Calculate experience level compatibility
   */
  private calculateExperienceScore(candidate: CandidateData, job: JobData): { score: number; levelMatch: boolean; yearsExperience: number } {
    const experienceLevelMapping: Record<string, { min: number; max: number }> = {
      'Júnior': { min: 0, max: 3 },
      'Pleno': { min: 2, max: 6 },
      'Sênior': { min: 5, max: 10 },
      'Especialista': { min: 7, max: 15 },
      'Coordenador': { min: 5, max: 12 },
      'Gerente': { min: 8, max: 20 },
      'Diretor': { min: 10, max: 25 },
      'VP/C-Level': { min: 15, max: 30 }
    };

    const jobLevel = experienceLevelMapping[job.experienceLevel];
    if (!jobLevel) return { score: 0, levelMatch: false, yearsExperience: candidate.yearsExperience };

    const candidateYears = candidate.yearsExperience;
    const levelMatch = candidateYears >= jobLevel.min && candidateYears <= jobLevel.max;
    
    let score = 0;
    if (levelMatch) {
      score = 100;
    } else if (candidateYears < jobLevel.min) {
      // Underqualified
      const gap = jobLevel.min - candidateYears;
      score = Math.max(0, 100 - (gap * 25)); // Penalty for being underqualified
    } else {
      // Overqualified
      const gap = candidateYears - jobLevel.max;
      score = Math.max(40, 100 - (gap * 10)); // Smaller penalty for being overqualified
    }

    return { score, levelMatch, yearsExperience: candidateYears };
  }

  /**
   * Calculate location and work model compatibility
   */
  private calculateLocationScore(candidate: CandidateData, job: JobData): { score: number; workModelMatch: boolean; locationMatch: boolean } {
    let score = 0;
    let workModelMatch = false;
    let locationMatch = false;

    // Check work model compatibility
    if (candidate.workModel.includes(job.workModel) || job.workModel === 'Remoto') {
      workModelMatch = true;
      score += 60; // 60% for work model match
    }

    // Check location compatibility
    if (job.workModel === 'Remoto' || candidate.location.includes(job.location)) {
      locationMatch = true;
      score += 40; // 40% for location match
    }

    return { score, workModelMatch, locationMatch };
  }

  /**
   * Calculate salary compatibility
   */
  private calculateSalaryScore(candidate: CandidateData, job: JobData): { 
    score: number; 
    candidateExpectation: { min: number; max: number }; 
    jobOffer: { min: number; max: number }; 
    overlap: number 
  } {
    const candidateMin = candidate.expectedSalaryMin;
    const candidateMax = candidate.expectedSalaryMax;
    const jobMin = job.salaryMin;
    const jobMax = job.salaryMax;

    // Calculate overlap between candidate expectation and job offer
    const overlapMin = Math.max(candidateMin, jobMin);
    const overlapMax = Math.min(candidateMax, jobMax);
    const overlap = Math.max(0, overlapMax - overlapMin);

    const candidateRange = candidateMax - candidateMin;
    const jobRange = jobMax - jobMin;
    const avgRange = (candidateRange + jobRange) / 2;

    let score = 0;
    if (overlap > 0) {
      score = (overlap / avgRange) * 100;
      score = Math.min(100, score);
    } else {
      // No overlap - check how far apart they are
      const gap = candidateMin > jobMax ? candidateMin - jobMax : jobMin - candidateMax;
      score = Math.max(0, 100 - (gap / avgRange) * 100);
    }

    return {
      score,
      candidateExpectation: { min: candidateMin, max: candidateMax },
      jobOffer: { min: jobMin, max: jobMax },
      overlap
    };
  }

  /**
   * Calculate cultural fit score
   */
  private calculateCultureScore(candidate: CandidateData, job: JobData): { score: number; workStyleAlignment: number; valueAlignment: number } {
    // This is a simplified cultural matching - in a real implementation,
    // you would map job requirements to cultural preferences
    
    let workStyleAlignment = 70; // Default moderate alignment
    let valueAlignment = 70; // Default moderate alignment

    // Example: If the job requires high leadership and candidate scores high on leadership
    if (job.softSkillsIntensity.leadership >= 4 && candidate.professionalResponses.leadership >= 4) {
      workStyleAlignment += 15;
    }

    // Example: Communication alignment
    if (job.softSkillsIntensity.communication >= 4 && candidate.professionalResponses.communication >= 4) {
      valueAlignment += 15;
    }

    // Cap at 100
    workStyleAlignment = Math.min(100, workStyleAlignment);
    valueAlignment = Math.min(100, valueAlignment);

    const score = (workStyleAlignment + valueAlignment) / 2;
    return { score, workStyleAlignment, valueAlignment };
  }

  /**
   * Calculate resume score factor
   */
  private calculateResumeScore(candidate: CandidateData): { score: number; technicalScore: number; softSkillsScore: number; overallScore: number } {
    const overallScore = candidate.resumeScore || 0;
    
    // For demo purposes, derive technical and soft skills scores from overall
    const technicalScore = Math.min(100, overallScore * 1.1);
    const softSkillsScore = Math.min(100, overallScore * 0.9);

    return {
      score: overallScore,
      technicalScore,
      softSkillsScore,
      overallScore
    };
  }

  /**
   * Generate explanation for the match
   */
  private generateExplanation(factors: MatchingFactors, totalScore: number): string {
    const explanations: string[] = [];

    // Skills analysis
    if (factors.skills.score >= 80) {
      explanations.push(`Excelente compatibilidade de habilidades (${factors.skills.score.toFixed(0)}%)`);
    } else if (factors.skills.score >= 60) {
      explanations.push(`Boa compatibilidade de habilidades (${factors.skills.score.toFixed(0)}%)`);
    } else {
      explanations.push(`Algumas habilidades precisam ser desenvolvidas (${factors.skills.score.toFixed(0)}%)`);
    }

    // Experience analysis
    if (factors.experience.levelMatch) {
      explanations.push('Nível de experiência ideal para a vaga');
    } else if (factors.experience.score >= 70) {
      explanations.push('Experiência compatível com pequenos ajustes');
    } else {
      explanations.push('Diferença significativa no nível de experiência');
    }

    // Salary analysis
    if (factors.salary.overlap > 0) {
      explanations.push('Expectativa salarial alinhada com a oferta');
    } else {
      explanations.push('Expectativa salarial precisa ser negociada');
    }

    // Location analysis
    if (factors.location.workModelMatch && factors.location.locationMatch) {
      explanations.push('Localização e modelo de trabalho perfeitos');
    } else if (factors.location.workModelMatch) {
      explanations.push('Modelo de trabalho compatível');
    } else {
      explanations.push('Flexibilidade necessária para localização/modelo de trabalho');
    }

    // Overall assessment
    if (totalScore >= 85) {
      explanations.unshift('Match excelente! Candidato altamente compatível com a vaga.');
    } else if (totalScore >= 70) {
      explanations.unshift('Bom match! Candidato com boa compatibilidade.');
    } else if (totalScore >= 50) {
      explanations.unshift('Match moderado. Alguns ajustes podem ser necessários.');
    } else {
      explanations.unshift('Match baixo. Significativas diferenças identificadas.');
    }

    return explanations.join(' ');
  }

  /**
   * Calculate skill similarity using simple string matching
   */
  private calculateSkillSimilarity(skill1: string, skill2: string): number {
    const s1 = skill1.toLowerCase();
    const s2 = skill2.toLowerCase();
    
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    
    // Simple Jaccard similarity
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Legacy main matching function for backward compatibility
   */
  public calculateMatch(candidate: CandidateData, job: JobData): {
    matchPercentage: number;
    scoreBreakdown: ScoreBreakdown;
    factorsAnalyzed: MatchingFactors;
    explanation: string;
  } {
    // Calculate individual factor scores
    const skillsResult = this.calculateSkillsScore(candidate, job);
    const experienceResult = this.calculateExperienceScore(candidate, job);
    const locationResult = this.calculateLocationScore(candidate, job);
    const salaryResult = this.calculateSalaryScore(candidate, job);
    const cultureResult = this.calculateCultureScore(candidate, job);
    const resumeResult = this.calculateResumeScore(candidate);

    // Build factors object
    const factorsAnalyzed: MatchingFactors = {
      skills: {
        score: skillsResult.score,
        weight: MATCHING_WEIGHTS.skills,
        details: skillsResult.details,
      },
      experience: {
        score: experienceResult.score,
        weight: MATCHING_WEIGHTS.experience,
        levelMatch: experienceResult.levelMatch,
        yearsExperience: experienceResult.yearsExperience,
      },
      location: {
        score: locationResult.score,
        weight: MATCHING_WEIGHTS.location,
        workModelMatch: locationResult.workModelMatch,
        locationMatch: locationResult.locationMatch,
      },
      salary: {
        score: salaryResult.score,
        weight: MATCHING_WEIGHTS.salary,
        candidateExpectation: salaryResult.candidateExpectation,
        jobOffer: salaryResult.jobOffer,
        overlap: salaryResult.overlap,
      },
      culture: {
        score: cultureResult.score,
        weight: MATCHING_WEIGHTS.culture,
        workStyleAlignment: cultureResult.workStyleAlignment,
        valueAlignment: cultureResult.valueAlignment,
      },
      resume: {
        score: resumeResult.score,
        weight: MATCHING_WEIGHTS.resume,
        technicalScore: resumeResult.technicalScore,
        softSkillsScore: resumeResult.softSkillsScore,
        overallScore: resumeResult.overallScore,
      },
    };

    // Calculate weighted total score
    const totalScore = 
      (skillsResult.score * MATCHING_WEIGHTS.skills) +
      (experienceResult.score * MATCHING_WEIGHTS.experience) +
      (locationResult.score * MATCHING_WEIGHTS.location) +
      (salaryResult.score * MATCHING_WEIGHTS.salary) +
      (cultureResult.score * MATCHING_WEIGHTS.culture) +
      (resumeResult.score * MATCHING_WEIGHTS.resume);

    const scoreBreakdown: ScoreBreakdown = {
      skills: skillsResult.score,
      experience: experienceResult.score,
      location: locationResult.score,
      salary: salaryResult.score,
      culture: cultureResult.score,
      resume: resumeResult.score,
      total: totalScore,
    };

    const explanation = this.generateExplanation(factorsAnalyzed, totalScore);

    return {
      matchPercentage: totalScore,
      scoreBreakdown,
      factorsAnalyzed,
      explanation,
    };
  }

  // === HYBRID MATCH MODEL V2 - Technical + Behavioral ===

  /**
   * Calculate Experience & Education Score (35%)
   * Evaluates years of experience, current position, and education
   */
  private calculateHybridExperienceScore(
    candidate: CandidateRavyzData,
    job: JobRavyzData
  ): {
    score: number;
    yearsScore: number;
    positionScore: number;
    educationScore: number;
  } {
    let yearsScore = 0;
    let positionScore = 0;
    let educationScore = 0;

    // 1. Years of Experience (50% of experience score)
    const candidateYears = candidate.yearsExperience || 0;
    const jobMinYears = job.minExperience || 0;

    if (candidateYears >= jobMinYears) {
      // Meets or exceeds requirement
      const excess = candidateYears - jobMinYears;
      if (excess <= 3) {
        yearsScore = 100; // Perfect match
      } else if (excess <= 5) {
        yearsScore = 90; // Slightly overqualified
      } else {
        yearsScore = 80; // Overqualified
      }
    } else {
      // Below requirement
      const gap = jobMinYears - candidateYears;
      yearsScore = Math.max(0, 100 - (gap * 20)); // -20% per year gap
    }

    // 2. Position Match (30% of experience score)
    const currentPosition = (candidate.currentPosition || '').toLowerCase();
    const roleType = (job.roleType || job.title || '').toLowerCase();
    
    if (currentPosition && roleType) {
      // Check for keyword overlap
      const positionWords = currentPosition.split(/\s+/);
      const roleWords = roleType.split(/\s+/);
      const commonWords = positionWords.filter(word => 
        roleWords.some(roleWord => roleWord.includes(word) || word.includes(roleWord))
      );
      
      if (commonWords.length > 0) {
        positionScore = Math.min(100, 60 + (commonWords.length * 20));
      } else {
        positionScore = 40; // No direct match
      }
    } else {
      positionScore = 50; // Neutral if missing data
    }

    // 3. Education Match (20% of experience score)
    const candidateEducation = candidate.education || [];
    const jobEducationRequired = job.educationRequired || [];

    if (jobEducationRequired.length === 0) {
      educationScore = 100; // No specific requirement
    } else {
      // Check if candidate meets any required education level
      const educationLevels: Record<string, number> = {
        'Ensino Fundamental': 1,
        'Ensino Médio': 2,
        'Técnico': 3,
        'Superior': 4,
        'Pós-Graduação': 5,
        'Mestrado': 6,
        'Doutorado': 7
      };

      const candidateMaxLevel = Math.max(
        0,
        ...candidateEducation.map((edu: any) => {
          const level = edu.level || edu.degree || '';
          return educationLevels[level] || 0;
        })
      );

      const requiredMaxLevel = Math.max(
        0,
        ...jobEducationRequired.map(level => educationLevels[level] || 0)
      );

      if (candidateMaxLevel >= requiredMaxLevel) {
        educationScore = 100;
      } else if (candidateMaxLevel >= requiredMaxLevel - 1) {
        educationScore = 75; // One level below
      } else {
        educationScore = 50; // Significantly below
      }
    }

    // Weighted average
    const score = (yearsScore * 0.5) + (positionScore * 0.3) + (educationScore * 0.2);

    return {
      score: Math.round(score),
      yearsScore: Math.round(yearsScore),
      positionScore: Math.round(positionScore),
      educationScore: Math.round(educationScore)
    };
  }

  /**
   * Calculate Technical Skills Score (25%)
   * Compares candidate skills with job requirements
   */
  private calculateHybridSkillsScore(
    candidate: CandidateRavyzData,
    job: JobRavyzData
  ): {
    score: number;
    matchedSkills: string[];
    missingSkills: string[];
    matchRate: number;
  } {
    const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase().trim());
    const jobSkills = [
      ...(job.requiredSkills || []),
      ...(job.technicalSkills || []),
      ...(job.hardSkills || [])
    ].map(s => s.toLowerCase().trim());

    if (jobSkills.length === 0) {
      return {
        score: 100,
        matchedSkills: [],
        missingSkills: [],
        matchRate: 100
      };
    }

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const jobSkill of jobSkills) {
      const match = candidateSkills.find(candSkill => 
        candSkill === jobSkill ||
        candSkill.includes(jobSkill) ||
        jobSkill.includes(candSkill) ||
        this.calculateSkillSimilarity(candSkill, jobSkill) > 0.7
      );

      if (match) {
        matchedSkills.push(jobSkill);
      } else {
        missingSkills.push(jobSkill);
      }
    }

    // Calculate match rate using Jaccard similarity: |A∩B| / |B|
    const matchRate = (matchedSkills.length / jobSkills.length) * 100;
    
    // Score with slight boost for exceeding requirements
    let score = matchRate;
    if (matchRate === 100) {
      score = 100;
    } else if (matchRate >= 80) {
      score = matchRate + 5; // Small boost
    }

    return {
      score: Math.min(100, Math.round(score)),
      matchedSkills,
      missingSkills,
      matchRate: Math.round(matchRate)
    };
  }

  /**
   * Calculate adjustment factors
   */
  private calculateHybridAdjustments(
    candidate: CandidateRavyzData,
    job: JobRavyzData,
    archetypeBoost: number
  ): {
    total: number;
    archetype: number;
    location: number;
    language: number;
  } {
    let adjustments = {
      archetype: 0,
      location: 0,
      language: 0,
      total: 0
    };

    // 1. Archetype compatible: +5%
    if (archetypeBoost > 0) {
      adjustments.archetype = 5;
    }

    // 2. Location compatible: +3%
    const candidateLocation = (candidate.location || '').toLowerCase();
    const jobLocation = (job.location || '').toLowerCase();
    
    if (candidateLocation && jobLocation) {
      if (candidateLocation.includes(jobLocation) || jobLocation.includes(candidateLocation)) {
        adjustments.location = 3;
      }
    }
    
    // Remote work = automatic location match
    if (job.workModel?.toLowerCase() === 'remoto' || job.workModel?.toLowerCase() === 'remote') {
      adjustments.location = 3;
    }

    // 3. Language match: +2%
    const candidateLanguages = (candidate.languages || []).map(l => l.toLowerCase());
    const jobLanguages = (job.languagesRequired || []).map(l => l.toLowerCase());
    
    if (jobLanguages.length > 0 && candidateLanguages.length > 0) {
      const hasAllLanguages = jobLanguages.every(jl => 
        candidateLanguages.some(cl => cl.includes(jl) || jl.includes(cl))
      );
      
      if (hasAllLanguages) {
        adjustments.language = 2;
      }
    } else if (jobLanguages.length === 0) {
      // No language requirement = automatic pass
      adjustments.language = 2;
    }

    adjustments.total = adjustments.archetype + adjustments.location + adjustments.language;

    return adjustments;
  }

  /**
   * HYBRID MATCH MODEL V2
   * Combines Behavioral (40%), Experience (35%), and Technical Skills (25%)
   * Plus adjustments for archetype, location, and language
   */
  public async calculateHybridMatch(
    candidate: CandidateRavyzData,
    job: JobRavyzData
  ): Promise<{
    final_score: number;
    behavioral_score: number;
    experience_score: number;
    skills_score: number;
    adjustments: number;
    breakdown: {
      behavioral: {
        score: number;
        weight: number;
        pillar_breakdown: PillarBreakdown;
        archetype_boost: number;
        candidate_archetype: string;
        job_archetype: string;
      };
      experience: {
        score: number;
        weight: number;
        years_score: number;
        position_score: number;
        education_score: number;
      };
      skills: {
        score: number;
        weight: number;
        matched_skills: string[];
        missing_skills: string[];
        match_rate: number;
      };
      adjustments: {
        total: number;
        archetype: number;
        location: number;
        language: number;
      };
    };
    explanation: string;
  }> {
    // 1. BEHAVIORAL SCORE (40%) - Uses existing MATCH RAVYZ
    const behavioralResult = await this.calculateRavyzMatchSingle(candidate, job);
    const behavioralScore = behavioralResult.compatibility_score;
    const archetypeBoost = behavioralResult.archetype_boost;
    const pillarBreakdown = behavioralResult.pillar_breakdown;

    // 2. EXPERIENCE SCORE (35%)
    const experienceResult = this.calculateHybridExperienceScore(candidate, job);
    const experienceScore = experienceResult.score;

    // 3. SKILLS SCORE (25%)
    const skillsResult = this.calculateHybridSkillsScore(candidate, job);
    const skillsScore = skillsResult.score;

    // 4. CALCULATE BASE FINAL SCORE
    let finalScore = 
      (behavioralScore * 0.4) +
      (experienceScore * 0.35) +
      (skillsScore * 0.25);

    // 5. APPLY ADJUSTMENTS
    const adjustments = this.calculateHybridAdjustments(candidate, job, archetypeBoost);
    finalScore = Math.min(100, finalScore + adjustments.total);

    // 6. GENERATE EXPLANATION
    const explanation = this.generateHybridExplanation(
      behavioralScore,
      experienceScore,
      skillsScore,
      adjustments,
      finalScore,
      candidate.archetype,
      job.archetype
    );

    return {
      final_score: Math.round(finalScore),
      behavioral_score: Math.round(behavioralScore),
      experience_score: Math.round(experienceScore),
      skills_score: Math.round(skillsScore),
      adjustments: adjustments.total,
      breakdown: {
        behavioral: {
          score: Math.round(behavioralScore),
          weight: 0.4,
          pillar_breakdown: pillarBreakdown,
          archetype_boost: archetypeBoost,
          candidate_archetype: candidate.archetype,
          job_archetype: job.archetype
        },
        experience: {
          score: Math.round(experienceScore),
          weight: 0.35,
          years_score: experienceResult.yearsScore,
          position_score: experienceResult.positionScore,
          education_score: experienceResult.educationScore
        },
        skills: {
          score: Math.round(skillsScore),
          weight: 0.25,
          matched_skills: skillsResult.matchedSkills,
          missing_skills: skillsResult.missingSkills,
          match_rate: skillsResult.matchRate
        },
        adjustments: adjustments
      },
      explanation
    };
  }

  /**
   * Generate explanation for hybrid match
   */
  private generateHybridExplanation(
    behavioralScore: number,
    experienceScore: number,
    skillsScore: number,
    adjustments: { archetype: number; location: number; language: number },
    finalScore: number,
    candidateArchetype: string,
    jobArchetype: string
  ): string {
    const parts: string[] = [];

    // Overall assessment
    if (finalScore >= 85) {
      parts.push('Candidato altamente compatível!');
    } else if (finalScore >= 75) {
      parts.push('Boa compatibilidade geral.');
    } else if (finalScore >= 60) {
      parts.push('Compatibilidade moderada.');
    } else {
      parts.push('Compatibilidade limitada.');
    }

    // Behavioral analysis
    if (behavioralScore >= 80) {
      parts.push('Perfil comportamental excelente.');
    } else if (behavioralScore >= 70) {
      parts.push('Bom fit cultural.');
    } else {
      parts.push('Diferenças comportamentais significativas.');
    }

    // Experience analysis
    if (experienceScore >= 85) {
      parts.push('Experiência sólida e relevante.');
    } else if (experienceScore >= 70) {
      parts.push('Experiência adequada com pequenos gaps.');
    } else {
      parts.push('Experiência abaixo do esperado.');
    }

    // Skills analysis
    if (skillsScore >= 90) {
      parts.push('Skills técnicas 95%+ compatíveis.');
    } else if (skillsScore >= 75) {
      parts.push('Skills técnicas altamente compatíveis.');
    } else if (skillsScore >= 60) {
      parts.push('Skills técnicas compatíveis com treinamento.');
    } else {
      parts.push('Skills técnicas requerem desenvolvimento.');
    }

    // Adjustments
    if (adjustments.archetype > 0) {
      parts.push(`Arquétipos compatíveis (${candidateArchetype} ↔ ${jobArchetype}).`);
    }

    return parts.join(' ');
  }

  /**
   * Save hybrid match result to database
   */
  public async saveHybridMatchResult(
    candidateId: string,
    jobId: string,
    hybridResult: any,
    isDemoMatch: boolean = false
  ): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { error } = await supabase
      .from('matching_results')
      .upsert({
        candidate_id: candidateId,
        job_id: jobId,
        match_percentage: hybridResult.final_score,
        score_breakdown: {
          behavioral_score: hybridResult.behavioral_score,
          experience_score: hybridResult.experience_score,
          skills_score: hybridResult.skills_score,
          adjustments: hybridResult.adjustments,
          ...hybridResult.breakdown
        },
        factors_analyzed: {
          model: 'hybrid_v2',
          weights: {
            behavioral: 0.4,
            experience: 0.35,
            skills: 0.25
          },
          ...hybridResult.breakdown
        },
        explanation: hybridResult.explanation,
        is_demo_match: isDemoMatch,
        calculated_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      });

    if (error) {
      throw new Error(`Failed to save hybrid match result: ${error.message}`);
    }
  }
}

export const matchingEngine = new MatchingEngine();