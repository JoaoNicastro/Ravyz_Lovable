import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { MatchRadarChart } from '@/components/MatchRadarChart';
import { Notifications } from '@/components/Notifications';
import { UserDropdown } from '@/components/UserDropdown';
import { CheckCircle, XCircle, User, MapPin, Briefcase, LayoutDashboard, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';
import ravyzLogo from '@/assets/ravyz-logo.png';
import { CreateJobDialog } from '@/components/CreateJobDialog';
import { supabase } from '@/integrations/supabase/client';
import { getCompanyJobMatches, getCompanyStats, JobMatchSummary } from '@/services/companyMatchingService';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobMatches, setJobMatches] = useState<JobMatchSummary[]>([]);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    activeJobs: 0,
    totalMatches: 0,
    topMatchScore: 0,
  });

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);

      // Load company profile
      const { data: profile, error: profileError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileError) throw profileError;
      
      if (profile) {
        setCompanyId(profile.id);
        setCompanyProfile(profile);

        // Load job matches
        const matches = await getCompanyJobMatches(profile.id);
        setJobMatches(matches);

        // Load stats
        const statsData = await getCompanyStats(profile.id);
        setStats(statsData);

        console.log('✅ Loaded company data:', {
          company: profile.company_name,
          jobs: matches.length,
          totalMatches: statsData.totalMatches,
        });
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados da empresa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleJobExpansion = (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
    }
    setExpandedJobs(newExpanded);
  };

  const handleInviteCandidate = (candidateId: string, jobId: string) => {
    toast({
      title: 'Candidato convidado!',
      description: 'O convite foi enviado com sucesso.',
    });
    console.log('📧 Invited candidate:', candidateId, 'for job:', jobId);
  };

  const handleRejectCandidate = (candidateId: string, jobId: string) => {
    toast({
      title: 'Candidato rejeitado',
      description: 'O feedback foi registrado.',
    });
    console.log('❌ Rejected candidate:', candidateId, 'for job:', jobId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="w-12 h-12 animate-pulse mx-auto text-primary" />
          <p className="text-muted-foreground">Calculando compatibilidades...</p>
        </div>
      </div>
    );
  }

  if (!companyProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Perfil não encontrado</CardTitle>
            <CardDescription>Complete seu cadastro de empresa</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Calculate alerts
  const jobsWithoutCandidates = jobMatches.filter(job => job.matches.length === 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={ravyzLogo} alt="Ravyz" className="h-8" />
            </div>
            
            <div className="flex items-center gap-4">
              <Notifications />
              <UserDropdown />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{companyProfile.company_name}</h1>
          <p className="text-muted-foreground">{companyProfile.description || 'Dashboard da empresa'}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="matches">
              <User className="w-4 h-4 mr-2" />
              Candidatos Compatíveis
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="w-4 h-4 mr-2" />
              Minhas Vagas ({stats.activeJobs})
            </TabsTrigger>
          </TabsList>

          {/* Tab 0: Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Vagas Ativas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.activeJobs}</div>
                  <p className="text-xs text-muted-foreground mt-1">Publicadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Candidatos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalMatches}</div>
                  <p className="text-xs text-muted-foreground mt-1">Compatíveis ≥75%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top Match
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {Math.round(stats.topMatchScore)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Melhor compatibilidade</p>
                </CardContent>
              </Card>
            </div>

            {/* Alerts */}
            {jobsWithoutCandidates.length > 0 && (
              <Card className="border-orange-500/50 bg-orange-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="w-5 h-5" />
                    Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {jobsWithoutCandidates.length} vaga(s) sem candidatos compatíveis.
                    Considere revisar os requisitos ou ampliar o escopo da busca.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Vagas com Mais Candidatos</CardTitle>
                <CardDescription>Ranking das vagas por número de matches ≥75%</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobMatches.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma vaga cadastrada
                    </p>
                  ) : (
                    jobMatches
                      .sort((a, b) => b.matches.length - a.matches.length)
                      .slice(0, 5)
                      .map((job) => {
                        const matchCount = job.matches.length;
                        const topMatch = job.matches[0];
                        
                        return (
                          <div key={job.job_id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                            <div className="flex-1">
                              <p className="font-medium">{job.job_title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {job.job_location}
                                </span>
                                {topMatch && (
                                  <Badge variant="outline" className="text-xs">
                                    Top: {Math.round(topMatch.match_percentage)}%
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{matchCount}</div>
                              <div className="text-xs text-muted-foreground">candidatos</div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches" className="space-y-6 mt-6">
            {jobMatches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma vaga cadastrada</p>
                  {companyId && (
                    <CreateJobDialog 
                      companyId={companyId} 
                      onJobCreated={loadAllData}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {jobMatches.map((job) => {
                  const isExpanded = expandedJobs.has(job.job_id);

                  return (
                    <Card key={job.job_id}>
                      <Collapsible open={isExpanded} onOpenChange={() => toggleJobExpansion(job.job_id)}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-xl">{job.job_title}</CardTitle>
                                <CardDescription className="mt-2 flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {job.job_location}
                                  </span>
                                  {job.job_archetype && (
                                    <Badge variant="outline">{job.job_archetype}</Badge>
                                  )}
                                  <span className="text-primary font-medium">
                                    {job.matches.length} candidatos compatíveis
                                  </span>
                                </CardDescription>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                          </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <CardContent className="pt-0">
                            {job.matches.length === 0 ? (
                              <p className="text-center text-muted-foreground py-8">
                                Nenhum candidato compatível encontrado
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {job.matches.map((match) => (
                                  <Card key={match.candidate_id} className="border-2">
                                    <CardHeader>
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <CardTitle className="text-lg">
                                            {match.candidate_name}
                                          </CardTitle>
                                          <CardDescription className="mt-1">
                                            {match.candidate_headline}
                                          </CardDescription>
                                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              <MapPin className="w-3 h-3" />
                                              {match.candidate_location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Briefcase className="w-3 h-3" />
                                              {match.years_experience} anos
                                            </span>
                                          </div>
                                          {match.application_status && (
                                            <div className="mt-2">
                                              <Badge variant="secondary">
                                                Status: {match.application_status}
                                              </Badge>
                                            </div>
                                          )}
                                        </div>
                                        <div className="text-right">
                                          <div className="text-3xl font-bold text-primary">
                                            {Math.round(match.match_percentage)}%
                                          </div>
                                          <div className="text-xs text-muted-foreground">Match</div>
                                        </div>
                                      </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                      {/* Archetypes */}
                                      {match.archetype && job.job_archetype && (
                                        <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 rounded-lg">
                                          <Badge variant="outline" className="px-3 py-1">
                                            {match.archetype}
                                          </Badge>
                                          <span className="text-sm text-muted-foreground">vs</span>
                                          <Badge variant="outline" className="px-3 py-1">
                                            {job.job_archetype}
                                          </Badge>
                                        </div>
                                      )}

                                      {/* Pillar Breakdown */}
                                      {Object.keys(match.pillar_breakdown).length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-semibold mb-3">Detalhamento por Pilar</h4>
                                          <div className="grid gap-2">
                                            {Object.entries(match.pillar_breakdown).map(([pillar, score]) => {
                                              const pillarScore = score as number;
                                              return (
                                                <div key={pillar} className="flex items-center justify-between text-sm">
                                                  <span className="text-muted-foreground capitalize">{pillar}</span>
                                                  <div className="flex items-center gap-2">
                                                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                                      <div 
                                                        className="h-full bg-primary"
                                                        style={{ width: `${Math.min(100, Math.max(0, pillarScore))}%` }}
                                                      />
                                                    </div>
                                                    <span className="w-12 text-right font-medium">
                                                      {Math.round(pillarScore)}%
                                                    </span>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* Skills */}
                                      {match.skills.length > 0 && (
                                        <div>
                                          <h4 className="text-sm font-semibold mb-2">Habilidades</h4>
                                          <div className="flex flex-wrap gap-2">
                                            {match.skills.map((skill, index) => (
                                              <Badge key={index} variant="secondary">
                                                {skill}
                                              </Badge>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      {/* Actions */}
                                      <div className="flex gap-3 pt-2 border-t">
                                        <Button 
                                          className="flex-1"
                                          onClick={() => handleInviteCandidate(match.candidate_id, job.job_id)}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Convidar
                                        </Button>
                                        <Button 
                                          variant="outline"
                                          className="flex-1"
                                          onClick={() => handleRejectCandidate(match.candidate_id, job.job_id)}
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Rejeitar
                                        </Button>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </CollapsibleContent>
                      </Collapsible>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="jobs" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-muted-foreground">Gerencie suas vagas publicadas</p>
              {companyId && (
                <CreateJobDialog 
                  companyId={companyId} 
                  onJobCreated={loadAllData}
                />
              )}
            </div>
            
            {jobMatches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Nenhuma vaga publicada ainda</p>
                  <p className="text-muted-foreground mb-6">
                    Crie sua primeira vaga e comece a encontrar candidatos compatíveis
                  </p>
                  {companyId && (
                    <CreateJobDialog 
                      companyId={companyId} 
                      onJobCreated={loadAllData}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {jobMatches.map((job) => (
                  <Card key={job.job_id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle>{job.job_title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {job.job_location}
                            </span>
                            {job.job_archetype && (
                              <Badge variant="outline">{job.job_archetype}</Badge>
                            )}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">
                            {job.matches.length}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            candidatos compatíveis
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-muted-foreground">
                          {job.matches.length > 0 ? (
                            <>
                              Top match: {Math.round(job.matches[0].match_percentage)}%
                            </>
                          ) : (
                            'Aguardando candidatos'
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setActiveTab('matches')}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
