import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const educationPreferencesSchema = z.object({
  education_levels: z.array(z.string()).default([]),
  preferred_institutions: z.array(z.string()).default([]),
});

type EducationPreferencesData = z.infer<typeof educationPreferencesSchema>;

interface StepProps {
  onNext: (data: EducationPreferencesData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: EducationPreferencesData;
}

const EDUCATION_LEVELS = [
  { value: "ensino_medio", label: "Ensino Médio" },
  { value: "tecnico", label: "Técnico" },
  { value: "superior_incompleto", label: "Superior Incompleto" },
  { value: "superior_completo", label: "Superior Completo" },
  { value: "pos_graduacao", label: "Pós-graduação" },
  { value: "mba", label: "MBA" },
  { value: "mestrado", label: "Mestrado" },
  { value: "doutorado", label: "Doutorado" },
];

const PRESET_INSTITUTIONS = [
  "USP", "UFRJ", "UFMG", "PUC-SP", "PUC-RJ", "Mackenzie", "FEI", "Insper", 
  "FGV", "ESPM", "Anhembi Morumbi", "UniCamp", "UFSC", "UFRGS", "UnB", 
  "UFC", "UFPE", "UFBA", "SENAC", "SENAI"
];

const EducationPreferencesStep: React.FC<StepProps> = ({ onNext, onBack, isLoading, data }) => {
  const [customInstitution, setCustomInstitution] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const form = useForm<EducationPreferencesData>({
    resolver: zodResolver(educationPreferencesSchema),
    defaultValues: data || {
      education_levels: [],
      preferred_institutions: [],
    },
  });

  const handleSubmit = (values: EducationPreferencesData) => {
    onNext(values);
  };

  const educationLevels = form.watch("education_levels");
  const institutions = form.watch("preferred_institutions");

  const handleEducationLevelChange = (value: string, checked: boolean) => {
    if (value === "indiferente") {
      form.setValue("education_levels", checked ? ["indiferente"] : []);
    } else {
      const currentLevels = educationLevels.filter(l => l !== "indiferente");
      if (checked) {
        form.setValue("education_levels", [...currentLevels, value]);
      } else {
        form.setValue("education_levels", currentLevels.filter(l => l !== value));
      }
    }
  };

  const handleInstitutionToggle = (institution: string) => {
    if (institution === "Indiferente") {
      form.setValue("preferred_institutions", institutions.includes("Indiferente") ? [] : ["Indiferente"]);
    } else {
      const currentInstitutions = institutions.filter(i => i !== "Indiferente");
      if (currentInstitutions.includes(institution)) {
        form.setValue("preferred_institutions", currentInstitutions.filter(i => i !== institution));
      } else {
        form.setValue("preferred_institutions", [...currentInstitutions, institution]);
      }
    }
  };

  const handleAddCustomInstitution = () => {
    if (customInstitution.trim() && !institutions.includes(customInstitution.trim())) {
      const currentInstitutions = institutions.filter(i => i !== "Indiferente");
      form.setValue("preferred_institutions", [...currentInstitutions, customInstitution.trim()]);
      setCustomInstitution("");
      setShowCustomInput(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Formação Acadêmica</h3>
            <p className="text-sm text-muted-foreground">
              Qual o nível de formação e as instituições de ensino preferidas?
            </p>
          </div>

          {/* Nível de Formação */}
          <FormField
            control={form.control}
            name="education_levels"
            render={() => (
              <FormItem>
                <FormLabel>
                  Nível de Formação
                  {educationLevels.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({educationLevels.length} selecionados)
                    </span>
                  )}
                </FormLabel>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="education-indiferente"
                      checked={educationLevels.includes("indiferente")}
                      onCheckedChange={(checked) => 
                        handleEducationLevelChange("indiferente", checked as boolean)
                      }
                    />
                    <label htmlFor="education-indiferente" className="text-sm cursor-pointer">
                      Indiferente
                    </label>
                  </div>
                  {EDUCATION_LEVELS.map((level) => (
                    <div key={level.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`education-${level.value}`}
                        checked={educationLevels.includes(level.value)}
                        onCheckedChange={(checked) => 
                          handleEducationLevelChange(level.value, checked as boolean)
                        }
                        disabled={educationLevels.includes("indiferente")}
                      />
                      <label 
                        htmlFor={`education-${level.value}`}
                        className={`text-sm cursor-pointer ${
                          educationLevels.includes("indiferente") ? "opacity-50" : ""
                        }`}
                      >
                        {level.label}
                      </label>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Instituições de Ensino */}
          <FormField
            control={form.control}
            name="preferred_institutions"
            render={() => (
              <FormItem>
                <FormLabel>Instituições de Ensino (Opcional)</FormLabel>
                
                {/* Selected Institutions */}
                {institutions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {institutions.map((institution) => (
                      <Badge key={institution} variant="secondary" className="gap-1">
                        {institution}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => handleInstitutionToggle(institution)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Preset Options */}
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  <div 
                    className={`text-sm cursor-pointer p-2 rounded hover:bg-muted ${
                      institutions.includes("Indiferente") ? "bg-muted font-medium" : ""
                    }`}
                    onClick={() => handleInstitutionToggle("Indiferente")}
                  >
                    Indiferente
                  </div>
                  {PRESET_INSTITUTIONS.map((institution) => (
                    <div
                      key={institution}
                      className={`text-sm cursor-pointer p-2 rounded hover:bg-muted ${
                        institutions.includes(institution) ? "bg-muted font-medium" : ""
                      } ${institutions.includes("Indiferente") ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() => handleInstitutionToggle(institution)}
                    >
                      {institution}
                    </div>
                  ))}
                </div>

                {/* Custom Institution Input */}
                {!showCustomInput ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomInput(true)}
                    className="mt-2"
                    disabled={institutions.includes("Indiferente")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar outra instituição
                  </Button>
                ) : (
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Nome da instituição"
                      value={customInstitution}
                      onChange={(e) => setCustomInstitution(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomInstitution();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCustomInstitution}
                    >
                      Adicionar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomInstitution("");
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                )}

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              Continuar
            </Button>
          </div>
        </Card>
      </form>
    </Form>
  );
};

export default EducationPreferencesStep;
