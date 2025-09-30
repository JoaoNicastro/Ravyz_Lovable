import { MatchingEngine, CandidateRavyzData, JobRavyzData } from './matching-engine';

/**
 * MATCH RAVYZ - Complete Implementation Example
 * This file demonstrates the full MATCH RAVYZ methodology usage
 */

// Example candidate data with MATCH RAVYZ scores
const exampleCandidate: CandidateRavyzData = {
  id: 'candidate-123',
  pillar_scores: {
    Compensation: 3.5,  // Compensation pillar (questions 1-7)
    Ambiente: 4.2,      // Environment pillar (questions 8-14)
    Propósito: 4.8,     // Purpose pillar (questions 15-21)
    Crescimento: 4.0    // Growth pillar (questions 22-30)
  },
  archetype: 'Visionário' // Determined by top 2 pillars: proposito + ambiente
};

// Example job data with MATCH RAVYZ scores
const exampleJob: JobRavyzData = {
  id: 'job-456',
  pillar_scores: {
    Autonomia: 4.1,      // Autonomy pillar (questions 1-6)
    Liderança: 4.5,    // Leadership pillar (questions 7-12)
    TrabalhoGrupo: 3.8,      // Teamwork pillar (questions 13-18)
    Risco: 3.2,          // Risk pillar (questions 19-24)
    Ambição: 4.0       // Ambition pillar (questions 25-30)
  },
  archetype: 'Visionário' // Determined by top 2 pillars: leadership + autonomy
};

/**
 * Complete MATCH RAVYZ workflow example
 */
async function runCompleteMatchingExample() {
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
async function stepByStepMatchingExample() {
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
 * Example: Batch matching between multiple candidates and jobs using matrix calculation
 */
async function batchMatchingExample() {
  const matchingEngine = new MatchingEngine();
  
  // Example: Multiple candidates and multiple jobs
  const candidates: CandidateRavyzData[] = [
    {
      id: 'candidate-1',
      pillar_scores: { Compensation: 4.2, Ambiente: 3.8, Propósito: 4.0, Crescimento: 4.5 },
      archetype: 'Protagonista'
    },
    {
      id: 'candidate-2', 
      pillar_scores: { Compensation: 3.1, Ambiente: 4.3, Propósito: 2.8, Crescimento: 3.9 },
      archetype: 'Construtor'
    },
    {
      id: 'candidate-3',
      pillar_scores: { Compensation: 3.7, Ambiente: 2.9, Propósito: 4.2, Crescimento: 3.4 },
      archetype: 'Visionário'
    }
  ];

  const jobs: JobRavyzData[] = [
    {
      id: 'job-senior-dev',
      pillar_scores: { Autonomia: 4.1, Liderança: 3.8, TrabalhoGrupo: 4.0, Risco: 3.2, Ambição: 4.3 },
      archetype: 'Protagonista'
    },
    {
      id: 'job-tech-lead',
      pillar_scores: { Autonomia: 3.5, Liderança: 4.5, TrabalhoGrupo: 3.8, Risco: 3.8, Ambição: 4.0 },
      archetype: 'Mobilizador'
    }
  ];

  console.log('📊 Calculating compatibility matrix for all candidates vs all jobs...');
  
  // Calculate full compatibility matrix
  const allMatches = matchingEngine.calculateAllMatches(candidates, jobs);

  console.log('\n🏆 TOP MATCHES (sorted by compatibility):');
  allMatches.slice(0, 5).forEach((match, index) => {
    console.log(`${index + 1}. ${match.candidate_id} → ${match.job_id}: ${match.compatibility_score}%`);
    console.log(`   Base Similarity: ${match.base_similarity}% + Archetype Boost: ${match.archetype_boost}%`);
    console.log(`   Archetypes: ${match.candidate_archetype} vs ${match.job_archetype}`);
  });

  return allMatches;
}

/**
 * Example: Matrix calculation for large-scale matching
 */
function matrixCalculationExample() {
  const matchingEngine = new MatchingEngine();
  
  console.log('\n🧮 === MATRIX CALCULATION EXAMPLE ===');
  
  const candidates: CandidateRavyzData[] = [
    { id: 'c1', pillar_scores: { Compensation: 4.0, Ambiente: 3.5, Propósito: 4.2, Crescimento: 3.8 }, archetype: 'Protagonista' },
    { id: 'c2', pillar_scores: { Compensation: 3.2, Ambiente: 4.1, Propósito: 2.9, Crescimento: 4.3 }, archetype: 'Construtor' },
    { id: 'c3', pillar_scores: { Compensation: 3.8, Ambiente: 3.0, Propósito: 4.5, Crescimento: 3.4 }, archetype: 'Visionário' }
  ];

  const jobs: JobRavyzData[] = [
    { id: 'j1', pillar_scores: { Autonomia: 4.0, Liderança: 3.8, TrabalhoGrupo: 4.1, Risco: 3.3, Ambição: 4.2 }, archetype: 'Protagonista' },
    { id: 'j2', pillar_scores: { Autonomia: 3.4, Liderança: 4.2, TrabalhoGrupo: 3.9, Risco: 3.7, Ambição: 3.8 }, archetype: 'Mobilizador' }
  ];

  console.log('🔢 Calculating 3x2 compatibility matrix...');
  
  // Get full matrix (candidates x jobs)
  const matrix = matchingEngine.calculateCompatibilityMatrix(candidates, jobs);
  
  console.log('\n📋 COMPATIBILITY MATRIX:');
  console.log('       j1     j2');
  matrix.forEach((candidateResults, i) => {
    const scores = candidateResults.map(r => `${r.compatibility_score}%`).join('   ');
    console.log(`${candidates[i].id}:   ${scores}`);
  });

  console.log('\n🎯 Matrix Details:');
  matrix.forEach((candidateResults, i) => {
    candidateResults.forEach((result) => {
      console.log(`${result.candidate_id}→${result.job_id}: ${result.base_similarity}% + ${result.archetype_boost}% = ${result.compatibility_score}%`);
    });
  });

  return matrix;
}

/**
 * Analysis example - understanding match components
 */
function analyzeMatchComponents() {
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

// Export all functions and examples
export { 
  runCompleteMatchingExample, 
  stepByStepMatchingExample, 
  batchMatchingExample, 
  matrixCalculationExample,
  analyzeMatchComponents,
  exampleCandidate,
  exampleJob
};