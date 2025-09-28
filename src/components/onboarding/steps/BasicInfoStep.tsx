import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Loader2 } from "lucide-react";
import { parseResumeEnhanced, type ParsedResumeData } from "@/lib/enhanced-resume-parser";
import { toast } from "sonner";

const basicInfoSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório"),
  date_of_birth: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  // Removed education and work_experience per request
});

type BasicInfoData = z.infer<typeof basicInfoSchema>;

interface StepProps {
  onNext: (data: BasicInfoData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: BasicInfoData;
}

const BasicInfoStep: React.FC<StepProps> = ({ onNext, onBack, isLoading, data }) => {
  const [isParsingResume, setIsParsingResume] = useState(false);
  
  const form = useForm<BasicInfoData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: data || { full_name: "", date_of_birth: undefined, email: undefined, phone: undefined },
  });

  const submit = (values: BasicInfoData) => {
    onNext(values);
  };

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
      
      // Fill form with parsed data
      if (parsedData.full_name) {
        form.setValue('full_name', parsedData.full_name);
      }
      if (parsedData.email) {
        form.setValue('email', parsedData.email);
      }
      if (parsedData.phone) {
        form.setValue('phone', parsedData.phone);
      }
      if (parsedData.date_of_birth) {
        form.setValue('date_of_birth', parsedData.date_of_birth);
      }

      toast.success('Currículo analisado com sucesso! Dados preenchidos automaticamente com tecnologia avançada.');
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Informações para candidatura</h2>
  <p className="text-muted-foreground">Forneça alguns dados normalmente solicitados em candidaturas: nome, data de nascimento, e-mail e telefone.</p>
      </div>

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
                Máximo 10MB • Análise baseada em OpenResume
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" {...form.register('full_name')} placeholder="Seu nome completo" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_of_birth">Data de nascimento</Label>
                <Input id="date_of_birth" type="date" {...form.register('date_of_birth')} />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...form.register('email')} />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...form.register('phone')} placeholder="(xx) xxxxx-xxxx" />
            </div>

            {/* education and work_experience removed per request */}

            <div className="flex justify-between pt-4">
              <Button variant="outline" type="button" onClick={onBack} disabled={isLoading}>Voltar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>Continuar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BasicInfoStep;
