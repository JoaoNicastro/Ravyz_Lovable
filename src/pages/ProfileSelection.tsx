import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ProfileSelection = () => {
  const [selectedProfile, setSelectedProfile] = useState<'candidate' | 'company' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleProfileSelect = async () => {
    if (!selectedProfile) return;
    
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não encontrado");

      // Update active_profile in users table
      const { error } = await supabase
        .from('users')
        .update({ 
          active_profile: selectedProfile,
          profiles: [selectedProfile] // Add to profiles array
        })
        .eq('id', user.user.id);

      if (error) throw error;

      // Redirect based on profile type
      if (selectedProfile === 'candidate') {
        navigate('/onboarding/candidate');
      } else {
        navigate('/company/profile');
      }
      
      toast.success(`Perfil ${selectedProfile === 'candidate' ? 'candidato' : 'empresa'} selecionado!`);
    } catch (error) {
      console.error('Error selecting profile:', error);
      toast.error("Erro ao selecionar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold text-2xl">R</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Bem-vindo ao RAVYZ</h1>
          <p className="text-muted-foreground text-lg">
            Escolha como você gostaria de usar nossa plataforma
          </p>
        </div>

        {/* Profile Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Candidate Card */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
              selectedProfile === 'candidate' 
                ? 'ring-2 ring-primary bg-primary-light border-primary' 
                : 'border-border hover:border-primary/30'
            }`}
            onClick={() => setSelectedProfile('candidate')}
          >
            <CardContent className="p-8 text-center space-y-6">
              {selectedProfile === 'candidate' && (
                <CheckCircle className="h-6 w-6 text-primary mx-auto" />
              )}
              
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <User className="h-8 w-8 text-primary" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Sou Candidato</h3>
                <p className="text-muted-foreground">
                  Encontre oportunidades perfeitas com nossa IA de matching
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">Buscar vagas</Badge>
                <Badge variant="secondary">Análise de currículo</Badge>
                <Badge variant="secondary">Matching IA</Badge>
              </div>

              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>✓ Upload e análise inteligente do currículo</li>
                <li>✓ Matching personalizado com empresas</li>
                <li>✓ Insights de carreira e sugestões</li>
                <li>✓ Acompanhamento de candidaturas</li>
              </ul>
            </CardContent>
          </Card>

          {/* Company Card */}
          <Card 
            className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
              selectedProfile === 'company' 
                ? 'ring-2 ring-primary bg-primary-light border-primary' 
                : 'border-border hover:border-primary/30'
            }`}
            onClick={() => setSelectedProfile('company')}
          >
            <CardContent className="p-8 text-center space-y-6">
              {selectedProfile === 'company' && (
                <CheckCircle className="h-6 w-6 text-primary mx-auto" />
              )}
              
              <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto">
                <Building className="h-8 w-8 text-success" />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">Sou Empresa</h3>
                <p className="text-muted-foreground">
                  Encontre os melhores talentos com inteligência artificial
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">Publicar vagas</Badge>
                <Badge variant="secondary">Encontrar talentos</Badge>
                <Badge variant="secondary">Dashboard</Badge>
              </div>

              <ul className="text-sm text-muted-foreground space-y-2 text-left">
                <li>✓ Criação e gestão de vagas</li>
                <li>✓ Candidatos recomendados por IA</li>
                <li>✓ Análise de compatibilidade</li>
                <li>✓ Dashboard com métricas</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleProfileSelect}
            disabled={!selectedProfile || isLoading}
            className="px-8"
          >
            {isLoading ? "Configurando..." : "Continuar"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Switch Profile Note */}
        <p className="text-center text-sm text-muted-foreground">
          Você poderá alternar entre perfis a qualquer momento nas configurações
        </p>
      </div>
    </div>
  );
};

export default ProfileSelection;