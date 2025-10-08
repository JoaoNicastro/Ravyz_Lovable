// Calculadora de arquétipo de vaga baseado nas respostas do assessment

interface PillarScores {
  autonomia: number;
  lideranca: number;
  trabalho_grupo: number;
  risco: number;
  ambicao: number;
}

interface AssessmentResponse {
  questionId: string;
  score: number;
}

// Mapeamento de questões para pilares
const PILLAR_MAPPING = {
  autonomia: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'],
  lideranca: ['q7', 'q8', 'q9', 'q10', 'q11', 'q12'],
  trabalho_grupo: ['q13', 'q14', 'q15', 'q16', 'q17', 'q18'],
  risco: ['q19', 'q20', 'q21', 'q22', 'q23', 'q24'],
  ambicao: ['q25', 'q26', 'q27', 'q28', 'q29', 'q30']
};

// Matriz de mapeamento de arquétipos baseado nos 2 pilares dominantes
const ARCHETYPE_MATRIX: Record<string, string> = {
  'autonomia_lideranca': 'Protagonista',
  'lideranca_autonomia': 'Protagonista',
  
  'autonomia_trabalho_grupo': 'Mobilizador',
  'trabalho_grupo_autonomia': 'Mobilizador',
  
  'risco_ambicao': 'Transformador',
  'ambicao_risco': 'Transformador',
  
  'lideranca_ambicao': 'Visionário',
  'ambicao_lideranca': 'Visionário',
  
  'trabalho_grupo_risco': 'Explorador',
  'risco_trabalho_grupo': 'Explorador',
  
  'autonomia_risco': 'Proativo',
  'risco_autonomia': 'Proativo',
  
  'lideranca_trabalho_grupo': 'Idealista',
  'trabalho_grupo_lideranca': 'Idealista',
  
  'risco_lideranca': 'Estrategista',
  'lideranca_risco': 'Estrategista',
  
  'ambicao_trabalho_grupo': 'Colaborador',
  'trabalho_grupo_ambicao': 'Colaborador',
  
  'autonomia_ambicao': 'Guardião',
  'ambicao_autonomia': 'Guardião'
};

/**
 * Calcula as pontuações dos 5 pilares baseado nas respostas do assessment
 */
export function calculatePillarScores(responses: AssessmentResponse[]): PillarScores {
  const pillarScores: PillarScores = {
    autonomia: 0,
    lideranca: 0,
    trabalho_grupo: 0,
    risco: 0,
    ambicao: 0
  };

  // Calcular média de cada pilar
  for (const [pillar, questionIds] of Object.entries(PILLAR_MAPPING)) {
    const pillarResponses = responses.filter(r => 
      questionIds.includes(r.questionId)
    );
    
    if (pillarResponses.length > 0) {
      const sum = pillarResponses.reduce((acc, r) => acc + r.score, 0);
      pillarScores[pillar as keyof PillarScores] = sum / pillarResponses.length;
    }
  }

  return pillarScores;
}

/**
 * Identifica os 2 pilares dominantes
 */
function getTopTwoPillars(scores: PillarScores): [string, string] {
  const entries = Object.entries(scores);
  entries.sort((a, b) => b[1] - a[1]);
  return [entries[0][0], entries[1][0]];
}

/**
 * Determina o arquétipo baseado nos pilares dominantes
 */
export function calculateJobArchetype(responses: AssessmentResponse[]): {
  archetype: string;
  pillarScores: PillarScores;
} {
  const pillarScores = calculatePillarScores(responses);
  const [firstPillar, secondPillar] = getTopTwoPillars(pillarScores);
  
  const key = `${firstPillar}_${secondPillar}`;
  const archetype = ARCHETYPE_MATRIX[key] || 'Equilibrado';
  
  return {
    archetype,
    pillarScores
  };
}

/**
 * Converte respostas do formato de objeto para array
 */
export function convertResponsesFormat(responsesObj: Record<string, number>): AssessmentResponse[] {
  return Object.entries(responsesObj).map(([questionId, score]) => ({
    questionId,
    score
  }));
}
