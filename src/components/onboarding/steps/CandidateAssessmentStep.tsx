import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { BarChart3, Target, TrendingUp, Heart } from "lucide-react";

// Schema for assessment responses (30 questions, scale 1-5)
const assessmentSchema = z.object({
  // Compensation questions (7 questions)
  comp_1: z.number().min(1).max(5),
  comp_2: z.number().min(1).max(5),
  comp_3: z.number().min(1).max(5),
  comp_4: z.number().min(1).max(5),
  comp_5: z.number().min(1).max(5),
  comp_6: z.number().min(1).max(5),
  comp_7: z.number().min(1).max(5),
  
  // Ambiente questions (8 questions)
  env_1: z.number().min(1).max(5),
  env_2: z.number().min(1).max(5),
  env_3: z.number().min(1).max(5),
  env_4: z.number().min(1).max(5),
  env_5: z.number().min(1).max(5),
  env_6: z.number().min(1).max(5),
  env_7: z.number().min(1).max(5),
  env_8: z.number().min(1).max(5),
  
  // Propósito questions (8 questions)
  purpose_1: z.number().min(1).max(5),
  purpose_2: z.number().min(1).max(5),
  purpose_3: z.number().min(1).max(5),
  purpose_4: z.number().min(1).max(5),
  purpose_5: z.number().min(1).max(5),
  purpose_6: z.number().min(1).max(5),
  purpose_7: z.number().min(1).max(5),
  purpose_8: z.number().min(1).max(5),
  
  // Crescimento questions (7 questions)
  growth_1: z.number().min(1).max(5),
  growth_2: z.number().min(1).max(5),
  growth_3: z.number().min(1).max(5),
  growth_4: z.number().min(1).max(5),
  growth_5: z.number().min(1).max(5),
  growth_6: z.number().min(1).max(5),
  growth_7: z.number().min(1).max(5),
});

type AssessmentData = z.infer<typeof assessmentSchema>;

interface StepProps {
  onNext: (data: AssessmentData & { pillar_scores: any; archetype: string }) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: AssessmentData;
}

// Questions based on MATCH RAVYZ methodology
const QUESTIONS = [
  // Compensation Pillar (7 questions)
  { key: "comp_1", pillar: "Compensation", text: "Salário competitivo é fundamental para minha satisfação no trabalho", icon: BarChart3 },
  { key: "comp_2", pillar: "Compensation", text: "Priorizo benefícios financeiros em relação a outros aspectos do trabalho", icon: BarChart3 },
  { key: "comp_3", pillar: "Compensation", text: "Valorizo participação nos lucros ou equity da empresa", icon: BarChart3 },
  { key: "comp_4", pillar: "Compensation", text: "Bonificações por performance são importantes para minha motivação", icon: BarChart3 },
  { key: "comp_5", pillar: "Compensation", text: "Prefiro transparência total sobre a estrutura salarial da empresa", icon: BarChart3 },
  { key: "comp_6", pillar: "Compensation", text: "Estabilidade financeira é mais importante que crescimento rápido", icon: BarChart3 },
  { key: "comp_7", pillar: "Compensation", text: "Aceito menor salário por benefícios não-monetários valiosos", icon: BarChart3 },

  // Ambiente Pillar (8 questions)
  { key: "env_1", pillar: "Ambiente", text: "Prefiro trabalhar em equipes colaborativas e unidas", icon: Heart },
  { key: "env_2", pillar: "Ambiente", text: "Valorizo flexibilidade de horários e local de trabalho", icon: Heart },
  { key: "env_3", pillar: "Ambiente", text: "Um ambiente descontraído e informal me motiva mais", icon: Heart },
  { key: "env_4", pillar: "Ambiente", text: "Estrutura hierárquica clara é importante para meu trabalho", icon: Heart },
  { key: "env_5", pillar: "Ambiente", text: "Comunicação aberta e feedback constante são essenciais", icon: Heart },
  { key: "env_6", pillar: "Ambiente", text: "Prefiro ambientes de alta performance e competitividade", icon: Heart },
  { key: "env_7", pillar: "Ambiente", text: "Diversidade e inclusão são valores fundamentais para mim", icon: Heart },
  { key: "env_8", pillar: "Ambiente", text: "Trabalho remoto é mais produtivo que presencial para mim", icon: Heart },

  // Propósito Pillar (8 questions)
  { key: "purpose_1", pillar: "Propósito", text: "É importante que meu trabalho gere impacto social positivo", icon: Target },
  { key: "purpose_2", pillar: "Propósito", text: "Preciso me sentir alinhado com a missão da empresa", icon: Target },
  { key: "purpose_3", pillar: "Propósito", text: "Valorizo empresas com responsabilidade ambiental", icon: Target },
  { key: "purpose_4", pillar: "Propósito", text: "Meu trabalho deve estar conectado aos meus valores pessoais", icon: Target },
  { key: "purpose_5", pillar: "Propósito", text: "Prefiro empresas que contribuem para causas sociais", icon: Target },
  { key: "purpose_6", pillar: "Propósito", text: "O significado do trabalho é mais importante que o salário", icon: Target },
  { key: "purpose_7", pillar: "Propósito", text: "Busco empresas com cultura de inovação e transformação", icon: Target },
  { key: "purpose_8", pillar: "Propósito", text: "É fundamental sentir que faço diferença no que faço", icon: Target },

  // Crescimento Pillar (7 questions)
  { key: "growth_1", pillar: "Crescimento", text: "Oportunidades de desenvolvimento são prioridade na minha carreira", icon: TrendingUp },
  { key: "growth_2", pillar: "Crescimento", text: "Valorizo programas de mentoria e coaching", icon: TrendingUp },
  { key: "growth_3", pillar: "Crescimento", text: "Prefiro empresas que investem em capacitação dos funcionários", icon: TrendingUp },
  { key: "growth_4", pillar: "Crescimento", text: "Busco roles com clara progressão de carreira", icon: TrendingUp },
  { key: "growth_5", pillar: "Crescimento", text: "Desafios técnicos complexos me motivam profissionalmente", icon: TrendingUp },
  { key: "growth_6", pillar: "Crescimento", text: "Prefiro ambientes que promovem aprendizado contínuo", icon: TrendingUp },
  { key: "growth_7", pillar: "Crescimento", text: "Aceito mais responsabilidades para acelerar meu crescimento", icon: TrendingUp },
];

