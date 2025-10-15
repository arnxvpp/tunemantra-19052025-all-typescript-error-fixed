/**
 * Common Validation Schemas
 * 
 * This module provides common validation schemas that can be reused
 * across different parts of the application.
 */

import { z } from 'zod';

/**
 * Empty query schema for endpoints that don't require specific query parameters
 * but still need validation for security.
 * 
 * This can be used to catch and reject unexpected query parameters.
 */
export const emptyQuerySchema = z.object({}).passthrough();

/**
 * Pagination schema for consistent pagination across the application
 */
export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
});

/**
 * Date range schema for filtering by date
 */
export const dateRangeSchema = z.object({
  startDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }),
  endDate: z.string().optional().refine(val => !val || !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  })
});

/**
 * ID parameter schema for consistent ID validation in route parameters
 */
export const idParamSchema = z.object({
  id: z.string().refine(val => !isNaN(parseInt(val)), {
    message: "ID must be a valid number"
  })
});

/**
 * Sort options schema for consistent sorting across the application
 */
export const sortOptionsSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

/**
 * Basic search schema for consistent search functionality
 */
export const searchSchema = z.object({
  search: z.string().optional(),
  ...paginationSchema.shape,
  ...sortOptionsSchema.shape
});