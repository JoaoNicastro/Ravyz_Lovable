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
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const PILLARS = [
  { key: 'risk', label: 'Risco', description: 'Tolerância a riscos e experimentação' },
  { key: 'ambition', label: 'Ambição', description: 'Foco em crescimento e conquistas' },
  { key: 'autonomy', label: 'Autonomia', description: 'Independência nas decisões' },
  { key: 'teamwork', label: 'Trabalho em Equipe', description: 'Colaboração e cooperação' },
  { key: 'leadership', label: 'Liderança', description: 'Capacidade de liderar e inspirar' },
];

const jobFormSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  location: z.string().min(2, 'Localização é obrigatória'),
  work_model: z.enum(['remote', 'hybrid', 'onsite']),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  risk: z.number().min(1).max(5),
  ambition: z.number().min(1).max(5),
  autonomy: z.number().min(1).max(5),
  teamwork: z.number().min(1).max(5),
  leadership: z.number().min(1).max(5),
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
      risk: 3,
      ambition: 3,
      autonomy: 3,
      teamwork: 3,
      leadership: 3,
    },
  });

  const onSubmit = async (values: JobFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('jobs').insert({
        company_id: companyId,
        title: values.title,
        description: values.description,
        location: values.location,
        work_model: values.work_model,
        salary_min: values.salary_min ? parseFloat(values.salary_min) : null,
        salary_max: values.salary_max ? parseFloat(values.salary_max) : null,
        status: 'active',
        pillar_scores: {
          risk: values.risk,
          ambition: values.ambition,
          autonomy: values.autonomy,
          teamwork: values.teamwork,
          leadership: values.leadership,
        },
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

            <div className="space-y-4 pt-4 border-t">
              <div>
                <h3 className="font-semibold mb-2">Assessment da Vaga</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Avalie os pilares necessários para esta vaga (1 = mínimo, 5 = máximo)
                </p>
              </div>

              {PILLARS.map((pillar) => (
                <FormField
                  key={pillar.key}
                  control={form.control}
                  name={pillar.key as any}
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>{pillar.label}</FormLabel>
                        <span className="text-sm font-medium">{field.value}</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={1}
                          max={5}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {pillar.description}
                      </FormDescription>
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
