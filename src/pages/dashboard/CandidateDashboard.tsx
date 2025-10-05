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
import { SkillsHighlightCard } from '@/components/SkillsHighlightCard';
import { MarketPositionCard } from '@/components/MarketPositionCard';
import { DreamJobCard } from '@/components/DreamJobCard';
import { Building, MapPin, DollarSign, LayoutDashboard, FileText, Sparkles, Briefcase, Send, Clock, Heart } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ravyzLogo from '@/assets/ravyz-logo.png';
import { getCandidateMatches, MatchData } from '@/services/matchingService';
import { applyToJob, getCandidateApplications, ApplicationData } from '@/services/applicationsService';
import { supabase } from '@/integrations/supabase/client';

// Use ApplicationData from the service
type Application = ApplicationData;

export default function CandidateDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [candidateProfileId, setCandidateProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('matches');
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJobDetails, setSelectedJobDetails] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [stats, setStats] = useState({
    totalMatches: 0,
    totalApplications: 0,
    profileViews: 0,
  });

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  const loadAllData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load candidate profile
      const { data: profile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (profile) {
        setCandidateProfile(profile);
        setCandidateProfileId(profile.id);

        // Load matches
        const matchesData = await getCandidateMatches(profile.id);
        setMatches(matchesData);

        // Load applications
        const apps = await getCandidateApplications();
        setApplications(apps);

        // Calculate stats
        setStats({
          totalMatches: matchesData.length,
          totalApplications: apps.length,
          profileViews: 0, // TODO: Implement profile views tracking
        });

        console.log('✅ Loaded candidate data:', {
          profile: profile.full_name,
          matches: matchesData.length,
          applications: apps.length,
        });
      }
    } catch (error) {
      console.error('Error loading candidate data:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados do candidato',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    console.log('🚀 Starting application process for job:', jobId);

    const result = await applyToJob(jobId);

    if (result.success) {
      // Reload data to show the new application
      await loadAllData();

      toast({
        title: 'Candidatura enviada!',
        description: 'Você se candidatou à vaga com sucesso.',
      });
      
      // Switch to applications tab
      setActiveTab('applications');
      
      console.log('✅ Application successful for job:', jobId);
    } else {
      toast({
        title: 'Erro ao candidatar',
        description: result.error || 'Não foi possível enviar a candidatura',
        variant: 'destructive',
      });
      console.error('❌ Application failed:', result.error);
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
      applied: { label: 'Enviada', variant: 'secondary' as const },
      viewed: { label: 'Visualizada', variant: 'secondary' as const },
      interview_scheduled: { label: 'Entrevista Agendada', variant: 'default' as const },
      accepted: { label: 'Aceita', variant: 'default' as const },
      rejected: { label: 'Rejeitada', variant: 'destructive' as const },
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
                <CardTitle className="text-3xl">{candidateProfile?.full_name || 'Candidato'}</CardTitle>
                <CardDescription className="text-lg mt-2">{candidateProfile?.headline || 'Profissional'}</CardDescription>
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {candidateProfile?.location || 'Localização'}
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {candidateProfile?.years_experience || 0} anos de experiência
                  </div>
                </div>
              </div>
              {candidateProfile?.archetype && (
                <Badge variant="outline" className="text-base px-4 py-2">
                  {candidateProfile.archetype}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(Array.isArray(candidateProfile?.skills) ? candidateProfile.skills : []).map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="matches">
              <Sparkles className="w-4 h-4 mr-2" />
              Matches
            </TabsTrigger>
            <TabsTrigger value="applications">
              <Send className="w-4 h-4 mr-2" />
              Candidaturas ({stats.totalApplications})
            </TabsTrigger>
          </TabsList>

          {/* Tab 0: Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Matches Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalMatches}</div>
                  <p className="text-xs text-muted-foreground mt-1">Vagas compatíveis ≥75%</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Candidaturas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalApplications}</div>
                  <p className="text-xs text-muted-foreground mt-1">Enviadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Visualizações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.profileViews}</div>
                  <p className="text-xs text-muted-foreground mt-1">Empresas visualizaram</p>
                </CardContent>
              </Card>

              {/* Dream Job Card - moved below to full width */}
            </div>

            {/* Dream Job Card - Full Width */}
            <DreamJobCard 
              desiredPosition={(candidateProfile?.preferences as any)?.desired_role || "Cargo desejado"}
              salaryRange={{
                min: (candidateProfile?.preferences as any)?.salary_min || 0,
                max: (candidateProfile?.preferences as any)?.salary_max || 0
              }}
              industries={(candidateProfile?.preferences as any)?.industry_interests || []}
              values={(candidateProfile?.preferences as any)?.values || []}
            />

            {/* Skills Highlight Card - Full Width */}
            <SkillsHighlightCard />

            {/* Recent Activity Section */}
            <Card>
              <CardHeader>
                <CardTitle>Atividade Recente</CardTitle>
                <CardDescription>Suas últimas interações na plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma atividade recente
                    </p>
                  ) : (
                    applications.slice(0, 5).map((app) => (
                      <div key={app.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Send className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Candidatura enviada</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(app.applied_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getStatusBadge(app.status).variant}>
                          {getStatusBadge(app.status).label}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Market Position Card - Full Width */}
            <MarketPositionCard />
          </TabsContent>

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

            {matches.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma vaga compatível encontrada</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Complete seu perfil para receber recomendações personalizadas
                  </p>
                </CardContent>
              </Card>
            ) : (
              // Show match cards from Supabase
              <div className="space-y-6">
                {matches.map((match) => (
                  <MatchCard
                    key={match.job_id}
                    match={match}
                    onApply={handleApply}
                    onSave={handleSaveJob}
                    onViewDetails={handleViewDetails}
                  />
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
                               <CardTitle className="text-xl">{app.jobs?.title || 'Vaga'}</CardTitle>
                               <Badge variant={statusInfo.variant}>
                                 {statusInfo.label}
                               </Badge>
                             </div>
                             <CardDescription className="flex flex-wrap items-center gap-3 text-sm">
                               <span className="flex items-center gap-1">
                                 <Building className="w-4 h-4" />
                                 {app.jobs?.company_profiles?.company_name || 'Empresa'}
                               </span>
                               <span>•</span>
                               <span className="flex items-center gap-1">
                                 <MapPin className="w-4 h-4" />
                                 {app.jobs?.location || 'Remote'}
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
