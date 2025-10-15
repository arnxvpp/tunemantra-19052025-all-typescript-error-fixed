/**
 * Mobile API Validation Schemas
 * 
 * This module provides validation schemas for mobile API-related endpoints.
 * These schemas ensure data integrity and security for mobile operations.
 */

import { z } from 'zod';

/**
 * Validation schema for device registration
 * 
 * Used in POST /api/mobile/register-device
 */
export const deviceRegistrationSchema = z.object({
  deviceToken: z.string().min(10).max(1000),
  deviceType: z.enum(['ios', 'android', 'web']),
  appVersion: z.string().optional(),
  deviceName: z.string().optional(),
  notificationPreferences: z.object({
    enabled: z.boolean(),
    types: z.array(z.enum(['release', 'royalty', 'distribution', 'support', 'team', 'marketing'])).optional()
  }).optional()
});

/**
 * Validation schema for notification settings update
 * 
 * Used in PUT /api/mobile/notification-settings
 */
export const notificationSettingsSchema = z.object({
  enabled: z.boolean(),
  channels: z.object({
    push: z.boolean().optional(),
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    inApp: z.boolean().optional()
  }).optional(),
  types: z.object({
    release: z.boolean().optional(),
    royalty: z.boolean().optional(),
    distribution: z.boolean().optional(),
    support: z.boolean().optional(),
    team: z.boolean().optional(),
    marketing: z.boolean().optional()
  }).optional(),
  schedule: z.object({
    dailyDigest: z.boolean().optional(),
    weeklyReport: z.boolean().optional(),
    instantAlerts: z.boolean().optional()
  }).optional(),
  quiet: z.object({
    enabled: z.boolean().optional(),
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:MM format
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional()    // HH:MM format
  }).optional()
});

/**
 * Validation schema for profile update
 * 
 * Used in PUT /api/mobile/profile
 */
export const profileUpdateSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  entityName: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/).optional(),
  mobileSettings: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    biometricAuthEnabled: z.boolean().optional(),
    offlineMode: z.object({
      enabled: z.boolean().optional(),
      syncOnWifiOnly: z.boolean().optional(),
      maxStorageUsage: z.number().int().positive().optional()
    }).optional(),
    dataUsage: z.object({
      highQualityOnWifiOnly: z.boolean().optional(),
      analyticsRefreshInterval: z.number().int().min(1).max(24).optional()
    }).optional()
  }).optional()
});

/**
 * Validation schema for batch royalty calculations
 * 
 * Used in POST /api/mobile/batch-royalty-calculations
 */
export const batchRoyaltyCalculationsSchema = z.object({
  trackIds: z.array(z.number().int().positive()).optional(),
  releaseId: z.number().int().positive().optional(),
  timeframe: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  forceRecalculation: z.boolean().optional().default(false),
  includePending: z.boolean().optional().default(true),
  platforms: z.array(z.number().int().positive()).optional(),
  processImmediately: z.boolean().optional().default(false)
}).refine(
  data => data.trackIds !== undefined || data.releaseId !== undefined,
  {
    message: "Either trackIds or releaseId must be provided",
    path: ["trackIds", "releaseId"]
  }
);

/**
 * Validation schema for royalty splits update
 * 
 * Used in PUT /api/mobile/releases/:releaseId/royalty-splits
 */
export const royaltySplitsSchema = z.object({
  splits: z.array(z.object({
    recipientId: z.number().int().positive(),
    recipientName: z.string().min(1).max(100),
    recipientType: z.enum(['artist', 'producer', 'composer', 'label', 'publisher', 'other']),
    splitPercentage: z.number().min(0).max(100),
    roleType: z.string().optional()
  })).refine(
    splits => {
      const totalPercentage = splits.reduce((sum, split) => sum + split.splitPercentage, 0);
      return Math.abs(totalPercentage - 100) < 0.01; // Allow for small floating point differences
    },
    {
      message: "Split percentages must sum to 100%",
      path: ["splits"]
    }
  )
});

/**
 * Validation schema for release ID parameter
 * 
 * Used in GET and PUT /api/mobile/releases/:releaseId/royalty-splits
 */
export const releaseIdParamSchema = z.object({
  releaseId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Release ID must be a positive integer"
  })
});

/**
 * Validation schema for syncing royalties
 * 
 * Used in POST /api/mobile/sync-royalties
 */
export const syncRoyaltiesSchema = z.object({
  releaseIds: z.array(z.number().int().positive()).optional(),
  trackIds: z.array(z.number().int().positive()).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  platformIds: z.array(z.number().int().positive()).optional(),
  forceRecalculation: z.boolean().optional().default(false),
  includeFailedDistributions: z.boolean().optional().default(false)
});

/**
 * Validation schema for platform royalty analytics query parameters
 * 
 * Used in GET /api/mobile/platform-royalty-analytics
 */
export const platformRoyaltyAnalyticsSchema = z.object({
  timeframe: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month'),
  platformId: z.string().regex(/^\d+$/).transform(val => parseInt(val)).optional(),
  demo: z.enum(['true', 'false']).optional()
});

/**
 * Validation schema for platform comparison query parameters
 * 
 * Used in GET /api/mobile/platform-comparison
 */
export const platformComparisonSchema = z.object({
  platformIds: z.string().min(1).refine(val => {
    const ids = val.split(',').map(id => parseInt(id.trim()));
    return ids.every(id => !isNaN(id) && id > 0);
  }, {
    message: "platformIds must be a comma-separated list of positive integers"
  }),
  metric: z.enum(['revenue', 'streams', 'rate']).optional().default('revenue'),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
  demo: z.enum(['true', 'false']).optional()
});

/**
 * Validation schema for royalty calculations query parameters
 * 
 * Used in GET /api/mobile/royalty-calculations
 */
