/**
 * MATCH RAVYZ - Hybrid Model V2 Example
 * 
 * This file demonstrates the new hybrid matching algorithm that combines:
 * - Behavioral compatibility (40%) - pillar scores + archetypes
 * - Experience & Education (35%) - years, position, education
 * - Technical Skills (25%) - skills matching
 * + Adjustments for archetype, location, language
 */

import { matchingEngine, CandidateRavyzData, JobRavyzData } from './matching-engine';

/**
 * Example: Run Hybrid Match with Real-World Data
 */
export async function exampleHybridMatch() {
  console.log('\n=== MATCH RAVYZ - Hybrid Model V2 Test ===\n');

  // Example Candidate Data (complete profile)
  const candidate: CandidateRavyzData = {
    id: 'candidate-123',
    // Behavioral Data (from 30-question assessment)
    pillar_scores: {
      Compensation: 4.2,
      Ambiente: 4.5,
      Propósito: 3.8,
      Crescimento: 4.0
    },
    archetype: 'Protagonista',
    
    // Professional Data (from resume + profile)
    yearsExperience: 5,
    currentPosition: 'Analista de Marketing Digital',
    skills: [
      'Google Ads',
      'Facebook Ads',
      'SEO',
      'Google Analytics',
      'Copywriting',
      'Excel',
      'Marketing de Conteúdo'
    ],
    education: [
      { level: 'Superior', degree: 'Marketing', institution: 'USP' }
    ],
    languages: ['Português', 'Inglês'],
    location: 'São Paulo',
    workModel: ['Híbrido', 'Remoto'],
    expectedSalaryMin: 6000,
    expectedSalaryMax: 9000
  };

  // Example Job Data
  const job: JobRavyzData = {
    id: 'job-456',
    title: 'Marketing Specialist',
    
    // Behavioral Requirements (from company assessment)
    pillar_scores: {
      Autonomia: 4.0,
      Liderança: 3.5,
      TrabalhoGrupo: 4.2,
      Risco: 3.0,
      Ambição: 4.0
    },
    archetype: 'Protagonista',
    
    // Job Requirements
    minExperience: 3,
    requiredSkills: [
      'Google Ads',
      'Facebook Ads',
      'Google Analytics',
      'SEO',
      'Marketing Digital'
    ],
    technicalSkills: ['Excel', 'PowerPoint'],
    educationRequired: ['Superior'],
    languagesRequired: ['Português', 'Inglês'],
    roleType: 'Marketing',
    location: 'São Paulo',
    workModel: 'Híbrido',
    salaryMin: 7000,
    salaryMax: 10000
  };

  // Calculate Hybrid Match
  const startTime = Date.now();
  const result = await matchingEngine.calculateHybridMatch(candidate, job);
  const executionTime = Date.now() - startTime;

  // Display Results
  console.log('📊 MATCH RESULT\n');
  console.log(`Final Score: ${result.final_score}%`);
  console.log(`Behavioral: ${result.behavioral_score}% (weight: 40%)`);
  console.log(`Experience: ${result.experience_score}% (weight: 35%)`);
  console.log(`Skills: ${result.skills_score}% (weight: 25%)`);
  console.log(`Adjustments: +${result.adjustments}%`);
  console.log(`\n💡 ${result.explanation}\n`);

  // Detailed Breakdown
  console.log('🔍 DETAILED BREAKDOWN\n');
  
  console.log('1️⃣ Behavioral (40%)');
  console.log(`   Score: ${result.breakdown.behavioral.score}%`);
  console.log(`   Candidate Archetype: ${result.breakdown.behavioral.candidate_archetype}`);
  console.log(`   Job Archetype: ${result.breakdown.behavioral.job_archetype}`);
  console.log(`   Archetype Boost: +${result.breakdown.behavioral.archetype_boost}%`);
  console.log('   Pillar Breakdown:');
  Object.entries(result.breakdown.behavioral.pillar_breakdown).forEach(([pillar, score]) => {
    if (score !== undefined) {
      console.log(`     - ${pillar}: ${Math.round(score as number)}%`);
    }
  });

  console.log('\n2️⃣ Experience & Education (35%)');
  console.log(`   Score: ${result.breakdown.experience.score}%`);
  console.log(`   Years Score: ${result.breakdown.experience.years_score}%`);
  console.log(`   Position Score: ${result.breakdown.experience.position_score}%`);
  console.log(`   Education Score: ${result.breakdown.experience.education_score}%`);

  console.log('\n3️⃣ Technical Skills (25%)');
  console.log(`   Score: ${result.breakdown.skills.score}%`);
  console.log(`   Match Rate: ${result.breakdown.skills.match_rate}%`);
  console.log(`   Matched Skills: ${result.breakdown.skills.matched_skills.join(', ')}`);
  if (result.breakdown.skills.missing_skills.length > 0) {
    console.log(`   Missing Skills: ${result.breakdown.skills.missing_skills.join(', ')}`);
  }

  console.log('\n4️⃣ Adjustments');
  console.log(`   Archetype: +${result.breakdown.adjustments.archetype}%`);
  console.log(`   Location: +${result.breakdown.adjustments.location}%`);
  console.log(`   Language: +${result.breakdown.adjustments.language}%`);
  console.log(`   Total: +${result.breakdown.adjustments.total}%`);

  console.log(`\n⚡ Execution Time: ${executionTime}ms\n`);

  return result;
}

