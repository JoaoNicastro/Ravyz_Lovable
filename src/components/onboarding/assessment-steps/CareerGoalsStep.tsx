import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ChevronRight, ChevronLeft, Plus, X, CheckCircle } from "lucide-react";
import { AutocompleteInput } from "@/components/onboarding/AutocompleteInput";
import { JOB_ROLE_SUGGESTIONS } from "@/lib/job-suggestions";

const goalsSchema = z.object({
  careerGoals: z.array(z.string()).min(1, "Selecione pelo menos um objetivo"),
  careerGoalsOther: z.string().optional(),
  preferredRoles: z.array(z.string()).min(1, "Adicione pelo menos 1 cargo de interesse"),
});

type GoalsData = z.infer<typeof goalsSchema>;

interface CareerGoalsStepProps {
  onNext: (data: GoalsData) => void;
  onBack: () => void;
  data?: GoalsData;
}

const careerGoalOptions = [
  "Crescer como líder técnico",
  "Assumir cargo de gestão",
  "Especializar-me em nova tecnologia",
  "Trabalhar em projetos internacionais",
  "Empreender ou ter meu próprio negócio",
  "Tornar-me referência na área",
  "Trabalhar remotamente",
  "Equilibrar vida pessoal e profissional",
  "Aumentar minha remuneração significativamente",
  "Contribuir com projetos open source",
  "Mentorar outros profissionais",
  "Mudar de área/setor"
];

export const CareerGoalsStep: React.FC<CareerGoalsStepProps> = ({ onNext, onBack, data }) => {
  const [newRole, setNewRole] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data?.careerGoals || []);

  const form = useForm<GoalsData>({
    resolver: zodResolver(goalsSchema),
    defaultValues: data || {
      careerGoals: [],
      preferredRoles: [],
    },
  });

  const toggleGoal = (goal: string) => {
    const updated = selectedGoals.includes(goal)
      ? selectedGoals.filter(g => g !== goal)
      : [...selectedGoals, goal];
    
    setSelectedGoals(updated);
    form.setValue("careerGoals", updated, { shouldValidate: true });
  };

  const addRole = (roleValue?: string) => {
    const roleToAdd = roleValue || newRole;
    if (roleToAdd.trim()) {
      const currentRoles = form.getValues("preferredRoles") || [];
      if (!currentRoles.includes(roleToAdd.trim())) {
        form.setValue("preferredRoles", [...currentRoles, roleToAdd.trim()]);
        setNewRole("");
      }
    }
  };

  const removeRole = (index: number) => {
    const currentRoles = form.getValues("preferredRoles");
    form.setValue("preferredRoles", currentRoles.filter((_, i) => i !== index));
  };

  const onSubmit = (formData: GoalsData) => {
    onNext(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <span>🎯</span> Seus Objetivos
        </h2>
        <p className="text-muted-foreground">
          Onde você quer chegar?
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🚀</span> Objetivos de Carreira
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <FormLabel className="text-base">Onde você se vê daqui a alguns anos?</FormLabel>
                <FormDescription>
                  Selecione os objetivos que representam suas ambições profissionais
                </FormDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {careerGoalOptions.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                        selectedGoals.includes(goal)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/30"
                      }`}
                    >
                      {goal}
                      {selectedGoals.includes(goal) && (
                        <CheckCircle className="w-3 h-3 inline ml-1" />
                      )}
                    </button>
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="careerGoals"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="careerGoalsOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Outros (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Adicione outros objetivos não listados..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        💡 Seja ambicioso e específico!
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base">Quais cargos você deseja?</Label>
                <div className="flex gap-2">
                  <AutocompleteInput
                    suggestions={JOB_ROLE_SUGGESTIONS}
                    placeholder="ex: Senior Developer, Tech Lead..."
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onSelect={(value) => {
                      addRole(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addRole();
                      }
                    }}
                  />
                  <Button type="button" onClick={() => addRole()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[60px] p-4 border-2 border-dashed border-border rounded-lg">
                  {(form.watch("preferredRoles") || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Adicione os cargos que você deseja...
                    </p>
                  ) : (
                    (form.watch("preferredRoles") || []).map((role, index) => (
                      <Badge key={index} variant="outline" className="gap-1 animate-in fade-in-0 zoom-in-95">
                        {role}
                        <button
                          type="button"
                          onClick={() => removeRole(index)}
                          className="ml-1 hover:text-destructive transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="preferredRoles"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              Finalizar Etapa
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
