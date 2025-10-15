/**
 * Integration Validation Schemas
 * 
 * This module provides validation schemas for integration-related endpoints.
 * These schemas ensure data integrity and security for integration operations.
 */

import { z } from 'zod';

/**
 * Validation schema for the distribution ID parameter
 * 
 * Used in POST /api/integration/process/:distributionId
 */
export const distributionIdParamSchema = z.object({
  distributionId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Distribution ID must be a positive integer"
  })
});

/**
 * Validation schema for batch integration processing
 * 
 * Used in POST /api/integration/process-batch
 */
export const batchIntegrationSchema = z.object({
  userId: z.number().int().positive().optional(),
  startDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }),
  endDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }),
  status: z.string().optional(),
  platformId: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(1000).optional()
});

/**
 * Validation schema for distribution status change
 * 
 * Used in POST /api/integration/status-change
 */
export const statusChangeSchema = z.object({
  distributionId: z.number().int().positive(),
  oldStatus: z.string().optional(),
  newStatus: z.string().min(1, "New status is required"),
  details: z.record(z.any()).optional()
});

/**
 * Validation schema for integration status query parameters
 * 
 * Used in GET /api/integration/status
 */
export const integrationStatusQuerySchema = z.object({
  timeframe: z.enum(['day', 'week', 'month', 'all']).optional().default('week'),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  includeDetails: z.string().optional().transform(val => val === 'true')
});