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
import { CheckCircle, XCircle, User, MapPin, Briefcase, LayoutDashboard, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import ravyzLogo from '@/assets/ravyz-logo.png';
import { MatchingEngine, CandidateRavyzData, JobRavyzData } from '@/lib/matching-engine';
import { mockCandidates, mockJobs, MockCandidate, MockJob, getMockJobsByCompanyId } from '@/lib/mock-loader';
import { CreateJobDialog } from '@/components/CreateJobDialog';
import { supabase } from '@/integrations/supabase/client';

interface MatchResult {
  candidate_id: string;
  job_id: string;
  compatibility_score: number;
  pillar_breakdown: Record<string, number>;
  candidate_archetype: string;
  job_archetype: string;
  base_similarity: number;
  archetype_boost: number;
  candidate: MockCandidate;
}

export default function CompanyDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<MockJob[]>([]);
  const [jobMatches, setJobMatches] = useState<Record<string, MatchResult[]>>({});
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    loadCompanyProfile();
    loadMockData();
  }, []);

  const loadCompanyProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      if (data) {
        setCompanyId(data.id);
      }
    } catch (error) {
      console.error('Error loading company profile:', error);
    }
  };

  const loadMockData = async () => {
    try {
      setLoading(true);
      
      // Get company jobs (filter by test-company-123)
      const companyJobs = getMockJobsByCompanyId('test-company-123');
      setJobs(companyJobs);

      console.log(`🏢 Loading ${companyJobs.length} company jobs`);

      // Prepare candidates data for matching
      const candidatesData: CandidateRavyzData[] = mockCandidates.map(candidate => ({
        id: candidate.id,
        pillar_scores: candidate.pillar_scores,
        archetype: candidate.archetype,
        skills: candidate.skills,
        yearsExperience: candidate.years_experience,
      }));

      // Prepare jobs data for matching
      const jobsData: JobRavyzData[] = companyJobs.map(job => ({
        id: job.id,
        pillar_scores: job.pillar_scores,
        archetype: job.archetype,
        hardSkills: job.requirements,
      }));

      console.log(`🎯 Calculating matches for ${candidatesData.length} candidates...`);

      // Calculate matches
      const matchingEngine = new MatchingEngine();
      const allMatches = matchingEngine.calculateAllMatches(candidatesData, jobsData);

      console.log(`✅ Generated ${allMatches.length} matches`);

      // Group matches by job
      const matchesByJob: Record<string, MatchResult[]> = {};
      
      companyJobs.forEach(job => {
        const jobMatchResults = allMatches
          .filter(match => match.job_id === job.id)
          .map(match => {
            const candidate = mockCandidates.find(c => c.id === match.candidate_id);
            if (!candidate) return null;
            
            return {
              ...match,
              candidate,
            };
          })
          .filter((m): m is MatchResult => m !== null)
          .sort((a, b) => b.compatibility_score - a.compatibility_score)
          .slice(0, 5); // Top 5 per job

        matchesByJob[job.id] = jobMatchResults;
      });

      setJobMatches(matchesByJob);

      console.log('\n📊 DEBUG: Raw Match Data');
      const firstJob = companyJobs[0];
      const firstMatch = matchesByJob[firstJob?.id]?.[0];
      if (firstMatch && firstJob) {
        console.log('Job pillars:', firstJob.pillar_scores);
        console.log('Candidate pillars:', firstMatch.candidate.pillar_scores);
        console.log('First match raw score:', firstMatch.compatibility_score);
        console.log('First match pillar_breakdown:', firstMatch.pillar_breakdown);
      }

      // Log summary
      console.log('🏆 Matches Summary:');
      companyJobs.forEach(job => {
        const count = matchesByJob[job.id]?.length || 0;
        console.log(`  ${job.title}: ${count} candidates`);
        if (count > 0) {
          const topMatch = matchesByJob[job.id][0];
          console.log(`    Top: ${topMatch.candidate.full_name}`);
          console.log(`    Raw Score: ${topMatch.compatibility_score}%`);
          console.log(`    Base: ${topMatch.base_similarity}%, Boost: ${topMatch.archetype_boost}%`);
        }
      });

    } catch (error) {
      console.error('Error loading mock data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados mock',
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={ravyzLogo} alt="Ravyz" className="h-8" />
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" />
                Mock Data Mode
              </Badge>
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
          <h1 className="text-4xl font-bold mb-2">Empresa Teste</h1>
          <p className="text-muted-foreground">Dashboard da empresa</p>
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
              Minhas Vagas ({jobs.length})
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
                  <div className="text-3xl font-bold">{jobs.length}</div>
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
                  <div className="text-3xl font-bold">
                    {Object.values(jobMatches).reduce((sum, matches) => sum + matches.length, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Compatíveis</p>
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
                    {Math.round(Object.values(jobMatches).flat()[0]?.compatibility_score || 0)}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Melhor compatibilidade</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Vagas com Mais Candidatos</CardTitle>
                <CardDescription>Ranking das vagas por número de matches</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {jobs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma vaga cadastrada
                    </p>
                  ) : (
                    jobs
                      .sort((a, b) => (jobMatches[b.id]?.length || 0) - (jobMatches[a.id]?.length || 0))
                      .slice(0, 5)
                      .map((job) => {
                        const matchCount = jobMatches[job.id]?.length || 0;
                        const topMatch = jobMatches[job.id]?.[0];
                        
                        return (
                          <div key={job.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                            <div className="flex-1">
                              <p className="font-medium">{job.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {job.location}
                                </span>
                                {topMatch && (
                                  <Badge variant="outline" className="text-xs">
                                    Top: {Math.round(topMatch.compatibility_score)}%
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
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma vaga cadastrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {jobs.map((job) => {
                  const matches = jobMatches[job.id] || [];
                  const isExpanded = expandedJobs.has(job.id);

                  return (
                    <Card key={job.id}>
                      <Collapsible open={isExpanded} onOpenChange={() => toggleJobExpansion(job.id)}>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-xl">{job.title}</CardTitle>
                                <CardDescription className="mt-2 flex items-center gap-4">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {job.location}
                                  </span>
                                  <Badge variant="outline">{job.archetype}</Badge>
                                  <span className="text-primary font-medium">
                                    {matches.length} candidatos compatíveis
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
                            {matches.length === 0 ? (
                              <p className="text-center text-muted-foreground py-8">
                                Nenhum candidato compatível encontrado
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {matches.map((match) => (
                                  <Card key={match.candidate_id} className="border-2">
                                    <CardHeader>
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                          <CardTitle className="text-lg">
                                            {match.candidate.full_name}
                                          </CardTitle>
                                          <CardDescription className="mt-1">
                                            {match.candidate.headline}
                                          </CardDescription>
                                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              <MapPin className="w-3 h-3" />
                                              {match.candidate.location}
                                            </span>
                                            <span className="flex items-center gap-1">
                                              <Briefcase className="w-3 h-3" />
                                              {match.candidate.years_experience} anos
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-3xl font-bold text-primary">
                                            {Math.round(match.compatibility_score)}%
                                          </div>
                                          <div className="text-xs text-muted-foreground">Match</div>
                                        </div>
                                      </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                      {/* Archetypes */}
                                      <div className="flex items-center justify-center gap-4 p-3 bg-muted/50 rounded-lg">
                                        <Badge variant="outline" className="px-3 py-1">
                                          {match.candidate_archetype}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">vs</span>
                                        <Badge variant="outline" className="px-3 py-1">
                                          {match.job_archetype}
                                        </Badge>
                                      </div>

                                      {/* Radar Chart */}
                                      <div>
                                        <h4 className="text-sm font-semibold mb-3">Análise de Pilares</h4>
                                        <MatchRadarChart 
                                          candidatePillars={match.candidate.pillar_scores}
                                          jobPillars={job.pillar_scores}
                                        />
                                      </div>

                                      {/* Pillar Breakdown */}
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

                                      {/* Skills */}
                                      <div>
                                        <h4 className="text-sm font-semibold mb-2">Habilidades</h4>
                                        <div className="flex flex-wrap gap-2">
                                          {match.candidate.skills.map((skill, index) => (
                                            <Badge 
                                              key={index} 
                                              variant={job.requirements.includes(skill) ? "default" : "secondary"}
                                            >
                                              {skill}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Actions */}
                                      <div className="flex gap-3 pt-2 border-t">
                                        <Button 
                                          className="flex-1"
                                          onClick={() => handleInviteCandidate(match.candidate_id, job.id)}
                                        >
                                          <CheckCircle className="w-4 h-4 mr-2" />
                                          Convidar
                                        </Button>
                                        <Button 
                                          variant="outline"
                                          className="flex-1"
                                          onClick={() => handleRejectCandidate(match.candidate_id, job.id)}
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
                  onJobCreated={loadMockData}
                />
              )}
            </div>
            <div className="grid gap-4">
              {jobs.map((job) => (
                <Card key={job.id}>
                  <CardHeader>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription>{job.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="outline">{job.archetype}</Badge>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Requisitos</h4>
                      <div className="flex flex-wrap gap-2">
                        {job.requirements.map((req, index) => (
                          <Badge key={index} variant="secondary">{req}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
