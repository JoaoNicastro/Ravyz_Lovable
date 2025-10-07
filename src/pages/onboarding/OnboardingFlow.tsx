import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import ravyzLogo from "@/assets/ravyz-logo.png";
import { useLinkedInAuth } from "@/hooks/useLinkedInAuth";

// Step components
import ResumeUploadStep from "@/components/onboarding/steps/ResumeUploadStep";
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
    id: "resume-upload",
    title: "Upload de Currículo",
    description: "Envie seu currículo para preenchimento automático",
    component: ResumeUploadStep,
  },
  {
    id: "registration",
    title: "Informações para Candidatura",
    description: "Preencha suas informações pessoais e profissionais",
    component: CandidateRegistrationStep,
  },
  {
    id: "assessment",
    title: "Avaliação Profissional",
    description: "Conte sobre sua experiência profissional",
    component: ProfessionalAssessmentStep,
  },
  {
    id: "validation",
    title: "Validação Cultural",
    description: "Responda perguntas sobre seus valores",
    component: CandidateValidationStep,
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
  const [linkedInDataImported, setLinkedInDataImported] = useState(false);
  const [linkedInPrefilledData, setLinkedInPrefilledData] = useState<Record<string, any>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Process LinkedIn OAuth callback
  const { isProcessing: isProcessingLinkedIn } = useLinkedInAuth();

  // Load LinkedIn data on mount and prepare prefill data
  useEffect(() => {
    const loadLinkedInData = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return;

        const { data: profile } = await supabase
          .from('candidate_profiles')
          .select('*')
          .eq('user_id', user.user.id)
          .maybeSingle();

        if (profile?.linkedin_data && Object.keys(profile.linkedin_data).length > 0) {
          // Check if essential data was imported
          const hasEssentialData = 
            profile.full_name && 
            profile.email &&
            profile.current_position && 
            profile.education && 
            Array.isArray(profile.education) && 
            profile.education.length > 0 &&
            profile.skills &&
            Array.isArray(profile.skills) &&
            profile.skills.length > 0;

          if (hasEssentialData) {
            setLinkedInDataImported(true);
            
            // Prepare prefilled data for registration step
            const registrationData: any = {
              avatar_url: profile.avatar_url,
              languages: profile.languages || [],
              education: profile.education || [],
            };

            // Prepare prefilled data for assessment step
            const assessmentData: any = {
              headline: profile.headline || `${profile.current_position}`,
              years_experience: profile.years_experience || 0,
              skills: Array.isArray(profile.skills) ? profile.skills : [],
              currentRole: profile.current_position || '',
              currentCompany: '',
              yearsInRole: 0,
              keyAchievements: profile.key_achievements || '',
              careerGoals: profile.career_goals || '',
              preferredRoles: profile.preferred_roles || [],
            };

            setLinkedInPrefilledData({
              registration: registrationData,
              assessment: assessmentData,
            });

            toast.info(
              "Preenchemos automaticamente suas informações com base no seu perfil do LinkedIn. Revise e confirme antes de continuar.",
              { duration: 6000 }
            );
          }
        }
      } catch (error) {
        console.error("Error loading LinkedIn data:", error);
      }
    };

    loadLinkedInData();
  }, []);

  // Initialize step from URL on mount only
  useEffect(() => {
    const stepParam = searchParams.get("step");
    if (stepParam) {
      const stepIndex = STEPS.findIndex((s) => s.id === stepParam);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Sync URL when currentStep changes
  useEffect(() => {
    const expectedStep = STEPS[currentStep].id;
    setSearchParams({ step: expectedStep }, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  const handleNext = async (data?: any) => {
    setIsLoading(true);
    
    try {
      // Store step data
      if (data) {
        setStepData(prev => ({
          ...prev,
          [STEPS[currentStep].id]: data
        }));

        // Handle resume upload step
        if (STEPS[currentStep].id === 'resume-upload' && data.resumeProcessed && data.parsedData) {
          // Mark registration and assessment steps as completed
          setCompletedSteps(new Set([1, 2])); // Steps 1 and 2 (after resume-upload)
          
          // Pre-fill data for subsequent steps
          const parsedData = data.parsedData;
          
            // Pre-fill registration data
            const registrationData: any = {
              full_name: parsedData.full_name,
              email: parsedData.email,
              phone: parsedData.phone,
              location: parsedData.location,
              date_of_birth: parsedData.date_of_birth ? new Date(parsedData.date_of_birth) : undefined,
              education: parsedData.education || [],
              languages: parsedData.languages || [],
          };

          // Pre-fill assessment data
          const assessmentData: any = {
            headline: parsedData.work_experience?.[0]?.title || '',
            currentRole: parsedData.work_experience?.[0]?.title || '',
            currentCompany: parsedData.work_experience?.[0]?.company || '',
            years_experience: parsedData.years_of_experience || 0,
            skills: parsedData.skills || [],
            work_experience: parsedData.work_experience || [],
          };

          setLinkedInPrefilledData({
            registration: registrationData,
            assessment: assessmentData,
          });

          toast.success(
            "Preenchemos automaticamente suas informações com base no seu currículo. Revise e confirme antes de continuar.",
            { duration: 6000 }
          );
        }
      }

      // Mark current step as completed
      setCompletedSteps(prev => new Set(prev).add(currentStep));

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

  const loadLinkedInDataForPrefill = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .maybeSingle();

      if (profile?.linkedin_data && Object.keys(profile.linkedin_data).length > 0) {
        // Check if essential data was imported
        const hasEssentialData = 
          profile.full_name && 
          profile.email &&
          profile.current_position && 
          profile.education && 
          Array.isArray(profile.education) && 
          profile.education.length > 0 &&
          profile.skills &&
          Array.isArray(profile.skills) &&
          profile.skills.length > 0;

        if (hasEssentialData) {
          setLinkedInDataImported(true);
          
          // Prepare prefilled data for registration step
          const registrationData: any = {
            avatar_url: profile.avatar_url,
            languages: profile.languages || [],
            education: profile.education || [],
          };

          // Prepare prefilled data for assessment step
          const assessmentData: any = {
            headline: profile.headline || `${profile.current_position}`,
            years_experience: profile.years_experience || 0,
            skills: Array.isArray(profile.skills) ? profile.skills : [],
            currentRole: profile.current_position || '',
            currentCompany: '',
            yearsInRole: 0,
            keyAchievements: profile.key_achievements || '',
            careerGoals: profile.career_goals || '',
            preferredRoles: profile.preferred_roles || [],
          };

          setLinkedInPrefilledData({
            registration: registrationData,
            assessment: assessmentData,
          });

          toast.info(
            "Preenchemos automaticamente suas informações com base no seu perfil do LinkedIn. Revise e confirme antes de continuar.",
            { duration: 6000 }
          );
        }
      }
    } catch (error) {
      console.error("Error loading LinkedIn data:", error);
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Auth error:", authError);
        toast.error("Erro de autenticação. Por favor, faça login novamente.");
        navigate("/auth");
        return;
      }

      if (!user) {
        console.error("No user found");
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        navigate("/auth");
        return;
      }

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
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      const profileData = {
        user_id: user.id,
        // Basic personal info from registration
        full_name: registrationData?.full_name || null,
        date_of_birth: registrationData?.date_of_birth 
          ? (registrationData.date_of_birth instanceof Date 
            ? registrationData.date_of_birth.toISOString().split('T')[0] 
            : registrationData.date_of_birth)
          : null,
        email: registrationData?.email || null,
        phone: registrationData?.phone || null,
        cpf: registrationData?.cpf || null,
        gender: registrationData?.gender || null,
        location: registrationData?.location || null,
        // Professional profile info
        avatar_url: registrationData?.avatar_url || null,
        headline: assessmentData?.headline || null,
        years_experience: assessmentData?.years_experience || 0,
        skills: assessmentData?.skills || [],
        languages: registrationData?.languages || [],
        education: registrationData?.education || [],
        // Current position data
        current_position: assessmentData?.currentRole || null,
        key_achievements: [
          ...(assessmentData?.keyAchievements || []),
          ...(assessmentData?.keyAchievementsOther ? [assessmentData.keyAchievementsOther] : [])
        ].join('; ') || null,
        preferred_roles: assessmentData?.preferredRoles || [],
        career_goals: [
          ...(assessmentData?.careerGoals || []),
          ...(assessmentData?.careerGoalsOther ? [assessmentData.careerGoalsOther] : [])
        ].join('; ') || null,
        preferences: {
          completionLevel: 100,
          desired_role: dreamJobData?.desiredRole,
          company_size: dreamJobData?.preferredCompanySize,
          work_model: dreamJobData?.workModel,
          salary_min: dreamJobData?.salaryRange?.min,
          salary_max: dreamJobData?.salaryRange?.max,
          preferred_locations: dreamJobData?.preferredLocations || [],
          industry_interests: dreamJobData?.industryPreferences || [],
          deal_breakers: [
            ...(dreamJobData?.dealBreakers || []),
            ...(dreamJobData?.dealBreakersOther ? [dreamJobData.dealBreakersOther] : [])
          ],
          additional_preferences: [
            ...(dreamJobData?.additionalPreferences || []),
            ...(dreamJobData?.additionalPreferencesOther ? [dreamJobData.additionalPreferencesOther] : [])
          ]
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
          .eq('user_id', user.id)
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

      // Update user completion status and set active_profile
      const { error } = await supabase
        .from('users')
        .update({ 
          profiles: ['candidate'],
          active_profile: 'candidate'
        })
        .eq('id', user.id);

      if (error) throw error;

      console.log('✅ [Onboarding] Candidate profile created, active_profile set');
      toast.success("Onboarding concluído com sucesso!");
      navigate("/onboarding/candidate/complete");
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
  
  // Merge prefilled LinkedIn data with any existing step data
  const currentStepData = {
    ...linkedInPrefilledData[STEPS[currentStep].id],
    ...stepData[STEPS[currentStep].id]
  };

  // Show loading while processing LinkedIn import
  if (isProcessingLinkedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-xl font-semibold">Importando dados do LinkedIn...</h2>
          <p className="text-muted-foreground">Aguarde enquanto processamos seu perfil</p>
        </div>
      </div>
    );
  }

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
              {linkedInDataImported && (
                <div className="mt-2 text-sm text-success flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  Dados importados do LinkedIn
                </div>
              )}
            </div>

            {/* Step Navigation Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {STEPS.map((step, index) => {
                const isPast = index < currentStep;
                const isCurrent = index === currentStep;
                const isCompleted = completedSteps.has(index);
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isCompleted
                        ? "bg-success/20 text-success"
                        : isPast
                        ? "bg-success/20 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold">
                      {isCompleted || isPast ? "✓" : index + 1}
                    </span>
                    {step.title}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {linkedInDataImported && (STEPS[currentStep].id === 'registration' || STEPS[currentStep].id === 'assessment') && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <span className="text-lg">ℹ️</span>
              Preenchemos automaticamente suas informações com base no seu perfil do LinkedIn. Revise e confirme antes de continuar.
            </p>
          </div>
        )}
        
        <CurrentStepComponent
          onNext={handleNext}
          onBack={handleBack}
          isLoading={isLoading}
          data={currentStepData}
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