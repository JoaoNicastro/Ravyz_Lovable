import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Target, Zap, Shield, TrendingUp, Briefcase, LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getDefaultDashboardRoute } from "@/lib/navigation";
import { useState } from "react";
import ravyzLogo from "@/assets/ravyz-logo.png";
import Header from "@/components/ui/header";

const Contato = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [navigating, setNavigating] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGoToDashboard = async () => {
    if (!user) return;
    
    setNavigating(true);
    try {
      const route = await getDefaultDashboardRoute(supabase, user.id);
      navigate(route);
    } catch (error) {
      console.error('Error determining dashboard route:', error);
      navigate('/profile-selection');
    } finally {
      setNavigating(false);
    }
  };

  const renderAuthButtons = () => {
    if (loading) {
      return (
        <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      );
    }

    if (user) {
      return (
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2"
            onClick={handleGoToDashboard}
            disabled={navigating}
          >
            {navigating ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            ) : (
              <User className="h-4 w-4" />
            )}
            Dashboard
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-4">
        <Link to="/auth?tab=login">
          <Button variant="ghost">Login</Button>
        </Link>
        <Link to="/auth?tab=register">
          <Button className="bg-gradient-primary hover:shadow-glow transition-all duration-300">
            Começar Agora
          </Button>
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
	  
      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src={ravyzLogo} 
                  alt="RAVYZ Logo" 
                  className="w-8 h-8 object-contain"
                />
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
                <li><a href="/contato" className="text-muted-foreground hover:text-foreground transition-colors">Contato</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacidade</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 mt-8 pt-8 text-center">
            <p className="text-muted-foreground">
              © 2025 RAVYZ. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contato;