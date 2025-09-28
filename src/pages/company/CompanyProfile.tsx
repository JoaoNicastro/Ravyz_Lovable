import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Building2, Users, Briefcase, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const companyProfileSchema = z.object({
  company_name: z.string().min(1, "Nome da empresa é obrigatório").max(100, "Nome muito longo"),
  description: z.string().optional(),
  industry: z.enum(["Tecnologia", "Finanças", "Saúde", "Educação", "Outros"], {
    required_error: "Selecione um setor"
  }),
  size_category: z.enum(["1-10", "11-50", "51-200", "200+"], {
    required_error: "Selecione o tamanho da empresa"
  })
});

type CompanyProfileData = z.infer<typeof companyProfileSchema>;

const CompanyProfile = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const navigate = useNavigate();

  const form = useForm<CompanyProfileData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      company_name: "",
      description: "",
      industry: undefined,
      size_category: undefined
    }
  });

  // Check for existing company profile
  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('company_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading company profile:', error);
          return;
        }

        if (data) {
          setExistingProfile(data);
          form.reset({
            company_name: data.company_name || "",
            description: data.description || "",
            industry: data.industry as "Tecnologia" | "Finanças" | "Saúde" | "Educação" | "Outros" || undefined,
            size_category: data.size_category as "1-10" | "11-50" | "51-200" | "200+" || undefined
          });
        }
      } catch (error) {
        console.error('Error loading existing profile:', error);
      }
    };

    loadExistingProfile();
  }, [user?.id, form]);

  const onSubmit = async (data: CompanyProfileData) => {
    if (!user?.id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsLoading(true);
    
    try {
      const profileData = {
        user_id: user.id,
        company_name: data.company_name,
        description: data.description || null,
        industry: data.industry,
        size_category: data.size_category,
        updated_at: new Date().toISOString()
      };

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('company_profiles')
          .update(profileData)
          .eq('id', existingProfile.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('company_profiles')
          .insert({
            ...profileData,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast.success("Perfil da empresa salvo com sucesso!");
      navigate('/company/onboarding');
    } catch (error) {
      console.error('Error saving company profile:', error);
      toast.error("Erro ao salvar perfil da empresa");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto">
            <Building2 className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Perfil da Empresa</h1>
          <p className="text-muted-foreground text-lg">
            Configure as informações básicas da sua empresa
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Informações da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Company Name */}
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Empresa *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="ex: Tech Innovations Ltda"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição da Empresa</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva sua empresa, valores, missão e o que vocês fazem..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Industry */}
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione o setor da empresa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background border border-border shadow-lg z-50">
                          <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                          <SelectItem value="Finanças">Finanças</SelectItem>
                          <SelectItem value="Saúde">Saúde</SelectItem>
                          <SelectItem value="Educação">Educação</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Company Size */}
                <FormField
                  control={form.control}
                  name="size_category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho da Empresa *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione o número de funcionários" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background border border-border shadow-lg z-50">
                          <SelectItem value="1-10">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              1-10 funcionários
                            </div>
                          </SelectItem>
                          <SelectItem value="11-50">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              11-50 funcionários
                            </div>
                          </SelectItem>
                          <SelectItem value="51-200">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              51-200 funcionários
                            </div>
                          </SelectItem>
                          <SelectItem value="200+">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              200+ funcionários
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={isLoading}
                    className="min-w-[150px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        Continuar
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Help Text */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h4 className="font-medium text-foreground mb-2">💡 Dicas para um perfil atrativo:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use o nome oficial da empresa</li>
              <li>• Na descrição, destaque os valores e cultura da empresa</li>
              <li>• Seja claro sobre o setor de atuação</li>
              <li>• O tamanho da empresa ajuda candidatos a entender o ambiente</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyProfile;