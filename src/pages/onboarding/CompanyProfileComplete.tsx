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
  Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { shortArchetypeDescriptions } from '@/lib/archetype-descriptions';

export default function CompanyProfileComplete() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = React.useState<any>(null);
  const [firstJob, setFirstJob] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [countdown, setCountdown] = React.useState(7);

  React.useEffect(() => {
    loadProfile();
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate('/dashboard/company');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [user, navigate]);

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
        
        {/* Countdown Timer */}
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-card/95 backdrop-blur border border-border rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Redirecionando em <span className="font-bold text-primary">{countdown}s</span>
              </span>
            </div>
          </div>
        </div>

        {/* Hero Section - Company Header (Resumido) */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Perfil Ativo</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Parabéns, o perfil da {profile.company_name} está ativo!
          </h1>
          
          {/* Company Info Compact */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-muted-foreground">
            {profile.industry && (
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span className="text-sm">{profile.industry}</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">{profile.location}</span>
              </div>
            )}
            {profile.employee_count && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="text-sm">{profile.employee_count} funcionários</span>
              </div>
            )}
          </div>

          {/* Culture Values */}
          {culture.values && culture.values.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {culture.values.slice(0, 4).map((value: string, idx: number) => {
                const Icon = cultureIcons[value] || Award;
                return (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50">
                    <Icon className="h-3 w-3 text-primary" />
                    <span className="text-xs font-medium">{value}</span>
                  </div>
                );
              })}
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
                  {Object.entries(pillarScores).map(([pillar, score]) => (
                    <div key={pillar} className="text-center space-y-1 p-3 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold text-primary">
                        {typeof score === 'number' ? score.toFixed(1) : '0.0'}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {pillar}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Job Description Preview */}
              {firstJob.description && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-semibold text-sm text-muted-foreground">Descrição</h4>
                  <p className="text-sm leading-relaxed line-clamp-3">
                    {firstJob.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-in">
          <Button
            size="lg"
            className="gap-2 group"
            onClick={() => navigate('/dashboard/company')}
          >
            Ir para o Dashboard
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
