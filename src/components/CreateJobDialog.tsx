import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import CompanyJobDefinitionStep from '@/components/onboarding/steps/CompanyJobDefinitionStep';
import CandidateBasicProfileStep from '@/components/onboarding/steps/CandidateBasicProfileStep';
import EducationPreferencesStep from '@/components/onboarding/steps/EducationPreferencesStep';
import IndustryPreferencesStep from '@/components/onboarding/steps/IndustryPreferencesStep';
import TechnicalSkillsStep from '@/components/onboarding/steps/TechnicalSkillsStep';
import CompanyAssessmentStep from '@/components/onboarding/steps/CompanyAssessmentStep';

interface StepComponentProps {
  onNext: (data: any) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: any;
}

interface StepData {
  id: string;
  title: string;
  component: React.ComponentType<StepComponentProps>;
}

const STEPS: StepData[] = [
  {
    id: "job-definition",
    title: "Definição da Vaga",
    component: CompanyJobDefinitionStep,
  },
  {
    id: "candidate-basic-profile",
    title: "Perfil Básico",
    component: CandidateBasicProfileStep,
  },
  {
    id: "education-preferences",
    title: "Formação Acadêmica",
    component: EducationPreferencesStep,
  },
  {
    id: "industry-preferences",
    title: "Setores e Indústrias",
    component: IndustryPreferencesStep,
  },
  {
    id: "technical-skills",
    title: "Habilidades Técnicas",
    component: TechnicalSkillsStep,
  },
  {
    id: "company-assessment",
    title: "Assessment da Vaga",
    component: CompanyAssessmentStep,
  },
];

interface CreateJobDialogProps {
  companyId: string;
  onJobCreated: () => void;
}

export function CreateJobDialog({ companyId, onJobCreated }: CreateJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const { toast } = useToast();

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
      completeJobCreation(updatedStepData);
    } else {
      // Move to next step
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeJobCreation = async (allStepData: Record<string, any>) => {
    setIsLoading(true);
    
    try {
      const jobData = allStepData["job-definition"];
      const candidateBasicData = allStepData["candidate-basic-profile"];
      const educationData = allStepData["education-preferences"];
      const industryData = allStepData["industry-preferences"];
      const technicalSkillsData = allStepData["technical-skills"];
      const assessmentData = allStepData["company-assessment"];

      const { error } = await supabase.from('jobs').insert({
        company_id: companyId,
        title: jobData.title,
        description: jobData.description,
        location: jobData.location,
        salary_min: jobData.salary_min,
        salary_max: jobData.salary_max,
        status: 'active',
        gender_preference: candidateBasicData?.gender_preference || 'indiferente',
        age_ranges: candidateBasicData?.age_ranges || [],
        education_levels: educationData?.education_levels || [],
        preferred_institutions: educationData?.preferred_institutions || [],
        industries: industryData?.industries || [],
        technical_skills: technicalSkillsData?.technical_skills || [],
        pillar_scores: assessmentData?.pillar_scores || {},
        archetype: assessmentData?.archetype || 'Equilibrado',
      });

      if (error) throw error;

      toast({
        title: 'Vaga criada com sucesso!',
        description: 'A vaga foi publicada e está ativa.',
      });

      // Reset state
      setStepData({});
      setCurrentStep(0);
      setOpen(false);
      onJobCreated();
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Erro ao criar vaga',
        description: 'Não foi possível criar a vaga. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset when closing
        setCurrentStep(0);
        setStepData({});
      }
    }}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Criar Nova Vaga
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Progress Bar */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Criar Nova Vaga</h2>
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} de {STEPS.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {STEPS[currentStep].title}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <CurrentStepComponent
            onNext={handleNext}
            onBack={handleBack}
            isLoading={isLoading}
            data={stepData[STEPS[currentStep].id]}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
