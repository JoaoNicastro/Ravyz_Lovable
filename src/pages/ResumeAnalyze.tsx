import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const ResumeAnalyze = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Por favor, selecione apenas arquivos PDF');
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB permitido');
      return;
    }

    setFile(selectedFile);
    toast.success('Arquivo selecionado com sucesso!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const uploadResumeAndAnalyze = async () => {
    if (!file || !user) {
      toast.error('Arquivo ou usuário não encontrado');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Get or create candidate profile
      let { data: candidateProfile } = await supabase
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!candidateProfile) {
        const { data: newProfile, error: createError } = await supabase
          .from('candidate_profiles')
          .insert({
            user_id: user.id,
            preferences: { completionLevel: 0 }
          })
          .select('id')
          .single();

        if (createError) throw createError;
        candidateProfile = newProfile;
      }

      setUploadProgress(30);

      // Generate unique filename
      const timestamp = new Date().toISOString();
      const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${user.id}/${timestamp}_${sanitizedFilename}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      setUploadProgress(50);

      // Get the public URL for the file
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filename);

      setUploadProgress(60);

      // Create resume analysis record
      const { data: analysisData, error: analysisError } = await supabase
        .from('resume_analyses')
        .insert({
          candidate_id: candidateProfile.id,
          file_url: publicUrl,
          original_filename: file.name,
          processing_status: 'processing',
          version: 1,
          technical_score: 0,
          soft_skills_score: 0,
          overall_score: 0,
          extracted_data: {},
          skills_extracted: [],
          ai_suggestions: [],
          experience_summary: {}
        })
        .select('id')
        .single();

      if (analysisError) throw analysisError;
      
      setUploadProgress(70);

      // Call the resume parser edge function
      const { data: parseResult, error: parseError } = await supabase.functions.invoke('parse-resume', {
        body: {
          resumeAnalysisId: analysisData.id,
          fileUrl: publicUrl
        }
      });

      if (parseError) {
        console.error('Parse error:', parseError);
        // Update status to failed
        await supabase
          .from('resume_analyses')
          .update({ processing_status: 'failed' })
          .eq('id', analysisData.id);
        throw parseError;
      }

      setUploadProgress(90);

      // If parsing was successful, update candidate profile with extracted data
      if (parseResult?.success && parseResult?.data) {
        const extractedData = parseResult.data;
        
        // Update candidate profile with extracted information
        const updateData: any = {};
        
        if (extractedData.personalInfo.name) {
          updateData.headline = extractedData.personalInfo.name;
        }
        
        if (extractedData.personalInfo.location) {
          updateData.location = extractedData.personalInfo.location;
        }

        if (extractedData.skills.technical.length > 0) {
          updateData.skills_vector = {
            technical: extractedData.skills.technical,
            soft: extractedData.skills.soft
          };
        }

        if (extractedData.experience.length > 0) {
          updateData.years_experience = calculateTotalYearsFromExperience(extractedData.experience);
        }

        if (Object.keys(updateData).length > 0) {
          const { error: profileUpdateError } = await supabase
            .from('candidate_profiles')
            .update(updateData)
            .eq('id', candidateProfile.id);

          if (profileUpdateError) {
            console.error('Profile update error:', profileUpdateError);
          }
        }
      }
      
      setUploadProgress(100);

      toast.success('Currículo analisado com sucesso! Dados extraídos automaticamente.');
      
      // Navigate to next step in onboarding
      setTimeout(() => {
        navigate('/onboarding/candidate');
      }, 1500);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Erro ao processar currículo: ${error.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Helper function to calculate total years of experience
  const calculateTotalYearsFromExperience = (experience: any[]) => {
    let totalYears = 0;
    const currentYear = new Date().getFullYear();
    
    for (const exp of experience) {
      const startYear = exp.startDate ? parseInt(exp.startDate) : currentYear - 1;
      const endYear = exp.endDate === 'Present' || !exp.endDate ? currentYear : parseInt(exp.endDate);
      
      if (!isNaN(startYear) && !isNaN(endYear)) {
        totalYears += Math.max(0, endYear - startYear);
      }
    }
    
    return totalYears;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/onboarding">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* Progress */}
        <div className="text-center space-y-4">
          <Progress value={25} className="w-32 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Envie seu Currículo</h1>
          <p className="text-muted-foreground text-lg">
            Faça upload do seu CV em PDF para análise automática com IA
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Currículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                isDragOver 
                  ? 'border-primary bg-primary/5' 
                  : file 
                    ? 'border-success bg-success/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="space-y-3">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-foreground">
                      Arraste e solte seu CV aqui
                    </p>
                    <p className="text-muted-foreground">ou clique para selecionar</p>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>✓ Apenas arquivos PDF</p>
                    <p>✓ Tamanho máximo: 10MB</p>
                    <p>✓ Análise automática com IA</p>
                  </div>
                </div>
              )}
              
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
            </div>

            {/* Manual File Select */}
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-4">
                <Label htmlFor="file-input" className="cursor-pointer">
                  <Button variant="outline" asChild disabled={isUploading}>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivo
                    </span>
                  </Button>
                </Label>
                <Input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">
                    Enviando e processando currículo...
                  </span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-muted-foreground text-center">
                  {uploadProgress}% concluído
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" asChild disabled={isUploading}>
                <Link to="/onboarding">Pular Esta Etapa</Link>
              </Button>
              
              <Button 
                onClick={uploadResumeAndAnalyze}
                disabled={!file || isUploading}
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Analisar Currículo
                    <Upload className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Info Card */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-sm">O que nossa IA fará com seu currículo:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Extração automática de habilidades e experiências</li>
                      <li>• Análise de compatibilidade com vagas</li>
                      <li>• Score técnico e de soft skills</li>
                      <li>• Sugestões de melhorias personalizadas</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResumeAnalyze;