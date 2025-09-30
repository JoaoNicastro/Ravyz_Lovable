import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
import { CheckCircle, XCircle, User, MapPin, Briefcase, LayoutDashboard, Briefcase as BriefcaseIcon, ChevronDown, ChevronUp } from 'lucide-react';
import ravyzLogo from '@/assets/ravyz-logo.png';
import { CreateJobDialog } from '@/components/CreateJobDialog';
import { MatchingEngine, CandidateRavyzData, JobRavyzData } from '@/lib/matching-engine';

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
  const [jobMatches, setJobMatches] = useState<Record<string, MatchResult[]>>({});
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
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

      // Get all candidate profiles
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidate_profiles')
        .select('*');

      if (candidatesError) throw candidatesError;

      // Check for cached matches (not expired)
      const now = new Date();
      const jobIds = jobsData?.map(j => j.id) || [];
      
      if (jobIds.length > 0) {
        const { data: cachedMatches, error: cachedError } = await supabase
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
          .in('job_id', jobIds)
          .gt('expires_at', now.toISOString())
          .order('match_percentage', { ascending: false });

        if (cachedMatches && cachedMatches.length > 0) {
          // Use cached matches
          setMatches(cachedMatches);
        } else if (candidatesData && candidatesData.length > 0 && jobsData && jobsData.length > 0) {
          // Calculate new matches using matricial algorithm
          const matchingEngine = new MatchingEngine();
          
          const candidatesRavyzData: CandidateRavyzData[] = candidatesData.map(candidate => ({
            id: candidate.id,
            pillar_scores: (candidate.pillar_scores as Record<string, number>) || {},
            archetype: candidate.archetype || 'Equilibrado'
          }));

          const jobsRavyzData: JobRavyzData[] = jobsData.map(job => ({
            id: job.id,
            pillar_scores: (job.pillar_scores as Record<string, number>) || {},
            archetype: job.archetype || 'Equilibrado'
          }));

          // Calculate all matches in batch
          const matchResults = matchingEngine.calculateAllMatches(candidatesRavyzData, jobsRavyzData);

          // Save matches to database
          const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

          const matchesToInsert = matchResults.map(result => ({
            candidate_id: result.candidate_id,
            job_id: result.job_id,
            match_percentage: result.compatibility_score,
            score_breakdown: {
              ravyz_compatibility: result.compatibility_score,
              archetype_boost: result.archetype_boost,
              base_similarity: result.base_similarity
            },
            factors_analyzed: {
              candidate_archetype: result.candidate_archetype,
              job_archetype: result.job_archetype,
              pillar_breakdown: result.pillar_breakdown,
              archetype_boost: result.archetype_boost
            },
            explanation: `Match de ${result.compatibility_score}% baseado em compatibilidade comportamental.`,
            calculated_at: now.toISOString(),
            expires_at: expiresAt.toISOString()
          }));

          // Upsert matches
          const { error: upsertError } = await supabase
            .from('matching_results')
            .upsert(matchesToInsert, {
              onConflict: 'candidate_id,job_id',
              ignoreDuplicates: false
            });

          if (upsertError) {
            console.error('Error saving matches:', upsertError);
          }

          // Fetch the saved matches with full data
          const { data: newMatches, error: newMatchError } = await supabase
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
            .in('job_id', jobIds)
            .order('match_percentage', { ascending: false });

          if (!newMatchError && newMatches) {
            setMatches(newMatches);
          }
        }
      }
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

  const loadJobMatches = async (jobId: string) => {
    try {
      const { data: matchData, error } = await supabase
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
        .eq('job_id', jobId)
        .order('match_percentage', { ascending: false });

      if (error) throw error;

      setJobMatches(prev => ({
        ...prev,
        [jobId]: matchData || []
      }));
    } catch (error) {
      console.error('Error loading job matches:', error);
    }
  };

  const toggleJobExpanded = async (jobId: string) => {
    const newExpanded = new Set(expandedJobs);
    
    if (newExpanded.has(jobId)) {
      newExpanded.delete(jobId);
    } else {
      newExpanded.add(jobId);
      // Load matches if not already loaded
      if (!jobMatches[jobId]) {
        await loadJobMatches(jobId);
      }
    }
    
    setExpandedJobs(newExpanded);
  };

  const handleInviteCandidate = async (matchId: string, candidateId: string, jobId: string) => {
    if (!companyProfile) return;

    try {
      // Check if application already exists
      const { data: existingApp, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('candidate_id', candidateId)
        .eq('job_id', jobId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingApp) {
        toast({
          title: "Candidato já convidado",
          description: "Este candidato já foi convidado para esta vaga",
          variant: "destructive",
        });
        return;
      }

      // Create application with viewed status (company invited)
      const { error: appError } = await supabase
        .from('applications')
        .insert([{
          candidate_id: candidateId,
          job_id: jobId,
          status: 'viewed'
        }]);

      if (appError) throw appError;

      // Insert feedback
      const { error: feedbackError } = await supabase
        .from('match_feedback')
        .insert({
          company_id: companyProfile.id,
          candidate_id: candidateId,
          job_id: jobId,
          feedback: 'advance'
        });

      if (feedbackError) throw feedbackError;

      // Update matching result status
      const { error: updateError } = await supabase
        .from('matching_results')
        .update({ feedback_status: 'advance' })
        .eq('id', matchId);

      if (updateError) throw updateError;

      // Update local state
      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { ...match, feedback_status: 'advance' }
          : match
      ));

      toast({
        title: "Candidato convidado!",
        description: "O candidato foi convidado para a vaga ✅",
      });
    } catch (error) {
      console.error('Error inviting candidate:', error);
      toast({
        title: "Erro",
        description: "Não foi possível convidar o candidato",
        variant: "destructive",
      });
    }
  };

  const handleRejectCandidate = async (matchId: string, candidateId: string, jobId: string) => {
    if (!companyProfile) return;

    try {
      // Insert feedback
      const { error: feedbackError } = await supabase
        .from('match_feedback')
        .insert({
          company_id: companyProfile.id,
          candidate_id: candidateId,
          job_id: jobId,
          feedback: 'reject'
        });

      if (feedbackError) throw feedbackError;

      // Update matching result status
      const { error: updateError } = await supabase
        .from('matching_results')
        .update({ feedback_status: 'reject' })
        .eq('id', matchId);

      if (updateError) throw updateError;

      // Update local state
      setMatches(prev => prev.map(match => 
        match.id === matchId 
          ? { ...match, feedback_status: 'reject' }
          : match
      ));

      toast({
        title: "Candidato rejeitado",
        description: "O feedback foi registrado ❌",
      });
    } catch (error) {
      console.error('Error rejecting candidate:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o candidato",
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
                              onClick={() => handleInviteCandidate(
                                match.id, 
                                match.candidate_profiles.id, 
                                match.jobs.id
                              )}
                              className="flex items-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Convidar
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleRejectCandidate(
                                match.id, 
                                match.candidate_profiles.id, 
                                match.jobs.id
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
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((job) => {
                const isExpanded = expandedJobs.has(job.id);
                const matches = jobMatches[job.id] || [];
                
                return (
                  <Collapsible
                    key={job.id}
                    open={isExpanded}
                    onOpenChange={() => toggleJobExpanded(job.id)}
                  >
                    <Card>
                      <CollapsibleTrigger className="w-full">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 text-left">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {job.title}
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 mt-1">
                                <MapPin className="w-4 h-4" />
                                {job.location || 'Localização não informada'}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                                {job.status === 'active' ? 'Ativa' : 'Inativa'}
                              </Badge>
                              {isExpanded && matches.length > 0 && (
                                <Badge variant="outline">
                                  {matches.length} candidato{matches.length !== 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CardContent className="space-y-3 pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {job.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm flex-wrap">
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

                        <CollapsibleContent>
                          <div className="mt-6 pt-6 border-t space-y-4">
                            <h4 className="font-semibold text-lg">Candidatos Compatíveis</h4>
                            
                            {matches.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                Nenhum candidato compatível ainda.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {matches.map((match) => (
                                  <Card key={match.id} className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <CardTitle className="text-base flex items-center gap-2">
                                            {match.candidate_profiles.avatar_url && (
                                              <img 
                                                src={match.candidate_profiles.avatar_url} 
                                                alt="Candidate"
                                                className="w-6 h-6 rounded-full object-cover"
                                              />
                                            )}
                                            <User className="w-4 h-4" />
                                            {match.candidate_profiles.headline || 'Candidato'}
                                          </CardTitle>
                                          {match.candidate_profiles.location && (
                                            <CardDescription className="flex items-center gap-1 mt-1">
                                              <MapPin className="w-3 h-3" />
                                              {match.candidate_profiles.location}
                                            </CardDescription>
                                          )}
                                        </div>
                                        <Badge 
                                          className={`${getMatchBadgeColor(match.match_percentage)} text-white`}
                                        >
                                          {match.match_percentage}% Match
                                        </Badge>
                                      </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3 pt-0">
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Briefcase className="w-3 h-3" />
                                        {match.candidate_profiles.years_experience} anos de experiência
                                      </div>

                                      {match.candidate_profiles.pillar_scores && job.pillar_scores && (
                                        <div className="mt-3">
                                          <MatchRadarChart
                                            candidatePillars={match.candidate_profiles.pillar_scores}
                                            jobPillars={job.pillar_scores}
                                          />
                                        </div>
                                      )}

                                      {match.explanation && (
                                        <p className="text-xs text-muted-foreground">
                                          {match.explanation}
                                        </p>
                                      )}

                                      <div className="flex gap-2 pt-2">
                                        {match.feedback_status ? (
                                          <Badge variant="secondary" className="text-xs">
                                            {match.feedback_status === 'advance' ? '✅ Aprovado' : '❌ Rejeitado'}
                                          </Badge>
                                        ) : (
                                          <>
                                             <Button
                                              size="sm"
                                              onClick={() => handleInviteCandidate(
                                                match.id, 
                                                match.candidate_profiles.id, 
                                                job.id
                                              )}
                                              className="flex items-center gap-1"
                                            >
                                              <CheckCircle className="w-3 h-3" />
                                              Convidar
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              onClick={() => handleRejectCandidate(
                                                match.id, 
                                                match.candidate_profiles.id, 
                                                job.id
                                              )}
                                              className="flex items-center gap-1"
                                            >
                                              <XCircle className="w-3 h-3" />
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
                        </CollapsibleContent>
                      </CardContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}