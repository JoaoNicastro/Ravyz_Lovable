import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, MapPin, Info } from "lucide-react";

const companyRegistrationSchema = z.object({
  company_name: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  industry: z.string().min(1, "Setor é obrigatório"),
  size_category: z.string().min(1, "Tamanho da empresa é obrigatório"),
  description: z.string().optional(),
});

type CompanyRegistrationData = z.infer<typeof companyRegistrationSchema>;

interface StepProps {
  onNext: (data: CompanyRegistrationData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: CompanyRegistrationData;
}

const CompanyRegistrationStep: React.FC<StepProps> = ({ onNext, data }) => {
  const form = useForm<CompanyRegistrationData>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: data || {
      company_name: "",
      industry: "",
      size_category: "",
      description: "",
    },
  });

  const handleSubmit = (formData: CompanyRegistrationData) => {
    onNext(formData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Vamos criar o perfil da sua empresa
        </h2>
        <p className="text-muted-foreground">
          Essas informações ajudarão candidatos a conhecer melhor sua empresa
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Company Name */}
          <FormField
            control={form.control}
            name="company_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4" />
                  <span>Nome da Empresa *</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Tech Innovation Ltda" 
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
                <FormLabel className="flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Descrição da Empresa</span>
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Conte um pouco sobre sua empresa, seus valores e o que faz... (opcional)"
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
                <FormLabel>Setor de Atuação *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o setor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="financas">Finanças</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Size Category */}
          <FormField
            control={form.control}
            name="size_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Tamanho da Empresa *</span>
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 funcionários</SelectItem>
                    <SelectItem value="11-50">11-50 funcionários</SelectItem>
                    <SelectItem value="51-200">51-200 funcionários</SelectItem>
                    <SelectItem value="200+">200+ funcionários</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg">
              Continuar
            </Button>
          </div>
        </form>
      </Form>

      {/* Tips */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-2">💡 Dicas para um perfil atrativo:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Seja clara e específica sobre o que sua empresa faz</li>
            <li>• Destaque os valores e cultura da empresa</li>
            <li>• Mencione benefícios e diferenciais únicos</li>
            <li>• Use uma linguagem acessível e envolvente</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyRegistrationStep;