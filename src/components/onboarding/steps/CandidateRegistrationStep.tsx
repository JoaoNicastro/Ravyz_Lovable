import React from "react";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { CandidateProfileForm } from "@/components/forms/CandidateProfileForm";

const candidateSchema = z.object({
  // Basic info fields
  date_of_birth: z.string().min(1, "Data de nascimento é obrigatória"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  cpf: z.string().min(11, "CPF é obrigatório e deve ter 11 dígitos"),
  gender: z.string().optional(),
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
  // Languages
  languages: z.array(z.object({
    language: z.string(),
    level: z.string(),
  })).default([]),
  // Education
  education: z.array(z.object({
    degree: z.string(),
    field: z.string(),
    institution: z.string(),
    status: z.string(),
    completionYear: z.number().optional(),
  })).default([]),
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
          <h4 className="font-medium text-foreground mb-2">💡 Dicas para dados completos:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Preencha todos os dados pessoais para facilitar o contato</li>
            <li>• Informações de endereço ajudam em vagas presenciais</li>
            <li>• Use o upload de currículo para preencher automaticamente</li>
            <li>• Adicione idiomas e formação acadêmica para melhor compatibilidade</li>
            <li>• CPF é necessário para formalização de contratação</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateRegistrationStep;