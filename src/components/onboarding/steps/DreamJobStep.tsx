import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { CheckCircle, Plus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AutocompleteInput } from "@/components/onboarding/AutocompleteInput";
import { JOB_ROLE_SUGGESTIONS, LOCATION_SUGGESTIONS, COMPANY_SIZE_SUGGESTIONS, WORK_MODEL_SUGGESTIONS } from "@/lib/job-suggestions";

const dreamJobSchema = z.object({
  desiredRole: z.string().min(1, "Cargo desejado é obrigatório"),
  preferredCompanySize: z.string().min(1, "Tamanho da empresa é obrigatório"),
  workModel: z.string().min(1, "Modelo de trabalho é obrigatório"),
  salaryRange: z.object({
    min: z.number().min(0, "Salário mínimo deve ser positivo"),
    max: z.number().min(0, "Salário máximo deve ser positivo"),
  }),
  preferredLocations: z.array(z.string()).min(1, "Adicione pelo menos 1 localização"),
  industryPreferences: z.array(z.string()).min(1, "Adicione pelo menos 1 setor"),
  dealBreakers: z.array(z.string()).default([]),
  dealBreakersOther: z.string().optional(),
  additionalPreferences: z.array(z.string()).default([]),
  additionalPreferencesOther: z.string().optional(),
});

type DreamJobData = z.infer<typeof dreamJobSchema>;

