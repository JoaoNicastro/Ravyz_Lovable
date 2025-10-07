import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Form } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ReusableFormField } from "./FormField";
import { ArrowRight, ArrowLeft, Upload, X, Plus, FileText, Loader2, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { parseResumeEnhanced, type ParsedResumeData } from "@/lib/enhanced-resume-parser";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/AvatarUpload";

const candidateProfileSchema = z.object({
  // Basic info fields
  date_of_birth: z.string()
    .min(1, "Data de nascimento é obrigatória")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) 
        ? age - 1 
        : age;
      return actualAge >= 16;
    }, "Você deve ter pelo menos 16 anos")
    .refine((date) => {
      const birthDate = new Date(date);
      const today = new Date();
      return birthDate < today;
    }, "Data de nascimento não pode ser no futuro"),
  phone: z.string()
    .min(14, "Telefone incompleto")
    .regex(/^\(\d{2}\)\s\d{5}-\d{4}$/, "Formato de telefone inválido"),
  cpf: z.string()
    .min(14, "CPF incompleto")
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato de CPF inválido"),
  gender: z.string().optional(),
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
  // Languages
  languages: z.array(z.object({
    language: z.string(),
    level: z.string(),
  })).default([]),
  // Education
  education: z.array(z.object({
    degree: z.string(),
    field: z.string(),
    institution: z.string(),
    status: z.string(),
    completionYear: z.number().optional(),
  })).default([]),
});

type CandidateProfileFormData = z.infer<typeof candidateProfileSchema>;

interface CandidateProfileFormProps {
  onSubmit: (data: CandidateProfileFormData) => void | Promise<void>;
  initialData?: Partial<CandidateProfileFormData>;
}

