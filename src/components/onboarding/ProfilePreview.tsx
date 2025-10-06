import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Award, Target } from "lucide-react";

interface ProfilePreviewProps {
  headline?: string;
  yearsExperience?: number;
  skills?: string[];
  currentRole?: string;
  currentCompany?: string;
}

export const ProfilePreview: React.FC<ProfilePreviewProps> = ({
  headline,
  yearsExperience,
  skills = [],
  currentRole,
  currentCompany,
}) => {
  const completionPercentage = Math.min(
    ((headline ? 20 : 0) +
      (yearsExperience ? 20 : 0) +
      (skills.length > 0 ? 30 : 0) +
      (currentRole ? 15 : 0) +
      (currentCompany ? 15 : 0)),
    100
  );

  return (
    <Card className="sticky top-6 animate-in fade-in-0 slide-in-from-right-5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Seu Perfil
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Completion Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Completude</span>
            <span className="font-semibold text-primary">{completionPercentage}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="space-y-3 pt-2">
          {headline ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Título</p>
              <p className="text-sm font-semibold">{headline}</p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">Adicione seu título profissional</div>
          )}

          {yearsExperience !== undefined && yearsExperience > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span>{yearsExperience} anos de experiência</span>
            </div>
          )}

          {currentRole && currentCompany && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Posição Atual</p>
              <p className="text-sm">
                <span className="font-semibold">{currentRole}</span>
                <span className="text-muted-foreground"> na {currentCompany}</span>
              </p>
            </div>
          )}

          {skills.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Habilidades ({skills.length})</p>
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 6).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {skills.length > 6 && (
                  <Badge variant="outline" className="text-xs">
                    +{skills.length - 6}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Motivational Message */}
        {completionPercentage < 100 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                {completionPercentage < 50
                  ? "Continue preenchendo para aumentar suas chances!"
                  : "Quase lá! Complete seu perfil para resultados incríveis."}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
