import candidatesData from '@/mock/candidates.json';
import jobsData from '@/mock/jobs.json';

export interface MockCandidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  years_experience: number;
  skills: string[];
  pillar_scores: Record<string, number>;
  archetype: string;
  headline: string;
  created_at: string;
}

export interface MockJob {
  id: string;
  company_id: string;
  title: string;
  description: string;
  requirements: string[];
  pillar_scores: Record<string, number>;
  archetype: string;
  status: string;
  location: string;
  created_at: string;
}

export const mockCandidates: MockCandidate[] = candidatesData;
export const mockJobs: MockJob[] = jobsData;

export const getMockCandidateById = (id: string): MockCandidate | undefined => {
  return mockCandidates.find(c => c.id === id);
};

export const getMockJobById = (id: string): MockJob | undefined => {
  return mockJobs.find(j => j.id === id);
};

export const getMockJobsByCompanyId = (companyId: string): MockJob[] => {
  return mockJobs.filter(j => j.company_id === companyId);
};
