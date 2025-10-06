import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronRight, Plus, X, Check, Sparkles } from "lucide-react";
import { AutocompleteInput } from "@/components/onboarding/AutocompleteInput";
import { SkillSuggestions } from "@/components/onboarding/SkillSuggestions";
import { ProfilePreview } from "@/components/onboarding/ProfilePreview";
import { AchievementBadge } from "@/components/onboarding/AchievementBadge";
import { useState } from "react";

const assessmentSchema = z.object({
  headline: z.string().min(5, "Título deve ter pelo menos 5 caracteres").max(200, "Título muito longo"),
  years_experience: z.number().min(0, "Experiência não pode ser negativa").max(50, "Experiência muito alta"),
  skills: z.array(z.string()).min(3, "Adicione pelo menos 3 habilidades"),
  currentRole: z.string().min(1, "Cargo atual é obrigatório"),
  currentCompany: z.string().min(1, "Empresa atual é obrigatória"),
  yearsInRole: z.number().min(0, "Anos no cargo deve ser um número positivo"),
  keyAchievements: z.string().min(50, "Descreva suas principais conquistas (mínimo 50 caracteres)"),
  careerGoals: z.string().min(50, "Descreva seus objetivos de carreira (mínimo 50 caracteres)"),
  preferredRoles: z.array(z.string()).min(1, "Adicione pelo menos 1 cargo de interesse"),
});

type AssessmentData = z.infer<typeof assessmentSchema>;

