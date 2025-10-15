/**
 * API Access Validation Schemas
 * 
 * This module provides validation schemas for API access-related endpoints.
 * These schemas ensure data integrity and security for API key management.
 */

import { z } from 'zod';

/**
 * Validation schema for getting API keys list
 * 
 * Used in GET /api/api-keys
 */
export const getApiKeysQuerySchema = z.object({
  includeInactive: z.boolean().optional().default(false),
  sortBy: z.enum(['name', 'createdAt', 'expiresAt', 'lastUsed']).optional().default('createdAt')
}).optional().default({});

/**
 * Validation schema for creating a new API key
 * 
 * Used in POST /api/api-keys
 */
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresIn: z.number().int().positive().optional(),
  scopes: z.array(z.string()).min(1),
  description: z.string().optional()
});

/**
 * Validation schema for API key ID parameter
 * 
 * Used in DELETE /api/api-keys/:id
 */
export const apiKeyIdParamSchema = z.object({
  id: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "API key ID must be a positive integer"
  })
});

/**
 * Validation schema for updating API key
 * 
 * Used in PUT /api/api-keys/:id
 */
export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Expiration date must be a valid date string"
  }).optional(),
  scopes: z.array(z.string()).optional(),
  description: z.string().optional()
});

/**
 * Validation schema for API key authorization
 * 
 * Used in internal middleware for validating API requests
 */
export const apiKeyAuthSchema = z.object({
  apiKey: z.string().min(32),
  timestamp: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Timestamp must be a valid date string"
  }),
  signature: z.string().min(40)
});

/**
 * Validation schema for API rate limit configuration
 * 
 * Used in PUT /api/admin/rate-limits
 */
export const rateLimitConfigSchema = z.object({
  endpoint: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', '*']),
  limit: z.number().int().positive(),
  windowMs: z.number().int().positive(),
  byRole: z.record(z.number().int().positive()).optional(),
  byIp: z.boolean().optional().default(true),
  byApiKey: z.boolean().optional().default(true)
});

/**
 * Validation schema for API usage statistics
 * 
 * Used in GET /api/admin/api-usage
 */
export const apiUsageFilterSchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  userId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "User ID must be a positive integer"
  }).optional(),
  apiKeyId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "API key ID must be a positive integer"
  }).optional(),
  endpoint: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'ALL']).optional().default('ALL'),
  status: z.enum(['success', 'error', 'all']).optional().default('all'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
});

/**
 * Validation schema for API webhook configuration
 * 
 * Used in POST /api/webhooks
 */
export const webhookConfigSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  isActive: z.boolean().optional().default(true),
  secret: z.string().min(16).optional(),
  description: z.string().optional(),
  headers: z.record(z.string()).optional()
});