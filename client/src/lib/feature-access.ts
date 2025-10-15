// Define feature categories
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

export type SubscriptionPlan = 'free' | 'artist' | 'artist_manager' | 'label';
export type SubscriptionStatus = 'active' | 'pending' | 'pending_approval' | 'canceled' | 'expired' | 'inactive' | 'rejected';
export type UserRole = 'admin' | 'label' | 'artist_manager' | 'artist' | 'team_member';

// Feature access map by plan
const FEATURE_ACCESS: Record<SubscriptionPlan, FeatureType[]> = {
  'free': [
    'analytics',  // Basic analytics
    'release_creation', // Limited releases
    'metadata_editing'
  ],
  'artist': [
    'analytics',
    'distribution',
    'export',
    'release_creation',
    'metadata_editing'
  ],
  'artist_manager': [
    'analytics',
    'distribution', 
    'export',
    'royalty_splitting',
    'team_management',
    'release_creation',
    'metadata_editing'
  ],
  'label': [
    'analytics',
    'distribution', 
    'export',
    'royalty_splitting',
    'bulk_processing',
    'team_management',
    'rights_management',
    'advanced_reporting',
    'release_creation',
    'metadata_editing'
  ]
};

// Feature access by role (overrides plan-based access when applicable)
const ROLE_FEATURE_ACCESS: Record<UserRole, { grant: FeatureType[], deny: FeatureType[] }> = {
  'admin': {
    grant: [
      'analytics',
      'distribution', 
      'export',
      'royalty_splitting',
      'bulk_processing',
      'team_management',
      'rights_management',
      'advanced_reporting',
      'release_creation',
      'metadata_editing'
    ],
    deny: []
  },
  'label': {
    grant: [
      'analytics',
      'distribution', 
      'export',
      'royalty_splitting',
      'bulk_processing',
      'team_management',
      'rights_management',
      'advanced_reporting',
      'release_creation',
      'metadata_editing'
    ],
    deny: []
  },
  'artist_manager': {
    grant: [
      'analytics',
      'distribution', 
      'export',
      'royalty_splitting',
      'team_management',
      'release_creation',
      'metadata_editing'
    ],
    deny: [
      'bulk_processing',
      'rights_management',
      'advanced_reporting'
    ]
  },
  'artist': {
    grant: [
      'analytics',
      'distribution',
      'export',
      'release_creation',
      'metadata_editing'
    ],
    deny: [
      'royalty_splitting',
      'bulk_processing',
      'team_management',
      'rights_management',
      'advanced_reporting'
    ]
  },
  'team_member': {
    grant: [
      'analytics',
      'distribution',
      'export',
      'metadata_editing'
    ],
    deny: [
      'royalty_splitting',
      'bulk_processing',
      'team_management',
      'rights_management',
      'advanced_reporting',
      'release_creation'
    ]
  }
};

// Usage limits by plan
export const USAGE_LIMITS: Record<SubscriptionPlan, {
  maxReleases: number | 'unlimited';
  maxArtists: number | 'unlimited';
  maxFileSize: number; // in MB
  maxTracks: number | 'unlimited';
}> = {
  'free': {
    maxReleases: 2,
    maxArtists: 1,
    maxFileSize: 100, // 100MB
    maxTracks: 20
  },
  'artist': {
    maxReleases: 'unlimited',
    maxArtists: 1,
    maxFileSize: 200, // 200MB
    maxTracks: 'unlimited'
  },
  'artist_manager': {
    maxReleases: 'unlimited',
    maxArtists: 10,
    maxFileSize: 500, // 500MB
    maxTracks: 'unlimited'
  },
  'label': {
    maxReleases: 'unlimited',
    maxArtists: 'unlimited',
    maxFileSize: 2000, // 2GB
    maxTracks: 'unlimited'
  }
};

/**
 * Checks if a user has access to a feature based on their subscription and role
 * @param plan The user's subscription plan
 * @param status The user's subscription status
 * @param feature The feature to check access for
 * @param role The user's role
 * @returns Whether the user has access to the specified feature
 */
export function hasFeatureAccess(
  plan: SubscriptionPlan | undefined,
  status: SubscriptionStatus | undefined,
  feature: FeatureType,
  role?: string | null
): boolean {
  // No access if no plan or inactive status
  if (!plan || !status) {
    return false;
  }
  
  // Only active subscriptions have access to features (except for admin)
  if (status !== 'active' && role !== 'admin') {
    return false;
  }
  
  // Role-based overrides for specific features
  if (role && (role as UserRole) && ROLE_FEATURE_ACCESS[role as UserRole]) {
    // First check for explicit denials
    if (ROLE_FEATURE_ACCESS[role as UserRole].deny.includes(feature)) {
      return false;
    }
    
    // Then check for explicit grants (which override plan permissions)
    if (ROLE_FEATURE_ACCESS[role as UserRole].grant.includes(feature)) {
      return true;
    }
  }
  
  // If no role-specific rule, fall back to plan-based permissions
  return FEATURE_ACCESS[plan].includes(feature);
}

/**
 * Get usage limit for a specific metric based on subscription plan
 * @param plan The user's subscription plan
 * @param metric The usage metric to check
 * @returns The usage limit for the specified metric
 */
export function getUsageLimit(
  plan: SubscriptionPlan | undefined,
  metric: keyof typeof USAGE_LIMITS.free
): number | 'unlimited' {
  if (!plan) {
    return USAGE_LIMITS.free[metric];
  }
  
  return USAGE_LIMITS[plan][metric];
}

/**
 * Format usage limit for display
 * @param limit The usage limit
 * @returns A formatted string for display
 */
export function formatUsageLimit(limit: number | 'unlimited'): string {
  if (limit === 'unlimited') {
    return 'Unlimited';
  }
  
  return limit.toString();
}

/**
 * Check if a user is below their usage limit
 * @param plan The user's subscription plan
 * @param metric The usage metric to check
 * @param currentUsage The current usage value
 * @returns Whether the user is below their usage limit
 */
export function isWithinUsageLimit(
  plan: SubscriptionPlan | undefined,
  metric: keyof typeof USAGE_LIMITS.free,
  currentUsage: number
): boolean {
  const limit = getUsageLimit(plan, metric);
  
  if (limit === 'unlimited') {
    return true;
  }
  
  return currentUsage < limit;
}