import { Request, Response, NextFunction, RequestHandler } from "express";
import { db } from "../db";
import { eq, sql } from "drizzle-orm";
// Remove superAdmins import as it's deprecated
import { users, releases, tracks } from "@shared/schema";

// Define permission structure
interface RolePermissions {
  canCreateReleases: boolean;
  canManageArtists: boolean;
  canViewAnalytics: boolean;
  canManageDistribution: boolean;
  canManageRoyalties: boolean;
  canEditMetadata: boolean;
  canAccessFinancials: boolean;
  canInviteUsers: boolean;
  maxArtists?: number;
  maxReleases?: number;
  canManageUsers?: boolean;
  canManageSubscriptions?: boolean;
  canAccessAdminPanel?: boolean;
  canViewAllContent?: boolean;
  canViewAllReports?: boolean;
}

// Default permission definitions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  admin: {
    canCreateReleases: true,
    canManageArtists: true,
    canViewAnalytics: true,
    canManageDistribution: true,
    canManageRoyalties: true,
    canEditMetadata: true,
    canAccessFinancials: true,
    canInviteUsers: true,
    canManageUsers: true,
    canManageSubscriptions: true,
    canAccessAdminPanel: true,
    canViewAllContent: true,
    canViewAllReports: true,
    maxArtists: Infinity,
    maxReleases: Infinity
  },
  label: {
    canCreateReleases: true,
    canManageArtists: true, 
    canViewAnalytics: true,
    canManageDistribution: true,
    canManageRoyalties: true,
    canEditMetadata: true,
    canAccessFinancials: true,
    canInviteUsers: true,
    maxArtists: Infinity, // Unlimited artists
    maxReleases: Infinity // Unlimited releases
  },
  artist_manager: {
    canCreateReleases: true,
    canManageArtists: true,
    canViewAnalytics: true,
    canManageDistribution: true,
    canManageRoyalties: false,
    canEditMetadata: true,
    canAccessFinancials: true, 
    canInviteUsers: false,
    maxArtists: 10,  // Up to 10 artists
    maxReleases: Infinity // Unlimited releases
  },
  artist: {
    canCreateReleases: true,
    canManageArtists: false,
    canViewAnalytics: true,
    canManageDistribution: true,
    canManageRoyalties: false,
    canEditMetadata: true,
    canAccessFinancials: true,
    canInviteUsers: false,
    maxArtists: 1,   // Just themselves (as primary artist)
    maxReleases: Infinity // Unlimited releases
  },
  team_member: {
    canCreateReleases: false,
    canManageArtists: false,
    canViewAnalytics: true,
    canManageDistribution: false,
    canManageRoyalties: false,
    canEditMetadata: true,
    canAccessFinancials: false,
    canInviteUsers: false,
    maxArtists: 0,   // Team members are not counted as primary artists
    maxReleases: Infinity   // Team members share the release limit of the primary artist/label they work for
  }
};

// Default subscription plans with detailed limits
export const SUBSCRIPTION_PLANS = {
  label: {
    name: "Label Plan",
    maxArtists: Infinity, // Unlimited
    maxReleasesPerYear: Infinity, // Unlimited releases per year
    maxTracksPerYear: Infinity, // Unlimited tracks per year
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    yearlyPriceInINR: 6000,
    features: [
      "Unlimited primary artists",
      "Unlimited releases and tracks per year",
      "Manage sub-labels",
      "Team management",
      "Advanced royalty splits",
      "Priority support"
    ]
  },
  artist_manager: {
    name: "Artist Manager Plan",
    maxArtists: 10,
    maxReleasesPerYear: Infinity, // Unlimited releases per year
    maxTracksPerYear: Infinity, // Unlimited tracks per year
    maxFileSize: 500 * 1024 * 1024, // 500MB
    yearlyPriceInINR: 2499,
    features: [
      "Up to 10 primary artists",
      "Unlimited releases and tracks per year",
      "Artist management",
      "Content approval",
      "Analytics access"
    ]
  },
  artist: {
    name: "Artist Plan",
    maxArtists: 1,
    maxReleasesPerYear: Infinity, // Unlimited releases per year
    maxTracksPerYear: Infinity, // Unlimited tracks per year
    maxFileSize: 200 * 1024 * 1024, // 200MB
    yearlyPriceInINR: 999, 
    features: [
      "1 primary artist",
      "Unlimited releases and tracks per year",
      "Basic analytics",
      "Distribution management"
    ]
  },
  free: {
    name: "Free Trial",
    maxArtists: 1,
    maxReleasesPerMonth: 1, // 1 release per month
    maxTracksPerMonth: 1, // 1 track per month
    maxFileSize: 50 * 1024 * 1024, // 50MB
    yearlyPriceInINR: 0,
    features: [
      "1 primary artist",
      "1 release and 1 track per month",
      "Basic analytics",
      "7-day trial"
    ]
  }
};

