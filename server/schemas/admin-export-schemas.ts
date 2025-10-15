/**
 * Admin Export Validation Schemas
 * 
 * This module provides validation schemas for admin export endpoints.
 * These schemas ensure data integrity and consistent validation across
 * the application.
 */

import { z } from 'zod';

/**
 * Release ID parameter validation
 * 
 * Ensures that the release ID parameter is a valid positive integer.
 */
export const releaseIdParamSchema = z.object({
  id: z.string()
    .refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, 
      { message: "Release ID must be a positive integer" })
});

/**
 * Bulk export request validation
 * 
 * Validates the data structure for bulk export requests, ensuring that:
 * - releases array is provided with at least one release
 * - format is one of the supported export types
 * - distributorId, if provided, is a valid positive integer
 */
export const bulkExportSchema = z.object({
  releases: z.array(z.any()).min(1, { message: "At least one release must be provided" }),
  format: z.enum(['excel', 'csv', 'json', 'xml', 'ddex'], { 
    errorMap: () => ({ message: "Format must be one of: excel, csv, json, xml, ddex" })
  }),
  distributorId: z.number().positive().optional()
});

/**
 * Export filter schema
 * 
 * Validates query parameters for filtering export data.
 */
export const exportFilterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  artistName: z.string().optional(),
  label: z.string().optional(),
  genre: z.string().optional(),
  limit: z.string()
    .optional()
    .refine(val => !val || (!isNaN(parseInt(val)) && parseInt(val) > 0), 
      { message: "Limit must be a positive integer" }),
  page: z.string()
    .optional()
    .refine(val => !val || (!isNaN(parseInt(val)) && parseInt(val) > 0), 
      { message: "Page must be a positive integer" })
}).optional();