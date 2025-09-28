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
import { Briefcase, MapPin, DollarSign, Monitor } from "lucide-react";

const jobDefinitionSchema = z.object({
  title: z.string().min(1, "Título da vaga é obrigatório"),
  description: z.string().min(50, "Descrição deve ter pelo menos 50 caracteres"),
  location: z.string().min(1, "Localização é obrigatória"),
  work_model: z.enum(["remote", "hybrid", "onsite"], {
    required_error: "Modelo de trabalho é obrigatório",
  }),
  salary_min: z.number().min(0, "Salário mínimo deve ser positivo").optional(),
  salary_max: z.number().min(0, "Salário máximo deve ser positivo").optional(),
  requirements: z.object({
    skills: z.array(z.string()).optional(),
    experience_years: z.number().min(0).optional(),
    education: z.string().optional(),
  }).optional(),
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

const CompanyJobDefinitionStep: React.FC<StepProps> = ({ onNext, data, isLoading }) => {
  const form = useForm<JobDefinitionData>({
    resolver: zodResolver(jobDefinitionSchema),
    defaultValues: data || {
      title: "",
      description: "",
      location: "",
      work_model: "hybrid",
      salary_min: undefined,
      salary_max: undefined,
      requirements: {},
    },
  });

  const handleSubmit = (formData: JobDefinitionData) => {
    onNext(formData);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
                  <Input 
                    placeholder="Ex: Desenvolvedor Full Stack Sênior" 
                    {...field} 
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição da Vaga *</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva as responsabilidades, requisitos e benefícios da posição..."
                    className="min-h-[120px]"
                    {...field} 
                  />
                </FormControl>
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

            {/* Work Model */}
            <FormField
              control={form.control}
              name="work_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center space-x-2">
                    <Monitor className="h-4 w-4" />
                    <span>Modelo de Trabalho *</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o modelo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="remote">Remoto</SelectItem>
                      <SelectItem value="hybrid">Híbrido</SelectItem>
                      <SelectItem value="onsite">Presencial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Salary Range */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Faixa Salarial (opcional)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salary_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Mínimo (R$)</FormLabel>
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

              <FormField
                control={form.control}
                name="salary_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Máximo (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="8000"
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

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={isLoading}>
              {isLoading ? "Finalizando..." : "Finalizar Configuração"}
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