import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { CheckCircle, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const dreamJobSchema = z.object({
  desiredRole: z.string().min(1, "Cargo desejado é obrigatório"),
  preferredCompanySize: z.enum(["startup", "small", "medium", "large", "enterprise"]),
  workModel: z.enum(["remote", "hybrid", "onsite"]),
  salaryRange: z.object({
    min: z.number().min(0, "Salário mínimo deve ser positivo"),
    max: z.number().min(0, "Salário máximo deve ser positivo"),
  }),
  preferredLocations: z.array(z.string()).min(1, "Adicione pelo menos 1 localização"),
  industryPreferences: z.array(z.string()).min(1, "Adicione pelo menos 1 setor"),
  dealBreakers: z.string().optional(),
  additionalPreferences: z.string().optional(),
});

type DreamJobData = z.infer<typeof dreamJobSchema>;

interface StepProps {
  onNext: (data: DreamJobData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: DreamJobData;
}

const companySizes = [
  { value: "startup", label: "Startup (1-10 pessoas)" },
  { value: "small", label: "Pequena (11-50 pessoas)" },
  { value: "medium", label: "Média (51-200 pessoas)" },
  { value: "large", label: "Grande (201-1000 pessoas)" },
  { value: "enterprise", label: "Corporação (1000+ pessoas)" },
];

const workModels = [
  { value: "remote", label: "Remoto" },
  { value: "hybrid", label: "Híbrido" },
  { value: "onsite", label: "Presencial" },
];

const industries = [
  "Tecnologia", "Fintech", "E-commerce", "Saúde", "Educação", 
  "Marketing", "Consultoria", "Varejo", "Indústria", "Logística",
  "Agronegócio", "Energia", "Entretenimento", "Governo", "ONG"
];

const DreamJobStep: React.FC<StepProps> = ({ onNext, data }) => {
  const [newLocation, setNewLocation] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(data?.industryPreferences || []);

  const form = useForm<DreamJobData>({
    resolver: zodResolver(dreamJobSchema),
    defaultValues: data || {
      preferredLocations: [],
      industryPreferences: [],
      salaryRange: { min: 5000, max: 15000 },
    },
  });

  const addLocation = () => {
    if (newLocation.trim()) {
      const currentLocations = form.getValues("preferredLocations");
      form.setValue("preferredLocations", [...currentLocations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const removeLocation = (index: number) => {
    const currentLocations = form.getValues("preferredLocations");
    form.setValue("preferredLocations", currentLocations.filter((_, i) => i !== index));
  };

  const toggleIndustry = (industry: string) => {
    const updated = selectedIndustries.includes(industry)
      ? selectedIndustries.filter(i => i !== industry)
      : [...selectedIndustries, industry];
    
    setSelectedIndustries(updated);
    form.setValue("industryPreferences", updated);
  };

  const onSubmit = (formData: DreamJobData) => {
    onNext(formData);
  };

  const salaryRange = form.watch("salaryRange");

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">
          Vamos definir seu emprego dos sonhos
        </h2>
        <p className="text-muted-foreground">
          Estas preferências nos ajudam a encontrar oportunidades perfeitas para você
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Desired Role */}
          <Card>
            <CardHeader>
              <CardTitle>Cargo Ideal</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="desiredRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qual cargo você gostaria de ocupar?</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: Senior Frontend Developer, Product Manager..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Company Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferências da Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="preferredCompanySize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho da Empresa</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tamanho" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companySizes.map((size) => (
                            <SelectItem key={size.value} value={size.value}>
                              {size.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo de Trabalho</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o modelo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {workModels.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Industry Preferences */}
              <div className="space-y-3">
                <FormLabel>Setores de Interesse</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {industries.map((industry) => (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => toggleIndustry(industry)}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        selectedIndustries.includes(industry)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/30"
                      }`}
                    >
                      {industry}
                      {selectedIndustries.includes(industry) && (
                        <CheckCircle className="w-3 h-3 inline ml-1" />
                      )}
                    </button>
                  ))}
                </div>
                <FormField
                  control={form.control}
                  name="industryPreferences"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Salary and Location */}
          <Card>
            <CardHeader>
              <CardTitle>Expectativas de Salário e Local</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Salary Range */}
              <div className="space-y-4">
                <FormLabel>Faixa Salarial Desejada (R$)</FormLabel>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="salaryRange.min"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mínimo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="5000"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="salaryRange.max"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Máximo</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="15000"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Entre R$ {salaryRange?.min?.toLocaleString()} e R$ {salaryRange?.max?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-3">
                <FormLabel>Localizações Preferidas</FormLabel>
                <div className="flex gap-2">
                  <Input
                    placeholder="ex: São Paulo, Remote, Belo Horizonte..."
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLocation())}
                  />
                  <Button type="button" onClick={addLocation} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(form.watch("preferredLocations") || []).map((location, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {location}
                      <button
                        type="button"
                        onClick={() => removeLocation(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="preferredLocations"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferências Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="dealBreakers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deal Breakers (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ex: Não aceito trabalhar fins de semana, não aceito viagens constantes..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Situações ou condições que você definitivamente não aceita
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="additionalPreferences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outras Preferências (Opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ex: Gostaria de uma empresa com foco em sustentabilidade, valorizo diversidade..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Qualquer outra preferência ou valor importante para você
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              size="lg"
              className="min-w-[140px]"
            >
              {form.formState.isSubmitting ? "Finalizando..." : "Finalizar Onboarding"}
              <CheckCircle className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default DreamJobStep;