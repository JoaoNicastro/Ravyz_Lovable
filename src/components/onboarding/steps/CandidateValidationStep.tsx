import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { 
  Zap, TrendingUp, Scale, Clock, Leaf,
  Brain, BarChart3, GitMerge, FileSearch, BookOpen,
  MessageSquare, FileText, Users, BookCheck, GraduationCap,
  Hammer, Lightbulb, UserCheck, Library, Award,
  Check, ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
      { value: "urgent", label: "Ritmo acelerado, sempre com urgência", description: "Prefiro ambientes dinâmicos com prazos curtos", icon: Zap },
      { value: "dynamic", label: "Ritmo dinâmico, mas com planejamento", description: "Gosto de velocidade, mas organizado", icon: TrendingUp },
      { value: "balanced", label: "Ritmo equilibrado, sem pressa excessiva", description: "Busco equilíbrio entre eficiência e qualidade", icon: Scale },
      { value: "calm", label: "Ritmo mais calmo, com tempo para reflexão", description: "Valorizo tempo para pensar e analisar", icon: Clock },
      { value: "relaxed", label: "Ritmo bem tranquilo, sem pressão", description: "Prefiro trabalhar sem pressão de tempo", icon: Leaf },
    ],
  },
  {
    key: "decisionMaking" as keyof ValidationData,
    label: "Seu processo de tomada de decisão",
    options: [
      { value: "intuitive", label: "Decido rapidamente, confio na intuição", description: "Uso experiência e instinto para decidir", icon: Brain },
      { value: "basicData", label: "Analiso dados básicos e decido", description: "Busco informações essenciais antes de decidir", icon: BarChart3 },
      { value: "balanced", label: "Busco equilíbrio entre análise e intuição", description: "Combino dados com experiência", icon: GitMerge },
      { value: "detailedData", label: "Preciso de dados detalhados para decidir", description: "Analiso informações profundamente", icon: FileSearch },
      { value: "exhaustive", label: "Analiso exaustivamente antes de decidir", description: "Exploro todas as possibilidades antes de decidir", icon: BookOpen },
    ],
  },
  {
    key: "communication" as keyof ValidationData,
    label: "Seu estilo de comunicação preferido",
    options: [
      { value: "direct", label: "Comunicação direta e objetiva", description: "Vou direto ao ponto", icon: MessageSquare },
      { value: "contextual", label: "Clara, mas com contexto", description: "Explico o necessário com clareza", icon: FileText },
      { value: "balanced", label: "Equilibrada entre formal e informal", description: "Adapto conforme o contexto", icon: Users },
      { value: "detailed", label: "Mais elaborada e detalhada", description: "Gosto de explicar com profundidade", icon: BookCheck },
      { value: "formal", label: "Formal e muito estruturada", description: "Prefiro comunicação profissional e organizada", icon: GraduationCap },
    ],
  },
  {
    key: "learningStyle" as keyof ValidationData,
    label: "Sua forma preferida de aprendizado",
    options: [
      { value: "practice", label: "Experimentando e errando na prática", description: "Aprendo fazendo e testando", icon: Hammer },
      { value: "theoryPractice", label: "Combinando teoria e prática", description: "Gosto de entender e depois aplicar", icon: Lightbulb },
      { value: "mentorship", label: "Com mentoria e feedback constante", description: "Aprendo melhor com orientação", icon: UserCheck },
      { value: "theoryFirst", label: "Estudando teoria antes da prática", description: "Prefiro dominar conceitos primeiro", icon: Library },
      { value: "structured", label: "Cursos estruturados e certificações", description: "Valorizo aprendizado formal e estruturado", icon: Award },
    ],
  },
];

const CandidateValidationStep: React.FC<StepProps> = ({ onNext, onBack, data }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  
  const form = useForm<ValidationData>({
    resolver: zodResolver(validationSchema),
    defaultValues: data || {},
  });

  const currentQuestionData = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleOptionClick = async (optionValue: string) => {
    const questionKey = currentQuestionData.key;
    
    // Set selected option for visual feedback
    setSelectedOption(optionValue);
    
    // Update form value
    form.setValue(questionKey, optionValue as any);

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 400));

    // Move to next question or submit
    if (currentQuestion < questions.length - 1) {
      setDirection('forward');
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
    } else {
      // Last question - submit form
      const formData = form.getValues();
      onNext(formData);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setDirection('backward');
      setCurrentQuestion(prev => prev - 1);
      setSelectedOption(null);
    } else {
      onBack();
    }
  };

  const currentValue = form.watch(currentQuestionData.key);

  return (
    <div className="max-w-4xl mx-auto min-h-[600px] flex flex-col">

      {/* Question */}
      <div 
        key={currentQuestion}
        className={`flex-1 space-y-8 animate-fade-in ${
          direction === 'forward' ? 'slide-in-right' : 'slide-in-left'
        }`}
      >
        <div className="text-center space-y-3">
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
            {currentQuestionData.label}
          </h2>
          <p className="text-muted-foreground">
            Escolha a opção que melhor representa você
          </p>
        </div>

        {/* Options as Cards */}
        <Form {...form}>
          <div className="grid gap-4 md:gap-5">
            {currentQuestionData.options.map((option, index) => {
              const Icon = option.icon;
              const isSelected = selectedOption === option.value;
              const wasSelected = currentValue === option.value && !selectedOption;
              
              return (
                <Card
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  className={`
                    relative p-6 cursor-pointer transition-all duration-300 hover:shadow-lg
                    hover:scale-[1.02] active:scale-[0.98]
                    ${isSelected ? 'border-primary ring-2 ring-primary bg-primary/5 scale-[1.02]' : ''}
                    ${wasSelected ? 'border-primary/50' : 'hover:border-primary/50'}
                    animate-fade-in
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`
                      p-3 rounded-lg transition-all duration-300
                      ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
                    `}>
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`
                        font-semibold mb-1 transition-colors
                        ${isSelected ? 'text-primary' : 'text-foreground'}
                      `}>
                        {option.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>

                    {/* Check Icon */}
                    {isSelected && (
                      <div className="flex-shrink-0 animate-scale-in">
                        <div className="bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-5 w-5" />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Form>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>

        <div className="flex gap-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`
                h-2 rounded-full transition-all duration-300
                ${index === currentQuestion ? 'w-8 bg-primary' : 'w-2 bg-muted'}
              `}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CandidateValidationStep;