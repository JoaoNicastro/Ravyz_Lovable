import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { ReusableFormField } from "./FormField";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório").max(255, "Email muito longo"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (data: LoginFormData | RegisterFormData) => Promise<void>;
  isLoading: boolean;
}

export function AuthForm({ mode, onSubmit, isLoading }: AuthFormProps) {
  const schema = mode === "login" ? loginSchema : registerSchema;
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: mode === "login" 
      ? { email: "", password: "" }
      : { name: "", email: "", password: "" }
  });

  const handleSubmit = async (data: LoginFormData | RegisterFormData) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {mode === "register" && (
          <ReusableFormField
            control={form.control}
            name="name"
            label="Nome completo"
          >
            <Input placeholder="Seu nome completo" />
          </ReusableFormField>
        )}

        <ReusableFormField
          control={form.control}
          name="email"
          label="Email"
        >
          {(field) => (
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input {...field} type="email" placeholder="seu@email.com" className="pl-10" />
            </div>
          )}
        </ReusableFormField>

        <ReusableFormField
          control={form.control}
          name="password"
          label="Senha"
        >
          {(field) => (
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                {...field} 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="pl-10 pr-10" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}
        </ReusableFormField>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading 
            ? (mode === "login" ? "Entrando..." : "Criando conta...") 
            : (mode === "login" ? "Entrar" : "Criar conta")
          }
        </Button>
      </form>
    </Form>
  );
}