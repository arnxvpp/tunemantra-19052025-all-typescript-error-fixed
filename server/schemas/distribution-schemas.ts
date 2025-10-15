/**
 * Distribution Validation Schemas
 * 
 * This module provides validation schemas for distribution-related endpoints.
 * These schemas ensure data integrity and security for distribution operations.
 */

import { z } from 'zod';

/**
 * Validation schema for creating a distribution record
 * 
 * Used in POST /api/distribution-records
 */
export const createDistributionRecordSchema = z.object({
  releaseId: z.number().int().positive(),
  platformId: z.number().int().positive(),
  scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Scheduled date must be a valid date string"
  }).optional(),
  distributionType: z.enum(['initial', 'update', 'removal']).default('initial'),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for updating a distribution record
 * 
 * Used in PUT /api/distribution-records/:id
 */
export const updateDistributionRecordSchema = z.object({
  status: z.enum(['pending', 'processing', 'distributed', 'failed', 'scheduled', 'canceled']).optional(),
  platformReleaseId: z.string().optional(),
  platformUrl: z.string().optional(),
  distributionDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Distribution date must be a valid date string"
  }).optional(),
  errorDetails: z.object({
    errorCode: z.string().optional(),
    errorMessage: z.string().optional(),
    errorCategory: z.string().optional(),
    timestamp: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: "Error timestamp must be a valid date string"
    }).optional()
  }).optional(),
  notes: z.string().optional(),
  retryCount: z.number().int().min(0).optional(),
  lastUpdateDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Last update date must be a valid date string"
  }).optional(),
  lastUpdateDetails: z.record(z.any()).optional(),
  royaltyIntegrationStatus: z.enum(['pending', 'processing', 'completed', 'failed']).optional()
});

/**
 * Validation schema for batch distribution operation
 * 
 * Used in POST /api/distributions/batch
 */
export const batchDistributionSchema = z.object({
  releaseIds: z.array(z.number().int().positive()),
  platformIds: z.array(z.number().int().positive()),
  scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Scheduled date must be a valid date string"
  }).optional(),
  distributionType: z.enum(['initial', 'update', 'removal']).default('initial'),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  notes: z.string().optional(),
  sendNotifications: z.boolean().optional().default(true)
});

/**
 * Validation schema for creating a distribution platform
 * 
 * Used in POST /api/distribution-platforms (admin only)
 */
export const createPlatformSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['streaming', 'download', 'video', 'social']),
  status: z.enum(['active', 'inactive', 'maintenance', 'beta']).default('active'),
  apiCredentials: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    tokenExpiryDate: z.string().optional(),
    baseUrl: z.string().optional(),
    additionalParams: z.record(z.any()).optional()
  }).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  deliveryMethod: z.enum(['api', 'ftp', 'sftp', 'dropbox', 'manual']).default('api'),
  processingTime: z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
    unit: z.enum(['minutes', 'hours', 'days', 'weeks']).default('hours')
  }).optional(),
  requirements: z.array(z.string()).optional(),
  supportedFileFormats: z.array(z.string()).optional(),
  territoryRestrictions: z.array(z.string()).optional(),
  ratePerStream: z.string().optional(),
  marketShare: z.number().min(0).max(100).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for updating a distribution platform
 * 
 * Used in PUT /api/distribution-platforms/:id (admin only)
 */
export const updatePlatformSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['streaming', 'download', 'video', 'social']).optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'beta']).optional(),
  apiCredentials: z.object({
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    accessToken: z.string().optional(),
    refreshToken: z.string().optional(),
    tokenExpiryDate: z.string().optional(),
    baseUrl: z.string().optional(),
    additionalParams: z.record(z.any()).optional()
  }).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  deliveryMethod: z.enum(['api', 'ftp', 'sftp', 'dropbox', 'manual']).optional(),
  processingTime: z.object({
    min: z.number().int().min(0),
    max: z.number().int().min(0),
    unit: z.enum(['minutes', 'hours', 'days', 'weeks']).default('hours')
  }).optional(),
  requirements: z.array(z.string()).optional(),
  supportedFileFormats: z.array(z.string()).optional(),
  territoryRestrictions: z.array(z.string()).optional(),
  ratePerStream: z.string().optional(),
  marketShare: z.number().min(0).max(100).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for creating a scheduled distribution
 * 
 * Used in POST /api/scheduled-distributions
 */
