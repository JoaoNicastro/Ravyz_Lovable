import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithLinkedIn: () => Promise<{ error: any }>;
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

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle successful authentication
        if (event === 'SIGNED_IN' && session?.user) {
          // Check if user has completed profile selection
          try {
            const { data: userData } = await supabase
              .from('users')
              .select('active_profile, profiles')
              .eq('id', session.user.id)
              .single();

            // If user doesn't have an active profile, redirect to profile selection
            if (!userData?.active_profile) {
              setTimeout(() => {
                window.location.href = '/profile-selection';
              }, 1000);
            } else {
              // User has profile, redirect to home
              setTimeout(() => {
                window.location.href = '/';
              }, 1000);
            }
          } catch (error) {
            console.error('Error checking user profile:', error);
            // If there's an error, redirect to profile selection as fallback
            setTimeout(() => {
              window.location.href = '/profile-selection';
            }, 1000);
          }
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
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
        
        toast({
          title: "Erro no cadastro",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        // Check if email confirmation is disabled (for development)
        if (data.user && !data.session) {
          toast({
            title: "Conta criada!",
            description: "Verifique seu email para confirmar a conta.",
          });
        } else if (data.session) {
          toast({
            title: "Conta criada!",
            description: "Redirecionando para seleção de perfil...",
          });
        }
      }

      return { error };
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: "Erro inesperado. Tente novamente.",
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
        
        switch (error.message) {
          case 'Invalid login credentials':
            errorMessage = 'Email ou senha incorretos.';
            break;
          case 'Email not confirmed':
            errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.';
            break;
          case 'Too many requests':
            errorMessage = 'Muitas tentativas. Tente novamente em alguns minutos.';
            break;
          default:
            errorMessage = 'Erro ao fazer login. Tente novamente.';
        }
        
        toast({
          title: "Erro no login",
          description: errorMessage,
          variant: "destructive"
        });
      } else if (data.user) {
        toast({
          title: "Login realizado!",
          description: "Redirecionando...",
        });
      }

      return { error };
    } catch (error) {
      toast({
        title: "Erro no login",
        description: "Erro inesperado. Tente novamente.",
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
          redirectTo: `${window.location.origin}/profile-selection`
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

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithLinkedIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};