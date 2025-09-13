import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Heart, Users, MapPin, DollarSign, Briefcase } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CandidateValidation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    workStyle: '',
    culturePreferences: [] as string[],
    dreamCompanies: '',
    preferredLocation: '',
    targetPosition: '',
    salaryExpectation: '',
    background: '',
    careerGoals: ''
  });
  const navigate = useNavigate();

  const handleCultureToggle = (value: string) => {
    setFormData(prev => ({
      ...prev,
      culturePreferences: prev.culturePreferences.includes(value)
        ? prev.culturePreferences.filter(item => item !== value)
        : [...prev.culturePreferences, value]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não encontrado");

      // Get candidate profile
      const { data: profile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (profileError) throw profileError;

      // Save cultural responses
      const culturalResponses = {
        workStyle: formData.workStyle,
        culturePreferences: formData.culturePreferences,
        dreamCompanies: formData.dreamCompanies,
        background: formData.background,
        careerGoals: formData.careerGoals
      };

      const { error: culturalError } = await supabase
        .from('questionnaire_responses')
        .insert({
          candidate_id: profile.id,
          category: 'cultural',
          responses: culturalResponses,
          calculated_score: 75 // Base score
        });

      if (culturalError) throw culturalError;

      // Save professional responses
      const professionalResponses = {
        preferredLocation: formData.preferredLocation,
        targetPosition: formData.targetPosition,
        salaryExpectation: formData.salaryExpectation
      };

      const { error: professionalError } = await supabase
        .from('questionnaire_responses')
        .insert({
          candidate_id: profile.id,
          category: 'professional',
          responses: professionalResponses,
          calculated_score: 80 // Base score
        });

      if (professionalError) throw professionalError;

      // Update candidate profile validation score
      const { error: updateError } = await supabase
        .from('candidate_profiles')
        .update({
          validation_score: 78, // Average of cultural and professional scores
          preferences: {
            completionLevel: 75 // Validation completed
          }
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success("Preferências salvas com sucesso!");
      navigate('/onboarding/assessment');
    } catch (error) {
      console.error('Error saving validation:', error);
      toast.error("Erro ao salvar preferências");
    } finally {
      setIsLoading(false);
    }
  };

  const cultureOptions = [
    { id: 'innovative', label: 'Inovação e criatividade', icon: '💡' },
    { id: 'collaborative', label: 'Colaboração e trabalho em equipe', icon: '🤝' },
    { id: 'growth', label: 'Crescimento e aprendizado', icon: '📈' },
    { id: 'autonomy', label: 'Autonomia e flexibilidade', icon: '🎯' },
    { id: 'impact', label: 'Impacto social e sustentabilidade', icon: '🌱' },
    { id: 'diversity', label: 'Diversidade e inclusão', icon: '🌈' },
    { id: 'stability', label: 'Estabilidade e segurança', icon: '🛡️' },
    { id: 'fastpaced', label: 'Ambiente dinâmico e desafios', icon: '⚡' }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Progress value={75} className="w-32 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Vamos conhecer suas preferências</h1>
          <p className="text-muted-foreground">
            Essas informações nos ajudam a encontrar empresas e vagas que combinam com você
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Work Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Estilo de Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.workStyle}
                onValueChange={(value) => setFormData(prev => ({ ...prev, workStyle: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remote" id="remote" />
                  <Label htmlFor="remote">Remoto - Prefiro trabalhar de casa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="hybrid" />
                  <Label htmlFor="hybrid">Híbrido - Misto entre casa e escritório</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="onsite" id="onsite" />
                  <Label htmlFor="onsite">Presencial - Prefiro trabalhar no escritório</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flexible" id="flexible" />
                  <Label htmlFor="flexible">Flexível - Me adapto ao que a empresa oferece</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Culture Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Cultura da Empresa
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Selecione os valores que são importantes para você (múltipla escolha)
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cultureOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.id}
                      checked={formData.culturePreferences.includes(option.id)}
                      onCheckedChange={() => handleCultureToggle(option.id)}
                    />
                    <Label htmlFor={option.id} className="flex items-center gap-2 cursor-pointer">
                      <span>{option.icon}</span>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Dream Companies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Empresas dos Sonhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Quais empresas você admira ou gostaria de trabalhar? (ex: Google, Nubank, Spotify, startups de tecnologia, etc.)"
                value={formData.dreamCompanies}
                onChange={(e) => setFormData(prev => ({ ...prev, dreamCompanies: e.target.value }))}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Location Preference */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Localização Preferida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Onde você gostaria de trabalhar? (ex: São Paulo, Rio de Janeiro, Remoto, Qualquer lugar do Brasil, etc.)"
                value={formData.preferredLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, preferredLocation: e.target.value }))}
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Target Position */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Posição Desejada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Que tipo de cargo você está buscando? (ex: Desenvolvedor Senior, Product Manager, Designer UI/UX, etc.)"
                value={formData.targetPosition}
                onChange={(e) => setFormData(prev => ({ ...prev, targetPosition: e.target.value }))}
                rows={2}
              />
            </CardContent>
          </Card>

          {/* Salary Expectation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Expectativa Salarial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.salaryExpectation}
                onValueChange={(value) => setFormData(prev => ({ ...prev, salaryExpectation: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="entry" id="entry" />
                  <Label htmlFor="entry">Até R$ 5.000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="junior" id="junior" />
                  <Label htmlFor="junior">R$ 5.000 - R$ 10.000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="mid" id="mid" />
                  <Label htmlFor="mid">R$ 10.000 - R$ 20.000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="senior" id="senior" />
                  <Label htmlFor="senior">R$ 20.000 - R$ 30.000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="executive" id="executive" />
                  <Label htmlFor="executive">Acima de R$ 30.000</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="negotiable" id="negotiable" />
                  <Label htmlFor="negotiable">A combinar</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Background */}
          <Card>
            <CardHeader>
              <CardTitle>Conte um pouco sobre você</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="background">Resumo Profissional</Label>
                <Textarea
                  id="background"
                  placeholder="Descreva brevemente sua experiência e o que te motiva profissionalmente..."
                  value={formData.background}
                  onChange={(e) => setFormData(prev => ({ ...prev, background: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="goals">Objetivos de Carreira</Label>
                <Textarea
                  id="goals"
                  placeholder="Onde você se vê daqui a 2-3 anos? Quais são seus objetivos profissionais?"
                  value={formData.careerGoals}
                  onChange={(e) => setFormData(prev => ({ ...prev, careerGoals: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/onboarding/candidate')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            
            <Button 
              type="submit" 
              disabled={!formData.workStyle || isLoading}
            >
              {isLoading ? "Salvando..." : "Continuar"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Progress Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              ✓ Método de preenchimento • ✓ Informações básicas • <strong>✓ Validação cultural</strong> • Assessment profissional
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateValidation;