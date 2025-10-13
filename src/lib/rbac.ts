import { SupabaseClient } from '@supabase/supabase-js';

export type AppRole = 'candidate' | 'company' | 'admin';

/**
 * Gets the user's roles from the user_roles table
 */
export async function getUserRoles(
  supabase: SupabaseClient,
  userId: string
): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  return data?.map(r => r.role as AppRole) || [];
}

/**
 * Gets the user's primary role (highest priority role)
 * Priority: admin > company > candidate
 */
export async function getPrimaryRole(
  supabase: SupabaseClient,
  userId: string
): Promise<AppRole | null> {
  const { data, error } = await supabase
    .rpc('get_user_primary_role', { _user_id: userId });

  if (error) {
    console.error('Error fetching primary role:', error);
    return null;
  }

  return data as AppRole | null;
}

/**
 * Checks if user has a specific role
 */
export async function hasRole(
  supabase: SupabaseClient,
  userId: string,
  role: AppRole
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('has_role', { _user_id: userId, _role: role });

  if (error) {
    console.error('Error checking role:', error);
    return false;
  }

  return data || false;
}

/**
 * Gets the active profile type from user_roles for backwards compatibility
 * This replaces reading from users.active_profile
 */
export async function getActiveProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<'candidate' | 'company' | null> {
  const role = await getPrimaryRole(supabase, userId);
  
  if (role === 'admin') {
    // Admins might have both profiles, check which one exists
    const roles = await getUserRoles(supabase, userId);
    if (roles.includes('company')) return 'company';
    if (roles.includes('candidate')) return 'candidate';
  }
  
  return role === 'admin' ? null : role;
}