// Middleware to check if user is authenticated and has the required role
export const requireRole = (allowedRoles: string[]): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // First check if user is an admin (they bypass all role checks)
      if (req.user?.role === 'admin') {
        return next();
      }

      // Check if user has one of the allowed roles
      if (req.user?.role && allowedRoles.includes(req.user.role)) {
        return next();
      }

      res.status(403).json({ error: "You don't have permission to access this resource" });
    } catch (error) {
      console.error("Error checking role permissions:", error);
      res.status(500).json({ error: "Server error" });
    }
  };
};

// Permission-based middleware
export const requirePermission = (permission: string): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Admins have all permissions
      if (req.user?.role === 'admin') {
        return next();
      }

      // Get user permissions
      const userPermissions = req.user?.permissions || {};
      const rolePermissions = DEFAULT_ROLE_PERMISSIONS[req.user?.role as keyof typeof DEFAULT_ROLE_PERMISSIONS] || {};
      
      // Check permission from user's specific permissions or role's default permissions
      if (userPermissions[permission as keyof typeof userPermissions] === true || 
          rolePermissions[permission as keyof typeof rolePermissions] === true) {
        return next();
      }
      
      res.status(403).json({ error: `You don't have the required permission: ${permission}` });
    } catch (error) {
      console.error("Error checking permissions:", error);
      res.status(500).json({ error: "Server error" });
    }
  };
};

// Only allow users to access their own resources or those they have permission to access
export const resourceAccessControl = (resourceType: 'artist' | 'release' | 'track'): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const resourceId = parseInt(req.params.id, 10);
    if (!resourceId || isNaN(resourceId)) {
      return res.status(400).json({ error: "Invalid resource ID" });
    }

    try {
      // Admins can access all resources
      if (req.user?.role === 'admin') {
        return next();
      }

      // Labels and artist managers can access resources of artists under them
      if (['label', 'artist_manager'].includes(req.user?.role || '')) {
        // For label and manager, we would need to check if the resource belongs to their artists
        // This would require a query to determine if the resourceId is linked to an artist under this manager/label
        // For now we'll implement a simplified version
        
        if (resourceType === 'artist') {
          // Check if this artist is managed by this user
          const artistUser = await db.query.users.findFirst({
            where: eq(users.id, resourceId)
          });
          
          if (artistUser && artistUser.parentId === req.user?.id) {
            return next();
          }
        } else if (resourceType === 'release' || resourceType === 'track') {
          // This would require joining tables to check ownership
          // Simplified for now - we'd need to check if the release/track belongs to an artist under this user
          
          // For demo purposes, allowing access:
          return next();
        }
      }

      // Artists can only access their own resources
      if (req.user?.role === 'artist') {
        if (resourceType === 'artist' && resourceId === req.user?.id) {
          return next();
        } else if (resourceType === 'release' || resourceType === 'track') {
          // Check if the release/track belongs to this artist
          // This would require a query to the database
          
          // For demo purposes, allowing access if resourceId matches user's id:
          if (resourceId === req.user?.id) {
            return next();
          }
        }
      }

      res.status(403).json({ error: "You don't have permission to access this resource" });
    } catch (error) {
      console.error("Error checking resource access:", error);
      res.status(500).json({ error: "Server error" });
    }
  };
};

