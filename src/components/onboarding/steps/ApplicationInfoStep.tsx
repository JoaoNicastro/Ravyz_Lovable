import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2, Plus, X } from "lucide-react";
import { parseResumeEnhanced, type ParsedResumeData } from "@/lib/enhanced-resume-parser";
import { toast } from "sonner";

const applicationInfoSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório"),
  date_of_birth: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  professional_summary: z.string().optional(),
  work_experience: z.array(z.object({
    company: z.string(),
    title: z.string(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    current: z.boolean().optional(),
    description: z.string().optional(),
  })).optional(),
  education: z.array(z.object({
    institution: z.string(),
    major: z.string(),
    gpa: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
  })).optional(),
  hard_skills: z.array(z.string()).optional(),
  
  languages: z.array(z.object({
    name: z.string(),
    proficiency: z.string().optional(),
  })).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string().optional(),
    issue_date: z.string().optional(),
  })).optional(),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string().optional(),
    link: z.string().optional(),
  })).optional(),
  years_of_experience: z.number().optional(),
  seniority: z.string().optional(),
  linkedin_url: z.string().optional(),
  github_url: z.string().optional(),
  portfolio_url: z.string().optional(),
});

type ApplicationInfoData = z.infer<typeof applicationInfoSchema>;

interface StepProps {
  onNext: (data: ApplicationInfoData) => void;
  onBack: () => void;
  isLoading?: boolean;
  data?: ApplicationInfoData;
}

