import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MatchRadarChart } from '@/components/MatchRadarChart';
import { 
  Sparkles, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Target,
  DollarSign,
  Home,
  Edit,
  Search,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function CandidateProfileComplete() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  React.useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
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

  const pillarScores = profile.pillar_scores || {};
  const archetype = profile.archetype || 'Não definido';
  const skills = profile.skills || [];
  const education = profile.education || [];
  const preferences = profile.preferences || {};
  const languages = profile.languages || [];
  const preferredRoles = profile.preferred_roles || [];
  
  // Calculate age from date_of_birth
  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const age = profile.date_of_birth ? getAge(profile.date_of_birth) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12 space-y-8 max-w-7xl">
        {/* Logout Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Perfil Completo</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">
            Seu perfil está pronto para brilhar, {user?.user_metadata?.full_name?.split(' ')[0] || 'candidato'}!
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Agora você pode começar a explorar oportunidades alinhadas com seu perfil profissional único.
          </p>
        </div>

        {/* Archetype Card - Destaque Principal */}
        <Card className="border-2 border-primary/20 shadow-lg animate-scale-in">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-full bg-primary/10 mb-4">
              <Award className="h-5 w-5 text-primary" />
              <span className="font-semibold text-primary">Seu Arquétipo RAVYZ</span>
            </div>
            <CardTitle className="text-3xl font-bold text-primary">
              {archetype}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <div className="w-full max-w-2xl">
                <MatchRadarChart
                  candidatePillars={pillarScores}
                  jobPillars={pillarScores}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              {Object.entries(pillarScores).map(([pillar, score]) => (
                <div key={pillar} className="text-center space-y-1">
                  <div className="text-2xl font-bold text-primary">
                    {typeof score === 'number' ? score.toFixed(1) : '0.0'}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {pillar === 'compensation' ? 'Remuneração' :
                     pillar === 'ambiente' ? 'Ambiente' :
                     pillar === 'proposito' ? 'Propósito' : 'Crescimento'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Grid de Cards Secundários */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Informações Pessoais */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>{user?.user_metadata?.full_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user?.user_metadata?.full_name && (
                <div className="pb-2">
                  <p className="text-xs text-muted-foreground mb-1">Nome Completo</p>
                  <p className="text-sm font-medium">{user.user_metadata.full_name}</p>
                </div>
              )}
              {user?.email && (
                <div className="pb-2">
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
              )}
              {profile.headline && (
                <div className="pb-2">
                  <p className="text-xs text-muted-foreground mb-1">Headline</p>
                  <p className="text-sm font-medium">{profile.headline}</p>
                </div>
              )}
              {age && (
                <div className="flex items-center gap-2 text-sm">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span>{age} anos</span>
                </div>
              )}
              {profile.gender && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground">Gênero:</span>
                  <span className="capitalize">{profile.gender}</span>
                </div>
              )}
              {profile.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-xs text-muted-foreground">Telefone:</span>
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile.location && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{profile.location}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experiência Profissional */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Experiência Profissional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.current_position && (
                <div className="pb-2">
                  <p className="text-xs text-muted-foreground mb-1">Posição Atual</p>
                  <p className="text-sm font-medium">{profile.current_position}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Experiência</span>
                <Badge variant="secondary">{profile.years_experience || 0} anos</Badge>
              </div>
              {profile.key_achievements && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Principais Realizações</p>
                  <p className="text-sm">{profile.key_achievements}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formação */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Formação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {education.length > 0 ? (
                <div className="space-y-3">
                  {education.slice(0, 2).map((edu: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <p className="font-medium text-sm">{edu.degree || edu.course}</p>
                      <p className="text-xs text-muted-foreground">
                        {edu.institution} {edu.year && `• ${edu.year}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma formação cadastrada</p>
              )}
            </CardContent>
          </Card>

          {/* Idiomas */}
          {languages.length > 0 && (
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Idiomas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {languages.map((lang: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{lang.language}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {lang.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Funções Preferidas */}
          {preferredRoles.length > 0 && (
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Funções de Interesse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {preferredRoles.map((role: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {role}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Objetivos de Carreira */}
          {profile.career_goals && (
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Objetivos de Carreira
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{profile.career_goals}</p>
              </CardContent>
            </Card>
          )}

          {/* Habilidades */}
          <Card className="hover-scale md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Habilidades Técnicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {typeof skill === 'string' ? skill : skill.name || skill.skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma habilidade cadastrada</p>
              )}
            </CardContent>
          </Card>

          {/* Preferências */}
          {(preferences.preferred_locations?.length > 0 || 
            preferences.industry_interests?.length > 0 || 
            preferences.deal_breakers?.length > 0 ||
            preferences.additional_preferences?.length > 0) && (
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Preferências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {preferences.preferred_locations?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Locais Preferidos</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences.preferred_locations.map((location: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {location}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {preferences.industry_interests?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Indústrias de Interesse</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences.industry_interests.map((industry: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {preferences.deal_breakers?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Deal Breakers</p>
                    <div className="flex flex-wrap gap-2">
                      {preferences.deal_breakers.map((item: string, idx: number) => (
                        <Badge key={idx} variant="destructive" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {preferences.additional_preferences?.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Preferências Adicionais</p>
                    <div className="space-y-1">
                      {preferences.additional_preferences.map((pref: string, idx: number) => (
                        <p key={idx} className="text-sm">{pref}</p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
