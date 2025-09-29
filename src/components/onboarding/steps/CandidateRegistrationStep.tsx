import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CandidateProfileForm } from "@/components/forms/CandidateProfileForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2 } from "lucide-react";
import { parseResumeEnhanced, type ParsedResumeData } from "@/lib/enhanced-resume-parser";
import { toast } from "sonner";

const candidateSchema = z.object({
  // Basic info fields
  full_name: z.string().min(1, "Nome é obrigatório"),
  date_of_birth: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  // Profile fields
  avatar_url: z.string().optional(),
  headline: z.string().min(1, "Título profissional é obrigatório"),
  years_experience: z.number().min(0, "Anos de experiência deve ser um número positivo"),
  skills: z.array(z.string()).min(1, "Adicione pelo menos uma habilidade"),
});

type CandidateData = z.infer<typeof candidateSchema>;

interface StepProps {
  onNext: (data: CandidateData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: CandidateData;
}

const CandidateRegistrationStep: React.FC<StepProps> = ({ onNext, onBack, isLoading, data }) => {
  const [isParsingResume, setIsParsingResume] = useState(false);
  
  const form = useForm<CandidateData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: data || { 
      full_name: "", 
      date_of_birth: undefined, 
      email: undefined, 
      phone: undefined, 
      location: undefined,
      avatar_url: "",
      headline: "",
      years_experience: 0,
      skills: [],
    },
  });

  const handleSubmit = (formData: CandidateData) => {
    onNext(formData);
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
      if (parsedData.location) {
        form.setValue('location', parsedData.location);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Informações para Candidatura
        </h2>
        <p className="text-muted-foreground">
          Forneça seus dados pessoais e profissionais para criar seu perfil
        </p>
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
                Máximo 10MB • Análise inteligente de currículo
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <CandidateProfileForm
        onSubmit={handleSubmit}
        initialData={data}
      />

      {/* Tips */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-2">💡 Dicas para um perfil atrativo:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Use um título profissional claro que descreva seu papel atual ou desejado</li>
            <li>• Seja específico sobre sua localização (cidade, estado)</li>
            <li>• Inclua uma foto profissional se possível</li>
            <li>• Adicione suas principais habilidades técnicas e comportamentais</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CandidateRegistrationStep;