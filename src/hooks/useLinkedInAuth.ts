import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { extractLinkedInData, saveLinkedInProfile } from '@/lib/linkedin-auth';
import { toast } from 'sonner';

/**
 * Hook to handle LinkedIn OAuth callback and profile import
 */
export function useLinkedInAuth() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const processLinkedInCallback = async () => {
      // Check if this is a LinkedIn OAuth callback
      const isLinkedInImport = searchParams.get('linkedin_import') === 'true';
      if (!isLinkedInImport) return;

      setIsProcessing(true);

      try {
        // Get current user and their metadata
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        if (!user) {
          toast.error('Usuário não encontrado após login');
          navigate('/auth');
          return;
        }

        console.log('LinkedIn OAuth successful, user metadata:', user.user_metadata);

        // Extract LinkedIn profile data from user metadata
        const linkedInProfile = extractLinkedInData(user.user_metadata);

        if (!linkedInProfile) {
          toast.warning('Não foi possível importar dados do LinkedIn. Preencha manualmente.');
          navigate('/onboarding/candidate');
          return;
        }

        // Save LinkedIn data to database
        await saveLinkedInProfile(user.id, linkedInProfile);

        toast.success('Dados do LinkedIn importados com sucesso!');
        
        // Remove the linkedin_import param and redirect
        searchParams.delete('linkedin_import');
        navigate('/onboarding/candidate?' + searchParams.toString(), { replace: true });
      } catch (error) {
        console.error('Error processing LinkedIn callback:', error);
        toast.error('Erro ao importar dados do LinkedIn');
        navigate('/onboarding/candidate');
      } finally {
        setIsProcessing(false);
      }
    };

    processLinkedInCallback();
  }, [searchParams, navigate]);

  return { isProcessing };
}
