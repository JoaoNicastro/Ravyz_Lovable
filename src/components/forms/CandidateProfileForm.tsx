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
});

type CandidateProfileFormData = z.infer<typeof candidateProfileSchema>;

interface CandidateProfileFormProps {
  onSubmit: (data: CandidateProfileFormData) => void | Promise<void>;
  initialData?: Partial<CandidateProfileFormData>;
}

export function CandidateProfileForm({ onSubmit, initialData }: CandidateProfileFormProps) {
  const [isParsingResume, setIsParsingResume] = useState(false);
  
  const form = useForm<CandidateProfileFormData>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: {
      date_of_birth: initialData?.date_of_birth || "",
      phone: initialData?.phone || "",
      address_zipcode: initialData?.address_zipcode || "",
      address_street: initialData?.address_street || "",
      address_number: initialData?.address_number || "",
      address_complement: initialData?.address_complement || "",
      address_neighborhood: initialData?.address_neighborhood || "",
      address_city: initialData?.address_city || "",
      address_state: initialData?.address_state || "",
      avatar_url: initialData?.avatar_url || "",
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
              name="phone"
              label="Telefone"
            >
              <Input placeholder="(xx) xxxxx-xxxx" />
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