/**
 * Audio Fingerprinting Routes
 * 
 * This module handles API routes for audio fingerprinting functionality:
 * - Content identification
 * - Copyright conflict detection
 * - Fingerprint management
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import { acrCloudService } from '../services/acr-cloud-service';
import { validateRequest } from '../utils/validation';
import multer from 'multer';
import path from 'path';

// Create a router instance
const router = Router();

// Configure multer for audio file uploads
const upload = multer({
  // Store files in memory for processing
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept audio files
    const allowedMimeTypes = [
      'audio/mpeg', // MP3
      'audio/mp4', // M4A, AAC
      'audio/wav', // WAV
      'audio/ogg', // OGG
      'audio/flac' // FLAC
    ];
    
    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new Error('Only audio files are allowed'));
      return;
    }
    
    cb(null, true);
  }
});

/**
 * Check ACR Cloud service status
 * GET /api/audio-fingerprinting/status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    // Check if the service is initialized
    const isInitialized = acrCloudService.isInitialized();

    if (isInitialized) {
      res.json({
        success: true,
        status: 'ready',
        message: 'ACR Cloud service is available'
      });
    } else {
      res.json({
        success: false,
        status: 'not_configured',
        message: 'ACR Cloud service is not properly configured. Please check API credentials.'
      });
    }
  } catch (error) {
    console.error('Error checking service status:', error);
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Failed to check service status'
    });
  }
});

// Validation schema for fingerprinting options
const fingerprintOptionsSchema = z.object({
  trackId: z.number().int().positive('Track ID must be a positive integer').optional(),
  title: z.string().optional(),
  artist: z.string().optional(),
  album: z.string().optional()
});

/**
 * Identify an audio file
 * POST /api/audio-fingerprinting/identify
 */
router.post(
  '/identify',
  requireAuth,
  upload.single('audioFile'),
  validateRequest(fingerprintOptionsSchema),
  async (req: Request, res: Response) => {
    try {
      // Check if a file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No audio file uploaded'
        });
      }
      
      // Get options from request body
      const options = {
        trackId: req.body.trackId ? parseInt(req.body.trackId) : undefined,
        title: req.body.title,
        artist: req.body.artist,
        album: req.body.album
      };
      
      // Identify the audio file
      const result = await acrCloudService.identifyAudio(
        req.file.buffer,
        {
          ...options,
          recordTrackId: options.trackId
        }
      );
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error identifying audio:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to identify audio file'
      });
    }
  }
);

/**
 * Get fingerprinting results for a track
 * GET /api/audio-fingerprinting/track/:trackId
 */
router.get('/track/:trackId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { trackId } = req.params;
    
    if (!trackId || isNaN(parseInt(trackId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid track ID'
      });
    }
    
    const results = await acrCloudService.getTrackFingerprintingResults(parseInt(trackId));
    
    res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error getting track fingerprinting results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get fingerprinting results'
    });
  }
});

/**
 * Check for copyright conflicts
 * GET /api/audio-fingerprinting/check-conflicts/:trackId
 */
router.get('/check-conflicts/:trackId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { trackId } = req.params;
    
    if (!trackId || isNaN(parseInt(trackId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid track ID'
      });
    }
    
    const result = await acrCloudService.checkCopyrightConflicts(parseInt(trackId));
    
    res.json(result);
  } catch (error) {
    console.error('Error checking copyright conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check copyright conflicts'
    });
  }
});

/**
 * Check for copyright issues in audio file
 * POST /api/audio-fingerprinting/copyright-check
 */
