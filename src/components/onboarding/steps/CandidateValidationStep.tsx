import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const validationSchema = z.object({
  workPace: z.enum(["urgent", "dynamic", "balanced", "calm", "relaxed"], {
    required_error: "Selecione seu ritmo de trabalho preferido",
  }),
  decisionMaking: z.enum(["intuitive", "basicData", "balanced", "detailedData", "exhaustive"], {
    required_error: "Selecione como você toma decisões",
  }),
  communication: z.enum(["direct", "contextual", "balanced", "detailed", "formal"], {
    required_error: "Selecione seu estilo de comunicação",
  }),
  learningStyle: z.enum(["practice", "theoryPractice", "mentorship", "theoryFirst", "structured"], {
    required_error: "Selecione sua forma preferida de aprendizado",
  }),
});

type ValidationData = z.infer<typeof validationSchema>;

interface StepProps {
  onNext: (data: ValidationData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: ValidationData;
}

const questions = [
  {
    key: "workPace" as keyof ValidationData,
    label: "Seu ritmo e estilo de trabalho ideal",
    options: [
      { value: "urgent", label: "Ritmo acelerado, sempre com urgência", description: "Prefiro ambientes dinâmicos com prazos curtos" },
      { value: "dynamic", label: "Ritmo dinâmico, mas com planejamento", description: "Gosto de velocidade, mas organizado" },
      { value: "balanced", label: "Ritmo equilibrado, sem pressa excessiva", description: "Busco equilíbrio entre eficiência e qualidade" },
      { value: "calm", label: "Ritmo mais calmo, com tempo para reflexão", description: "Valorizo tempo para pensar e analisar" },
      { value: "relaxed", label: "Ritmo bem tranquilo, sem pressão", description: "Prefiro trabalhar sem pressão de tempo" },
    ],
  },
  {
    key: "decisionMaking" as keyof ValidationData,
    label: "Seu processo de tomada de decisão",
    options: [
      { value: "intuitive", label: "Decido rapidamente, confio na intuição", description: "Uso experiência e instinto para decidir" },
      { value: "basicData", label: "Analiso dados básicos e decido", description: "Busco informações essenciais antes de decidir" },
      { value: "balanced", label: "Busco equilíbrio entre análise e intuição", description: "Combino dados com experiência" },
      { value: "detailedData", label: "Preciso de dados detalhados para decidir", description: "Analiso informações profundamente" },
      { value: "exhaustive", label: "Analiso exaustivamente antes de decidir", description: "Exploro todas as possibilidades antes de decidir" },
    ],
  },
  {
    key: "communication" as keyof ValidationData,
    label: "Seu estilo de comunicação preferido",
    options: [
      { value: "direct", label: "Comunicação direta e objetiva", description: "Vou direto ao ponto" },
      { value: "contextual", label: "Clara, mas com contexto", description: "Explico o necessário com clareza" },
      { value: "balanced", label: "Equilibrada entre formal e informal", description: "Adapto conforme o contexto" },
      { value: "detailed", label: "Mais elaborada e detalhada", description: "Gosto de explicar com profundidade" },
      { value: "formal", label: "Formal e muito estruturada", description: "Prefiro comunicação profissional e organizada" },
    ],
  },
  {
    key: "learningStyle" as keyof ValidationData,
    label: "Sua forma preferida de aprendizado",
    options: [
      { value: "practice", label: "Experimentando e errando na prática", description: "Aprendo fazendo e testando" },
      { value: "theoryPractice", label: "Combinando teoria e prática", description: "Gosto de entender e depois aplicar" },
      { value: "mentorship", label: "Com mentoria e feedback constante", description: "Aprendo melhor com orientação" },
      { value: "theoryFirst", label: "Estudando teoria antes da prática", description: "Prefiro dominar conceitos primeiro" },
      { value: "structured", label: "Cursos estruturados e certificações", description: "Valorizo aprendizado formal e estruturado" },
    ],
  },
];

const CandidateValidationStep: React.FC<StepProps> = ({ onNext, data }) => {
  const form = useForm<ValidationData>({
    resolver: zodResolver(validationSchema),
    defaultValues: data || {},
  });

  const onSubmit = (formData: ValidationData) => {
    onNext(formData);
  };

  const calculateCulturalScore = (responses: ValidationData): number => {
    // Simple scoring algorithm - can be enhanced
    const scores: Record<string, number> = {
      workPace: responses.workPace === 'balanced' ? 10 : responses.workPace === 'dynamic' ? 9 : 7,
      decisionMaking: responses.decisionMaking === 'balanced' ? 10 : responses.decisionMaking === 'basicData' ? 9 : 7,
      communication: responses.communication === 'balanced' ? 10 : responses.communication === 'contextual' ? 9 : 7,
      learningStyle: responses.learningStyle === 'theoryPractice' ? 10 : responses.learningStyle === 'mentorship' ? 9 : 7,
    };
    
    return Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Vamos conhecer seu perfil cultural
        </h2>
        <p className="text-muted-foreground">
          Essas perguntas nos ajudam a encontrar empresas com culturas compatíveis com você
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {questions.map((question) => (
            <Card key={question.key}>
              <CardHeader>
                <CardTitle className="text-lg">{question.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name={question.key}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup
                          value={field.value}
                          onValueChange={field.onChange}
                          className="space-y-3"
                        >
                          {question.options.map((option) => (
                            <Label
                              key={option.value}
                              htmlFor={`${question.key}-${option.value}`}
                              className="flex items-start space-x-3 rounded-lg border-2 border-border p-4 cursor-pointer hover:bg-accent/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-accent"
                            >
                              <RadioGroupItem
                                value={option.value}
                                id={`${question.key}-${option.value}`}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-foreground">
                                  {option.label}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {option.description}
                                </div>
                              </div>
                            </Label>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              size="lg"
              className="min-w-[140px]"
            >
              {form.formState.isSubmitting ? "Salvando..." : "Continuar"}
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default CandidateValidationStep;