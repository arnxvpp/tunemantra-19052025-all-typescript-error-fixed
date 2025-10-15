import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './use-auth';
import type { User } from '@/types/user'; // Import User type if needed for subscriptionInfo structure

// Feature types that require permission checks
export type FeatureType = 
  | 'distribution'
  | 'analytics' 
  | 'royalty_splitting'
  | 'bulk_processing'
  | 'export'
  | 'team_management'
  | 'rights_management'
  | 'advanced_reporting'
  | 'release_creation'
  | 'metadata_editing';

// Usage limit metrics
type UsageLimitMetric = 'maxReleases' | 'maxArtists' | 'maxFileSize' | 'maxTracks';

// Subscription plan types (Assuming 'label_admin' is the correct type for label plans)
export type SubscriptionPlan = 'free' | 'artist' | 'artist_manager' | 'label_admin'; 

// User role types (Align with actual user roles from useAuth/schema)
export type UserRole = 'admin' | 'label' | 'artist_manager' | 'artist' | 'team_member'; 

// Usage limits for different subscription plans
export const USAGE_LIMITS: Record<SubscriptionPlan, {
  maxReleases: number | 'unlimited',
  maxArtists: number | 'unlimited',
  maxFileSize: number | 'unlimited', // in MB
  maxTracks: number | 'unlimited',
  features: FeatureType[]
}> = {
  free: {
    maxReleases: 3,
    maxArtists: 1,
    maxFileSize: 100,
    maxTracks: 20,
    features: ['release_creation', 'metadata_editing']
  },
  artist: {
    maxReleases: 20,
    maxArtists: 1,
    maxFileSize: 500,
    maxTracks: 100,
    features: [
      'release_creation', 
      'metadata_editing', 
      'distribution', 
      'analytics'
    ]
  },
  artist_manager: {
    maxReleases: 50,
    maxArtists: 10,
    maxFileSize: 1000,
    maxTracks: 500,
    features: [
      'release_creation', 
      'metadata_editing', 
      'distribution', 
      'analytics', 
      'team_management',
      'royalty_splitting',
      'export'
    ]
  },
  label_admin: { // Changed from 'label' to 'label_admin' to match type
    maxReleases: 'unlimited',
    maxArtists: 'unlimited',
    maxFileSize: 'unlimited',
    maxTracks: 'unlimited',
    features: [
      'release_creation', 
      'metadata_editing', 
      'distribution', 
      'analytics', 
      'team_management',
      'royalty_splitting',
      'export',
      'bulk_processing',
      'rights_management',
      'advanced_reporting'
    ]
  }
};

// FeatureAccess context interface
interface FeatureAccessContextType {
  canAccess: (feature: FeatureType) => boolean;
  getUsageLimit: (metric: UsageLimitMetric) => number | 'unlimited';
  isWithinUsageLimit: (metric: UsageLimitMetric, currentUsage: number) => boolean;
  formatUsageLimit: (limit: number | 'unlimited') => string;
  getSubscriptionPlan: () => SubscriptionPlan | null;
  getRole: () => UserRole | null;
  getRoleName: () => string;
  isPendingApproval: () => boolean;
  hasActiveSubscription: () => boolean;
  getPlanName: () => string;
}

// Create context with default values
const FeatureAccessContext = createContext<FeatureAccessContextType>({
  canAccess: () => false,
  getUsageLimit: () => 0,
  isWithinUsageLimit: () => false,
  formatUsageLimit: () => '0',
  getSubscriptionPlan: () => null,
  getRole: () => null,
  getRoleName: () => 'User',
  isPendingApproval: () => false,
  hasActiveSubscription: () => false,
  getPlanName: () => 'Free'
});

