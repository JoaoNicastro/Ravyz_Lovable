import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ravyzLogo from "@/assets/ravyz-logo.png";

// Step components
import FillMethodStep from "@/components/onboarding/steps/FillMethodStep";
import CandidateRegistrationStep from "@/components/onboarding/steps/CandidateRegistrationStep";
import CandidateValidationStep from "@/components/onboarding/steps/CandidateValidationStep";
import ProfessionalAssessmentStep from "@/components/onboarding/steps/ProfessionalAssessmentStep";
import CandidateAssessmentStep from "@/components/onboarding/steps/CandidateAssessmentStep";
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
    title: "Informações para Candidatura",
    description: "Preencha suas informações pessoais e profissionais",
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
    id: "candidate-assessment",
    title: "Avaliação de Perfil",
    description: "Questionário para identificar seu perfil profissional",
    component: CandidateAssessmentStep,
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

      // Combine all collected data
      const allData = {
        ...stepData,
        [STEPS[currentStep].id]: stepData[STEPS[currentStep].id] // Include current step data
      };

      // Save candidate profile
      const registrationData = allData['registration'];
      const validationData = allData['validation'];
      const assessmentData = allData['assessment'];
      const candidateAssessmentData = allData['candidate-assessment'];
      const dreamJobData = allData['dream-job'];

      // Create or update candidate profile
      let { data: profile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const profileData = {
        user_id: user.user.id,
        // Basic personal info from registration
        full_name: registrationData?.full_name || null,
        date_of_birth: registrationData?.date_of_birth?.trim() ? registrationData.date_of_birth : null,
        email: registrationData?.email || null,
        phone: registrationData?.phone || null,
        // Professional profile info
        avatar_url: registrationData?.avatar_url || null,
        headline: registrationData?.headline || null,
        location: registrationData?.location || null,
        years_experience: registrationData?.years_experience || null,
        skills: registrationData?.skills || [],
        // Assessment data
        current_position: assessmentData?.current_position || null,
        key_achievements: assessmentData?.achievements || null,
        preferred_roles: assessmentData?.preferred_roles || [],
        career_goals: assessmentData?.career_goals || null,
        preferences: {
          completionLevel: 100,
          desired_role: dreamJobData?.desiredRole,
          company_size: dreamJobData?.preferredCompanySize,
          work_model: dreamJobData?.workModel,
          salary_min: dreamJobData?.salaryRange?.min,
          salary_max: dreamJobData?.salaryRange?.max,
          preferred_locations: dreamJobData?.preferredLocations || [],
          industry_interests: dreamJobData?.industryPreferences || [],
          deal_breakers: dreamJobData?.dealBreakers,
          additional_preferences: dreamJobData?.additionalPreferences
        }
      };

      if (!profile) {
        // Create new profile
        const { error: createError } = await supabase
          .from('candidate_profiles')
          .insert(profileData);
        if (createError) throw createError;
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('candidate_profiles')
          .update(profileData)
          .eq('id', profile.id);
        if (updateError) throw updateError;
      }

      // Save questionnaire responses
      if (validationData || assessmentData || candidateAssessmentData) {
        // First get the candidate profile to get the candidate_id
        const { data: candidateProfile } = await supabase
          .from('candidate_profiles')
          .select('id')
          .eq('user_id', user.user.id)
          .single();

        if (candidateProfile) {
          // Save cultural responses
          if (validationData) {
            const { error: culturalError } = await supabase
              .from('questionnaire_responses')
              .upsert({
                candidate_id: candidateProfile.id,
                category: 'cultural' as const,
                responses: validationData,
                calculated_score: calculateCulturalScore(validationData)
              });

            if (culturalError) throw culturalError;
          }

          // Save professional responses
          if (assessmentData) {
            const { error: professionalError } = await supabase
              .from('questionnaire_responses')
              .upsert({
                candidate_id: candidateProfile.id,
                category: 'professional' as const,
                responses: assessmentData,
                calculated_score: calculateProfessionalScore(assessmentData)
              });

            if (professionalError) throw professionalError;
          }

          // Save candidate assessment responses with scores and archetype
          if (candidateAssessmentData) {
            const { pillar_scores, archetype, consistency_warnings, ...responses } = candidateAssessmentData;
            
            const { error: candidateAssessmentError } = await supabase
              .from('questionnaire_responses')
              .insert({
                candidate_id: candidateProfile.id,
                category: 'candidate' as any, // Using any to bypass type checking for new enum value
                responses: responses,
                calculated_score: Object.values(pillar_scores).map(Number).reduce((sum, score) => sum + score, 0) / 4,
              });

            if (candidateAssessmentError) throw candidateAssessmentError;

            // Update candidate profile with pillar scores and archetype
            const { error: profileUpdateError } = await supabase
              .from('candidate_profiles')
              .update({
                pillar_scores: pillar_scores as any,
                archetype: archetype,
              })
              .eq('id', candidateProfile.id);

            if (profileUpdateError) throw profileUpdateError;
          }
        }
      }

      // Update user completion status
      const { error } = await supabase
        .from('users')
        .update({ 
          profiles: ['candidate']
        })
        .eq('id', user.user.id);

      if (error) throw error;

      toast.success("Onboarding concluído com sucesso!");
      navigate("/");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      toast.error("Erro ao finalizar onboarding");
    }
  };

  const calculateCulturalScore = (data: any) => {
    const values = Object.values(data);
    const numericValues = values.filter(v => typeof v === 'number');
    return numericValues.length > 0 
      ? numericValues.reduce((sum: number, val: any) => sum + val, 0) / numericValues.length 
      : 0;
  };

  const calculateProfessionalScore = (data: any) => {
    let score = 0;
    if (data.current_position) score += 20;
    if (data.achievements) score += 30;
    if (data.skills && data.skills.length > 0) score += 25;
    if (data.preferred_roles && data.preferred_roles.length > 0) score += 15;
    if (data.career_goals) score += 10;
    return score;
  };

  const progressPercentage = ((currentStep + 1) / STEPS.length) * 100;
  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <div className="min-h-screen bg-background pb-24">{/* Added padding bottom for fixed footer */}
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
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isLoading}
            size="lg"
            className="min-w-[120px]"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">
                Passo {currentStep + 1} de {STEPS.length}
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(progressPercentage)}% concluído
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;