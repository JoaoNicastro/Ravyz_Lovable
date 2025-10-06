import React, { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { ProfileStep } from "@/components/onboarding/assessment-steps/ProfileStep";
import { SkillsStep } from "@/components/onboarding/assessment-steps/SkillsStep";
import { CurrentPositionStep } from "@/components/onboarding/assessment-steps/CurrentPositionStep";
import { AchievementsStep } from "@/components/onboarding/assessment-steps/AchievementsStep";
import { CareerGoalsStep } from "@/components/onboarding/assessment-steps/CareerGoalsStep";
type AssessmentData = {
  headline: string;
  years_experience: number;
  skills: string[];
  currentRole: string;
  currentCompany: string;
  yearsInRole: number;
  keyAchievements: string;
  careerGoals: string;
  preferredRoles: string[];
};
interface StepProps {
  onNext: (data: AssessmentData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: AssessmentData;
}
const SUB_STEPS = [{
  id: "profile",
  title: "Perfil"
}, {
  id: "skills",
  title: "Habilidades"
}, {
  id: "position",
  title: "Posição"
}, {
  id: "achievements",
  title: "Conquistas"
}, {
  id: "goals",
  title: "Objetivos"
}];
const ProfessionalAssessmentStep: React.FC<StepProps> = ({
  onNext,
  data
}) => {
  const [currentSubStep, setCurrentSubStep] = useState(0);
  const [assessmentData, setAssessmentData] = useState<Partial<AssessmentData>>(data || {});
  const handleSubStepNext = (stepData: any) => {
    const updatedData = {
      ...assessmentData,
      ...stepData
    };
    setAssessmentData(updatedData);

    // If last sub-step, complete the entire assessment
    if (currentSubStep === SUB_STEPS.length - 1) {
      onNext(updatedData as AssessmentData);
    } else {
      setCurrentSubStep(prev => prev + 1);
    }
  };
  const handleSubStepBack = () => {
    setCurrentSubStep(prev => prev - 1);
  };
  const progressPercentage = (currentSubStep + 1) / SUB_STEPS.length * 100;
  const renderCurrentStep = () => {
    switch (currentSubStep) {
      case 0:
        return <ProfileStep onNext={handleSubStepNext} data={{
          headline: assessmentData.headline || "",
          years_experience: assessmentData.years_experience || 0
        }} />;
      case 1:
        return <SkillsStep onNext={handleSubStepNext} onBack={handleSubStepBack} data={{
          skills: assessmentData.skills || []
        }} headline={assessmentData.headline} />;
      case 2:
        return <CurrentPositionStep onNext={handleSubStepNext} onBack={handleSubStepBack} data={{
          currentRole: assessmentData.currentRole || "",
          currentCompany: assessmentData.currentCompany || "",
          yearsInRole: assessmentData.yearsInRole || 0
        }} />;
      case 3:
        return <AchievementsStep onNext={handleSubStepNext} onBack={handleSubStepBack} data={{
          keyAchievements: assessmentData.keyAchievements || ""
        }} />;
      case 4:
        return <CareerGoalsStep onNext={handleSubStepNext} onBack={handleSubStepBack} data={{
          careerGoals: assessmentData.careerGoals || "",
          preferredRoles: assessmentData.preferredRoles || []
        }} />;
      default:
        return null;
    }
  };
  return <div className="space-y-6">
      {/* Mini Progress Bar */}
      

      {/* Current Sub-Step Content */}
      {renderCurrentStep()}

    </div>;
};
export default ProfessionalAssessmentStep;