import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, TrendingUp, CheckCircle2, Heart, Eye, Building, MapPin, DollarSign } from 'lucide-react';
import { MatchData } from '@/services/matchingService';

interface MatchCardProps {
  match: MatchData;
  onApply: (jobId: string) => void;
  onSave: (jobId: string) => void;
  onViewDetails: (jobId: string) => void;
}

export function MatchCard({ match, onApply, onSave, onViewDetails }: MatchCardProps) {
  // Determine match badge color
  const getMatchBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-[#16a34a] text-white hover:bg-[#16a34a]/90';
    if (score >= 50) return 'bg-[#facc15] text-black hover:bg-[#facc15]/90';
    return 'bg-[#dc2626] text-white hover:bg-[#dc2626]/90';
  };

  // Determine probability badge color
  const getProbabilityBadgeColor = (prob: number) => {
    if (prob >= 80) return 'bg-[#16a34a]/10 text-[#16a34a] border-[#16a34a]/20';
    if (prob >= 50) return 'bg-[#facc15]/10 text-[#854d0e] border-[#facc15]/20';
    return 'bg-[#dc2626]/10 text-[#dc2626] border-[#dc2626]/20';
  };

  // Format salary range
  const formatSalary = () => {
    if (match.salary_min && match.salary_max) {
      return `R$ ${match.salary_min.toLocaleString('pt-BR')} – R$ ${match.salary_max.toLocaleString('pt-BR')}`;
    }
    return null;
  };

  // Get competition color
  const getCompetitionColor = (level: string) => {
    if (level === 'Alta') return 'text-[#dc2626]';
    if (level === 'Moderada') return 'text-[#f59e0b]';
    return 'text-[#16a34a]';
  };

  // Extract requirement tags
  const getRequirementTags = () => {
    const tags: string[] = [];
    
    if (match.requirements?.experience_years) {
      tags.push(`${match.requirements.experience_years}+ anos`);
    }
    if (match.requirements?.seniority) {
      tags.push(match.requirements.seniority);
    }
    if (match.requirements?.skills && Array.isArray(match.requirements.skills)) {
      tags.push(...match.requirements.skills.slice(0, 2));
    }
    
    return tags.length > 0 ? tags : ['Experiência relevante', 'Skills técnicas'];
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-2xl font-bold text-foreground">{match.job_title}</h3>
              <Badge className={getMatchBadgeColor(match.match_percentage)}>
                {match.match_percentage}% Match
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                <span>{match.company_name}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{match.location}</span>
              </div>
            </div>
            
            {formatSalary() && (
              <div className="flex items-center gap-1 text-foreground font-medium">
                <DollarSign className="h-4 w-4" />
                <span>{formatSalary()}</span>
              </div>
            )}
          </div>

          <div className="text-right space-y-2">
            <Badge className={getProbabilityBadgeColor(match.interview_probability)}>
              {match.interview_probability}% Probabilidade
            </Badge>
            {match.ranking && (
              <p className="text-sm text-muted-foreground">
                #{match.ranking.position} de {match.ranking.total} candidatos
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-[1fr,300px] gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Requirements */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Requisitos</h4>
              <div className="flex flex-wrap gap-2">
                {getRequirementTags().map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-muted">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Match Reasons */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Por que é um bom match:</h4>
              <div className="space-y-2">
                {match.match_reasons.map((reason, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-[#16a34a] shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Benefits */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Benefícios</h4>
              <div className="flex flex-wrap gap-2">
                {match.benefits.map((benefit, index) => (
                  <Badge key={index} variant="outline" className="bg-primary/5 border-primary/20">
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Statistics */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-4 h-fit">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Estatísticas da Vaga</h4>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="text-sm text-muted-foreground">Dados do processo seletivo</div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold text-foreground">
                    {match.job_stats.total_candidates}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Candidatos</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold text-foreground">
                    {match.job_stats.days_open}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Dias (processo)</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Taxa de Entrevista</span>
                  <span className="font-medium text-foreground">{match.job_stats.interview_rate}%</span>
                </div>
                <Progress 
                  value={match.job_stats.interview_rate} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Taxa de Contratação</span>
                  <span className="font-medium text-foreground">{match.job_stats.hire_rate}%</span>
                </div>
                <Progress 
                  value={match.job_stats.hire_rate} 
                  className="h-2"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <Badge 
                variant="outline" 
                className={`${
                  match.job_stats.competition_level === 'Baixa' 
                    ? 'bg-[#16a34a]/10 border-[#16a34a]/20 text-[#16a34a]' 
                    : 'bg-[#f59e0b]/10 border-[#f59e0b]/20 text-[#f59e0b]'
                }`}
              >
                {match.job_stats.competition_level === 'Baixa' ? '🟢 Moderada' : '🟠 Competição Alta'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/50 pt-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Publicada {match.job_stats.days_open} dias atrás</span>
          <span>•</span>
          <span>Competição {match.job_stats.competition_level}</span>
          <span>•</span>
          <span>{match.interview_probability}% chance de entrevista</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSave(match.job_id)}
            className="gap-2"
          >
            <Heart className="h-4 w-4" />
            Salvar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(match.job_id)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Ver Detalhes
          </Button>
          <Button
            size="sm"
            onClick={() => onApply(match.job_id)}
            className="bg-gradient-primary hover:shadow-glow gap-2"
          >
            Candidatar-se
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