export const createScheduledDistributionSchema = z.object({
  releaseId: z.number().int().positive(),
  platformIds: z.array(z.number().int().positive()),
  scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Scheduled date must be a valid date string"
  }),
  distributionType: z.enum(['initial', 'update', 'removal']).default('initial'),
  recurrence: z.enum(['one-time', 'daily', 'weekly', 'monthly', 'quarterly']).optional().default('one-time'),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  status: z.enum(['active', 'paused', 'completed', 'canceled']).optional().default('active'),
  notes: z.string().optional(),
  notifyOnCompletion: z.boolean().optional().default(true),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for updating a scheduled distribution
 * 
 * Used in PUT /api/scheduled-distributions/:id
 */
export const updateScheduledDistributionSchema = z.object({
  platformIds: z.array(z.number().int().positive()).optional(),
  scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Scheduled date must be a valid date string"
  }).optional(),
  distributionType: z.enum(['initial', 'update', 'removal']).optional(),
  recurrence: z.enum(['one-time', 'daily', 'weekly', 'monthly', 'quarterly']).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  status: z.enum(['active', 'paused', 'completed', 'canceled']).optional(),
  notes: z.string().optional(),
  notifyOnCompletion: z.boolean().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for filtering distribution records
 * 
 * Used in GET /api/distribution-records
 */
export const distributionFilterSchema = z.object({
  releaseId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  platformId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  status: z.enum(['pending', 'processing', 'distributed', 'failed', 'scheduled', 'canceled', 'all']).optional().default('all'),
  distributionType: z.enum(['initial', 'update', 'removal', 'all']).optional().default('all'),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  hasErrors: z.boolean().optional(),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'scheduledDate', 'distributionDate']).optional().default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * Validation schema for distribution analytics request
 * 
 * Used in GET /api/distribution-analytics/:releaseId
 */
export const distributionAnalyticsQuerySchema = z.object({
  timeframe: z.enum(['7d', '30d', '90d', '6m', '1y', 'all']).optional().default('30d'),
  compareWithPrevious: z.boolean().optional().default(false),
  platformId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  includeErrorBreakdown: z.boolean().optional().default(true),
  includeTimeline: z.boolean().optional().default(true),
  includePlatformComparison: z.boolean().optional().default(true)
});

/**
 * Validation schema for bulk distribution job creation
 * 
 * Used in POST /api/bulk-distribution-jobs
 */
export const createBulkDistributionJobSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  releaseIds: z.array(z.number().int().positive()),
  platformIds: z.array(z.number().int().positive()),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Scheduled date must be a valid date string"
  }).optional(),
  distributionType: z.enum(['initial', 'update', 'removal']).default('initial'),
  notifyOnCompletion: z.boolean().optional().default(true),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for distribution platform ID parameter
 * 
 * Used in various endpoints with :platformId parameter
 */
export const platformIdParamSchema = z.object({
  platformId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Platform ID must be a positive integer"
  })
});

/**
 * Validation schema for distribution record ID parameter
 * 
 * Used in various endpoints with :distributionId parameter
 */
export const distributionIdParamSchema = z.object({
  distributionId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Distribution ID must be a positive integer"
  })
});

/**
 * Validation schema for scheduled distribution ID parameter
 * 
 * Used in various endpoints with :scheduledDistributionId parameter
 */
export const scheduledDistributionIdParamSchema = z.object({
  scheduledDistributionId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Scheduled distribution ID must be a positive integer"
  })
});

/**
 * Validation schema for bulk distribution job ID parameter
 * 
 * Used in various endpoints with :jobId parameter
 */
export const bulkDistributionJobIdParamSchema = z.object({
  jobId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Job ID must be a positive integer"
  })
});

/**
 * Validation schema for GET platforms route query parameters
 * 
 * Used in GET /api/distribution-platforms
 */
export const getPlatformsQuerySchema = z.object({
  status: z.enum(['all', 'active', 'inactive', 'maintenance', 'beta']).optional().default('all'),
  type: z.enum(['all', 'streaming', 'download', 'video', 'social']).optional().default('all'),
  includeCredentials: z.boolean().optional().default(false)
});

/**
 * Validation schema for platform availability release ID parameter
 * 
 * Used in GET /api/distribution-platforms/availability/:releaseId
 */
export const releaseIdParamSchema = z.object({
  releaseId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Release ID must be a positive integer"
  })
});

/**
 * Validation schema for platform settings (admin only)
 * 
 * Used in POST /api/distribution-platforms/admin/settings
 */
export const platformSettingsSchema = z.object({
  platforms: z.array(z.object({
    name: z.string().min(1).max(100),
    status: z.enum(['active', 'inactive', 'maintenance', 'beta']),
    type: z.string().optional(),
    apiCredentials: z.record(z.any()).optional()
  }))
});