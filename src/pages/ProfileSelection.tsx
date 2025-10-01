import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building, ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import ravyzLogo from "@/assets/ravyz-logo.png";

const ProfileSelection = () => {
  const [selectedProfile, setSelectedProfile] = useState<'candidate' | 'company' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(true);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Detectar se usuário chegou aqui via confirmação de email
  useEffect(() => {
    const checkAuthFromEmail = async () => {
      // Verificar se há hash na URL (token de confirmação)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      
      if (accessToken) {
        console.log('🔐 Token detectado na URL, processando autenticação...');
        // Aguardar um momento para o Supabase processar o token
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      setIsProcessingAuth(false);
    };

    checkAuthFromEmail();
  }, []);

  const handleProfileSelect = async () => {
    if (!selectedProfile) {
      console.log("❌ Nenhum perfil selecionado");
      return;
    }
    
    // 1. Verificar se o usuário está autenticado
    if (authLoading) {
      console.log("⏳ Aguardando verificação de autenticação...");
      return;
    }
    
    if (!user) {
      console.log("❌ Usuário não autenticado, redirecionando para /auth");
      toast.error("Você precisa estar logado para continuar");
      navigate('/auth');
      return;
    }

    console.log("✅ Usuário autenticado:", user.id);
    console.log("🎯 Perfil selecionado:", selectedProfile);
    
    setIsLoading(true);
    try {
      // 2. Garantir que o registro do usuário existe
      console.log("🔍 Verificando registro do usuário...");
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      // Se o usuário não existe, criar o registro
      if (!existingUser && !fetchError) {
        console.log("➕ Criando registro do usuário...");
        const { error: insertError } = await supabase
          .from('users')
          .insert({ 
            id: user.id, 
            email: user.email!,
            active_profile: selectedProfile,
            profiles: [selectedProfile]
          });

        if (insertError) {
          console.error("❌ Erro ao criar usuário:", insertError);
          throw insertError;
        }
        console.log("✅ Usuário criado com sucesso");
      } else {
        // Usuário já existe, apenas atualizar
        console.log("💾 Atualizando active_profile no banco...");
        const { error } = await supabase
          .from('users')
          .update({ 
            active_profile: selectedProfile,
            profiles: [selectedProfile]
          })
          .eq('id', user.id);

        if (error) {
          console.error("❌ Erro na query Supabase:", error);
          throw error;
        }
      }

      console.log("✅ Active profile salvo:", selectedProfile);
      
      // 3. Redirecionamento confiável
      const targetRoute = selectedProfile === 'candidate' 
        ? '/onboarding/candidate' 
        : '/onboarding/company';
      
      console.log("🔄 Redirecionando para:", targetRoute);
      
      toast.success(`Perfil ${selectedProfile === 'candidate' ? 'candidato' : 'empresa'} selecionado!`);
      
      // Use window.location para garantir redirecionamento
      setTimeout(() => {
        navigate(targetRoute);
      }, 500);
      
    } catch (error) {
      console.error('❌ Erro ao selecionar perfil:', error);
      toast.error("Erro ao selecionar perfil. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state enquanto verifica autenticação
  if (authLoading || isProcessingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {isProcessingAuth ? 'Confirmando sua conta...' : 'Carregando...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={ravyzLogo} 
              alt="RAVYZ Logo" 
              className="w-16 h-16 object-contain"
            />
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
            disabled={!selectedProfile || isLoading || authLoading}
            className="px-8"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Configurando...
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
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