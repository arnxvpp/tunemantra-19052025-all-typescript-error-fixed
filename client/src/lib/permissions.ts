// Types for the user permissions system
type UserRole = 'admin' | 'artist' | 'label' | 'artist_manager' | 'team_member' | 'distributor' | 'super_admin' | string;

type Permission = 
  // Catalog management
  | 'catalog.view'
  | 'catalog.create'
  | 'catalog.edit'
  | 'catalog.delete'
  
  // Rights management
  | 'rights.view'
  | 'rights.create'
  | 'rights.edit'
  | 'rights.delete'
  
  // Distribution
  | 'distribution.view'
  | 'distribution.create'
  | 'distribution.edit'
  | 'distribution.delete'
  
  // Analytics
  | 'analytics.view'
  | 'analytics.export'
  
  // Team management
  | 'team.view'
  | 'team.create'
  | 'team.edit'
  | 'team.delete'
  
  // Settings
  | 'settings.view'
  | 'settings.edit'
  
  // Admin capabilities
  | 'admin.view'
  | 'admin.edit'
  | 'admin.users.manage'
  | 'admin.content.moderate'
  | 'admin.settings.manage'
  
  // Default permission for any other string
  | string;

// Default permissions for each role
const rolePermissions: Record<UserRole, Permission[]> = {
  'super_admin': [
    // Super admin has all permissions
    'catalog.view', 'catalog.create', 'catalog.edit', 'catalog.delete',
    'rights.view', 'rights.create', 'rights.edit', 'rights.delete',
    'distribution.view', 'distribution.create', 'distribution.edit', 'distribution.delete',
    'analytics.view', 'analytics.export',
    'team.view', 'team.create', 'team.edit', 'team.delete',
    'settings.view', 'settings.edit',
    'admin.view', 'admin.edit', 'admin.users.manage', 'admin.content.moderate', 'admin.settings.manage'
  ],
  'admin': [
    // Platform admin
    'catalog.view', 'catalog.create', 'catalog.edit', 'catalog.delete',
    'rights.view', 'rights.create', 'rights.edit', 'rights.delete',
    'distribution.view', 'distribution.create', 'distribution.edit', 'distribution.delete',
    'analytics.view', 'analytics.export',
    'team.view', 'team.create', 'team.edit', 'team.delete',
    'settings.view', 'settings.edit',
    'admin.view', 'admin.edit', 'admin.users.manage', 'admin.content.moderate', 'admin.settings.manage'
  ],
  'label': [
    // Label administrator
    'catalog.view', 'catalog.create', 'catalog.edit', 'catalog.delete',
    'rights.view', 'rights.create', 'rights.edit', 'rights.delete',
    'distribution.view', 'distribution.create', 'distribution.edit', 'distribution.delete',
    'analytics.view', 'analytics.export',
    'team.view', 'team.create', 'team.edit', 'team.delete',
    'settings.view', 'settings.edit'
  ],
  'artist_manager': [
    // Artist manager
    'catalog.view', 'catalog.create', 'catalog.edit',
    'rights.view', 'rights.create', 'rights.edit',
    'distribution.view', 'distribution.create', 'distribution.edit',
    'analytics.view', 'analytics.export',
    'team.view', 'team.edit',
    'settings.view', 'settings.edit'
  ],
  'artist': [
    // Individual artist
    'catalog.view', 'catalog.create', 'catalog.edit',
    'rights.view', 'rights.create', 'rights.edit',
    'distribution.view', 'distribution.create',
    'analytics.view', 'analytics.export',
    'settings.view', 'settings.edit'
  ],
  'team_member': [
    // Team member with restricted access
    'catalog.view',
    'rights.view',
    'distribution.view',
    'analytics.view',
    'settings.view'
  ],
  'distributor': [
    // Distribution partner
    'catalog.view',
    'distribution.view', 'distribution.create', 'distribution.edit',
    'analytics.view',
    'settings.view', 'settings.edit'
  ]
};

/**
 * Check if a user has a specific permission
 * 
 * During development, we'll allow all permissions for testing purposes
 */
export function hasPermission(
  userRole: UserRole | null | undefined,
  permission: Permission,
  userPermissions?: Record<string, boolean>
): boolean {
  // For testing purposes in development, allow most permissions
  if (process.env.NODE_ENV === 'development') {
    // Only restrict admin settings
    if (typeof permission === 'string' && 
        permission.startsWith && 
        permission.startsWith('admin.') && 
        userRole !== 'admin' && 
        userRole !== 'super_admin') {
      // Only allow admins to access admin functions even in development
      return false;
    }
    // Allow all other permissions in development
    return true;
  }

  // Check if user has explicit permission in their user object
  if (userPermissions && permission && userPermissions[permission] === true) {
    return true;
  }

  // If no role, no permissions
  if (!userRole) {
    return false;
  }

  // Check if role exists in our permissions map
  if (!(userRole in rolePermissions)) {
    return false;
  }

  // Check if the role has the requested permission
  return rolePermissions[userRole].includes(permission);
}

/**
 * Get all permissions for a given role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: UserRole | null | undefined,
  permissions: Permission[],
  userPermissions?: Record<string, boolean>
): boolean {
  return permissions.some(permission => hasPermission(userRole, permission, userPermissions));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  userRole: UserRole | null | undefined,
  permissions: Permission[],
  userPermissions?: Record<string, boolean>
): boolean {
  return permissions.every(permission => hasPermission(userRole, permission, userPermissions));
}