import React, { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { hasHigherOrEqualRole } from '@/lib/user-roles';
import type { User } from '@/types/user';

interface RoleBasedContentProps {
  /**
   * Content to display when the user has the required role
   */
  children: ReactNode;
  
  /**
   * Specific roles that can access this content
   */
  allowedRoles?: Array<'admin' | 'label' | 'artist_manager' | 'artist'>;
  
  /**
   * Minimum role level required (content will be shown to this role and all higher roles)
   */
  minRole?: 'admin' | 'label' | 'artist_manager' | 'artist';
  
  /**
   * Content to show when user doesn't have permission (optional)
   */
  fallback?: ReactNode;
  
  /**
   * Specific required permission (alternatively to role-based check)
   */
  requiredPermission?: string;
  
  /**
   * Additional custom authorization function
   */
  authorize?: (user: User | null) => boolean;
}

/**
 * Component that conditionally renders content based on user role and subscription
 * This is a simplified version focused purely on primary artists and their subscription tiers
 */
export function RoleBasedContent({
  children,
  allowedRoles,
  minRole,
  fallback = null,
  requiredPermission,
  authorize,
}: RoleBasedContentProps) {
  const { user } = useAuth();
  
  if (!user) {
    return <>{fallback}</>;
  }
  
  // Handle null/undefined role safely with a primary artist default
  const userRole = user.role || 'artist';
  
  // Create a safe permissions object to avoid undefined errors
  const defaultPermissions = { 
    canCreateReleases: false,
    canManageArtists: false,
    canViewAnalytics: false,
    canManageDistribution: false,
    canManageRoyalties: false,
    canEditMetadata: false,
    canAccessFinancials: false,
    canInviteUsers: false
  };
  
  const permissions = user.permissions ? { ...defaultPermissions, ...user.permissions } : defaultPermissions;
  
  // Check specific permission if provided
  if (requiredPermission) {
    // Use a safer approach to check permissions that works with index signatures
    const permissionValue = permissions as Record<string, boolean>;
    const hasPermission = !!permissionValue[requiredPermission];
    if (!hasPermission) {
      return <>{fallback}</>;
    }
  }
  
  // Check allowed roles list
  if (allowedRoles && allowedRoles.length > 0) {
    // Use type assertion for type safety
    const validRole = userRole as 'admin' | 'label' | 'artist_manager' | 'artist';
    if (!allowedRoles.includes(validRole)) {
      return <>{fallback}</>;
    }
  }
  
  // Check minimum role requirement
  if (minRole) {
    // Use type assertion for type safety
    const validRole = userRole as 'admin' | 'label' | 'artist_manager' | 'artist';
    if (!hasHigherOrEqualRole(validRole, minRole)) {
      return <>{fallback}</>;
    }
  }
  
  // Run custom authorization function if provided
  if (authorize) {
    try {
      // createdAt is already a string according to the User type definition
      const createdAtString = user.createdAt;
      
      // Create a proper User object that matches the expected interface
      const authUser: User = {
        id: user.id,
        username: user.username,
        email: user.email || '',
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        entityName: user.entityName,
        avatarUrl: user.avatarUrl,
        role: userRole as 'admin' | 'label' | 'artist_manager' | 'artist', 
        permissions: permissions as any, // We've already created a safe permissions object
        parentId: null, // No concept of team members, so parentId is always null
        status: user.status || 'active',
        createdAt: createdAtString,
        subscriptionInfo: user.subscriptionInfo
      };
      
      if (!authorize(authUser)) {
        return <>{fallback}</>;
      }
    } catch (error) {
      console.error('Error in custom authorization function:', error);
      return <>{fallback}</>;
    }
  }
  
  // All checks passed
  return <>{children}</>;
}

export default RoleBasedContent;