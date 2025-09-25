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
  workStyle: z.enum(["independent", "collaborative", "mixed"], {
    required_error: "Selecione seu estilo de trabalho preferido",
  }),
  workEnvironment: z.enum(["quiet", "dynamic", "flexible"], {
    required_error: "Selecione o ambiente de trabalho preferido",
  }),
  communication: z.enum(["direct", "diplomatic", "analytical"], {
    required_error: "Selecione seu estilo de comunicação",
  }),
  decisionMaking: z.enum(["quick", "deliberate", "collaborative"], {
    required_error: "Selecione como você toma decisões",
  }),
  workLifeBalance: z.enum(["high", "moderate", "flexible"], {
    required_error: "Selecione a importância do equilíbrio vida-trabalho",
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
    key: "workStyle" as keyof ValidationData,
    label: "Qual é seu estilo de trabalho preferido?",
    options: [
      { value: "independent", label: "Independente", description: "Prefiro trabalhar sozinho e ter autonomia" },
      { value: "collaborative", label: "Colaborativo", description: "Gosto de trabalhar em equipe e trocar ideias" },
      { value: "mixed", label: "Misto", description: "Depende do projeto e situação" },
    ],
  },
  {
    key: "workEnvironment" as keyof ValidationData,
    label: "Que tipo de ambiente de trabalho você prefere?",
    options: [
      { value: "quiet", label: "Tranquilo", description: "Ambiente silencioso e focado" },
      { value: "dynamic", label: "Dinâmico", description: "Ambiente movimentado e energético" },
      { value: "flexible", label: "Flexível", description: "Posso me adaptar a diferentes ambientes" },
    ],
  },
  {
    key: "communication" as keyof ValidationData,
    label: "Como você se comunica no trabalho?",
    options: [
      { value: "direct", label: "Direto", description: "Comunicação clara e objetiva" },
      { value: "diplomatic", label: "Diplomático", description: "Comunicação cuidadosa e respeitosa" },
      { value: "analytical", label: "Analítico", description: "Comunicação detalhada com dados" },
    ],
  },
  {
    key: "decisionMaking" as keyof ValidationData,
    label: "Como você toma decisões?",
    options: [
      { value: "quick", label: "Rápido", description: "Tomo decisões rapidamente com informações básicas" },
      { value: "deliberate", label: "Deliberado", description: "Analiso cuidadosamente antes de decidir" },
      { value: "collaborative", label: "Colaborativo", description: "Consulto outros antes de decidir" },
    ],
  },
  {
    key: "workLifeBalance" as keyof ValidationData,
    label: "Qual a importância do equilíbrio vida-trabalho para você?",
    options: [
      { value: "high", label: "Alta", description: "É fundamental para mim" },
      { value: "moderate", label: "Moderada", description: "Importante, mas posso ser flexível" },
      { value: "flexible", label: "Flexível", description: "Depende da fase da carreira e projeto" },
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
      workStyle: responses.workStyle === 'collaborative' ? 10 : responses.workStyle === 'mixed' ? 8 : 6,
      workEnvironment: responses.workEnvironment === 'flexible' ? 10 : 7,
      communication: responses.communication === 'diplomatic' ? 10 : responses.communication === 'analytical' ? 9 : 7,
      decisionMaking: responses.decisionMaking === 'collaborative' ? 10 : responses.decisionMaking === 'deliberate' ? 9 : 7,
      workLifeBalance: responses.workLifeBalance === 'moderate' ? 10 : responses.workLifeBalance === 'flexible' ? 9 : 8,
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
                            <div key={option.value} className="flex items-start space-x-3">
                              <RadioGroupItem
                                value={option.value}
                                id={`${question.key}-${option.value}`}
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <Label
                                  htmlFor={`${question.key}-${option.value}`}
                                  className="cursor-pointer block"
                                >
                                  <div className="font-medium text-foreground">
                                    {option.label}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {option.description}
                                  </div>
                                </Label>
                              </div>
                            </div>
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