/**
 * Analytics Validation Schemas
 * 
 * This module provides validation schemas for analytics-related endpoints.
 * These schemas ensure data integrity and security for analytics operations.
 */

import { z } from 'zod';

/**
 * Validation schema for track analytics query
 * 
 * Used in GET /api/analytics/tracks/:trackId
 */
export const trackAnalyticsQuerySchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  platform: z.string().optional(),
  region: z.string().optional(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily')
});

/**
 * Validation schema for release analytics query
 * 
 * Used in GET /api/analytics/releases/:releaseId
 */
export const releaseAnalyticsQuerySchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  platform: z.string().optional(),
  region: z.string().optional(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily'),
  includeIndividualTracks: z.boolean().optional().default(false)
});

/**
 * Validation schema for artist analytics query
 * 
 * Used in GET /api/analytics/artists/:artistId
 */
export const artistAnalyticsQuerySchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  platform: z.string().optional(),
  region: z.string().optional(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily'),
  includeReleases: z.boolean().optional().default(false),
  includeTracks: z.boolean().optional().default(false)
});

/**
 * Validation schema for platform comparison query
 * 
 * Used in GET /api/analytics/platform-comparison
 */
export const platformComparisonQuerySchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  platforms: z.array(z.string()).optional(),
  metric: z.enum(['streams', 'revenue', 'listeners', 'playlistAdds', 'shares', 'saves']).optional().default('streams'),
  includeGrowthRate: z.boolean().optional().default(false)
});

/**
 * Validation schema for regional analytics query
 * 
 * Used in GET /api/analytics/regional
 */
export const regionalAnalyticsQuerySchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  trackId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Track ID must be a positive integer"
  }).optional(),
  releaseId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Release ID must be a positive integer"
  }).optional(),
  platform: z.string().optional(),
  metric: z.enum(['streams', 'revenue', 'listeners']).optional().default('streams'),
  granularity: z.enum(['country', 'city']).optional().default('country')
});

/**
 * Validation schema for trend analysis query
 * 
 * Used in GET /api/analytics/trends
 */
export const trendAnalysisQuerySchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  metric: z.enum(['streams', 'revenue', 'listeners', 'playlistAdds', 'shares', 'saves']).optional().default('streams'),
  contentType: z.enum(['tracks', 'releases', 'artists']).optional().default('tracks'),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  sortBy: z.enum(['highest', 'fastest_growing', 'trending']).optional().default('highest'),
  platform: z.string().optional()
});

/**
 * Validation schema for demographic analysis query
 * 
 * Used in GET /api/analytics/demographics
 */
export const demographicAnalysisQuerySchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  trackId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Track ID must be a positive integer"
  }).optional(),
  releaseId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Release ID must be a positive integer"
  }).optional(),
  platform: z.string().optional(),
  dimensions: z.array(z.enum(['age', 'gender', 'device', 'listeningTime'])).optional().default(['age', 'gender']),
  compareWithPrevious: z.boolean().optional().default(false)
});

/**
 * Validation schema for playlist analytics query
 * 
 * Used in GET /api/analytics/playlists
 */
export const playlistAnalyticsQuerySchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  trackId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Track ID must be a positive integer"
  }).optional(),
  releaseId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Release ID must be a positive integer"
  }).optional(),
  platform: z.string().optional(),
  playlistType: z.enum(['editorial', 'algorithmic', 'user', 'all']).optional().default('all'),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
});

/**
 * Validation schema for analytics ID parameters
 * 
 * Used in various endpoints with :trackId, :releaseId, :artistId parameters
 */
export const analyticsIdParamSchema = z.object({
  trackId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Track ID must be a positive integer"
  }).optional(),
  releaseId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Release ID must be a positive integer"
  }).optional(),
  artistId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Artist ID must be a positive integer"
  }).optional()
}).refine(data => data.trackId !== undefined || data.releaseId !== undefined || data.artistId !== undefined, {
  message: "At least one ID must be provided",
  path: ["trackId"]
});

/**
 * Validation schema for exporting analytics data
 * 
 * Used in POST /api/analytics/export
 */
export const exportAnalyticsSchema = z.object({
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }),
  format: z.enum(['csv', 'excel', 'json']).default('csv'),
  metrics: z.array(z.enum(['streams', 'revenue', 'listeners', 'playlistAdds', 'shares', 'saves'])).default(['streams', 'revenue']),
  groupBy: z.array(z.enum(['platform', 'date', 'track', 'release', 'country'])).default(['date', 'platform']),
  trackIds: z.array(z.number().int().positive()).optional(),
  releaseIds: z.array(z.number().int().positive()).optional(),
  includeDetails: z.boolean().optional().default(false)
});

/**
 * Validation schema for revenue forecast query
 * 
 * Used in GET /api/analytics/revenue-forecast
 */
export const revenueForecastQuerySchema = z.object({
  modelType: z.enum(['linear', 'exponential', 'seasonalAdjusted']).optional().default('seasonalAdjusted'),
  timeframe: z.enum(['30days', '90days', '180days', '365days']).optional().default('90days'),
  trackId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Track ID must be a positive integer"
  }).optional(),
  releaseId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Release ID must be a positive integer"
  }).optional(),
  includeConfidenceInterval: z.boolean().optional().default(true),
  platformBreakdown: z.boolean().optional().default(false)
});