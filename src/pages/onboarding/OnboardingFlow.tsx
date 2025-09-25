import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Step components
import FillMethodStep from "@/components/onboarding/steps/FillMethodStep";
import CandidateRegistrationStep from "@/components/onboarding/steps/CandidateRegistrationStep";
import CandidateValidationStep from "@/components/onboarding/steps/CandidateValidationStep";
import ProfessionalAssessmentStep from "@/components/onboarding/steps/ProfessionalAssessmentStep";
import DreamJobStep from "@/components/onboarding/steps/DreamJobStep";

interface StepData {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepComponentProps>;
}

interface StepComponentProps {
  onNext: (data?: any) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: any;
}

const STEPS: StepData[] = [
  {
    id: "fill-method",
    title: "Método de Preenchimento",
    description: "Escolha como deseja completar seu perfil",
    component: FillMethodStep,
  },
  {
    id: "registration",
    title: "Informações Básicas",
    description: "Preencha suas informações pessoais",
    component: CandidateRegistrationStep,
  },
  {
    id: "validation",
    title: "Validação Cultural",
    description: "Responda perguntas sobre seus valores",
    component: CandidateValidationStep,
  },
  {
    id: "assessment",
    title: "Avaliação Profissional",
    description: "Conte sobre sua experiência profissional",
    component: ProfessionalAssessmentStep,
  },
  {
    id: "dream-job",
    title: "Emprego dos Sonhos",
    description: "Defina suas preferências de trabalho",
    component: DreamJobStep,
  },
];

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize step from URL params
  useEffect(() => {
    const step = searchParams.get("step");
    if (step) {
      const stepIndex = STEPS.findIndex(s => s.id === step);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
    }
  }, [searchParams]);

  // Update URL when step changes
  useEffect(() => {
    setSearchParams({ step: STEPS[currentStep].id });
  }, [currentStep, setSearchParams]);

  const handleNext = async (data?: any) => {
    setIsLoading(true);
    
    try {
      // Store step data
      if (data) {
        setStepData(prev => ({
          ...prev,
          [STEPS[currentStep].id]: data
        }));
      }

      // If this is the last step, complete onboarding
      if (currentStep === STEPS.length - 1) {
        await completeOnboarding();
        return;
      }

      // Move to next step
      setCurrentStep(prev => prev + 1);
      toast.success("Progresso salvo!");
    } catch (error) {
      console.error("Error in onboarding step:", error);
      toast.error("Erro ao avançar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate("/profile-selection");
    }
  };

  const completeOnboarding = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não encontrado");

      // Update user completion status
      const { error } = await supabase
        .from('users')
        .update({ 
          profiles: ['candidate'] // Mark as completed candidate onboarding
        })
        .eq('id', user.user.id);

      if (error) throw error;

      toast.success("Onboarding concluído com sucesso!");
      navigate("/"); // Redirect to dashboard
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Erro ao finalizar onboarding");
    }
  };

  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;
  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={progressPercentage} className="h-2" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {currentStep + 1} de {STEPS.length}
              </span>
            </div>

            {/* Step Info */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {STEPS[currentStep].title}
              </h1>
              <p className="text-muted-foreground">
                {STEPS[currentStep].description}
              </p>
            </div>

            {/* Step Navigation Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {STEPS.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                    index === currentStep
                      ? "bg-primary text-primary-foreground"
                      : index < currentStep
                      ? "bg-success/20 text-success"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold">
                    {index < currentStep ? "✓" : index + 1}
                  </span>
                  {step.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <CurrentStepComponent
          onNext={handleNext}
          onBack={handleBack}
          isLoading={isLoading}
          data={stepData[STEPS[currentStep].id]}
        />
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {STEPS.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;