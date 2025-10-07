import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { InteractiveScale } from '@/components/onboarding/InteractiveScale';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const motivationalMessages = [
  { at: 10, message: "Ótimo progresso! Você está indo muito bem! 🎯", icon: Sparkles },
  { at: 20, message: "Já estamos na reta final! Continue assim! 🚀", icon: Sparkles },
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showMotivation, setShowMotivation] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const form = useForm<CandidateAssessmentData>({
    resolver: zodResolver(candidateAssessmentSchema),
    defaultValues: data || {}
  });

  const currentQuestion = CANDIDATE_ASSESSMENT_QUESTIONS[currentQuestionIndex];
  const totalQuestions = CANDIDATE_ASSESSMENT_QUESTIONS.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const answeredCount = Object.keys(form.getValues()).filter(key => 
    form.getValues()[key as keyof CandidateAssessmentData] !== undefined
  ).length;

  // Check for motivational message
  useEffect(() => {
    const motivationPoint = motivationalMessages.find(m => m.at === answeredCount);
    if (motivationPoint) {
      setShowMotivation(true);
      const timer = setTimeout(() => setShowMotivation(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [answeredCount]);

  const handleAnswerSelect = (value: number) => {
    setIsAnimating(true);
    
    // Set value in form
    form.setValue(currentQuestion.id as keyof CandidateAssessmentData, value);

    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentQuestionIndex < totalQuestions - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setIsAnimating(false);
      } else {
        // Last question - submit form
        form.handleSubmit(handleSubmit)();
      }
    }, 500);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

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

  const currentValue = form.watch(currentQuestion.id as keyof CandidateAssessmentData);
  const pillarName = currentQuestion.pillar === 'compensation' ? 'Remuneração' :
                      currentQuestion.pillar === 'ambiente' ? 'Ambiente' :
                      currentQuestion.pillar === 'proposito' ? 'Propósito' : 'Crescimento';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Assessment MATCH RAVYZ</h2>
            <p className="text-sm text-muted-foreground">
              Pergunta {currentQuestionIndex + 1} de {totalQuestions}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{Math.round(progress)}%</div>
            <div className="text-xs text-muted-foreground">Concluído</div>
          </div>
        </div>
        
        <Progress value={progress} className="h-2.5 transition-all duration-500" />

        {/* Pillar indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Pilar:</span>
          <span className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
            currentQuestion.pillar === 'compensation' && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
            currentQuestion.pillar === 'ambiente' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
            currentQuestion.pillar === 'proposito' && "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
            currentQuestion.pillar === 'crescimento' && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
          )}>
            {pillarName}
          </span>
        </div>
      </div>

      {/* Motivational Message */}
      {showMotivation && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 animate-fade-in">
          <CardContent className="py-4 px-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              <p className="font-medium text-primary">
                {motivationalMessages.find(m => m.at === answeredCount)?.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Question Card */}
      <Card className={cn(
        "transition-all duration-300",
        isAnimating && "opacity-50 scale-95"
      )}>
        <CardContent className="py-12 px-6 md:px-12">
          <div className="space-y-8">
            {/* Question Text */}
            <div className="text-center space-y-4 animate-fade-in">
              <h3 className="text-2xl md:text-3xl font-semibold leading-tight">
                {currentQuestion.text}
              </h3>
              {currentQuestion.isContrasting && (
                <p className="text-sm text-muted-foreground">
                  (Pergunta contrastante - ajuda a validar consistência)
                </p>
              )}
            </div>

            {/* Interactive Scale */}
            <div className="animate-fade-in">
              <InteractiveScale
                value={currentValue}
                onChange={handleAnswerSelect}
                disabled={isAnimating}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={currentQuestionIndex === 0 ? onBack : handlePrevious}
          disabled={isLoading}
          size="lg"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {currentQuestionIndex === 0 ? 'Voltar' : 'Anterior'}
        </Button>

        <div className="text-sm text-muted-foreground">
          {answeredCount === totalQuestions ? (
            <span className="text-success font-medium">Todas as perguntas respondidas! ✓</span>
          ) : (
            <span>{answeredCount} de {totalQuestions} respondidas</span>
          )}
        </div>

        {currentQuestionIndex < totalQuestions - 1 ? (
          <Button
            variant="ghost"
            onClick={handleNext}
            disabled={!currentValue || isLoading}
            size="lg"
          >
            Próxima
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={answeredCount < totalQuestions || isLoading}
            size="lg"
          >
            {isLoading ? 'Processando...' : 'Finalizar Assessment'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