// Provider component for feature access
export function FeatureAccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Determine subscription plan from user info
  const getSubscriptionPlan = (): SubscriptionPlan | null => {
    if (!user) return null;
    
    // If user has subscription info, use that (add explicit check)
    // Ensure the plan value matches the SubscriptionPlan type
    if (user.subscriptionInfo && user.subscriptionInfo.plan && 
        ['free', 'artist', 'artist_manager', 'label_admin'].includes(user.subscriptionInfo.plan)) {
      return user.subscriptionInfo.plan as SubscriptionPlan; // Type assertion
    }
    
    // Otherwise, infer from role
    switch (user.role) {
      case 'admin': // Use 'admin' instead of 'super_admin'
         return 'label_admin'; // Admins likely have label_admin plan equivalent
      case 'label':
        return 'label_admin'; // Return 'label_admin' to match SubscriptionPlan type
      case 'artist_manager':
        return 'artist_manager';
      case 'artist':
        return 'artist';
      case 'team_member': // Team members inherit, but default to free if no parent info? Or null?
        // TODO: Implement logic for team member plan inheritance if needed
        return 'free'; // Defaulting to free for now
      default:
        return 'free';
    }
  };
  
  // Get user role
  const getRole = (): UserRole | null => {
    if (!user) return null;
    // Ensure the returned role is compatible with the UserRole type
    if (['admin', 'label', 'artist_manager', 'artist', 'team_member'].includes(user.role)) {
       return user.role as UserRole;
    }
    return null; // Return null if role is unexpected
  };
  
  // Get formatted role name for display
  const getRoleName = (): string => {
    const role = getRole();
    if (!role) return 'User';
    
    switch (role) {
      case 'admin': // Use 'admin'
        return 'Administrator';
      case 'label':
        return 'Label Administrator';
      case 'artist_manager':
        return 'Artist Manager';
      case 'artist':
        return 'Artist';
      case 'team_member': // Add team_member case
        return 'Team Member';
      default:
        return 'User';
    }
  };
  
  // Get formatted plan name for display
  const getPlanName = (): string => {
    const plan = getSubscriptionPlan();
    if (!plan) return 'Free';
    
    switch (plan) {
      case 'label_admin': // Use 'label_admin'
        return 'Label Admin';
      case 'artist_manager':
        return 'Artist Manager';
      case 'artist':
        return 'Artist';
      case 'free':
      default:
        return 'Free';
    }
  };
  
  // Check if the user's subscription is in pending approval state
  const isPendingApproval = (): boolean => {
    if (!user) return false;
    // Handle potential undefined status with ?? false
    const subStatusPending = (user.subscriptionInfo && user.subscriptionInfo.status === 'pending_approval') ?? false;
    return user.status === 'pending_approval' || subStatusPending; 
  };
  
  // Check if the user has an active subscription
  const hasActiveSubscription = (): boolean => {
    if (!user) return false;
     // Handle potential undefined status with ?? false
    const subStatusActive = (user.subscriptionInfo && user.subscriptionInfo.status === 'active') ?? false;
    return user.status === 'active' || subStatusActive;
  };
  
  // Check if user has access to a feature
  const canAccess = (feature: FeatureType): boolean => {
    // Admins always have access to all features
    if (user?.role === 'admin') return true; 
    
    // Need to have an active subscription (use the function)
    if (!hasActiveSubscription()) return false; 
    
    const plan = getSubscriptionPlan();
    if (!plan) return false;
    
    // Check if the feature is included in the plan
    // Ensure USAGE_LIMITS has an entry for the current plan
    if (!USAGE_LIMITS[plan]) return false; 
    return USAGE_LIMITS[plan].features.includes(feature);
  };
  
  // Get usage limit for a specific metric
  const getUsageLimit = (metric: UsageLimitMetric): number | 'unlimited' => {
    const plan = getSubscriptionPlan();
    if (!plan || !USAGE_LIMITS[plan]) return 0; // Handle case where plan might not be in USAGE_LIMITS
    
    return USAGE_LIMITS[plan][metric];
  };
  
  // Format usage limit for display
  const formatUsageLimit = (limit: number | 'unlimited'): string => {
    if (limit === 'unlimited') return 'Unlimited';
    return limit.toString();
  };
  
  // Check if usage is within limits
  const isWithinUsageLimit = (metric: UsageLimitMetric, currentUsage: number): boolean => {
    const limit = getUsageLimit(metric);
    if (limit === 'unlimited') return true;
    return currentUsage < limit;
  };
  
  // Context value
  const value: FeatureAccessContextType = {
    canAccess,
    getUsageLimit,
    isWithinUsageLimit,
    formatUsageLimit,
    getSubscriptionPlan,
    getRole,
    getRoleName,
    isPendingApproval,
    hasActiveSubscription,
    getPlanName
  };
  
  return (
    <FeatureAccessContext.Provider value={value}>
      {children}
    </FeatureAccessContext.Provider>
  );
}

// Hook for using feature access
export const useFeatureAccess = () => useContext(FeatureAccessContext);