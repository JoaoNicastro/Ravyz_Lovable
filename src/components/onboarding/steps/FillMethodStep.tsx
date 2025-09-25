import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Upload, FileText, Linkedin, ChevronRight } from "lucide-react";

const fillMethodSchema = z.object({
  method: z.enum(["manual", "resume", "linkedin"], {
    required_error: "Selecione um método de preenchimento",
  }),
});

type FillMethodData = z.infer<typeof fillMethodSchema>;

interface StepProps {
  onNext: (data: FillMethodData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: FillMethodData;
}

const methods = [
  {
    id: "manual",
    title: "Preenchimento Manual",
    description: "Preencha todas as informações manualmente através de formulários simples",
    icon: FileText,
    time: "10-15 min",
    pros: ["Controle total", "Informações personalizadas", "Sem uploads"],
  },
  {
    id: "resume",
    title: "Upload de Currículo",
    description: "Carregue seu currículo em PDF e nossa IA extrairá as informações automaticamente",
    icon: Upload,
    time: "3-5 min",
    pros: ["Mais rápido", "Extração automática", "Análise IA"],
  },
  {
    id: "linkedin",
    title: "Importar do LinkedIn",
    description: "Conecte sua conta do LinkedIn para importar dados automaticamente",
    icon: Linkedin,
    time: "2-3 min",
    pros: ["Super rápido", "Dados atualizados", "Conexão direta"],
  },
];

const FillMethodStep: React.FC<StepProps> = ({ onNext, onBack, isLoading, data }) => {
  const form = useForm<FillMethodData>({
    resolver: zodResolver(fillMethodSchema),
    defaultValues: data || { method: undefined },
  });

  const onSubmit = (formData: FillMethodData) => {
    onNext(formData);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Como você gostaria de completar seu perfil?
        </h2>
        <p className="text-muted-foreground">
          Escolha o método que funciona melhor para você. Todos os métodos criam um perfil completo.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid gap-4 md:grid-cols-1 lg:grid-cols-3"
                  >
                    {methods.map((method) => {
                      const IconComponent = method.icon;
                      return (
                        <div key={method.id} className="relative">
                          <RadioGroupItem
                            value={method.id}
                            id={method.id}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={method.id}
                            className="cursor-pointer block"
                          >
                            <Card className={`h-full transition-all duration-200 hover:shadow-md ${
                              field.value === method.id
                                ? "ring-2 ring-primary bg-primary/5 border-primary"
                                : "border-border hover:border-primary/30"
                            }`}>
                              <CardContent className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                    field.value === method.id
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }`}>
                                    <IconComponent className="w-6 h-6" />
                                  </div>
                                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                                    field.value === method.id
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }`}>
                                    {method.time}
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  <h3 className="font-semibold text-foreground">
                                    {method.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    {method.description}
                                  </p>
                                </div>

                                <ul className="space-y-1">
                                  {method.pros.map((pro, index) => (
                                    <li key={index} className="text-xs text-muted-foreground flex items-center gap-1">
                                      <span className="w-1 h-1 bg-success rounded-full" />
                                      {pro}
                                    </li>
                                  ))}
                                </ul>

                                {field.value === method.id && (
                                  <div className="flex items-center justify-center text-primary">
                                    <ChevronRight className="w-4 h-4" />
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-6">
            <Button
              type="submit"
              disabled={isLoading || !form.watch("method")}
              size="lg"
            >
              {isLoading ? "Processando..." : "Continuar"}
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </form>
      </Form>

      {/* Additional Info */}
      <div className="bg-muted/30 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Dica:</strong> Independente do método escolhido, você sempre poderá editar e complementar 
          suas informações após o cadastro inicial.
        </p>
      </div>
    </div>
  );
};

export default FillMethodStep;