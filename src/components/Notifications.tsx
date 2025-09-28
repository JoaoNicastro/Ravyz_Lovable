import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  type: 'new_match' | 'feedback_received';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

export const Notifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Subscribe to new matches for candidates
    const matchChannel = supabase
      .channel('new-matches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matching_results'
        },
        async (payload) => {
          // Check if this match is for the current user
          const { data: candidateProfile } = await supabase
            .from('candidate_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          const { data: companyProfiles } = await supabase
            .from('company_profiles')
            .select('id')
            .eq('user_id', user.id);

          const matchResult = payload.new;

          if (candidateProfile && matchResult.candidate_id === candidateProfile.id) {
            // New match for candidate
            const { data: job } = await supabase
              .from('jobs')
              .select('title, company_profiles(company_name)')
              .eq('id', matchResult.job_id)
              .single();

            const notification: Notification = {
              id: `match-${matchResult.id}`,
              type: 'new_match',
              title: 'Novo Match Encontrado! 🎯',
              message: `Você tem ${matchResult.match_percentage}% de compatibilidade com a vaga "${job?.title}" na ${job?.company_profiles?.company_name}`,
              timestamp: new Date(),
              read: false
            };

            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            toast({
              title: notification.title,
              description: notification.message,
            });
          } else if (companyProfiles?.some(cp => cp.id === matchResult.company_id)) {
            // New match for company (when job belongs to company)
            const { data: job } = await supabase
              .from('jobs')
              .select('title')
              .eq('id', matchResult.job_id)
              .single();

            const { data: candidate } = await supabase
              .from('candidate_profiles')
              .select('headline')
              .eq('id', matchResult.candidate_id)
              .single();

            const notification: Notification = {
              id: `match-${matchResult.id}`,
              type: 'new_match',
              title: 'Novo Candidato Compatível! 👤',
              message: `Candidato com ${matchResult.match_percentage}% de compatibilidade para "${job?.title}"`,
              timestamp: new Date(),
              read: false
            };

            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            toast({
              title: notification.title,
              description: notification.message,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to feedback updates
    const feedbackChannel = supabase
      .channel('feedback-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_feedback'
        },
        async (payload) => {
          const feedback = payload.new;
          
          // Check if this feedback affects the current user
          const { data: candidateProfile } = await supabase
            .from('candidate_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          const { data: companyProfiles } = await supabase
            .from('company_profiles')
            .select('id')
            .eq('user_id', user.id);

          let shouldNotify = false;
          let message = '';

          if (candidateProfile && feedback.candidate_id === candidateProfile.id) {
            // Feedback about this candidate
            if (feedback.feedback === 'advance') {
              message = 'Uma empresa está interessada no seu perfil! ✅';
              shouldNotify = true;
            } else if (feedback.feedback === 'reject') {
              message = 'Uma empresa revisou seu perfil 👀';
              shouldNotify = true;
            }
          } else if (companyProfiles?.some(cp => cp.id === feedback.company_id)) {
            // Feedback from this company
            if (feedback.feedback === 'interested') {
              message = 'Um candidato demonstrou interesse na vaga! 👍';
              shouldNotify = true;
            }
          }

          if (shouldNotify) {
            const notification: Notification = {
              id: `feedback-${feedback.id}`,
              type: 'feedback_received',
              title: 'Novo Feedback Recebido!',
              message,
              timestamp: new Date(),
              read: false
            };

            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            toast({
              title: notification.title,
              description: notification.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
      supabase.removeChannel(feedbackChannel);
    };
  }, [user, toast]);

  const markAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={markAsRead}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full text-xs w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </div>
  );
};