/**
 * Technical Report - Algorithm Weights & Logic
 */
export function generateTechnicalReport() {
  console.log('\n=== TECHNICAL REPORT: Hybrid Match Model V2 ===\n');

  console.log('📋 ALGORITHM COMPOSITION\n');
  console.log('Final Score = (Behavioral × 0.4) + (Experience × 0.35) + (Skills × 0.25) + Adjustments\n');

  console.log('🧩 COMPONENTS\n');
  
  console.log('1. Behavioral Score (40%)');
  console.log('   Source: 30-question assessment → pillar_scores + archetype');
  console.log('   Method: Cosine similarity between candidate and job pillar vectors');
  console.log('   Data: candidate_profiles.pillar_scores, jobs.pillar_scores');
  console.log('   Boost: +10% exact archetype match, +5% compatible archetypes\n');

  console.log('2. Experience & Education Score (35%)');
  console.log('   Components:');
  console.log('     a) Years of Experience (50% weight)');
  console.log('        - Formula: 100% if meets requirement, -20%/year if below');
  console.log('        - Data: candidate_profiles.years_experience vs jobs.minExperience');
  console.log('     b) Position Match (30% weight)');
  console.log('        - Method: Keyword overlap between current position and role type');
  console.log('        - Data: candidate_profiles.current_position vs jobs.role_type');
  console.log('     c) Education Level (20% weight)');
  console.log('        - Method: Hierarchical matching (Fundamental → Doutorado)');
  console.log('        - Data: candidate_profiles.education vs jobs.educationRequired\n');

  console.log('3. Technical Skills Score (25%)');
  console.log('   Method: Jaccard similarity |A∩B| / |B|');
  console.log('   Fuzzy matching: Uses string similarity (0.7 threshold)');
  console.log('   Data:');
  console.log('     - candidate_profiles.skills');
  console.log('     - jobs.requiredSkills + jobs.technicalSkills + jobs.hardSkills');
  console.log('   Boost: +5% if 80%+ match\n');

  console.log('4. Adjustments (up to +10%)');
  console.log('   - Archetype compatible: +5%');
  console.log('   - Location compatible or Remote: +3%');
  console.log('   - All required languages present: +2%\n');

  console.log('📊 DATA SOURCES\n');
  console.log('Tables Used:');
  console.log('  • candidate_profiles: pillar_scores, archetype, years_experience,');
  console.log('    current_position, education, skills, languages, location');
  console.log('  • resume_analyses: skills_extracted, experience_summary (optional)');
  console.log('  • jobs: pillar_scores, archetype, minExperience, requiredSkills,');
  console.log('    technicalSkills, educationRequired, languagesRequired, location\n');

  console.log('⚙️ ALGORITHM FLOW\n');
  console.log('1. Load candidate and job data from database');
  console.log('2. Calculate Behavioral score (40%) using existing MATCH RAVYZ');
  console.log('3. Calculate Experience score (35%) with weighted sub-components');
  console.log('4. Calculate Skills score (25%) with fuzzy matching');
  console.log('5. Apply adjustments based on archetype, location, language');
  console.log('6. Normalize final score (cap at 100)');
  console.log('7. Generate human-readable explanation');
  console.log('8. Save to matching_results table\n');

  console.log('🎯 OUTPUT STRUCTURE\n');
  console.log('{');
  console.log('  final_score: number,');
  console.log('  behavioral_score: number,');
  console.log('  experience_score: number,');
  console.log('  skills_score: number,');
  console.log('  adjustments: number,');
  console.log('  breakdown: {');
  console.log('    behavioral: { score, pillar_breakdown, archetype_boost, ... },');
  console.log('    experience: { score, years_score, position_score, education_score },');
  console.log('    skills: { score, matched_skills[], missing_skills[], match_rate },');
  console.log('    adjustments: { archetype, location, language, total }');
  console.log('  },');
  console.log('  explanation: string');
  console.log('}\n');

  console.log('⚡ PERFORMANCE\n');
  console.log('Expected execution time: 5-15ms per match');
  console.log('Database queries: 2 (candidate + job data)');
  console.log('Computation: O(n) where n = number of skills\n');

  console.log('🔄 BACKWARD COMPATIBILITY\n');
  console.log('The existing behavioral-only MATCH RAVYZ remains available via:');
  console.log('  - matchingEngine.calculateRavyzMatch()');
  console.log('  - matchingEngine.calculateRavyzMatchSingle()\n');
  console.log('The new hybrid model is available via:');
  console.log('  - matchingEngine.calculateHybridMatch()\n');

  console.log('=== END OF REPORT ===\n');
}

