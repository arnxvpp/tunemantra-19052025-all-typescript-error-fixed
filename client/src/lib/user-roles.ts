import { User } from '@/types/user';

/**
 * Types of user roles in the system
 */
export type UserRole = 'admin' | 'label' | 'artist_manager' | 'artist' | 'team_member';

/**
 * Gets a friendly display name for a role
 * 
 * @param role The user role
 * @returns Human-readable role name
 */
export function getRoleName(role: UserRole | null | undefined): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'label':
      return 'Label';
    case 'artist_manager':
      return 'Artist Manager';
    case 'artist':
      return 'Artist';
    case 'team_member':
      return 'Team Member';
    default:
      return 'Unknown Role';
  }
}

/**
 * Compares roles to determine if one has higher privileges than another
 * 
 * @param roleA First role to compare
 * @param roleB Second role to compare
 * @returns true if roleA has higher or equal privileges to roleB
 */
export function hasHigherOrEqualRole(roleA: UserRole, roleB: UserRole): boolean {
  const rolePriority: Record<UserRole, number> = {
    'admin': 5,
    'label': 4,
    'artist_manager': 3,
    'artist': 2,
    'team_member': 1
  };
  
  return (rolePriority[roleA] || 0) >= (rolePriority[roleB] || 0);
}