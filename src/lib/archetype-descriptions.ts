// Descrições dos arquétipos RAVYZ baseadas na metodologia de matching

export const archetypeDescriptions: Record<string, string> = {
  "Protagonista": "Profissional que quer estar no centro da ação, liderando mudanças e sendo referência. Busca visibilidade, reconhecimento e oportunidades de protagonizar transformações. Valoriza ambientes onde possa tomar decisões importantes e influenciar resultados estratégicos.",
  
  "Construtor": "Profissional focado em criar estruturas sólidas, legado e consistência. Busca construir bases duradouras e projetos de impacto de longo prazo. Valoriza organizações onde possa estabelecer processos, desenvolver sistemas e deixar sua marca através de realizações concretas.",
  
  "Visionário": "Profissional orientado ao futuro, inovação e impacto transformador. Busca antecipar tendências e criar soluções disruptivas. Valoriza ambientes que estimulam pensamento estratégico, experimentação e oportunidades de moldar o amanhã da organização e do mercado.",
  
  "Mobilizador": "Profissional que engaja e move pessoas, criando movimento coletivo em torno de objetivos compartilhados. Busca inspirar equipes e construir consensos. Valoriza ambientes colaborativos onde possa exercer influência, conectar pessoas e catalisar energia coletiva.",
  
  "Guardião": "Profissional que busca estabilidade, segurança e previsibilidade. Prioriza ambientes estruturados com processos claros e expectativas bem definidas. Valoriza organizações sólidas que ofereçam segurança no longo prazo, benefícios consistentes e carreira estável.",
  
  "Explorador": "Profissional movido por novidades, diversidade e disposição ao risco. Busca constantemente novos desafios, experiências variadas e oportunidades de aprendizado. Valoriza ambientes dinâmicos que ofereçam rotação de projetos, exposição a diferentes áreas e liberdade para experimentar.",
  
  "Colaborador": "Profissional orientado a relações humanas e harmonia no ambiente de trabalho. Prioriza cultura organizacional, trabalho em equipe e conexões interpessoais. Valoriza ambientes acolhedores onde possa contribuir para o bem-estar coletivo e construir relacionamentos significativos.",
  
  "Equilibrado": "Profissional que pondera crescimento, ambiente e compensação de forma equilibrada. Busca harmonia entre todas as dimensões da carreira sem sacrificar uma pela outra. Valoriza organizações que ofereçam desenvolvimento, qualidade de vida e recompensas justas simultaneamente.",
  
  "Estrategista": "Profissional que pensa no todo, avalia cenários e desenha planos de longo prazo. Busca compreender o panorama completo antes de agir. Valoriza ambientes que permitam análise profunda, planejamento estruturado e decisões baseadas em visão sistêmica.",
  
  "Transformador": "Profissional que acelera mudanças e desafia o status quo. Busca revolucionar processos, questionar paradigmas e implementar inovações. Valoriza ambientes que incentivem disrupção, tolerem falhas no processo de inovação e recompensem iniciativas transformadoras.",
  
  "Idealista": "Profissional movido por valores e princípios. Prioriza propósito, impacto social e alinhamento com suas crenças pessoais. Valoriza organizações com missão clara, responsabilidade social e oportunidades de contribuir para causas maiores que resultados puramente financeiros.",
  
  "Pragmático": "Profissional orientado a resultados e recompensas concretas. Foca em entregas tangíveis, métricas claras e retorno objetivo de seus esforços. Valoriza ambientes meritocráticos com compensação competitiva, metas bem definidas e reconhecimento baseado em performance.",
  
  "Proativo": "Profissional que combina autonomia com disposição ao risco. Age sem esperar direção, toma iniciativa e experimenta novas abordagens. Valoriza liberdade para testar ideias e ambientes que recompensem proatividade e inovação prática."
};

export const getArchetypeDescription = (archetype: string | null): string => {
  if (!archetype) return "Arquétipo em processamento. Complete seu perfil para descobrir seu arquétipo profissional único.";
  return archetypeDescriptions[archetype] || "Arquétipo único identificado através da análise RAVYZ do seu perfil profissional.";
};

// Descrições curtas para a tela de celebração da vaga
export const shortArchetypeDescriptions: Record<string, string> = {
  "Protagonista": "Busca estar no centro da ação, liderando mudanças.",
  "Construtor": "Cria estruturas sólidas e legado duradouro.",
  "Visionário": "Focado em futuro, inovação e impacto transformador.",
  "Mobilizador": "Engaja e move pessoas em torno de objetivos.",
  "Guardião": "Prioriza estabilidade, segurança e previsibilidade.",
  "Explorador": "Movido por novidades, diversidade e risco.",
  "Colaborador": "Orientado a relações humanas e harmonia.",
  "Equilibrado": "Pondera todas dimensões da carreira igualmente.",
  "Estrategista": "Pensa no todo e desenha planos de longo prazo.",
  "Transformador": "Acelera mudanças e desafia o status quo.",
  "Idealista": "Movido por valores e propósito.",
  "Pragmático": "Focado em resultados e recompensas concretas.",
  "Proativo": "Combina autonomia com disposição ao risco."
};
