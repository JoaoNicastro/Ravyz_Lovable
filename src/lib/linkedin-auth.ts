import { supabase } from '@/integrations/supabase/client';

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline?: string;
  profilePicture?: string;
  location?: string;
  positions?: Array<{
    title: string;
    companyName: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    isCurrent?: boolean;
  }>;
  education?: Array<{
    schoolName: string;
    fieldOfStudy: string;
    degree: string;
    startDate?: string;
    endDate?: string;
  }>;
  skills?: string[];
}

/**
 * Extract LinkedIn data from Supabase auth user metadata
 */
export function extractLinkedInData(userMetadata: any): LinkedInProfile | null {
  if (!userMetadata) return null;

  try {
    // LinkedIn OAuth returns data in user_metadata
    // Structure may vary based on LinkedIn API permissions
    const profile: LinkedInProfile = {
      id: userMetadata.sub || userMetadata.id || '',
      firstName: userMetadata.given_name || userMetadata.firstName || '',
      lastName: userMetadata.family_name || userMetadata.lastName || '',
      headline: userMetadata.headline || '',
      profilePicture: userMetadata.picture || userMetadata.avatar_url || '',
      location: userMetadata.location?.name || '',
    };

    // Extract positions if available
    if (userMetadata.positions) {
      profile.positions = userMetadata.positions.map((pos: any) => ({
        title: pos.title || '',
        companyName: pos.companyName || pos.company?.name || '',
        description: pos.description || '',
        startDate: pos.startDate || '',
        endDate: pos.endDate || '',
        isCurrent: pos.isCurrent || false,
      }));
    }

    // Extract education if available
    if (userMetadata.education || userMetadata.educations) {
      const educationData = userMetadata.education || userMetadata.educations;
      profile.education = educationData.map((edu: any) => ({
        schoolName: edu.schoolName || edu.school?.name || '',
        fieldOfStudy: edu.fieldOfStudy || '',
        degree: edu.degree || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
      }));
    }

    // Extract skills if available
    if (userMetadata.skills) {
      profile.skills = userMetadata.skills.map((skill: any) => 
        typeof skill === 'string' ? skill : skill.name
      );
    }

    return profile;
  } catch (error) {
    console.error('Error extracting LinkedIn data:', error);
    return null;
  }
}

/**
 * Process LinkedIn profile data and save to candidate_profiles
 */
export async function saveLinkedInProfile(userId: string, linkedInData: LinkedInProfile) {
  try {
    // Get existing profile
    const { data: profile, error: fetchError } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    // Prepare profile data
    const profileData = {
      user_id: userId,
      full_name: `${linkedInData.firstName} ${linkedInData.lastName}`.trim(),
      headline: linkedInData.headline || null,
      location: linkedInData.location || null,
      linkedin_data: linkedInData as any, // Store raw LinkedIn data
    };

    // Only update avatar if user hasn't uploaded their own
    if (!profile?.avatar_url && linkedInData.profilePicture) {
      profileData['avatar_url'] = linkedInData.profilePicture;
    }

    // Extract current position from positions
    if (linkedInData.positions && linkedInData.positions.length > 0) {
      const currentPosition = linkedInData.positions.find(p => p.isCurrent) 
        || linkedInData.positions[0];
      profileData['current_position'] = currentPosition.title;
    }

    // Format education for database
    if (linkedInData.education && linkedInData.education.length > 0) {
      profileData['education'] = linkedInData.education.map(edu => ({
        degree: edu.degree,
        field: edu.fieldOfStudy,
        institution: edu.schoolName,
        status: edu.endDate ? 'concluido' : 'cursando',
        completionYear: edu.endDate ? new Date(edu.endDate).getFullYear() : undefined,
      }));
    }

    // Format skills
    if (linkedInData.skills && linkedInData.skills.length > 0) {
      profileData['skills'] = linkedInData.skills;
    }

    // Create or update profile
    if (!profile) {
      const { error: createError } = await supabase
        .from('candidate_profiles')
        .insert(profileData);

      if (createError) throw createError;
    } else {
      const { error: updateError } = await supabase
        .from('candidate_profiles')
        .update(profileData)
        .eq('id', profile.id);

      if (updateError) throw updateError;
    }

    return true;
  } catch (error) {
    console.error('Error saving LinkedIn profile:', error);
    throw error;
  }
}

/**
 * Check if user has LinkedIn data imported
 */
export async function hasLinkedInData(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('candidate_profiles')
      .select('linkedin_data, full_name, current_position, education')
      .eq('user_id', userId)
      .single();

    if (error) return false;

    // Check if essential data exists
    return !!(
      data?.linkedin_data &&
      Object.keys(data.linkedin_data).length > 0 &&
      data?.full_name &&
      data?.current_position &&
      data?.education &&
      Array.isArray(data.education) &&
      data.education.length > 0
    );
  } catch (error) {
    console.error('Error checking LinkedIn data:', error);
    return false;
  }
}
