import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Target, Zap, Shield, TrendingUp, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-recruitment.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-bold text-foreground">RAVYZ</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              Como Funciona
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Preços
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
                Começar Agora
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src={heroImage} 
            alt="Future of recruitment with AI" 
            className="w-full h-full object-cover opacity-5"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/95" />
        </div>
        
        <div className="container mx-auto text-center relative z-10">
          <Badge className="mb-6 bg-primary-light text-primary border-primary/20">
            🚀 Powered by AI
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            O Futuro do
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Recrutamento</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Conectamos talentos e empresas com precisão de IA. Matching inteligente, 
            análise completa de currículos e transparência total no processo seletivo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
                <Users className="mr-2 h-5 w-5" />
                Sou Candidato
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            
            <Link to="/auth">
              <Button size="lg" variant="outline" className="border-primary/20 hover:bg-primary-light">
                <Briefcase className="mr-2 h-5 w-5" />
                Sou Empresa
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-sm text-muted-foreground">Precisão no Match</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">24h</div>
              <div className="text-sm text-muted-foreground">Tempo Médio</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">10k+</div>
              <div className="text-sm text-muted-foreground">Candidatos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Empresas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Por que escolher o RAVYZ?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Nossa plataforma revoluciona o processo de recrutamento com tecnologia de ponta
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-card border-border/50 hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Matching Preciso
                </h3>
                <p className="text-muted-foreground">
                  IA avançada analisa skills, experiência e cultura para matches perfeitos
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Análise de Currículo IA
                </h3>
                <p className="text-muted-foreground">
                  Extração automática de dados e pontuação inteligente de competências
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Transparência Total
                </h3>
                <p className="text-muted-foreground">
                  Explicações detalhadas sobre cada match e decisão do algoritmo
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Insights Profissionais
                </h3>
                <p className="text-muted-foreground">
                  Relatórios detalhados e sugestões de carreira baseadas em dados
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Múltiplos Perfis
                </h3>
                <p className="text-muted-foreground">
                  Uma conta para candidatos e empresas com alternância fácil
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border/50 hover:shadow-md transition-all duration-300">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mb-4">
                  <Briefcase className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  Dashboard Completo
                </h3>
                <p className="text-muted-foreground">
                  Gestão completa de vagas, candidatos e processo seletivo
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="bg-gradient-primary rounded-3xl p-12 text-center">
            <h2 className="text-4xl font-bold text-primary-foreground mb-4">
              Pronto para revolucionar seu recrutamento?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de empresas e milhares de candidatos que já descobriram o futuro do trabalho
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                  <Users className="mr-2 h-5 w-5" />
                  Cadastrar como Candidato
                </Button>
              </Link>
              
              <Link to="/auth">
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Cadastrar Empresa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">R</span>
                </div>
                <span className="text-xl font-bold text-foreground">RAVYZ</span>
              </div>
              <p className="text-muted-foreground">
                O futuro do recrutamento está aqui. Conectamos talentos e oportunidades com inteligência artificial.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Para Candidatos</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Buscar Vagas</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Análise de Currículo</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Perfil Profissional</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Para Empresas</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Publicar Vagas</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Encontrar Talentos</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Central de Ajuda</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contato</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 mt-8 pt-8 text-center">
            <p className="text-muted-foreground">
              © 2024 RAVYZ. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;