/**
 * Metadata Validator Service
 * 
 * This service validates metadata for music releases and tracks before distribution.
 * It ensures that all required fields are present and properly formatted according
 * to the requirements of various distribution platforms.
 */

import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { releases, tracks, distributionPlatforms } from '@shared/schema';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Standard platform requirements for various metadata fields
 */
const METADATA_REQUIREMENTS = {
  title: {
    maxLength: 100,
    minLength: 1,
    required: true,
    forbiddenChars: ['<', '>', '&', '"', "'"]
  },
  artist: {
    maxLength: 100,
    minLength: 1,
    required: true,
    forbiddenChars: ['<', '>', '&', '"', "'"]
  },
  genre: {
    required: true,
    validOptions: [
      'pop', 'rock', 'hip_hop', 'electronic', 'rb', 'country', 
      'latin', 'jazz', 'classical', 'folk', 'blues', 'metal', 
      'reggae', 'world'
    ]
  },
  releaseDate: {
    required: true,
    format: 'YYYY-MM-DD',
    constraints: {
      minDate: new Date('1900-01-01'),
      maxDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Max 1 year in future
    }
  },
  upc: {
    length: 12,
    required: true,
    pattern: /^\d{12}$/
  },
  isrc: {
    length: 12,
    required: true,
    pattern: /^[A-Z]{2}[A-Z0-9]{3}\d{2}\d{5}$/
  }
};

/**
 * Platform-specific metadata requirements
 */
const PLATFORM_REQUIREMENTS: Record<string, any> = {
  spotify: {
    audioFormat: ['mp3', 'wav', 'flac'],
    imageFormat: ['jpg', 'png'],
    coverArtResolution: {
      min: 1400,
      aspect: '1:1' // Square
    }
  },
  appleMusic: {
    audioFormat: ['aac', 'alac', 'wav'],
    imageFormat: ['jpg', 'png'],
    coverArtResolution: {
      min: 2400,
      aspect: '1:1' // Square
    }
  },
  youtube: {
    audioFormat: ['mp3', 'wav', 'flac'],
    imageFormat: ['jpg', 'png'],
    coverArtResolution: {
      min: 1280,
      aspect: '16:9' // Rectangular
    }
  }
};

