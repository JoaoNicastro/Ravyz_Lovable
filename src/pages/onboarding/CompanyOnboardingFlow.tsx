import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CompanyRegistrationStep from "@/components/onboarding/steps/CompanyRegistrationStep";
import CompanyJobDefinitionStep from "@/components/onboarding/steps/CompanyJobDefinitionStep";
import ravyzLogo from "@/assets/ravyz-logo.png";

interface StepData {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<StepComponentProps>;
}

interface StepComponentProps {
  onNext: (data: any) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: any;
}

const STEPS: StepData[] = [
  {
    id: "company-registration",
    title: "Informações da Empresa",
    description: "Conte-nos sobre sua empresa",
    component: CompanyRegistrationStep,
  },
  {
    id: "job-definition",
    title: "Primeira Vaga",
    description: "Crie sua primeira oportunidade",
    component: CompanyJobDefinitionStep,
  },
  {
    id: "company-assessment",
    title: "Assessment da Vaga",
    description: "Defina o perfil comportamental da vaga",
    component: React.lazy(() => import("@/components/onboarding/steps/CompanyAssessmentStep")),
  },
];

const CompanyOnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Sync current step with URL
  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      const stepIndex = STEPS.findIndex(step => step.id === stepParam);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
    }
  }, [searchParams]);

  const handleNext = (data: any) => {
    const currentStepId = STEPS[currentStep].id;
    
    // Store step data
    const updatedStepData = {
      ...stepData,
      [currentStepId]: data,
    };
    setStepData(updatedStepData);

    // Check if this is the last step
    if (currentStep === STEPS.length - 1) {
      completeOnboarding(updatedStepData);
    } else {
      // Move to next step
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setSearchParams({ step: STEPS[nextStep].id });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setSearchParams({ step: STEPS[prevStep].id });
    } else {
      navigate("/profile-selection");
    }
  };

  const completeOnboarding = async (allStepData: Record<string, any>) => {
    setIsLoading(true);
    
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não encontrado");

      const companyData = allStepData["company-registration"];
      const jobData = allStepData["job-definition"];
      const assessmentData = allStepData["company-assessment"];

      // First, create or update company profile
      const { data: existingProfile } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .maybeSingle();

      let companyProfile;
      
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('company_profiles')
          .update({
            company_name: companyData.company_name,
            description: companyData.description,
            industry: companyData.industry,
            size_category: companyData.size_category,
            location: companyData.location,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.user.id)
          .select()
          .single();

        if (error) throw error;
        companyProfile = data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('company_profiles')
          .insert({
            user_id: user.user.id,
            company_name: companyData.company_name,
            description: companyData.description,
            industry: companyData.industry,
            size_category: companyData.size_category,
            location: companyData.location,
          })
          .select()
          .single();

        if (error) throw error;
        companyProfile = data;
      }

      // Create the first job with assessment data
      const { data: newJob, error: jobError } = await supabase
        .from('jobs')
        .insert({
          company_id: companyProfile.id,
          title: jobData.title,
          description: jobData.description,
          requirements: jobData.requirements || {},
          location: jobData.location,
          work_model: jobData.work_model,
          salary_min: jobData.salary_min,
          salary_max: jobData.salary_max,
          status: 'active',
          pillar_scores: assessmentData?.pillar_scores || {},
          archetype: assessmentData?.archetype || 'Equilibrado',
        })
        .select()
        .single();

      if (jobError) throw jobError;

      // Save assessment responses if available
      if (assessmentData?.responses) {
        const { error: assessmentError } = await supabase
          .from('questionnaire_responses')
          .insert({
            category: 'job' as any, // Using any to bypass type checking for new enum value
            responses: assessmentData.responses,
            calculated_score: Object.values(assessmentData.pillar_scores).map(Number).reduce((sum: number, score: number) => sum + score, 0) / 5,
          });

        if (assessmentError) console.warn("Erro ao salvar assessment:", assessmentError);
      }

      toast.success("Onboarding concluído com sucesso!");
      navigate("/dashboard/company");
      
    } catch (error) {
      console.error("Erro ao completar onboarding:", error);
      toast.error("Erro ao salvar dados. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header with Progress */}
      <div className="bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="space-y-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 mb-2">
              <img 
                src={ravyzLogo} 
                alt="RAVYZ Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-lg font-semibold">RAVYZ</span>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={progress} className="h-2" />
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
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
            size="lg"
            className="min-w-[120px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">
                Passo {currentStep + 1} de {STEPS.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(progress)}% concluído
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyOnboardingFlow;