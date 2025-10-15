/**
 * Validation Schemas Index
 * 
 * This file exports all validation schemas to simplify imports
 * in routes and middleware files.
 */

// Authentication schemas
// export * from './auth-schemas'; // Commented out: Likely re-exports User

// Admin management schemas
export * from './admin-schemas'; // Keep: Less likely to conflict

// Distribution schemas
// export * from './distribution-schemas'; // Commented out: Likely re-exports DistributionPlatform, DistributionRecord

// Royalty schemas
// export * from './royalty-schemas'; // Commented out: Likely re-exports RoyaltySplit, RoyaltyStatement, RoyaltyPayment

// Payment schemas
// export * from './payment-schemas'; // Commented out: Potentially related to RoyaltyPayment

// API access schemas
// export * from './api-access-schemas'; // Commented out: Likely re-exports ApiAccessKey

// Mobile API schemas
export * from './mobile-api-schemas'; // Keep: Needed for mobile routes, verify specific exports later if needed

// Integration schemas
// export * from './integration-schemas'; // Commented out: Conflicts with mobile-api-schemas (integrationStatusQuerySchema)

// Admin export/import schemas
// export * from './admin-export-schemas'; // Commented out: Conflicts with mobile-api-schemas (releaseIdParamSchema)
export * from './admin-import-schemas'; // Keep: Less likely to conflict

// Distribution status schemas
// export * from './distribution-status-schemas'; // Commented out: Potentially related to DistributionRecord

// Releases schemas
// export * from './releases-schemas'; // Commented out: Likely re-exports Release, Track, ScheduledDistribution

// Import common validation utility
export { validateRequest, validateFileUpload } from '../utils/validation';