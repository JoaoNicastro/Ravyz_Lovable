import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResumeData {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  date_of_birth?: string;
  current_position?: string;
  headline?: string;
  years_experience?: number;
  education?: any;
  skills?: any;
  languages?: any;
}

export const useResumeData = (candidateId?: string) => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchResumeData = async () => {
    if (!candidateId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('full_name, email, phone, location, date_of_birth, current_position, headline, years_experience, education, skills, languages')
        .eq('id', candidateId)
        .single();

      if (error) {
        console.error('Error fetching resume data:', error);
        toast({
          title: "Erro ao buscar dados do currículo",
          description: "Não foi possível carregar os dados processados.",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setResumeData(data);
        console.log('✅ Resume data fetched:', data);
      }
    } catch (error) {
      console.error('Error in fetchResumeData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumeData();
  }, [candidateId]);

  return { resumeData, isLoading, refetch: fetchResumeData };
};
