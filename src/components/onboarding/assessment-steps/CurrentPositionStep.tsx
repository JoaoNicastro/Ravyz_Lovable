import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronRight, ChevronLeft } from "lucide-react";

const positionSchema = z.object({
  currentRole: z.string().min(1, "Cargo atual é obrigatório"),
  currentCompany: z.string().min(1, "Empresa atual é obrigatória"),
  yearsInRole: z.number().min(0, "Anos no cargo deve ser um número positivo"),
});

type PositionData = z.infer<typeof positionSchema>;

interface CurrentPositionStepProps {
  onNext: (data: PositionData) => void;
  onBack: () => void;
  data?: PositionData;
}

export const CurrentPositionStep: React.FC<CurrentPositionStepProps> = ({ onNext, onBack, data }) => {
  const form = useForm<PositionData>({
    resolver: zodResolver(positionSchema),
    defaultValues: data || {
      currentRole: "",
      currentCompany: "",
      yearsInRole: 0,
    },
  });

  const onSubmit = (formData: PositionData) => {
    onNext(formData);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <span>💼</span> Posição Atual
        </h2>
        <p className="text-muted-foreground">
          Conte sobre seu trabalho atual
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📋</span> Onde você trabalha?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Cargo Atual</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Desenvolvedor Frontend" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Empresa Atual</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: Tech Company Ltd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="yearsInRole"
                render={({ field }) => (
                  <FormItem className="max-w-xs">
                    <FormLabel className="text-base">Há quantos anos está neste cargo?</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              size="lg"
            >
              <ChevronLeft className="mr-2 w-4 h-4" />
              Voltar
            </Button>
            <Button
              type="submit"
              size="lg"
              className="min-w-[160px] bg-gradient-to-r from-primary to-primary/80"
            >
              Próximo
              <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
