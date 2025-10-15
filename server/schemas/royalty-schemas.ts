/**
 * Royalty API Route Validation Schemas
 * 
 * This module defines Zod validation schemas for royalty calculation endpoints,
 * ensuring that request parameters are properly validated before processing.
 */

import { z } from 'zod';

/**
 * Schema for validating batch royalty calculation requests
 */
export const batchCalculateSchema = z.object({
  trackIds: z.array(z.number().int().positive()).optional(),
  releaseId: z.number().int().positive().optional(),
  userId: z.number().int().positive().optional(),
  timeframe: z.object({
    startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: 'startDate must be a valid date string'
    }),
    endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: 'endDate must be a valid date string'
    })
  }).optional(),
  forceRecalculation: z.boolean().optional().default(false)
}).refine(
  data => data.trackIds !== undefined || data.releaseId !== undefined || data.userId !== undefined,
  {
    message: 'At least one of trackIds, releaseId, or userId must be provided'
  }
);

/**
 * Schema for validating royalty calculation history queries
 */
export const royaltyCalculationsQuerySchema = z.object({
  trackId: z.string().transform(val => parseInt(val)).optional(),
  releaseId: z.string().transform(val => parseInt(val)).optional(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'startDate must be a valid date string'
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'endDate must be a valid date string'
  }).optional(),
  status: z.string().optional(),
  limit: z.string().transform(val => parseInt(val)).optional().default('20'),
  offset: z.string().transform(val => parseInt(val)).optional().default('0')
});

/**
 * Schema for validating royalty splits queries
 */
export const royaltySplitsQuerySchema = z.object({
  trackId: z.string().transform(val => parseInt(val)).optional(),
  releaseId: z.string().transform(val => parseInt(val)).optional()
}).refine(
  data => data.trackId !== undefined || data.releaseId !== undefined,
  {
    message: 'Either trackId or releaseId must be provided'
  }
);

/**
 * Schema for validating trackId params
 */
export const trackIdParamSchema = z.object({
  trackId: z.string().transform(val => parseInt(val))
});

/**
 * Schema for validating royalty split updates
 */
export const updateRoyaltySplitsSchema = z.object({
  splits: z.array(
    z.object({
      id: z.number().int().positive(),
      percentage: z.number().min(0).max(100),
      recipientName: z.string().min(1),
      recipientType: z.string().min(1),
      roleType: z.string().optional()
    })
  )
}).refine(
  data => {
    const totalPercentage = data.splits.reduce((sum, split) => sum + split.percentage, 0);
    return Math.abs(totalPercentage - 100) <= 0.01;
  },
  {
    message: 'Split percentages must total 100%'
  }
);

/**
 * Schema for validating royalty statement queries
 */
export const royaltyStatementsQuerySchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'startDate must be a valid date string'
  }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'endDate must be a valid date string'
  }),
  releaseId: z.string().transform(val => parseInt(val)).optional(),
  trackId: z.string().transform(val => parseInt(val)).optional(),
  format: z.enum(['json', 'pdf']).optional().default('json')
});

/**
 * Schema for validating distribution ID params
 */
export const distributionIdParamSchema = z.object({
  distributionId: z.string().transform(val => parseInt(val))
});

/**
 * Schema for validating integration options
 */
export const integrationOptionsSchema = z.object({
  forceRecalculation: z.boolean().optional().default(false)
});

/**
 * Schema for validating batch integration requests
 */
export const batchIntegrationSchema = z.object({
  userId: z.number().int().positive().optional(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'startDate must be a valid date string'
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'endDate must be a valid date string'
  }).optional(),
  limit: z.number().int().positive().optional(),
  includeFailedDistributions: z.boolean().optional().default(false),
  forceRecalculation: z.boolean().optional().default(false)
});

/**
 * Schema for validating integration status queries
 */
export const integrationStatusQuerySchema = z.object({
  userId: z.string().transform(val => parseInt(val)).optional(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'startDate must be a valid date string'
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: 'endDate must be a valid date string'
  }).optional()
});