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
            Seu perfil está pronto para brilhar, {profile.full_name?.split(' ')[0]}!
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
          {/* Informações de Contato */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>{profile.full_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{profile.location || 'Não informado'}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span>{profile.current_position || 'Não informado'}</span>
              </div>
              {profile.headline && (
                <p className="text-sm text-muted-foreground pt-2">
                  {profile.headline}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Experiência */}
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Experiência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Anos de Experiência</span>
                <Badge variant="secondary">{profile.years_experience || 0} anos</Badge>
              </div>
              {profile.career_goals && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-1">Objetivos de Carreira</p>
                  <p className="text-sm">{profile.career_goals}</p>
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

          {/* Habilidades */}
          <Card className="hover-scale md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Habilidades Chave
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
          <Card className="hover-scale">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Preferências
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {preferences.workModel && (
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span>{preferences.workModel}</span>
                </div>
              )}
              {preferences.salaryRange && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>
                    R$ {preferences.salaryRange.min?.toLocaleString()} - 
                    R$ {preferences.salaryRange.max?.toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
