import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronRight, Sparkles } from "lucide-react";
import { AutocompleteInput } from "@/components/onboarding/AutocompleteInput";

const profileSchema = z.object({
  headline: z.string().min(5, "Título deve ter pelo menos 5 caracteres").max(200, "Título muito longo"),
  years_experience: z.number().min(0, "Experiência não pode ser negativa").max(50, "Experiência muito alta"),
});

type ProfileData = z.infer<typeof profileSchema>;

interface ProfileStepProps {
  onNext: (data: ProfileData) => void;
  data?: ProfileData;
}

const PROFESSIONAL_TITLES = [
  "Desenvolvedor Full Stack",
  "Desenvolvedor Frontend",
  "Desenvolvedor Backend",
  "Designer UI/UX",
  "Designer de Produto",
  "Gerente de Projetos",
  "Gerente de Marketing",
  "Analista de Dados",
  "Product Manager",
  "Engenheiro de Software",
  "Arquiteto de Soluções",
  "Scrum Master",
  "Tech Lead",
];

export const ProfileStep: React.FC<ProfileStepProps> = ({ onNext, data }) => {
  const form = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: data || {
      headline: "",
      years_experience: 0,
    },
  });

  const onSubmit = (formData: ProfileData) => {
    onNext(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Seu Perfil Profissional
        </h2>
        <p className="text-muted-foreground">
          Vamos começar conhecendo sua trajetória
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>✨</span> Apresente-se
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Como você se apresenta profissionalmente?</FormLabel>
                    <FormControl>
                      <AutocompleteInput
                        placeholder="Comece a digitar... (ex: Desenvolvedor, Designer)"
                        suggestions={PROFESSIONAL_TITLES}
                        onSelect={(value) => field.onChange(value)}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      💡 Dica: Seja específico e atrativo!
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="years_experience"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="text-base">Quantos anos de experiência você tem?</FormLabel>
                      <span className="text-2xl font-bold text-primary">{field.value || 0}</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={0}
                        max={30}
                        step={1}
                        value={[field.value || 0]}
                        onValueChange={(values) => field.onChange(values[0])}
                        className="py-4"
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0 anos</span>
                      <span>15 anos</span>
                      <span>30+ anos</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
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
