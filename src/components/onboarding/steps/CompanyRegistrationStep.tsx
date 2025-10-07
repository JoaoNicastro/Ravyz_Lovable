import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Users, MapPin, Info, Globe, Calendar, Hash, Linkedin } from "lucide-react";

const companyRegistrationSchema = z.object({
  company_name: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  industry: z.string().min(1, "Setor é obrigatório"),
  size_category: z.string().min(1, "Tamanho da empresa é obrigatório"),
  location: z.string().min(1, "Localização é obrigatória"),
  description: z.string().optional(),
  company_culture: z.string().optional(),
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido. Use o formato 00.000.000/0000-00").optional().or(z.literal("")),
  founded_year: z.coerce.number().min(1800, "Ano inválido").max(new Date().getFullYear(), "Ano não pode ser no futuro").optional().or(z.literal("")),
  employee_count: z.coerce.number().min(1, "Número de funcionários deve ser maior que 0").optional().or(z.literal("")),
  linkedin_url: z.string().url("URL inválida").optional().or(z.literal("")),
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
      location: "",
      description: "",
      company_culture: "",
      website: "",
      cnpj: "",
      founded_year: "",
      employee_count: "",
      linkedin_url: "",
    },
  });

  const handleSubmit = (formData: CompanyRegistrationData) => {
    onNext(formData);
  };

  return (
    <div className="space-y-6">
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

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Localização *</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: São Paulo, SP" 
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

          {/* Company Culture */}
          <FormField
            control={form.control}
            name="company_culture"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Info className="h-4 w-4" />
                  <span>Cultura da Empresa</span>
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva a cultura, valores, benefícios e ambiente de trabalho... (opcional)"
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

          {/* Employee Count */}
          <FormField
            control={form.control}
            name="employee_count"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Hash className="h-4 w-4" />
                  <span>Número Exato de Funcionários</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="Ex: 125" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Website */}
          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Website da Empresa</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="url"
                    placeholder="https://www.exemplo.com.br" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* CNPJ */}
          <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                  <MaskedInput 
                    mask="99.999.999/9999-99"
                    placeholder="00.000.000/0000-00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Founded Year */}
          <FormField
            control={form.control}
            name="founded_year"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Ano de Fundação</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="Ex: 2010" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* LinkedIn URL */}
          <FormField
            control={form.control}
            name="linkedin_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Linkedin className="h-4 w-4" />
                  <span>LinkedIn da Empresa</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    type="url"
                    placeholder="https://www.linkedin.com/company/..." 
                    {...field} 
                  />
                </FormControl>
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