import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { AddableInput } from "@/components/onboarding/AddableInput";

const achievementsSchema = z.object({
  keyAchievements: z.array(z.string()).min(1, "Selecione pelo menos uma conquista"),
  keyAchievementsOther: z.array(z.string()).default([]),
});

type AchievementsData = z.infer<typeof achievementsSchema>;

interface AchievementsStepProps {
  onNext: (data: AchievementsData) => void;
  onBack: () => void;
  data?: AchievementsData;
}

const achievementOptions = [
  "Liderança de equipe ou projeto",
  "Aumento de performance/eficiência",
  "Redução de custos",
  "Implementação de novo sistema/tecnologia",
  "Melhoria de processos",
  "Crescimento de receita/vendas",
  "Reconhecimento ou premiação",
  "Mentoria de colaboradores",
  "Certificação ou especialização",
  "Resolução de problema crítico",
  "Lançamento de produto bem-sucedido",
  "Expansão para novos mercados"
];

export const AchievementsStep: React.FC<AchievementsStepProps> = ({ onNext, onBack, data }) => {
  const [selectedAchievements, setSelectedAchievements] = useState<string[]>(data?.keyAchievements || []);
  
  const form = useForm<AchievementsData>({
    resolver: zodResolver(achievementsSchema),
    defaultValues: data || {
      keyAchievements: [],
    },
  });

  const toggleAchievement = (achievement: string) => {
    const updated = selectedAchievements.includes(achievement)
      ? selectedAchievements.filter(a => a !== achievement)
      : [...selectedAchievements, achievement];
    
    setSelectedAchievements(updated);
    form.setValue("keyAchievements", updated, { shouldValidate: true });
  };

  const onSubmit = (formData: AchievementsData) => {
    onNext(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <span>🏆</span> Suas Conquistas
        </h2>
        <p className="text-muted-foreground">
          Do que você mais se orgulha?
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⭐</span> Principais Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormLabel className="text-base">Do que você mais se orgulha na sua carreira?</FormLabel>
              <FormDescription>
                Selecione as conquistas que destacam sua trajetória profissional
              </FormDescription>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {achievementOptions.map((achievement) => (
                  <button
                    key={achievement}
                    type="button"
                    onClick={() => toggleAchievement(achievement)}
                    className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                      selectedAchievements.includes(achievement)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/30"
                    }`}
                  >
                    {achievement}
                    {selectedAchievements.includes(achievement) && (
                      <CheckCircle className="w-3 h-3 inline ml-1" />
                    )}
                  </button>
                ))}
              </div>

              <FormField
                control={form.control}
                name="keyAchievements"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keyAchievementsOther"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">Outros (Opcional)</FormLabel>
                    <FormControl>
                      <AddableInput
                        placeholder="Adicione outras conquistas não listadas..."
                        value={field.value || []}
                        onChange={field.onChange}
                        description="💡 Seja específico e mencione resultados!"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              size="lg"
            >
              <ChevronLeft className="mr-2 w-4 h-4" />
              Voltar
            </Button>
            <Button
              type="submit"
              size="lg"
              className="min-w-[160px] bg-gradient-to-r from-primary to-primary/80"
            >
              Próximo
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
