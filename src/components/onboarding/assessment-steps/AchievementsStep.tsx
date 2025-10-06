import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronRight, ChevronLeft } from "lucide-react";

const achievementsSchema = z.object({
  keyAchievements: z.string().min(50, "Descreva suas principais conquistas (mínimo 50 caracteres)"),
});

type AchievementsData = z.infer<typeof achievementsSchema>;

interface AchievementsStepProps {
  onNext: (data: AchievementsData) => void;
  onBack: () => void;
  data?: AchievementsData;
}

export const AchievementsStep: React.FC<AchievementsStepProps> = ({ onNext, onBack, data }) => {
  const form = useForm<AchievementsData>({
    resolver: zodResolver(achievementsSchema),
    defaultValues: data || {
      keyAchievements: "",
    },
  });

  const onSubmit = (formData: AchievementsData) => {
    onNext(formData);
  };

  const currentLength = form.watch("keyAchievements")?.length || 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
          <span>🏆</span> Suas Conquistas
        </h2>
        <p className="text-muted-foreground">
          Do que você mais se orgulha?
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>⭐</span> Principais Conquistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="keyAchievements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Do que você mais se orgulha na sua carreira?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="ex: Liderei o desenvolvimento de uma aplicação que aumentou a eficiência da equipe em 40%..."
                        className="min-h-[150px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-muted-foreground">
                        💡 Seja específico e mencione resultados!
                      </p>
                      <span className={`text-xs ${currentLength >= 50 ? 'text-success' : 'text-muted-foreground'}`}>
                        {currentLength}/50
                      </span>
                    </div>
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