// Middleware to ensure user is a super admin
export const requireSuperAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Check if user is an admin
    if (req.user?.role === 'admin') {
      return next();
    }
    
    // For development purposes, temporarily allow all authenticated users 
    // to access admin features (remove this in production)
    if (process.env.NODE_ENV !== "production") {
      console.warn("DEV MODE: Bypassing super admin check in development");
      return next();
    }

    res.status(403).json({ error: "Super admin access required" });
  } catch (error) {
    console.error("Error checking super admin status:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Check subscription status (active/expired)
// Middleware to ensure user is an admin or super_admin
export const ensureAdmin: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Check if user is an admin
    if (req.user?.role === 'admin') { // Remove super_admin check
      return next();
    }
    
    // For development purposes, temporarily allow all authenticated users 
    // to access admin features (remove this in production)
    if (process.env.NODE_ENV !== "production") {
      console.warn("DEV MODE: Bypassing admin check in development");
      return next();
    }

    res.status(403).json({ error: "Admin access required" });
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const checkSubscription: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Admins bypass subscription checks
    if (req.user?.role === 'admin') {
      return next();
    }

    // Check if user has an active subscription
    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user?.id || 0)
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check subscription end date if it exists
    if (user.subscriptionEndDate && new Date(user.subscriptionEndDate) < new Date()) {
      return res.status(402).json({ 
        error: "Subscription expired", 
        message: "Your subscription has expired. Please renew to continue using premium features."
      });
    }

    // Check for pending approval status
    const subscriptionInfo = user.subscriptionInfo as any;
    if (subscriptionInfo && subscriptionInfo.status === 'pending_approval') {
      // Only allow access to basic pages, but restrict premium features
      const restrictedPaths = [
        '/api/releases', 
        '/api/tracks',
        '/api/catalog',
        '/api/distribution',
        '/api/analytics',
        '/api/royalties'
      ];
      
      // Check if the current request path contains any of the restricted paths
      const isRestricted = restrictedPaths.some(path => req.path.includes(path));
      
      if (isRestricted) {
        return res.status(402).json({
          error: "Subscription pending approval",
          message: "Your subscription is pending approval. Once approved, you'll have access to all features."
        });
      }
    }

    // For a free user, limit their access
    if (!subscriptionInfo || subscriptionInfo.plan === 'free') {
      // For free users, we might want to limit some operations
      // You could add specific checks here based on the request path or operation

      // For now, we'll just pass through
      return next();
    }

    // User has active subscription, proceed
    next();
  } catch (error) {
    console.error("Error checking subscription:", error);
    res.status(500).json({ error: "Server error" });
  }
};

/**
 * Count the number of artists managed by a user
 * @param userId User ID to check
 * @returns Number of artists managed by this user
 */
async function countManagedArtists(userId: number): Promise<number> {
  try {
    // Find all users with this user as their parent (these are the artists they manage)
    const result = await db.select({ count: sql`count(*)` })
      .from(users)
      .where(eq(users.parentId, userId));
    
    if (result.length === 0) return 0;
    
    return Number(result[0].count) || 0;
  } catch (error) {
    console.error("Error counting managed artists:", error);
    return 0;
  }
}

/**
 * Count the number of releases created by a user
 * @param userId User ID to check
 * @returns Number of releases created by this user
 */
async function countUserReleases(userId: number): Promise<number> {
  try {
    // Count all releases where userId matches
    const result = await db.select({ count: sql`count(*)` })
      .from(releases)
      .where(eq(releases.userId, userId));
    
    if (result.length === 0) return 0;
    
    return Number(result[0].count) || 0;
  } catch (error) {
    console.error("Error counting user releases:", error);
    return 0;
  }
}

/**
 * Count the number of tracks in a specific release
 * @param releaseId Release ID to check
 * @returns Number of tracks in this release
 */
async function countReleaseTracks(releaseId: number): Promise<number> {
  try {
    // Count all tracks where releaseId matches
    const result = await db.select({ count: sql`count(*)` })
      .from(tracks)
      .where(eq(tracks.releaseId, releaseId));
    
    if (result.length === 0) return 0;
    
    return Number(result[0].count) || 0;
  } catch (error) {
    console.error("Error counting release tracks:", error);
    return 0;
  }
}

