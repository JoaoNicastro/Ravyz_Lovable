import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ReusableFormField } from "./FormField";
import { ArrowRight, ArrowLeft, Upload, X, Plus, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { parseResumeEnhanced, type ParsedResumeData } from "@/lib/enhanced-resume-parser";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const candidateProfileSchema = z.object({
  // Basic info fields
  date_of_birth: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  // Address fields
  address_zipcode: z.string().optional(),
  address_street: z.string().optional(),
  address_number: z.string().optional(),
  address_complement: z.string().optional(),
  address_neighborhood: z.string().optional(),
  address_city: z.string().optional(),
  address_state: z.string().optional(),
  // Profile fields
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")),
  headline: z.string().min(5, "Título deve ter pelo menos 5 caracteres").max(200, "Título muito longo"),
  years_experience: z.number().min(0, "Experiência não pode ser negativa").max(50, "Experiência muito alta"),
  skills: z.array(z.string()).min(1, "Adicione pelo menos uma habilidade"),
});

type CandidateProfileFormData = z.infer<typeof candidateProfileSchema>;

interface CandidateProfileFormProps {
  onSubmit: (data: CandidateProfileFormData) => void | Promise<void>;
  initialData?: Partial<CandidateProfileFormData>;
}

export function CandidateProfileForm({ onSubmit, initialData }: CandidateProfileFormProps) {
  const [newSkill, setNewSkill] = useState("");
  const [isParsingResume, setIsParsingResume] = useState(false);
  
  const form = useForm<CandidateProfileFormData>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: {
      date_of_birth: initialData?.date_of_birth || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      address_zipcode: initialData?.address_zipcode || "",
      address_street: initialData?.address_street || "",
      address_number: initialData?.address_number || "",
      address_complement: initialData?.address_complement || "",
      address_neighborhood: initialData?.address_neighborhood || "",
      address_city: initialData?.address_city || "",
      address_state: initialData?.address_state || "",
      avatar_url: initialData?.avatar_url || "",
      headline: initialData?.headline || "",
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

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione apenas arquivos PDF');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB permitido');
      return;
    }

    setIsParsingResume(true);
    
    try {
      const parsedData = await parseResumeEnhanced(file);
      console.log('Parsed resume data for form:', parsedData);
      
      // Fill form with parsed data
      if (parsedData.email) {
        form.setValue('email', parsedData.email);
      }
      if (parsedData.phone) {
        form.setValue('phone', parsedData.phone);
      }
      if (parsedData.date_of_birth) {
        form.setValue('date_of_birth', parsedData.date_of_birth);
      }

      toast.success('Currículo analisado com sucesso! Dados preenchidos automaticamente.');
    } catch (error) {
      console.error('Error parsing resume:', error);
      toast.error('Erro ao analisar o currículo. Tente novamente.');
    } finally {
      setIsParsingResume(false);
      // Clear the input
      event.target.value = '';
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Resume Upload Section */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Currículo (Opcional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Faça upload do seu currículo em PDF para preenchimento automático inteligente dos dados
              </p>
              
              <div className="flex items-center gap-4">
                <Label htmlFor="resume-upload" className="cursor-pointer">
                  <Button variant="outline" asChild disabled={isParsingResume}>
                    <span className="flex items-center gap-2">
                      {isParsingResume ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {isParsingResume ? 'Analisando com IA...' : 'Selecionar PDF'}
                    </span>
                  </Button>
                </Label>
                
                <Input
                  id="resume-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="hidden"
                  disabled={isParsingResume}
                />
                
                <span className="text-xs text-muted-foreground">
                  Máximo 10MB • Análise inteligente de currículo
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dados Pessoais</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReusableFormField
              control={form.control}
              name="date_of_birth"
              label="Data de nascimento"
            >
              <Input type="date" />
            </ReusableFormField>

            <ReusableFormField
              control={form.control}
              name="email"
              label="E-mail"
            >
              <Input type="email" placeholder="seu@email.com" />
            </ReusableFormField>
          </div>

          <ReusableFormField
            control={form.control}
            name="phone"
            label="Telefone"
          >
            <Input placeholder="(xx) xxxxx-xxxx" />
          </ReusableFormField>
        </div>

        {/* Address Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Endereço</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReusableFormField
              control={form.control}
              name="address_zipcode"
              label="CEP"
            >
              <Input placeholder="00000-000" />
            </ReusableFormField>

            <div className="md:col-span-2">
              <ReusableFormField
                control={form.control}
                name="address_street"
                label="Rua"
              >
                <Input placeholder="Nome da rua" />
              </ReusableFormField>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReusableFormField
              control={form.control}
              name="address_number"
              label="Número"
            >
              <Input placeholder="123" />
            </ReusableFormField>

            <div className="md:col-span-2">
              <ReusableFormField
                control={form.control}
                name="address_complement"
                label="Complemento"
              >
                <Input placeholder="Apto, bloco, etc. (opcional)" />
              </ReusableFormField>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReusableFormField
              control={form.control}
              name="address_neighborhood"
              label="Bairro"
            >
              <Input placeholder="Nome do bairro" />
            </ReusableFormField>

            <ReusableFormField
              control={form.control}
              name="address_city"
              label="Cidade"
            >
              <Input placeholder="Nome da cidade" />
            </ReusableFormField>

            <ReusableFormField
              control={form.control}
              name="address_state"
              label="Estado"
            >
              <Input placeholder="UF" maxLength={2} />
            </ReusableFormField>
          </div>
        </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Perfil Profissional</h3>
          
          {/* Headline */}
          <ReusableFormField
            control={form.control}
            name="headline"
            label="Título Profissional *"
            description="Como você se apresentaria em uma frase? Seja específico e atrativo."
          >
            <Input placeholder="Ex: Desenvolvedor Full Stack | Designer UI/UX | Gerente de Marketing" />
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
        </div>

        {/* Navigation */}
        <div className="flex justify-end pt-6">
          <Button 
            type="submit" 
            disabled={form.formState.isSubmitting}
            size="lg"
            className="min-w-[140px]"
          >
            {form.formState.isSubmitting ? "Salvando..." : "Continuar"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}