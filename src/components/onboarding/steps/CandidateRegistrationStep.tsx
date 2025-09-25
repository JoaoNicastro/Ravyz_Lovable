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

const CandidateRegistrationStep: React.FC<StepProps> = ({ onNext, onBack, isLoading, data }) => {
  const handleSubmit = async (formData: CandidateData) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não encontrado");

      // Get or create candidate profile
      let { data: profile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profile) {
        // Create new profile
        const { data: newProfile, error: createError } = await supabase
          .from('candidate_profiles')
          .insert({
            user_id: user.user.id,
            avatar_url: formData.avatar_url,
            headline: formData.headline,
            location: formData.location,
            years_experience: formData.years_experience,
            preferences: {
              completionLevel: 25
            }
          })
          .select()
          .single();

        if (createError) throw createError;
        profile = newProfile;
      } else {
        // Update existing profile
        const existingPrefs = (profile.preferences as any) || {};
        const { error: updateError } = await supabase
          .from('candidate_profiles')
          .update({
            avatar_url: formData.avatar_url,
            headline: formData.headline,
            location: formData.location,
            years_experience: formData.years_experience,
            preferences: {
              ...existingPrefs,
              completionLevel: 25
            }
          })
          .eq('id', profile.id);

        if (updateError) throw updateError;
      }

      toast.success("Perfil básico salvo!");
      onNext(formData);
    } catch (error) {
      console.error('Error saving candidate profile:', error);
      toast.error("Erro ao salvar perfil");
    }
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
            onBack={onBack}
            isLoading={isLoading}
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