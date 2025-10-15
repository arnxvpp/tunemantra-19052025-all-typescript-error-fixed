/**
 * Admin Import Validation Schemas
 * 
 * This module provides validation schemas for admin import endpoints.
 * These schemas ensure data integrity and consistent validation across
 * the application.
 */

import { z } from 'zod';

/**
 * File upload validation schema
 * 
 * Validates that a file was uploaded and has a supported MIME type.
 */
export const fileUploadSchema = z.object({
  file: z.any()
    .refine(file => file !== undefined && file !== null, {
      message: "File is required"
    })
});

/**
 * Import mode schema
 * 
 * Validates the import mode parameter to ensure it's one of the
 * supported import modes.
 */
export const importModeSchema = z.object({
  mode: z.enum(['merge', 'replace', 'append'], {
    errorMap: () => ({ message: "Import mode must be one of: merge, replace, append" })
  })
});

/**
 * Import platform schema
 * 
 * Validates the import platform parameter to ensure it's one of the
 * supported import platforms.
 */
export const importPlatformSchema = z.object({
  platform: z.enum(['spotify', 'apple', 'youtube', 'amazon', 'deezer', 'tidal', 'other'], {
    errorMap: () => ({ message: "Platform must be a valid distribution platform" })
  }),
  mappingId: z.number().positive().optional()
});

/**
 * Import configuration schema
 * 
 * Validates the complete import configuration with options for handling
 * data conflicts, error handling, and validation rules.
 */
export const importConfigSchema = z.object({
  mode: z.enum(['merge', 'replace', 'append']),
  platform: z.string().optional(),
  validateOnly: z.boolean().optional().default(false),
  skipErrors: z.boolean().optional().default(false),
  updateExisting: z.boolean().optional().default(true),
  fieldMappings: z.record(z.string()).optional(),
  options: z.object({
    generateMissingIds: z.boolean().optional().default(true),
    importRoyalties: z.boolean().optional().default(true),
    importAnalytics: z.boolean().optional().default(true),
    validateMetadata: z.boolean().optional().default(true)
  }).optional()
});

/**
 * Template name schema
 * 
 * Validates that the template name is one of the supported template types.
 */
export const templateParamSchema = z.object({
  template: z.enum(['releases', 'tracks', 'artists', 'royalties', 'metadata'], {
    errorMap: () => ({ message: "Template must be one of: releases, tracks, artists, royalties, metadata" })
  })
});