export const royaltyCalculationsSchema = z.object({
  timeframe: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month'),
  detailed: z.enum(['true', 'false']).optional().default('false'),
  demo: z.enum(['true', 'false']).optional()
});

/**
 * Validation schema for demo mode query parameter
 * 
 * Used in multiple GET endpoints that support demo mode
 */
export const demoQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional()
});

/**
 * Schema for GET /api/mobile/stats endpoint
 */
export const statsQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional(),
  timeframe: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month'),
  category: z.enum(['all', 'streams', 'revenue', 'distribution', 'audience']).optional().default('all')
});

/**
 * Schema for GET /api/mobile/revenue-analytics endpoint
 */
export const revenueAnalyticsQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional(),
  timeframe: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month')
});

/**
 * Schema for GET /api/mobile/integration-status endpoint
 */
export const integrationStatusQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional(),
  timeframe: z.enum(['day', 'week', 'month', 'all']).optional().default('week'),
  status: z.enum(['pending', 'processed', 'failed', 'all']).optional().default('all')
});

/**
 * Schema for GET /api/mobile/royalty-payments endpoint
 */
export const royaltyPaymentsQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional(),
  timeframe: z.enum(['month', 'quarter', 'year', 'all']).optional().default('month'),
  status: z.enum(['pending', 'processed', 'failed', 'all']).optional().default('all'),
  page: z.string().optional().transform(val => {
    const parsed = parseInt(val || '1');
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }),
  limit: z.string().optional().transform(val => {
    const parsed = parseInt(val || '10');
    return isNaN(parsed) || parsed < 1 || parsed > 50 ? 10 : parsed;
  })
});

/**
 * Schema for GET /api/mobile/royalty-geography endpoint
 */
export const royaltyGeographyQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional(),
  timeframe: z.enum(['month', 'quarter', 'year']).optional().default('month'),
  view: z.enum(['country', 'region', 'city']).optional().default('country'),
  sortBy: z.enum(['revenue', 'streams']).optional().default('revenue')
});

/**
 * Schema for GET /api/mobile/trending-tracks endpoint
 */
export const trendingTracksQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional(),
  limit: z.string().optional().transform(val => {
    const parsed = parseInt(val || '10');
    return isNaN(parsed) ? 10 : Math.min(Math.max(parsed, 1), 50);
  }),
  timeframe: z.string().optional().transform(val => {
    const parsed = parseInt(val || '30');
    return [7, 30, 90].includes(parsed) ? parsed : 30;
  }),
  format: z.enum(['compact', 'full']).optional().default('full')
});

/**
 * Schema for GET /api/mobile/label-services endpoint
 */
export const labelServicesQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional()
});

/**
 * Schema for GET /api/mobile/team-members endpoint
 */
export const teamMembersQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional()
});

/**
 * Schema for GET /api/mobile/catalog endpoint
 */
export const catalogQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional(),
  filter: z.enum(['all', 'recent', 'trending', 'pending']).optional().default('all'),
  sort: z.enum(['date', 'title', 'streams', 'revenue']).optional().default('date'),
  page: z.string().optional().transform(val => {
    const parsed = parseInt(val || '1');
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }),
  limit: z.string().optional().transform(val => {
    const parsed = parseInt(val || '20');
    return isNaN(parsed) || parsed < 1 || parsed > 50 ? 20 : Math.min(parsed, 50);
  })
});

/**
 * Schema for platform timeline parameters
 * 
 * Used in GET /api/mobile/platforms/:platformId/timeline
 */
export const platformTimelineParamsSchema = z.object({
  platformId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Platform ID must be a positive integer"
  })
});

/**
 * Schema for platform timeline query
 * 
 * Used in GET /api/mobile/platforms/:platformId/timeline
 */
/**
 * Schema for platform ID URL parameter
 * 
 * Used in endpoints that require a platform ID in the URL path
 */
export const platformIdParamSchema = z.object({
  platformId: z.string().refine(
    (val) => !isNaN(parseInt(val)), 
    { message: "Platform ID must be a number" }
  )
});

export const platformTimelineQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional(),
  timeframe: z.enum(['week', 'month', 'quarter', 'year']).optional().default('month'),
  type: z.enum(['distribution', 'streams', 'revenue', 'all']).optional().default('all'),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/, { 
      message: "Invalid date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.sssZ)" 
    })
    .optional(),
  endDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/, { 
      message: "Invalid date format. Use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.sssZ)" 
    })
    .optional(),
  interval: z.enum(['day', 'week', 'month']).optional().default('day'),
  metrics: z.string().optional().default('revenue,streams')
});

/**
 * Schema for distribution request query parameters
 * 
 * Used in POST /api/mobile/distribution-request
 */
export const distributionRequestSchema = z.object({
  releaseId: z.number().int().positive(),
  platformIds: z.array(z.number().int().positive()),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  priorityLevel: z.enum(['standard', 'expedited', 'urgent']).optional().default('standard'),
  notes: z.string().max(500).optional()
});

/**
 * Schema for platform release analytics query parameters
 * 
 * Used in GET /api/mobile/platforms/:platformId/release/:releaseId
 */
export const platformReleaseAnalyticsParamsSchema = z.object({
  platformId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Platform ID must be a positive integer"
  }),
  releaseId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Release ID must be a positive integer"
  })
});

/**
 * Schema for platform release analytics query
 * 
 * Used in GET /api/mobile/platforms/:platformId/release/:releaseId
 */
export const platformReleaseAnalyticsQuerySchema = z.object({
  demo: z.enum(['true', 'false']).optional(),
  timeframe: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional().default('month'),
  format: z.enum(['standard', 'detailed']).optional().default('standard')
});