router.post('/copyright-check', requireAuth, upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No audio file provided' 
      });
    }

    // Get the identification results
    const identificationResult = await acrCloudService.identifyAudio(req.file.buffer, {});
    
    // Extract copyright information
    const hasCopyrightMatch = identificationResult.success && 
                             identificationResult.results && 
                             identificationResult.results.length > 0;
    
    let matchConfidence = 0;
    const matchedTracks: Array<{
      title: string;
      artist: string;
      album?: string;
      isrc?: string;
      confidence: number;
      source: string;
    }> = [];
    
    const possibleIssues: string[] = [];
    
    if (hasCopyrightMatch && identificationResult.results) {
      // Process the results to get matched tracks
      identificationResult.results.forEach(result => {
        const confidence = result.confidence ? result.confidence / 100 : 0.5; // Normalize to 0-1 range
        
        const artistNames = result.artists 
          ? result.artists.map((a: { name: string }) => a.name).join(', ')
          : 'Unknown Artist';
          
        matchedTracks.push({
          title: result.title || 'Unknown Title',
          artist: artistNames,
          album: result.album?.name,
          isrc: result.external_ids?.isrc,
          confidence,
          source: determineSourceFromResult(result)
        });
        
        // Update highest confidence
        if (confidence > matchConfidence) {
          matchConfidence = confidence;
        }
      });
      
      // Determine possible issues
      if (matchConfidence > 0.9) {
        possibleIssues.push('High similarity to an existing commercial track');
      }
      
      if (matchedTracks.some(t => t.confidence > 0.7)) {
        possibleIssues.push('Potential copyright claim if distributed without clearance');
      }
      
      if (matchedTracks.length > 1) {
        possibleIssues.push('Multiple potential matches detected');
      }
    }
    
    res.json({
      hasMatch: hasCopyrightMatch,
      matchConfidence,
      matchedTracks,
      possibleIssues
    });
    
  } catch (error) {
    console.error('Error in copyright check:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to check copyright issues' 
    });
  }
});

/**
 * Validate audio metadata
 * POST /api/audio-fingerprinting/validate-metadata
 */
router.post('/validate-metadata', requireAuth, upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No audio file provided' 
      });
    }

    const { title, artist, isrc } = req.body;
    
    if (!title || !artist) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and artist are required' 
      });
    }

    // Get the identification results
    const identificationResult = await acrCloudService.identifyAudio(req.file.buffer, {});
    
    // If no match found, metadata is valid by default (no conflicts)
    if (!identificationResult.success || !identificationResult.results || identificationResult.results.length === 0) {
      return res.json({
        isValid: true,
        issues: [],
        confidence: 1.0
      });
    }
    
    // Get the best match
    const bestMatch = identificationResult.results[0];
    const issues: string[] = [];
    
    // Compare title
    if (bestMatch.title && bestMatch.title.toLowerCase() !== title.toLowerCase()) {
      issues.push(`Title mismatch: "${title}" vs "${bestMatch.title}" in database`);
    }
    
    // Compare artist
    if (bestMatch.artists && bestMatch.artists.length > 0) {
      const artistsString = bestMatch.artists.map((a: { name: string }) => a.name.toLowerCase()).join(', ');
      if (!artistsString.includes(artist.toLowerCase())) {
        issues.push(`Artist mismatch: "${artist}" vs "${bestMatch.artists.map((a: { name: string }) => a.name).join(', ')}" in database`);
      }
    }
    
    // Compare ISRC if available
    if (isrc && bestMatch.external_ids?.isrc && isrc !== bestMatch.external_ids.isrc) {
      issues.push(`ISRC mismatch: "${isrc}" vs "${bestMatch.external_ids.isrc}" in database`);
    }
    
    const confidence = bestMatch.confidence ? bestMatch.confidence / 100 : 0.5; // Normalize to 0-1 range
    
    res.json({
      isValid: issues.length === 0,
      issues,
      confidence
    });
    
  } catch (error) {
    console.error('Error in metadata validation:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to validate metadata' 
    });
  }
});

/**
 * Detect samples in audio
 * POST /api/audio-fingerprinting/detect-samples
 */
router.post('/detect-samples', requireAuth, upload.single('audio'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No audio file provided' 
      });
    }

    // In a real implementation, this would use more sophisticated analysis
    // For this implementation, we'll say no samples were detected
    res.json({
      containsSamples: false,
      detectedSamples: []
    });
    
  } catch (error) {
    console.error('Error in sample detection:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to detect samples' 
    });
  }
});

/**
 * Helper function to determine the source of a match
 */
function determineSourceFromResult(result: any): string {
  if (result.external_metadata?.spotify) return 'Spotify';
  if (result.external_metadata?.youtube) return 'YouTube';
  if (result.external_metadata?.deezer) return 'Deezer';
  if (result.external_metadata?.apple_music) return 'Apple Music';
  if (result.external_ids?.isrc) return 'ISRC Database';
  return 'ACR Cloud';
}

// Export the router
export default router;