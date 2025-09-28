import { MatchingEngine, CandidateRavyzData, JobRavyzData } from './matching-engine';

/**
 * MATCH RAVYZ - Complete Implementation Example
 * This file demonstrates the full MATCH RAVYZ methodology usage
 */

// Example candidate data with MATCH RAVYZ scores
const exampleCandidate: CandidateRavyzData = {
  id: 'candidate-123',
  pillar_scores: {
    compensation: 3.5,  // Compensation pillar (questions 1-7)
    ambiente: 4.2,      // Environment pillar (questions 8-14)
    proposito: 4.8,     // Purpose pillar (questions 15-21)
    crescimento: 4.0    // Growth pillar (questions 22-30)
  },
  archetype: 'Visionário' // Determined by top 2 pillars: proposito + ambiente
};

// Example job data with MATCH RAVYZ scores
const exampleJob: JobRavyzData = {
  id: 'job-456',
  pillar_scores: {
    autonomy: 4.1,      // Autonomy pillar (questions 1-6)
    leadership: 4.5,    // Leadership pillar (questions 7-12)
    teamwork: 3.8,      // Teamwork pillar (questions 13-18)
    risk: 3.2,          // Risk pillar (questions 19-24)
    ambition: 4.0       // Ambition pillar (questions 25-30)
  },
  archetype: 'Visionário' // Determined by top 2 pillars: leadership + autonomy
};

/**
 * Complete MATCH RAVYZ workflow example
 */
export async function runCompleteMatchingExample() {
  const matchingEngine = new MatchingEngine();

  try {
    console.log('🚀 Running MATCH RAVYZ Complete Matching...');
    
    // Run the complete matching workflow
    const result = await matchingEngine.runCompleteRavyzMatch(
      exampleCandidate.id,
      exampleJob.id,
      exampleCandidate,
      exampleJob,
      false // Not a demo match
    );

    console.log('✅ MATCH RAVYZ Results:');
    console.log(`Compatibility Score: ${result.compatibility_score}%`);
    console.log(`Candidate Archetype: ${result.candidate_archetype}`);
    console.log(`Job Archetype: ${result.job_archetype}`);
    console.log(`Archetype Boost: +${result.archetype_boost}%`);
    console.log('Pillar Breakdown:', result.pilar_breakdown);
    console.log('Explanation:', result.explanation);

    return result;
  } catch (error) {
    console.error('❌ MATCH RAVYZ Error:', error);
    throw error;
  }
}

/**
 * Step-by-step matching calculation example
 */
export async function stepByStepMatchingExample() {
  const matchingEngine = new MatchingEngine();

  console.log('📊 Step-by-step MATCH RAVYZ calculation:');
  
  // Step 1: Calculate the match
  const matchResult = await matchingEngine.calculateRavyzMatch(exampleCandidate, exampleJob);
  
  console.log('Step 1 - Pillar Compatibility:');
  Object.entries(matchResult.pilar_breakdown).forEach(([pillar, compatibility]) => {
    console.log(`  ${pillar}: ${compatibility}%`);
  });

  console.log(`Step 2 - Base Score: ${matchResult.compatibility_score - matchResult.archetype_boost}%`);
  console.log(`Step 3 - Archetype Boost: +${matchResult.archetype_boost}%`);
  console.log(`Step 4 - Final Score: ${matchResult.compatibility_score}%`);

  // Step 2: Save to database
  await matchingEngine.saveRavyzMatchResult(
    exampleCandidate.id,
    exampleJob.id,
    matchResult,
    false
  );

  console.log('✅ Match result saved to database!');
  
  return matchResult;
}

/**
 * Batch matching example - multiple candidates against one job
 */
export async function batchMatchingExample() {
  const matchingEngine = new MatchingEngine();
  
  const candidates: CandidateRavyzData[] = [
    {
      id: 'cand-1',
      pillar_scores: { compensation: 4.0, ambiente: 3.5, proposito: 4.2, crescimento: 3.8 },
      archetype: 'Protagonista'
    },
    {
      id: 'cand-2',
      pillar_scores: { compensation: 2.8, ambiente: 4.5, proposito: 4.8, crescimento: 3.2 },
      archetype: 'Idealista'
    },
    {
      id: 'cand-3',
      pillar_scores: { compensation: 4.5, ambiente: 3.0, proposito: 3.2, crescimento: 4.0 },
      archetype: 'Pragmático'
    }
  ];

  const job: JobRavyzData = {
    id: 'job-batch',
    pillar_scores: { autonomy: 4.2, leadership: 4.0, teamwork: 3.8, risk: 3.5, ambition: 4.1 },
    archetype: 'Protagonista'
  };

  console.log('🔄 Running batch matching...');
  
  const results = [];
  
  for (const candidate of candidates) {
    const matchResult = await matchingEngine.calculateRavyzMatch(candidate, job);
    results.push({
      candidateId: candidate.id,
      archetype: candidate.archetype,
      score: matchResult.compatibility_score,
      explanation: matchResult.explanation
    });
  }

  // Sort by compatibility score
  results.sort((a, b) => b.score - a.score);
  
  console.log('📈 Batch matching results (sorted by score):');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.candidateId} (${result.archetype}): ${result.score}%`);
  });

  return results;
}

/**
 * Analysis example - understanding match components
 */
export function analyzeMatchComponents() {
  console.log('🔍 MATCH RAVYZ Components Analysis:');
  
  console.log('\n📋 Candidate Pillars:');
  console.log('- Compensation: Financial motivation and compensation expectations');
  console.log('- Ambiente: Culture, environment, and people preferences');
  console.log('- Propósito: Purpose, values, and mission alignment');
  console.log('- Crescimento: Growth, learning, and career development desires');
  
  console.log('\n🏢 Job Pillars:');
  console.log('- Autonomy: Independence and decision-making freedom offered');
  console.log('- Leadership: Leadership opportunities and succession potential');
  console.log('- Teamwork: Collaboration requirements and team dynamics');
  console.log('- Risk: Innovation vs stability, risk tolerance needed');
  console.log('- Ambition: Career projection and advancement opportunities');
  
  console.log('\n🧮 Matching Formula:');
  console.log('1. Pillar Compatibility = 100% - (|candidate_score - job_score| * 20)');
  console.log('2. Base Score = Average of all pillar compatibilities');
  console.log('3. Archetype Boost = +10% (exact match) or +5% (close match)');
  console.log('4. Final Score = Base Score + Archetype Boost (capped at 100%)');
  
  console.log('\n🎯 Archetype Proximities:');
  console.log('- Exact match: Same archetype = +10% boost');
  console.log('- Close match: Compatible archetypes = +5% boost');
  console.log('- Examples: Protagonista ↔ Transformador, Guardião ↔ Pragmático');
}

// Export for use in other files
export {
  exampleCandidate,
  exampleJob
};