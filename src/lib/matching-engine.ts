import { MatchingFactors, ScoreBreakdown, MATCHING_WEIGHTS, PillarBreakdown, MatchRavyzResult } from './schemas';
import { supabase } from '@/integrations/supabase/client';

// MATCH RAVYZ Data Interfaces
export interface CandidateRavyzData {
  id: string;
  pillar_scores: {
    compensation?: number;
    ambiente?: number;
    proposito?: number;
    crescimento?: number;
  };
  archetype: string;
  // Legacy fields for backward compatibility
  yearsExperience?: number;
  skills?: string[];
  location?: string[];
  workModel?: string[];
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  resumeScore?: number;
  culturalResponses?: Record<string, any>;
  professionalResponses?: Record<string, any>;
  dreamJob?: Record<string, any>;
}

export interface JobRavyzData {
  id: string;
  pillar_scores: {
    autonomy?: number;
    leadership?: number;
    teamwork?: number;
    risk?: number;
    ambition?: number;
  };
  archetype: string;
  // Legacy fields for backward compatibility
  title?: string;
  department?: string;
  experienceLevel?: string;
  hardSkills?: string[];
  softSkillsIntensity?: Record<string, number>;
  salaryMin?: number;
  salaryMax?: number;
  workModel?: string;
  location?: string;
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
  
  /**
   * MATCH RAVYZ: Calculate pillar compatibility between candidate and job
   */
  private calculatePillarCompatibility(candidatePillars: Record<string, number>, jobPillars: Record<string, number>): PillarBreakdown {
    const pillarBreakdown: PillarBreakdown = {};
    
    // Map candidate pillars to job pillars for comparison
    const pillarMappings = {
      compensation: 'ambition', // Candidate compensation aligns with job ambition
      ambiente: 'teamwork', // Candidate environment preference aligns with teamwork needs
      proposito: 'leadership', // Candidate purpose aligns with leadership opportunities
      crescimento: 'autonomy', // Candidate growth aligns with autonomy
    };

    // Calculate compatibility for each pillar
    Object.entries(pillarMappings).forEach(([candidatePillar, jobPillar]) => {
      const candidateScore = candidatePillars[candidatePillar] || 0;
      const jobScore = jobPillars[jobPillar] || 0;
      
      // Calculate absolute difference (normalized 1-5)
      const difference = Math.abs(candidateScore - jobScore);
      
      // Compatibility = 100% - (difference * 20)
      const compatibility = Math.max(0, 100 - (difference * 20));
      
      pillarBreakdown[candidatePillar as keyof PillarBreakdown] = compatibility;
    });

    // Also include job pillars that don't map directly
    ['risk'].forEach(jobPillar => {
      if (jobPillars[jobPillar] !== undefined) {
        // For unmapped pillars, use a neutral compatibility based on how extreme the requirement is
        const jobScore = jobPillars[jobPillar] || 0;
        const neutralScore = 3; // Middle of 1-5 scale
        const difference = Math.abs(jobScore - neutralScore);
        const compatibility = Math.max(0, 100 - (difference * 15)); // Smaller penalty for unmapped pillars
        
        pillarBreakdown[jobPillar as keyof PillarBreakdown] = compatibility;
      }
    });

    return pillarBreakdown;
  }

  /**
   * MATCH RAVYZ: Calculate archetype compatibility boost
   */
  private calculateArchetypeBoost(candidateArchetype: string, jobArchetype: string): number {
    // Exact match = +10% boost
    if (candidateArchetype === jobArchetype) {
      return 10;
    }

    // Define archetype proximities for +5% boost
    const archetypeProximities: Record<string, string[]> = {
      'Protagonista': ['Transformador', 'Facilitador'],
      'Transformador': ['Protagonista', 'Inovador'],
      'Facilitador': ['Protagonista', 'Colaborador'],
      'Inovador': ['Transformador', 'Escalador'],
      'Escalador': ['Inovador', 'Líder Estratégico'],
      'Colaborador': ['Facilitador', 'Executor'],
      'Executor': ['Colaborador'],
      'Líder Estratégico': ['Escalador', 'Protagonista'],
      'Equilibrado': ['Facilitador', 'Colaborador'], // Neutral archetype has moderate proximities
    };

    const proximities = archetypeProximities[candidateArchetype] || [];
    
    if (proximities.includes(jobArchetype)) {
      return 5;
    }

    return 0;
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
   * MATCH RAVYZ: Main matching function
   */
  public async calculateRavyzMatch(candidate: CandidateRavyzData, job: JobRavyzData): Promise<{
    compatibility_score: number;
    candidate_archetype: string;
    job_archetype: string;
    pilar_breakdown: PillarBreakdown;
    archetype_boost: number;
    explanation: string;
  }> {
    // Calculate pillar compatibility
    const pillarBreakdown = this.calculatePillarCompatibility(
      candidate.pillar_scores || {},
      job.pillar_scores || {}
    );

    // Calculate base compatibility score (average of pillar compatibilities)
    const pillarScores = Object.values(pillarBreakdown).filter(score => score !== undefined) as number[];
    const baseScore = pillarScores.length > 0 
      ? pillarScores.reduce((sum, score) => sum + score, 0) / pillarScores.length 
      : 50; // Default neutral score if no pillars

    // Calculate archetype boost
    const archetypeBoost = this.calculateArchetypeBoost(candidate.archetype, job.archetype);

    // Apply archetype boost to final score
    const finalScore = Math.min(100, baseScore + archetypeBoost);

    // Generate explanation
    const explanation = this.generateRavyzExplanation(
      candidate.archetype,
      job.archetype,
      pillarBreakdown,
      finalScore,
      archetypeBoost
    );

    return {
      compatibility_score: Math.round(finalScore),
      candidate_archetype: candidate.archetype,
      job_archetype: job.archetype,
      pilar_breakdown: pillarBreakdown,
      archetype_boost: archetypeBoost,
      explanation
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
      matchPercentage: Math.round(totalScore),
      scoreBreakdown,
      factorsAnalyzed,
      explanation,
    };
  }
}

export const matchingEngine = new MatchingEngine();