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
import { ArrowRight, ArrowLeft, X, Plus, Calendar as CalendarIcon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const candidateProfileSchema = z.object({
  // Basic info fields
  date_of_birth: z.date({
    required_error: "Data de nascimento é obrigatória",
    invalid_type_error: "Data inválida",
  })
    .refine((date) => {
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()) 
        ? age - 1 
        : age;
      return actualAge >= 16;
    }, "Você deve ter pelo menos 16 anos")
    .refine((date) => {
      const today = new Date();
      return date < today;
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
      date_of_birth: initialData?.date_of_birth ? new Date(initialData.date_of_birth) : undefined,
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              {(field) => {
                const [inputValue, setInputValue] = React.useState(
                  field.value ? format(field.value, "dd/MM/yyyy") : ""
                );

                const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value;
                  setInputValue(value);
                  
                  // Parse DD/MM/YYYY format
                  if (value.length === 10) {
                    const [day, month, year] = value.split('/').map(Number);
                    if (day && month && year) {
                      const date = new Date(year, month - 1, day);
                      if (!isNaN(date.getTime())) {
                        field.onChange(date);
                      }
                    }
                  }
                };

                React.useEffect(() => {
                  if (field.value) {
                    setInputValue(format(field.value, "dd/MM/yyyy"));
                  }
                }, [field.value]);

                return (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <MaskedInput
                        mask="99/99/9999"
                        placeholder="DD/MM/AAAA"
                        value={inputValue}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            if (date) {
                              setInputValue(format(date, "dd/MM/yyyy"));
                            }
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          defaultMonth={field.value || new Date(2000, 0)}
                          locale={ptBR}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                );
              }}
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