interface StepProps {
  onNext: (data: AssessmentData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: AssessmentData;
}

const PROFESSIONAL_TITLES = [
  "Desenvolvedor Full Stack",
  "Desenvolvedor Frontend",
  "Desenvolvedor Backend",
  "Designer UI/UX",
  "Designer de Produto",
  "Gerente de Projetos",
  "Gerente de Marketing",
  "Analista de Dados",
  "Product Manager",
  "Engenheiro de Software",
  "Arquiteto de Soluções",
  "Scrum Master",
  "Tech Lead",
];

const ProfessionalAssessmentStep: React.FC<StepProps> = ({ onNext, data }) => {
  const [newSkill, setNewSkill] = useState("");
  const [newRole, setNewRole] = useState("");
  const [showSuccessCheck, setShowSuccessCheck] = useState<string | null>(null);

  const form = useForm<AssessmentData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: data || {
      headline: "",
      years_experience: 0,
      skills: [],
      currentRole: "",
      currentCompany: "",
      yearsInRole: 0,
      keyAchievements: "",
      careerGoals: "",
      preferredRoles: [],
    },
  });

  const addSkill = (skill?: string) => {
    const skillToAdd = skill || newSkill;
    if (skillToAdd.trim()) {
      const currentSkills = form.getValues("skills") || [];
      form.setValue("skills", [...currentSkills, skillToAdd.trim()]);
      setNewSkill("");
      setShowSuccessCheck("skill");
      setTimeout(() => setShowSuccessCheck(null), 1000);
    }
  };

  const removeSkill = (index: number) => {
    const currentSkills = form.getValues("skills");
    form.setValue("skills", currentSkills.filter((_, i) => i !== index));
  };

  const addRole = () => {
    if (newRole.trim()) {
      const currentRoles = form.getValues("preferredRoles") || [];
      form.setValue("preferredRoles", [...currentRoles, newRole.trim()]);
      setNewRole("");
    }
  };

  const removeRole = (index: number) => {
    const currentRoles = form.getValues("preferredRoles");
    form.setValue("preferredRoles", currentRoles.filter((_, i) => i !== index));
  };

  const onSubmit = (formData: AssessmentData) => {
    onNext(formData);
  };

  const calculateProfessionalScore = (responses: AssessmentData): number => {
    let score = 0;
    
    // Score based on experience
    score += Math.min(responses.yearsInRole * 2, 20);
    
    // Score based on skills count
    score += Math.min(responses.skills.length * 2, 30);
    
    // Score based on achievements description length
    score += Math.min(responses.keyAchievements.length / 10, 25);
    
    // Score based on career goals clarity
    score += Math.min(responses.careerGoals.length / 10, 25);
    
    return Math.min(score, 100);
  };

  const watchedValues = form.watch();
  
  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Destaque sua Trajetória
          </h2>
          <p className="text-muted-foreground">
            Vamos encontrar as melhores oportunidades destacando sua experiência
          </p>
        </div>

        {/* Achievement Badge */}
        <AchievementBadge
          skillCount={watchedValues.skills?.length || 0}
          hasGoals={!!watchedValues.careerGoals && watchedValues.careerGoals.length >= 50}
          isComplete={
            !!watchedValues.headline &&
            !!watchedValues.years_experience &&
            (watchedValues.skills?.length || 0) >= 3 &&
            !!watchedValues.currentRole &&
            !!watchedValues.currentCompany &&
            !!watchedValues.keyAchievements &&
            !!watchedValues.careerGoals
          }
        />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Professional Profile */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>✨</span> Perfil Profissional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Como você se apresenta profissionalmente?</FormLabel>
                    <FormControl>
                      <AutocompleteInput
                        placeholder="Comece a digitar... (ex: Desenvolvedor, Designer)"
                        suggestions={PROFESSIONAL_TITLES}
                        onSelect={(value) => field.onChange(value)}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      💡 Dica: Seja específico e atrativo!
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="years_experience"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="text-base">Quantos anos de experiência você tem?</FormLabel>
                      <span className="text-2xl font-bold text-primary">{field.value || 0}</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={0}
                        max={30}
                        step={1}
                        value={[field.value || 0]}
                        onValueChange={(values) => field.onChange(values[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 anos</span>
                      <span>15 anos</span>
                      <span>30+ anos</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎯</span> Principais Habilidades
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Digite uma habilidade e pressione Enter..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={() => addSkill()} 
                  size="sm"
                  className="min-w-[60px]"
                >
                  {showSuccessCheck === "skill" ? (
                    <Check className="w-4 h-4 animate-in zoom-in-0" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Skill Suggestions */}
              <SkillSuggestions
                role={form.watch("headline") || ""}
                onAddSkill={addSkill}
                currentSkills={form.watch("skills") || []}
              />

              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {(form.watch("skills") || []).map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="gap-1 animate-in fade-in-0 zoom-in-95"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <FormField
                control={form.control}
                name="skills"
                render={() => (
                  <FormItem>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <p className="text-xs text-muted-foreground">
                💡 Adicione pelo menos 3 habilidades. Quanto mais, melhor!
              </p>
            </CardContent>
          </Card>

          {/* Current Position */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💼</span> Posição Atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cargo Atual</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Desenvolvedor Frontend" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empresa Atual</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Tech Company Ltd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="yearsInRole"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Anos neste Cargo</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏆</span> Principais Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="keyAchievements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Do que você mais se orgulha na sua carreira?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ex: Liderei o desenvolvimento de uma aplicação que aumentou a eficiência da equipe em 40%..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Career Goals */}
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🎯</span> Objetivos de Carreira
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="careerGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Onde você se vê daqui a alguns anos?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ex: Busco crescer como líder técnico, aprender novas tecnologias..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preferred Roles */}
              <div className="space-y-2">
                <Label className="text-base">Quais cargos você deseja?</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="ex: Senior Developer, Tech Lead..."
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRole())}
                  />
                  <Button type="button" onClick={addRole} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(form.watch("preferredRoles") || []).map((role, index) => (
                    <Badge key={index} variant="outline" className="gap-1">
                      {role}
                      <button
                        type="button"
                        onClick={() => removeRole(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="preferredRoles"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              size="lg"
              className="min-w-[160px] bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            >
              {form.formState.isSubmitting ? "Salvando..." : "Continuar Jornada"}
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </form>
      </Form>
      </div>

      {/* Profile Preview Sidebar */}
      <div className="hidden lg:block">
        <ProfilePreview
          headline={watchedValues.headline}
          yearsExperience={watchedValues.years_experience}
          skills={watchedValues.skills}
          currentRole={watchedValues.currentRole}
          currentCompany={watchedValues.currentCompany}
        />
      </div>
    </div>
  );
};

export default ProfessionalAssessmentStep;