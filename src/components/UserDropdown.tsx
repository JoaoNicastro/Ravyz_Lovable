import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function UserDropdown() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeProfile, setActiveProfile] = useState<'candidate' | 'company' | null>(null);

  useEffect(() => {
    if (user) {
      fetchActiveProfile();
    }
  }, [user]);

  const fetchActiveProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('active_profile')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setActiveProfile(data?.active_profile);
    } catch (error) {
      console.error('Error fetching active profile:', error);
    }
  };

  const getUserName = () => {
    if (!user) return 'Usuário';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate('/auth');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível fazer logout",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>{getUserName()}</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => {
          const profileRoute = activeProfile === 'company' 
            ? '/company/profile' 
            : '/candidate/profile';
          navigate(profileRoute);
        }}>
          <User className="w-4 h-4 mr-2" />
          Meu Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="w-4 h-4 mr-2" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
