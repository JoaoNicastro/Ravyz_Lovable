import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Target, Zap, Shield, TrendingUp, Briefcase, LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getDefaultDashboardRoute } from "@/lib/navigation";
import { useState } from "react";
import ravyzLogo from "@/assets/ravyz-logo.png";

const Header = () => {
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
    <div className="bg-background">
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <a href="/">
                <img 
                src={ravyzLogo} 
                alt="RAVYZ Logo" 
                className="w-8 h-8 object-contain"
                />
            </a>
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

          {renderAuthButtons()}
        </div>
      </header>
    </div>
  );
};

export default Header;