/**
 * Get calculated subscription limits for a user based on their role and subscription
 * @param user User object
 * @returns Object containing calculated limits for different features
 */
function getUserLimits(user: any): { 
  maxArtists: number;
  maxReleases: number;
  maxTracksPerRelease: number;
  maxFileSize: number;
  maxReleasesPending: number;
  isYearlyLimit: boolean;
  isMonthlyLimit: boolean;
} {
  // Get role-based limits
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role as string] || {};
  
  // Get subscription-based limits
  const subscriptionInfo = user.subscriptionInfo as Record<string, any>;
  const subscriptionPlan = subscriptionInfo?.plan || 'free';
  const planDetails = SUBSCRIPTION_PLANS[subscriptionPlan as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;
  
  const isFreePlan = subscriptionPlan === 'free';
  const isYearlyLimit = !isFreePlan; // All paid plans use yearly limits
  const isMonthlyLimit = isFreePlan; // Free plan uses monthly limits
  
  // Convert per-year/per-month limits to absolute limits
  // We'll calculate these based on how long the user has been subscribed
  let adjustedReleaseLimit = Infinity;
  let adjustedTrackLimit = Infinity;
  
  // Calculate release limits based on plan type
  if (isFreePlan && 'maxReleasesPerMonth' in planDetails) {
    // For free plans, use monthly limits
    adjustedReleaseLimit = planDetails.maxReleasesPerMonth;
  } else if ('maxReleasesPerYear' in planDetails) {
    // For paid plans, use yearly limits
    adjustedReleaseLimit = planDetails.maxReleasesPerYear;
  }
  
  // Determine track limits
  let maxTracksPerRelease = Infinity;
  if (isFreePlan && 'maxTracksPerMonth' in planDetails) {
    maxTracksPerRelease = planDetails.maxTracksPerMonth;
  } else if ('maxTracksPerYear' in planDetails) {
    // Since we now have unlimited tracks per year, this is effectively unlimited per release
    maxTracksPerRelease = Infinity;
  }
  
  // Combine limits, using the most permissive between role and subscription
  return {
    maxArtists: Math.max(
      rolePermissions.maxArtists || 1, 
      subscriptionInfo?.maxArtists || planDetails.maxArtists || 1
    ),
    maxReleases: adjustedReleaseLimit,
    maxTracksPerRelease,
    maxFileSize: subscriptionInfo?.maxFileSize || 
                 (subscriptionPlan === 'free' ? 50 * 1024 * 1024 : // 50MB
                  subscriptionPlan === 'artist' ? 200 * 1024 * 1024 : // 200MB
                  subscriptionPlan === 'artist_manager' ? 500 * 1024 * 1024 : // 500MB
                  2 * 1024 * 1024 * 1024), // 2GB for label
    maxReleasesPending: subscriptionInfo?.maxReleasesPending ||
                        (subscriptionPlan === 'free' ? 1 :
                         subscriptionPlan === 'artist' ? 5 :
                         subscriptionPlan === 'artist_manager' ? 20 : Infinity),
    isYearlyLimit,
    isMonthlyLimit
  };
}

