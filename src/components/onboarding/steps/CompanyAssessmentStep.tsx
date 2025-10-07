import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InteractiveScale } from "@/components/onboarding/InteractiveScale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Company Assessment questions based on MATCH RAVYZ methodology (30 questions)
const JOB_ASSESSMENT_QUESTIONS = [
  // Autonomia / Mão na Massa (Q1-Q6)
  { id: "q1", text: "Esta pessoa terá liberdade para tomar decisões sem precisar de aprovação constante?", pillar: "autonomy" },
  { id: "q2", text: "Você espera que ela resolva problemas por conta própria ou siga instruções à risca?", pillar: "autonomy" },
  { id: "q3", text: "Se essa pessoa identificar um erro seu, ela deve te alertar, mesmo que te incomode?", pillar: "autonomy" },
  { id: "q4", text: "Essa função exige alguém que crie soluções do zero ou apenas execute processos já definidos?", pillar: "autonomy" },
  { id: "q5", text: "Até que ponto você está disposto a delegar responsabilidades críticas para essa posição?", pillar: "autonomy" },
  { id: "q6", text: "Você quer alguém que seja proativo em mudar processos ou apenas que execute o que já existe?", pillar: "autonomy" },

  // Liderança / Sucessão (Q7-Q12)
  { id: "q7", text: "Você quer que essa pessoa seja um potencial sucessor seu no futuro?", pillar: "leadership" },
  { id: "q8", text: "Ela terá liberdade para discordar de você em decisões estratégicas?", pillar: "leadership" },
  { id: "q9", text: "Você prefere alguém que questione você ou que siga suas orientações fielmente?", pillar: "leadership" },
  { id: "q10", text: "Em situações de crise, essa pessoa deve assumir a liderança ou apenas executar ordens?", pillar: "leadership" },
  { id: "q11", text: "Você se sentiria confortável em contratar alguém mais capaz que você em certas áreas?", pillar: "leadership" },
  { id: "q12", text: "Essa pessoa terá exposição direta à alta liderança da empresa?", pillar: "leadership" },

  // Trabalho em Grupo / Colaboração (Q13-Q18)
  { id: "q13", text: "O perfil ideal deve gerar harmonia no time ou ser capaz de lidar com conflitos para entregar resultados?", pillar: "teamwork" },
  { id: "q14", text: "Você prefere alguém especialista que atua sozinho ou alguém integrador que trabalha bem com o grupo?", pillar: "teamwork" },
  { id: "q15", text: "A performance dessa pessoa será medida mais pelo resultado individual ou coletivo?", pillar: "teamwork" },
  { id: "q16", text: "Você quer alguém que inspire e mobilize o time ou apenas entregue seus próprios resultados?", pillar: "teamwork" },
  { id: "q17", text: "Você toleraria um colaborador que gera atrito, mas traz grandes resultados?", pillar: "teamwork" },
  { id: "q18", text: "Esse papel exige alguém diplomático ou alguém direto e objetivo?", pillar: "teamwork" },

  // Risco / Estilo de Trabalho (Q19-Q24)
  { id: "q19", text: "Essa vaga precisa de alguém que inove e assuma riscos ou que preserve a estabilidade?", pillar: "risk" },
  { id: "q20", text: "Você quer alguém que questione o status quo ou que mantenha o que já funciona?", pillar: "risk" },
  { id: "q21", text: "O ritmo esperado da função é estável ou intenso e de alta pressão?", pillar: "risk" },
  { id: "q22", text: "A pessoa deve tomar decisões ousadas mesmo com risco ou sempre minimizar erros?", pillar: "risk" },
  { id: "q23", text: "Você prefere alguém prudente e conservador ou ousado e visionário?", pillar: "risk" },
  { id: "q24", text: "O sucesso dessa função é medido mais por segurança/estabilidade ou por crescimento rápido?", pillar: "risk" },

  // Ambição / Projeção (Q25-Q30)
  { id: "q25", text: "Essa função é de longo prazo ou uma cadeira de passagem para algo maior?", pillar: "ambition" },
  { id: "q26", text: "Você quer alguém que cresça e brilhe na função ou alguém que permaneça discreto?", pillar: "ambition" },
  { id: "q27", text: "Você contrataria alguém que possa, no futuro, assumir seu cargo?", pillar: "ambition" },
  { id: "q28", text: "O candidato ideal deve ser sucessor em potencial ou alguém de apoio confiável?", pillar: "ambition" },
  { id: "q29", text: "Esta função é para acelerar a carreira do ocupante ou oferecer estabilidade de longo prazo?", pillar: "ambition" },
  { id: "q30", text: "Você se sentiria confortável se essa pessoa se tornasse mais influente que você na empresa?", pillar: "ambition" },
];

