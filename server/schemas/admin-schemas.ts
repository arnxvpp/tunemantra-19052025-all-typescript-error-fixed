/**
 * Admin Validation Schemas
 * 
 * This module provides validation schemas for admin-related endpoints.
 * These schemas ensure data integrity and security for admin operations.
 */

import { z } from 'zod';

/**
 * Validation schema for admin login
 * 
 * Used in POST /api/admin/login
 */
export const adminLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  code: z.string().optional()
});

/**
 * Validation schema for admin user list query parameters
 * 
 * Used in GET /api/admin/users
 */
export const adminUserListSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional()
});

/**
 * Validation schema for user status update
 * 
 * Used in PATCH /api/admin/users/:userId/status
 */
export const userStatusUpdateSchema = z.object({
  status: z.enum([
    'active', 
    'inactive', 
    'pending_approval', 
    'suspended', 
    'pending_payment'
  ]),
  reason: z.string().optional()
});

/**
 * Validation schema for bulk operations
 * 
 * Used in POST /api/admin/bulk
 */
export const bulkOperationSchema = z.object({
  operation: z.enum(['activate', 'deactivate', 'delete', 'approve', 'reject']),
  userIds: z.array(z.number()),
  reason: z.string().optional()
});

/**
 * Validation schema for batch user approval
 * 
 * Used for approving multiple users at once
 */
export const batchUserApprovalSchema = z.object({
  userIds: z.array(z.number().int().positive()),
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
  sendNotification: z.boolean().optional().default(true)
});

/**
 * Validation schema for release approval
 * 
 * Used in POST /api/admin/releases/approve
 */
export const releaseApprovalSchema = z.object({
  releaseId: z.number(),
  approved: z.boolean(),
  notes: z.string().optional(),
  flag: z.enum(['explicit', 'contains_samples', 'copyright_concerns']).optional()
});

/**
 * Validation schema for advanced search
 * 
 * Used in POST /api/admin/search
 */
export const advancedSearchSchema = z.object({
  entityType: z.enum(['users', 'tracks', 'releases', 'distributions', 'royalties']),
  filters: z.record(z.any()),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * Validation schema for user ID URL parameter
 * 
 * Used in routes with :userId parameter
 */
export const userIdParamSchema = z.object({
  userId: z.string().refine(val => !isNaN(parseInt(val)), {
    message: "User ID must be a valid number"
  })
});

/**
 * Validation schema for approval action URL parameter
 * 
 * Used in routes for approving/rejecting users
 */
export const approvalActionSchema = z.object({
  userId: z.string().refine(val => !isNaN(parseInt(val)), {
    message: "User ID must be a valid number"
  }),
  action: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: "Action must be either 'approved' or 'rejected'" })
  })
});

/**
 * Validation schema for approval notes
 * 
 * Used in approval routes to provide notes about the decision
 */
export const approvalNotesSchema = z.object({
  notes: z.string().max(1000).optional()
});

/**
 * Validation schema for data export
 * 
 * Used in POST /api/admin/export
 */
export const exportDataSchema = z.object({
  entityType: z.enum(['users', 'tracks', 'releases', 'analytics', 'royalties', 'distribution', 'all']),
  format: z.enum(['json', 'csv', 'excel']).default('json'),
  filters: z.record(z.any()).optional(),
  startDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }),
  endDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }),
  includeRelations: z.boolean().optional().default(false),
  compress: z.boolean().optional().default(false)
});

/**
 * Validation schema for data import
 * 
 * Used in POST /api/admin/import
 */
export const importDataSchema = z.object({
  entityType: z.enum(['users', 'tracks', 'releases', 'platform_settings', 'royalty_splits']),
  mode: z.enum(['create', 'update', 'upsert']).default('create'),
  options: z.object({
    skipValidation: z.boolean().optional().default(false),
    dryRun: z.boolean().optional().default(false),
    batchSize: z.number().int().positive().optional().default(100)
  }).optional().default({})
});

/**
 * Validation schema for bulk user operation
 * 
 * Used in POST /api/admin/users/bulk
 */
export const bulkUserOperationSchema = z.object({
  userIds: z.array(z.number().int().positive()),
  operation: z.enum(['activate', 'deactivate', 'upgrade', 'downgrade', 'delete']),
  reason: z.string().optional(),
  newRole: z.string().optional(),
  notes: z.string().optional()
});

/**
 * Validation schema for system report generation
 * 
 * Used in POST /api/admin/reports
 */
export const generateReportSchema = z.object({
  reportType: z.enum([
    'system_health', 
    'user_activity', 
    'revenue_summary', 
    'distribution_metrics', 
    'api_usage',
    'storage_usage'
  ]),
  timeframe: z.enum(['daily', 'weekly', 'monthly', 'custom']).default('monthly'),
  startDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }),
  endDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }),
  format: z.enum(['json', 'csv', 'pdf', 'html']).default('json')
});

/**
 * Validation schema for dashboard metrics
 * 
 * Used in GET /api/admin/dashboard
 */
export const dashboardMetricsQuerySchema = z.object({
  timeframe: z.enum(['day', 'week', 'month', 'year']).optional().default('month'),
  metrics: z.array(z.string()).optional()
});

/**
 * Validation schema for matching tracks by ISRC codes
 * 
 * Used in POST /api/admin/match-tracks
 */
export const matchTracksSchema = z.object({
  isrcs: z.array(z.string().min(1, "ISRC code cannot be empty"))
    .min(1, "At least one ISRC code is required")
});

/**
 * Validation schema for importing revenue data
 * 
 * Used in POST /api/admin/import-revenue
 */
export const importRevenueSchema = z.object({
  data: z.array(
    z.object({
      trackId: z.number().int().positive(),
      reportingMonth: z.string().refine(val => !isNaN(Date.parse(val)), {
        message: "Reporting month must be a valid date string"
      }),
      platform: z.string().min(1, "Platform is required"),
      quantity: z.number().int().nonnegative(),
      netRevenue: z.number().nonnegative(),
      country: z.string().optional()
    })
  ).min(1, "At least one revenue record is required")
});

/**
 * Validation schema for updating ISRC codes
 * 
 * Used in POST /api/admin/update-isrc
 */
export const updateIsrcSchema = z.object({
  updates: z.array(
    z.object({
      trackId: z.number().int().positive(),
      isrc: z.string().min(5, "Valid ISRC code is required")
        .max(15, "ISRC code is too long")
    })
  ).min(1, "At least one update is required")
});