import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MatchingResult } from '@/lib/schemas';
import { CheckCircle, AlertCircle, Star, TrendingUp, MapPin, DollarSign, Users, Award, Target } from 'lucide-react';

interface MatchingDisplayProps {
  matchingResult: MatchingResult;
  candidateName?: string;
  jobTitle?: string;
  companyName?: string;
  className?: string;
}

export function MatchingDisplay({ 
  matchingResult, 
  candidateName, 
  jobTitle, 
  companyName,
  className = '' 
}: MatchingDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 85) return 'default';
    if (score >= 70) return 'secondary';
    return 'outline';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Match Score */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Star className="h-6 w-6 text-yellow-500" />
            <CardTitle>Compatibilidade Geral</CardTitle>
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(matchingResult.matchPercentage)}`}>
            {matchingResult.matchPercentage}%
          </div>
          {candidateName && jobTitle && (
            <p className="text-muted-foreground">
              {candidateName} × {jobTitle}
              {companyName && ` • ${companyName}`}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <Progress value={matchingResult.matchPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground mt-3 text-center">
            {matchingResult.explanation}
          </p>
        </CardContent>
      </Card>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Análise Detalhada</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skills */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Habilidades</p>
                <p className="text-xs text-muted-foreground">
                  Peso: {(matchingResult.factorsAnalyzed.skills.weight * 100).toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={matchingResult.scoreBreakdown.skills} className="w-20 h-2" />
              <Badge variant={getScoreBadgeVariant(matchingResult.scoreBreakdown.skills)}>
                {matchingResult.scoreBreakdown.skills.toFixed(0)}%
              </Badge>
            </div>
          </div>

          {/* Experience */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Experiência</p>
                <p className="text-xs text-muted-foreground">
                  {matchingResult.factorsAnalyzed.experience.yearsExperience} anos • 
                  {matchingResult.factorsAnalyzed.experience.levelMatch ? ' Nível ideal' : ' Diferença de nível'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={matchingResult.scoreBreakdown.experience} className="w-20 h-2" />
              <Badge variant={getScoreBadgeVariant(matchingResult.scoreBreakdown.experience)}>
                {matchingResult.scoreBreakdown.experience.toFixed(0)}%
              </Badge>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MapPin className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Localização</p>
                <p className="text-xs text-muted-foreground">
                  {matchingResult.factorsAnalyzed.location.workModelMatch ? 'Modelo compatível' : 'Modelo incompatível'} • 
                  {matchingResult.factorsAnalyzed.location.locationMatch ? ' Local compatível' : ' Local incompatível'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={matchingResult.scoreBreakdown.location} className="w-20 h-2" />
              <Badge variant={getScoreBadgeVariant(matchingResult.scoreBreakdown.location)}>
                {matchingResult.scoreBreakdown.location.toFixed(0)}%
              </Badge>
            </div>
          </div>

          {/* Salary */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">Salário</p>
                <p className="text-xs text-muted-foreground">
                  Expectativa: {formatCurrency(matchingResult.factorsAnalyzed.salary.candidateExpectation.min)} - 
                  {formatCurrency(matchingResult.factorsAnalyzed.salary.candidateExpectation.max)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Oferta: {formatCurrency(matchingResult.factorsAnalyzed.salary.jobOffer.min)} - 
                  {formatCurrency(matchingResult.factorsAnalyzed.salary.jobOffer.max)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={matchingResult.scoreBreakdown.salary} className="w-20 h-2" />
              <Badge variant={getScoreBadgeVariant(matchingResult.scoreBreakdown.salary)}>
                {matchingResult.scoreBreakdown.salary.toFixed(0)}%
              </Badge>
            </div>
          </div>

          {/* Culture */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="font-medium">Cultura</p>
                <p className="text-xs text-muted-foreground">
                  Estilo de trabalho: {matchingResult.factorsAnalyzed.culture.workStyleAlignment.toFixed(0)}% • 
                  Valores: {matchingResult.factorsAnalyzed.culture.valueAlignment.toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={matchingResult.scoreBreakdown.culture} className="w-20 h-2" />
              <Badge variant={getScoreBadgeVariant(matchingResult.scoreBreakdown.culture)}>
                {matchingResult.scoreBreakdown.culture.toFixed(0)}%
              </Badge>
            </div>
          </div>

          {/* Resume */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-teal-600" />
              <div>
                <p className="font-medium">Currículo</p>
                <p className="text-xs text-muted-foreground">
                  Técnico: {matchingResult.factorsAnalyzed.resume.technicalScore.toFixed(0)}% • 
                  Soft Skills: {matchingResult.factorsAnalyzed.resume.softSkillsScore.toFixed(0)}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={matchingResult.scoreBreakdown.resume} className="w-20 h-2" />
              <Badge variant={getScoreBadgeVariant(matchingResult.scoreBreakdown.resume)}>
                {matchingResult.scoreBreakdown.resume.toFixed(0)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Habilidades Detalhadas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(matchingResult.factorsAnalyzed.skills.details).map(([skill, score]) => (
              <div key={skill} className="flex items-center justify-between">
                <span className="text-sm">{skill}</span>
                <div className="flex items-center space-x-2">
                  {score > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm font-medium">
                    {score > 0 ? 'Possui' : 'Não possui'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Badge */}
      {matchingResult.isDemoMatch && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-orange-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Este é um match de demonstração</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}