const CandidateAssessmentStep: React.FC<StepProps> = ({ onNext, data, isLoading }) => {
  const form = useForm<AssessmentData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: data || {},
  });

  const watchedValues = form.watch();
  const answeredQuestions = Object.keys(watchedValues).filter(key => watchedValues[key as keyof AssessmentData] !== undefined).length;
  const progress = (answeredQuestions / QUESTIONS.length) * 100;

  const calculateScores = (responses: AssessmentData) => {
    const pillarScores = {
      compensation: 0,
      ambiente: 0,
      proposito: 0,
      crescimento: 0,
    };

    // Calculate average score for each pillar
    const compScores = [responses.comp_1, responses.comp_2, responses.comp_3, responses.comp_4, responses.comp_5, responses.comp_6, responses.comp_7];
    pillarScores.compensation = compScores.reduce((sum, score) => sum + score, 0) / compScores.length;

    const envScores = [responses.env_1, responses.env_2, responses.env_3, responses.env_4, responses.env_5, responses.env_6, responses.env_7, responses.env_8];
    pillarScores.ambiente = envScores.reduce((sum, score) => sum + score, 0) / envScores.length;

    const purposeScores = [responses.purpose_1, responses.purpose_2, responses.purpose_3, responses.purpose_4, responses.purpose_5, responses.purpose_6, responses.purpose_7, responses.purpose_8];
    pillarScores.proposito = purposeScores.reduce((sum, score) => sum + score, 0) / purposeScores.length;

    const growthScores = [responses.growth_1, responses.growth_2, responses.growth_3, responses.growth_4, responses.growth_5, responses.growth_6, responses.growth_7];
    pillarScores.crescimento = growthScores.reduce((sum, score) => sum + score, 0) / growthScores.length;

    return pillarScores;
  };

  const determineArchetype = (pillarScores: any) => {
    const maxScore = Math.max(
      pillarScores.compensation,
      pillarScores.ambiente,
      pillarScores.proposito,
      pillarScores.crescimento
    );

    // Determine archetype based on highest scoring pillar
    if (pillarScores.compensation === maxScore) {
      return "Pragmático";
    } else if (pillarScores.ambiente === maxScore) {
      return "Colaborativo";
    } else if (pillarScores.proposito === maxScore) {
      return "Visionário";
    } else {
      return "Ambicioso";
    }
  };

  const handleSubmit = (formData: AssessmentData) => {
    const pillarScores = calculateScores(formData);
    const archetype = determineArchetype(pillarScores);
    
    onNext({
      ...formData,
      pillar_scores: pillarScores,
      archetype,
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Avaliação de Perfil Profissional
        </h2>
        <p className="text-muted-foreground">
          Responda às questões abaixo para identificarmos seu perfil e preferências profissionais
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso</span>
            <span className="text-foreground font-medium">
              {answeredQuestions} de {QUESTIONS.length} questões
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {QUESTIONS.map((question, index) => {
            const IconComponent = question.icon;
            return (
              <Card key={question.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-primary">{question.pillar}</span>
                        <span className="text-sm text-muted-foreground">#{index + 1}</span>
                      </div>
                      <p className="text-foreground font-medium">{question.text}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name={question.key as keyof AssessmentData}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(Number(value))}
                            value={field.value?.toString()}
                            className="flex space-x-6"
                          >
                            {[1, 2, 3, 4, 5].map((value) => (
                              <div key={value} className="flex items-center space-x-2">
                                <RadioGroupItem value={value.toString()} id={`${question.key}-${value}`} />
                                <Label htmlFor={`${question.key}-${value}`} className="text-sm">
                                  {value === 1 && "Discordo totalmente"}
                                  {value === 2 && "Discordo"}
                                  {value === 3 && "Neutro"}
                                  {value === 4 && "Concordo"}
                                  {value === 5 && "Concordo totalmente"}
                                </Label>
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
            );
          })}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              size="lg" 
              disabled={isLoading || answeredQuestions < QUESTIONS.length}
            >
              {isLoading ? "Processando..." : "Finalizar Avaliação"}
            </Button>
          </div>
        </form>
      </Form>

      {/* Instructions */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-2">💡 Como responder:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Seja honesto em suas respostas</li>
            <li>• Pense na sua situação ideal de trabalho</li>
            <li>• Não há respostas certas ou erradas</li>
            <li>• Use a escala de 1 a 5 para expressar o quanto concorda com cada afirmação</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateAssessmentStep;