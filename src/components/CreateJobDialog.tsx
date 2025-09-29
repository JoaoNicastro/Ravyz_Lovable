import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

const JOB_ASSESSMENT_QUESTIONS = [
  // Autonomia / Mão na Massa (Q1-Q6)
  { id: "q1", text: "Esta pessoa terá liberdade para tomar decisões sem precisar de aprovação constante?", pillar: "autonomy" },
  { id: "q2", text: "Você espera que ela resolva problemas por conta própria ou siga instruções à risca?", pillar: "autonomy" },
  { id: "q3", text: "Se essa pessoa identificar um erro seu, ela deve te alertar, mesmo que te incomode?", pillar: "autonomy" },
  { id: "q4", text: "Essa função exige alguém que crie soluções do zero ou apenas execute processos já definidos?", pillar: "autonomy" },
  { id: "q5", text: "Até que ponto você está disposto a delegar responsabilidades críticas para essa posição?", pillar: "autonomy" },
  { id: "q6", text: "Você quer alguém que seja proativo em mudar processos ou apenas que execute o que já existe?", pillar: "autonomy" },

  // Liderança / Sucessão (Q7-Q12)
  { id: "q7", text: "Você quer que essa pessoa seja um potencial sucessor seu no futuro?", pillar: "leadership" },
  { id: "q8", text: "Ela terá liberdade para discordar de você em decisões estratégicas?", pillar: "leadership" },
  { id: "q9", text: "Você prefere alguém que questione você ou que siga suas orientações fielmente?", pillar: "leadership" },
  { id: "q10", text: "Em situações de crise, essa pessoa deve assumir a liderança ou apenas executar ordens?", pillar: "leadership" },
  { id: "q11", text: "Você se sentiria confortável em contratar alguém mais capaz que você em certas áreas?", pillar: "leadership" },
  { id: "q12", text: "Essa pessoa terá exposição direta à alta liderança da empresa?", pillar: "leadership" },

  // Trabalho em Grupo / Colaboração (Q13-Q18)
  { id: "q13", text: "O perfil ideal deve gerar harmonia no time ou ser capaz de lidar com conflitos para entregar resultados?", pillar: "teamwork" },
  { id: "q14", text: "Você prefere alguém especialista que atua sozinho ou alguém integrador que trabalha bem com o grupo?", pillar: "teamwork" },
  { id: "q15", text: "A performance dessa pessoa será medida mais pelo resultado individual ou coletivo?", pillar: "teamwork" },
  { id: "q16", text: "Você quer alguém que inspire e mobilize o time ou apenas entregue seus próprios resultados?", pillar: "teamwork" },
  { id: "q17", text: "Você toleraria um colaborador que gera atrito, mas traz grandes resultados?", pillar: "teamwork" },
  { id: "q18", text: "Esse papel exige alguém diplomático ou alguém direto e objetivo?", pillar: "teamwork" },

  // Risco / Estilo de Trabalho (Q19-Q24)
  { id: "q19", text: "Essa vaga precisa de alguém que inove e assuma riscos ou que preserve a estabilidade?", pillar: "risk" },
  { id: "q20", text: "Você quer alguém que questione o status quo ou que mantenha o que já funciona?", pillar: "risk" },
  { id: "q21", text: "O ritmo esperado da função é estável ou intenso e de alta pressão?", pillar: "risk" },
  { id: "q22", text: "A pessoa deve tomar decisões ousadas mesmo com risco ou sempre minimizar erros?", pillar: "risk" },
  { id: "q23", text: "Você prefere alguém prudente e conservador ou ousado e visionário?", pillar: "risk" },
  { id: "q24", text: "O sucesso dessa função é medido mais por segurança/estabilidade ou por crescimento rápido?", pillar: "risk" },

  // Ambição / Projeção (Q25-Q30)
  { id: "q25", text: "Essa função é de longo prazo ou uma cadeira de passagem para algo maior?", pillar: "ambition" },
  { id: "q26", text: "Você quer alguém que cresça e brilhe na função ou alguém que permaneça discreto?", pillar: "ambition" },
  { id: "q27", text: "Você contrataria alguém que possa, no futuro, assumir seu cargo?", pillar: "ambition" },
  { id: "q28", text: "O candidato ideal deve ser sucessor em potencial ou alguém de apoio confiável?", pillar: "ambition" },
  { id: "q29", text: "Esta função é para acelerar a carreira do ocupante ou oferecer estabilidade de longo prazo?", pillar: "ambition" },
  { id: "q30", text: "Você se sentiria confortável se essa pessoa se tornasse mais influente que você na empresa?", pillar: "ambition" },
];

// Create dynamic schema
const assessmentSchema = JOB_ASSESSMENT_QUESTIONS.reduce((acc, question) => {
  acc[question.id] = z.number().min(1).max(5);
  return acc;
}, {} as Record<string, z.ZodNumber>);

const jobFormSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  location: z.string().min(2, 'Localização é obrigatória'),
  work_model: z.enum(['remote', 'hybrid', 'onsite']),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  ...assessmentSchema,
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface CreateJobDialogProps {
  companyId: string;
  onJobCreated: () => void;
}

export function CreateJobDialog({ companyId, onJobCreated }: CreateJobDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      work_model: 'hybrid',
      salary_min: '',
      salary_max: '',
      // Initialize all assessment questions
      ...JOB_ASSESSMENT_QUESTIONS.reduce((acc, q) => {
        acc[q.id as keyof JobFormValues] = 3;
        return acc;
      }, {} as any),
    },
  });

  const determineJobArchetype = (pillarScores: Record<string, number>): string => {
    const sortedPillars = Object.entries(pillarScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2);

    const pairs: Record<string, string> = {
      "autonomy-leadership": "Protagonista",
      "teamwork-autonomy": "Mobilizador",
      "risk-ambition": "Transformador",
      "leadership-ambition": "Visionário",
      "autonomy-teamwork": "Construtor",
      "teamwork-risk": "Explorador",
      "autonomy-risk": "Proativo",
      "leadership-teamwork": "Idealista",
      "risk-leadership": "Estrategista",
      "ambition-teamwork": "Colaborador",
      "autonomy-ambition": "Guardião",
    };

    const key1 = `${sortedPillars[0][0]}-${sortedPillars[1][0]}`;
    const key2 = `${sortedPillars[1][0]}-${sortedPillars[0][0]}`;
    
    return pairs[key1] || pairs[key2] || "Equilibrado";
  };

  const onSubmit = async (values: JobFormValues) => {
    setIsLoading(true);
    try {
      // Calculate pillar scores from assessment answers
      const pillarScores = {
        autonomy: 0,
        leadership: 0,
        teamwork: 0,
        risk: 0,
        ambition: 0,
      };

      const pillarCounts = {
        autonomy: 0,
        leadership: 0,
        teamwork: 0,
        risk: 0,
        ambition: 0,
      };

      JOB_ASSESSMENT_QUESTIONS.forEach((question) => {
        const score = Number(values[question.id as keyof JobFormValues]);
        const pillar = question.pillar as keyof typeof pillarScores;
        
        if (!isNaN(score)) {
          pillarScores[pillar] += score;
          pillarCounts[pillar]++;
        }
      });

      // Calculate averages
      Object.keys(pillarScores).forEach((pillar) => {
        const key = pillar as keyof typeof pillarScores;
        pillarScores[key] = Math.round((pillarScores[key] / pillarCounts[key]) * 10) / 10;
      });

      const archetype = determineJobArchetype(pillarScores);

      const { error } = await supabase.from('jobs').insert({
        company_id: companyId,
        title: values.title,
        description: values.description,
        location: values.location,
        work_model: values.work_model,
        salary_min: values.salary_min ? parseFloat(values.salary_min) : null,
        salary_max: values.salary_max ? parseFloat(values.salary_max) : null,
        status: 'active',
        pillar_scores: pillarScores,
        archetype: archetype,
      });

      if (error) throw error;

      toast({
        title: 'Vaga criada com sucesso!',
        description: 'A vaga foi publicada e está ativa.',
      });

      form.reset();
      setOpen(false);
      onJobCreated();
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: 'Erro ao criar vaga',
        description: 'Não foi possível criar a vaga. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Criar Nova Vaga
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Vaga</DialogTitle>
          <DialogDescription>
            Preencha as informações da vaga que deseja publicar
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título da Vaga</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Desenvolvedor Full Stack" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva as responsabilidades, requisitos e benefícios..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: São Paulo, SP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="work_model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo de Trabalho</FormLabel>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salary_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salário Mínimo (opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 5000" {...field} />
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
                    <FormLabel>Salário Máximo (opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 8000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-6 pt-6 border-t">
              <div>
                <h3 className="font-semibold text-lg mb-2">Assessment da Vaga</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Defina o perfil comportamental ideal para esta vaga (1 = baixo, 5 = alto)
                </p>
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Pilares Avaliados:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Autonomia</Badge>
                    <Badge variant="secondary">Liderança</Badge>
                    <Badge variant="secondary">Trabalho em Equipe</Badge>
                    <Badge variant="secondary">Risco</Badge>
                    <Badge variant="secondary">Ambição</Badge>
                  </div>
                </div>
              </div>

              {JOB_ASSESSMENT_QUESTIONS.map((question, index) => (
                <FormField
                  key={question.id}
                  control={form.control}
                  name={question.id as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm">
                        <span className="font-semibold">{index + 1}.</span> {question.text}
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          className="flex justify-between"
                        >
                          {[1, 2, 3, 4, 5].map((value) => (
                            <div key={value} className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value={value.toString()} 
                                id={`${question.id}-${value}`} 
                              />
                              <label
                                htmlFor={`${question.id}-${value}`}
                                className="text-sm cursor-pointer"
                              >
                                {value}
                              </label>
                            </div>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Baixo</span>
                        <span>Alto</span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Vaga'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
