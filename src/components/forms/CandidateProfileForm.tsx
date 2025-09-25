import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReusableFormField } from "./FormField";
import { ArrowRight, ArrowLeft, Upload, X, Plus } from "lucide-react";
import { useState } from "react";

const candidateProfileSchema = z.object({
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
  headline: z.string().min(5, "Título deve ter pelo menos 5 caracteres").max(200, "Título muito longo"),
  location: z.string().max(100, "Localização muito longa").optional(),
  years_experience: z.number().min(0, "Experiência não pode ser negativa").max(50, "Experiência muito alta"),
  skills: z.array(z.string()).min(1, "Adicione pelo menos uma habilidade"),
});

type CandidateProfileFormData = z.infer<typeof candidateProfileSchema>;

interface CandidateProfileFormProps {
  onSubmit: (data: CandidateProfileFormData) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
  initialData?: Partial<CandidateProfileFormData>;
}

export function CandidateProfileForm({ onSubmit, onBack, isLoading, initialData }: CandidateProfileFormProps) {
  const [newSkill, setNewSkill] = useState("");
  
  const form = useForm<CandidateProfileFormData>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: {
      avatar_url: initialData?.avatar_url || "",
      headline: initialData?.headline || "",
      location: initialData?.location || "",
      years_experience: initialData?.years_experience || 0,
      skills: initialData?.skills || [],
    }
  });

  const skills = form.watch("skills");

  const handleSkillAdd = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      form.setValue("skills", [...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    form.setValue("skills", skills.filter(skill => skill !== skillToRemove));
  };

  const suggestedSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'SQL',
    'Git', 'AWS', 'Docker', 'Figma', 'Photoshop', 'Marketing Digital',
    'Vendas', 'Gestão de Projetos', 'Liderança', 'Comunicação'
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Foto do Perfil</label>
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={form.watch("avatar_url")} />
              <AvatarFallback>
                <Upload className="h-6 w-6 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2 flex-1">
              <ReusableFormField
                control={form.control}
                name="avatar_url"
                description="Cole a URL de uma foto ou deixe em branco por agora"
              >
                <Input placeholder="URL da foto (opcional)" />
              </ReusableFormField>
            </div>
          </div>
        </div>

        {/* Headline */}
        <ReusableFormField
          control={form.control}
          name="headline"
          label="Título Profissional *"
          description="Como você se apresentaria em uma frase? Seja específico e atrativo."
        >
          <Input placeholder="Ex: Desenvolvedor Full Stack | Designer UI/UX | Gerente de Marketing" />
        </ReusableFormField>

        {/* Location */}
        <ReusableFormField
          control={form.control}
          name="location"
          label="Localização"
        >
          <Input placeholder="Ex: São Paulo, SP | Rio de Janeiro, RJ | Remoto" />
        </ReusableFormField>

        {/* Years of Experience */}
        <ReusableFormField
          control={form.control}
          name="years_experience"
          label="Anos de Experiência"
        >
          {(field) => (
            <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseInt(value))}>
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
          )}
        </ReusableFormField>

        {/* Skills */}
        <div className="space-y-4">
          <label className="text-sm font-medium">Principais Habilidades</label>
          
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
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
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
                .filter(skill => !skills.includes(skill))
                .slice(0, 8)
                .map((skill) => (
                  <Button
                    key={skill}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue("skills", [...skills, skill])}
                  >
                    {skill}
                  </Button>
                ))}
            </div>
          </div>
          
          {form.formState.errors.skills && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.skills.message}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Continuar"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}