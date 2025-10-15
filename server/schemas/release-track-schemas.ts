/**
 * Release and Track Validation Schemas
 * 
 * This module provides validation schemas for release and track-related endpoints.
 * These schemas ensure data integrity and security for content management operations.
 */

import { z } from 'zod';

/**
 * Validation schema for creating a new track
 * 
 * Used in POST /api/tracks
 */
export const createTrackSchema = z.object({
  title: z.string().min(1).max(200),
  releaseId: z.number().int().positive().optional(),
  artists: z.array(z.string()).min(1),
  featuredArtists: z.array(z.string()).optional(),
  primaryGenre: z.string().min(1),
  secondaryGenres: z.array(z.string()).optional(),
  isrc: z.string().optional(),
  language: z.string().optional(),
  explicit: z.boolean().optional().default(false),
  lyrics: z.string().optional(),
  duration: z.number().int().positive().optional(),
  compositionOwners: z.array(z.object({
    name: z.string().min(1),
    ownershipPercentage: z.number().min(0).max(100),
    role: z.string().optional()
  })).optional(),
  recordingOwners: z.array(z.object({
    name: z.string().min(1),
    ownershipPercentage: z.number().min(0).max(100),
    role: z.string().optional()
  })).optional(),
  composition: z.object({
    writers: z.array(z.string()).optional(),
    publishers: z.array(z.string()).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear()).optional()
  }).optional(),
  recording: z.object({
    producers: z.array(z.string()).optional(),
    engineers: z.array(z.string()).optional(),
    studios: z.array(z.string()).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear()).optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for updating an existing track
 * 
 * Used in PUT /api/tracks/:id
 */
export const updateTrackSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  releaseId: z.number().int().positive().optional(),
  artists: z.array(z.string()).min(1).optional(),
  featuredArtists: z.array(z.string()).optional(),
  primaryGenre: z.string().min(1).optional(),
  secondaryGenres: z.array(z.string()).optional(),
  isrc: z.string().optional(),
  language: z.string().optional(),
  explicit: z.boolean().optional(),
  lyrics: z.string().optional(),
  duration: z.number().int().positive().optional(),
  compositionOwners: z.array(z.object({
    name: z.string().min(1),
    ownershipPercentage: z.number().min(0).max(100),
    role: z.string().optional()
  })).optional(),
  recordingOwners: z.array(z.object({
    name: z.string().min(1),
    ownershipPercentage: z.number().min(0).max(100),
    role: z.string().optional()
  })).optional(),
  composition: z.object({
    writers: z.array(z.string()).optional(),
    publishers: z.array(z.string()).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear()).optional()
  }).optional(),
  recording: z.object({
    producers: z.array(z.string()).optional(),
    engineers: z.array(z.string()).optional(),
    studios: z.array(z.string()).optional(),
    year: z.number().int().min(1900).max(new Date().getFullYear()).optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for creating a new release
 * 
 * Used in POST /api/releases
 */
export const createReleaseSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['single', 'ep', 'album', 'compilation', 'live']),
  primaryArtist: z.string().min(1),
  contributingArtists: z.array(z.string()).optional(),
  label: z.string().optional(),
  releaseDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Release date must be a valid date string"
  }),
  upc: z.string().optional(),
  primaryGenre: z.string().min(1),
  secondaryGenres: z.array(z.string()).optional(),
  language: z.string().optional(),
  explicitContent: z.boolean().optional().default(false),
  copyright: z.object({
    year: z.number().int().min(1900).max(new Date().getFullYear()),
    holder: z.string().min(1)
  }),
  publishingRights: z.object({
    year: z.number().int().min(1900).max(new Date().getFullYear()),
    holder: z.string().min(1)
  }),
  territories: z.enum(['worldwide', 'select']).optional().default('worldwide'),
  selectedTerritories: z.array(z.string()).optional(),
  excludedTerritories: z.array(z.string()).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for updating an existing release
 * 
 * Used in PUT /api/releases/:id
 */
export const updateReleaseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(['single', 'ep', 'album', 'compilation', 'live']).optional(),
  primaryArtist: z.string().min(1).optional(),
  contributingArtists: z.array(z.string()).optional(),
  label: z.string().optional(),
  releaseDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Release date must be a valid date string"
  }).optional(),
  upc: z.string().optional(),
  primaryGenre: z.string().min(1).optional(),
  secondaryGenres: z.array(z.string()).optional(),
  language: z.string().optional(),
  explicitContent: z.boolean().optional(),
  copyright: z.object({
    year: z.number().int().min(1900).max(new Date().getFullYear()),
    holder: z.string().min(1)
  }).optional(),
  publishingRights: z.object({
    year: z.number().int().min(1900).max(new Date().getFullYear()),
    holder: z.string().min(1)
  }).optional(),
  territories: z.enum(['worldwide', 'select']).optional(),
  selectedTerritories: z.array(z.string()).optional(),
  excludedTerritories: z.array(z.string()).optional(),
  notes: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for bulk uploading tracks
 * 
 * Used in POST /api/releases/:releaseId/bulk-upload
 */
export const bulkTrackUploadSchema = z.object({
  tracks: z.array(
    z.object({
      title: z.string().min(1).max(200),
      artists: z.array(z.string()).min(1),
      featuredArtists: z.array(z.string()).optional(),
      primaryGenre: z.string().min(1),
      secondaryGenres: z.array(z.string()).optional(),
      isrc: z.string().optional(),
      language: z.string().optional(),
      explicit: z.boolean().optional().default(false),
      duration: z.number().int().positive().optional(),
      trackNumber: z.number().int().positive(),
      discNumber: z.number().int().positive().optional().default(1),
      compositionOwners: z.array(z.object({
        name: z.string().min(1),
        ownershipPercentage: z.number().min(0).max(100),
        role: z.string().optional()
      })).optional(),
      recordingOwners: z.array(z.object({
        name: z.string().min(1),
        ownershipPercentage: z.number().min(0).max(100),
        role: z.string().optional()
      })).optional()
    })
  ),
  validateOnly: z.boolean().optional().default(false)
});

/**
 * Validation schema for track ID parameter
 * 
 * Used in various endpoints with :trackId parameter
 */
export const trackIdParamSchema = z.object({
  trackId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Track ID must be a positive integer"
  })
});

/**
 * Validation schema for release ID parameter
 * 
 * Used in various endpoints with :releaseId parameter
 */
export const releaseIdParamSchema = z.object({
  releaseId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Release ID must be a positive integer"
  })
});

/**
 * Validation schema for track and release filtering
 * 
 * Used in GET /api/tracks and GET /api/releases
 */
export const contentFilterSchema = z.object({
  search: z.string().optional(),
  artistName: z.string().optional(),
  releaseTypes: z.array(z.enum(['single', 'ep', 'album', 'compilation', 'live'])).optional(),
  genres: z.array(z.string()).optional(),
  releaseStatus: z.enum(['draft', 'pending', 'approved', 'rejected', 'distributed', 'all']).optional().default('all'),
  releaseDateStart: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  releaseDateEnd: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  sort: z.enum(['title', 'releaseDate', 'created', 'updated']).optional().default('updated'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
});

/**
 * Validation schema for updating track order in a release
 * 
 * Used in PUT /api/releases/:releaseId/track-order
 */
export const updateTrackOrderSchema = z.object({
  trackOrder: z.array(
    z.object({
      trackId: z.number().int().positive(),
      trackNumber: z.number().int().positive(),
      discNumber: z.number().int().positive().optional().default(1)
    })
  )
});