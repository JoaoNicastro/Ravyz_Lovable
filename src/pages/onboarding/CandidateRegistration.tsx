import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CandidateProfileForm } from "@/components/forms/CandidateProfileForm";

const CandidateRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não encontrado");

      // Get existing profile
      const { data: profile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (profileError) throw profileError;

      // Update profile with form data
      const { error: updateError } = await supabase
        .from('candidate_profiles')
        .update({
          avatar_url: data.avatar_url,
          headline: data.headline,
          location: data.location,
          years_experience: data.years_experience,
          preferences: {
            completionLevel: 50 // Basic info completed
          }
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success("Perfil básico configurado!");
      navigate('/onboarding/validation');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/onboarding/fill-method');
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Progress value={50} className="w-32 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Vamos criar seu perfil</h1>
          <p className="text-muted-foreground">
            Preencha suas informações básicas para que empresas possam te encontrar
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent>
            <CandidateProfileForm
              onSubmit={handleSubmit}
              onBack={handleBack}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Progress Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              ✓ Método de preenchimento • <strong>✓ Informações básicas</strong> • Validação cultural • Emprego dos sonhos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateRegistration;