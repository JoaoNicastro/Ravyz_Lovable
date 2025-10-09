import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { getDefaultDashboardRoute } from '@/lib/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithLinkedIn: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Clear invalid tokens on sign out
        if (event === 'SIGNED_OUT') {
          localStorage.removeItem('supabase.auth.token');
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        localStorage.clear(); // Clear all localStorage if session is corrupted
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/profile-selection`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
          }
        }
      });

      if (error) {
        let errorMessage: string;
        
        // Tratamento específico para rate limiting
        if (error.message.includes('For security purposes')) {
          const match = error.message.match(/after (\d+) seconds/);
          const seconds = match ? match[1] : '60';
          errorMessage = `Por questões de segurança, aguarde ${seconds} segundos antes de tentar novamente.`;
        } else if (error.status === 429 || error.message.includes('rate limit')) {
          errorMessage = 'Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.';
        } else {
          switch (error.message) {
            case 'User already registered':
              errorMessage = 'Este email já está cadastrado. Tente fazer login.';
              break;
            case 'Password should be at least 6 characters':
              errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
              break;
            case 'Invalid email':
              errorMessage = 'Email inválido. Verifique o formato.';
              break;
            default:
              errorMessage = 'Erro ao criar conta. Tente novamente.';
          }
        }
        
        toast({
          title: "Erro no cadastro",
          description: errorMessage,
          variant: "destructive"
        });
        
        return { error };
      }
      
      // Sucesso no cadastro
      if (data.user) {
        if (!data.session) {
          // Email confirmation required
          toast({
            title: "Conta criada com sucesso!",
            description: "Verifique seu email para confirmar a conta antes de fazer login.",
          });
        } else {
          // Auto login (email confirmation disabled)
          toast({
            title: "Conta criada!",
            description: "Redirecionando para seleção de perfil...",
          });
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      
      const errorMessage = error?.message?.includes('rate limit') 
        ? 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.'
        : 'Erro inesperado. Tente novamente.';
      
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        let errorMessage: string;
        let errorTitle = "Erro no login";
        
        console.error('Login error:', error);
        
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'Email ou senha incorretos. Se você acabou de se cadastrar, verifique seu email para confirmar a conta.';
            errorTitle = "Credenciais inválidas";
            break;
          case 'Email not confirmed':
            errorMessage = 'Email não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.';
            errorTitle = "Email não confirmado";
            break;
          case 'Too many requests':
            errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
            break;
          default:
            errorMessage = error.message || 'Erro ao fazer login. Tente novamente.';
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive"
        });
      } else if (data.user) {
        toast({
          title: "Login realizado!",
          description: "Redirecionando...",
        });
        // Redirection will be handled by Auth.tsx useEffect
      }

      return { error };
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      toast({
        title: "Erro no login",
        description: error?.message || "Erro inesperado. Tente novamente.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signInWithLinkedIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
      });

      if (error) {
        let errorMessage: string;
        
        switch (error.message) {
          case 'provider is not enabled':
            errorMessage = 'Login com LinkedIn não está configurado. Entre em contato com o suporte.';
            break;
          default:
            errorMessage = 'Erro ao conectar com LinkedIn. Tente novamente.';
        }
        
        toast({
          title: "Erro na autenticação",
          description: errorMessage,
          variant: "destructive"
        });
      }

      return { error };
    } catch (error) {
      toast({
        title: "Erro na autenticação",
        description: "Erro ao conectar com LinkedIn. Tente novamente.",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao sair. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro inesperado ao sair.",
        variant: "destructive"
      });
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      return { error };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      return { error };
    } catch (error: any) {
      console.error('Update password error:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
      signUp,
      signIn,
      signOut,
      signInWithLinkedIn,
      resetPassword,
      updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};