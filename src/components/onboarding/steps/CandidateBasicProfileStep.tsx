import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";

const candidateBasicProfileSchema = z.object({
  gender_preference: z.string().default("indiferente"),
  age_ranges: z.array(z.string()).default([]),
});

type CandidateBasicProfileData = z.infer<typeof candidateBasicProfileSchema>;

interface StepProps {
  onNext: (data: CandidateBasicProfileData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: CandidateBasicProfileData;
}

const AGE_RANGES = [
  { value: "18-25", label: "18-25 anos" },
  { value: "26-35", label: "26-35 anos" },
  { value: "36-45", label: "36-45 anos" },
  { value: "46-55", label: "46-55 anos" },
  { value: "55+", label: "55+ anos" },
];

const CandidateBasicProfileStep: React.FC<StepProps> = ({ onNext, onBack, isLoading, data }) => {
  const form = useForm<CandidateBasicProfileData>({
    resolver: zodResolver(candidateBasicProfileSchema),
    defaultValues: data || {
      gender_preference: "indiferente",
      age_ranges: [],
    },
  });

  const handleSubmit = (values: CandidateBasicProfileData) => {
    onNext(values);
  };

  const ageRanges = form.watch("age_ranges");

  const handleAgeRangeChange = (value: string, checked: boolean) => {
    if (value === "indiferente") {
      form.setValue("age_ranges", checked ? ["indiferente"] : []);
    } else {
      const currentRanges = ageRanges.filter(r => r !== "indiferente");
      if (checked) {
        form.setValue("age_ranges", [...currentRanges, value]);
      } else {
        form.setValue("age_ranges", currentRanges.filter(r => r !== value));
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Perfil Básico do Candidato</h3>
            <p className="text-sm text-muted-foreground">Defina as características demográficas que você procura.</p>
          </div>

          {/* Gênero */}
          <FormField
            control={form.control}
            name="gender_preference"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Gênero</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-col space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="indiferente" id="gender-indiferente" />
                      <label htmlFor="gender-indiferente" className="text-sm cursor-pointer">
                        Indiferente
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="masculino" id="gender-masculino" />
                      <label htmlFor="gender-masculino" className="text-sm cursor-pointer">
                        Masculino
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="feminino" id="gender-feminino" />
                      <label htmlFor="gender-feminino" className="text-sm cursor-pointer">
                        Feminino
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="outros" id="gender-outros" />
                      <label htmlFor="gender-outros" className="text-sm cursor-pointer">
                        Outros
                      </label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Faixa Etária */}
          <FormField
            control={form.control}
            name="age_ranges"
            render={() => (
              <FormItem>
                <FormLabel>
                  Faixa Etária
                  {ageRanges.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({ageRanges.length} selecionados)
                    </span>
                  )}
                </FormLabel>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="age-indiferente"
                      checked={ageRanges.includes("indiferente")}
                      onCheckedChange={(checked) => 
                        handleAgeRangeChange("indiferente", checked as boolean)
                      }
                    />
                    <label htmlFor="age-indiferente" className="text-sm cursor-pointer">
                      Indiferente
                    </label>
                  </div>
                  {AGE_RANGES.map((range) => (
                    <div key={range.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`age-${range.value}`}
                        checked={ageRanges.includes(range.value)}
                        onCheckedChange={(checked) => 
                          handleAgeRangeChange(range.value, checked as boolean)
                        }
                        disabled={ageRanges.includes("indiferente")}
                      />
                      <label 
                        htmlFor={`age-${range.value}`} 
                        className={`text-sm cursor-pointer ${
                          ageRanges.includes("indiferente") ? "opacity-50" : ""
                        }`}
                      >
                        {range.label}
                      </label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Salvando..." : "Próximo"}
          </Button>
        </Card>
      </form>
    </Form>
  );
};

export default CandidateBasicProfileStep;
