import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MatchCard } from '@/components/MatchCard';
import { Notifications } from '@/components/Notifications';
import { UserDropdown } from '@/components/UserDropdown';
import { ThumbsUp, ThumbsDown, Building, MapPin, DollarSign, LayoutDashboard, FileText, Sparkles, Briefcase, Send, Clock, Heart, CheckCircle2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ravyzLogo from '@/assets/ravyz-logo.png';
import { MatchingEngine, CandidateRavyzData, JobRavyzData } from '@/lib/matching-engine';
import { mockCandidates, mockJobs, MockCandidate, MockJob } from '@/lib/mock-loader';
import { getCandidateMatches, MatchData } from '@/services/matchingService';
import { supabase } from '@/integrations/supabase/client';

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  applied_at: string;
  status: 'pending' | 'approved' | 'rejected';
  location: string;
}

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
  const [detailedMatches, setDetailedMatches] = useState<MatchData[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<MockCandidate | null>(null);
  const [candidateProfileId, setCandidateProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    // Load applications from localStorage
    const stored = localStorage.getItem('candidate_applications');
    if (stored) {
      setApplications(JSON.parse(stored));
    }

    // Load candidate profile ID from Supabase
    loadCandidateProfileId();
  }, [user]);

  useEffect(() => {
    loadMockData();
  }, []);

  useEffect(() => {
    // Load detailed matches from Supabase if we have a candidate profile ID
    if (candidateProfileId) {
      loadDetailedMatches();
    }
  }, [candidateProfileId]);

  const loadCandidateProfileId = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setCandidateProfileId(data.id);
      }
    } catch (error) {
      console.error('Error loading candidate profile ID:', error);
    }
  };

  const loadDetailedMatches = async () => {
    if (!candidateProfileId) return;

    try {
      const matchesData = await getCandidateMatches(candidateProfileId);
      setDetailedMatches(matchesData);
      console.log('✅ Loaded detailed matches from Supabase:', matchesData.length);
    } catch (error) {
      console.error('Error loading detailed matches:', error);
    }
  };

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
      console.log('Candidate pillars:', candidate.pillar_scores);
      if (matchesWithJobData[0]) {
        console.log('First job pillars:', matchesWithJobData[0].job.pillar_scores);
        console.log('First match raw score:', matchesWithJobData[0].compatibility_score);
        console.log('First match pillar_breakdown:', matchesWithJobData[0].pillar_breakdown);
      }

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

  const handleApply = async (jobId: string, jobTitle: string, location: string) => {
    if (!candidateProfileId) {
      toast({
        title: 'Erro',
        description: 'Perfil de candidato não encontrado',
        variant: 'destructive',
      });
      return;
    }

    // Check if already applied
    if (applications.some(app => app.job_id === jobId)) {
      toast({
        title: 'Já aplicado',
        description: 'Você já se candidatou a esta vaga.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Save to Supabase
      const { data, error } = await supabase
        .from('applications')
        .insert({
          candidate_id: candidateProfileId,
          job_id: jobId,
          status: 'applied',
        })
        .select()
        .single();

      if (error) throw error;

      const newApplication: Application = {
        id: data.id,
        job_id: jobId,
        job_title: jobTitle,
        company_name: 'Empresa',
        applied_at: new Date().toISOString(),
        status: 'pending',
        location,
      };

      const updated = [...applications, newApplication];
      setApplications(updated);
      localStorage.setItem('candidate_applications', JSON.stringify(updated));

      toast({
        title: 'Candidatura enviada!',
        description: 'Você se candidatou à vaga com sucesso.',
      });
      
      // Switch to applications tab
      setActiveTab('applications');
      
      console.log('📝 Applied to job:', jobId);
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a candidatura',
        variant: 'destructive',
      });
    }
  };

  // Wrapper for MatchCard component
  const handleApplyFromMatch = (jobId: string) => {
    const match = detailedMatches.find(m => m.job_id === jobId);
    if (match) {
      handleApply(jobId, match.job_title, match.location);
    }
  };

  const handleSaveJob = (jobId: string) => {
    toast({
      title: 'Vaga salva!',
      description: 'A vaga foi adicionada aos seus favoritos',
    });
    console.log('💾 Saved job:', jobId);
  };

  const handleViewDetails = async (jobId: string) => {
    try {
      const { data: job, error } = await supabase
        .from('jobs')
        .select(`
          *,
          company_profiles:company_id (
            company_name,
            description,
            industry,
            location
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) throw error;
      
      setSelectedJobDetails(job);
      setShowDetailsDialog(true);
    } catch (error) {
      console.error('Error loading job details:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar detalhes da vaga',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: Application['status']) => {
    const variants = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      approved: { label: 'Aprovado', variant: 'default' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const },
    };
    return variants[status];
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
              <Sparkles className="w-4 h-4 mr-2" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="applications">
              <Send className="w-4 h-4 mr-2" />
              Candidaturas ({applications.length})
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Matches - Cartões Detalhados */}
          <TabsContent value="matches" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Seus Melhores Matches</CardTitle>
                <CardDescription>
                  Vagas mais compatíveis com seu perfil, ordenadas por compatibilidade
                </CardDescription>
              </CardHeader>
            </Card>

            {detailedMatches.length === 0 && matches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma vaga compatível encontrada</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete seu perfil para receber recomendações personalizadas
                  </p>
                </CardContent>
              </Card>
            ) : detailedMatches.length > 0 ? (
              // Show detailed match cards from Supabase
              <div className="space-y-6">
                {detailedMatches.map((match) => (
                  <MatchCard
                    key={match.job_id}
                    match={match}
                    onApply={handleApplyFromMatch}
                    onSave={handleSaveJob}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            ) : (
              // Fallback: show simplified cards without detailed data
              <div className="space-y-6">
                {matches.slice(0, 5).map((match) => (
                  <Card key={match.job_id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-2xl">{match.job.title}</CardTitle>
                            <Badge className={
                              match.compatibility_score >= 80 
                                ? 'bg-[#16a34a] text-white' 
                                : match.compatibility_score >= 50 
                                ? 'bg-[#facc15] text-black' 
                                : 'bg-[#dc2626] text-white'
                            }>
                              {Math.round(match.compatibility_score)}% Match
                            </Badge>
                          </div>
                          <CardDescription className="flex items-center gap-3 text-base">
                            <span className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              Empresa
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {match.job.location}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-sm">
                          {match.candidate_archetype}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-center gap-4 p-3 bg-muted/30 rounded-lg">
                        <Badge variant="outline" className="text-sm">
                          Você: {match.candidate_archetype}
                        </Badge>
                        <span className="text-muted-foreground text-sm">vs</span>
                        <Badge variant="outline" className="text-sm">
                          Vaga: {match.job_archetype}
                        </Badge>
                      </div>

                      {/* Compatibility Explanation */}
                      <div className="space-y-3 border-t border-border/50 pt-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-foreground">
                            Por que você foi compatível com esta vaga
                          </h4>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold">
                            {Math.round(match.compatibility_score)}% Match
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          {Object.entries(match.pillar_breakdown).slice(0, 3).map(([pillar, score]) => {
                            const pillarScore = score as number;
                            const reason = pillarScore >= 80 
                              ? `Alinhamento forte em ${pillar}`
                              : pillarScore >= 60
                              ? `Boa compatibilidade em ${pillar}`
                              : `Compatibilidade em ${pillar}`;
                            
                            return (
                              <div key={pillar} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-[#16a34a] shrink-0 mt-0.5" />
                                <p className="text-sm text-foreground">
                                  {reason} ({Math.round(pillarScore)}%)
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveJob(match.job_id)}
                          className="gap-2"
                        >
                          <Heart className="h-4 w-4" />
                          Salvar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApply(match.job_id, match.job.title, match.job.location)}
                          className="bg-gradient-primary hover:shadow-glow gap-2"
                        >
                          Candidatar-se
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab 2: Candidaturas - Histórico */}
          <TabsContent value="applications" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Minhas Candidaturas</CardTitle>
                <CardDescription>
                  Histórico de vagas em que você se candidatou
                </CardDescription>
              </CardHeader>
            </Card>

            {applications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Você ainda não se candidatou a nenhuma vaga</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('matches')}
                  >
                    Ver Matches
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => {
                  const statusInfo = getStatusBadge(app.status);
                  return (
                    <Card key={app.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">{app.job_title}</CardTitle>
                              <Badge variant={statusInfo.variant}>
                                {statusInfo.label}
                              </Badge>
                            </div>
                            <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                {app.company_name}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {app.location}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Aplicado em {new Date(app.applied_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewDetails(app.job_id)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Detalhes Completos
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Job Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedJobDetails && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedJobDetails.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-3 text-base mt-2">
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {selectedJobDetails.company_profiles?.company_name || 'Empresa'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedJobDetails.location || 'Remote'}
                  </span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Salary */}
                {selectedJobDetails.salary_min && selectedJobDetails.salary_max && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Faixa Salarial
                    </h3>
                    <p className="text-muted-foreground">
                      R$ {selectedJobDetails.salary_min.toLocaleString('pt-BR')} – R$ {selectedJobDetails.salary_max.toLocaleString('pt-BR')}
                    </p>
                  </div>
                )}

                {/* Job Description */}
                {selectedJobDetails.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Sobre a Vaga</h3>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {selectedJobDetails.description}
                    </p>
                  </div>
                )}

                {/* Company Description */}
                {selectedJobDetails.company_profiles?.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Sobre a Empresa</h3>
                    <p className="text-muted-foreground">
                      {selectedJobDetails.company_profiles.description}
                    </p>
                    {selectedJobDetails.company_profiles.industry && (
                      <div className="mt-2">
                        <Badge variant="outline">
                          {selectedJobDetails.company_profiles.industry}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Requirements */}
                {selectedJobDetails.requirements && (
                  <div>
                    <h3 className="font-semibold mb-2">Requisitos</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedJobDetails.requirements).map(([key, value]) => (
                        <Badge key={key} variant="secondary">
                          {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Published Date */}
                <div className="text-sm text-muted-foreground pt-4 border-t">
                  Publicada há {Math.floor(
                    (new Date().getTime() - new Date(selectedJobDetails.created_at).getTime()) / (1000 * 60 * 60 * 24)
                  )} dias
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
