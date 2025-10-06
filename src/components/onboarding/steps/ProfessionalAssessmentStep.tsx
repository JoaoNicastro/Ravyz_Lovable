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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronRight, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

const ProfessionalAssessmentStep: React.FC<StepProps> = ({ onNext, data }) => {
  const [newSkill, setNewSkill] = useState("");
  const [newRole, setNewRole] = useState("");

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

  const addSkill = () => {
    if (newSkill.trim()) {
      const currentSkills = form.getValues("skills");
      form.setValue("skills", [...currentSkills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    const currentSkills = form.getValues("skills");
    form.setValue("skills", currentSkills.filter((_, i) => i !== index));
  };

  const addRole = () => {
    if (newRole.trim()) {
      const currentRoles = form.getValues("preferredRoles");
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Conte sobre sua experiência profissional
        </h2>
        <p className="text-muted-foreground">
          Essas informações nos ajudam a encontrar oportunidades alinhadas com seu perfil
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Professional Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Perfil Profissional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título Profissional *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Desenvolvedor Full Stack | Designer UI/UX | Gerente de Marketing" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">Como você se apresentaria em uma frase? Seja específico e atrativo.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="years_experience"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel>Anos de Experiência Total</FormLabel>
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

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Principais Habilidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="ex: React, Python, Project Management..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(form.watch("skills") || []).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="ml-1 hover:text-destructive"
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
            </CardContent>
          </Card>

          {/* Current Position */}
          <Card>
            <CardHeader>
              <CardTitle>Posição Atual</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle>Principais Conquistas</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="keyAchievements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descreva suas principais conquistas profissionais</FormLabel>
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
          <Card>
            <CardHeader>
              <CardTitle>Objetivos de Carreira</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="careerGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quais são seus objetivos profissionais?</FormLabel>
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
                <Label>Cargos de Interesse</Label>
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
              className="min-w-[140px]"
            >
              {form.formState.isSubmitting ? "Salvando..." : "Continuar"}
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProfessionalAssessmentStep;