import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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