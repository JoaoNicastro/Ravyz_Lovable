import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowRight, ArrowLeft, Star, Briefcase, MapPin, DollarSign, X, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DreamJobBuilder = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    position: '',
    level: '',
    salary_min: '',
    salary_max: '',
    work_model: '',
    location: '',
    skills: [] as string[],
    description: '',
    companySize: '',
    industry: ''
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

      // Get candidate profile
      const { data: profile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.user.id)
        .single();

      if (profileError) throw profileError;

      // Update candidate profile with dream job preferences
      const dreamJobData = {
        position: formData.position,
        level: formData.level,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        work_model: formData.work_model,
        location: formData.location,
        skills: formData.skills,
        description: formData.description,
        companySize: formData.companySize,
        industry: formData.industry
      };

      const { error: updateError } = await supabase
        .from('candidate_profiles')
        .update({
          preferences: {
            dreamJob: dreamJobData,
            completionLevel: 100 // Onboarding completed
          }
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      toast.success("Emprego dos sonhos configurado!");
      navigate('/candidate');
    } catch (error) {
      console.error('Error saving dream job:', error);
      toast.error("Erro ao salvar emprego dos sonhos");
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL',
    'AWS', 'Docker', 'Kubernetes', 'Machine Learning', 'Data Analysis',
    'UI/UX Design', 'Product Management', 'Marketing Digital', 'Vendas',
    'Gestão de Projetos', 'Liderança', 'Comunicação', 'Estratégia'
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <Progress value={100} className="w-32 mx-auto" />
          <div className="flex items-center justify-center gap-2">
            <Star className="h-6 w-6 text-warning" />
            <h1 className="text-3xl font-bold text-foreground">Seu Emprego dos Sonhos</h1>
          </div>
          <p className="text-muted-foreground">
            Descreva sua vaga ideal para que possamos encontrar as melhores oportunidades
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Position */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Cargo Desejado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="position">Título da Posição *</Label>
                <Input
                  id="position"
                  placeholder="Ex: Desenvolvedor Full Stack Senior, Product Manager, Designer UI/UX"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="level">Nível de Senioridade</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trainee">Trainee</SelectItem>
                    <SelectItem value="junior">Júnior</SelectItem>
                    <SelectItem value="pleno">Pleno</SelectItem>
                    <SelectItem value="senior">Sênior</SelectItem>
                    <SelectItem value="lead">Lead/Tech Lead</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="director">Diretor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Salary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Expectativa Salarial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="salary_min">Salário Mínimo (R$)</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    placeholder="5000"
                    value={formData.salary_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_min: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="salary_max">Salário Máximo (R$)</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    placeholder="15000"
                    value={formData.salary_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary_max: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Deixe em branco se preferir não especificar
              </p>
            </CardContent>
          </Card>

          {/* Work Model */}
          <Card>
            <CardHeader>
              <CardTitle>Modelo de Trabalho</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.work_model}
                onValueChange={(value) => setFormData(prev => ({ ...prev, work_model: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="remote" id="remote" />
                  <Label htmlFor="remote">Remoto</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid" id="hybrid" />
                  <Label htmlFor="hybrid">Híbrido</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="onsite" id="onsite" />
                  <Label htmlFor="onsite">Presencial</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="flexible" id="flexible" />
                  <Label htmlFor="flexible">Flexível</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Ex: São Paulo, SP | Rio de Janeiro, RJ | Brasil | Remoto"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              />
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Habilidades Desejadas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Quais tecnologias e skills você gostaria de usar no seu emprego ideal?
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    .slice(0, 10)
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
            </CardContent>
          </Card>

          {/* Company Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Tipo de Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="company-size">Tamanho da Empresa</Label>
                <Select value={formData.companySize} onValueChange={(value) => setFormData(prev => ({ ...prev, companySize: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup (1-50 funcionários)</SelectItem>
                    <SelectItem value="small">Pequena (51-200 funcionários)</SelectItem>
                    <SelectItem value="medium">Média (201-1000 funcionários)</SelectItem>
                    <SelectItem value="large">Grande (1000+ funcionários)</SelectItem>
                    <SelectItem value="any">Qualquer tamanho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="industry">Setor/Indústria</Label>
                <Input
                  id="industry"
                  placeholder="Ex: Tecnologia, Saúde, Educação, Fintech, E-commerce"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição do Emprego Ideal</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Descreva como seria seu dia a dia no emprego dos sonhos. Que tipo de projetos gostaria de trabalhar? Que responsabilidades deseja ter?"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/onboarding/assessment')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            
            <Button 
              type="submit" 
              disabled={!formData.position || isLoading}
            >
              {isLoading ? "Salvando..." : "Finalizar Cadastro"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>

        {/* Completion Info */}
        <Card className="bg-gradient-primary text-primary-foreground">
          <CardContent className="p-6 text-center">
            <Star className="h-8 w-8 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Parabéns!</h3>
            <p className="text-sm opacity-90">
              Você está prestes a completar seu perfil. Após finalizar, nossa IA começará a buscar vagas perfeitas para você!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DreamJobBuilder;