const ApplicationInfoStep: React.FC<StepProps> = ({ onNext, onBack, isLoading = false, data }) => {
  const [isParsingResume, setIsParsingResume] = useState(false);
  
  const form = useForm<ApplicationInfoData>({
    resolver: zodResolver(applicationInfoSchema),
    defaultValues: data || {
      full_name: "",
      work_experience: [],
      education: [],
      hard_skills: [],
      languages: [],
      certifications: [],
      projects: []
    },
  });
  
  // Field Arrays for grouped editable cards
  const { fields: expFields, append: appendExperienceFA, remove: removeExperienceFA, replace: replaceExperienceFA } = useFieldArray({
    control: form.control,
    name: 'work_experience',
  });
  const { fields: projectFields, append: appendProjectFA, remove: removeProjectFA, replace: replaceProjectFA } = useFieldArray({
    control: form.control,
    name: 'projects',
  });
  
  const submit = (values: ApplicationInfoData) => {
    onNext(values);
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Por favor, selecione apenas arquivos PDF');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB permitido');
      return;
    }

    setIsParsingResume(true);
    
    try {
      const parsedData = await parseResumeEnhanced(file);
      
      // Fill form with all parsed data
      if (parsedData.full_name) form.setValue('full_name', parsedData.full_name);
      if (parsedData.email) form.setValue('email', parsedData.email);
      if (parsedData.phone) form.setValue('phone', parsedData.phone);
      if (parsedData.location) form.setValue('location', parsedData.location);
      if (parsedData.professional_summary) form.setValue('professional_summary', parsedData.professional_summary);
      if (parsedData.years_of_experience) form.setValue('years_of_experience', parsedData.years_of_experience);
      if (parsedData.seniority) form.setValue('seniority', parsedData.seniority);
      if (parsedData.linkedin_url) form.setValue('linkedin_url', parsedData.linkedin_url);
      if (parsedData.github_url) form.setValue('github_url', parsedData.github_url);
      if (parsedData.portfolio_url) form.setValue('portfolio_url', parsedData.portfolio_url);
      
      if (parsedData.date_of_birth) {
        const date = new Date(parsedData.date_of_birth);
        if (!isNaN(date.getTime())) {
          form.setValue('date_of_birth', date.toISOString().split('T')[0]);
        }
      }
      
      if (parsedData.work_experience) replaceExperienceFA(parsedData.work_experience as any);
      if (parsedData.education) form.setValue('education', parsedData.education);
      if (parsedData.hard_skills) form.setValue('hard_skills', parsedData.hard_skills);
      if (parsedData.languages) form.setValue('languages', parsedData.languages);
      if (parsedData.certifications) form.setValue('certifications', parsedData.certifications);
      if (parsedData.projects) replaceProjectFA(parsedData.projects as any);

      toast.success('Currículo analisado com sucesso! Revise e complete os dados abaixo.');
    } catch (error) {
      console.error('Error parsing resume:', error);
      toast.error('Erro ao analisar o currículo. Tente novamente.');
    } finally {
      setIsParsingResume(false);
      event.target.value = '';
    }
  };

  const education = form.watch('education') || [];
  const hardSkills = form.watch('hard_skills') || [];
  const languages = form.watch('languages') || [];
  const certifications = form.watch('certifications') || [];

  // State for manual input fields (only for sections not using field arrays)
  const [newEducation, setNewEducation] = useState({ institution: '', major: '', gpa: '', start_date: '', end_date: '' });
  const [newHardSkill, setNewHardSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState({ name: '', proficiency: '' });
  const [newCertification, setNewCertification] = useState({ name: '', issuer: '', issue_date: '' });

  // Experience handlers using Field Array
  const addExperience = () => {
    appendExperienceFA({ company: '', title: '', start_date: '', end_date: '', current: false, description: '' });
    toast.success('Experiência adicionada');
  };

  const removeExperience = (idx: number) => {
    removeExperienceFA(idx);
    toast.success('Experiência removida');
  };

  const addEducation = () => {
    if (newEducation.institution && newEducation.major) {
      form.setValue('education', [...education, newEducation]);
      setNewEducation({ institution: '', major: '', gpa: '', start_date: '', end_date: '' });
      toast.success('Formação adicionada');
    } else {
      toast.error('Preencha instituição e curso');
    }
  };

  const removeEducation = (idx: number) => {
    form.setValue('education', education.filter((_, i) => i !== idx));
    toast.success('Formação removida');
  };

  const addHardSkill = () => {
    if (newHardSkill.trim()) {
      form.setValue('hard_skills', [...hardSkills, newHardSkill.trim()]);
      setNewHardSkill('');
      toast.success('Habilidade técnica adicionada');
    }
  };

  const removeHardSkill = (idx: number) => {
    form.setValue('hard_skills', hardSkills.filter((_, i) => i !== idx));
  };

  const addLanguage = () => {
    if (newLanguage.name) {
      form.setValue('languages', [...languages, newLanguage]);
      setNewLanguage({ name: '', proficiency: '' });
      toast.success('Idioma adicionado');
    } else {
      toast.error('Preencha o nome do idioma');
    }
  };

  const removeLanguage = (idx: number) => {
    form.setValue('languages', languages.filter((_, i) => i !== idx));
    toast.success('Idioma removido');
  };

  const addCertification = () => {
    if (newCertification.name) {
      form.setValue('certifications', [...certifications, newCertification]);
      setNewCertification({ name: '', issuer: '', issue_date: '' });
      toast.success('Certificação adicionada');
    } else {
      toast.error('Preencha o nome da certificação');
    }
  };

  const removeCertification = (idx: number) => {
    form.setValue('certifications', certifications.filter((_, i) => i !== idx));
    toast.success('Certificação removida');
  };

  const addProject = () => {
    appendProjectFA({ name: '', description: '', link: '' });
    toast.success('Projeto adicionado');
  };

  const removeProject = (idx: number) => {
    removeProjectFA(idx);
    toast.success('Projeto removido');
  };
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Informações para Candidatura</h2>
        <p className="text-muted-foreground">Faça upload do seu currículo para preencher automaticamente ou preencha manualmente os campos abaixo</p>
      </div>

      {/* Resume Upload */}
      <Card className="border-dashed border-2 bg-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />
            Upload de Currículo (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="resume-upload" className="cursor-pointer">
              <Button variant="outline" asChild disabled={isParsingResume}>
                <span className="flex items-center gap-2">
                  {isParsingResume ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {isParsingResume ? 'Analisando...' : 'Selecionar PDF'}
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
            <span className="text-xs text-muted-foreground">Máximo 10MB • Apenas PDF</span>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={form.handleSubmit(submit)} className="space-y-6">
        {/* Personal Info */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome completo *</Label>
              <Input id="full_name" {...form.register('full_name')} placeholder="Seu nome completo" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...form.register('email')} placeholder="seu@email.com" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" {...form.register('phone')} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_of_birth">Data de nascimento</Label>
                <Input id="date_of_birth" type="date" {...form.register('date_of_birth')} />
              </div>
              <div>
                <Label htmlFor="location">Localização</Label>
                <Input id="location" {...form.register('location')} placeholder="Cidade, Estado/País" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo Profissional</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="professional_summary">Sobre você (breve resumo)</Label>
            <Input 
              id="professional_summary" 
              {...form.register('professional_summary')} 
              placeholder="Ex: Desenvolvedor Full Stack com 5 anos de experiência..." 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Experience & Seniority */}
        <Card>
          <CardHeader>
            <CardTitle>Experiência Profissional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="years_of_experience">Anos de experiência</Label>
                <Input 
                  id="years_of_experience" 
                  type="number" 
                  {...form.register('years_of_experience', { valueAsNumber: true })} 
                  placeholder="Ex: 5"
                />
              </div>
              <div>
                <Label htmlFor="seniority">Nível</Label>
                <Input 
                  id="seniority" 
                  {...form.register('seniority')} 
                  placeholder="Ex: Junior, Pleno, Sênior"
                />
              </div>
            </div>

            {/* Experience Items */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Experiências</Label>
                <Button type="button" size="sm" onClick={addExperience}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Experiência
                </Button>
              </div>

              {expFields.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhuma experiência adicionada ainda.</p>
              )}

              <div className="space-y-3">
                {expFields.map((field, idx) => {
                  const isCurrent = form.watch(`work_experience.${idx}.current`);
                  return (
                    <Card key={field.id} className="p-4 bg-muted/30 relative group">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => removeExperience(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <div className="space-y-3 pr-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`exp-company-${idx}`} className="text-xs text-muted-foreground">Empresa</Label>
                            <Input id={`exp-company-${idx}`} placeholder="Nome da Empresa" {...form.register(`work_experience.${idx}.company` as const)} />
                          </div>
                          <div>
                            <Label htmlFor={`exp-title-${idx}`} className="text-xs text-muted-foreground">Cargo</Label>
                            <Input id={`exp-title-${idx}`} placeholder="Cargo" {...form.register(`work_experience.${idx}.title` as const)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`exp-start-${idx}`} className="text-xs text-muted-foreground">Data de início</Label>
                            <Input id={`exp-start-${idx}`} type="date" {...form.register(`work_experience.${idx}.start_date` as const)} />
                          </div>
                          <div>
                            <Label htmlFor={`exp-end-${idx}`} className="text-xs text-muted-foreground">Data de fim</Label>
                            <Input id={`exp-end-${idx}`} type="date" disabled={!!isCurrent} {...form.register(`work_experience.${idx}.end_date` as const)} />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`exp-current-${idx}`}
                            className="h-4 w-4 rounded border-input"
                            {...form.register(`work_experience.${idx}.current` as const)}
                          />
                          <Label htmlFor={`exp-current-${idx}`} className="text-sm font-normal cursor-pointer">
                            Este é meu emprego atual
                          </Label>
                        </div>
                        <div>
                          <Label htmlFor={`exp-desc-${idx}`} className="text-xs text-muted-foreground">Descrição das responsabilidades e conquistas</Label>
                          <Textarea id={`exp-desc-${idx}`} rows={3} placeholder="Descreva suas principais responsabilidades, conquistas e projetos..." {...form.register(`work_experience.${idx}.description` as const)} />
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Education */}
        <Card>
          <CardHeader>
            <CardTitle>Formação Acadêmica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual Education Entry */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Adicionar Formação</Label>
              <Card className="p-4 bg-muted/30">
                <div className="space-y-3">
                  <Input 
                    placeholder="Instituição *" 
                    value={newEducation.institution}
                    onChange={(e) => setNewEducation({...newEducation, institution: e.target.value})}
                  />
                  <Input 
                    placeholder="Curso *" 
                    value={newEducation.major}
                    onChange={(e) => setNewEducation({...newEducation, major: e.target.value})}
                  />
                  <Input 
                    placeholder="GPA (opcional)" 
                    value={newEducation.gpa}
                    onChange={(e) => setNewEducation({...newEducation, gpa: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edu-start-date" className="text-xs text-muted-foreground">Data de início</Label>
                      <Input 
                        id="edu-start-date"
                        type="date"
                        value={newEducation.start_date}
                        onChange={(e) => setNewEducation({...newEducation, start_date: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edu-end-date" className="text-xs text-muted-foreground">Data de fim</Label>
                      <Input 
                        id="edu-end-date"
                        type="date"
                        value={newEducation.end_date}
                        onChange={(e) => setNewEducation({...newEducation, end_date: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={addEducation} size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Formação
                  </Button>
                </div>
              </Card>
            </div>

            {education.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-medium">Suas Formações:</Label>
                {education.map((edu, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-muted/30 relative group">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => removeEducation(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="font-medium">{edu.major}</p>
                    <p className="text-sm text-muted-foreground">{edu.institution}</p>
                    {edu.gpa && <p className="text-sm text-muted-foreground">GPA: {edu.gpa}</p>}
                    {edu.start_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {edu.start_date} - {edu.end_date || 'Presente'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Habilidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hard Skills */}
            <div>
              <Label className="text-sm font-medium">Hard Skills (Técnicas)</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  placeholder="Ex: React, Python, SQL..."
                  value={newHardSkill}
                  onChange={(e) => setNewHardSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHardSkill())}
                />
                <Button type="button" onClick={addHardSkill} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {hardSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg bg-muted/30">
                  {hardSkills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => removeHardSkill(idx)}>
                      {skill}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Languages */}
        <Card>
          <CardHeader>
            <CardTitle>Idiomas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual Language Entry */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Adicionar Idioma</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Idioma *" 
                  value={newLanguage.name}
                  onChange={(e) => setNewLanguage({...newLanguage, name: e.target.value})}
                  className="flex-1"
                />
                <Input 
                  placeholder="Nível (Ex: Fluente)" 
                  value={newLanguage.proficiency}
                  onChange={(e) => setNewLanguage({...newLanguage, proficiency: e.target.value})}
                  className="flex-1"
                />
                <Button type="button" onClick={addLanguage} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {languages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t">
                {languages.map((lang, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-muted/30 relative group">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => removeLanguage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    <p className="font-medium text-sm">{lang.name}</p>
                    {lang.proficiency && <p className="text-xs text-muted-foreground">{lang.proficiency}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle>Certificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Manual Certification Entry */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Adicionar Certificação</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input 
                  placeholder="Nome da certificação *" 
                  value={newCertification.name}
                  onChange={(e) => setNewCertification({...newCertification, name: e.target.value})}
                />
                <Input 
                  placeholder="Organização emissora" 
                  value={newCertification.issuer}
                  onChange={(e) => setNewCertification({...newCertification, issuer: e.target.value})}
                />
                <Input 
                  type="date"
                  placeholder="Data de emissão"
                  value={newCertification.issue_date}
                  onChange={(e) => setNewCertification({...newCertification, issue_date: e.target.value})}
                />
              </div>
              <Button type="button" onClick={addCertification} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Certificação
              </Button>
            </div>

            {certifications.length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="p-3 border rounded-lg bg-muted/30 relative group">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => removeCertification(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="font-medium text-sm">{cert.name}</p>
                    {cert.issuer && <p className="text-xs text-muted-foreground">{cert.issuer}</p>}
                    {cert.issue_date && <p className="text-xs text-muted-foreground">Emitido em: {cert.issue_date}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projetos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Project Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">Projetos</Label>
                <Button type="button" size="sm" onClick={addProject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Projeto
                </Button>
              </div>

              {projectFields.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum projeto adicionado ainda.</p>
              )}

              <div className="space-y-3">
                {projectFields.map((field, idx) => (
                  <Card key={field.id} className="p-4 bg-muted/30 relative group">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={() => removeProject(idx)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <div className="space-y-3 pr-8">
                      <div>
                        <Label htmlFor={`project-name-${idx}`} className="text-xs text-muted-foreground">Nome do Projeto</Label>
                        <Input id={`project-name-${idx}`} placeholder="Nome do projeto" {...form.register(`projects.${idx}.name` as const)} />
                      </div>
                      <div>
                        <Label htmlFor={`project-desc-${idx}`} className="text-xs text-muted-foreground">Descrição</Label>
                        <Textarea id={`project-desc-${idx}`} rows={3} placeholder="Descreva o projeto, tecnologias usadas, resultados..." {...form.register(`projects.${idx}.description` as const)} />
                      </div>
                      <div>
                        <Label htmlFor={`project-link-${idx}`} className="text-xs text-muted-foreground">Link (opcional)</Label>
                        <Input id={`project-link-${idx}`} placeholder="GitHub, site, demo, etc." {...form.register(`projects.${idx}.link` as const)} />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle>Links Profissionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input 
                id="linkedin_url" 
                {...form.register('linkedin_url')} 
                placeholder="https://linkedin.com/in/seu-perfil" 
              />
            </div>
            <div>
              <Label htmlFor="github_url">GitHub</Label>
              <Input 
                id="github_url" 
                {...form.register('github_url')} 
                placeholder="https://github.com/seu-usuario" 
              />
            </div>
            <div>
              <Label htmlFor="portfolio_url">Portfolio / Site Pessoal</Label>
              <Input 
                id="portfolio_url" 
                {...form.register('portfolio_url')} 
                placeholder="https://seu-portfolio.com" 
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between pt-4">
          <Button variant="outline" type="button" onClick={onBack} disabled={isLoading}>
            Voltar
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>
            Continuar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationInfoStep;
