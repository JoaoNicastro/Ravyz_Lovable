// Descrições dos arquétipos RAVYZ baseadas na metodologia de matching

export const archetypeDescriptions: Record<string, string> = {
  "Explorador Ambicioso": "Profissional orientado por desafios e crescimento acelerado. Busca ambientes dinâmicos onde possa testar seus limites, assumir riscos calculados e alcançar resultados excepcionais. Valoriza autonomia, recompensas competitivas e oportunidades de liderança.",
  
  "Construtor Estratégico": "Líder visionário que une propósito e pragmatismo. Busca criar impacto sustentável através de planejamento de longo prazo e execução disciplinada. Valoriza ambientes que permitam construir legados e transformar organizações.",
  
  "Colaborador Inspirado": "Profissional que prospera em equipes coesas e culturas fortes. Prioriza o ambiente de trabalho, relações interpessoais e alinhamento de valores. Busca propósito no trabalho e valoriza o bem-estar coletivo tanto quanto resultados individuais.",
  
  "Inovador Criativo": "Mente criativa que busca revolucionar processos e criar soluções originais. Valoriza liberdade para experimentar, ambientes que estimulam a criatividade e oportunidades de trabalhar em projetos únicos e transformadores.",
  
  "Especialista Técnico": "Profundo conhecedor da sua área, que busca excelência técnica e reconhecimento pela expertise. Valoriza ambientes que permitam aprofundamento contínuo, compartilhamento de conhecimento e trabalho em projetos complexos.",
  
  "Equilibrista Sustentável": "Profissional que busca harmonia entre todas as dimensões da carreira. Valoriza equilíbrio entre vida pessoal e profissional, estabilidade financeira, propósito e desenvolvimento contínuo sem sacrificar qualidade de vida.",
  
  "Executor Pragmático": "Profissional focado em resultados tangíveis e eficiência operacional. Valoriza clareza de objetivos, processos bem definidos e compensação alinhada à entrega. Busca ambientes meritocráticos e oportunidades de crescimento baseadas em performance.",
  
  "Líder Transformador": "Profissional orientado a liderar mudanças significativas e desenvolver pessoas. Combina visão estratégica com habilidades interpessoais excepcionais. Busca ambientes onde possa mentorear, influenciar cultura e criar impacto através da liderança.",
};

export const getArchetypeDescription = (archetype: string | null): string => {
  if (!archetype) return "Arquétipo em processamento. Complete seu perfil para descobrir seu arquétipo profissional único.";
  return archetypeDescriptions[archetype] || "Arquétipo único identificado através da análise RAVYZ do seu perfil profissional.";
};
