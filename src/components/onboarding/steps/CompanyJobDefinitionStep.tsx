import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, DollarSign, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AutocompleteInput } from "@/components/onboarding/AutocompleteInput";

const jobDefinitionSchema = z.object({
  title: z.string().min(1, "Título da vaga é obrigatório"),
  description: z.array(z.string()).min(1, "Selecione pelo menos uma descrição"),
  descriptionOther: z.string().optional(),
  location: z.string().optional(),
  level: z.enum(["junior", "pleno", "senior"], {
    required_error: "Nível é obrigatório",
  }),
  salary_min: z.number().min(0, "Salário mínimo deve ser positivo").optional(),
  salary_max: z.number().min(0, "Salário máximo deve ser positivo").optional(),
  benefits: z.array(z.string()).optional(),
}).refine((data) => {
  if (data.salary_min && data.salary_max) {
    return data.salary_max >= data.salary_min;
  }
  return true;
}, {
  message: "Salário máximo deve ser maior ou igual ao mínimo",
  path: ["salary_max"],
});

type JobDefinitionData = z.infer<typeof jobDefinitionSchema>;

interface StepProps {
  onNext: (data: JobDefinitionData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: JobDefinitionData;
}

const DESCRIPTION_OPTIONS = [
  "Desenvolver e manter aplicações",
  "Trabalhar em equipe multidisciplinar",
  "Participar de reuniões de planejamento",
  "Realizar code reviews",
  "Implementar novas funcionalidades",
  "Corrigir bugs e problemas técnicos",
  "Otimizar performance de sistemas",
  "Documentar código e processos",
  "Criar e executar testes automatizados",
  "Gerenciar projetos e prazos",
  "Dar suporte técnico ao time",
  "Analisar requisitos do negócio",
  "Propor soluções técnicas inovadoras",
  "Treinar e mentorar outros profissionais",
  "Acompanhar métricas e KPIs",
];

const BENEFITS_OPTIONS = [
  "Vale Refeição",
  "Vale Transporte",
  "Plano de Saúde",
  "Plano Odontológico",
  "Home Office",
  "Horário Flexível",
  "Gympass",
  "Vale Cultura",
  "Seguro de Vida",
  "Participação nos Lucros",
  "Auxílio Creche",
  "Convênio Farmácia",
];

const JOB_TITLES = [
  "Desenvolvedor Full Stack",
  "Desenvolvedor Frontend",
  "Desenvolvedor Backend",
  "Desenvolvedor Mobile",
  "Engenheiro de Software",
  "Arquiteto de Software",
  "Tech Lead",
  "Gerente de Projetos",
  "Product Manager",
  "Product Owner",
  "Scrum Master",
  "Designer UX/UI",
  "Designer de Produto",
  "Analista de Dados",
  "Cientista de Dados",
  "Engenheiro de Dados",
  "DevOps Engineer",
  "Analista de Segurança da Informação",
  "Analista de Suporte Técnico",
  "Analista de Sistemas",
  "Analista de Infraestrutura",
  "Gerente de TI",
  "CTO - Chief Technology Officer",
  "Coordenador de TI",
  "Especialista em Cloud",
  "Engenheiro de Machine Learning",
  "QA Engineer",
  "Analista de Qualidade",
  "Business Analyst",
  "Analista de Marketing Digital",
  "Gerente de Marketing",
  "Especialista em SEO",
  "Social Media Manager",
  "Designer Gráfico",
  "Redator de Conteúdo",
  "Analista Financeiro",
  "Controller Financeiro",
  "Contador",
  "Analista de RH",
  "Gerente de RH",
  "Recrutador",
  "Analista Comercial",
  "Gerente de Vendas",
  "Executivo de Contas",
  "Consultor de Negócios",
  "Advogado Corporativo",
  "Assistente Administrativo",
  "Auxiliar Administrativo",
];

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
  "Remoto",
  "Híbrido",
];

