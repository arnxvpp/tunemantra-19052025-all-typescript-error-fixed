/**
 * User type definition representing a user in the system
 * Focused on primary artists with subscription-based access
 */
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  phoneNumber: string | null;
  entityName: string | null;
  avatarUrl: string | null;
  role: 'admin' | 'label' | 'artist_manager' | 'artist' | 'team_member';
  permissions: UserPermissions;
  parentId: number | null; // For team members - ID of the parent user
  status: 'active' | 'pending' | 'pending_approval' | 'suspended' | 'rejected' | 'inactive';
  createdAt: string;
  subscriptionInfo?: SubscriptionInfo;
}

/**
 * User permissions interface
 */
export interface UserPermissions {
  canCreateReleases?: boolean;
  canManageArtists?: boolean;
  canViewAnalytics?: boolean;
  canManageDistribution?: boolean;
  canManageRoyalties?: boolean;
  canEditMetadata?: boolean;
  canAccessFinancials?: boolean;
  canInviteUsers?: boolean;
  [key: string]: boolean | undefined;
}

/**
 * Subscription information for a user
 */
export interface SubscriptionInfo {
  plan: 'label' | 'artist_manager' | 'artist' | 'free';
  status: 'active' | 'pending' | 'pending_approval' | 'canceled' | 'expired' | 'inactive' | 'rejected';
  startDate: Date;
  endDate: Date;
  paymentId?: string;
  features?: string[];
}