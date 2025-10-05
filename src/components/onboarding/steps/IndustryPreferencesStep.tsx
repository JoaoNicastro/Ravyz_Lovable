import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  Monitor, DollarSign, ShoppingCart, Heart, BarChart3, 
  GraduationCap, Package, Leaf, Utensils, Car, 
  Zap, Film, Mountain, Radio
} from "lucide-react";

const industryPreferencesSchema = z.object({
  industries: z.array(z.string()).min(1, "Selecione pelo menos uma indústria"),
});

type IndustryPreferencesData = z.infer<typeof industryPreferencesSchema>;

interface StepProps {
  onNext: (data: IndustryPreferencesData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: IndustryPreferencesData;
}

const INDUSTRIES = [
  { value: "tecnologia", label: "Tecnologia", icon: Monitor },
  { value: "financeiro", label: "Financeiro", icon: DollarSign },
  { value: "varejo", label: "Varejo", icon: ShoppingCart },
  { value: "saude", label: "Saúde", icon: Heart },
  { value: "consultoria", label: "Consultoria", icon: BarChart3 },
  { value: "educacao", label: "Educação", icon: GraduationCap },
  { value: "bens_consumo", label: "Bens de Consumo", icon: Package },
  { value: "agronegocio", label: "Agronegócio", icon: Leaf },
  { value: "food_service", label: "Food Service", icon: Utensils },
  { value: "automotivo", label: "Automotivo", icon: Car },
  { value: "energia", label: "Energia", icon: Zap },
  { value: "midia_entretenimento", label: "Mídia e Entretenimento", icon: Film },
  { value: "mineracao", label: "Mineração", icon: Mountain },
  { value: "telecomunicacoes", label: "Telecomunicações", icon: Radio },
];

const IndustryPreferencesStep: React.FC<StepProps> = ({ onNext, onBack, isLoading, data }) => {
  const form = useForm<IndustryPreferencesData>({
    resolver: zodResolver(industryPreferencesSchema),
    defaultValues: data || {
      industries: [],
    },
  });

  const handleSubmit = (values: IndustryPreferencesData) => {
    onNext(values);
  };

  const selectedIndustries = form.watch("industries");

  const toggleIndustry = (industryValue: string) => {
    const current = selectedIndustries || [];
    if (current.includes(industryValue)) {
      form.setValue("industries", current.filter(i => i !== industryValue));
    } else {
      form.setValue("industries", [...current, industryValue]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Setores e Indústrias</h3>
            <p className="text-sm text-muted-foreground">
              Em quais setores ou indústrias você gostaria que o candidato tivesse experiência?
            </p>
          </div>

          <FormField
            control={form.control}
            name="industries"
            render={() => (
              <FormItem>
                <FormLabel>
                  Indústrias de Experiência
                  {selectedIndustries.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({selectedIndustries.length} selecionadas)
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {INDUSTRIES.map((industry) => {
                      const Icon = industry.icon;
                      const isSelected = selectedIndustries.includes(industry.value);
                      
                      return (
                        <Card
                          key={industry.value}
                          className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                            isSelected 
                              ? "border-primary bg-primary/5 ring-2 ring-primary" 
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => toggleIndustry(industry.value)}
                        >
                          <div className="flex flex-col items-center text-center space-y-2">
                            <div className={`p-2 rounded-full ${
                              isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <span className={`text-sm font-medium ${
                              isSelected ? "text-primary" : "text-foreground"
                            }`}>
                              {industry.label}
                            </span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            Continuar
          </Button>
        </Card>
      </form>
    </Form>
  );
};

export default IndustryPreferencesStep;
