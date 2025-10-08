import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AutocompleteInput } from "@/components/onboarding/AutocompleteInput";
import { CheckCircle, Plus, X } from "lucide-react";


const companyRegistrationSchema = z.object({
  company_name: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
  industry: z.string().min(1, "Setor é obrigatório"),
  size_category: z.string().min(1, "Tamanho da empresa é obrigatório"),
  location: z.string().min(1, "Localização é obrigatória"),
  description: z.array(z.string()).default([]),
  descriptionOther: z.string().optional(),
  company_culture: z.array(z.string()).default([]),
  companyCultureOther: z.string().optional(),
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

const LOCATIONS = [
  "São Paulo, SP",
  "Rio de Janeiro, RJ",
  "Belo Horizonte, MG",
  "Brasília, DF",
  "Curitiba, PR",
  "Porto Alegre, RS",
  "Salvador, BA",
  "Fortaleza, CE",
  "Recife, PE",
  "Manaus, AM",
  "Belém, PA",
  "Goiânia, GO",
  "Campinas, SP",
  "Vitória, ES",
  "Florianópolis, SC",
  "Natal, RN",
  "João Pessoa, PB",
  "Cuiabá, MT",
  "Campo Grande, MS",
  "Teresina, PI",
  "São Luís, MA",
  "Maceió, AL",
  "Aracaju, SE",
  "Palmas, TO",
  "Porto Velho, RO",
  "Boa Vista, RR",
  "Macapá, AP",
  "Rio Branco, AC",
];

const INDUSTRIES = [
  "Tecnologia",
  "Tecnologia da Informação",
  "Software",
  "Desenvolvimento de Software",
  "Finanças",
  "Financeiro",
  "Serviços Financeiros",
  "Bancos",
  "Saúde",
  "Saúde e Bem-estar",
  "Medicina",
  "Farmacêutica",
  "Educação",
  "Ensino",
  "E-learning",
  "Varejo",
  "Comércio",
  "E-commerce",
  "Indústria",
  "Manufatura",
  "Automotivo",
  "Construção Civil",
  "Imobiliário",
  "Agronegócio",
  "Agricultura",
  "Alimentação",
  "Alimentos e Bebidas",
  "Turismo",
  "Hotelaria",
  "Transporte",
  "Logística",
  "Telecomunicações",
  "Energia",
  "Petróleo e Gás",
  "Consultoria",
  "Serviços Profissionais",
  "Marketing",
  "Publicidade",
  "Mídia",
  "Entretenimento",
  "Seguros",
  "Jurídico",
  "Outros",
];

const descriptionOptions = [
  "Empresa inovadora e tecnológica",
  "Foco em soluções digitais",
  "Líder de mercado no segmento",
  "Empresa em crescimento acelerado",
  "Multinacional estabelecida",
  "Startup em expansão",
  "Empresa familiar tradicional",
  "Foco em sustentabilidade",
  "Produtos/serviços de qualidade premium",
  "Orientada a resultados",
  "Centrada no cliente",
  "Ambiente colaborativo"
];

const companyCultureOptions = [
  "Horários flexíveis",
  "Trabalho remoto disponível",
  "Cultura de inovação",
  "Ambiente informal e descontraído",
  "Foco em diversidade e inclusão",
  "Plano de carreira estruturado",
  "Investimento em capacitação",
  "Home office",
  "Benefícios competitivos",
  "Equilíbrio vida-trabalho",
  "Meritocracia",
  "Autonomia e responsabilidade",
  "Feedbacks constantes",
  "Ambiente colaborativo",
  "Política de férias generosa",
  "Day off no aniversário"
];

const CompanyRegistrationStep: React.FC<StepProps> = ({ onNext, data }) => {
  const [locationValue, setLocationValue] = useState(data?.location || "");
  const [industryValue, setIndustryValue] = useState(data?.industry || "");
  const [selectedDescriptions, setSelectedDescriptions] = useState<string[]>(data?.description || []);
  const [selectedCulture, setSelectedCulture] = useState<string[]>(data?.company_culture || []);
  const [customDescriptions, setCustomDescriptions] = useState<string[]>([]);
  const [customCultures, setCustomCultures] = useState<string[]>([]);
  const [newDescription, setNewDescription] = useState("");
  const [newCulture, setNewCulture] = useState("");
  
  // Prevent form submission on Enter key press in text inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const addCustomDescription = () => {
    if (newDescription.trim()) {
      const updated = [...customDescriptions, newDescription.trim()];
      setCustomDescriptions(updated);
      form.setValue("descriptionOther", updated.join("; "));
      setNewDescription("");
    }
  };

  const removeCustomDescription = (index: number) => {
    const updated = customDescriptions.filter((_, i) => i !== index);
    setCustomDescriptions(updated);
    form.setValue("descriptionOther", updated.join("; "));
  };

  const addCustomCulture = () => {
    if (newCulture.trim()) {
      const updated = [...customCultures, newCulture.trim()];
      setCustomCultures(updated);
      form.setValue("companyCultureOther", updated.join("; "));
      setNewCulture("");
    }
  };

  const removeCustomCulture = (index: number) => {
    const updated = customCultures.filter((_, i) => i !== index);
    setCustomCultures(updated);
    form.setValue("companyCultureOther", updated.join("; "));
  };
  
  const form = useForm<CompanyRegistrationData>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: data || {
      company_name: "",
      industry: "",
      size_category: "",
      location: "",
      description: [],
      company_culture: [],
      website: "",
      cnpj: "",
      founded_year: "",
      employee_count: "",
      linkedin_url: "",
    },
  });

  const toggleDescription = (desc: string) => {
    const updated = selectedDescriptions.includes(desc)
      ? selectedDescriptions.filter(d => d !== desc)
      : [...selectedDescriptions, desc];
    
    setSelectedDescriptions(updated);
    form.setValue("description", updated);
  };

  const toggleCulture = (culture: string) => {
    const updated = selectedCulture.includes(culture)
      ? selectedCulture.filter(c => c !== culture)
      : [...selectedCulture, culture];
    
    setSelectedCulture(updated);
    form.setValue("company_culture", updated);
  };

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
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações Básicas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Empresa *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Tech Innovation Ltda" 
                        onKeyDown={handleKeyDown}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização *</FormLabel>
                    <FormControl>
                      <AutocompleteInput
                        suggestions={LOCATIONS}
                        placeholder="Digite ou selecione a cidade"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          setLocationValue(e.target.value);
                        }}
                        onSelect={(value) => {
                          field.onChange(value);
                          setLocationValue(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Sobre a Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Sobre a Empresa</h3>
            
            <div className="space-y-3">
              <FormLabel>Descrição da Empresa (Opcional)</FormLabel>
              <FormDescription>
                Selecione características que descrevem sua empresa
              </FormDescription>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {descriptionOptions.map((desc) => (
                  <button
                    key={desc}
                    type="button"
                    onClick={() => toggleDescription(desc)}
                    className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                      selectedDescriptions.includes(desc)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/30"
                    }`}
                  >
                    {desc}
                    {selectedDescriptions.includes(desc) && (
                      <CheckCircle className="w-3 h-3 inline ml-1" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="space-y-2">
                <FormLabel className="text-sm">Outros (Opcional)</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicione outras características..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomDescription();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCustomDescription}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {customDescriptions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {customDescriptions.map((desc, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                      >
                        <span>{desc}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomDescription(index)}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="descriptionOther"
                  render={({ field }) => <input type="hidden" {...field} />}
                />
              </div>
            </div>

            <div className="space-y-3">
              <FormLabel>Cultura da Empresa (Opcional)</FormLabel>
              <FormDescription>
                Selecione valores, benefícios e características do ambiente de trabalho
              </FormDescription>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {companyCultureOptions.map((culture) => (
                  <button
                    key={culture}
                    type="button"
                    onClick={() => toggleCulture(culture)}
                    className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                      selectedCulture.includes(culture)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/30"
                    }`}
                  >
                    {culture}
                    {selectedCulture.includes(culture) && (
                      <CheckCircle className="w-3 h-3 inline ml-1" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="space-y-2">
                <FormLabel className="text-sm">Outros (Opcional)</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicione outros aspectos da cultura..."
                    value={newCulture}
                    onChange={(e) => setNewCulture(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomCulture();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCustomCulture}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {customCultures.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {customCultures.map((culture, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                      >
                        <span>{culture}</span>
                        <button
                          type="button"
                          onClick={() => removeCustomCulture(index)}
                          className="hover:bg-primary/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <FormField
                  control={form.control}
                  name="companyCultureOther"
                  render={({ field }) => <input type="hidden" {...field} />}
                />
              </div>
            </div>
          </div>

          {/* Informações da Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Informações da Empresa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor de Atuação *</FormLabel>
                    <FormControl>
                      <AutocompleteInput
                        suggestions={INDUSTRIES}
                        placeholder="Digite ou selecione o setor"
                        value={field.value}
                        onChange={(e) => {
                          field.onChange(e);
                          setIndustryValue(e.target.value);
                        }}
                        onSelect={(value) => {
                          field.onChange(value);
                          setIndustryValue(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="size_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamanho da Empresa *</FormLabel>
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

              <FormField
                control={form.control}
                name="employee_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Exato de Funcionários</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Ex: 125"
                        onKeyDown={handleKeyDown}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="founded_year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano de Fundação</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="Ex: 2010"
                        onKeyDown={handleKeyDown}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Dados Adicionais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados Adicionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website da Empresa</FormLabel>
                    <FormControl>
                      <Input 
                        type="url"
                        placeholder="https://www.exemplo.com.br"
                        onKeyDown={handleKeyDown}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedin_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn da Empresa</FormLabel>
                    <FormControl>
                      <Input 
                        type="url"
                        placeholder="https://www.linkedin.com/company/..."
                        onKeyDown={handleKeyDown}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

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