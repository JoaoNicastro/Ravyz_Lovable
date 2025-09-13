import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Linkedin, Upload, Edit, ArrowRight, CheckCircle, Zap, Clock, Gauge } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type FillMethod = 'linkedin' | 'upload' | 'manual';

const FillMethodSelection = () => {
  const [selectedMethod, setSelectedMethod] = useState<FillMethod | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleMethodSelect = async () => {
    if (!selectedMethod) return;
    
    setIsLoading(true);
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

      // Create profile if doesn't exist
      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('candidate_profiles')
          .insert({
            user_id: user.user.id,
            preferences: {
              fillMethod: selectedMethod,
              dataQuality: selectedMethod === 'linkedin' ? 'high' : selectedMethod === 'upload' ? 'medium' : 'low',
              completionLevel: 0
            }
          })
          .select()
          .single();

        if (createError) throw createError;
        profile = newProfile;
      } else {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('candidate_profiles')
          .update({
          preferences: {
            fillMethod: selectedMethod,
            dataQuality: selectedMethod === 'linkedin' ? 'high' : selectedMethod === 'upload' ? 'medium' : 'low'
          }
          })
          .eq('id', profile.id);

        if (updateError) throw updateError;
      }

      // Redirect based on method
      if (selectedMethod === 'linkedin') {
        // TODO: Implement LinkedIn OAuth flow
        toast.info("Integração LinkedIn em desenvolvimento");
        navigate('/onboarding/candidate');
      } else if (selectedMethod === 'upload') {
        navigate('/resume/analyze');
      } else {
        navigate('/onboarding/candidate');
      }

      toast.success("Método selecionado com sucesso!");
    } catch (error) {
      console.error('Error selecting method:', error);
      toast.error("Erro ao selecionar método");
    } finally {
      setIsLoading(false);
    }
  };

  const methods = [
    {
      id: 'linkedin' as FillMethod,
      title: 'LinkedIn',
      description: 'Importe seus dados do LinkedIn automaticamente',
      icon: Linkedin,
      time: '2 min',
      quality: 'high',
      badge: 'Recomendado',
      badgeVariant: 'default' as const,
      features: [
        'Importação automática de dados',
        'Histórico profissional completo',
        'Skills e recomendações',
        'Rede de contatos'
      ],
      pros: ['Mais rápido', 'Dados verificados', 'Perfil completo'],
      qualityColor: 'text-success'
    },
    {
      id: 'upload' as FillMethod,
      title: 'Upload de Currículo',
      description: 'Faça upload do seu CV em PDF para análise automática',
      icon: Upload,
      time: '5 min',
      quality: 'medium',
      badge: 'Preciso',
      badgeVariant: 'secondary' as const,
      features: [
        'Análise IA do currículo',
        'Extração de experiências',
        'Identificação de skills',
        'Score de qualidade'
      ],
      pros: ['Análise detalhada', 'Sugestões de melhoria', 'Score profissional'],
      qualityColor: 'text-warning'
    },
    {
      id: 'manual' as FillMethod,
      title: 'Preenchimento Manual',
      description: 'Digite suas informações manualmente',
      icon: Edit,
      time: '15 min',
      quality: 'low',
      badge: 'Flexível',
      badgeVariant: 'outline' as const,
      features: [
        'Controle total dos dados',
        'Personalização completa',
        'Sem dependências',
        'Privacidade máxima'
      ],
      pros: ['Controle total', 'Personalização', 'Sem uploads'],
      qualityColor: 'text-muted-foreground'
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Progress value={25} className="w-32 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Como você quer preencher seu perfil?</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha o método que melhor se adapta ao seu estilo. Você sempre pode complementar ou editar as informações depois.
          </p>
        </div>

        {/* Method Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {methods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;
            
            return (
              <Card 
                key={method.id}
                className={`cursor-pointer transition-all duration-300 hover:shadow-md relative ${
                  isSelected 
                    ? 'ring-2 ring-primary bg-primary-light border-primary' 
                    : 'border-border hover:border-primary/30'
                }`}
                onClick={() => setSelectedMethod(method.id)}
              >
                {method.badge && (
                  <Badge 
                    variant={method.badgeVariant}
                    className="absolute -top-2 -right-2 z-10"
                  >
                    {method.badge}
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  {isSelected && (
                    <CheckCircle className="h-6 w-6 text-primary mx-auto mb-2" />
                  )}
                  
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  
                  <CardTitle className="text-xl">{method.title}</CardTitle>
                  <p className="text-muted-foreground text-sm">{method.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Time and Quality */}
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{method.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Gauge className="h-4 w-4 text-muted-foreground" />
                      <span className={method.qualityColor}>
                        {method.quality === 'high' ? 'Alta' : method.quality === 'medium' ? 'Média' : 'Básica'}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Inclui:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {method.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pros */}
                  <div className="flex flex-wrap gap-1">
                    {method.pros.map((pro, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {pro}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quality Explanation */}
        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium mb-2">Por que a qualidade dos dados importa?</h3>
                <p className="text-sm text-muted-foreground">
                  Dados mais completos resultam em matches mais precisos com empresas e oportunidades. 
                  Nossa IA analisa cada informação para encontrar as vagas ideais para você.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Continue Button */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleMethodSelect}
            disabled={!selectedMethod || isLoading}
            className="px-8"
          >
            {isLoading ? "Configurando..." : "Continuar"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FillMethodSelection;