// Create schema dynamically from questions
const companyAssessmentSchema = z.object(
  JOB_ASSESSMENT_QUESTIONS.reduce((acc, question) => {
    acc[question.id] = z.number().min(1, "Resposta obrigatória").max(5);
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

const CompanyAssessmentStep: React.FC<CompanyAssessmentStepProps> = ({
  onNext,
  onBack,
  isLoading = false,
  data,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const form = useForm<CompanyAssessmentData>({
    resolver: zodResolver(companyAssessmentSchema),
    defaultValues: data || {},
  });

  const currentQuestion = JOB_ASSESSMENT_QUESTIONS[currentQuestionIndex];
  const totalQuestions = JOB_ASSESSMENT_QUESTIONS.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;
  const answeredCount = Object.keys(form.getValues()).filter(key => 
    form.getValues()[key as keyof CompanyAssessmentData] !== undefined
  ).length;

  const handleAnswerSelect = (value: number) => {
    setIsAnimating(true);
    
    // Set value in form
    form.setValue(currentQuestion.id as keyof CompanyAssessmentData, value);

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

  const handleSubmit = (formData: CompanyAssessmentData) => {
    // Calculate pillar scores (average per pillar)
    const pillarScores = {
      autonomy: 0,
      leadership: 0,
      teamwork: 0,
      risk: 0,
      ambition: 0,
    };

    const pillarCounts = {
      autonomy: 0,
      leadership: 0,
      teamwork: 0,
      risk: 0,
      ambition: 0,
    };

    // Calculate averages per pillar
    JOB_ASSESSMENT_QUESTIONS.forEach((question) => {
      const score = formData[question.id as keyof CompanyAssessmentData];
      const pillar = question.pillar as keyof typeof pillarScores;
      
      pillarScores[pillar] += score;
      pillarCounts[pillar]++;
    });

    // Final averages
    Object.keys(pillarScores).forEach((pillar) => {
      const key = pillar as keyof typeof pillarScores;
      pillarScores[key] = pillarScores[key] / pillarCounts[key];
    });

    // Determine job archetype based on top 2 pillars
    const sortedPillars = Object.entries(pillarScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    const archetype = determineJobArchetype(sortedPillars[0][0], sortedPillars[1][0]);

    const result = {
      responses: formData,
      pillar_scores: pillarScores,
      archetype,
    };

    onNext(result);
  };

  // Determine job archetype based on top 2 pillars according to MATCH RAVYZ methodology
  const determineJobArchetype = (pillar1: string, pillar2: string): string => {
    const pairs: Record<string, string> = {
      "autonomy-leadership": "Protagonista",
      "teamwork-autonomy": "Mobilizador",
      "risk-ambition": "Transformador",
      "leadership-ambition": "Visionário",
      "autonomy-teamwork": "Construtor",
      "teamwork-risk": "Explorador",
      "autonomy-risk": "Proativo",
      "leadership-teamwork": "Idealista",
      "risk-leadership": "Estrategista",
      "ambition-teamwork": "Colaborador",
      "autonomy-ambition": "Guardião",
    };

    const key1 = `${pillar1}-${pillar2}`;
    const key2 = `${pillar2}-${pillar1}`;
    
    return pairs[key1] || pairs[key2] || "Equilibrado";
  };

  const currentValue = form.watch(currentQuestion.id as keyof CompanyAssessmentData);
  const pillarName = currentQuestion.pillar === 'autonomy' ? 'Autonomia' :
                      currentQuestion.pillar === 'leadership' ? 'Liderança' :
                      currentQuestion.pillar === 'teamwork' ? 'Trabalho em Grupo' :
                      currentQuestion.pillar === 'risk' ? 'Risco' : 'Ambição';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">Assessment da Vaga</h2>
            <p className="text-sm text-muted-foreground">
              Pergunta {currentQuestionIndex + 1} de {totalQuestions}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">{Math.round(progress)}%</div>
            <div className="text-xs text-muted-foreground">Concluído</div>
          </div>
        </div>

        {/* Pillar indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Pilar:</span>
          <span className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
            currentQuestion.pillar === 'autonomy' && "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
            currentQuestion.pillar === 'leadership' && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
            currentQuestion.pillar === 'teamwork' && "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
            currentQuestion.pillar === 'risk' && "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
            currentQuestion.pillar === 'ambition' && "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300"
          )}>
            {pillarName}
          </span>
        </div>
      </div>

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
};

export default CompanyAssessmentStep;