interface StepProps {
  onNext: (data: DreamJobData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: DreamJobData;
}

const industries = [
  "Tecnologia", "Fintech", "E-commerce", "Saúde", "Educação", 
  "Marketing", "Consultoria", "Varejo", "Indústria", "Logística",
  "Agronegócio", "Energia", "Entretenimento", "Governo", "ONG"
];

const dealBreakerOptions = [
  "Não trabalhar aos fins de semana",
  "Trabalho 100% remoto",
  "Sem viagens",
  "Sem trabalho noturno",
  "Sem horas extras obrigatórias",
  "Não trabalhar feriados",
  "Sem mudança de cidade",
  "Horário de entrada flexível"
];

const preferenceOptions = [
  "Cultura de diversidade",
  "Horários flexíveis",
  "Plano de carreira claro",
  "Home office",
  "Vale-alimentação",
  "Plano de saúde",
  "Auxílio educação",
  "Day off no aniversário",
  "Programa de mentoria",
  "Ambiente descontraído",
  "Foco em sustentabilidade",
  "Política de férias generosa"
];

const DreamJobStep: React.FC<StepProps> = ({ onNext, data }) => {
  const [newLocation, setNewLocation] = useState("");
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(data?.industryPreferences || []);
  const [selectedDealBreakers, setSelectedDealBreakers] = useState<string[]>(data?.dealBreakers || []);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(data?.additionalPreferences || []);

  const form = useForm<DreamJobData>({
    resolver: zodResolver(dreamJobSchema),
    defaultValues: data || {
      preferredLocations: [],
      industryPreferences: [],
      dealBreakers: [],
      additionalPreferences: [],
      salaryRange: { min: 5000, max: 15000 },
    },
  });

  const addLocation = (locationValue?: string) => {
    const locationToAdd = (locationValue ?? newLocation).trim();
    if (!locationToAdd) return;

    const currentLocations = form.getValues("preferredLocations") || [];
    if (!currentLocations.includes(locationToAdd)) {
      form.setValue(
        "preferredLocations",
        [...currentLocations, locationToAdd],
        { shouldDirty: true, shouldValidate: true }
      );
      setNewLocation("");
    }
  };

  const removeLocation = (index: number) => {
    const currentLocations = form.getValues("preferredLocations") || [];
    form.setValue(
      "preferredLocations",
      currentLocations.filter((_, i) => i !== index),
      { shouldDirty: true, shouldValidate: true }
    );
  };
  const toggleIndustry = (industry: string) => {
    const updated = selectedIndustries.includes(industry)
      ? selectedIndustries.filter(i => i !== industry)
      : [...selectedIndustries, industry];
    
    setSelectedIndustries(updated);
    form.setValue("industryPreferences", updated);
  };

  const toggleDealBreaker = (dealBreaker: string) => {
    const updated = selectedDealBreakers.includes(dealBreaker)
      ? selectedDealBreakers.filter(d => d !== dealBreaker)
      : [...selectedDealBreakers, dealBreaker];
    
    setSelectedDealBreakers(updated);
    form.setValue("dealBreakers", updated);
  };

  const togglePreference = (preference: string) => {
    const updated = selectedPreferences.includes(preference)
      ? selectedPreferences.filter(p => p !== preference)
      : [...selectedPreferences, preference];
    
    setSelectedPreferences(updated);
    form.setValue("additionalPreferences", updated);
  };

  const onSubmit = (formData: DreamJobData) => {
    onNext(formData);
  };

  const salaryRange = form.watch("salaryRange");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                      <AutocompleteInput
                        suggestions={JOB_ROLE_SUGGESTIONS}
                        placeholder="ex: Senior Frontend Developer, Product Manager..."
                        {...field}
                        onSelect={(value) => field.onChange(value)}
                      />
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
                      <FormControl>
                        <AutocompleteInput
                          suggestions={COMPANY_SIZE_SUGGESTIONS}
                          placeholder="ex: Startup, Média empresa..."
                          {...field}
                          onSelect={(value) => field.onChange(value)}
                        />
                      </FormControl>
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
                      <FormControl>
                        <AutocompleteInput
                          suggestions={WORK_MODEL_SUGGESTIONS}
                          placeholder="ex: Remoto, Híbrido..."
                          {...field}
                          onSelect={(value) => field.onChange(value)}
                        />
                      </FormControl>
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
                <div className="space-y-6 pt-2">
                  <FormField
                    control={form.control}
                    name="salaryRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Slider
                            min={1000}
                            max={50000}
                            step={500}
                            value={[field.value.min, field.value.max]}
                            onValueChange={(values) => {
                              // Garante que o mínimo nunca seja maior que o máximo
                              const [newMin, newMax] = values;
                              field.onChange({
                                min: Math.min(newMin, newMax),
                                max: Math.max(newMin, newMax)
                              });
                            }}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Mínimo: </span>
                      <span className="font-semibold">R$ {salaryRange?.min?.toLocaleString()}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Máximo: </span>
                      <span className="font-semibold">R$ {salaryRange?.max?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Locations */}
              <div className="space-y-3 w-full">
                <FormLabel>Localizações Preferidas</FormLabel>
                <div className="flex gap-2 w-full">
                  <div className="flex-1">
                    <AutocompleteInput
                      suggestions={LOCATION_SUGGESTIONS}
                      placeholder="ex: São Paulo, Remoto, Belo Horizonte..."
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      onSelect={(value) => {
                        addLocation(value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addLocation();
                        }
                      }}
                    />
                  </div>
                  <Button type="button" onClick={() => addLocation()} size="sm">
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
            <CardContent className="space-y-6">
              {/* Deal Breakers */}
              <div className="space-y-3">
                <FormLabel>Deal Breakers (Opcional)</FormLabel>
                <FormDescription>
                  Selecione situações ou condições que você definitivamente não aceita
                </FormDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {dealBreakerOptions.map((dealBreaker) => (
                    <button
                      key={dealBreaker}
                      type="button"
                      onClick={() => toggleDealBreaker(dealBreaker)}
                      className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                        selectedDealBreakers.includes(dealBreaker)
                          ? "bg-destructive/10 text-destructive border-destructive"
                          : "bg-background border-border hover:border-destructive/30"
                      }`}
                    >
                      {dealBreaker}
                      {selectedDealBreakers.includes(dealBreaker) && (
                        <CheckCircle className="w-3 h-3 inline ml-1" />
                      )}
                    </button>
                  ))}
                </div>
                <FormField
                  control={form.control}
                  name="dealBreakersOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Outros (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Adicione outros deal breakers não listados..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Preferences */}
              <div className="space-y-3">
                <FormLabel>Outras Preferências (Opcional)</FormLabel>
                <FormDescription>
                  Selecione valores e benefícios importantes para você
                </FormDescription>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {preferenceOptions.map((preference) => (
                    <button
                      key={preference}
                      type="button"
                      onClick={() => togglePreference(preference)}
                      className={`p-3 text-sm rounded-lg border transition-colors text-left ${
                        selectedPreferences.includes(preference)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/30"
                      }`}
                    >
                      {preference}
                      {selectedPreferences.includes(preference) && (
                        <CheckCircle className="w-3 h-3 inline ml-1" />
                      )}
                    </button>
                  ))}
                </div>
                <FormField
                  control={form.control}
                  name="additionalPreferencesOther"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">Outros (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Adicione outras preferências não listadas..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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