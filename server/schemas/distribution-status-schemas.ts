/**
 * Distribution Status Validation Schemas
 * 
 * This module provides validation schemas for distribution status related endpoints.
 * These schemas ensure data integrity and security for distribution status operations.
 */

import { z } from 'zod';

/**
 * Validation schema for getting distribution records
 * 
 * Used in GET /api/distribution-status/records
 */
export const getStatusRecordsSchema = z.object({
  platformId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  releaseId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  startDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }),
  endDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }),
  status: z.string().optional()
});

/**
 * Validation schema for distribution record ID parameter
 * 
 * Used in GET /api/distribution-status/records/:id and GET /api/distribution-status/history/:id
 */
export const distributionIdParamSchema = z.object({
  id: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Distribution ID must be a positive integer"
  })
});

/**
 * Validation schema for updating platform-specific status
 * 
 * Used in POST /api/distribution-status/update/:id
 */
export const updateStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
  message: z.string().optional(),
  platformReleaseId: z.string().optional(),
  platformTrackIds: z.array(z.string()).optional(),
  liveDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Live date must be a valid date string"
  }),
  availableStores: z.array(z.string()).optional(),
  errorDetails: z.record(z.any()).optional(),
  streamingLinks: z.record(z.string()).optional(),
  platformResponse: z.any().optional()
});

/**
 * Validation schema for getting status statistics
 * 
 * Used in GET /api/distribution-status/statistics
 */
export const statusStatisticsSchema = z.object({
  startDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }),
  endDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }),
  platformId: z.string().optional().transform(val => val ? parseInt(val) : undefined)
});