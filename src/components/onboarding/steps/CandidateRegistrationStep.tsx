import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateProfileForm } from "@/components/forms/CandidateProfileForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const candidateSchema = z.object({
  avatar_url: z.string().optional(),
  headline: z.string().min(1, "Título profissional é obrigatório"),
  location: z.string().min(1, "Localização é obrigatória"),
  years_experience: z.number().min(0, "Anos de experiência deve ser um número positivo"),
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
          Vamos criar seu perfil profissional
        </h2>
        <p className="text-muted-foreground">
          Essas informações ajudarão empresas a te encontrar mais facilmente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
        </CardHeader>
        <CardContent>
          <CandidateProfileForm
            onSubmit={handleSubmit}
            initialData={data}
          />
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-2">💡 Dicas para um perfil atrativo:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use um título profissional claro que descreva seu papel atual ou desejado</li>
            <li>• Seja específico sobre sua localização (cidade, estado)</li>
            <li>• Inclua uma foto profissional se possível</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateRegistrationStep;