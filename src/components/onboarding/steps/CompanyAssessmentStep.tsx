import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';

// Job assessment questions (30 questions across 5 pillars)
const JOB_ASSESSMENT_QUESTIONS = [
  // Autonomia (6 questions)
  { id: 'autonomy_1', text: 'Esta vaga permite tomada de decisões independentes?', pillar: 'autonomy' },
  { id: 'autonomy_2', text: 'O colaborador pode definir seus próprios métodos de trabalho?', pillar: 'autonomy' },
  { id: 'autonomy_3', text: 'Há flexibilidade para gerenciar o próprio tempo?', pillar: 'autonomy' },
  { id: 'autonomy_4', text: 'A supervisão é mais orientativa do que controladora?', pillar: 'autonomy' },
  { id: 'autonomy_5', text: 'O colaborador pode priorizar suas próprias tarefas?', pillar: 'autonomy' },
  { id: 'autonomy_6', text: 'Há liberdade para inovar e experimentar?', pillar: 'autonomy' },

  // Liderança (6 questions)
  { id: 'leadership_1', text: 'Esta vaga envolve liderar equipes?', pillar: 'leadership' },
  { id: 'leadership_2', text: 'O papel inclui mentoria de outros profissionais?', pillar: 'leadership' },
  { id: 'leadership_3', text: 'Há responsabilidade por resultados da equipe?', pillar: 'leadership' },
  { id: 'leadership_4', text: 'A posição requer tomada de decisões estratégicas?', pillar: 'leadership' },
  { id: 'leadership_5', text: 'O colaborador representa a empresa externamente?', pillar: 'leadership' },
  { id: 'leadership_6', text: 'Há autoridade para delegar responsabilidades?', pillar: 'leadership' },

  // Trabalho em Grupo (6 questions)
  { id: 'teamwork_1', text: 'O trabalho é predominantemente colaborativo?', pillar: 'teamwork' },
  { id: 'teamwork_2', text: 'Há necessidade de coordenação constante com outros?', pillar: 'teamwork' },
  { id: 'teamwork_3', text: 'Os projetos dependem de múltiplas pessoas?', pillar: 'teamwork' },
  { id: 'teamwork_4', text: 'A comunicação interpessoal é fundamental?', pillar: 'teamwork' },
  { id: 'teamwork_5', text: 'O sucesso depende da sinergia da equipe?', pillar: 'teamwork' },
  { id: 'teamwork_6', text: 'Há reuniões frequentes de alinhamento?', pillar: 'teamwork' },

  // Risco (6 questions)
  { id: 'risk_1', text: 'A vaga envolve decisões de alto impacto?', pillar: 'risk' },
  { id: 'risk_2', text: 'Há tolerância para experimentação e falhas?', pillar: 'risk' },
  { id: 'risk_3', text: 'O ambiente de trabalho é dinâmico e incerto?', pillar: 'risk' },
  { id: 'risk_4', text: 'São necessárias decisões rápidas sob pressão?', pillar: 'risk' },
  { id: 'risk_5', text: 'A inovação é valorizada sobre a estabilidade?', pillar: 'risk' },
  { id: 'risk_6', text: 'Há responsabilidade por investimentos ou recursos significativos?', pillar: 'risk' },

  // Ambição (6 questions)
  { id: 'ambition_1', text: 'A vaga oferece oportunidades de crescimento rápido?', pillar: 'ambition' },
  { id: 'ambition_2', text: 'Há perspectivas claras de promoção?', pillar: 'ambition' },
  { id: 'ambition_3', text: 'O papel permite desenvolver novas competências?', pillar: 'ambition' },
  { id: 'ambition_4', text: 'Há acesso a projetos desafiadores?', pillar: 'ambition' },
  { id: 'ambition_5', text: 'A empresa investe no desenvolvimento profissional?', pillar: 'ambition' },
  { id: 'ambition_6', text: 'Há possibilidade de liderança futura?', pillar: 'ambition' }
];

// Schema for form validation
const companyAssessmentSchema = z.object(
  JOB_ASSESSMENT_QUESTIONS.reduce((acc, question) => {
    acc[question.id] = z.number().min(1, 'Resposta obrigatória').max(5);
    return acc;
  }, {} as Record<string, z.ZodNumber>)
);

type CompanyAssessmentData = z.infer<typeof companyAssessmentSchema>;

interface CompanyAssessmentStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  isLoading?: boolean;
  data?: any;
}

export default function CompanyAssessmentStep({ 
  onNext, 
  onBack, 
  isLoading = false, 
  data 
}: CompanyAssessmentStepProps) {
  const form = useForm<CompanyAssessmentData>({
    resolver: zodResolver(companyAssessmentSchema),
    defaultValues: data || {}
  });

  const handleSubmit = (formData: CompanyAssessmentData) => {
    // Calculate pillar scores
    const pillarScores = {
      autonomy: 0,
      leadership: 0,
      teamwork: 0,
      risk: 0,
      ambition: 0
    };

    // Sum scores for each pillar
    JOB_ASSESSMENT_QUESTIONS.forEach(question => {
      const score = formData[question.id as keyof CompanyAssessmentData];
      pillarScores[question.pillar as keyof typeof pillarScores] += score;
    });

    // Calculate averages (6 questions per pillar)
    Object.keys(pillarScores).forEach(pillar => {
      pillarScores[pillar as keyof typeof pillarScores] = 
        pillarScores[pillar as keyof typeof pillarScores] / 6;
    });

    // Determine archetype based on highest scores
    const archetype = determineJobArchetype(pillarScores);

    onNext({
      responses: formData,
      pillar_scores: pillarScores,
      archetype
    });
  };

  const determineJobArchetype = (scores: any) => {
    const { autonomy, leadership, teamwork, risk, ambition } = scores;
    
    if (leadership >= 4 && ambition >= 4) return 'Líder Estratégico';
    if (autonomy >= 4 && risk >= 4) return 'Inovador';
    if (teamwork >= 4 && leadership >= 3.5) return 'Facilitador';
    if (ambition >= 4 && autonomy >= 3.5) return 'Escalador';
    if (teamwork >= 4 && autonomy <= 3) return 'Colaborador';
    if (risk <= 2.5 && autonomy <= 3) return 'Executor';
    
    return 'Equilibrado';
  };

  const watchedValues = form.watch();
  const answeredQuestions = Object.values(watchedValues).filter(value => value !== undefined).length;
  const progress = (answeredQuestions / JOB_ASSESSMENT_QUESTIONS.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assessment da Vaga</CardTitle>
          <CardDescription>
            Responda as perguntas sobre as características desta vaga (escala de 1 a 5)
          </CardDescription>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {answeredQuestions} de {JOB_ASSESSMENT_QUESTIONS.length} perguntas respondidas
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {JOB_ASSESSMENT_QUESTIONS.map((question, index) => (
                <FormField
                  key={question.id}
                  control={form.control}
                  name={question.id as keyof CompanyAssessmentData}
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-medium">
                        {index + 1}. {question.text}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                          className="flex space-x-2"
                        >
                          {[1, 2, 3, 4, 5].map((value) => (
                            <div key={value} className="flex items-center space-x-2">
                              <RadioGroupItem value={value.toString()} id={`${question.id}-${value}`} />
                              <label 
                                htmlFor={`${question.id}-${value}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {value}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Discordo totalmente</span>
                        <span>Concordo totalmente</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              
              <div className="flex gap-4 pt-6">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                  Voltar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Processando...' : 'Finalizar Assessment'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}