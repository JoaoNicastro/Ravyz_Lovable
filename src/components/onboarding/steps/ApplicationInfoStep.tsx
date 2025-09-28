import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const applicationInfoSchema = z.object({
  full_name: z.string().min(1, "Nome é obrigatório"),
  date_of_birth: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
});

type ApplicationInfoData = z.infer<typeof applicationInfoSchema>;

interface StepProps {
  onNext: (data: ApplicationInfoData) => void;
  onBack: () => void;
  isLoading?: boolean;
  data?: ApplicationInfoData;
}

const ApplicationInfoStep: React.FC<StepProps> = ({ onNext, onBack, isLoading = false, data }) => {
  const form = useForm<ApplicationInfoData>({
    resolver: zodResolver(applicationInfoSchema),
    defaultValues: data || { full_name: "", date_of_birth: undefined, email: undefined, phone: undefined },
  });

  const submit = (values: ApplicationInfoData) => {
    onNext(values);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Informações para candidatura</h2>
        <p className="text-muted-foreground">Forneça alguns dados normalmente solicitados em candidaturas: nome, data de nascimento, e-mail e telefone.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome completo</Label>
              <Input id="full_name" {...form.register('full_name')} placeholder="Seu nome completo" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date_of_birth">Data de nascimento</Label>
                <Input id="date_of_birth" type="date" {...form.register('date_of_birth')} />
              </div>

              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...form.register('email')} />
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" {...form.register('phone')} placeholder="(xx) xxxxx-xxxx" />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" type="button" onClick={onBack} disabled={isLoading}>Voltar</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || isLoading}>Continuar</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationInfoStep;
