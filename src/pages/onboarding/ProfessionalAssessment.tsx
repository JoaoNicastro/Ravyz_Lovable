import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Brain, BarChart3, Users, Lightbulb, Target, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Question {
  id: string;
  question: string;
  category: 'leadership' | 'analytical' | 'creative' | 'technical' | 'communication';
  options: { value: string; label: string; score: number }[];
}

const ProfessionalAssessment = () => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [results, setResults] = useState<{
    primaryProfile: string;
    secondaryProfile: string;
    score: number;
  } | null>(null);
  
  const navigate = useNavigate();

  const questions: Question[] = [
    {
      id: 'problem_solving',
      category: 'analytical',
      question: 'Quando enfrento um problema complexo no trabalho, eu prefiro:',
      options: [
        { value: 'analyze', label: 'Analisar dados e criar uma solução sistemática', score: 5 },
        { value: 'collaborate', label: 'Reunir a equipe para brainstorming', score: 3 },
        { value: 'research', label: 'Pesquisar soluções similares e adaptar', score: 4 },
        { value: 'intuition', label: 'Confiar na minha experiência e intuição', score: 3 }
      ]
    },
    {
      id: 'work_environment',
      category: 'communication',
      question: 'Em que ambiente eu sou mais produtivo?',
      options: [
        { value: 'team', label: 'Trabalhando em equipe com discussões frequentes', score: 5 },
        { value: 'independent', label: 'Trabalhando independentemente com check-ins ocasionais', score: 4 },
        { value: 'mixed', label: 'Alternando entre trabalho solo e colaborativo', score: 4 },
        { value: 'structured', label: 'Em um ambiente altamente estruturado', score: 3 }
      ]
    },
    {
      id: 'decision_making',
      category: 'leadership',
      question: 'Ao tomar decisões importantes, eu costumo:',
      options: [
        { value: 'data_driven', label: 'Basear-me em dados e análises', score: 5 },
        { value: 'consensus', label: 'Buscar consenso da equipe', score: 4 },
        { value: 'experience', label: 'Confiar na minha experiência passada', score: 3 },
        { value: 'instinct', label: 'Seguir minha intuição', score: 3 }
      ]
    },
    {
      id: 'innovation',
      category: 'creative',
      question: 'Minha abordagem para inovação é:',
      options: [
        { value: 'disruptive', label: 'Buscar soluções completamente novas e disruptivas', score: 5 },
        { value: 'incremental', label: 'Melhorar gradualmente processos existentes', score: 4 },
        { value: 'collaborative', label: 'Combinar ideias da equipe para criar algo novo', score: 4 },
        { value: 'practical', label: 'Focar em melhorias práticas e implementáveis', score: 3 }
      ]
    },
    {
      id: 'learning_style',
      category: 'technical',
      question: 'Quando preciso aprender algo novo, eu prefiro:',
      options: [
        { value: 'hands_on', label: 'Aprender fazendo e experimentando', score: 5 },
        { value: 'study', label: 'Estudar teoria antes de praticar', score: 4 },
        { value: 'mentoring', label: 'Ter um mentor ou colega me ensinando', score: 4 },
        { value: 'documentation', label: 'Ler documentação e tutoriais detalhados', score: 3 }
      ]
    },
    {
      id: 'pressure_response',
      category: 'leadership',
      question: 'Sob pressão e prazos apertados, eu:',
      options: [
        { value: 'organized', label: 'Mantenho a organização e priorizo tarefas', score: 5 },
        { value: 'focused', label: 'Me concentro intensamente na tarefa principal', score: 4 },
        { value: 'delegate', label: 'Delego responsabilidades para a equipe', score: 4 },
        { value: 'creative', label: 'Encontro soluções criativas para economizar tempo', score: 3 }
      ]
    }
  ];

  const handleAnswer = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      completeAssessment();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResults = () => {
    const categoryScores: Record<string, number> = {
      leadership: 0,
      analytical: 0,
      creative: 0,
      technical: 0,
      communication: 0
    };

    questions.forEach(question => {
      const answer = answers[question.id];
      if (answer) {
        const option = question.options.find(opt => opt.value === answer);
        if (option) {
          categoryScores[question.category] += option.score;
        }
      }
    });

    // Find primary and secondary profiles
    const sortedCategories = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a);

    const profileNames: Record<string, string> = {
      leadership: 'Líder Estratégico',
      analytical: 'Analista Técnico',
      creative: 'Inovador Criativo',
      technical: 'Especialista Técnico',
      communication: 'Comunicador'
    };

    const primaryProfile = profileNames[sortedCategories[0][0]];
    const secondaryProfile = profileNames[sortedCategories[1][0]];
    const totalScore = Math.round((Object.values(categoryScores).reduce((a, b) => a + b, 0) / (questions.length * 5)) * 100);

    return { primaryProfile, secondaryProfile, score: totalScore };
  };

  const completeAssessment = async () => {
    setIsLoading(true);
    
    try {
      const assessmentResults = calculateResults();
      setResults(assessmentResults);
      setIsCompleted(true);

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não encontrado");

      // Get candidate profile
      const { data: profile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (profileError) throw profileError;

      // Save assessment responses
      const { error: assessmentError } = await supabase
        .from('questionnaire_responses')
        .insert({
          candidate_id: profile.id,
          category: 'professional',
          responses: {
            answers: answers,
            primaryProfile: assessmentResults.primaryProfile,
            secondaryProfile: assessmentResults.secondaryProfile
          },
          calculated_score: assessmentResults.score
        });

      if (assessmentError) throw assessmentError;

      // Update candidate profile
      const { error: updateError } = await supabase
        .from('candidate_profiles')
        .update({
          preferences: {
            completionLevel: 90 // Assessment completed
          }
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success("Assessment concluído!");
    } catch (error) {
      console.error('Error completing assessment:', error);
      toast.error("Erro ao salvar assessment");
    } finally {
      setIsLoading(false);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (isCompleted && results) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Results Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto">
              <BarChart3 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Seu Perfil Profissional</h1>
            <p className="text-muted-foreground">
              Baseado nas suas respostas, identificamos seu perfil profissional
            </p>
          </div>

          {/* Results Cards */}
          <div className="space-y-6">
            <Card className="bg-gradient-primary text-primary-foreground">
              <CardHeader>
                <CardTitle className="text-center">Perfil Principal</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <h2 className="text-2xl font-bold mb-2">{results.primaryProfile}</h2>
                <div className="text-lg opacity-90">Score: {results.score}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Perfil Secundário</CardTitle>
              </CardHeader>
              <CardContent>
                <h3 className="text-xl font-semibold">{results.secondaryProfile}</h3>
                <p className="text-muted-foreground mt-2">
                  Características complementares que também fazem parte do seu perfil
                </p>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Carreiras Sugeridas</Badge>
                  <span className="text-sm text-muted-foreground">
                    {results.primaryProfile === 'Líder Estratégico' && 'Gerente de Projetos, Product Manager, Diretor'}
                    {results.primaryProfile === 'Analista Técnico' && 'Data Scientist, Business Analyst, Consultor'}
                    {results.primaryProfile === 'Inovador Criativo' && 'Designer, Arquiteto de Software, Innovation Manager'}
                    {results.primaryProfile === 'Especialista Técnico' && 'Desenvolvedor Senior, Tech Lead, Arquiteto'}
                    {results.primaryProfile === 'Comunicador' && 'Marketing, Vendas, Relações Públicas, Training'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Pontos Fortes</Badge>
                  <span className="text-sm text-muted-foreground">
                    Seus resultados indicam alta capacidade em {results.primaryProfile.toLowerCase()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button 
              variant="outline" 
              onClick={() => navigate('/onboarding/validation')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            
            <Button onClick={() => navigate('/onboarding/dream-job')}>
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Progress value={progress} className="w-48 mx-auto" />
          <div className="flex items-center justify-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Assessment Profissional</h1>
          </div>
          <p className="text-muted-foreground">
            Questão {currentQuestion + 1} de {questions.length}
          </p>
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {questions[currentQuestion].question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[questions[currentQuestion].id] || ''}
              onValueChange={handleAnswer}
            >
              {questions[currentQuestion].options.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="cursor-pointer flex-1">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Category Badge */}
        <div className="flex justify-center">
          <Badge variant="outline" className="flex items-center gap-2">
            {questions[currentQuestion].category === 'leadership' && <Users className="h-4 w-4" />}
            {questions[currentQuestion].category === 'analytical' && <BarChart3 className="h-4 w-4" />}
            {questions[currentQuestion].category === 'creative' && <Lightbulb className="h-4 w-4" />}
            {questions[currentQuestion].category === 'technical' && <Target className="h-4 w-4" />}
            {questions[currentQuestion].category === 'communication' && <Users className="h-4 w-4" />}
            
            {questions[currentQuestion].category === 'leadership' && 'Liderança'}
            {questions[currentQuestion].category === 'analytical' && 'Análise'}
            {questions[currentQuestion].category === 'creative' && 'Criatividade'}
            {questions[currentQuestion].category === 'technical' && 'Técnico'}
            {questions[currentQuestion].category === 'communication' && 'Comunicação'}
          </Badge>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/onboarding/dream-job')}
            >
              <Clock className="mr-2 h-4 w-4" />
              Pular Assessment
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={!answers[questions[currentQuestion].id] || isLoading}
            >
              {isLoading ? "Processando..." : currentQuestion === questions.length - 1 ? "Finalizar" : "Próxima"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              ✓ Método de preenchimento • ✓ Informações básicas • ✓ Validação cultural • <strong>✓ Assessment profissional</strong>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfessionalAssessment;