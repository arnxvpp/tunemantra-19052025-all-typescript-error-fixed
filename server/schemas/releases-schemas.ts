/**
 * Release Validation Schemas
 * 
 * This module provides validation schemas for release-related endpoints.
 * These schemas ensure data integrity and security for release operations.
 */

import { z } from 'zod';

/**
 * Validation schema for release ID parameter
 * 
 * Used in various endpoints that require a release ID
 */
export const releaseIdParamSchema = z.object({
  releaseId: z.string().or(z.number()).transform(val => {
    const id = typeof val === 'string' ? parseInt(val) : val;
    if (isNaN(id) || id <= 0) {
      throw new Error('Release ID must be a positive integer');
    }
    return id;
  })
});

/**
 * Validation schema for simple ID parameter 
 * 
 * Used in GET /:id endpoint
 */
export const idParamSchema = z.object({
  id: z.string().or(z.number()).transform(val => {
    const id = typeof val === 'string' ? parseInt(val) : val;
    if (isNaN(id) || id <= 0) {
      throw new Error('ID must be a positive integer');
    }
    return id;
  })
});

/**
 * Validation schema for validating release metadata
 * 
 * Used in POST /:releaseId/validate
 */
export const validateMetadataSchema = z.object({
  platformIds: z.array(
    z.number().int().positive('Platform IDs must be positive integers')
  ).min(1, 'At least one platform ID is required')
});

/**
 * Validation schema for distributing a release
 * 
 * Used in POST /:releaseId/distribute
 */
export const distributeReleaseSchema = z.object({
  platformId: z.number().int().positive('Platform ID must be a positive integer'),
  skipValidation: z.boolean().optional().default(false)
});

/**
 * Validation schema for scheduling a release distribution
 * 
 * Used for scheduling distribution to platforms
 */
export const scheduleDistributionSchema = z.object({
  platformId: z.number().int().positive('Platform ID must be a positive integer'),
  scheduledDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Scheduled date must be a valid date string"
  })
});