import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";

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
    acc[question.id] = z.number().min(1).max(5);
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
  const form = useForm<CompanyAssessmentData>({
    resolver: zodResolver(companyAssessmentSchema),
    defaultValues: data || {},
  });

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
      const score = formData[question.id];
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

  const progress = Object.keys(form.getValues()).length / JOB_ASSESSMENT_QUESTIONS.length * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment da Vaga</CardTitle>
        <p className="text-muted-foreground">
          Defina o perfil comportamental ideal para esta vaga usando a escala de 1 (baixo) a 5 (alto)
        </p>
        <Progress value={progress} className="h-2" />
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {JOB_ASSESSMENT_QUESTIONS.map((question, index) => (
              <FormField
                key={question.id}
                control={form.control}
                name={question.id as keyof CompanyAssessmentData}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      <span className="font-semibold">{index + 1}.</span> {question.text}
                    </FormLabel>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                      className="flex justify-between"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <div key={value} className="flex items-center space-x-2">
                          <RadioGroupItem value={value.toString()} id={`${question.id}-${value}`} />
                          <label
                            htmlFor={`${question.id}-${value}`}
                            className="text-sm cursor-pointer"
                          >
                            {value}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Baixo</span>
                      <span>Alto</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {/* Pillar indicators */}
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Pilares da Vaga:</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Autonomia (Liberdade de Decisão)</Badge>
                <Badge variant="secondary">Liderança (Potencial de Sucessão)</Badge>
                <Badge variant="secondary">Trabalho em Grupo (Colaboração)</Badge>
                <Badge variant="secondary">Risco (Inovação vs Estabilidade)</Badge>
                <Badge variant="secondary">Ambição (Projeção de Carreira)</Badge>
              </div>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={onBack}>
                Voltar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Processando..." : "Finalizar Assessment"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CompanyAssessmentStep;