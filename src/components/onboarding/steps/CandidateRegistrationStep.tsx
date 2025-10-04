import React from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { CandidateProfileForm } from "@/components/forms/CandidateProfileForm";

const candidateSchema = z.object({
  // Basic info fields
  date_of_birth: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  // Address fields
  address_zipcode: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  // Profile fields
  avatar_url: z.string().optional(),
  headline: z.string().min(1, "Título profissional é obrigatório"),
  years_experience: z.number().min(0, "Anos de experiência deve ser um número positivo"),
  skills: z.array(z.string()).min(1, "Adicione pelo menos uma habilidade"),
});

type CandidateData = z.infer<typeof candidateSchema>;

interface StepProps {
  onNext: (data: CandidateData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: CandidateData;
}

const CandidateRegistrationStep: React.FC<StepProps> = ({ onNext, data }) => {
  const handleSubmit = (formData: CandidateData) => {
    onNext(formData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Informações para Candidatura
        </h2>
        <p className="text-muted-foreground">
          Forneça seus dados pessoais e profissionais para criar seu perfil
        </p>
      </div>


      <CandidateProfileForm
        onSubmit={handleSubmit}
        initialData={data}
      />

      {/* Tips */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-2">💡 Dicas para um perfil atrativo:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use um título profissional claro que descreva seu papel atual ou desejado</li>
            <li>• Preencha seu endereço completo para facilitar oportunidades próximas</li>
            <li>• Adicione suas principais habilidades técnicas e comportamentais</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateRegistrationStep;