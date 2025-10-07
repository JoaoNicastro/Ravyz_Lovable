import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface StepProps {
  onNext: (data?: { resumeProcessed: boolean; parsedData?: any; resumeAnalysisId?: string }) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: any;
}

const ResumeUploadStep: React.FC<StepProps> = ({ onNext, onBack, isLoading }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.docx')) {
      toast.error('Apenas arquivos PDF ou DOCX são aceitos');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB');
      return;
    }

    setSelectedFile(file);
    toast.success(`Arquivo "${file.name}" selecionado`);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const uploadAndProcessResume = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo primeiro');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      setUploadProgress(20);

      // Get or create candidate profile
      let { data: profile, error: profileError } = await supabase
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('candidate_profiles')
          .insert({ user_id: user.id })
          .select('id')
          .single();

        if (createError) throw createError;
        profile = newProfile;
      }

      setUploadProgress(40);

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setUploadProgress(60);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      setUploadProgress(70);

      // Create resume analysis record
      const { data: resumeAnalysis, error: analysisError } = await supabase
        .from('resume_analyses')
        .insert({
          candidate_id: profile.id,
          file_url: publicUrl,
          original_filename: selectedFile.name,
          processing_status: 'processing'
        })
        .select()
        .single();

      if (analysisError) throw analysisError;

      setUploadProgress(80);

      // Call Edge Function to process resume
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-resume', {
        body: {
          resumeUrl: publicUrl,
          resumeAnalysisId: resumeAnalysis.id,
          candidateId: profile.id
        }
      });

      if (parseError) {
        console.error('Parse error:', parseError);
        throw new Error('Erro ao processar currículo');
      }

      setUploadProgress(100);

      toast.success('Currículo processado com sucesso! Informações preenchidas automaticamente.');
      
      // Pass parsed data to next step
      onNext({ 
        resumeProcessed: true, 
        parsedData: parseResult.parsedData,
        resumeAnalysisId: resumeAnalysis.id
      });

    } catch (error: any) {
      console.error('Error uploading resume:', error);
      toast.error(error.message || 'Não conseguimos processar seu currículo. Você pode preencher manualmente.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const skipStep = () => {
    onNext({ resumeProcessed: false });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-semibold">Upload de Currículo</h2>
        <p className="text-muted-foreground">
          Envie seu currículo e preencheremos automaticamente suas informações profissionais
        </p>
      </div>

      {/* Upload Area */}
      <Card className={`border-2 ${isDragOver ? 'border-primary bg-primary/5' : 'border-dashed'}`}>
        <CardContent className="py-12">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="flex flex-col items-center gap-4"
          >
            {selectedFile ? (
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <FileText className="h-8 w-8 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">
                    Arraste seu currículo aqui ou clique para selecionar
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: PDF, DOCX • Máximo 10MB
                  </p>
                </div>
              </>
            )}

            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />

            {!selectedFile && (
              <Button
                variant="outline"
                onClick={() => document.getElementById('resume-upload')?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivo
              </Button>
            )}
          </div>

          {isUploading && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Processando currículo...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* What we extract */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold">O que extraímos do seu currículo:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Dados pessoais (nome, email, telefone, localização)</li>
                <li>✓ Experiência profissional (cargos, empresas, datas)</li>
                <li>✓ Formação acadêmica</li>
                <li>✓ Habilidades técnicas e comportamentais</li>
                <li>✓ Idiomas e certificações</li>
                <li>✓ Links profissionais (LinkedIn, GitHub, Portfolio)</li>
              </ul>
              <p className="text-xs text-muted-foreground pt-2">
                Após o processamento, você poderá revisar e editar todas as informações extraídas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={isUploading}>
          Voltar
        </Button>
        <div className="flex gap-3">
          <Button variant="outline" onClick={skipStep} disabled={isUploading}>
            Pular Esta Etapa
          </Button>
          <Button 
            onClick={uploadAndProcessResume} 
            disabled={!selectedFile || isUploading || isLoading}
          >
            {isUploading ? 'Processando...' : 'Analisar Currículo'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResumeUploadStep;
