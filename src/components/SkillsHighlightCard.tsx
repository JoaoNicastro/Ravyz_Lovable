import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Skill {
  name: string;
  percentage: number;
}

interface SkillsHighlightCardProps {
  skills?: Skill[];
}

const getSkillColor = (percentage: number): string => {
  if (percentage >= 90) return "hsl(var(--success))";
  if (percentage >= 80) return "hsl(var(--warning))";
  return "hsl(var(--secondary-foreground))";
};

const mockSkills: Skill[] = [
  { name: "Product Management", percentage: 95 },
  { name: "Data Analysis", percentage: 88 },
  { name: "Agile/Scrum", percentage: 92 },
  { name: "UX/UI Design", percentage: 78 },
];

export function SkillsHighlightCard({ skills = mockSkills }: SkillsHighlightCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-bold">Competências Destacadas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {skills.map((skill, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{skill.name}</span>
              <span className="text-sm font-bold">{skill.percentage}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${skill.percentage}%`,
                  backgroundColor: getSkillColor(skill.percentage),
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
