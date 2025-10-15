import { DEFAULT_ROLE_PERMISSIONS } from '../middleware/role-based-access';

/**
 * Returns default permissions for a given role
 * @param role The user role
 * @returns Default permissions JSON object for the role
 */
export function getDefaultPermissions(role: string): Record<string, any> {
  // Default to artist permissions if role is not found
  if (!DEFAULT_ROLE_PERMISSIONS[role]) {
    console.warn(`Role ${role} not found in DEFAULT_ROLE_PERMISSIONS, using 'artist' permissions`);
    role = 'artist';
  }
  
  return { ...DEFAULT_ROLE_PERMISSIONS[role] };
}

/**
 * Returns subscription limitations based on role
 * @param role The user role
 * @returns Subscription limits
 */
export function getSubscriptionLimits(role: string): {
  maxArtists: number;
  maxReleases: number;
  maxTracksPerMonth?: number;
} {
  const permissions = getDefaultPermissions(role);
  
  return {
    maxArtists: permissions.maxArtists || 1,
    maxReleases: permissions.maxReleases || 1,
    maxTracksPerMonth: role === 'free' ? 1 : undefined,
  };
}