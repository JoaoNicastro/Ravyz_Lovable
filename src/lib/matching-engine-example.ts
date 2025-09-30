// MATCH RAVYZ Matching Engine Usage Example
// This example shows how to use the updated matching engine with MATCH RAVYZ methodology

import { matchingEngine, CandidateRavyzData, JobRavyzData } from '@/lib/matching-engine';

/**
 * Example: How to run MATCH RAVYZ matching between a candidate and job
 */
async function exampleRavyzMatching() {
  // Example candidate data from MATCH RAVYZ assessment
  const candidateData: CandidateRavyzData = {
    id: 'candidate-123',
    pillar_scores: {
      Compensation: 3.8, // High importance on compensation
      Ambiente: 4.2,     // Very high importance on environment
      Propósito: 2.9,    // Moderate importance on purpose
      Crescimento: 4.5   // Very high importance on growth
    },
    archetype: 'Construtor' // Determined from pillar combination
  };

  // Example job data from company assessment
  const jobData: JobRavyzData = {
    id: 'job-456',
    pillar_scores: {
      Autonomia: 4.0,     // High autonomy offered
      Liderança: 3.2,   // Moderate leadership opportunities
      TrabalhoGrupo: 4.1,     // High teamwork requirement
      Risco: 2.8,         // Moderate risk tolerance needed
      Ambição: 3.9      // High ambition/growth potential
    },
    archetype: 'Mobilizador' // Determined from job requirements
  };

  try {
    // Run complete MATCH RAVYZ matching workflow
    const matchResult = await matchingEngine.runCompleteRavyzMatch(
      candidateData.id,
      jobData.id,
      candidateData,
      jobData,
      false // isDemoMatch
    );

    console.log('🎯 MATCH RAVYZ Results:');
    console.log('📊 Compatibility Score:', matchResult.compatibility_score + '%');
    console.log('👤 Candidate Archetype:', matchResult.candidate_archetype);
    console.log('💼 Job Archetype:', matchResult.job_archetype);
    console.log('🚀 Archetype Boost:', matchResult.archetype_boost + '%');
    console.log('📈 Pillar Breakdown:', matchResult.pilar_breakdown);
    console.log('💬 Explanation:', matchResult.explanation);

    return matchResult;

  } catch (error) {
    console.error('❌ Matching failed:', error);
    throw error;
  }
}

/**
 * Example: How pillar compatibility is calculated
 */
function examplePillarCalculation() {
  const candidate = { compensation: 4.0, ambiente: 3.5, proposito: 2.8, crescimento: 4.2 };
  const job = { autonomy: 3.8, leadership: 2.5, teamwork: 3.7, risk: 3.0, ambition: 4.0 };

  console.log('🔍 Pillar Compatibility Calculation:');
  
  // Compensation (4.0) vs Ambition (4.0): |4.0 - 4.0| = 0.0 → 100% - (0.0 * 20) = 100%
  console.log('💰 Compensation vs Ambition:', 100 - (Math.abs(4.0 - 4.0) * 20) + '%');
  
  // Ambiente (3.5) vs Teamwork (3.7): |3.5 - 3.7| = 0.2 → 100% - (0.2 * 20) = 96%
  console.log('🤝 Ambiente vs Teamwork:', 100 - (Math.abs(3.5 - 3.7) * 20) + '%');
  
  // Propósito (2.8) vs Leadership (2.5): |2.8 - 2.5| = 0.3 → 100% - (0.3 * 20) = 94%
  console.log('🎯 Propósito vs Leadership:', 100 - (Math.abs(2.8 - 2.5) * 20) + '%');
  
  // Crescimento (4.2) vs Autonomy (3.8): |4.2 - 3.8| = 0.4 → 100% - (0.4 * 20) = 92%
  console.log('📈 Crescimento vs Autonomy:', 100 - (Math.abs(4.2 - 3.8) * 20) + '%');
  
  // Risk (3.0) vs Neutral (3.0): |3.0 - 3.0| = 0.0 → 100% - (0.0 * 20) = 100%
  console.log('⚡ Risk tolerance:', 100 - (Math.abs(3.0 - 3.0) * 20) + '%');
  
  // Average: (100 + 96 + 94 + 92 + 100) / 5 = 96.4%
  const average = (100 + 96 + 94 + 92 + 100) / 5;
  console.log('📊 Base Score (average):', average.toFixed(1) + '%');
}

/**
 * Example: Archetype boost calculation
 */
function exampleArchetypeBoost() {
  console.log('🎭 Archetype Boost Examples:');
  
  // Exact match: +10%
  console.log('✅ Protagonista vs Protagonista: +10% boost');
  
  // Close archetypes: +5%
  console.log('🔄 Protagonista vs Transformador: +5% boost');
  console.log('🔄 Construtor vs Mobilizador: +5% boost');
  
  // Different archetypes: +0%
  console.log('❌ Guardião vs Visionário: +0% boost');
}

// Export for use in tests or demonstrations
export { exampleRavyzMatching, examplePillarCalculation, exampleArchetypeBoost };