// Enhanced middleware to check feature limits based on subscription
export const checkFeatureLimits = (featureType: 'artists' | 'releases' | 'tracks' | 'fileSize'): RequestHandler => {
  return async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      // Admins bypass all limits
      if (req.user?.role === 'admin') { // Change 'super_admin' to 'admin'
        return next();
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user?.id || 0)
      });

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // If user is a team member, get the associated primary artist/label instead
      let limitUser = user;
      if (user.role === 'team_member' && user.parentId) {
        const primaryUser = await db.query.users.findFirst({
          where: eq(users.id, user.parentId)
        });
        
        if (primaryUser) {
          // Use the primary artist's/label's limits instead
          limitUser = primaryUser;
          console.log(`Using primary user (${primaryUser.username}) limits for team member ${user.username}`);
        }
      }

      // Get calculated limits based on the appropriate user (primary artist or the user themselves)
      const limits = getUserLimits(limitUser);
      
      if (featureType === 'artists') {
        // Check if user is trying to add a new artist
        // For team members, this is based on the primary user
        const countUserId = user.role === 'team_member' && user.parentId ? user.parentId : user.id;
        const currentCount = await countManagedArtists(countUserId);
        
        if (currentCount >= limits.maxArtists) {
          const limitType = limits.isMonthlyLimit ? "per month" : "per year";
          const subscriptionInfo = limitUser.subscriptionInfo as any || {};
          const planName = subscriptionInfo.plan || 'free';
          const planDisplayName = planName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          return res.status(403).json({ 
            error: "Subscription limit reached", 
            message: user.role === 'team_member' 
              ? `Your primary artist/label has reached their limit of ${limits.maxArtists} artists on the ${planDisplayName} plan. Please ask them to upgrade the plan to add more.`
              : `You've reached your limit of ${limits.maxArtists} artists ${limitType}. Please upgrade your plan to add more.`,
            limit: limits.maxArtists,
            current: currentCount,
            limitType: limitType,
            upgradeOptions: getUpgradeOptions(limitUser.role as string, 'artists')
          });
        }
      } 
      else if (featureType === 'releases') {
        // Check if user is trying to add a new release
        // For team members working on behalf of a primary artist, count releases against the primary
        const effectiveUserId = user.role === 'team_member' && user.parentId ? user.parentId : user.id;
        const currentCount = await countUserReleases(effectiveUserId);
        
        if (limits.maxReleases !== Infinity && currentCount >= limits.maxReleases) {
          const limitType = limits.isMonthlyLimit ? "per month" : "per year";
          const subscriptionInfo = limitUser.subscriptionInfo as any || {};
          const planName = subscriptionInfo.plan || 'free';
          const planDisplayName = planName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          return res.status(403).json({ 
            error: "Subscription limit reached", 
            message: user.role === 'team_member' 
              ? `Your primary artist/label has reached their limit of ${limits.maxReleases} releases on the ${planDisplayName} plan. Please ask them to upgrade the plan to add more.`
              : `You've reached your limit of ${limits.maxReleases} releases ${limitType}. Please upgrade your plan to add more.`,
            limit: limits.maxReleases,
            current: currentCount,
            limitType: limitType,
            upgradeOptions: getUpgradeOptions(limitUser.role as string, 'releases')
          });
        }
      }
      else if (featureType === 'tracks') {
        // Check track count for a release
        const releaseId = parseInt(req.params.releaseId || req.body.releaseId, 10);
        if (!releaseId || isNaN(releaseId)) {
          // If we can't determine the release, let it pass (will be caught elsewhere)
          return next();
        }
        
        // Count tracks for this release
        const trackCount = await countReleaseTracks(releaseId);
        
        if (trackCount >= limits.maxTracksPerRelease) {
          const limitType = limits.isMonthlyLimit ? "per month" : "per year";
          const subscriptionInfo = limitUser.subscriptionInfo as any || {};
          const planName = subscriptionInfo.plan || 'free';
          const planDisplayName = planName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          return res.status(403).json({
            error: "Subscription limit reached",
            message: user.role === 'team_member' 
              ? `Your primary artist/label has reached their limit of ${limits.maxTracksPerRelease} tracks on the ${planDisplayName} plan. Please ask them to upgrade the plan to add more.`
              : `You've reached your limit of ${limits.maxTracksPerRelease} tracks ${limitType}. Please upgrade your plan to add more.`,
            limit: limits.maxTracksPerRelease,
            current: trackCount,
            limitType: limitType,
            upgradeOptions: getUpgradeOptions(limitUser.role as string, 'tracks')
          });
        }
      }
      else if (featureType === 'fileSize') {
        // Check file size limit for uploads
        const fileSize = req.file?.size || req.body?.fileSize || 0;
        
        if (fileSize > limits.maxFileSize) {
          const limitInMB = Math.round(limits.maxFileSize / (1024 * 1024));
          const fileSizeMB = Math.round(fileSize / (1024 * 1024));
          const limitType = limits.isMonthlyLimit ? "per month" : "per year";
          const subscriptionInfo = limitUser.subscriptionInfo as any || {};
          const planName = subscriptionInfo.plan || 'free';
          const planDisplayName = planName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          
          return res.status(403).json({
            error: "Subscription limit reached",
            message: user.role === 'team_member' 
              ? `Your file size (${fileSizeMB}MB) exceeds the maximum allowed size (${limitInMB}MB) on the ${planDisplayName} plan. Please ask your primary artist/label to upgrade their plan or upload a smaller file.`
              : `Your file size (${fileSizeMB}MB) exceeds the maximum allowed size (${limitInMB}MB) ${limitType}. Please upgrade your plan or upload a smaller file.`,
            limit: limitInMB,
            current: fileSizeMB,
            limitType: limitType,
            upgradeOptions: getUpgradeOptions(limitUser.role as string, 'fileSize')
          });
        }
      }

      // Limits not reached, proceed
      next();
    } catch (error) {
      console.error(`Error checking ${featureType} limits:`, error);
      res.status(500).json({ error: "Server error" });
    }
  };
};

