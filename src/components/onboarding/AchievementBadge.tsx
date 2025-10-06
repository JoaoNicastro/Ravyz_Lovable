import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Trophy, Zap, Target, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const BADGES: Badge[] = [
  {
    id: "first_skill",
    title: "Primeira Habilidade",
    description: "Adicionou sua primeira habilidade",
    icon: <Zap className="w-6 h-6" />,
    color: "text-yellow-500",
  },
  {
    id: "skill_master",
    title: "Especialista",
    description: "Adicionou 5+ habilidades",
    icon: <Star className="w-6 h-6" />,
    color: "text-blue-500",
  },
  {
    id: "profile_complete",
    title: "Perfil Completo",
    description: "Completou todas as informações",
    icon: <Trophy className="w-6 h-6" />,
    color: "text-purple-500",
  },
  {
    id: "goal_setter",
    title: "Visionário",
    description: "Definiu objetivos de carreira",
    icon: <Target className="w-6 h-6" />,
    color: "text-green-500",
  },
];

interface AchievementBadgeProps {
  skillCount: number;
  hasGoals: boolean;
  isComplete: boolean;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  skillCount,
  hasGoals,
  isComplete,
}) => {
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [showNotification, setShowNotification] = useState<Badge | null>(null);

  useEffect(() => {
    const newUnlocked: string[] = [];

    if (skillCount >= 1 && !unlockedBadges.includes("first_skill")) {
      newUnlocked.push("first_skill");
    }
    if (skillCount >= 5 && !unlockedBadges.includes("skill_master")) {
      newUnlocked.push("skill_master");
    }
    if (hasGoals && !unlockedBadges.includes("goal_setter")) {
      newUnlocked.push("goal_setter");
    }
    if (isComplete && !unlockedBadges.includes("profile_complete")) {
      newUnlocked.push("profile_complete");
    }

    if (newUnlocked.length > 0) {
      const latestBadge = BADGES.find((b) => b.id === newUnlocked[newUnlocked.length - 1]);
      if (latestBadge) {
        setShowNotification(latestBadge);
        setTimeout(() => setShowNotification(null), 3000);
      }
      setUnlockedBadges((prev) => [...prev, ...newUnlocked]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skillCount, hasGoals, isComplete]);

  if (unlockedBadges.length === 0) return null;

  return (
    <>
      {/* Badge Notification */}
      {showNotification && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right-5 fade-in-0">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className={cn("animate-bounce", showNotification.color)}>
                {showNotification.icon}
              </div>
              <div>
                <p className="font-bold text-sm">🎉 Conquista Desbloqueada!</p>
                <p className="text-sm font-semibold">{showNotification.title}</p>
                <p className="text-xs text-muted-foreground">{showNotification.description}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Badges Display */}
      <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Suas Conquistas
        </p>
        <div className="flex gap-2 flex-wrap">
          {BADGES.map((badge) => {
            const isUnlocked = unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={cn(
                  "p-2 rounded-lg border transition-all",
                  isUnlocked
                    ? "bg-background border-primary/30 shadow-sm"
                    : "bg-muted/50 border-muted opacity-40 grayscale"
                )}
                title={`${badge.title}: ${badge.description}`}
              >
                <div className={cn(isUnlocked ? badge.color : "text-muted-foreground")}>
                  {badge.icon}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {unlockedBadges.length} de {BADGES.length} desbloqueadas
        </p>
      </Card>
    </>
  );
};