export class MetadataValidator {
  /**
   * Validate a release for distribution to specific platforms
   * 
   * @param releaseId The ID of the release to validate
   * @param platformIds Array of platform IDs to validate against
   * @returns ValidationResult with errors and warnings
   */
  static async validateRelease(releaseId: number, platformIds: number[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    try {
      // Get release data
      const releaseData = await db.select().from(releases)
        .where(eq(releases.id, releaseId));
        
      if (releaseData.length === 0) {
        errors.push({
          field: 'releaseId',
          message: `Release with ID ${releaseId} not found`,
          code: 'RELEASE_NOT_FOUND'
        });
        return { valid: false, errors, warnings };
      }
      
      const release = releaseData[0];
      
      // Get track data
      const trackData = await db.select().from(tracks)
        .where(eq(tracks.releaseId, releaseId));
        
      if (trackData.length === 0) {
        errors.push({
          field: 'tracks',
          message: 'Release must have at least one track',
          code: 'NO_TRACKS'
        });
      }
      
      // Get platform data
      const platformData = await db.select().from(distributionPlatforms)
        .where(eq(distributionPlatforms.id, platformIds[0])); // Just using the first platform for now
      
      if (platformData.length === 0) {
        errors.push({
          field: 'platformId',
          message: 'Invalid platform ID',
          code: 'PLATFORM_NOT_FOUND'
        });
        return { valid: false, errors, warnings };
      }
      
      // Validate basic release metadata
      this.validateBasicMetadata(release, errors, warnings);
      
      // Validate tracks
      trackData.forEach(track => {
        this.validateTrackMetadata(track, errors, warnings);
      });
      
      // Validate assets
      this.validateAssets(release, errors, warnings);
      
      // Validate platform-specific requirements
      platformIds.forEach(platformId => {
        const platform = platformData.find(p => p.id === platformId);
        if (platform) {
          this.validatePlatformRequirements(release, trackData, platform, errors, warnings);
        }
      });
      
      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      console.error('Error validating release:', error);
      errors.push({
        field: 'general',
        message: 'An unexpected error occurred during validation',
        code: 'VALIDATION_ERROR'
      });
      return { valid: false, errors, warnings };
    }
  }
  
  /**
   * Validate basic release metadata against standard requirements
   */
  private static validateBasicMetadata(release: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Check title
    if (!release.title || release.title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Release title is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (release.title.length > METADATA_REQUIREMENTS.title.maxLength) {
      errors.push({
        field: 'title',
        message: `Title exceeds maximum length of ${METADATA_REQUIREMENTS.title.maxLength} characters`,
        code: 'FIELD_TOO_LONG'
      });
    }
    
    // Check artist
    if (!release.artist || release.artist.trim() === '') {
      errors.push({
        field: 'artist',
        message: 'Artist name is required',
        code: 'REQUIRED_FIELD'
      });
    }
    
    // Check genre
    if (!release.genre) {
      errors.push({
        field: 'genre',
        message: 'Genre is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (!METADATA_REQUIREMENTS.genre.validOptions.includes(release.genre)) {
      errors.push({
        field: 'genre',
        message: 'Invalid genre specified',
        code: 'INVALID_GENRE'
      });
    }
    
    // Check UPC
    if (!release.upc) {
      errors.push({
        field: 'upc',
        message: 'UPC is required',
        code: 'REQUIRED_FIELD'
      });
    } else if (!METADATA_REQUIREMENTS.upc.pattern.test(release.upc)) {
      errors.push({
        field: 'upc',
        message: 'UPC format is invalid. Must be 12 digits',
        code: 'INVALID_UPC'
      });
    }
    
    // Check release date
    if (!release.releaseDate) {
      errors.push({
        field: 'releaseDate',
        message: 'Release date is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      const releaseDate = new Date(release.releaseDate);
      const minDate = METADATA_REQUIREMENTS.releaseDate.constraints.minDate;
      const maxDate = METADATA_REQUIREMENTS.releaseDate.constraints.maxDate;
      
      if (isNaN(releaseDate.getTime())) {
        errors.push({
          field: 'releaseDate',
          message: 'Invalid release date format',
          code: 'INVALID_DATE'
        });
      } else if (releaseDate < minDate) {
        errors.push({
          field: 'releaseDate',
          message: `Release date cannot be before ${minDate.toISOString().split('T')[0]}`,
          code: 'DATE_TOO_EARLY'
        });
      } else if (releaseDate > maxDate) {
        errors.push({
          field: 'releaseDate',
          message: 'Release date cannot be more than 1 year in the future',
          code: 'DATE_TOO_FUTURE'
        });
      }
    }
  }
  
  /**
   * Validate track metadata
   */
  private static validateTrackMetadata(track: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Check track title
    if (!track.title || track.title.trim() === '') {
      errors.push({
        field: `track_${track.id}_title`,
        message: 'Track title is required',
        code: 'REQUIRED_FIELD'
      });
    }
    
    // Check ISRC
    if (!track.isrc) {
      errors.push({
        field: `track_${track.id}_isrc`,
        message: 'ISRC is required for each track',
        code: 'REQUIRED_FIELD'
      });
    } else if (!METADATA_REQUIREMENTS.isrc.pattern.test(track.isrc)) {
      errors.push({
        field: `track_${track.id}_isrc`,
        message: 'ISRC format is invalid',
        code: 'INVALID_ISRC'
      });
    }
    
    // Validate audio file existence
    if (track.audioFile) {
      const filePath = path.join('uploads/audio', track.audioFile);
      if (!fs.existsSync(filePath)) {
        errors.push({
          field: `track_${track.id}_audioFile`,
          message: 'Audio file not found',
          code: 'FILE_NOT_FOUND'
        });
      }
    } else {
      errors.push({
        field: `track_${track.id}_audioFile`,
        message: 'Audio file is required',
        code: 'REQUIRED_FIELD'
      });
    }
  }
  
  /**
   * Validate release assets (cover art, etc.)
   */
  private static validateAssets(release: any, errors: ValidationError[], warnings: ValidationWarning[]) {
    // Check cover art
    if (!release.coverArt) {
      errors.push({
        field: 'coverArt',
        message: 'Cover art is required',
        code: 'REQUIRED_FIELD'
      });
    } else {
      const filePath = path.join('uploads/images', release.coverArt);
      if (!fs.existsSync(filePath)) {
        errors.push({
          field: 'coverArt',
          message: 'Cover art file not found',
          code: 'FILE_NOT_FOUND'
        });
      }
    }
  }
  
  /**
   * Validate platform-specific requirements
   */
  private static validatePlatformRequirements(
    release: any, 
    tracks: any[], 
    platform: any, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ) {
    const platformName = platform.name.toLowerCase().replace(/\s+/g, '');
    const platformReqs = PLATFORM_REQUIREMENTS[platformName] || {};
    
    // Platform-specific validations
    if (platformReqs.audioFormat && tracks.length > 0) {
      tracks.forEach(track => {
        if (track.audioFile) {
          const fileExt = path.extname(track.audioFile).substring(1).toLowerCase();
          if (!platformReqs.audioFormat.includes(fileExt)) {
            errors.push({
              field: `track_${track.id}_audioFormat`,
              message: `Platform ${platform.name} requires ${platformReqs.audioFormat.join(', ')} format(s). Found: ${fileExt}`,
              code: 'INVALID_AUDIO_FORMAT'
            });
          }
        }
      });
    }
    
    // Check cover art format
    if (platformReqs.imageFormat && release.coverArt) {
      const fileExt = path.extname(release.coverArt).substring(1).toLowerCase();
      if (!platformReqs.imageFormat.includes(fileExt)) {
        errors.push({
          field: 'coverArtFormat',
          message: `Platform ${platform.name} requires ${platformReqs.imageFormat.join(', ')} image format(s). Found: ${fileExt}`,
          code: 'INVALID_IMAGE_FORMAT'
        });
      }
    }
  }
}

/**
 * Connect the metadata validator with the distribution service
 * 
 * This function allows validating metadata before distributing to platforms
 * 
 * @param releaseId Release ID to validate
 * @param platformIds Platforms to validate against
 * @returns ValidationResult with validation status and any errors/warnings
 */
export async function validateMetadataForDistribution(
  releaseId: number,
  platformIds: number[]
): Promise<ValidationResult> {
  return MetadataValidator.validateRelease(releaseId, platformIds);
}