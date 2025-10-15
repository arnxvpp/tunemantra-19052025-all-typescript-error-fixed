/**
 * Shared metadata type definitions for the enhanced music distribution platform.
 * These interfaces define the structure of the rich metadata we're capturing.
 */

// Content tags structure for advanced categorization
export interface ContentTags {
  genres: string[];
  moods: string[];
  themes: string[];
  keywords: string[];
  musicalElements: string[];
  occasions: string[];
  cultures: string[];
  eras: string[];
}

// AI analysis results structure
export interface AIAnalysis {
  summary: string;
  qualityScore: number;
  contentWarnings: string[];
  suggestedImprovements: string[];
  genrePredictions: {
    primaryGenre: string;
    confidence: number;
    secondaryGenres: Array<{genre: string, confidence: number}>;
  };
  moodPredictions: Array<{mood: string, confidence: number}>;
  similarArtists: string[];
  keyPrediction: string;
  bpmPrediction: number;
  energyLevel: number;
  danceability: number;
  marketPotential: {
    streamingPotential: number;
    radioFriendliness: number;
    commercialViability: number;
    targetDemographics: string[];
  };
}

// Comprehensive credits structure
export interface Credits {
  primaryArtist: string[];
  featuredArtists: string[];
  composers: string[];
  lyricists: string[];
  producers: string[];
  mixingEngineers: string[];
  masteringEngineers: string[];
  musicians: Array<{
    name: string;
    role: string;
    instrument?: string;
  }>;
  vocalists: Array<{
    name: string;
    role: string; // e.g., "lead", "backup", "harmony"
  }>;
  additionalPersonnel: Array<{
    name: string;
    role: string;
  }>;
  artworkCredits: {
    designer: string;
    photographer?: string;
    illustrator?: string;
    artDirector?: string;
  };
}

// Artwork metadata structure
export interface ArtworkMetadata {
  dimensions: {
    width: number;
    height: number;
  };
  resolution: number; // in DPI
  fileSize: number; // in bytes
  format: string; // e.g., "jpeg", "png"
  colorSpace: string; // e.g., "RGB", "CMYK"
  primaryColors: string[];
  hasParentalAdvisoryLabel: boolean;
  versions: Array<{
    url: string;
    purpose: string; // e.g., "cover", "thumbnail", "promo"
    dimensions: {
      width: number;
      height: number;
    };
  }>;
}

// Audio file technical metadata structure
export interface AudioMetadata {
  format: string;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  duration: number;
  bitrate: number;
  fileSize: number;
  codec: string;
  checksum: string;
}

// Enhanced sample details structure
export interface SampleDetails {
  originalTrack: string;
  originalArtist: string;
  sampleTimecodes: {
    start: string;
    end: string;
  }[];
  clearanceReference: string;
  clearanceDate?: Date;
  clearanceType: 'paid' | 'royalty' | 'free' | 'fair use';
  usageDescription: string;
}

// Distribution visibility settings
export interface VisibilitySettings {
  searchable: boolean;
  featured: boolean;
  playlistEligible: boolean;
  storeVisibility: {
    [storeName: string]: boolean;
  };
  territoryRestrictions?: string[];
}

// Stem information structure
export interface StemDetails {
  vocals?: string;
  instruments?: string;
  drums?: string;
  bass?: string;
  melody?: string;
  customStems?: {
    [name: string]: string;
  };
  format: string;
  individualLicensingAllowed: boolean;
}

// Contract terms structure
export interface ContractTerms {
  term: number; // duration in months
  territory: string[];
  royaltyRate: number;
  advanceAmount?: number;
  exclusivity: boolean;
  optionPeriods?: number;
  terminationClauses: string[];
  specialProvisions?: string[];
}

// Payment details structure
export interface PaymentDetails {
  paymentMethod: string;
  accountHolder: string;
  accountIdentifier: string; // masked for security
  currency: string;
  paymentThreshold?: number;
  taxWithholding?: number;
  taxId?: string;
}

// Enum types as string literals
export type ContentType = 'single' | 'album' | 'ep' | 'compilation' | 'remix' | 'live';
export type AudioFormat = 'mp3' | 'wav' | 'flac' | 'aac' | 'ogg' | 'alac' | 'aiff';
export type LanguageCode = 'english' | 'spanish' | 'french' | 'german' | 'hindi' | 
                         'japanese' | 'korean' | 'portuguese' | 'russian' | 
                         'mandarin' | 'cantonese' | 'arabic' | 'instrumental';
export type GenreCategory = 'pop' | 'rock' | 'hip_hop' | 'electronic' | 'rb' | 
                           'country' | 'latin' | 'jazz' | 'classical' | 'folk' | 
                           'blues' | 'metal' | 'reggae' | 'world';
export type DistributionStatus = 'pending' | 'processing' | 'distributed' | 
                                'failed' | 'scheduled' | 'canceled';
export type RoyaltyType = 'performance' | 'mechanical' | 'synchronization' | 'print' | 'digital';
export type OwnershipType = 'original' | 'licensed' | 'public_domain' | 
                           'sample_cleared' | 'remix_authorized';