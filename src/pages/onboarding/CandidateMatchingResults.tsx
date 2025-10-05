import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MatchCard } from "@/components/MatchCard";
import { toast } from "sonner";
import { Sparkles, ArrowRight } from "lucide-react";
import ravyzLogo from "@/assets/ravyz-logo.png";
import { mockCandidates, mockJobs } from "@/lib/mock-loader";
import { MatchingEngine } from "@/lib/matching-engine";
import type { MatchData } from "@/services/matchingService";
import { applyToJob } from "@/services/applicationsService";

const CandidateMatchingResults = () => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMatchingResults();
  }, []);

  const loadMatchingResults = async () => {
    try {
      // Get current user and candidate profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não encontrado");
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('id, full_name, pillar_scores, archetype')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error("Perfil não encontrado");
        navigate("/dashboard/candidate");
        return;
      }

      setCandidateId(profile.id);

      // Simulate loading time (3-5 seconds)
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Load mock data and calculate matches
      const mockCandidate = mockCandidates[0]; // Use first mock candidate as template
      const topJobs = mockJobs.slice(0, 10);

      const matchingEngine = new MatchingEngine();
      const matchPromises = topJobs.map(async (job) => {
        const matchResult = await matchingEngine.calculateRavyzMatchSingle(
          { 
            id: profile.id,
            pillar_scores: (profile.pillar_scores as any) || mockCandidate.pillar_scores, 
            archetype: profile.archetype || mockCandidate.archetype 
          },
          { 
            id: job.id,
            pillar_scores: job.pillar_scores, 
            archetype: job.archetype 
          }
        );

        return {
          job_id: job.id,
          job_title: job.title,
          company_name: "Empresa Inovadora",
          company_id: "mock-company-1",
          location: job.location,
          salary_min: 8000,
          salary_max: 15000,
          requirements: job.requirements.slice(0, 5),
          benefits: ["Vale alimentação", "Plano de saúde", "Home office"],
          match_percentage: matchResult.compatibility_score,
          interview_probability: Math.min(95, matchResult.compatibility_score + Math.floor(Math.random() * 10)),
          ranking: null,
          match_reasons: matchResult.explanation.split(". ").slice(0, 3),
          job_stats: {
            total_candidates: Math.floor(Math.random() * 200) + 50,
            days_open: Math.floor(Math.random() * 30) + 1,
            interview_rate: Math.floor(Math.random() * 30) + 10,
            hire_rate: Math.floor(Math.random() * 15) + 5,
            competition_level: (matchResult.compatibility_score > 80 ? "Alta" : matchResult.compatibility_score > 60 ? "Moderada" : "Baixa") as 'Baixa' | 'Moderada' | 'Alta'
          },
          created_at: job.created_at
        } as MatchData;
      });

      const calculatedMatches = await Promise.all(matchPromises);

      // Sort by match percentage
      const sortedMatches = calculatedMatches.sort((a, b) => b.match_percentage - a.match_percentage);
      setMatches(sortedMatches.slice(0, 6));
      setLoading(false);
    } catch (error) {
      console.error("Error loading matching results:", error);
      toast.error("Erro ao carregar vagas compatíveis");
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    try {
      const result = await applyToJob(jobId);
      if (result.success) {
        toast.success("Candidatura enviada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao enviar candidatura");
      }
    } catch (error) {
      console.error("Error applying to job:", error);
      toast.error("Erro ao enviar candidatura");
    }
  };

  const handleViewDetails = (jobId: string) => {
    toast.info("Visualizando detalhes da vaga...");
  };

  const handleGoToDashboard = () => {
    navigate("/dashboard/candidate");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl border-2 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img 
                  src={ravyzLogo} 
                  alt="RAVYZ Logo" 
                  className="w-20 h-20 object-contain animate-pulse"
                />
                <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold mb-2">
              Procurando as melhores vagas para você
            </CardTitle>
            <CardDescription className="text-base">
              Estamos analisando milhares de oportunidades para encontrar os matches perfeitos com seu perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-center gap-3 text-primary">
              <Sparkles className="w-6 h-6 animate-spin" />
              <span className="text-lg font-medium">Analisando compatibilidade...</span>
            </div>
            
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>

            <div className="text-center text-sm text-muted-foreground">
              Isso pode levar alguns segundos
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={ravyzLogo} 
              alt="RAVYZ Logo" 
              className="w-10 h-10 object-contain"
            />
            <div>
              <h1 className="text-xl font-bold">RAVYZ</h1>
              <p className="text-xs text-muted-foreground">Suas Vagas Compatíveis</p>
            </div>
          </div>
          <Button onClick={handleGoToDashboard} size="lg">
            Ir para Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Success Message */}
        <Card className="mb-8 border-2 border-success/50 bg-success/5">
          <CardHeader>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-success/20 rounded-full">
                <Sparkles className="w-8 h-8 text-success" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  🎉 Encontramos {matches.length} vagas perfeitas para você!
                </CardTitle>
                <CardDescription className="text-base">
                  Com base no seu perfil MATCH RAVYZ, estas são as oportunidades com maior compatibilidade. 
                  Você pode se candidatar diretamente ou explorar mais detalhes.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Matches Grid */}
        {matches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {matches.map((match) => (
              <MatchCard
                key={match.job_id}
                match={match}
                onApply={handleApply}
                onSave={() => toast.info("Funcionalidade em desenvolvimento")}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhuma vaga compatível encontrada no momento.
              </p>
              <Button onClick={handleGoToDashboard} variant="outline" className="mt-4">
                Ir para Dashboard
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Call to Action */}
        <Card className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 border-2">
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-bold mb-3">
              Explore mais oportunidades
            </h3>
            <p className="text-muted-foreground mb-6">
              Acesse seu dashboard para ver todas as vagas disponíveis, acompanhar suas candidaturas e muito mais!
            </p>
            <Button onClick={handleGoToDashboard} size="lg" className="gap-2">
              Acessar Dashboard Completo
              <ArrowRight className="w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CandidateMatchingResults;
