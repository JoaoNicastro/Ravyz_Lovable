import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const technicalSkillsSchema = z.object({
  technical_skills: z.array(z.object({
    name: z.string(),
    level: z.enum(["basico", "intermediario", "avancado", "especialista"]),
    required: z.boolean(),
  })).min(1, "Adicione pelo menos uma habilidade técnica"),
});

type TechnicalSkillsData = z.infer<typeof technicalSkillsSchema>;

interface StepProps {
  onNext: (data: TechnicalSkillsData) => void;
  onBack: () => void;
  isLoading: boolean;
  data?: TechnicalSkillsData;
}

const COMMON_SKILLS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", 
  "SQL", "Git", "Docker", "AWS", "Azure", "Google Cloud",
  "HTML/CSS", "React Native", "Vue.js", "Angular", "PHP", "Ruby",
  "C#", ".NET", "MongoDB", "PostgreSQL", "Redis", "Kubernetes",
  "CI/CD", "Scrum", "Agile", "REST APIs", "GraphQL", "Figma",
  "Photoshop", "Excel", "Power BI", "Tableau", "Salesforce"
];

const LEVEL_LABELS = {
  basico: "Básico",
  intermediario: "Intermediário",
  avancado: "Avançado",
  especialista: "Especialista",
};

const TechnicalSkillsStep: React.FC<StepProps> = ({ onNext, onBack, isLoading, data }) => {
  const [skillInput, setSkillInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [filteredSkills, setFilteredSkills] = useState(COMMON_SKILLS);

  const form = useForm<TechnicalSkillsData>({
    resolver: zodResolver(technicalSkillsSchema),
    defaultValues: data || {
      technical_skills: [],
    },
  });

  const handleSubmit = (values: TechnicalSkillsData) => {
    onNext(values);
  };

  const skills = form.watch("technical_skills");

  const addSkill = (skillName: string, level: string = "intermediario") => {
    const exists = skills.some(s => s.name.toLowerCase() === skillName.toLowerCase());
    if (!exists && skillName.trim()) {
      form.setValue("technical_skills", [
        ...skills,
        { 
          name: skillName.trim(), 
          level: level as any,
          required: true 
        }
      ]);
      setSkillInput("");
      setShowCustomInput(false);
    }
  };

  const removeSkill = (index: number) => {
    form.setValue("technical_skills", skills.filter((_, i) => i !== index));
  };

  const updateSkillLevel = (index: number, level: string) => {
    const updatedSkills = [...skills];
    updatedSkills[index].level = level as any;
    form.setValue("technical_skills", updatedSkills);
  };

  const toggleRequired = (index: number) => {
    const updatedSkills = [...skills];
    updatedSkills[index].required = !updatedSkills[index].required;
    form.setValue("technical_skills", updatedSkills);
  };

  const handleSkillInputChange = (value: string) => {
    setSkillInput(value);
    if (value) {
      const filtered = COMMON_SKILLS.filter(skill => 
        skill.toLowerCase().includes(value.toLowerCase()) &&
        !skills.some(s => s.name.toLowerCase() === skill.toLowerCase())
      );
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills(COMMON_SKILLS.filter(skill => 
        !skills.some(s => s.name.toLowerCase() === skill.toLowerCase())
      ));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Habilidades Técnicas</h3>
            <p className="text-sm text-muted-foreground">
              Defina as habilidades técnicas necessárias para esta vaga
            </p>
          </div>

          <FormField
            control={form.control}
            name="technical_skills"
            render={() => (
              <FormItem>
                <FormLabel>
                  Habilidades Requeridas
                  {skills.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({skills.length} habilidades)
                    </span>
                  )}
                </FormLabel>

                {/* Lista de Skills Adicionadas */}
                {skills.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {skills.map((skill, index) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{skill.name}</span>
                              {skill.required && (
                                <Badge variant="destructive" className="text-xs">
                                  Obrigatória
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Select
                                value={skill.level}
                                onValueChange={(value) => updateSkillLevel(index, value)}
                              >
                                <SelectTrigger className="w-[180px] h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(LEVEL_LABELS).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => toggleRequired(index)}
                                className="h-8"
                              >
                                {skill.required ? "Marcar como opcional" : "Marcar como obrigatória"}
                              </Button>
                            </div>
                          </div>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSkill(index)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Input para adicionar skills */}
                {!showCustomInput ? (
                  <>
                    <div className="relative">
                      <Input
                        placeholder="Digite ou selecione uma habilidade..."
                        value={skillInput}
                        onChange={(e) => handleSkillInputChange(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (skillInput.trim()) {
                              addSkill(skillInput);
                            }
                          }
                        }}
                      />
                      {skillInput && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addSkill(skillInput)}
                          className="absolute right-1 top-1 h-8"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      )}
                    </div>

                    {/* Sugestões de Skills Comuns */}
                    {skillInput && filteredSkills.length > 0 && (
                      <Card className="p-2 max-h-48 overflow-y-auto">
                        {filteredSkills.slice(0, 10).map((skill) => (
                          <div
                            key={skill}
                            className="p-2 hover:bg-muted rounded cursor-pointer text-sm"
                            onClick={() => addSkill(skill)}
                          >
                            {skill}
                          </div>
                        ))}
                      </Card>
                    )}

                    {/* Skills Comuns (quando não está digitando) */}
                    {!skillInput && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          Habilidades comuns:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {COMMON_SKILLS.filter(skill => 
                            !skills.some(s => s.name.toLowerCase() === skill.toLowerCase())
                          ).slice(0, 15).map((skill) => (
                            <Badge
                              key={skill}
                              variant="outline"
                              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                              onClick={() => addSkill(skill)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nome da habilidade"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSkill(skillInput);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => addSkill(skillInput)}
                    >
                      Adicionar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomInput(false);
                        setSkillInput("");
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

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Adicione as habilidades mais importantes primeiro e defina o nível esperado. 
              Marque como obrigatórias apenas as habilidades essenciais para a vaga.
            </p>
          </div>

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

export default TechnicalSkillsStep;
