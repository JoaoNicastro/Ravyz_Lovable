import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Determines the default dashboard route for a user based on their profile
 * @param supabase Supabase client instance
 * @param userId User ID to check
 * @returns Promise resolving to the appropriate route path
 */
export async function getDefaultDashboardRoute(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    console.log('🔍 [Navigation] Determining default route for user:', userId);

    // 1. Check users.active_profile first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('active_profile, profiles')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ [Navigation] Error fetching user data:', userError);
    } else if (userData) {
      console.log('📊 [Navigation] User data:', {
        active_profile: userData.active_profile,
        profiles: userData.profiles,
      });

      // If active_profile is set, check if profile exists in database
      if (userData.active_profile === 'candidate') {
        const { data: candidateProfile } = await supabase
          .from('candidate_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
      if (candidateProfile) {
        console.log('✅ [Navigation] Candidate profile exists → /onboarding/candidate/complete');
        return '/onboarding/candidate/complete';
      } else {
        console.log('⚠️ [Navigation] Active profile is candidate but no candidate_profile found → /onboarding/candidate');
        return '/onboarding/candidate';
      }
      }
      if (userData.active_profile === 'company') {
        const { data: companyProfile } = await supabase
          .from('company_profiles')
          .select('id')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (companyProfile) {
          console.log('✅ [Navigation] Company profile exists → /dashboard/company');
          return '/dashboard/company';
        } else {
          console.log('⚠️ [Navigation] Active profile is company but no company_profile found → /onboarding/company');
          return '/onboarding/company';
        }
      }
    }

    // 2. Check if candidate_profile exists
    const { data: candidateProfile, error: candidateError } = await supabase
      .from('candidate_profiles')
      .select('id, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (candidateError) {
      console.error('❌ [Navigation] Error checking candidate profile:', candidateError);
    }

    // 3. Check if company_profile exists
    const { data: companyProfile, error: companyError } = await supabase
      .from('company_profiles')
      .select('id, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (companyError) {
      console.error('❌ [Navigation] Error checking company profile:', companyError);
    }

    console.log('📊 [Navigation] Profile existence:', {
      candidateProfile: !!candidateProfile,
      companyProfile: !!companyProfile,
    });

    // 4. If only one profile exists, use it and update active_profile
    if (candidateProfile && !companyProfile) {
      console.log('✅ [Navigation] Only candidate profile exists → /onboarding/candidate/complete');
      // Update active_profile in background
      supabase
        .from('users')
        .update({ active_profile: 'candidate' })
        .eq('id', userId)
        .then(() => console.log('✅ [Navigation] Updated active_profile to candidate'));
      return '/onboarding/candidate/complete';
    }

    if (companyProfile && !candidateProfile) {
      console.log('✅ [Navigation] Only company profile exists → /dashboard/company');
      // Update active_profile in background
      supabase
        .from('users')
        .update({ active_profile: 'company' })
        .eq('id', userId)
        .then(() => console.log('✅ [Navigation] Updated active_profile to company'));
      return '/dashboard/company';
    }

    // 5. If both profiles exist, choose the most recently updated
    if (candidateProfile && companyProfile) {
      console.log('⚠️ [Navigation] Both profiles exist, choosing most recent');
      const candidateDate = new Date(candidateProfile.created_at);
      const companyDate = new Date(companyProfile.created_at);
      
      const mostRecent = candidateDate > companyDate ? 'candidate' : 'company';
      console.log(`✅ [Navigation] Most recent: ${mostRecent}`);
      
      // Update active_profile
      supabase
        .from('users')
        .update({ active_profile: mostRecent })
        .eq('id', userId)
        .then(() => console.log(`✅ [Navigation] Updated active_profile to ${mostRecent}`));

      return mostRecent === 'candidate' ? '/onboarding/candidate/complete' : '/dashboard/company';
    }

    // 6. Fallback: no profiles exist → profile selection
    console.log('⚠️ [Navigation] No profiles found → /profile-selection');
    return '/profile-selection';

  } catch (error) {
    console.error('❌ [Navigation] Unexpected error:', error);
    return '/profile-selection';
  }
}
