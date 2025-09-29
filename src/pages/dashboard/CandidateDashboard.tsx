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
import { ThumbsUp, ThumbsDown, Building, MapPin, DollarSign, LayoutDashboard, FileText } from 'lucide-react';
import ravyzLogo from '@/assets/ravyz-logo.png';

interface MatchResult {
  id: string;
  match_percentage: number;
  score_breakdown: any;
  explanation: string;
  feedback_status?: string;
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    salary_min?: number;
    salary_max?: number;
    archetype: string;
    pillar_scores: any;
    company_profiles: {
      company_name: string;
      logo_url?: string;
    };
  };
}

interface Application {
  id: string;
  applied_at: string;
  status: string;
  cover_letter?: string;
  jobs: {
    id: string;
    title: string;
    description: string;
    location: string;
    company_profiles: {
      company_name: string;
      logo_url?: string;
    };
  };
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  salary_min?: number;
  salary_max?: number;
  archetype: string;
  pillar_scores: any;
  status: string;
  company_profiles: {
    company_name: string;
    logo_url?: string;
  };
}

export default function CandidateDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchCandidateData();
  }, [user]);

  const fetchCandidateData = async () => {
    if (!user) return;

    try {
      // Get candidate profile
      const { data: profile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setCandidateProfile(profile);

      // Get matches
      const { data: matchData, error: matchError } = await supabase
        .from('matching_results')
        .select(`
          *,
          jobs!inner (
            id,
            title,
            description,
            location,
            salary_min,
            salary_max,
            archetype,
            pillar_scores,
            company_profiles (
              company_name,
              logo_url
            )
          )
        `)
        .eq('candidate_id', profile.id)
        .order('calculated_at', { ascending: false });

      if (matchError) throw matchError;
      
      // Transform data to match interface
      const transformedMatches = matchData?.map(match => ({
        ...match,
        job: match.jobs
      })) || [];
      
      setMatches(transformedMatches);

      // Get applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('applications')
        .select(`
          *,
          jobs!inner (
            id,
            title,
            description,
            location,
            company_profiles (
              company_name,
              logo_url
            )
          )
        `)
        .eq('candidate_id', profile.id)
        .order('applied_at', { ascending: false });

      if (applicationsError) throw applicationsError;
      setApplications(applicationsData || []);

      // Get all active jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          company_profiles (
            company_name,
            logo_url
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;
      setJobs(jobsData || []);
    } catch (error) {
      console.error('Error fetching candidate data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    if (!candidateProfile) return;

    try {
      // Check if already applied
      const existingApplication = applications.find(app => app.jobs.id === jobId);
      if (existingApplication) {
        toast({
          title: "Já candidatado",
          description: "Você já se candidatou para esta vaga",
          variant: "destructive",
        });
        return;
      }

      // Insert application
      const { data: newApplication, error: applicationError } = await supabase
        .from('applications')
        .insert({
          candidate_id: candidateProfile.id,
          job_id: jobId,
          status: 'applied'
        })
        .select(`
          *,
          jobs!inner (
            id,
            title,
            description,
            location,
            company_profiles (
              company_name,
              logo_url
            )
          )
        `)
        .single();

      if (applicationError) throw applicationError;

      // Update local state
      setApplications(prev => [newApplication, ...prev]);

      toast({
        title: "Candidatura enviada!",
        description: "Sua candidatura foi registrada com sucesso",
      });
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar sua candidatura",
        variant: "destructive",
      });
    }
  };

  const handleFeedback = async (matchId: string, jobId: string, feedback: 'interested' | 'not_interested') => {
    if (!candidateProfile) return;

    try {
      // Insert feedback
      const { error: feedbackError } = await supabase
        .from('match_feedback')
        .insert({
          candidate_id: candidateProfile.id,
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
        description: feedback === 'interested' 
          ? "Seu interesse foi registrado 👍" 
          : "Feedback registrado 👎",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar seu feedback",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'reviewing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      applied: 'Candidatura Enviada',
      reviewing: 'Em Análise',
      accepted: 'Aceito',
      rejected: 'Rejeitado',
    };
    return labels[status] || status;
  };

  const getMatchBadgeColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const isApplied = (jobId: string) => {
    return applications.some(app => app.jobs.id === jobId);
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
            <h1 className="text-3xl font-bold">Dashboard do Candidato</h1>
            <p className="text-muted-foreground">
              Acompanhe seus matches e oportunidades
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Notifications />
          <UserDropdown />
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Matches
          </TabsTrigger>
          <TabsTrigger value="vagas" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Vagas
          </TabsTrigger>
          <TabsTrigger value="candidaturas" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Candidaturas
          </TabsTrigger>
        </TabsList>

        {/* Matches Tab */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Suas Oportunidades</h2>
            {matches.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Nenhum match encontrado</h3>
                  <p className="text-muted-foreground">
                    Complete seu perfil para começar a receber matches!
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
                            {match.job.company_profiles.logo_url && (
                              <img 
                                src={match.job.company_profiles.logo_url} 
                                alt={match.job.company_profiles.company_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            {match.job.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Building className="w-4 h-4" />
                            {match.job.company_profiles.company_name}
                            {match.job.location && (
                              <>
                                <MapPin className="w-4 h-4 ml-2" />
                                {match.job.location}
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
                      {/* Salary info */}
                      {(match.job.salary_min || match.job.salary_max) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          {match.job.salary_min && match.job.salary_max
                            ? `R$ ${match.job.salary_min.toLocaleString()} - R$ ${match.job.salary_max.toLocaleString()}`
                            : match.job.salary_min
                            ? `A partir de R$ ${match.job.salary_min.toLocaleString()}`
                            : `Até R$ ${match.job.salary_max.toLocaleString()}`
                          }
                        </div>
                      )}

                      {/* Archetype comparison */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">Arquétipos:</span>
                        <Badge variant="outline">
                          Você: {candidateProfile?.archetype || 'N/A'}
                        </Badge>
                        <Badge variant="outline">
                          Vaga: {match.job.archetype || 'N/A'}
                        </Badge>
                      </div>

                      {/* Radar Chart */}
                      {candidateProfile?.pillar_scores && match.job.pillar_scores && (
                        <div>
                          <h4 className="font-medium mb-3">Comparação de Pilares</h4>
                          <MatchRadarChart
                            candidatePillars={candidateProfile.pillar_scores}
                            jobPillars={match.job.pillar_scores}
                          />
                        </div>
                      )}

                      {/* Job description */}
                      {match.job.description && (
                        <div>
                          <h4 className="font-medium mb-2">Descrição da Vaga</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {match.job.description}
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-4">
                        {match.feedback_status ? (
                          <Badge variant="secondary">
                            {match.feedback_status === 'interested' ? '👍 Interessado' : '👎 Não Interessado'}
                          </Badge>
                        ) : (
                          <>
                            <Button
                              onClick={() => handleFeedback(match.id, match.job.id, 'interested')}
                              className="flex items-center gap-2"
                            >
                              <ThumbsUp className="w-4 h-4" />
                              Interessado
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleFeedback(match.id, match.job.id, 'not_interested')}
                              className="flex items-center gap-2"
                            >
                              <ThumbsDown className="w-4 h-4" />
                              Não Interessado
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
          <div>
            <h2 className="text-2xl font-bold mb-4">Vagas Disponíveis</h2>
            {jobs.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Nenhuma vaga disponível</h3>
                  <p className="text-muted-foreground">
                    Novas vagas aparecerão aqui quando forem publicadas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Card key={job.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-3">
                            {job.company_profiles.logo_url && (
                              <img 
                                src={job.company_profiles.logo_url} 
                                alt={job.company_profiles.company_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            {job.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Building className="w-4 h-4" />
                            {job.company_profiles.company_name}
                            {job.location && (
                              <>
                                <MapPin className="w-4 h-4 ml-2" />
                                {job.location}
                              </>
                            )}
                          </CardDescription>
                        </div>
                        {job.archetype && (
                          <Badge variant="outline">
                            {job.archetype}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {(job.salary_min || job.salary_max) && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          {job.salary_min && job.salary_max
                            ? `R$ ${job.salary_min.toLocaleString()} - R$ ${job.salary_max.toLocaleString()}`
                            : job.salary_min
                            ? `A partir de R$ ${job.salary_min.toLocaleString()}`
                            : `Até R$ ${job.salary_max.toLocaleString()}`
                          }
                        </div>
                      )}

                      {job.description && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Descrição da Vaga</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {job.description}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        {isApplied(job.id) ? (
                          <Badge variant="secondary" className="px-4 py-2">
                            ✓ Candidatura Enviada
                          </Badge>
                        ) : (
                          <Button 
                            onClick={() => handleApply(job.id)}
                            className="flex items-center gap-2"
                          >
                            <ThumbsUp className="w-4 h-4" />
                            Candidatar-se
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Candidaturas Tab */}
        <TabsContent value="candidaturas" className="space-y-6 mt-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Minhas Candidaturas</h2>
            {applications.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">Nenhuma candidatura enviada</h3>
                  <p className="text-muted-foreground">
                    Candidate-se às vagas que combinam com você!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-3">
                            {application.jobs.company_profiles.logo_url && (
                              <img 
                                src={application.jobs.company_profiles.logo_url} 
                                alt={application.jobs.company_profiles.company_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            {application.jobs.title}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Building className="w-4 h-4" />
                            {application.jobs.company_profiles.company_name}
                            {application.jobs.location && (
                              <>
                                <MapPin className="w-4 h-4 ml-2" />
                                {application.jobs.location}
                              </>
                            )}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatusBadgeVariant(application.status)}>
                          {getStatusLabel(application.status)}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        Enviada em: {new Date(application.applied_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>

                      {application.cover_letter && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Carta de Apresentação</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {application.cover_letter}
                          </p>
                        </div>
                      )}

                      {application.jobs.description && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Descrição da Vaga</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {application.jobs.description}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}