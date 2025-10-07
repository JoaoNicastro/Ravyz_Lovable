import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Sparkles, 
  MapPin, 
  Users, 
  Globe,
  Award,
  Briefcase,
  Gift,
  Building2,
  Edit,
  Search,
  Heart,
  Handshake,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function CompanyProfileComplete() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<any>(null);
  const [jobsCount, setJobsCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (companyError) throw companyError;

      // Count active jobs
      const { count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyData.id)
        .eq('status', 'active');

      setProfile(companyData);
      setJobsCount(count || 0);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Perfil não encontrado</p>
          <Button onClick={() => navigate('/onboarding')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const culture = profile.company_culture || {};
  const socialLinks = profile.social_links || {};
  
  // Map culture values to icons
  const cultureIcons: Record<string, any> = {
    'Inovação': Zap,
    'Colaboração': Handshake,
    'Sustentabilidade': Heart,
    'Excelência': Award
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12 space-y-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Perfil Completo</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            O perfil de {profile.company_name} está pronto para atrair os melhores talentos!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sua empresa agora tem uma presença profissional completa na plataforma.
          </p>
        </div>

        {/* Card Principal - Identidade da Marca */}
        <Card className="border-2 border-primary/20 shadow-lg animate-scale-in overflow-hidden">
          {/* Banner/Header Image */}
          <div className="h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Building2 className="h-24 w-24 text-primary/20" />
            </div>
          </div>
          
          {/* Logo and Company Info */}
          <CardContent className="relative -mt-16 space-y-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profile.logo_url} />
                <AvatarFallback className="text-3xl bg-primary/10">
                  {profile.company_name?.[0] || 'C'}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold">{profile.company_name}</h2>
                {profile.description && (
                  <p className="text-muted-foreground max-w-2xl">
                    {profile.description}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Cards Secundários */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sobre Nós */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Sobre Nós
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.industry && (
                <div className="flex items-start gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Setor</p>
                    <p className="font-medium">{profile.industry}</p>
                  </div>
                </div>
              )}
              {profile.location && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Localização</p>
                    <p className="font-medium">{profile.location}</p>
                  </div>
                </div>
              )}
              {profile.employee_count && (
                <div className="flex items-start gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Funcionários</p>
                    <p className="font-medium">{profile.employee_count}</p>
                  </div>
                </div>
              )}
              {profile.founded_year && (
                <div className="flex items-start gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fundada em</p>
                    <p className="font-medium">{profile.founded_year}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cultura e Valores */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Cultura e Valores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {culture.values && culture.values.length > 0 ? (
                <div className="space-y-3">
                  {culture.values.map((value: string, idx: number) => {
                    const Icon = cultureIcons[value] || Award;
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{value}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum valor cadastrado</p>
              )}
            </CardContent>
          </Card>

          {/* Vagas Abertas */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Vagas Abertas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-6">
                <div className="text-4xl font-bold text-primary mb-2">
                  {jobsCount}
                </div>
                <p className="text-sm text-muted-foreground">
                  {jobsCount === 0 ? 'Nenhuma vaga ativa' :
                   jobsCount === 1 ? 'Vaga ativa' : 'Vagas ativas'}
                </p>
              </div>
              {jobsCount === 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/company-dashboard')}
                >
                  Criar Primeira Vaga
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Links e Conectividade */}
          {(profile.website || Object.keys(socialLinks).length > 0) && (
            <Card className="hover-scale md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Conectividade
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      {profile.website}
                    </a>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {Object.entries(socialLinks).map(([platform, url]: [string, any]) => (
                    <Badge key={platform} variant="secondary">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tamanho da Empresa */}
          {profile.size_category && (
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Categoria de Tamanho
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-base">
                  {profile.size_category}
                </Badge>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Call to Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-fade-in">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => navigate('/company-dashboard')}
          >
            <Search className="h-5 w-5" />
            Buscar Candidatos
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() => navigate('/company-profile')}
          >
            <Edit className="h-5 w-5" />
            Editar Perfil da Empresa
          </Button>
        </div>
      </div>
    </div>
  );
}
