import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MatchRadarChart } from '@/components/MatchRadarChart';
import { Notifications } from '@/components/Notifications';
import { UserDropdown } from '@/components/UserDropdown';
import { CheckCircle, XCircle, User, MapPin, Briefcase, LayoutDashboard, Briefcase as BriefcaseIcon } from 'lucide-react';
import ravyzLogo from '@/assets/ravyz-logo.png';
import { CreateJobDialog } from '@/components/CreateJobDialog';

interface MatchResult {
  id: string;
  match_percentage: number;
  score_breakdown: any;
  explanation: string;
  feedback_status?: string;
  candidate_profiles: {
    id: string;
    headline: string;
    location: string;
    years_experience: number;
    archetype: string;
    pillar_scores: any;
    avatar_url?: string;
  };
  jobs: {
    id: string;
    title: string;
    archetype: string;
    pillar_scores: any;
  };
}

export default function CompanyDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchCompanyData();
  }, [user]);

  const fetchCompanyData = async () => {
    if (!user) return;

    try {
      // Get company profile
      const { data: profile, error: profileError } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setCompanyProfile(profile);

      // Get company jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', profile.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);

      // Get matches for company jobs
      const { data: matchData, error: matchError } = await supabase
        .from('matching_results')
        .select(`
          *,
          candidate_profiles (
            id,
            headline,
            location,
            years_experience,
            archetype,
            pillar_scores,
            avatar_url
          ),
          jobs (
            id,
            title,
            archetype,
            pillar_scores
          )
        `)
        .eq('jobs.company_id', profile.id)
        .order('calculated_at', { ascending: false });

      if (matchError) throw matchError;
      setMatches(matchData || []);
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (matchId: string, candidateId: string, jobId: string, feedback: 'advance' | 'reject') => {
    if (!companyProfile) return;

    try {
      // Insert feedback
      const { error: feedbackError } = await supabase
        .from('match_feedback')
        .insert({
          company_id: companyProfile.id,
          candidate_id: candidateId,
          job_id: jobId,
          feedback
        });

      if (feedbackError) throw feedbackError;

      // Update matching result status
      const { error: updateError } = await supabase
        .from('matching_results')
        .update({ feedback_status: feedback })
        .eq('id', matchId);

      if (updateError) throw updateError;

      // Update local state
      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { ...match, feedback_status: feedback }
          : match
      ));

      toast({
        title: "Feedback enviado!",
        description: feedback === 'advance' 
          ? "Candidato aprovado para próxima etapa ✅" 
          : "Candidato rejeitado ❌",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar o feedback",
        variant: "destructive",
      });
    }
  };

  const getMatchBadgeColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Logo */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b">
        <div className="flex items-center gap-4">
          <img 
            src={ravyzLogo} 
            alt="RAVYZ Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1 className="text-3xl font-bold">Dashboard da Empresa</h1>
            <p className="text-muted-foreground">
              Gerencie candidatos e matches para suas vagas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Notifications />
          <UserDropdown />
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="vagas" className="flex items-center gap-2">
            <BriefcaseIcon className="w-4 h-4" />
            Vagas
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab - Matches */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Candidatos Compatíveis</h2>
            {matches.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Nenhum match encontrado</h3>
                  <p className="text-muted-foreground">
                    Crie vagas para começar a receber candidatos compatíveis!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {matches.map((match) => (
                  <Card key={match.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-3">
                            {match.candidate_profiles.avatar_url && (
                              <img 
                                src={match.candidate_profiles.avatar_url} 
                                alt="Candidate"
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            <User className="w-5 h-5" />
                            {match.candidate_profiles.headline || 'Candidato'}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Briefcase className="w-4 h-4" />
                            Para a vaga: {match.jobs.title}
                            {match.candidate_profiles.location && (
                              <>
                                <MapPin className="w-4 h-4 ml-2" />
                                {match.candidate_profiles.location}
                              </>
                            )}
                          </CardDescription>
                        </div>
                        <Badge 
                          className={`${getMatchBadgeColor(match.match_percentage)} text-white`}
                        >
                          {match.match_percentage}% Match
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {/* Experience info */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4" />
                        {match.candidate_profiles.years_experience} anos de experiência
                      </div>

                      {/* Archetype comparison */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">Arquétipos:</span>
                        <Badge variant="outline">
                          Candidato: {match.candidate_profiles.archetype || 'N/A'}
                        </Badge>
                        <Badge variant="outline">
                          Vaga: {match.jobs.archetype || 'N/A'}
                        </Badge>
                      </div>

                      {/* Radar Chart */}
                      {match.candidate_profiles.pillar_scores && match.jobs.pillar_scores && (
                        <div>
                          <h4 className="font-medium mb-3">Comparação de Pilares</h4>
                          <MatchRadarChart
                            candidatePillars={match.candidate_profiles.pillar_scores}
                            jobPillars={match.jobs.pillar_scores}
                          />
                        </div>
                      )}

                      {/* Match explanation */}
                      {match.explanation && (
                        <div>
                          <h4 className="font-medium mb-2">Análise do Match</h4>
                          <p className="text-sm text-muted-foreground">
                            {match.explanation}
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-4">
                        {match.feedback_status ? (
                          <Badge variant="secondary">
                            {match.feedback_status === 'advance' ? '✅ Aprovado' : '❌ Rejeitado'}
                          </Badge>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleFeedback(
                                match.id, 
                                match.candidate_profiles.id, 
                                match.jobs.id, 
                                'advance'
                              )}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Avançar
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleFeedback(
                                match.id, 
                                match.candidate_profiles.id, 
                                match.jobs.id, 
                                'reject'
                              )}
                              className="flex items-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Vagas Tab */}
        <TabsContent value="vagas" className="space-y-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Minhas Vagas</h2>
            {companyProfile && (
              <CreateJobDialog 
                companyId={companyProfile.id} 
                onJobCreated={fetchCompanyData}
              />
            )}
          </div>

          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">Nenhuma vaga criada</h3>
                <p className="text-muted-foreground mb-4">
                  Crie sua primeira vaga para começar a receber candidatos!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <Card key={job.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">{job.title}</CardTitle>
                      <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                        {job.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {job.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {job.description}
                    </p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize">{job.work_model}</span>
                      </div>
                      
                      {(job.salary_min || job.salary_max) && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">💰</span>
                          <span>
                            {job.salary_min && `R$ ${job.salary_min.toLocaleString()}`}
                            {job.salary_min && job.salary_max && ' - '}
                            {job.salary_max && `R$ ${job.salary_max.toLocaleString()}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}