import { z } from 'zod';

// Base question schemas
export const QuestionOptionSchema = z.object({
  text: z.string().optional(),
  value: z.union([z.string(), z.number()]),
  weight: z.number().optional(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'number', 'select', 'multiselect', 'boolean', 'scale', 'likert', 'slider', 'ranking']),
  question: z.string(),
  description: z.string().optional(),
  required: z.boolean(),
  options: z.array(z.union([z.string(), QuestionOptionSchema])).optional(),
  validation: z.object({
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
  }).optional(),
  scale: z.object({
    min: z.number(),
    max: z.number(),
    labels: z.array(z.string()),
  }).optional(),
  skills: z.array(z.object({
    id: z.string(),
    label: z.string(),
    min: z.number(),
    max: z.number(),
    default: z.number(),
  })).optional(),
  maxSelections: z.number().optional(),
  matchingWeight: z.number(),
  dimension: z.string().optional(),
  category: z.string().optional(),
});

// Response schemas by category
export const CandidateCulturalResponseSchema = z.object({
  workStyle: z.object({
    workPace: z.number(),
    decisionMaking: z.number(),
    communicationStyle: z.number(),
    learningStyle: z.number(),
  }),
  culturePreferences: z.object({
    companyValues: z.number(),
    workLifeBalance: z.number(),
  }),
  location: z.object({
    preferredStates: z.array(z.string()),
    workModel: z.array(z.string()),
    willingToRelocate: z.boolean(),
  }),
  compensation: z.object({
    expectedMin: z.number(),
    expectedMax: z.number(),
    benefitsPriority: z.array(z.string()),
  }),
});

export const CandidateProfessionalResponseSchema = z.object({
  leadership: z.number().min(1).max(5),
  communication: z.number().min(1).max(5),
  teamwork: z.number().min(1).max(5),
  adaptability: z.number().min(1).max(5),
  resultsOriented: z.number().min(1).max(5),
  creativity: z.number().min(1).max(5),
  analytical: z.number().min(1).max(5),
  pressureHandling: z.number().min(1).max(5),
});

export const CandidateDreamJobResponseSchema = z.object({
  position: z.string().min(2).max(100),
  positionLevel: z.enum(['Júnior', 'Pleno', 'Sênior', 'Especialista', 'Coordenador', 'Gerente', 'Diretor', 'VP/C-Level']),
  industry: z.array(z.string()).max(3),
  salaryMin: z.number().min(1000).max(100000),
  salaryMax: z.number().min(1000).max(200000),
  workModel: z.array(z.enum(['Presencial', 'Remoto', 'Híbrido'])),
});

export const CompanyJobResponseSchema = z.object({
  title: z.string(),
  department: z.string(),
  experienceLevel: z.enum(['Júnior', 'Pleno', 'Sênior', 'Especialista', 'Coordenador', 'Gerente', 'Diretor', 'VP/C-Level']),
  hardSkills: z.array(z.string()).max(8),
  softSkillsIntensity: z.object({
    leadership: z.number().min(1).max(5),
    communication: z.number().min(1).max(5),
    problemSolving: z.number().min(1).max(5),
    creativity: z.number().min(1).max(5),
    teamwork: z.number().min(1).max(5),
    adaptability: z.number().min(1).max(5),
  }),
  salaryMin: z.number().min(1000).max(100000),
  salaryMax: z.number().min(1000).max(200000),
  workModel: z.enum(['Presencial', 'Remoto', 'Híbrido']),
  benefits: z.array(z.string()).optional(),
});

// Matching schemas
// MATCH RAVYZ Pillar Breakdown Schema
export const PillarBreakdownSchema = z.object({
  autonomy: z.number().optional(),
  leadership: z.number().optional(),
  teamwork: z.number().optional(),
  risk: z.number().optional(),
  ambition: z.number().optional(),
  compensation: z.number().optional(),
  ambiente: z.number().optional(),
  proposito: z.number().optional(),
  crescimento: z.number().optional(),
});

