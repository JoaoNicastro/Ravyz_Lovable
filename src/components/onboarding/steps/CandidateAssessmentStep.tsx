import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';

// MATCH RAVYZ Assessment Questions (30 questions across 4 pillars)
const CANDIDATE_ASSESSMENT_QUESTIONS = [
  // Compensation (Questions 1-7)
  { id: 'q1', text: 'O pacote de remuneração é o fator principal na sua escolha de uma vaga?', pillar: 'compensation' },
  { id: 'q2', text: 'Você aceitaria uma vaga menos alinhada aos seus valores em troca de uma remuneração maior?', pillar: 'compensation' },
  { id: 'q3', text: 'O reconhecimento financeiro imediato pesa mais do que perspectivas de longo prazo?', pillar: 'compensation' },
  { id: 'q4', text: 'Benefícios como bônus e stock options são determinantes na sua decisão?', pillar: 'compensation' },
  { id: 'q5', text: 'Você estaria disposto a mudar de emprego apenas por uma proposta financeira melhor?', pillar: 'compensation' },
  { id: 'q6', text: 'Você permaneceria numa empresa que paga menos, se tivesse crescimento e propósito claros?', pillar: 'compensation', isContrasting: true },
  { id: 'q7', text: 'Até que ponto remuneração influencia sua motivação no dia a dia?', pillar: 'compensation' },

  // Ambiente (Questions 8-14)
  { id: 'q8', text: 'A qualidade do relacionamento com colegas influencia fortemente seu desempenho?', pillar: 'ambiente' },
  { id: 'q9', text: 'Você prioriza empresas que têm líderes inspiradores e coerentes?', pillar: 'ambiente' },
  { id: 'q10', text: 'Para você, a cultura pesa tanto quanto o salário na decisão de aceitar uma vaga?', pillar: 'ambiente' },
  { id: 'q11', text: 'Você acredita que trabalhar com pessoas que respeita é essencial?', pillar: 'ambiente' },
  { id: 'q12', text: 'Ambientes de alta colaboração são mais importantes que ambientes altamente competitivos?', pillar: 'ambiente' },
  { id: 'q13', text: 'A reputação da empresa como lugar para se trabalhar pesa em sua decisão?', pillar: 'ambiente' },
  { id: 'q14', text: 'Você consegue manter alta performance mesmo em culturas que não se alinham totalmente com seus valores?', pillar: 'ambiente', isContrasting: true },

  // Propósito (Questions 15-21)
  { id: 'q15', text: 'Você só se engaja plenamente se acreditar na missão da empresa?', pillar: 'proposito' },
  { id: 'q16', text: 'A conexão entre valores pessoais e organizacionais é decisiva na sua permanência?', pillar: 'proposito' },
  { id: 'q17', text: 'Você abriria mão de parte do salário por um trabalho com propósito verdadeiro?', pillar: 'proposito' },
  { id: 'q18', text: 'É importante sentir que seu trabalho impacta positivamente pessoas ou sociedade?', pillar: 'proposito' },
  { id: 'q19', text: 'Você se vê como parte de algo maior quando escolhe uma empresa?', pillar: 'proposito' },
  { id: 'q20', text: 'Você consegue entregar resultados mesmo quando não acredita totalmente no propósito da empresa?', pillar: 'proposito', isContrasting: true },
  { id: 'q21', text: 'Trabalhar em algo que você acredita é mais importante do que estabilidade?', pillar: 'proposito' },

  // Crescimento (Questions 22-30)
  { id: 'q22', text: 'Você busca ativamente ambientes que aceleram sua curva de aprendizado?', pillar: 'crescimento' },
  { id: 'q23', text: 'A possibilidade de promoções rápidas é indispensável para você?', pillar: 'crescimento' },
  { id: 'q24', text: 'Você valoriza empresas que investem em formação contínua (treinamentos, cursos)?', pillar: 'crescimento' },
  { id: 'q25', text: 'O acesso a líderes mentores pesa na sua decisão de escolher uma vaga?', pillar: 'crescimento' },
  { id: 'q26', text: 'Oportunidades de assumir novos desafios são essenciais para seu engajamento?', pillar: 'crescimento' },
  { id: 'q27', text: 'Você se desmotiva quando percebe estagnação na sua curva de crescimento?', pillar: 'crescimento' },
  { id: 'q28', text: 'Você se sente confortável em uma função estável, mesmo que o aprendizado seja menor?', pillar: 'crescimento', isContrasting: true },
  { id: 'q29', text: 'Você valoriza mais experiências que ampliam suas competências do que benefícios imediatos?', pillar: 'crescimento' },
  { id: 'q30', text: 'Você mede seu sucesso pela sua evolução pessoal e profissional?', pillar: 'crescimento' }
];

// Schema for form validation
const candidateAssessmentSchema = z.object(
  CANDIDATE_ASSESSMENT_QUESTIONS.reduce((acc, question) => {
    acc[question.id] = z.number().min(1, 'Resposta obrigatória').max(5);
    return acc;
  }, {} as Record<string, z.ZodNumber>)
);

type CandidateAssessmentData = z.infer<typeof candidateAssessmentSchema>;

interface CandidateAssessmentStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  isLoading?: boolean;
  data?: any;
}

