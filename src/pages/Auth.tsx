import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Lock, User, Building, Linkedin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-recruitment.jpg";
import ravyzLogo from "@/assets/ravyz-logo.jpg";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedProfile, setSelectedProfile] = useState<"candidate" | "company" | null>(null);
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithLinkedIn } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/profile-selection', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      if (authMode === 'login') {
        const { error } = await signIn(email, password);
        if (!error) {
          navigate('/profile-selection');
        }
      } else {
        if (!selectedProfile) {
          // Show error that profile type must be selected
          return;
        }
        const { error } = await signUp(email, password, name);
        // Note: signUp handles success/error messaging
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInAuth = async () => {
    setIsLoading(true);
    try {
      await signInWithLinkedIn();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero Image */}
      <div className="hidden lg:flex lg:flex-1 relative">
        <img 
          src={heroImage} 
          alt="Professional recruitment platform" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-primary/80 flex items-center justify-center p-12">
          <div className="text-center text-primary-foreground max-w-md">
            <div className="w-20 h-20 bg-primary-foreground/20 rounded-2xl flex items-center justify-center mx-auto mb-6 p-2">
              <img 
                src={ravyzLogo} 
                alt="RAVYZ Logo" 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <h1 className="text-4xl font-bold mb-4">Bem-vindo ao RAVYZ</h1>
            <p className="text-lg text-primary-foreground/90">
              Conecte-se ao futuro do recrutamento. Matching inteligente, 
              análise de IA e oportunidades ilimitadas.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="flex-1 lg:flex-none lg:w-[480px] flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
          </div>

          {/* Auth Tabs */}
          <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Cadastro</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Entre na sua conta</CardTitle>
                  <CardDescription>
                    Acesse seu painel e encontre as melhores oportunidades
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* LinkedIn Login */}
                  <Button
                    variant="outline"
                    className="w-full border-[#0077B5] text-[#0077B5] hover:bg-[#0077B5] hover:text-white"
                    onClick={handleLinkedInAuth}
                    disabled={isLoading}
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    Continuar com LinkedIn
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  {/* Email/Password Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>

                  <div className="text-center">
                    <Button variant="link" className="text-sm text-muted-foreground">
                      Esqueceu sua senha?
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Criar conta</CardTitle>
                  <CardDescription>
                    Junte-se ao RAVYZ e revolucione sua carreira
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Profile Type Selection */}
                  <div className="space-y-3">
                    <Label>Eu sou:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button 
                        type="button"
                        variant={selectedProfile === 'candidate' ? 'default' : 'outline'} 
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        onClick={() => setSelectedProfile('candidate')}
                      >
                        <User className="h-6 w-6 text-primary" />
                        <span className="font-medium">Candidato</span>
                        <Badge variant="secondary" className="text-xs">Buscar vagas</Badge>
                      </Button>
                      <Button 
                        type="button"
                        variant={selectedProfile === 'company' ? 'default' : 'outline'} 
                        className="h-auto p-4 flex flex-col items-center space-y-2"
                        onClick={() => setSelectedProfile('company')}
                      >
                        <Building className="h-6 w-6 text-primary" />
                        <span className="font-medium">Empresa</span>
                        <Badge variant="secondary" className="text-xs">Contratar</Badge>
                      </Button>
                    </div>
                    {authMode === 'register' && !selectedProfile && (
                      <p className="text-sm text-destructive">Selecione seu tipo de perfil</p>
                    )}
                  </div>

                  {/* LinkedIn Registration */}
                  <Button
                    variant="outline"
                    className="w-full border-[#0077B5] text-[#0077B5] hover:bg-[#0077B5] hover:text-white"
                    onClick={handleLinkedInAuth}
                    disabled={isLoading}
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    Cadastrar com LinkedIn
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  {/* Manual Registration Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Seu nome completo"
                        required
                        maxLength={100}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-email"
                          name="email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          required
                          maxLength={255}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          required
                          minLength={6}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isLoading || (authMode === 'register' && !selectedProfile)}
                    >
                      {isLoading ? "Criando conta..." : "Criar conta"}
                    </Button>
                  </form>

                  <p className="text-xs text-muted-foreground text-center">
                    Ao criar uma conta, você concorda com nossos{" "}
                    <Button variant="link" className="p-0 h-auto text-xs">
                      Termos de Uso
                    </Button>{" "}
                    e{" "}
                    <Button variant="link" className="p-0 h-auto text-xs">
                      Política de Privacidade
                    </Button>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;