import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Linkedin } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/forms/AuthForm";
import heroImage from "@/assets/hero-recruitment.jpg";
import ravyzLogo from "@/assets/ravyz-logo.png";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">(() => {
    const tab = searchParams.get('tab');
    return tab === 'register' ? 'register' : 'login';
  });
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithLinkedIn } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/profile-selection', { replace: true });
    }
  }, [user, navigate]);

  const handleAuthSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await signIn(data.email, data.password);
        if (!error) {
          navigate('/profile-selection');
        }
      } else {
        const { error } = await signUp(data.email, data.password, data.name);
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
                  <AuthForm 
                    mode="login" 
                    onSubmit={handleAuthSubmit} 
                    isLoading={isLoading} 
                  />

                  <div className="text-center">
                    <Link to="/forgot-password">
                      <Button variant="link" className="text-sm text-muted-foreground">
                        Esqueceu sua senha?
                      </Button>
                    </Link>
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
                  <AuthForm 
                    mode="register" 
                    onSubmit={handleAuthSubmit} 
                    isLoading={isLoading} 
                  />

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