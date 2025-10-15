/**
 * Database Schema Definition
 * 
 * This file defines the structure of our PostgreSQL database using Drizzle ORM.
 * The schema defines tables, columns, relationships, and types for our database.
 * 
 * Key concepts:
 * - pgTable: Creates a new database table
 * - pgEnum: Creates a PostgreSQL enum type (a list of allowed values)
 * - Relations: Defines how tables are connected to each other
 * - Zod schemas: Provides validation for data insertion
 */

// Import Drizzle ORM relations to define connections between tables
import { relations } from "drizzle-orm";

// Import PostgreSQL-specific column types from Drizzle ORM
import { pgTable, serial, text, timestamp, integer, boolean, json, pgEnum, numeric, date, varchar } from "drizzle-orm/pg-core";

// Import zod for validation schemas
import { z } from "zod";

// Import utility to create insert validation schemas based on database tables
import { createInsertSchema } from "drizzle-zod";

/**
 * User Role Enumeration
 * 
 * This creates a PostgreSQL enum type that restricts the 'role' column 
 * to only these specific values. Each role has different permissions
 * and pricing tiers in the platform.
 */
export const userRoleEnum = pgEnum('user_role', [
  'admin',             // Complete system access (platform owner)
  'label',             // Manage label settings, create sub-labels (6000 INR/year)
  'artist_manager',    // Manage multiple artists (2499 INR/year)
  'artist',            // Upload content, track performance (999 INR/year)
  'team_member'        // Employee of label/artist with limited permissions (role assigned by admins)
]);

/**
 * User Account Status Enumeration
 * 
 * This enum tracks the current state of a user account.
 * It helps manage the user lifecycle from registration to termination.
 */
export const userStatusEnum = pgEnum('user_status', [
  'active',            // Account is active and can access all features
  'pending',           // Account is waiting for initial setup/verification
  'pending_approval',  // Account is waiting for admin approval after payment
  'suspended',         // Account is temporarily disabled (temporary block)
  'rejected',          // Account was rejected by admin (permanent rejection)
  'inactive'           // Account is not active (e.g., expired subscription)
]);

/**
 * Approval Status Enumeration
 * 
 * This enum is used for tracking approval workflows, particularly
 * for new accounts that require admin review before activation.
 */
export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',           // Waiting for admin review
  'approved',          // Account has been approved
  'rejected'           // Account has been rejected
]);

// Note: SuperAdmin table has been removed in favor of consolidated 'admin' role
// All administrator accounts are now managed through the users table with role='admin'
// This comment is kept for reference to the previous implementation

// User table with role-based access control
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  phoneNumber: text("phone_number"),
  entityName: text("entity_name"),
  avatarUrl: text("avatar_url"),
  taxInformation: json("tax_information").$type<{ taxId?: string; businessType?: string; address?: string }>().default({}), // Added type hint
  role: userRoleEnum("role").default("artist"), // Role-based access control
  permissions: json("permissions").$type<Record<string, boolean>>().default({}), // Added type hint
  parentId: integer("parent_id"), // For hierarchical relationships (e.g., artists under a manager)
  subscriptionInfo: json("subscription_info").$type<{ plan?: string; status?: string; startDate?: string; endDate?: string; paymentId?: string; maxArtists?: number; maxReleases?: number; features?: string[]; priceInINR?: number; yearlyPriceInINR?: number }>().default({}), // Added type hint
  subscriptionEndDate: timestamp("subscription_end_date"), // When the subscription expires
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  status: userStatusEnum("status").default("active"),
  clientId: text("client_id").unique(), // Unique client ID field
});

// API Keys table
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  scopes: json("scopes").$type<string[]>().default([]), // Added type hint
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
});

// Enhanced audit logs table
export const subLabelAuditLogs = pgTable("sub_label_audit_logs", {
  id: serial("id").primaryKey(),
  subLabelId: integer("sub_label_id").notNull(),
  changedById: integer("changed_by_id").notNull(),
  action: text("action").notNull(),
  category: text("category").notNull(), // "permissions", "team", "settings", "releases"
  previousValue: json("previous_value"),
  newValue: json("new_value"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: json("metadata").default({}),
});

// Permission templates table
export const permissionTemplates = pgTable("permission_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  settings: json("settings").notNull(), // Consider defining a specific type
  createdById: integer("created_by_id").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Release approval workflows
export const releaseApprovals = pgTable("release_approvals", {
  id: serial("id").primaryKey(),
  releaseId: integer("release_id").notNull(),
  subLabelId: integer("sub_label_id").notNull(),
  requestedById: integer("requested_by_id").notNull(),
  approvedById: integer("approved_by_id"), // This field seems to be missing in the relations below, using reviewedById instead
  reviewedById: integer("reviewed_by_id"), // Added based on relation usage
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  comments: text("comments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Enhanced label settings schema
export const labelSettingsSchema = z.object({
  canCreateReleases: z.boolean().default(true),
  canManageArtists: z.boolean().default(false),
  canViewAnalytics: z.boolean().default(true),
  canManageDistribution: z.boolean().default(false),
  maxArtists: z.number().default(5),
  maxReleasesPerMonth: z.number().default(10),
  // Enhanced permissions
  canManageRoyalties: z.boolean().default(false),
  canEditMetadata: z.boolean().default(true),
  canAccessFinancials: z.boolean().default(false),
  canInviteUsers: z.boolean().default(false),
  requireApprovalForReleases: z.boolean().default(true),
  canOverrideApprovals: z.boolean().default(false),
  territoryRestrictions: z.array(z.string()).default([]),
  reportingAccess: z.enum(["none", "basic", "advanced", "full"]).default("basic"),
  // Team management
  canManageTeam: z.boolean().default(false),
  maxTeamMembers: z.number().default(5),
  teamHierarchy: z.enum(["flat", "two_level", "three_level"]).default("flat"),
  // Release thresholds
  minQualityScore: z.number().min(0).max(100).default(80),
  releaseApprovalThreshold: z.number().min(1).default(1),
  // Financial limits
  monthlyBudget: z.number().optional(),
  perReleaseBudget: z.number().optional(),
});

// Enhanced user schema with role-based access control
export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
    fullName: true,
    phoneNumber: true,
    entityName: true,
    status: true,
    clientId: true,
    role: true,
    parentId: true,
  })
  .extend({
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    fullName: z.string().min(2, "Full name must be at least 2 characters").optional(),
    entityName: z.string().optional(),
    status: z.enum([
      "active", 
      "suspended", 
      "pending", 
      "pending_approval", 
      "rejected", 
      "inactive"
    ]).optional(),
    clientId: z.string().optional(),
    role: z.enum(["admin", "label", "artist_manager", "artist", "team_member"]).optional(),
    parentId: z.number().optional(),
    permissions: z.object({
      canCreateReleases: z.boolean().optional(),
      canManageArtists: z.boolean().optional(),
      canViewAnalytics: z.boolean().optional(),
      canManageDistribution: z.boolean().optional(),
      canManageRoyalties: z.boolean().optional(),
      canEditMetadata: z.boolean().optional(),
      canAccessFinancials: z.boolean().optional(),
      canInviteUsers: z.boolean().optional(),
    }).optional(),
    subscriptionInfo: z.object({
      plan: z.enum(["label", "artist_manager", "artist", "free"]).optional(),
      status: z.enum(["active", "inactive", "pending", "pending_approval", "canceled", "expired", "rejected"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      paymentId: z.string().optional(),
      maxArtists: z.number().optional(),
      maxReleases: z.number().optional(),
      features: z.array(z.string()).optional(),
      priceInINR: z.number().optional(),
      yearlyPriceInINR: z.number().optional(),
    }).optional(),
  });

// API Key schema
export const insertApiKeySchema = createInsertSchema(apiKeys)
  .omit({
    id: true,
    key: true,
    createdAt: true,
    lastUsed: true,
    isActive: true
  })
  .extend({
    name: z.string().min(1, "Name is required"),
    scopes: z.array(z.string()).default([]),
    expiresAt: z.date().optional()
  });

// Enhanced tracks table with release relationship
export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  releaseId: integer("release_id").notNull(), // Add relationship to releases
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  artistName: text("artist_name"), // Consistent with releases table naming
  genre: text("genre").notNull(),
  releaseDate: timestamp("release_date").notNull(),
  status: text("status").notNull().default("draft"),
  isrc: text("isrc").unique(), // International Standard Recording Code
  duration: integer("duration").default(0), // Duration in seconds
  metadata: json("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Update releases table with content tags and type
export const releases = pgTable("releases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  artistName: text("artist_name").notNull(),
  labelName: text("label_name").notNull(),
  upc: text("upc").notNull().unique(),
  genre: text("genre").notNull(),
  language: text("language").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"),
  type: text("type").notNull().default("audio"),
  releaseDate: timestamp("release_date").notNull(),
  contentTags: json("content_tags").$type<string[]>().notNull().default([]), // Added type hint
  aiAnalysis: json("ai_analysis").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Keep existing tables for analytics and daily stats
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").notNull(),
  releaseId: integer("release_id"),
  date: timestamp("date").notNull(),
  platform: text("platform").notNull(),
  streams: integer("streams").notNull().default(0),
  revenue: numeric("revenue").notNull().default("0"),
  country: text("country").default("unknown"),
  city: text("city").default("unknown"),
  playlistAdds: integer("playlist_adds").default(0),
  saves: integer("saves").default(0),
  shares: integer("shares").default(0),
  likes: integer("likes").default(0), // Added likes column
  comments: integer("comments").default(0), // Added comments column
  avgPlayTime: numeric("avg_play_time").default("0"),
  event: text("event"),
  eventDetails: json("event_details"),
  demographics: json("demographics").default({
    age: {
      "18-24": 0,
      "25-34": 0,
      "35-44": 0,
      "45+": 0
    },
    gender: {
      male: 0,
      female: 0,
      other: 0
    }
  }),
});

export const dailyStats = pgTable("daily_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Added userId column
  trackId: integer("track_id").notNull(),
  date: timestamp("date").notNull(),
  platform: text("platform").notNull(),
  totalStreams: integer("total_streams").notNull().default(0),
  totalRevenue: numeric("total_revenue").notNull().default("0"),
  uniqueListeners: integer("unique_listeners").notNull().default(0),
  avgListenTime: numeric("avg_listen_time").notNull().default("0"),
});

// Update release schema with new fields and validation
export const insertReleaseSchema = createInsertSchema(releases)
  .omit({
    id: true,
    userId: true,
    createdAt: true,
    updatedAt: true,
    contentTags: true,
    aiAnalysis: true
  })
  .extend({
    title: z.string().min(1, "Title is required").max(200, "Title cannot exceed 200 characters"),
    artistName: z.string().min(1, "Artist name is required").max(100, "Artist name cannot exceed 100 characters"),
    labelName: z.string().min(1, "Label name is required").max(100, "Label name cannot exceed 100 characters"),
    genre: z.string().min(1, "Genre is required"),
    language: z.string().min(1, "Language is required"),
    description: z.string().max(2000, "Description cannot exceed 2000 characters").optional(),
    type: z.enum(['audio', 'video']).default('audio'),
    status: z.enum(['draft', 'pending', 'published', 'rejected']).default('draft'),
    releaseDate: z.date().min(new Date(), "Release date must be in the future"),
    upc: z.string()
      .regex(/^\d{12,13}$/, "UPC must be 12-13 digits")
      .optional()
      .transform((val) => val || generateUPC()),
  });

// Helper function to generate UPC (placeholder implementation)
function generateUPC(): string {
  return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

// Update track schema validation
export const insertTrackSchema = createInsertSchema(tracks)
  .omit({ id: true, userId: true, createdAt: true })
  .extend({
    releaseDate: z.string(), // Keep as string if form uses string date
  });

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
});

export const insertDailyStatsSchema = createInsertSchema(dailyStats).omit({
  id: true,
});

// Add payment methods table
export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'bank_account', 'paypal'
  name: text("name").notNull(),
  details: json("details").notNull(), // For bank: account number, routing. For PayPal: email
  isDefault: boolean("is_default").notNull().default(false),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Add Zod schema export for payment methods
export const insertPaymentMethodSchema = createInsertSchema(paymentMethods);

// Add withdrawals table
export const withdrawals = pgTable("withdrawals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  paymentMethodId: integer("payment_method_id").notNull(),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  processedAt: timestamp("processed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Add revenue shares table for split payments
export const revenueShares = pgTable("revenue_shares", {
  id: serial("id").primaryKey(),
  releaseId: integer("release_id").notNull(),
  userId: integer("user_id").notNull(),
  splitPercentage: numeric("split_percentage").notNull(),
  isConfirmed: boolean("is_confirmed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Blockchain Networks Enumeration
 * 
 * This enum represents the different blockchain networks that the system supports
 * for NFT minting and rights management.
 */
export const blockchainNetworkEnum = pgEnum('blockchain_network', [
  'ethereum',         // Ethereum Mainnet
  'polygon',          // Polygon Mainnet
  'mumbai',           // Polygon Mumbai Testnet
  'optimism',         // Optimism L2
  'arbitrum',         // Arbitrum L2
  'base'              // Base L2
]);

/**
 * Asset Types Enumeration
 * 
 * This enum represents the different types of music assets that can have rights registered
 */
export const assetTypeEnum = pgEnum('asset_type', [
  'track',            // Individual song/track
  'album',            // Collection of tracks
  'composition',      // Musical composition/songwriting
  'sample',           // Audio sample
  'stem',             // Individual track component
  'remix'             // Remix of original track
]);

/**
 * Rights Types Enumeration
 * 
 * This enum represents the different types of rights that can be registered
 */
export const rightsTypeEnum = pgEnum('rights_type', [
  'master',           // Master recording rights
  'publishing',       // Publishing/songwriting rights
  'sync',             // Synchronization rights (for video/film)
  'mechanical',       // Mechanical reproduction rights
  'performance',      // Performance rights
  'derivative'        // Rights to create derivative works
]);

/**
 * Owner Types Enumeration
 * 
 * This enum represents the different types of rights owners
 */
export const ownerTypeEnum = pgEnum('owner_type', [
  'artist',           // Performing artist
  'songwriter',       // Songwriter/composer
  'producer',         // Music producer
  'label',            // Record label
  'publisher',        // Music publisher
  'distributor'       // Distribution company
]);

// Blockchain NFT Tokens table
export const nftTokens = pgTable("nft_tokens", {
  id: serial("id").primaryKey(),
  tokenId: text("token_id").notNull().unique(),
  assetId: text("asset_id").notNull(),        // Reference to the music asset (track/album ID)
  contractAddress: text("contract_address").notNull(),
  ownerAddress: text("owner_address").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  networkId: blockchainNetworkEnum("network_id").notNull(),
  metadata: json("metadata").notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  mintedBy: integer("minted_by").notNull(),   // User ID who minted the token
  status: text("status").notNull().default("active"), // active, transferred, burned
});

// Rights Management table
export const rightsRecords = pgTable("rights_records", {
  id: serial("id").primaryKey(),
  assetId: text("asset_id").notNull(),
  assetType: assetTypeEnum("asset_type").notNull(),
  rightsType: rightsTypeEnum("rights_type").notNull(),
  ownerType: ownerTypeEnum("owner_type").notNull(),
  ownerId: integer("owner_id").notNull(),     // User ID of the rights owner
  ownerAddress: text("owner_address"),         // Optional blockchain address of rights owner
  percentage: numeric("percentage").notNull(), // Ownership percentage (0-100)
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  territory: text("territory").default('worldwide'), // Territory where rights apply (updated to match DB)
  source: text("source").notNull(), // Rights source (added to match existing DB)
  documentUrls: json("document_urls"), // URLS of supporting docs (added to match existing DB)
  agreementId: text("agreement_id"), // Reference to a legal agreement (added to match existing DB)
  blockchainRecordId: text("blockchain_record_id"), // Updated to match actual DB column
  // Note: transactionHash is not present in the database schema
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Rights Verification table
export const rightsVerifications = pgTable("rights_verifications", {
  id: serial("id").primaryKey(),
  rightsRecordId: integer("rights_record_id").notNull(),
  verifiedBy: integer("verified_by").notNull(), // Corrected field name
  verificationMethod: text("verification_method").notNull(), // e.g., "blockchain", "manual"
  status: text("status").notNull().default("pending"), // "pending", "verified", "failed"
  verificationDetails: json("verification_details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Blockchain Transactions table
export const blockchainTransactions = pgTable("blockchain_transactions", {
  id: serial("id").primaryKey(),
  transactionHash: text("transaction_hash").notNull().unique(),
  networkId: blockchainNetworkEnum("network_id").notNull(),
  blockNumber: integer("block_number"),
  fromAddress: text("from_address"),
  toAddress: text("to_address"),
  action: text("action").notNull(), // e.g., "register_rights", "transfer_nft"
  status: text("status").notNull().default("pending"), // "pending", "confirmed", "failed"
  gasUsed: numeric("gas_used"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: json("metadata"),
  // userId: integer("user_id"), // Field seems missing, relation commented out below
});

// Rights Disputes table
export const rightsDisputes = pgTable("rights_disputes", {
  id: serial("id").primaryKey(),
  rightsRecordId: integer("rights_record_id").notNull(),
  claimantId: integer("claimant_id").notNull(), // Corrected field name
  defendantId: integer("defendant_id").notNull(), // Corrected field name
  status: text("status").notNull().default("open"), // "open", "resolved", "closed"
  description: text("description").notNull(),
  evidenceUrls: json("evidence_urls"),
  resolutionDetails: text("resolution_details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  // resolvedById: integer("resolved_by_id"), // Field seems missing, relation commented out below
});

// Account Approvals table
export const accountApprovals = pgTable("account_approvals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  status: approvalStatusEnum("status").default("pending"),
  reviewedById: integer("reviewed_by_id"), // Corrected field name
  comments: text("comments"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Support Tickets table
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // e.g., "billing", "technical", "distribution"
  status: text("status").notNull().default("open"), // "open", "in_progress", "resolved", "closed"
  priority: text("priority").default("medium"), // "low", "medium", "high", "urgent"
  assignedToId: integer("assigned_to_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Ticket Replies table
export const ticketReplies = pgTable("ticket_replies", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  userId: integer("user_id").notNull(), // ID of the user who replied (can be customer or support agent)
  message: text("message").notNull(),
  isInternalNote: boolean("is_internal_note").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// White Label Settings table
export const whiteLabelSettings = pgTable("white_label_settings", {
  id: serial("id").primaryKey(),
  labelId: integer("label_id").notNull().unique(), // Link to the 'label' user
  brandName: text("brand_name").notNull(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  customDomain: text("custom_domain"),
  customLoginUrl: text("custom_login_url"),
  contactInfo: json("contact_info"), // { email, phone, address, companyName, supportEmail }
  featureFlags: json("feature_flags"), // { analytics: true, bulkOperations: false, ... }
  userLimits: json("user_limits"), // { maxUsers, maxArtistsPerUser, maxReleasesPerMonth }
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Asset Bundle tables
export const assetBundles = pgTable("asset_bundles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const assetVersions = pgTable("asset_versions", {
  id: serial("id").primaryKey(),
  bundleId: integer("asset_bundle_id").notNull(),
  versionNumber: integer("version_number").notNull(),
  metadataFileUrl: text("metadata_file_url"),
  audioFileUrls: json("audio_file_urls").default([]),
  artworkFileUrls: json("artwork_file_urls").default([]),
  analyticsFileUrl: text("analytics_file_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const bundleAnalytics = pgTable("bundle_analytics", {
  id: serial("id").primaryKey(),
  bundleId: integer("asset_bundle_id").notNull(),
  date: timestamp("date").notNull(),
  totalStreams: integer("total_streams").default(0),
  totalRevenue: numeric("total_revenue").default("0"),
  platformBreakdown: json("platform_breakdown").default({}),
  geographicBreakdown: json("geographic_breakdown").default({}),
});

export const importBatches = pgTable("import_batches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  totalItems: integer("total_items").default(0),
  processedItems: integer("processed_items").default(0),
  failedItems: integer("failed_items").default(0),
  logUrl: text("log_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Zod schemas for Asset Bundles
export const assetBundleSchema = createInsertSchema(assetBundles).omit({ id: true, createdAt: true, updatedAt: true, status: true });
export const assetVersionSchema = createInsertSchema(assetVersions).omit({ id: true, createdAt: true });
export const bundleAnalyticsSchema = createInsertSchema(bundleAnalytics).omit({ id: true });
export const importBatchSchema = createInsertSchema(importBatches).omit({ id: true, createdAt: true, completedAt: true, status: true });

// Export types
export type AssetBundle = typeof assetBundles.$inferSelect;
export type InsertAssetBundle = z.infer<typeof assetBundleSchema>;
export type AssetVersion = typeof assetVersions.$inferSelect;
export type InsertAssetVersion = z.infer<typeof assetVersionSchema>;
export type BundleAnalytics = typeof bundleAnalytics.$inferSelect;
export type InsertBundleAnalytics = z.infer<typeof bundleAnalyticsSchema>;
export type ImportBatch = typeof importBatches.$inferSelect;
export type InsertImportBatch = z.infer<typeof importBatchSchema>;

// Define relations between tables
export const usersRelations = relations(users, ({ many, one }) => ({
  approvals: many(accountApprovals),
  apiKeys: many(apiKeys),
  tracks: many(tracks),
  releases: many(releases),
  paymentMethods: many(paymentMethods),
  withdrawals: many(withdrawals),
  supportTickets: many(supportTickets),
  nftTokens: many(nftTokens, { relationName: "userNftTokens" }),
  rightsRecords: many(rightsRecords, { relationName: "userRightsRecords" }),
  // blockchainTransactions: many(blockchainTransactions, { relationName: "userBlockchainTransactions" }), // Commented out as userId seems missing
  assetBundles: many(assetBundles),
  importBatches: many(importBatches),
  // Add relations for parent/child users if needed
  parentUser: one(users, {
    fields: [users.parentId],
    references: [users.id],
    relationName: 'parent',
  }),
  childUsers: many(users, { relationName: 'parent' }),
  // Add relations for audit logs, templates, approvals
  subLabelAuditLogsChangedBy: many(subLabelAuditLogs, { relationName: 'changedBy' }),
  permissionTemplatesCreatedBy: many(permissionTemplates, { relationName: 'createdBy' }),
  releaseApprovalsRequestedBy: many(releaseApprovals, { relationName: 'requestedBy' }),
  releaseApprovalsApprovedBy: many(releaseApprovals, { relationName: 'approvedBy' }),
  whiteLabelSetting: one(whiteLabelSettings, {
    fields: [users.id],
    references: [whiteLabelSettings.labelId],
  }),
}));

export const accountApprovalsRelations = relations(accountApprovals, ({ one }) => ({
  user: one(users, {
    fields: [accountApprovals.userId],
    references: [users.id]
  }),
  // Correct field name: reviewedById
  approvedBy: one(users, { 
    fields: [accountApprovals.reviewedById], 
    references: [users.id],
    relationName: 'reviewer' // Added relationName for clarity
  })
}));

// Blockchain relations
export const nftTokensRelations = relations(nftTokens, ({ one }) => ({
  user: one(users, { // Changed relation name to user for consistency
    fields: [nftTokens.mintedBy],
    references: [users.id],
    relationName: "userNftTokens"
  })
}));

export const rightsRecordsRelations = relations(rightsRecords, ({ one, many }) => ({
  owner: one(users, {
    fields: [rightsRecords.ownerId],
    references: [users.id],
    relationName: "userRightsRecords"
  }),
  verifications: many(rightsVerifications),
  disputes: many(rightsDisputes) // Added relation to disputes
}));

export const rightsVerificationsRelations = relations(rightsVerifications, ({ one }) => ({
  rightsRecord: one(rightsRecords, {
    fields: [rightsVerifications.rightsRecordId],
    references: [rightsRecords.id]
  }),
   // Correct field name: verifiedBy
  verifier: one(users, {
    fields: [rightsVerifications.verifiedBy], 
    references: [users.id],
    relationName: 'verifier' // Added relationName for clarity
  })
}));

export const blockchainTransactionsRelations = relations(blockchainTransactions, ({ one }) => ({
  // TODO: Check if blockchainTransactions table has a userId field. Commenting out for now.
  // user: one(users, {
  //   fields: [blockchainTransactions.userId], 
  //   references: [users.id],
  //   relationName: "userBlockchainTransactions"
  // })
}));

export const rightsDisputesRelations = relations(rightsDisputes, ({ one }) => ({
  rightsRecord: one(rightsRecords, {
    fields: [rightsDisputes.rightsRecordId],
    references: [rightsRecords.id]
  }),
   // Correct field name: claimantId
  complainant: one(users, {
    fields: [rightsDisputes.claimantId], 
    references: [users.id],
    relationName: 'complainant' // Added relationName
  }),
   // Correct field name: defendantId
  respondent: one(users, {
    fields: [rightsDisputes.defendantId], 
    references: [users.id],
    relationName: 'defendant' // Added relationName
  }),
  // TODO: Check if rightsDisputes table has a resolvedById field. Commenting out for now.
  // resolvedBy: one(users, {
  //   fields: [rightsDisputes.resolvedById], 
  //   references: [users.id],
  //   relationName: 'resolver' // Added relationName
  // })
}));

// Asset Bundle Relations
export const assetBundlesRelations = relations(assetBundles, ({ one, many }) => ({
  user: one(users, {
    fields: [assetBundles.userId],
    references: [users.id],
  }),
  versions: many(assetVersions),
  analytics: many(bundleAnalytics),
}));

export const assetVersionsRelations = relations(assetVersions, ({ one }) => ({
  bundle: one(assetBundles, {
    fields: [assetVersions.bundleId],
    references: [assetBundles.id],
  }),
}));

export const bundleAnalyticsRelations = relations(bundleAnalytics, ({ one }) => ({
  bundle: one(assetBundles, {
    fields: [bundleAnalytics.bundleId],
    references: [assetBundles.id],
  }),
}));

export const importBatchesRelations = relations(importBatches, ({ one }) => ({
  user: one(users, {
    fields: [importBatches.userId],
    references: [users.id],
  }),
}));

// Add other relations as needed (Tracks, Releases, Analytics, etc.)
export const tracksRelations = relations(tracks, ({ one, many }) => ({
  user: one(users, { fields: [tracks.userId], references: [users.id] }),
  release: one(releases, { fields: [tracks.releaseId], references: [releases.id] }),
  analytics: many(analytics),
  dailyStats: many(dailyStats),
}));

export const releasesRelations = relations(releases, ({ one, many }) => ({
  user: one(users, { fields: [releases.userId], references: [users.id] }),
  tracks: many(tracks),
  analytics: many(analytics),
  revenueShares: many(revenueShares),
  releaseApprovals: many(releaseApprovals),
}));

export const analyticsRelations = relations(analytics, ({ one }) => ({
  track: one(tracks, { fields: [analytics.trackId], references: [tracks.id] }),
  release: one(releases, { fields: [analytics.releaseId], references: [releases.id] }),
}));

export const dailyStatsRelations = relations(dailyStats, ({ one }) => ({
  track: one(tracks, { fields: [dailyStats.trackId], references: [tracks.id] }),
}));

export const paymentMethodsRelations = relations(paymentMethods, ({ one, many }) => ({
  user: one(users, { fields: [paymentMethods.userId], references: [users.id] }),
  withdrawals: many(withdrawals),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, { fields: [withdrawals.userId], references: [users.id] }),
  paymentMethod: one(paymentMethods, { fields: [withdrawals.paymentMethodId], references: [paymentMethods.id] }),
}));

export const revenueSharesRelations = relations(revenueShares, ({ one }) => ({
  release: one(releases, { fields: [revenueShares.releaseId], references: [releases.id] }),
  user: one(users, { fields: [revenueShares.userId], references: [users.id] }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one, many }) => ({
  user: one(users, { fields: [supportTickets.userId], references: [users.id] }),
  assignedAgent: one(users, { fields: [supportTickets.assignedToId], references: [users.id], relationName: 'assignedAgent' }),
  replies: many(ticketReplies),
}));

export const ticketRepliesRelations = relations(ticketReplies, ({ one }) => ({
  ticket: one(supportTickets, { fields: [ticketReplies.ticketId], references: [supportTickets.id] }),
  user: one(users, { fields: [ticketReplies.userId], references: [users.id] }),
}));

export const whiteLabelSettingsRelations = relations(whiteLabelSettings, ({ one }) => ({
  labelUser: one(users, { fields: [whiteLabelSettings.labelId], references: [users.id] }),
}));

export const subLabelAuditLogsRelations = relations(subLabelAuditLogs, ({ one }) => ({
  subLabel: one(users, { fields: [subLabelAuditLogs.subLabelId], references: [users.id], relationName: 'subLabel' }),
  changedBy: one(users, { fields: [subLabelAuditLogs.changedById], references: [users.id], relationName: 'changedBy' }),
}));

export const permissionTemplatesRelations = relations(permissionTemplates, ({ one }) => ({
  createdBy: one(users, { fields: [permissionTemplates.createdById], references: [users.id], relationName: 'createdBy' }),
}));

export const releaseApprovalsRelations = relations(releaseApprovals, ({ one }) => ({
  release: one(releases, { fields: [releaseApprovals.releaseId], references: [releases.id] }),
  subLabel: one(users, { fields: [releaseApprovals.subLabelId], references: [users.id], relationName: 'subLabelApproval' }),
  requestedBy: one(users, { fields: [releaseApprovals.requestedById], references: [users.id], relationName: 'requestedBy' }),
  approvedBy: one(users, { fields: [releaseApprovals.approvedById], references: [users.id], relationName: 'approvedBy' }),
}));

// Export inferred types for use in application (Add missing ones)
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;
export type Track = typeof tracks.$inferSelect;
export type InsertTrack = typeof tracks.$inferInsert;
export type Release = typeof releases.$inferSelect;
export type InsertRelease = typeof releases.$inferInsert;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = typeof analytics.$inferInsert;
export type DailyStats = typeof dailyStats.$inferSelect;
export type InsertDailyStats = typeof dailyStats.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type InsertWithdrawal = typeof withdrawals.$inferInsert;
export type RevenueShare = typeof revenueShares.$inferSelect;
export type InsertRevenueShare = typeof revenueShares.$inferInsert;
export type NftToken = typeof nftTokens.$inferSelect;
export type InsertNftToken = typeof nftTokens.$inferInsert;
export type RightsRecord = typeof rightsRecords.$inferSelect;
export type InsertRightsRecord = typeof rightsRecords.$inferInsert;
export type RightsVerification = typeof rightsVerifications.$inferSelect;
export type InsertRightsVerification = typeof rightsVerifications.$inferInsert;
export type BlockchainTransaction = typeof blockchainTransactions.$inferSelect;
export type InsertBlockchainTransaction = typeof blockchainTransactions.$inferInsert;
export type RightsDispute = typeof rightsDisputes.$inferSelect;
export type InsertRightsDispute = typeof rightsDisputes.$inferInsert;
export type AccountApproval = typeof accountApprovals.$inferSelect;
export type InsertAccountApproval = typeof accountApprovals.$inferInsert;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type TicketReply = typeof ticketReplies.$inferSelect;
export type InsertTicketReply = typeof ticketReplies.$inferInsert;
export type WhiteLabelSetting = typeof whiteLabelSettings.$inferSelect;
export type InsertWhiteLabelSetting = typeof whiteLabelSettings.$inferInsert;
export type SubLabelAuditLog = typeof subLabelAuditLogs.$inferSelect;
export type InsertSubLabelAuditLog = typeof subLabelAuditLogs.$inferInsert;
export type PermissionTemplate = typeof permissionTemplates.$inferSelect;
export type InsertPermissionTemplate = typeof permissionTemplates.$inferInsert;
export type ReleaseApproval = typeof releaseApprovals.$inferSelect;
export type InsertReleaseApproval = typeof releaseApprovals.$inferInsert;
// Remove duplicated AssetBundle related type exports (already defined above)

// Add missing table definitions
export const distributionPlatforms = pgTable("distribution_platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  apiUrl: text("api_url"),
  apiKey: text("api_key"), // Sensitive, consider encryption or secure storage
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const distributionRecords = pgTable("distribution_records", {
  id: serial("id").primaryKey(),
  releaseId: integer("release_id").notNull(),
  platformId: integer("platform_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  distributedAt: timestamp("distributed_at"),
  platformReferenceId: text("platform_reference_id"), // ID from the platform
  errorDetails: text("error_details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  royaltyIntegrationStatus: text("royalty_integration_status").default("pending"), // pending, initialized, processed, failed
  statusDetails: json("status_details").$type<{ message?: string; processingDate?: string; recordsCreated?: number; royaltyProcessed?: boolean }>().default({}), // For detailed status info
  lastUpdateDetails: json("last_update_details").$type<{ message?: string; timestamp?: string; trackCount?: number }>().default({}), // For tracking updates
});

export const scheduledDistributions = pgTable("scheduled_distributions", {
  id: serial("id").primaryKey(),
  releaseId: integer("release_id").notNull(),
  platformId: integer("platform_id").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, processing, completed, failed, cancelled
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const royaltyCalculations = pgTable("royalty_calculations", {
  id: serial("id").primaryKey(),
  trackId: integer("track_id").notNull(),
  distributionRecordId: integer("distribution_record_id").notNull(), // Link to the specific distribution
  platformId: integer("platform_id").notNull(), // Platform where revenue was generated
  calculationDate: timestamp("calculation_date").notNull().defaultNow(),
  reportingPeriodStart: date("reporting_period_start").notNull(),
  reportingPeriodEnd: date("reporting_period_end").notNull(),
  streams: integer("streams").default(0),
  revenueGenerated: numeric("revenue_generated").notNull().default("0"),
  royaltyRate: numeric("royalty_rate").notNull(), // e.g., 0.70 for 70%
  royaltyAmount: numeric("royalty_amount").notNull().default("0"),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("calculated"), // calculated, paid, disputed
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Add missing type exports based on server/types.ts imports and new tables
export type DistributionPlatform = typeof distributionPlatforms.$inferSelect;
export type InsertDistributionPlatform = typeof distributionPlatforms.$inferInsert;
export type DistributionRecord = typeof distributionRecords.$inferSelect;
export type InsertDistributionRecord = typeof distributionRecords.$inferInsert;
export type ScheduledDistribution = typeof scheduledDistributions.$inferSelect;
export type InsertScheduledDistribution = typeof scheduledDistributions.$inferInsert;
export type RoyaltyCalculation = typeof royaltyCalculations.$inferSelect;
export type InsertRoyaltyCalculation = typeof royaltyCalculations.$inferInsert;
export type SupportTicketMessage = TicketReply; // Alias TicketReply
export type InsertSupportTicketMessage = InsertTicketReply; // Alias InsertTicketReply

// Add missing Zod schema exports
export const insertDistributionPlatformSchema = createInsertSchema(distributionPlatforms);
export const insertDistributionRecordSchema = createInsertSchema(distributionRecords);
export const insertScheduledDistributionSchema = createInsertSchema(scheduledDistributions);
export const insertSupportTicketSchema = createInsertSchema(supportTickets);
export const insertSupportTicketMessageSchema = createInsertSchema(ticketReplies); // Use ticketReplies table
export const insertRoyaltyCalculationSchema = createInsertSchema(royaltyCalculations);

export const royaltyCalculationsRelations = relations(royaltyCalculations, ({ one }) => ({
  track: one(tracks, {
    fields: [royaltyCalculations.trackId],
    references: [tracks.id],
  }),
  distributionRecord: one(distributionRecords, {
    fields: [royaltyCalculations.distributionRecordId],
    references: [distributionRecords.id],
  }),
  platform: one(distributionPlatforms, { // Assuming relation to distributionPlatforms is needed
     fields: [royaltyCalculations.platformId],
     references: [distributionPlatforms.id],
  }),
}));

// Remove redundant re-exports
// export { userRoleEnum, userStatusEnum, approvalStatusEnum, blockchainNetworkEnum, assetTypeEnum, rightsTypeEnum, ownerTypeEnum };
// export { 
//   insertUserSchema, 
//   insertApiKeySchema, 
//   insertReleaseSchema, 
//   insertTrackSchema, 
//   insertAnalyticsSchema, 
//   insertDailyStatsSchema,
//   insertDistributionPlatformSchema,
//   insertDistributionRecordSchema,
//   insertScheduledDistributionSchema,
//   insertSupportTicketSchema,
//   insertSupportTicketMessageSchema,
//   labelSettingsSchema // Export labelSettingsSchema if needed elsewhere
// };