export default function CandidateAssessmentStep({ 
  onNext, 
  onBack, 
  isLoading = false, 
  data 
}: CandidateAssessmentStepProps) {
  const form = useForm<CandidateAssessmentData>({
    resolver: zodResolver(candidateAssessmentSchema),
    defaultValues: data || {}
  });

  const handleSubmit = (formData: CandidateAssessmentData) => {
    // Calculate pillar scores according to MATCH RAVYZ methodology
    const pillarScores = {
      compensation: 0,
      ambiente: 0,
      proposito: 0,
      crescimento: 0
    };

    const pillarCounts = {
      compensation: 0,
      ambiente: 0,
      proposito: 0,
      crescimento: 0
    };

    // Sum scores for each pillar
    CANDIDATE_ASSESSMENT_QUESTIONS.forEach(question => {
      const score = formData[question.id as keyof CandidateAssessmentData];
      const adjustedScore = question.isContrasting ? (6 - score) : score; // Invert contrasting questions
      
      pillarScores[question.pillar as keyof typeof pillarScores] += adjustedScore;
      pillarCounts[question.pillar as keyof typeof pillarCounts]++;
    });

    // Calculate averages for each pillar
    Object.keys(pillarScores).forEach(pillar => {
      pillarScores[pillar as keyof typeof pillarScores] = 
        pillarScores[pillar as keyof typeof pillarScores] / pillarCounts[pillar as keyof typeof pillarCounts];
    });

    // Determine archetype based on dominant pillars
    const archetype = determineArchetype(pillarScores);

    // Validate consistency (compare direct vs contrasting questions)
    const consistencyIssues = validateConsistency(formData);

    onNext({
      responses: formData,
      pillar_scores: pillarScores,
      archetype,
      consistency_issues: consistencyIssues
    });
  };

  const determineArchetype = (scores: any) => {
    // Get top 2 pillars
    const sortedPillars = Object.entries(scores)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2);

    const [pillar1, pillar2] = sortedPillars.map(([pillar]) => pillar);

    // Archetype mapping based on dominant pillars (from MATCH RAVYZ document)
    const archetypeMappings: Record<string, string> = {
      'crescimento_proposito': 'Protagonista',
      'proposito_crescimento': 'Protagonista',
      'ambiente_crescimento': 'Construtor',
      'crescimento_ambiente': 'Construtor',
      'proposito_ambiente': 'Visionário',
      'ambiente_proposito': 'Idealista',
      'compensation_ambiente': 'Guardião',
      'ambiente_compensation': 'Guardião',
      'compensation_crescimento': 'Pragmático',
      'crescimento_compensation': 'Pragmático',
      'crescimento_ambiente_alt': 'Mobilizador',
      'proposito_crescimento_alt': 'Transformador'
    };

    const key = `${pillar1}_${pillar2}`;
    return archetypeMappings[key] || 'Equilibrado';
  };

  const validateConsistency = (formData: CandidateAssessmentData) => {
    const issues: string[] = [];
    
    // Check contrasting questions vs their direct counterparts
    const contrastingChecks = [
      { direct: ['q1', 'q4', 'q5'], contrasting: 'q6', pillar: 'compensation' },
      { direct: ['q8', 'q10', 'q11'], contrasting: 'q14', pillar: 'ambiente' },
      { direct: ['q15', 'q16', 'q17'], contrasting: 'q20', pillar: 'proposito' },
      { direct: ['q22', 'q26', 'q27'], contrasting: 'q28', pillar: 'crescimento' }
    ];

    contrastingChecks.forEach(check => {
      const directAvg = check.direct.reduce((sum, q) => 
        sum + formData[q as keyof CandidateAssessmentData], 0) / check.direct.length;
      const contrastingScore = 6 - formData[check.contrasting as keyof CandidateAssessmentData]; // Inverted
      
      if (Math.abs(directAvg - contrastingScore) > 2) {
        issues.push(`Inconsistência detectada no pilar ${check.pillar}`);
      }
    });

    return issues;
  };

  const watchedValues = form.watch();
  const answeredQuestions = Object.values(watchedValues).filter(value => value !== undefined).length;
  const progress = (answeredQuestions / CANDIDATE_ASSESSMENT_QUESTIONS.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assessment MATCH RAVYZ</CardTitle>
          <CardDescription>
            Responda as perguntas sobre suas preferências e motivações profissionais (escala de 1 a 5)
          </CardDescription>
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {answeredQuestions} de {CANDIDATE_ASSESSMENT_QUESTIONS.length} perguntas respondidas
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {CANDIDATE_ASSESSMENT_QUESTIONS.map((question, index) => (
                <FormField
                  key={question.id}
                  control={form.control}
                  name={question.id as keyof CandidateAssessmentData}
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-medium">
                        {index + 1}. {question.text}
                        {question.isContrasting && (
                          <span className="text-xs text-muted-foreground ml-2">(pergunta contrastante)</span>
                        )}
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
              
              {/* Pillar Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                <div className="text-center">
                  <div className="font-semibold text-sm">Compensation</div>
                  <div className="text-xs text-muted-foreground">Perguntas 1-7</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">Ambiente</div>
                  <div className="text-xs text-muted-foreground">Perguntas 8-14</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">Propósito</div>
                  <div className="text-xs text-muted-foreground">Perguntas 15-21</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">Crescimento</div>
                  <div className="text-xs text-muted-foreground">Perguntas 22-30</div>
                </div>
              </div>
              
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