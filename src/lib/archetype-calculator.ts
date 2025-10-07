/**
 * MATCH RAVYZ - Archetype Calculator
 * 
 * Este módulo implementa a lógica para calcular o arquétipo de um candidato
 * baseado nas respostas do assessment de 30 perguntas.
 */

export interface PillarScores {
  compensation: number;
  ambiente: number;
  proposito: number;
  crescimento: number;
}

export interface ArchetypeResult {
  archetype: string;
  pillarScores: PillarScores;
  dominantPillars: [string, number][];
  confidence: 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Calcula os scores dos 4 pilares baseado nas respostas do assessment
 */
export function calculatePillarScores(responses: Record<string, number>): PillarScores {
  const pillarGroups = {
    compensation: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7'],
    ambiente: ['q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14'],
    proposito: ['q15', 'q16', 'q17', 'q18', 'q19', 'q20', 'q21'],
    crescimento: ['q22', 'q23', 'q24', 'q25', 'q26', 'q27', 'q28', 'q29', 'q30']
  };

  // Perguntas contrastantes (devem ser invertidas: 6 - valor)
  const contrastingQuestions = ['q6', 'q14', 'q20', 'q28'];

  const scores: PillarScores = {
    compensation: 0,
    ambiente: 0,
    proposito: 0,
    crescimento: 0
  };

  // Calcular média para cada pilar
  Object.entries(pillarGroups).forEach(([pillar, questions]) => {
    let sum = 0;
    questions.forEach(questionId => {
      const rawScore = responses[questionId] || 0;
      // Inverter se for pergunta contrastante
      const adjustedScore = contrastingQuestions.includes(questionId) 
        ? (6 - rawScore) 
        : rawScore;
      sum += adjustedScore;
    });
    scores[pillar as keyof PillarScores] = sum / questions.length;
  });

  return scores;
}

/**
 * Determina o arquétipo baseado nos pilares dominantes
 */
export function determineArchetype(pillarScores: PillarScores): ArchetypeResult {
  // Ordenar pilares por score (maior para menor)
  const sortedPillars = Object.entries(pillarScores)
    .sort(([, a], [, b]) => b - a) as [string, number][];

  const [first, second] = sortedPillars;
  const [firstPillar, firstScore] = first;
  const [secondPillar, secondScore] = second;
  
  // Calcular diferença entre primeiro e último para detectar "Equilibrado"
  const lowestScore = sortedPillars[3][1];
  const scoreDifference = firstScore - lowestScore;

  // Caso especial: Equilibrado (todos os pilares muito próximos)
  if (scoreDifference < 0.5) {
    return {
      archetype: 'Equilibrado',
      pillarScores,
      dominantPillars: sortedPillars.slice(0, 2),
      confidence: 'high',
      description: 'Perfil balanceado entre todos os pilares de carreira. Valoriza igualmente remuneração, ambiente, propósito e crescimento.'
    };
  }

  // Caso especial: Idealista Puro (Propósito muito alto, outros muito baixos)
  if (firstPillar === 'proposito' && firstScore > 4.5 && sortedPillars[1][1] < 3.5) {
    return {
      archetype: 'Idealista Puro',
      pillarScores,
      dominantPillars: sortedPillars.slice(0, 2),
      confidence: 'high',
      description: 'Movido exclusivamente por propósito e impacto. Valores organizacionais são decisivos, remuneração é secundária.'
    };
  }

  // Mapeamento dos arquétipos baseado na combinação dos 2 pilares dominantes
  const archetypeMap = getArchetypeMap(firstPillar, secondPillar, pillarScores);
  
  // Calcular confiança baseado na diferença entre primeiro e segundo pilar
  const pillarsGap = firstScore - secondScore;
  const confidence: 'high' | 'medium' | 'low' = 
    pillarsGap > 0.7 ? 'high' :
    pillarsGap > 0.3 ? 'medium' : 'low';

  return {
    archetype: archetypeMap.archetype,
    pillarScores,
    dominantPillars: sortedPillars.slice(0, 2),
    confidence,
    description: archetypeMap.description
  };
}

/**
 * Mapeia a combinação de pilares dominantes para o arquétipo correspondente
 */
function getArchetypeMap(
  firstPillar: string, 
  secondPillar: string,
  scores: PillarScores
): { archetype: string; description: string } {
  
  const key = `${firstPillar}_${secondPillar}`;
  
  // Tabela de mapeamento conforme metodologia MATCH RAVYZ
  const mappings: Record<string, { archetype: string; description: string }> = {
    // Crescimento + Propósito = Protagonista
    'crescimento_proposito': {
      archetype: 'Protagonista',
      description: 'Combina desenvolvimento pessoal com senso de missão. Busca evolução em ambientes com propósito claro.'
    },
    'proposito_crescimento': {
      archetype: 'Protagonista',
      description: 'Combina desenvolvimento pessoal com senso de missão. Busca evolução em ambientes com propósito claro.'
    },

    // Ambiente + Crescimento = Construtor (quando Ambiente > Crescimento)
    'ambiente_crescimento': {
      archetype: 'Construtor',
      description: 'Valoriza cultura sólida e oportunidades de desenvolvimento. Constrói carreira em times de alta performance.'
    },

    // Crescimento + Ambiente = Mobilizador (quando Crescimento > Ambiente)
    'crescimento_ambiente': {
      archetype: scores.crescimento > scores.ambiente ? 'Mobilizador' : 'Construtor',
      description: scores.crescimento > scores.ambiente
        ? 'Impulsiona mudanças e inspira times. Lidera transformações com foco em pessoas e resultados.'
        : 'Valoriza cultura sólida e oportunidades de desenvolvimento. Constrói carreira em times de alta performance.'
    },

    // Propósito + Ambiente = Visionário (quando há score de estratégia/visão alto)
    'proposito_ambiente': {
      archetype: 'Visionário',
      description: 'Une visão de longo prazo com valorização de cultura. Pensa estrategicamente sobre impacto organizacional.'
    },
    'ambiente_proposito': {
      archetype: 'Idealista',
      description: 'Prioriza valores compartilhados e cultura de trabalho alinhada. Ambiente importa tanto quanto a causa.'
    },

    // Compensation + Ambiente = Guardião
    'compensation_ambiente': {
      archetype: 'Guardião',
      description: 'Busca estabilidade financeira em ambientes estruturados. Valoriza segurança e relações de confiança.'
    },
    'ambiente_compensation': {
      archetype: 'Guardião',
      description: 'Busca estabilidade financeira em ambientes estruturados. Valoriza segurança e relações de confiança.'
    },

    // Compensation + Crescimento = Pragmático
    'compensation_crescimento': {
      archetype: 'Pragmático',
      description: 'Foco em resultados tangíveis e retorno sobre investimento pessoal. Crescimento deve gerar recompensa financeira.'
    },
    'crescimento_compensation': {
      archetype: 'Pragmático',
      description: 'Foco em resultados tangíveis e retorno sobre investimento pessoal. Crescimento deve gerar recompensa financeira.'
    },

    // Compensation + Propósito = Estrategista
    'compensation_proposito': {
      archetype: 'Estrategista',
      description: 'Equilibra pragmatismo financeiro com senso de propósito. Busca impacto sustentável com retorno adequado.'
    },
    'proposito_compensation': {
      archetype: 'Estrategista',
      description: 'Equilibra pragmatismo financeiro com senso de propósito. Busca impacto sustentável com retorno adequado.'
    }
  };

  return mappings[key] || {
    archetype: 'Colaborador',
    description: 'Perfil versátil que se adapta a diferentes contextos. Equilibra múltiplas prioridades de carreira.'
  };
}

/**
 * Retorna a narrativa consultiva completa para um arquétipo
 */
export function getArchetypeNarrative(archetype: string): {
  title: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
} {
  const narratives: Record<string, any> = {
    'Protagonista': {
      title: 'O Protagonista',
      strengths: [
        'Alta motivação intrínseca e senso de propósito',
        'Capacidade de inspirar e engajar times',
        'Resiliência em momentos de transformação',
        'Visão de longo prazo alinhada com valores pessoais'
      ],
      risks: [
        'Pode se frustrar em ambientes sem propósito claro',
        'Risco de burnout ao colocar missão acima do equilíbrio',
        'Dificuldade em aceitar decisões puramente comerciais'
      ],
      recommendations: [
        'Busque empresas com missão e valores explícitos',
        'Negocie autonomia para atuar em projetos de impacto',
        'Encontre mentores que compartilhem seus valores',
        'Estabeleça limites para preservar energia de longo prazo'
      ]
    },
    'Construtor': {
      title: 'O Construtor',
      strengths: [
        'Excelente em criar estruturas e processos sólidos',
        'Valoriza a qualidade das relações no trabalho',
        'Foco em crescimento sustentável e consistente',
        'Capacidade de desenvolver times de alta performance'
      ],
      risks: [
        'Pode demorar demais para tomar decisões disruptivas',
        'Resistência a mudanças culturais rápidas',
        'Frustração em ambientes muito voláteis'
      ],
      recommendations: [
        'Escolha empresas com cultura consolidada e clara',
        'Busque ambientes que valorizem processos de excelência',
        'Invista em relacionamentos de longo prazo',
        'Desenvolva tolerância para experimentação controlada'
      ]
    },
    'Mobilizador': {
      title: 'O Mobilizador',
      strengths: [
        'Lidera pelo exemplo e inspira mudanças',
        'Alta capacidade de influenciar e engajar pessoas',
        'Prospera em ambientes dinâmicos',
        'Combina visão estratégica com execução prática'
      ],
      risks: [
        'Pode ser visto como muito assertivo ou dominante',
        'Impaciência com processos lentos ou burocráticos',
        'Risco de exaustão ao tentar mobilizar sozinho'
      ],
      recommendations: [
        'Busque posições de liderança ou influência',
        'Desenvolva habilidades de escuta ativa',
        'Equilibre urgência com sustentabilidade',
        'Encontre ambientes que valorizem inovação e agilidade'
      ]
    },
    'Visionário': {
      title: 'O Visionário',
      strengths: [
        'Pensamento estratégico de longo prazo',
        'Capacidade de antecipar tendências',
        'Une propósito com visão de negócio',
        'Inspira times com narrativas de futuro'
      ],
      risks: [
        'Pode parecer desconectado da realidade operacional',
        'Frustração com foco excessivo no curto prazo',
        'Dificuldade em executar detalhes práticos'
      ],
      recommendations: [
        'Posicione-se em áreas de estratégia ou inovação',
        'Forme parcerias com perfis mais executores',
        'Valide suas visões com dados e feedback de mercado',
        'Encontre ambientes que valorizem experimentação'
      ]
    },
    'Idealista': {
      title: 'O Idealista',
      strengths: [
        'Autenticidade e coerência entre valores e ações',
        'Capacidade de criar culturas positivas',
        'Alta empatia e conexão com times',
        'Motivação sustentável baseada em propósito'
      ],
      risks: [
        'Pode sofrer em ambientes com valores conflitantes',
        'Dificuldade em fazer concessões pragmáticas',
        'Risco de desilusão ao enfrentar realidades corporativas'
      ],
      recommendations: [
        'Pesquise profundamente a cultura antes de aceitar ofertas',
        'Busque empresas B Corp ou com impacto social claro',
        'Desenvolva resiliência para lidar com imperfeições',
        'Encontre comunidades de pessoas com valores similares'
      ]
    },
    'Idealista Puro': {
      title: 'O Idealista Puro',
      strengths: [
        'Compromisso absoluto com valores e propósito',
        'Autenticidade excepcional',
        'Capacidade de inspirar mudanças profundas',
        'Resiliência baseada em convicções fortes'
      ],
      risks: [
        'Rejeição categórica de ambientes não alinhados',
        'Possível sacrifício excessivo da remuneração',
        'Frustração intensa em organizações tradicionais'
      ],
      recommendations: [
        'Considere empreendedorismo social ou ONGs',
        'Negocie condições mínimas de sustentabilidade financeira',
        'Busque mentorias para equilibrar idealismo e pragmatismo',
        'Identifique setores naturalmente alinhados (ESG, impacto)'
      ]
    },
    'Guardião': {
      title: 'O Guardião',
      strengths: [
        'Valoriza segurança e estabilidade',
        'Excelente em gestão de riscos',
        'Constrói relações de confiança de longo prazo',
        'Foco em qualidade e consistência'
      ],
      risks: [
        'Pode evitar riscos necessários para crescimento',
        'Resistência a mudanças disruptivas',
        'Priorização excessiva de benefícios sobre desenvolvimento'
      ],
      recommendations: [
        'Busque empresas consolidadas com boa reputação',
        'Valorize planos de carreira estruturados',
        'Invista em certificações e especializações',
        'Desenvolva tolerância calculada ao risco'
      ]
    },
    'Pragmático': {
      title: 'O Pragmático',
      strengths: [
        'Foco claro em resultados mensuráveis',
        'Excelente ROI sobre investimentos pessoais',
        'Capacidade de negociação e argumentação',
        'Objetividade nas decisões de carreira'
      ],
      risks: [
        'Pode ser visto como excessivamente transacional',
        'Risco de trocar frequentemente por ofertas maiores',
        'Possível desconexão com propósito organizacional'
      ],
      recommendations: [
        'Negocie packages agressivos com metas claras',
        'Busque setores com alta remuneração (tech, finanças)',
        'Desenvolva habilidades de alta demanda no mercado',
        'Equilibre ganhos de curto prazo com construção de marca pessoal'
      ]
    },
    'Estrategista': {
      title: 'O Estrategista',
      strengths: [
        'Equilíbrio entre propósito e pragmatismo financeiro',
        'Visão de valor sustentável',
        'Capacidade de negociar win-win',
        'Pensamento sistêmico e holístico'
      ],
      risks: [
        'Pode parecer indeciso ao ponderar múltiplos fatores',
        'Dificuldade em contextos que exigem escolhas binárias',
        'Frustração em ambientes extremamente comerciais ou idealistas'
      ],
      recommendations: [
        'Posicione-se em áreas de estratégia corporativa',
        'Busque empresas em transição para modelos sustentáveis',
        'Desenvolva habilidades de consultoria e influência',
        'Valorize packages que combinem equity e propósito'
      ]
    },
    'Equilibrado': {
      title: 'O Equilibrado',
      strengths: [
        'Adaptabilidade a diferentes contextos',
        'Visão holística de carreira',
        'Capacidade de priorizar conforme momento de vida',
        'Facilidade em trabalhar com perfis diversos'
      ],
      risks: [
        'Pode ter dificuldade em tomar decisões de carreira',
        'Falta de clareza sobre prioridades pessoais',
        'Risco de aceitar situações subótimas por indecisão'
      ],
      recommendations: [
        'Faça exercícios de auto-conhecimento para identificar prioridades',
        'Teste diferentes ambientes antes de se comprometer',
        'Busque mentoria para esclarecer direcionamento',
        'Valorize flexibilidade e variedade de experiências'
      ]
    },
    'Colaborador': {
      title: 'O Colaborador',
      strengths: [
        'Forte orientação para trabalho em equipe',
        'Capacidade de mediar conflitos',
        'Valoriza harmonia e cooperação',
        'Excelente em ambientes matriciais'
      ],
      risks: [
        'Pode evitar confrontos necessários',
        'Dificuldade em se posicionar individualmente',
        'Risco de ser ofuscado por perfis mais assertivos'
      ],
      recommendations: [
        'Desenvolva habilidades de auto-promoção',
        'Busque ambientes que valorizem colaboração',
        'Pratique assertividade em situações seguras',
        'Identifique contribuições únicas além do trabalho em time'
      ]
    }
  };

  return narratives[archetype] || narratives['Colaborador'];
}
