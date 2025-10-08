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
  Users, 
  Briefcase,
  Building2,
  Target,
  ArrowRight,
  Heart,
  Handshake,
  Zap,
  Award,
  DollarSign,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { shortArchetypeDescriptions } from '@/lib/archetype-descriptions';

export default function CompanyProfileComplete() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = React.useState<any>(null);
  const [firstJob, setFirstJob] = React.useState<any>(null);
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
      const { data: companyData, error: companyError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (companyError) throw companyError;

      // Get the first job created
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (jobError && jobError.code !== 'PGRST116') throw jobError;

      setProfile(companyData);
      setFirstJob(jobData);
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
          <Button onClick={() => navigate('/onboarding/company')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const culture = profile.company_culture || {};
  const pillarScores = firstJob?.pillar_scores || {};
  const archetype = firstJob?.archetype || 'Equilibrado';
  
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

        {/* Hero Section - Company Profile */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Perfil Ativo</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Parabéns, o perfil da {profile.company_name} está ativo!
          </h1>

          {/* Company Logo and Description */}
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shadow-lg">
              <AvatarImage src={profile.logo_url} />
              <AvatarFallback className="text-2xl bg-primary/10">
                {profile.company_name?.[0] || 'C'}
              </AvatarFallback>
            </Avatar>
            
            {profile.description && (
              <p className="text-muted-foreground max-w-2xl">
                {profile.description}
              </p>
            )}
          </div>
          
          {/* Company Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {profile.industry && (
              <Card className="p-4">
                <div className="space-y-2 text-center">
                  <Briefcase className="h-5 w-5 mx-auto text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Setor</p>
                    <p className="font-medium text-sm">{profile.industry}</p>
                  </div>
                </div>
              </Card>
            )}
            {profile.location && (
              <Card className="p-4">
                <div className="space-y-2 text-center">
                  <MapPin className="h-5 w-5 mx-auto text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Localização</p>
                    <p className="font-medium text-sm">{profile.location}</p>
                  </div>
                </div>
              </Card>
            )}
            {profile.employee_count && (
              <Card className="p-4">
                <div className="space-y-2 text-center">
                  <Users className="h-5 w-5 mx-auto text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Funcionários</p>
                    <p className="font-medium text-sm">{profile.employee_count}</p>
                  </div>
                </div>
              </Card>
            )}
            {profile.founded_year && (
              <Card className="p-4">
                <div className="space-y-2 text-center">
                  <Building2 className="h-5 w-5 mx-auto text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fundada em</p>
                    <p className="font-medium text-sm">{profile.founded_year}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Culture Values */}
          {culture.values && culture.values.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">Nossos Valores</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {culture.values.map((value: string, idx: number) => {
                  const Icon = cultureIcons[value] || Award;
                  return (
                    <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Main Feature: Job Card with Archetype */}
        {firstJob && (
          <Card className="border-2 border-primary/30 shadow-2xl animate-scale-in max-w-5xl mx-auto">
            <CardHeader className="text-center space-y-2 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="inline-flex items-center justify-center gap-2 mx-auto px-4 py-1 rounded-full bg-primary/10 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">SUA PRIMEIRA VAGA</span>
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold">
                {firstJob.title}
              </CardTitle>
              
              {/* Job Key Info */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground pt-2">
                {firstJob.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{firstJob.location}</span>
                  </div>
                )}
                {firstJob.work_model && (
                  <Badge variant="secondary" className="capitalize">
                    {firstJob.work_model}
                  </Badge>
                )}
                {(firstJob.salary_min || firstJob.salary_max) && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    <span>
                      R$ {firstJob.salary_min?.toLocaleString() || '—'} - 
                      R$ {firstJob.salary_max?.toLocaleString() || '—'}
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-8 pt-8">
              {/* Archetype Highlight */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-lg p-8 border border-primary/20">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-primary text-sm">PERFIL IDEAL</span>
                  </div>
                  
                  <h2 className="text-4xl font-bold text-primary">
                    {archetype}
                  </h2>
                  
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {shortArchetypeDescriptions[archetype] || 'Perfil profissional único identificado.'}
                  </p>
                </div>
              </div>

              {/* Radar Chart */}
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Perfil Comportamental da Vaga</h3>
                  <p className="text-sm text-muted-foreground">
                    Baseado nos 5 pilares RAVYZ
                  </p>
                </div>
                
                <div className="w-full max-w-2xl mx-auto">
                  <MatchRadarChart
                    candidatePillars={pillarScores}
                    jobPillars={{}}
                  />
                </div>

                {/* Pillar Scores */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4">
                  {Object.entries(pillarScores).map(([pillar, score]) => {
                    const pillarLabels: Record<string, string> = {
                      'autonomy': 'Autonomia',
                      'leadership': 'Liderança',
                      'teamwork': 'Trabalho em Grupo',
                      'risk': 'Risco',
                      'ambition': 'Ambição'
                    };
                    return (
                      <div key={pillar} className="text-center space-y-1 p-3 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold text-primary">
                          {typeof score === 'number' ? score.toFixed(1) : '0.0'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {pillarLabels[pillar] || pillar}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Job Description */}
              {firstJob.description && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    Descrição da Vaga
                  </h4>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {firstJob.description}
                  </p>
                </div>
              )}

              {/* Technical Skills */}
              {firstJob.technical_skills && firstJob.technical_skills.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Habilidades Técnicas Requeridas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {firstJob.technical_skills.map((skill: any, idx: number) => {
                      const skillName = typeof skill === 'string' ? skill : skill.name || skill.skill;
                      const skillLevel = typeof skill === 'object' ? skill.level : null;
                      return (
                        <Badge key={idx} variant="secondary">
                          {skillName}
                          {skillLevel && <span className="ml-1 text-xs opacity-70">({skillLevel})</span>}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Education & Industries */}
              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                {firstJob.education_levels && firstJob.education_levels.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      Formação Desejada
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {firstJob.education_levels.map((level: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {firstJob.industries && firstJob.industries.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Experiência em Setores
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {firstJob.industries.map((industry: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Candidate Profile Requirements */}
              <div className="grid md:grid-cols-2 gap-6 pt-4 border-t">
                {firstJob.age_ranges && firstJob.age_ranges.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Faixa Etária
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {firstJob.age_ranges.map((range: string, idx: number) => (
                        <Badge key={idx} variant="outline">
                          {range}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {firstJob.gender_preference && firstJob.gender_preference !== 'indiferente' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Preferência de Gênero
                    </h4>
                    <Badge variant="outline" className="capitalize">
                      {firstJob.gender_preference}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
