import React from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface SkillSuggestionsProps {
  role: string;
  onAddSkill: (skill: string) => void;
  currentSkills: string[];
}

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  "desenvolvedor": ["JavaScript", "TypeScript", "React", "Node.js", "Git", "CSS", "HTML", "REST API"],
  "designer": ["Figma", "Adobe XD", "Photoshop", "Illustrator", "UI/UX", "Design Thinking", "Prototipagem"],
  "gerente": ["Gestão de Projetos", "Liderança", "Scrum", "Agile", "Comunicação", "Planejamento Estratégico"],
  "marketing": ["SEO", "Google Analytics", "Mídias Sociais", "Marketing Digital", "Copywriting", "Inbound Marketing"],
  "dados": ["Python", "SQL", "Machine Learning", "Power BI", "Excel", "Estatística", "Data Visualization"],
  "produto": ["Product Management", "Roadmap", "User Stories", "Analytics", "A/B Testing", "Jira"],
};

export const SkillSuggestions: React.FC<SkillSuggestionsProps> = ({
  role,
  onAddSkill,
  currentSkills,
}) => {
  const getSuggestions = () => {
    const roleLower = role.toLowerCase();
    for (const [key, skills] of Object.entries(SKILL_SUGGESTIONS)) {
      if (roleLower.includes(key)) {
        return skills.filter((skill) => !currentSkills.includes(skill));
      }
    }
    return [];
  };

  const suggestions = getSuggestions();

  if (suggestions.length === 0 || !role) {
    return null;
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 animate-in fade-in-0 slide-in-from-top-2">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-sm font-medium text-primary">
          Sugestões baseadas no seu cargo
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((skill) => (
          <Badge
            key={skill}
            variant="outline"
            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors border-primary/40"
            onClick={() => onAddSkill(skill)}
          >
            + {skill}
          </Badge>
        ))}
      </div>
    </div>
  );
};
