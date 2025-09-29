import React from "react";
import ApplicationInfoStep from "./ApplicationInfoStep";

interface StepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: any;
}

const CandidateRegistrationStep: React.FC<StepProps> = ({ onNext, onBack, isLoading, data }) => {
  return (
    <ApplicationInfoStep 
      onNext={onNext} 
      onBack={onBack} 
      isLoading={isLoading} 
      data={data} 
    />
  );
};

export default CandidateRegistrationStep;