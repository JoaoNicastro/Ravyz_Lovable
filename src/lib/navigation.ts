import { SupabaseClient } from '@supabase/supabase-js';
import { getActiveProfile } from './rbac';

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

    // 1. Check user_roles table for RBAC-based role
    const { data: primaryRole, error: roleError } = await supabase
      .rpc('get_user_primary_role', { _user_id: userId });

    if (roleError) {
      console.error('❌ [Navigation] Error fetching user role:', roleError);
    } else if (primaryRole) {
      console.log('📊 [Navigation] User primary role:', primaryRole);

      // If primary role is set, check if profile exists and is complete
      if (primaryRole === 'candidate') {
        const { data: candidateProfile } = await supabase
          .from('candidate_profiles')
          .select('id, date_of_birth, phone, skills, preferred_roles')
          .eq('user_id', userId)
          .maybeSingle();
        
        const isComplete = candidateProfile && 
          candidateProfile.date_of_birth && 
          candidateProfile.phone && 
          candidateProfile.skills && 
          Array.isArray(candidateProfile.skills) && 
          candidateProfile.skills.length > 0;
        
        if (candidateProfile && isComplete) {
          console.log('✅ [Navigation] Candidate profile complete → /onboarding/candidate/complete');
          return '/onboarding/candidate/complete';
        } else if (candidateProfile) {
          console.log('⚠️ [Navigation] Candidate profile incomplete → /onboarding/candidate');
          return '/onboarding/candidate';
        } else {
          console.log('⚠️ [Navigation] Primary role is candidate but no candidate_profile found → /onboarding/candidate');
          return '/onboarding/candidate';
        }
      }
      if (primaryRole === 'company') {
        const { data: companyProfile } = await supabase
          .from('company_profiles')
          .select('id, company_name, description, industry')
          .eq('user_id', userId)
          .maybeSingle();
        
        const isComplete = companyProfile && 
          companyProfile.company_name && 
          companyProfile.description && 
          companyProfile.industry;
        
        if (companyProfile && isComplete) {
          console.log('✅ [Navigation] Company profile complete → /onboarding/company/complete');
          return '/onboarding/company/complete';
        } else if (companyProfile) {
          console.log('⚠️ [Navigation] Company profile incomplete → /onboarding/company');
          return '/onboarding/company';
        } else {
          console.log('⚠️ [Navigation] Primary role is company but no company_profile found → /onboarding/company');
          return '/onboarding/company';
        }
      }
    }

    // 2. Check if candidate_profile exists and is complete
    const { data: candidateProfile, error: candidateError } = await supabase
      .from('candidate_profiles')
      .select('id, created_at, date_of_birth, phone, skills, preferred_roles')
      .eq('user_id', userId)
      .maybeSingle();

    if (candidateError) {
      console.error('❌ [Navigation] Error checking candidate profile:', candidateError);
    }

    // Check if candidate profile is complete (has essential fields)
    const isCandidateProfileComplete = candidateProfile && 
      candidateProfile.date_of_birth && 
      candidateProfile.phone && 
      candidateProfile.skills && 
      Array.isArray(candidateProfile.skills) && 
      candidateProfile.skills.length > 0;

    // 3. Check if company_profile exists and is complete
    const { data: companyProfile, error: companyError } = await supabase
      .from('company_profiles')
      .select('id, created_at, company_name, description, industry')
      .eq('user_id', userId)
      .maybeSingle();

    if (companyError) {
      console.error('❌ [Navigation] Error checking company profile:', companyError);
    }

    // Check if company profile is complete (has essential fields)
    const isCompanyProfileComplete = companyProfile && 
      companyProfile.company_name && 
      companyProfile.description && 
      companyProfile.industry;

    console.log('📊 [Navigation] Profile status:', {
      candidateProfile: !!candidateProfile,
      candidateComplete: isCandidateProfileComplete,
      companyProfile: !!companyProfile,
      companyComplete: isCompanyProfileComplete,
    });

    // 4. If only one profile exists, check if complete
    if (candidateProfile && !companyProfile) {
      // Role will be granted automatically via trigger
      console.log('✅ [Navigation] Candidate role present');
      
      if (isCandidateProfileComplete) {
        console.log('✅ [Navigation] Candidate profile complete → /onboarding/candidate/complete');
        return '/onboarding/candidate/complete';
      } else {
        console.log('⚠️ [Navigation] Candidate profile incomplete → /onboarding/candidate');
        return '/onboarding/candidate';
      }
    }

    if (companyProfile && !candidateProfile) {
      // Role will be granted automatically via trigger
      console.log('✅ [Navigation] Company role present');
      
      if (isCompanyProfileComplete) {
        console.log('✅ [Navigation] Company profile complete → /onboarding/company/complete');
        return '/onboarding/company/complete';
      } else {
        console.log('⚠️ [Navigation] Company profile incomplete → /onboarding/company');
        return '/onboarding/company';
      }
    }

    // 5. If both profiles exist, choose the most recently updated and check completeness
    if (candidateProfile && companyProfile) {
      console.log('⚠️ [Navigation] Both profiles exist, choosing most recent');
      const candidateDate = new Date(candidateProfile.created_at);
      const companyDate = new Date(companyProfile.created_at);
      
      const mostRecent = candidateDate > companyDate ? 'candidate' : 'company';
      const isComplete = mostRecent === 'candidate' ? isCandidateProfileComplete : isCompanyProfileComplete;
      console.log(`✅ [Navigation] Most recent: ${mostRecent}, complete: ${isComplete}`);

      if (isComplete) {
        return mostRecent === 'candidate' ? '/onboarding/candidate/complete' : '/onboarding/company/complete';
      } else {
        return mostRecent === 'candidate' ? '/onboarding/candidate' : '/onboarding/company';
      }
    }

    // 6. Fallback: no profiles exist → profile selection
    console.log('⚠️ [Navigation] No profiles found → /profile-selection');
    return '/profile-selection';

  } catch (error) {
    console.error('❌ [Navigation] Unexpected error:', error);
    return '/profile-selection';
  }
}
