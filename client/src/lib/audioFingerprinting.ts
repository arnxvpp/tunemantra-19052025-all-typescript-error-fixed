/**
 * Audio Fingerprinting Utilities
 * 
 * This module provides utilities for audio fingerprinting, copyright detection,
 * and content validation using the ACR Cloud API.
 */

import axios from 'axios';

export interface CopyrightDetectionResult {
  hasMatch: boolean;
  matchConfidence: number;
  matchedTracks: MatchedTrack[];
  possibleIssues: string[];
}

export interface MatchedTrack {
  title: string;
  artist: string;
  album?: string;
  isrc?: string;
  confidence: number;
  source: string;
}

export interface MetadataValidationResult {
  isValid: boolean;
  issues: string[];
  confidence: number;
}

export interface SampleDetectionResult {
  containsSamples: boolean;
  detectedSamples: DetectedSample[];
}

export interface DetectedSample {
  artist: string;
  title: string;
  timestampStart: string;
  timestampEnd: string;
  confidence: number;
}

/**
 * Check for copyright issues in an audio file
 */
export async function checkForCopyrightIssues(audioFile: File): Promise<CopyrightDetectionResult> {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await axios.post<CopyrightDetectionResult>(
      '/api/audio-fingerprinting/copyright-check',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error checking for copyright issues:', error);
    return {
      hasMatch: false,
      matchConfidence: 0,
      matchedTracks: [],
      possibleIssues: ['Failed to check for copyright issues. Service unavailable.']
    };
  }
}

/**
 * Validate audio metadata against fingerprinting
 */
export async function validateAudioMetadata(
  audioFile: File,
  metadata: {
    title: string;
    artist: string;
    isrc?: string;
  }
): Promise<MetadataValidationResult> {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('title', metadata.title);
    formData.append('artist', metadata.artist);
    if (metadata.isrc) {
      formData.append('isrc', metadata.isrc);
    }

    const response = await axios.post<MetadataValidationResult>(
      '/api/audio-fingerprinting/validate-metadata',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error validating audio metadata:', error);
    return {
      isValid: false,
      issues: ['Failed to validate metadata. Service unavailable.'],
      confidence: 0
    };
  }
}

/**
 * Detect samples in a track
 */
export async function detectSamplesInTrack(audioFile: File): Promise<SampleDetectionResult> {
  try {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await axios.post<SampleDetectionResult>(
      '/api/audio-fingerprinting/detect-samples',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error detecting samples:', error);
    return {
      containsSamples: false,
      detectedSamples: []
    };
  }
}

/**
 * Check if the audio fingerprinting service is available
 */
export async function checkServiceStatus(): Promise<{
  available: boolean;
  status: string;
  message: string;
}> {
  try {
    const response = await axios.get('/api/audio-fingerprinting/status');
    return {
      available: response.data.success,
      status: response.data.status,
      message: response.data.message
    };
  } catch (error) {
    console.error('Error checking audio fingerprinting service status:', error);
    return {
      available: false,
      status: 'error',
      message: 'Service unavailable'
    };
  }
}