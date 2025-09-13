import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Upload, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CandidateRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    avatar_url: '',
    headline: '',
    location: '',
    years_experience: 0,
    skills: [] as string[]
  });
  const [newSkill, setNewSkill] = useState('');
  const navigate = useNavigate();

  const handleSkillAdd = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não encontrado");

      // Get existing profile
      const { data: profile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (profileError) throw profileError;

      // Update profile with form data
      const { error: updateError } = await supabase
        .from('candidate_profiles')
        .update({
          avatar_url: formData.avatar_url,
          headline: formData.headline,
          location: formData.location,
          years_experience: formData.years_experience,
          preferences: {
            completionLevel: 50 // Basic info completed
          }
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success("Perfil básico configurado!");
      navigate('/onboarding/validation');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL',
    'Git', 'AWS', 'Docker', 'Figma', 'Photoshop', 'Marketing Digital',
    'Vendas', 'Gestão de Projetos', 'Liderança', 'Comunicação'
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Progress value={50} className="w-32 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Vamos criar seu perfil</h1>
          <p className="text-muted-foreground">
            Preencha suas informações básicas para que empresas possam te encontrar
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar */}
              <div className="space-y-2">
                <Label>Foto do Perfil</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={formData.avatar_url} />
                    <AvatarFallback>
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Input
                      placeholder="URL da foto (opcional)"
                      value={formData.avatar_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Cole a URL de uma foto ou deixe em branco por agora
                    </p>
                  </div>
                </div>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <Label htmlFor="headline">Título Profissional *</Label>
                <Input
                  id="headline"
                  placeholder="Ex: Desenvolvedor Full Stack | Designer UI/UX | Gerente de Marketing"
                  value={formData.headline}
                  onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Como você se apresentaria em uma frase? Seja específico e atrativo.
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  placeholder="Ex: São Paulo, SP | Rio de Janeiro, RJ | Remoto"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              {/* Years of Experience */}
              <div className="space-y-2">
                <Label htmlFor="experience">Anos de Experiência</Label>
                <Select 
                  value={formData.years_experience.toString()} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, years_experience: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione sua experiência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Iniciante (0-1 anos)</SelectItem>
                    <SelectItem value="2">Júnior (2-3 anos)</SelectItem>
                    <SelectItem value="4">Pleno (4-6 anos)</SelectItem>
                    <SelectItem value="7">Sênior (7-10 anos)</SelectItem>
                    <SelectItem value="11">Especialista (11+ anos)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <Label>Principais Habilidades</Label>
                
                {/* Add Skill Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma habilidade"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSkillAdd())}
                  />
                  <Button type="button" onClick={handleSkillAdd} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Current Skills */}
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {skill}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => handleSkillRemove(skill)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Suggested Skills */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Sugestões:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills
                      .filter(skill => !formData.skills.includes(skill))
                      .slice(0, 8)
                      .map((skill) => (
                        <Button
                          key={skill}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ 
                            ...prev, 
                            skills: [...prev.skills, skill] 
                          }))}
                        >
                          {skill}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/onboarding/fill-method')}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={!formData.headline || isLoading}
                >
                  {isLoading ? "Salvando..." : "Continuar"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Progress Info */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              ✓ Método de preenchimento • <strong>✓ Informações básicas</strong> • Validação cultural • Emprego dos sonhos
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateRegistration;