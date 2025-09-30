import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MatchRadarChart } from '@/components/MatchRadarChart';
import { Notifications } from '@/components/Notifications';
import { UserDropdown } from '@/components/UserDropdown';
import { ThumbsUp, ThumbsDown, Building, MapPin, DollarSign, LayoutDashboard, FileText, Sparkles, Briefcase } from 'lucide-react';
import ravyzLogo from '@/assets/ravyz-logo.png';
import { MatchingEngine, CandidateRavyzData, JobRavyzData } from '@/lib/matching-engine';
import { mockCandidates, mockJobs, MockCandidate, MockJob } from '@/lib/mock-loader';

interface MatchResult {
  candidate_id: string;
  job_id: string;
  compatibility_score: number;
  pillar_breakdown: Record<string, number>;
  candidate_archetype: string;
  job_archetype: string;
  base_similarity: number;
  archetype_boost: number;
  job: MockJob;
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<MockCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');

  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = async () => {
    try {
      setLoading(true);
      
      // Use first candidate as logged-in user
      const candidate = mockCandidates[0];
      setCandidateProfile(candidate);

      console.log('🎯 Loading mock candidate:', candidate.full_name);
      
      // Prepare candidate data for matching
      const candidateData: CandidateRavyzData = {
        id: candidate.id,
        pillar_scores: candidate.pillar_scores,
        archetype: candidate.archetype,
        skills: candidate.skills,
        yearsExperience: candidate.years_experience,
      };

      // Prepare jobs data for matching
      const jobsData: JobRavyzData[] = mockJobs.map(job => ({
        id: job.id,
        pillar_scores: job.pillar_scores,
        archetype: job.archetype,
        hardSkills: job.requirements,
      }));

      console.log(`🎯 Calculating matches for ${mockJobs.length} jobs...`);

      // Calculate matches
      const matchingEngine = new MatchingEngine();
      const allMatches = matchingEngine.calculateAllMatches([candidateData], jobsData);

      console.log(`✅ Generated ${allMatches.length} matches`);
      
      // Transform and sort matches
      const matchesWithJobData = allMatches
        .map(match => {
          const job = mockJobs.find(j => j.id === match.job_id);
          if (!job) return null;
          
          return {
            ...match,
            job,
          };
        })
        .filter((m): m is MatchResult => m !== null)
        .sort((a, b) => b.compatibility_score - a.compatibility_score)
        .slice(0, 10); // Top 10 matches

      setMatches(matchesWithJobData);

      console.log('\n📊 DEBUG: Raw Match Data');
      console.log('First match raw score:', matchesWithJobData[0]?.compatibility_score);
      console.log('First match pillar_breakdown:', matchesWithJobData[0]?.pillar_breakdown);

      // Log top 5 matches
      console.log('🏆 Top 5 Matches:');
      matchesWithJobData.slice(0, 5).forEach((match, i) => {
        console.log(`${i + 1}. ${match.job.title}`);
        console.log(`   Raw Score: ${match.compatibility_score}%`);
        console.log(`   Base Similarity: ${match.base_similarity}%, Archetype Boost: ${match.archetype_boost}%`);
        console.log(`   Candidate: ${match.candidate_archetype} vs Job: ${match.job_archetype}`);
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

  const handleApply = (jobId: string) => {
    toast({
      title: 'Candidatura enviada!',
      description: 'Você se candidatou à vaga com sucesso.',
    });
    console.log('📝 Applied to job:', jobId);
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

  if (!candidateProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Perfil não encontrado</CardTitle>
            <CardDescription>Não foi possível carregar dados do candidato</CardDescription>
          </CardHeader>
        </Card>
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
        {/* Profile Summary */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl">{candidateProfile.full_name}</CardTitle>
                <CardDescription className="text-lg mt-2">{candidateProfile.headline}</CardDescription>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {candidateProfile.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {candidateProfile.years_experience} anos de experiência
                  </div>
                </div>
              </div>
              <Badge variant="outline" className="text-base px-4 py-2">
                {candidateProfile.archetype}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {candidateProfile.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="matches">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Vagas Compatíveis ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="profile">
              <FileText className="w-4 h-4 mr-2" />
              Meu Perfil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="space-y-6 mt-6">
            {matches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma vaga compatível encontrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {matches.map((match) => (
                  <Card key={match.job_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl">{match.job.title}</CardTitle>
                          <CardDescription className="mt-2 flex items-center gap-4 text-base">
                            <span className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              Empresa Teste
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {match.job.location}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-primary">
                            {Math.round(match.compatibility_score)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Compatibilidade</div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      {/* Archetypes */}
                      <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
                        <Badge variant="outline" className="text-base px-4 py-2">
                          Você: {match.candidate_archetype}
                        </Badge>
                        <span className="text-muted-foreground">vs</span>
                        <Badge variant="outline" className="text-base px-4 py-2">
                          Vaga: {match.job_archetype}
                        </Badge>
                      </div>

                      {/* Radar Chart */}
                      <div>
                        <h4 className="text-sm font-semibold mb-4">Análise de Pilares</h4>
                        <MatchRadarChart 
                          candidatePillars={candidateProfile.pillar_scores}
                          jobPillars={match.job.pillar_scores}
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

                      {/* Requirements */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3">Requisitos da Vaga</h4>
                        <div className="flex flex-wrap gap-2">
                          {match.job.requirements.map((req, index) => (
                            <Badge 
                              key={index} 
                              variant={candidateProfile.skills.includes(req) ? "default" : "outline"}
                            >
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button 
                          className="flex-1" 
                          onClick={() => handleApply(match.job_id)}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Candidatar-se
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Suas Informações</CardTitle>
                <CardDescription>Dados do seu perfil profissional</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Informações de Contato</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Email:</span> {candidateProfile.email}</p>
                    <p><span className="text-muted-foreground">Telefone:</span> {candidateProfile.phone}</p>
                    <p><span className="text-muted-foreground">Localização:</span> {candidateProfile.location}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Scores dos Pilares</h4>
                  <div className="grid gap-2">
                    {Object.entries(candidateProfile.pillar_scores).map(([pillar, score]) => (
                      <div key={pillar} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{pillar}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${(score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="w-12 text-right font-medium">{score}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Habilidades</h4>
                  <div className="flex flex-wrap gap-2">
                    {candidateProfile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