const CompanyJobDefinitionStep: React.FC<StepProps> = ({ onNext, data, isLoading }) => {
  const [customBenefit, setCustomBenefit] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [titleValue, setTitleValue] = useState(data?.title || "");
  const [locationValue, setLocationValue] = useState(data?.location || "");
  const [selectedDescriptions, setSelectedDescriptions] = useState<string[]>(data?.description || []);
  const [descriptionOther, setDescriptionOther] = useState(data?.descriptionOther || "");

  const form = useForm<JobDefinitionData>({
    resolver: zodResolver(jobDefinitionSchema),
    defaultValues: data || {
      title: "",
      description: [],
      descriptionOther: "",
      location: "",
      level: "pleno",
      salary_min: undefined,
      salary_max: undefined,
      benefits: [],
    },
  });

  const handleSubmit = (formData: JobDefinitionData) => {
    onNext(formData);
  };

  const benefits = form.watch("benefits") || [];

  const handleAddCustomBenefit = () => {
    if (customBenefit.trim() && !benefits.includes(customBenefit.trim())) {
      form.setValue("benefits", [...benefits, customBenefit.trim()]);
      setCustomBenefit("");
      setShowCustomInput(false);
    }
  };

  const handleRemoveBenefit = (benefit: string) => {
    form.setValue("benefits", benefits.filter(b => b !== benefit));
  };

  const toggleDescription = (description: string) => {
    const newDescriptions = selectedDescriptions.includes(description)
      ? selectedDescriptions.filter(d => d !== description)
      : [...selectedDescriptions, description];
    setSelectedDescriptions(newDescriptions);
    form.setValue("description", newDescriptions);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Crie sua primeira vaga
        </h2>
        <p className="text-muted-foreground">
          Vamos começar com uma oportunidade para atrair os melhores talentos
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Job Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Título da Vaga *</span>
                </FormLabel>
                <FormControl>
                  <AutocompleteInput
                    suggestions={JOB_TITLES}
                    placeholder="Digite ou selecione o título da vaga"
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e);
                      setTitleValue(e.target.value);
                    }}
                    onSelect={(value) => {
                      field.onChange(value);
                      setTitleValue(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Job Description */}
          <FormField
            control={form.control}
            name="description"
            render={() => (
              <FormItem>
                <FormLabel>Descrição da Vaga *</FormLabel>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {DESCRIPTION_OPTIONS.map((option) => {
                      const isSelected = selectedDescriptions.includes(option);
                      return (
                        <div
                          key={option}
                          className={`text-sm cursor-pointer p-3 rounded border hover:bg-muted transition-colors ${
                            isSelected ? "bg-muted font-medium border-primary" : ""
                          }`}
                          onClick={() => toggleDescription(option)}
                        >
                          {option}
                        </div>
                      );
                    })}
                  </div>
                  
                  <div>
                    <FormLabel className="text-sm mb-2 block">Outros (opcional)</FormLabel>
                    <Input
                      placeholder="Outras responsabilidades..."
                      value={descriptionOther}
                      onChange={(e) => {
                        setDescriptionOther(e.target.value);
                        form.setValue("descriptionOther", e.target.value);
                      }}
                      className="text-sm"
                    />
                  </div>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>Localização</span>
                  </FormLabel>
                  <FormControl>
                    <AutocompleteInput
                      suggestions={LOCATIONS}
                      placeholder="Digite ou selecione a localização"
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

            {/* Level */}
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4" />
                    <span>Nível *</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="junior">Júnior</SelectItem>
                      <SelectItem value="pleno">Pleno</SelectItem>
                      <SelectItem value="senior">Sênior</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Salary Range */}
          <div className="space-y-4">
            <FormLabel className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span>Faixa Salarial (R$) - opcional</span>
            </FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salary_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Mínimo</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="3000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="salary_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Máximo</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="5000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="benefits"
              render={() => (
                <FormItem>
                  <FormLabel>Benefícios - opcional</FormLabel>
                  
                  {/* Selected Benefits */}
                  {benefits.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {benefits.map((benefit) => (
                        <Badge key={benefit} variant="secondary" className="gap-1">
                          {benefit}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveBenefit(benefit)}
                          />
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Preset Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                    {BENEFITS_OPTIONS.map((benefit) => {
                      const isSelected = benefits.includes(benefit);
                      return (
                        <div
                          key={benefit}
                          className={`text-sm cursor-pointer p-2 rounded border hover:bg-muted ${
                            isSelected ? "bg-muted font-medium border-primary" : ""
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              handleRemoveBenefit(benefit);
                            } else {
                              form.setValue("benefits", [...benefits, benefit]);
                            }
                          }}
                        >
                          {benefit}
                        </div>
                      );
                    })}
                  </div>

                  {/* Custom Benefit Input */}
                  {!showCustomInput ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomInput(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar outro benefício
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome do benefício"
                        value={customBenefit}
                        onChange={(e) => setCustomBenefit(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomBenefit();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddCustomBenefit}
                      >
                        Adicionar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCustomInput(false);
                          setCustomBenefit("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              Continuar
            </Button>
          </div>
        </form>
      </Form>

      {/* Tips */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h4 className="font-medium text-foreground mb-2">💡 Dicas para uma vaga atrativa:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Seja claro sobre as responsabilidades e expectativas</li>
            <li>• Mencione benefícios e oportunidades de crescimento</li>
            <li>• Use linguagem inclusiva e acolhedora</li>
            <li>• Defina requisitos realistas para a posição</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyJobDefinitionStep;