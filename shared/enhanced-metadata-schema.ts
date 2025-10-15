/**
 * Enhanced Metadata Schema for Music Distribution Platform
 * 
 * This file defines the database schema for the enhanced metadata system, which is
 * a critical component for managing detailed information about music releases, tracks,
 * rights management, and royalty distribution.
 * 
 * Key concepts for beginners:
 * 
 * 1. Database Schema: This defines the structure of our database tables, including
 *    what fields exist, their data types, and how tables relate to each other.
 *    Think of it as the blueprint for our database.
 * 
 * 2. PostgreSQL Enums: These restrict certain fields to specific predefined values,
 *    preventing invalid data entry. For example, contentTypeEnum restricts releases
 *    to types like 'single', 'album', etc. This ensures data consistency.
 * 
 * 3. Core Tables: The tables defined here (releases, tracks, distributionRecords,
 *    rightsManagement, royaltySplits) form the core data model for managing music metadata.
 *    Each represents a different aspect of the music distribution process.
 * 
 * 4. Zod Validation: Each table has an associated Zod schema (insertReleaseSchema, etc.)
 *    which provides type validation for data being inserted into the database. This catches
 *    errors before they reach the database, ensuring only valid data is stored.
 * 
 * 5. JSON Storage with TypeScript Interfaces: Complex structured data like ContentTags,
 *    AIAnalysis, Credits, etc. are stored as JSON in the database but have TypeScript
 *    interfaces to provide type safety when working with this data in code. This gives us
 *    flexibility in data structure while maintaining type safety.
 * 
 * 6. Relationships Between Tables: Tables are connected through foreign keys (like
 *    trackId, releaseId, etc.), creating a relational data model that allows us to
 *    query related data efficiently.
 * 
 * 7. Advanced Features: This enhanced metadata system supports sophisticated features like:
 *    - AI-powered content analysis for smart recommendations
 *    - Detailed rights management for complex ownership scenarios
 *    - Sophisticated royalty tracking with split payments
 *    - Multi-platform distribution tracking and analytics
 *    - Rich metadata for search optimization and marketing
 * 
 * The schema is designed to be both comprehensive (supporting all necessary music industry
 * metadata) and extensible (allowing for future enhancements as industry needs evolve).
 */