/**
 * Get upgrade options for a user based on their current role and the feature they need more of
 */
function getUpgradeOptions(currentRole: string, feature: 'artists' | 'releases' | 'tracks' | 'fileSize'): Array<{plan: string, price: number, limit: number | string, period: string}> {
  const options = [];
  
  // Add options based on the current role and feature
  if (currentRole === 'free') {
    // Free user can upgrade to any paid plan
    options.push({
      plan: "Artist Plan",
      price: SUBSCRIPTION_PLANS.artist.yearlyPriceInINR,
      limit: feature === 'artists' ? 1 : 
             feature === 'tracks' || feature === 'releases' ? "Unlimited" : 
             feature === 'fileSize' ? "200MB" : "Unlimited",
      period: "per year"
    });
    
    options.push({
      plan: "Artist Manager Plan",
      price: SUBSCRIPTION_PLANS.artist_manager.yearlyPriceInINR,
      limit: feature === 'artists' ? 10 : 
             feature === 'tracks' || feature === 'releases' ? "Unlimited" : 
             feature === 'fileSize' ? "500MB" : "Unlimited",
      period: "per year"
    });
    
    options.push({
      plan: "Label Plan",
      price: SUBSCRIPTION_PLANS.label.yearlyPriceInINR,
      limit: feature === 'artists' ? "Unlimited" : 
             feature === 'tracks' || feature === 'releases' ? "Unlimited" : 
             feature === 'fileSize' ? "2GB" : "Unlimited",
      period: "per year"
    });
  } 
  else if (currentRole === 'artist') {
    // Artist can upgrade to artist manager or label admin
    options.push({
      plan: "Artist Manager Plan",
      price: SUBSCRIPTION_PLANS.artist_manager.yearlyPriceInINR,
      limit: feature === 'artists' ? 10 : 
             feature === 'tracks' || feature === 'releases' ? "Unlimited" : 
             feature === 'fileSize' ? "500MB" : "Unlimited",
      period: "per year"
    });
    
    options.push({
      plan: "Label Plan",
      price: SUBSCRIPTION_PLANS.label.yearlyPriceInINR,
      limit: feature === 'artists' ? "Unlimited" : 
             feature === 'tracks' || feature === 'releases' ? "Unlimited" : 
             feature === 'fileSize' ? "2GB" : "Unlimited",
      period: "per year"
    });
  } 
  else if (currentRole === 'artist_manager') {
    // Artist manager can only upgrade to label admin
    options.push({
      plan: "Label Plan",
      price: SUBSCRIPTION_PLANS.label.yearlyPriceInINR,
      limit: feature === 'artists' ? "Unlimited" : 
             feature === 'tracks' || feature === 'releases' ? "Unlimited" : 
             feature === 'fileSize' ? "2GB" : "Unlimited",
      period: "per year"
    });
  }
  
  return options;
}