/**
 * Compare Behavioral-Only vs Hybrid Model
 */
export async function compareModels() {
  console.log('\n=== MODEL COMPARISON: Behavioral-Only vs Hybrid ===\n');

  const candidate: CandidateRavyzData = {
    id: 'test-candidate',
    pillar_scores: { Compensation: 4.0, Ambiente: 4.5, Propósito: 3.8, Crescimento: 4.2 },
    archetype: 'Construtor',
    yearsExperience: 7,
    currentPosition: 'Desenvolvedor Sênior',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    education: [{ level: 'Superior', degree: 'Ciência da Computação' }],
    languages: ['Português', 'Inglês'],
    location: 'São Paulo'
  };

  const job: JobRavyzData = {
    id: 'test-job',
    title: 'Senior Full Stack Developer',
    pillar_scores: { Autonomia: 4.0, Liderança: 3.0, TrabalhoGrupo: 4.5, Risco: 3.5, Ambição: 3.8 },
    archetype: 'Construtor',
    minExperience: 5,
    requiredSkills: ['React', 'TypeScript', 'Node.js', 'SQL'],
    educationRequired: ['Superior'],
    languagesRequired: ['Português', 'Inglês'],
    location: 'São Paulo'
  };

  // Behavioral-Only Model
  const behavioralResult = await matchingEngine.calculateRavyzMatch(candidate, job);
  
  // Hybrid Model
  const hybridResult = await matchingEngine.calculateHybridMatch(candidate, job);

  console.log('Behavioral-Only Model:');
  console.log(`  Score: ${behavioralResult.compatibility_score}%`);
  console.log(`  Basis: Pillar scores + archetype only\n`);

  console.log('Hybrid Model V2:');
  console.log(`  Final Score: ${hybridResult.final_score}%`);
  console.log(`  Breakdown:`);
  console.log(`    - Behavioral: ${hybridResult.behavioral_score}% (40%)`);
  console.log(`    - Experience: ${hybridResult.experience_score}% (35%)`);
  console.log(`    - Skills: ${hybridResult.skills_score}% (25%)`);
  console.log(`    - Adjustments: +${hybridResult.adjustments}%\n`);

  console.log('💡 Insight:');
  if (hybridResult.final_score > behavioralResult.compatibility_score) {
    console.log('   Hybrid model scores HIGHER - candidate has strong technical fit');
  } else if (hybridResult.final_score < behavioralResult.compatibility_score) {
    console.log('   Hybrid model scores LOWER - candidate has behavioral fit but technical gaps');
  } else {
    console.log('   Models align - candidate is balanced across all dimensions');
  }
  console.log();
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    generateTechnicalReport();
    await exampleHybridMatch();
    await compareModels();
  })();
}