import { pgTable, serial, text, timestamp, json, integer, boolean, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Content type enum for different types of releases
export const contentTypeEnum = pgEnum('content_type', [
  'single', 'album', 'ep', 'compilation', 'remix', 'live'
]);

// Audio format enum
export const audioFormatEnum = pgEnum('audio_format', [
  'mp3', 'wav', 'flac', 'aac', 'ogg', 'alac', 'aiff'
]);

// Language enum for content
export const languageEnum = pgEnum('language', [
  'english', 'spanish', 'french', 'german', 'hindi', 'japanese', 'korean', 
  'portuguese', 'russian', 'mandarin', 'cantonese', 'arabic', 'instrumental'
]);

// Genre categories
export const genreCategoryEnum = pgEnum('genre_category', [
  'pop', 'rock', 'hip_hop', 'electronic', 'rb', 'country', 'latin', 
  'jazz', 'classical', 'folk', 'blues', 'metal', 'reggae', 'world'
]);

// Distribution status enum
export const distributionStatusEnum = pgEnum('distribution_status', [
  'pending', 'processing', 'distributed', 'failed', 'scheduled', 'canceled'
]);

// Role type enum
export const roleTypeEnum = pgEnum('role_type', [
  'performance', 'mechanical', 'synchronization', 'print', 'digital'
]);

// For backward compatibility, keep royaltyTypeEnum as an alias to roleTypeEnum
export const royaltyTypeEnum = roleTypeEnum;

// Content ownership type
export const ownershipTypeEnum = pgEnum('ownership_type', [
  'original', 'licensed', 'public_domain', 'sample_cleared', 'remix_authorized'
]);

// Enhanced Release table with detailed metadata structure
export const releases = pgTable("releases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  artistName: text("artist_name").notNull(),
  labelName: text("label_name").notNull(),
  upc: text("upc").notNull().unique(),
  ean: text("ean"),
  catalogNumber: text("catalog_number"),
  releaseType: contentTypeEnum("release_type").notNull().default('single'),
  genre: text("genre").notNull(),
  subGenre: text("sub_genre"),
  language: languageEnum("language").notNull(),
  parental: boolean("parental_advisory").default(false),
  description: text("description"),
  keywords: text("keywords").array(),
  status: text("status").notNull().default("draft"),
  primaryGenreCategory: genreCategoryEnum("primary_genre_category"),
  
  // Important dates
  originalReleaseDate: timestamp("original_release_date"),
  digitalReleaseDate: timestamp("digital_release_date").notNull(),
  recordingYear: integer("recording_year"),
  
  // Rights and ownership
  pLine: text("p_line"), // e.g., "℗ 2025 Label Name"
  cLine: text("c_line"), // e.g., "© 2025 Label Name"
  rightsHolder: text("rights_holder"),
  copyrightYear: integer("copyright_year"),
  publishingRights: text("publishing_rights"),
  
  // Compliance and clearance
  licensingConfirmed: boolean("licensing_confirmed").default(false),
  royaltyClearanceConfirmed: boolean("royalty_clearance_confirmed").default(false),
  territoryRestrictions: text("territory_restrictions").array(),
  
  // Enhanced metadata fields (stored as JSON)
  contentTags: json("content_tags").notNull().default([]),
  moods: json("moods").notNull().default([]),
  themes: json("themes").notNull().default([]),
  
  // AI analysis results
  aiAnalysis: json("ai_analysis").notNull().default({}),
  qualityScore: integer("quality_score"),
  
  // Artwork and assets
  artworkUrl: text("artwork_url"),
  artworkMetadata: json("artwork_metadata").notNull().default({}),
  additionalImages: json("additional_images").notNull().default([]),
  
  // Attribution and credits (detailed personnel information)
  credits: json("credits").notNull().default({}),
  
  // Distribution and marketing
  primaryDistributionPlatforms: text("primary_distribution_platforms").array(),
  exclusivityDetails: json("exclusivity_details").notNull().default({}),
  promotionalInstructions: text("promotional_instructions"),
  marketingMaterials: json("marketing_materials").notNull().default([]),
  
  // Technical information
  sourceQuality: text("source_quality"),
  masterReference: text("master_reference"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  archivedAt: timestamp("archived_at"),
});

// Enhanced Track table with detailed metadata
export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  releaseId: integer("release_id").notNull(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  version: text("version"), // e.g., "Radio Edit", "Extended Mix"
  artist: text("artist").notNull(),
  featuredArtists: text("featured_artists").array(),
  trackNumber: integer("track_number").notNull(),
  discNumber: integer("disc_number").default(1),
  isrc: text("isrc"),
  genre: text("genre").notNull(),
  subGenre: text("sub_genre"),
  language: languageEnum("language").notNull(),
  
  // Audio details
  duration: integer("duration"), // in seconds
  bpm: integer("bpm"),
  key: text("key"), // e.g., "C Major"
  timeSignature: text("time_signature"), // e.g., "4/4"
  explicit: boolean("explicit").default(false),
  
  // Rights and publishing
  songwriter: text("songwriter").array(),
  composer: text("composer").array(),
  publisher: text("publisher").array(),
  producer: text("producer").array(),
  
  // Licensing
  sampleClearance: boolean("sample_clearance").default(false),
  sampleDetails: json("sample_details").notNull().default({}),
  ownershipType: ownershipTypeEnum("ownership_type").default('original'),
  
  // Audio file metadata
  audioFormat: audioFormatEnum("audio_format"),
  filePath: text("file_path"),
  fileSize: numeric("file_size"), // in bytes
  bitrate: integer("bitrate"), // in kbps
  sampleRate: integer("sample_rate"), // in Hz
  channels: integer("channels"), // 1=mono, 2=stereo
  
  // Stem information
  stemAvailable: boolean("stem_available").default(false),
  stems: json("stems").notNull().default({}),
  
  // Enhanced metadata
  lyrics: text("lyrics"),
  moods: text("moods").array(),
  themes: text("themes").array(),
  instruments: text("instruments").array(),
  
  // AI analysis
  aiTags: json("ai_tags").notNull().default({}),
  contentAnalysis: json("content_analysis").notNull().default({}),
  
  // Status and timestamps
  status: text("status").notNull().default("draft"),
  workflowStatus: text("workflow_status").default("pending"), // e.g., "pending", "approved", "rejected"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Enhanced Distribution Records table
export const distributionRecords = pgTable("distribution_records", {
  id: serial("id").primaryKey(),
  releaseId: integer("release_id").notNull(),
  platformId: integer("platform_id").notNull(),
  status: distributionStatusEnum("status").notNull().default("pending"),
  distributionDate: timestamp("distribution_date"),
  platformReleaseId: text("platform_release_id"), // ID assigned by the platform
  
  // Platform-specific metadata
  platformMetadata: json("platform_metadata").notNull().default({}),
  platformCoverArtUrl: text("platform_cover_art_url"),
  platformUrl: text("platform_url"),
  
  // Distribution details
  formatDelivered: text("format_delivered"), // e.g., "ddex", "xml", "json"
  deliveryMethod: text("delivery_method"), // e.g., "api", "ftp", "manual"
  territories: text("territories").array().default(["worldwide"]),
  exclusions: text("exclusions").array(), // territories excluded
  
  // Pricing and availability
  pricingTier: text("pricing_tier"),
  releaseDate: timestamp("release_date"),
  preOrderDate: timestamp("pre_order_date"),
  takedownDate: timestamp("takedown_date"),
  
  // Visibility settings
  visibility: json("visibility").notNull().default({
    searchable: true,
    featured: false,
    playlistEligible: true
  }),
  
  // Performance tracking
  trackedSince: timestamp("tracked_since"),
  lastChecked: timestamp("last_checked"),
  
  // Errors and validation
  validationResults: json("validation_results").notNull().default({}),
  errorDetails: json("error_details").notNull().default({}),
  retryCount: integer("retry_count").default(0),
  lastError: text("last_error"),
  errorDate: timestamp("error_date"),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Rights and Ownership table
export const rightsManagement = pgTable("rights_management", {
  id: serial("id").primaryKey(),
  releaseId: integer("release_id"),
  trackId: integer("track_id"),
  
  // Rights type and ownership
  rightsType: text("rights_type").notNull(), // e.g., "master", "composition", "publishing"
  ownershipPercentage: numeric("ownership_percentage").notNull(),
  rightsHolder: text("rights_holder").notNull(),
  territory: text("territory").array().default(["worldwide"]),
  
  // Time period
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  
  // Documentation and verification
  documentationUrl: text("documentation_url"),
  verificationStatus: text("verification_status").default("pending"),
  verifiedBy: integer("verified_by"),
  verifiedDate: timestamp("verified_date"),
  
  // Legal details
  contractId: text("contract_id"),
  contractTerms: json("contract_terms").notNull().default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Royalty Calculations table for storing processed royalty data
export const royaltyCalculations = pgTable("royalty_calculations", {
  id: serial("id").primaryKey(),
  // Foreign keys for related data
  distributionRecordId: integer("distribution_record_id").notNull(),
  releaseId: integer("release_id").notNull(),
  trackId: integer("track_id").notNull(),
  userId: integer("user_id").notNull(),
  
  // Calculation financial data
  amount: numeric("amount").notNull(), // calculated royalty amount
  streamCount: integer("stream_count").notNull().default(0), // number of streams
  ratePerStream: numeric("rate_per_stream"), // calculated rate
  
  // Calculation metadata
  calculationDate: timestamp("calculation_date").notNull().defaultNow(),
  timeframe: json("timeframe").notNull(), // period of calculation (start and end dates)
  roleType: roleTypeEnum("role_type").notNull(),
  platformId: integer("platform_id").notNull(),
  
  // Processing and payment data
  status: text("status").notNull().default("calculated"), // calculated, processed, paid, etc.
  isProcessed: boolean("is_processed").notNull().default(false),
  processingDate: timestamp("processing_date"),
  isPaid: boolean("is_paid").notNull().default(false),
  paymentDate: timestamp("payment_date"),
  paymentReference: text("payment_reference"),
  
  // Split data
  splitId: integer("split_id"), // related to royalty_splits table if applicable
  splitPercentage: numeric("split_percentage"),
  recipientId: integer("recipient_id"), // user or participant receiving the royalty
  
  // Additional data
  metadata: json("metadata"), // additional platform-specific or tracking data
  
  // Tracking fields
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Royalty Splits table
export const royaltySplits = pgTable("royalty_splits", {
  id: serial("id").primaryKey(),
  releaseId: integer("release_id"),
  trackId: integer("track_id"),
  
  // Recipient details
  recipientId: integer("recipient_id").notNull(),
  recipientType: text("recipient_type").notNull(), // e.g., "artist", "producer", "songwriter"
  recipientName: text("recipient_name").notNull(),
  
  // Split details
  splitPercentage: numeric("split_percentage").notNull(),
  roleType: text("role_type"),
  
  // Payment details
  paymentDetails: json("payment_details").notNull().default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create insert schemas with zod validation
export const insertReleaseSchema = createInsertSchema(releases)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    archivedAt: true,
  })
  .extend({
    // Add custom validations
    title: z.string().min(1, "Title is required").max(255, "Title cannot exceed 255 characters"),
    artistName: z.string().min(1, "Artist name is required"),
    upc: z.string().regex(/^\d{12,13}$/, "UPC must be a 12 or 13 digit number"),
    digitalReleaseDate: z.date().min(new Date(), "Release date must be in the future"),
    pLine: z.string().optional().refine(
      (val) => !val || val.includes("℗"),
      { message: "P-Line should include the ℗ symbol" }
    ),
    cLine: z.string().optional().refine(
      (val) => !val || val.includes("©"),
      { message: "C-Line should include the © symbol" }
    ),
  });

export const insertTrackSchema = createInsertSchema(tracks)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    title: z.string().min(1, "Title is required"),
    isrc: z.string().regex(/^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/, "ISRC must be in format XX-XXX-YY-NNNNN").optional(),
    duration: z.number().min(1, "Duration must be at least 1 second"),
  });

export const insertDistributionRecordSchema = createInsertSchema(distributionRecords)
  .omit({
    id: true,
    status: true,
    distributionDate: true,
    platformReleaseId: true,
    createdAt: true,
    updatedAt: true,
  });

export const insertRoyaltySplitSchema = createInsertSchema(royaltySplits)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    splitPercentage: z.number().min(0).max(100, "Split percentage must be between 0 and 100"),
  });

// Insert schema for royalty calculations
export const insertRoyaltyCalculationSchema = createInsertSchema(royaltyCalculations)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    calculationDate: true,
    isProcessed: true,
    isPaid: true,
    processingDate: true,
    paymentDate: true,
  })
  .extend({
    amount: z.number().min(0, "Amount must be a positive number"),
    streamCount: z.number().min(0, "Stream count must be a non-negative number"),
    timeframe: z.object({
      startDate: z.string().or(z.date()),
      endDate: z.string().or(z.date())
    }),
    splitPercentage: z.number().min(0).max(100, "Split percentage must be between 0 and 100").optional(),
  });

// Export types
export type Release = typeof releases.$inferSelect;
export type InsertRelease = z.infer<typeof insertReleaseSchema>;

export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;

export type DistributionRecord = typeof distributionRecords.$inferSelect;
export type InsertDistributionRecord = z.infer<typeof insertDistributionRecordSchema>;

export type RoyaltySplit = typeof royaltySplits.$inferSelect;
export type InsertRoyaltySplit = z.infer<typeof insertRoyaltySplitSchema>;

export type RoyaltyCalculation = typeof royaltyCalculations.$inferSelect;
export type InsertRoyaltyCalculation = z.infer<typeof insertRoyaltyCalculationSchema>;

// Example metadata structures

// Example of content_tags field structure
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

// Example of ai_analysis field structure
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

// Example of credits field structure
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

// Example of artwork_metadata field structure
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

// Export for usage in application
export default {
  releases,
  tracks,
  distributionRecords,
  rightsManagement,
  royaltySplits,
  royaltyCalculations,
  insertReleaseSchema,
  insertTrackSchema,
  insertDistributionRecordSchema,
  insertRoyaltySplitSchema,
  insertRoyaltyCalculationSchema
};