export function CandidateProfileForm({ onSubmit, initialData }: CandidateProfileFormProps) {
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [newLanguage, setNewLanguage] = useState({ language: "", level: "" });
  const [newEducation, setNewEducation] = useState({
    degree: "",
    field: "",
    institution: "",
    status: "",
    completionYear: undefined as number | undefined,
  });
  const [avatarUrl, setAvatarUrl] = useState(initialData?.avatar_url || '');
  
  const form = useForm<CandidateProfileFormData>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: {
      date_of_birth: initialData?.date_of_birth || "",
      phone: initialData?.phone || "",
      cpf: initialData?.cpf || "",
      gender: initialData?.gender || "",
      address_zipcode: initialData?.address_zipcode || "",
      address_street: initialData?.address_street || "",
      address_number: initialData?.address_number || "",
      address_complement: initialData?.address_complement || "",
      address_neighborhood: initialData?.address_neighborhood || "",
      address_city: initialData?.address_city || "",
      address_state: initialData?.address_state || "",
      avatar_url: initialData?.avatar_url || "",
      languages: initialData?.languages || [],
      education: initialData?.education || [],
    }
  });

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

        {/* Avatar Upload Section */}
        <Card>
          <CardContent className="pt-6">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              onAvatarChange={setAvatarUrl}
              userName={form.watch('cpf') || 'Usuário'}
            />
          </CardContent>
        </Card>

        {/* Basic Information Fields */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dados Pessoais</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReusableFormField
              control={form.control}
              name="date_of_birth"
              label="Data de nascimento *"
              description="Você deve ter pelo menos 16 anos"
            >
              {(field) => (
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input 
                    type="date" 
                    className="pl-10"
                    max={new Date().toISOString().split('T')[0]}
                    min={new Date(new Date().setFullYear(new Date().getFullYear() - 100)).toISOString().split('T')[0]}
                    {...field}
                  />
                </div>
              )}
            </ReusableFormField>

            <ReusableFormField
              control={form.control}
              name="phone"
              label="Telefone *"
            >
              {(field) => (
                <MaskedInput 
                  mask="(99) 99999-9999" 
                  placeholder="(00) 00000-0000"
                  {...field}
                />
              )}
            </ReusableFormField>

            <ReusableFormField
              control={form.control}
              name="cpf"
              label="CPF *"
            >
              {(field) => (
                <MaskedInput 
                  mask="999.999.999-99" 
                  placeholder="000.000.000-00"
                  {...field}
                />
              )}
            </ReusableFormField>

            <ReusableFormField
              control={form.control}
              name="gender"
              label="Gênero (opcional)"
            >
              {(field) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                    <SelectItem value="nao-binario">Não-binário</SelectItem>
                    <SelectItem value="prefiro-nao-dizer">Prefiro não informar</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </ReusableFormField>
          </div>
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
              {(field) => (
                <MaskedInput 
                  mask="99999-999" 
                  placeholder="00000-000"
                  {...field}
                />
              )}
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


        {/* Languages Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Idiomas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label>Idioma</Label>
              <Input
                placeholder="Ex: Inglês, Espanhol..."
                value={newLanguage.language}
                onChange={(e) => setNewLanguage({ ...newLanguage, language: e.target.value })}
              />
            </div>
            <div>
              <Label>Nível</Label>
              <div className="flex gap-2">
                <Select
                  value={newLanguage.level}
                  onValueChange={(value) => setNewLanguage({ ...newLanguage, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                    <SelectItem value="fluente">Fluente</SelectItem>
                    <SelectItem value="nativo">Nativo</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => {
                    if (newLanguage.language && newLanguage.level) {
                      form.setValue("languages", [...form.watch("languages"), newLanguage]);
                      setNewLanguage({ language: "", level: "" });
                    }
                  }}
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {form.watch("languages").length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.watch("languages").map((lang, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-2">
                  {lang.language} - {lang.level}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={() => {
                      const languages = form.watch("languages");
                      form.setValue("languages", languages.filter((_, i) => i !== index));
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Education Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Formação Acadêmica</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nível de Escolaridade</Label>
              <Select
                value={newEducation.degree}
                onValueChange={(value) => setNewEducation({ ...newEducation, degree: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ensino-medio">Ensino Médio</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="graduacao">Graduação</SelectItem>
                  <SelectItem value="pos-graduacao">Pós-graduação</SelectItem>
                  <SelectItem value="mestrado">Mestrado</SelectItem>
                  <SelectItem value="doutorado">Doutorado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Curso/Área</Label>
              <Input
                placeholder="Ex: Ciência da Computação"
                value={newEducation.field}
                onChange={(e) => setNewEducation({ ...newEducation, field: e.target.value })}
              />
            </div>

            <div>
              <Label>Instituição</Label>
              <Input
                placeholder="Nome da instituição"
                value={newEducation.institution}
                onChange={(e) => setNewEducation({ ...newEducation, institution: e.target.value })}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={newEducation.status}
                onValueChange={(value) => setNewEducation({ ...newEducation, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cursando">Cursando</SelectItem>
                  <SelectItem value="trancado">Trancado</SelectItem>
                  <SelectItem value="incompleto">Incompleto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ano de Conclusão (opcional)</Label>
              <Input
                type="number"
                placeholder="2024"
                min="1950"
                max="2030"
                value={newEducation.completionYear || ""}
                onChange={(e) => setNewEducation({ 
                  ...newEducation, 
                  completionYear: e.target.value ? parseInt(e.target.value) : undefined 
                })}
              />
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => {
                  if (newEducation.degree && newEducation.field && newEducation.institution && newEducation.status) {
                    form.setValue("education", [...form.watch("education"), newEducation]);
                    setNewEducation({
                      degree: "",
                      field: "",
                      institution: "",
                      status: "",
                      completionYear: undefined,
                    });
                  }
                }}
                size="sm"
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Formação
              </Button>
            </div>
          </div>

          {form.watch("education").length > 0 && (
            <div className="space-y-2">
              {form.watch("education").map((edu, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{edu.degree}</h4>
                        <p className="text-sm text-muted-foreground">{edu.field}</p>
                        <p className="text-sm text-muted-foreground">{edu.institution}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{edu.status}</Badge>
                          {edu.completionYear && (
                            <Badge variant="outline" className="text-xs">{edu.completionYear}</Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const education = form.watch("education");
                          form.setValue("education", education.filter((_, i) => i !== index));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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