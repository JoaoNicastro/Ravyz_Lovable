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

  useEffect(() => {
    loadMockData();
  }, []);

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
            <TabsTrigger value="matches">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Candidatos Compatíveis
            </TabsTrigger>
            <TabsTrigger value="jobs">
              <Briefcase className="w-4 h-4 mr-2" />
              Minhas Vagas ({jobs.length})
            </TabsTrigger>
          </TabsList>

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
