import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { ChevronRight, ChevronLeft, Plus, X, Check } from "lucide-react";
import { SkillSuggestions } from "@/components/onboarding/SkillSuggestions";

const skillsSchema = z.object({
  skills: z.array(z.string()).min(3, "Adicione pelo menos 3 habilidades"),
});

type SkillsData = z.infer<typeof skillsSchema>;

interface SkillsStepProps {
  onNext: (data: SkillsData) => void;
  onBack: () => void;
  data?: SkillsData;
  headline?: string;
}

export const SkillsStep: React.FC<SkillsStepProps> = ({ onNext, onBack, data, headline }) => {
  const [newSkill, setNewSkill] = useState("");
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  const form = useForm<SkillsData>({
    resolver: zodResolver(skillsSchema),
    defaultValues: data || {
      skills: [],
    },
  });

  const addSkill = (skill?: string) => {
    const skillToAdd = skill || newSkill;
    if (skillToAdd.trim()) {
      const currentSkills = form.getValues("skills") || [];
      if (!currentSkills.includes(skillToAdd.trim())) {
        form.setValue("skills", [...currentSkills, skillToAdd.trim()]);
        setNewSkill("");
        setShowSuccessCheck(true);
        setTimeout(() => setShowSuccessCheck(false), 1000);
      }
    }
  };

  const removeSkill = (index: number) => {
    const currentSkills = form.getValues("skills");
    form.setValue("skills", currentSkills.filter((_, i) => i !== index));
  };

  const onSubmit = (formData: SkillsData) => {
    onNext(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <span>🎯</span> Suas Habilidades
        </h2>
        <p className="text-muted-foreground">
          Mostre o que você sabe fazer
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💪</span> Principais Habilidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma habilidade e pressione Enter..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={() => addSkill()} 
                  size="sm"
                  className="min-w-[60px]"
                >
                  {showSuccessCheck ? (
                    <Check className="w-4 h-4 animate-in zoom-in-0" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <SkillSuggestions
                role={headline || ""}
                onAddSkill={addSkill}
                currentSkills={form.watch("skills") || []}
              />

              <div className="flex flex-wrap gap-2 min-h-[80px] p-4 border-2 border-dashed border-border rounded-lg">
                {(form.watch("skills") || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    Adicione suas habilidades aqui...
                  </p>
                ) : (
                  (form.watch("skills") || []).map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="gap-1 animate-in fade-in-0 zoom-in-95"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
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
                name="skills"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <p className="text-xs text-muted-foreground">
                💡 Adicione pelo menos 3 habilidades. Quanto mais, melhor!
              </p>
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