// MATCH RAVYZ Matching Result Schema
export const MatchRavyzResultSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
  compatibility_score: z.number().min(0).max(100),
  candidate_archetype: z.string(),
  job_archetype: z.string(),
  pilar_breakdown: PillarBreakdownSchema,
  archetype_boost: z.number().default(0),
  explanation: z.string(),
  isDemoMatch: z.boolean().default(false),
  calculatedAt: z.date(),
  expiresAt: z.date(),
});

// Legacy schemas for backward compatibility
export const MatchingFactorsSchema = z.object({
  skills: z.object({
    score: z.number(),
    weight: z.number(),
    details: z.record(z.number()),
  }),
  experience: z.object({
    score: z.number(),
    weight: z.number(),
    levelMatch: z.boolean(),
    yearsExperience: z.number(),
  }),
  location: z.object({
    score: z.number(),
    weight: z.number(),
    workModelMatch: z.boolean(),
    locationMatch: z.boolean(),
  }),
  salary: z.object({
    score: z.number(),
    weight: z.number(),
    candidateExpectation: z.object({
      min: z.number(),
      max: z.number(),
    }),
    jobOffer: z.object({
      min: z.number(),
      max: z.number(),
    }),
    overlap: z.number(),
  }),
  culture: z.object({
    score: z.number(),
    weight: z.number(),
    workStyleAlignment: z.number(),
    valueAlignment: z.number(),
  }),
  resume: z.object({
    score: z.number(),
    weight: z.number(),
    technicalScore: z.number(),
    softSkillsScore: z.number(),
    overallScore: z.number(),
  }),
});

export const ScoreBreakdownSchema = z.object({
  skills: z.number(),
  experience: z.number(),
  location: z.number(),
  salary: z.number(),
  culture: z.number(),
  resume: z.number(),
  total: z.number(),
});

export const MatchingResultSchema = z.object({
  candidateId: z.string(),
  jobId: z.string(),
  matchPercentage: z.number().min(0).max(100),
  scoreBreakdown: ScoreBreakdownSchema,
  factorsAnalyzed: MatchingFactorsSchema,
  explanation: z.string(),
  isDemoMatch: z.boolean().default(false),
  calculatedAt: z.date(),
  expiresAt: z.date(),
});

// Type exports
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type CandidateCulturalResponse = z.infer<typeof CandidateCulturalResponseSchema>;
export type CandidateProfessionalResponse = z.infer<typeof CandidateProfessionalResponseSchema>;
export type CandidateDreamJobResponse = z.infer<typeof CandidateDreamJobResponseSchema>;
export type CompanyJobResponse = z.infer<typeof CompanyJobResponseSchema>;
export type PillarBreakdown = z.infer<typeof PillarBreakdownSchema>;
export type MatchRavyzResult = z.infer<typeof MatchRavyzResultSchema>;
export type MatchingFactors = z.infer<typeof MatchingFactorsSchema>;
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
export type MatchingResult = z.infer<typeof MatchingResultSchema>;

// Matching weights configuration
export const MATCHING_WEIGHTS = {
  skills: 0.25,
  experience: 0.2,
  location: 0.15,
  salary: 0.15,
  culture: 0.15,
  resume: 0.1,
} as const;

// Validation functions
export function validateCandidateCultural(data: unknown): CandidateCulturalResponse {
  return CandidateCulturalResponseSchema.parse(data);
}

export function validateCandidateProfessional(data: unknown): CandidateProfessionalResponse {
  return CandidateProfessionalResponseSchema.parse(data);
}

export function validateCandidateDreamJob(data: unknown): CandidateDreamJobResponse {
  return CandidateDreamJobResponseSchema.parse(data);
}

export function validateCompanyJob(data: unknown): CompanyJobResponse {
  return CompanyJobResponseSchema.parse(data);
}

export function validateMatchingResult(data: unknown): MatchingResult {
  return MatchingResultSchema.parse(data);
}