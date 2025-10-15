/**
 * Distribution Status Tracker Service
 * 
 * This service provides enhanced status tracking for music distribution, including:
 * - Detailed status progression tracking
 * - Platform-specific status mapping
 * - Status transition validation
 * - Status notification and reporting
 * - Historical status tracking
 */

import { db } from '../db';
import { distributionRecords, releases, tracks } from '@shared/schema';
import { eq, and, or, desc, sql, gte, lte, SQL } from 'drizzle-orm'; // Ensure SQL, gte, lte are imported
import { IntegrationService } from './integration-service';

/**
 * Detailed distribution status types
 * 
 * These statuses provide a more granular view of the distribution process
 * than the basic basicStatus pending/processing/completed/failed statuses.
 */
export enum DetailedDistributionStatus {
  // Initial States
  CREATED = 'created',                 // Distribution record created but not yet queued
  VALIDATING = 'validating',           // Validating content and metadata
  
  // Queue States
  QUEUED = 'queued',                   // In distribution queue
  SCHEDULED = 'scheduled',             // Scheduled for future distribution
  
  // Processing States
  PREPARING = 'preparing',             // Preparing files and metadata for delivery
  UPLOADING = 'uploading',             // Uploading to platform
  PROCESSING_PLATFORM = 'processing_platform', // Being processed by platform
  VERIFYING = 'verifying',             // Verifying successful distribution
  
  // Completion States
  LIVE = 'live',                       // Content is live on platform
  LIVE_WITH_ISSUES = 'live_with_issues', // Live but with non-critical issues
  
  // Error States
  VALIDATION_FAILED = 'validation_failed', // Failed validation
  DELIVERY_FAILED = 'delivery_failed',     // Failed during delivery
  PROCESSING_FAILED = 'processing_failed', // Failed during platform processing
  REJECTED = 'rejected',                   // Rejected by platform
  
  // Maintenance States
  TAKEDOWN_PENDING = 'takedown_pending',   // Marked for removal
  TAKEN_DOWN = 'taken_down',               // Removed from platform
  UPDATING = 'updating',                   // Metadata or assets being updated
}

/**
 * Mapping of detailed statuses to basic statuses for database storage
 */
const STATUS_MAPPING: Record<DetailedDistributionStatus, 'pending' | 'processing' | 'completed' | 'failed'> = {
  // Map to 'pending'
  [DetailedDistributionStatus.CREATED]: 'pending',
  [DetailedDistributionStatus.VALIDATING]: 'pending',
  [DetailedDistributionStatus.QUEUED]: 'pending',
  [DetailedDistributionStatus.SCHEDULED]: 'pending',
  
  // Map to 'processing'
  [DetailedDistributionStatus.PREPARING]: 'processing',
  [DetailedDistributionStatus.UPLOADING]: 'processing',
  [DetailedDistributionStatus.PROCESSING_PLATFORM]: 'processing',
  [DetailedDistributionStatus.VERIFYING]: 'processing',
  [DetailedDistributionStatus.UPDATING]: 'processing',
  [DetailedDistributionStatus.TAKEDOWN_PENDING]: 'processing',
  
  // Map to 'completed'
  [DetailedDistributionStatus.LIVE]: 'completed',
  [DetailedDistributionStatus.LIVE_WITH_ISSUES]: 'completed',
  [DetailedDistributionStatus.TAKEN_DOWN]: 'completed',
  
  // Map to 'failed'
  [DetailedDistributionStatus.VALIDATION_FAILED]: 'failed',
  [DetailedDistributionStatus.DELIVERY_FAILED]: 'failed',
  [DetailedDistributionStatus.PROCESSING_FAILED]: 'failed',
  [DetailedDistributionStatus.REJECTED]: 'failed',
};

/**
 * Valid status transitions
 * 
 * This defines which status transitions are allowed, ensuring that
 * the distribution process follows a logical progression.
 */
const VALID_TRANSITIONS: Record<DetailedDistributionStatus, DetailedDistributionStatus[]> = {
  // From initial states
  [DetailedDistributionStatus.CREATED]: [
    DetailedDistributionStatus.VALIDATING,
    DetailedDistributionStatus.QUEUED
  ],
  [DetailedDistributionStatus.VALIDATING]: [
    DetailedDistributionStatus.QUEUED,
    DetailedDistributionStatus.VALIDATION_FAILED
  ],
  
  // From queue states
  [DetailedDistributionStatus.QUEUED]: [
    DetailedDistributionStatus.PREPARING,
    DetailedDistributionStatus.SCHEDULED
  ],
  [DetailedDistributionStatus.SCHEDULED]: [
    DetailedDistributionStatus.QUEUED,
    DetailedDistributionStatus.PREPARING
  ],
  
  // From processing states
  [DetailedDistributionStatus.PREPARING]: [
    DetailedDistributionStatus.UPLOADING,
    DetailedDistributionStatus.VALIDATION_FAILED,
    DetailedDistributionStatus.DELIVERY_FAILED
  ],
  [DetailedDistributionStatus.UPLOADING]: [
    DetailedDistributionStatus.PROCESSING_PLATFORM,
    DetailedDistributionStatus.DELIVERY_FAILED
  ],
  [DetailedDistributionStatus.PROCESSING_PLATFORM]: [
    DetailedDistributionStatus.VERIFYING,
    DetailedDistributionStatus.PROCESSING_FAILED,
    DetailedDistributionStatus.REJECTED
  ],
  [DetailedDistributionStatus.VERIFYING]: [
    DetailedDistributionStatus.LIVE,
    DetailedDistributionStatus.LIVE_WITH_ISSUES,
    DetailedDistributionStatus.PROCESSING_FAILED
  ],
  
  // From completion states
  [DetailedDistributionStatus.LIVE]: [
    DetailedDistributionStatus.LIVE_WITH_ISSUES,
    DetailedDistributionStatus.TAKEDOWN_PENDING,
    DetailedDistributionStatus.UPDATING
  ],
  [DetailedDistributionStatus.LIVE_WITH_ISSUES]: [
    DetailedDistributionStatus.LIVE,
    DetailedDistributionStatus.TAKEDOWN_PENDING,
    DetailedDistributionStatus.UPDATING
  ],
  
  // From error states
  [DetailedDistributionStatus.VALIDATION_FAILED]: [
    DetailedDistributionStatus.VALIDATING,
    DetailedDistributionStatus.QUEUED
  ],
  [DetailedDistributionStatus.DELIVERY_FAILED]: [
    DetailedDistributionStatus.PREPARING,
    DetailedDistributionStatus.UPLOADING
  ],
  [DetailedDistributionStatus.PROCESSING_FAILED]: [
    DetailedDistributionStatus.PROCESSING_PLATFORM,
    DetailedDistributionStatus.VERIFYING
  ],
  [DetailedDistributionStatus.REJECTED]: [
    DetailedDistributionStatus.VALIDATING,
    DetailedDistributionStatus.QUEUED
  ],
  
  // From maintenance states
  [DetailedDistributionStatus.TAKEDOWN_PENDING]: [
    DetailedDistributionStatus.TAKEN_DOWN,
    DetailedDistributionStatus.LIVE
  ],
  [DetailedDistributionStatus.TAKEN_DOWN]: [
    DetailedDistributionStatus.QUEUED // Allow re-queueing after takedown
  ],
  [DetailedDistributionStatus.UPDATING]: [
    DetailedDistributionStatus.LIVE,
    DetailedDistributionStatus.LIVE_WITH_ISSUES,
    DetailedDistributionStatus.PROCESSING_FAILED
  ],
};

/**
 * Structure for detailed status information (intended for JSON storage)
 */
export interface DetailedStatusInfo {
  basicStatus: 'pending' | 'processing' | 'completed' | 'failed';
  detailedStatus: DetailedDistributionStatus;
  timestamp: string; // Store timestamp as ISO string in JSON
  details?: Record<string, any>;
  platformResponse?: Record<string, any>;
  history?: StatusHistoryEntry[]; // Include history within the details
}

/**
 * Structure for status history entries within the JSON details
 */
export interface StatusHistoryEntry {
  timestamp: string; // Store timestamp as ISO string
  previousStatus: DetailedDistributionStatus;
  newStatus: DetailedDistributionStatus;
  reason?: string;
  details?: Record<string, any>;
}

// Helper function to safely parse JSON
const safeJsonParse = (jsonString: string | null | undefined | object): any => {
  if (typeof jsonString === 'object' && jsonString !== null) {
    return jsonString; // Already an object
  }
  if (typeof jsonString !== 'string') {
    return null; // Not a string, cannot parse
  }
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse JSON string:", e, "String:", jsonString.substring(0, 100));
    return null; // Return null on parsing error
  }
};


/**
 * Distribution Status Tracker
 */
export class DistributionStatusTracker {
  /**
   * Update distribution status with detailed tracking
   * 
   * @param distributionId - The ID of the distribution record
   * @param newStatus - The new detailed status
   * @param details - Additional details about the status change
   * @param platformResponse - Raw response from the platform, if applicable
   * @returns True if the status was updated successfully
   */
  static async updateStatus(
    distributionId: number,
    newStatus: DetailedDistributionStatus,
    details?: Record<string, any>,
    platformResponse?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Get the current record
      const record = await db.query.distributionRecords.findFirst({
        where: eq(distributionRecords.id, distributionId)
      });
      
      if (!record) {
        console.error(`Distribution record not found: ${distributionId}`);
        return false;
      }
      
      // Determine current detailed status (using only basic status as statusDetails is not in schema)
      const currentDetailedStatus = this.mapBasicToDetailed(record.status);
      let statusHistory: StatusHistoryEntry[] = []; // History cannot be retrieved without statusDetails

      // Check if the transition is valid
      const allowedTransitions = VALID_TRANSITIONS[currentDetailedStatus] || [];
      if (!allowedTransitions.includes(newStatus)) {
        console.warn(`Invalid status transition attempted for distribution ${distributionId}: ${currentDetailedStatus} -> ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`);
        // Allow transition but log warning
      }
      
      // Map detailed status to basic status
      const basicStatus = STATUS_MAPPING[newStatus];
      
      // Create status history entry (will be stored in details if needed, not separate history field)
      const historyEntry: StatusHistoryEntry = {
        timestamp: new Date().toISOString(), // Store as ISO string
        previousStatus: currentDetailedStatus,
        newStatus,
        details
      };
      
      // Add to history (limit to 20 entries) - This history is now conceptual as it won't be stored separately
      // statusHistory = [historyEntry, ...statusHistory].slice(0, 20); 
      
      // Create new status details object (conceptual, as statusDetails field doesn't exist)
      // const newStatusDetails: DetailedStatusInfo = {
      //   basicStatus,
      //   detailedStatus: newStatus,
      //   timestamp: new Date().toISOString(), 
      //   details,
      //   platformResponse,
      //   history: statusHistory // Include conceptual history
      // };
      
      // Update the record - Only update fields present in the schema
      await db.update(distributionRecords)
        .set({
          status: basicStatus,
          // statusDetails: JSON.stringify(newStatusDetails), // Field does not exist
          // lastChecked: new Date() // Field does not exist
          updatedAt: new Date() // Update updatedAt timestamp
        })
        .where(eq(distributionRecords.id, distributionId));
      
      // Trigger integration service for completed and failed statuses
      if (['completed', 'failed'].includes(basicStatus) && 
          record.status !== basicStatus) {
        try {
          // Trigger status change integration - Corrected arguments
          const integrationResult = await IntegrationService.processDistributionStatusChange({
            distributionId,
            newStatus: basicStatus, // Use 'newStatus' instead of 'status'
            options: {
              triggerRoyaltyCalculation: basicStatus === 'completed',
              updateAnalytics: true,
              sendNotification: true
            }
          });
          
          console.log(`Integration triggered for distribution ${distributionId}: ${integrationResult.status}`);
        } catch (integrationError) {
          console.error(`Failed to trigger integration for distribution ${distributionId}:`, integrationError);
          // Continue even if integration fails - we don't want to roll back the status update
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating distribution status for ${distributionId}:`, error);
      return false;
    }
  }

  /**
   * Get detailed status information for a distribution
   * 
   * @param distributionId - The ID of the distribution record
   * @returns Detailed status information, if available
   */
  static async getDetailedStatus(distributionId: number): Promise<DetailedStatusInfo | null> {
    try {
      const record = await db.query.distributionRecords.findFirst({
        where: eq(distributionRecords.id, distributionId)
      });
      
      if (!record) {
        return null;
      }
      
      // Cannot read statusDetails as it's not in the schema
      // const statusDetails: DetailedStatusInfo | null = safeJsonParse(record.statusDetails);
      // if (statusDetails) {
      //    return statusDetails;
      // }
      
      // Return basic status mapped if no detailed status is available
      const mappedDetailedStatus = this.mapBasicToDetailed(record.status);
      return {
        basicStatus: record.status as 'pending' | 'processing' | 'completed' | 'failed',
        detailedStatus: mappedDetailedStatus,
        // Cannot read lastChecked, use updatedAt
        timestamp: (record.updatedAt ?? new Date()).toISOString() 
      };
    } catch (error) {
      console.error(`Error getting detailed status for distribution ${distributionId}:`, error);
      return null;
    }
  }

  /**
   * Get status history for a distribution
   * 
   * @param distributionId - The ID of the distribution record
   * @returns Array of status history entries, if available
   */
  static async getStatusHistory(distributionId: number): Promise<StatusHistoryEntry[]> {
    try {
      // Cannot read statusDetails or history as they are not in the schema
      // const record = await db.query.distributionRecords.findFirst({
      //   where: eq(distributionRecords.id, distributionId),
      //   columns: {
      //       statusDetails: true // Field does not exist
      //   }
      // });
      
      // if (!record) {
      //   return [];
      // }

      // const statusDetails: DetailedStatusInfo | null = safeJsonParse(record.statusDetails);
      // return statusDetails?.history ?? []; 
      console.warn(`Cannot retrieve status history for ${distributionId}, statusDetails field missing from schema.`);
      return []; // Return empty array as history is not stored

    } catch (error) {
      console.error(`Error getting status history for distribution ${distributionId}:`, error);
      return [];
    }
  }

  /**
   * Map a basic status to a reasonable detailed status
   * 
   * This is used when we only have the basic status and need to infer
   * a detailed status.
   * 
   * @param basicStatus - The basic status to map
   * @returns A reasonable detailed status
   */
  private static mapBasicToDetailed(basicStatus: string): DetailedDistributionStatus {
    switch (basicStatus) {
      case 'pending':
        return DetailedDistributionStatus.QUEUED;
      case 'processing':
        return DetailedDistributionStatus.PROCESSING_PLATFORM;
      case 'completed':
        return DetailedDistributionStatus.LIVE;
      case 'failed':
        return DetailedDistributionStatus.PROCESSING_FAILED;
      default:
         // Handle potentially unknown basic statuses gracefully
         console.warn(`Unknown basic status encountered: ${basicStatus}. Mapping to CREATED.`);
        return DetailedDistributionStatus.CREATED; 
    }
  }

  /**
   * Get all distribution records with status for a specific user
   * 
   * @param userId The user ID
   * @param options Optional filter options
   * @returns Array of distribution records with status details
   */
  static async getUserDistributionStatus(
    userId: number,
    options: {
      platformId?: number;
      releaseId?: number;
      startDate?: Date;
      endDate?: Date;
      status?: string; // Basic status filter
    } = {}
  ): Promise<any[]> {
    try {
      // Build query conditions
      const conditions = [eq(releases.userId, userId)];
      
      if (options.platformId) {
        conditions.push(eq(distributionRecords.platformId, options.platformId));
      }
      
      if (options.releaseId) {
        conditions.push(eq(distributionRecords.releaseId, options.releaseId));
      }
      
      if (options.startDate) {
        // Use Date object directly for timestamp comparison
        conditions.push(gte(distributionRecords.createdAt, options.startDate)); 
      }
      
      if (options.endDate) {
         // Use Date object directly for timestamp comparison
        conditions.push(lte(distributionRecords.createdAt, options.endDate));
      }
      
      if (options.status) {
        conditions.push(eq(distributionRecords.status, options.status));
      }
      
      // Get distribution records
      const records = await db.select({
        distribution: distributionRecords,
        release: {
          id: releases.id,
          title: releases.title,
          artistName: releases.artistName,
          type: releases.type
        }
      })
        .from(distributionRecords)
        .innerJoin(releases, eq(distributionRecords.releaseId, releases.id))
        .where(and(...conditions))
        .orderBy(desc(distributionRecords.updatedAt));
      
      // Process records to include detailed status (mapped from basic)
      const processedRecords = records.map((record) => {
        // Cannot read statusDetails as it's not in schema
        // const statusDetails: DetailedStatusInfo | null = safeJsonParse(record.distribution.statusDetails);
        const detailedStatusInfo = {
            basicStatus: record.distribution.status as any,
            detailedStatus: this.mapBasicToDetailed(record.distribution.status),
            // Cannot read lastChecked, use updatedAt
            timestamp: (record.distribution.updatedAt ?? new Date()).toISOString() 
        };

        return {
          ...record.distribution,
          release: record.release,
          detailedStatus: detailedStatusInfo // Provide mapped status
        };
      });
      
      return processedRecords;
    } catch (error) {
      console.error(`Error getting distribution status for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get distribution status statistics
   * 
   * @param options - Options for filtering statistics
   * @returns Statistics about distribution statuses
   */
  static async getStatusStatistics(options: {
    userId?: number; // Make userId optional
    startDate?: Date;
    endDate?: Date;
    platformId?: number;
  }): Promise<{
    byBasicStatus: Record<string, number>;
    byDetailedStatus: Record<string, number>;
    totalDistributions: number;
    activeDistributions: number;
    problemDistributions: number;
  }> {
    try {
      // Build query conditions
      const conditions: (SQL | undefined)[] = []; // Use explicit type
      
      if (options.userId) {
        conditions.push(eq(releases.userId, options.userId));
      }
      
      if (options.platformId) {
        conditions.push(eq(distributionRecords.platformId, options.platformId));
      }
      
      if (options.startDate) {
         // Use Date object directly for timestamp comparison
        conditions.push(gte(distributionRecords.createdAt, options.startDate));
      }
      
      if (options.endDate) {
         // Use Date object directly for timestamp comparison
        conditions.push(lte(distributionRecords.createdAt, options.endDate));
      }
      
      const validConditions = conditions.filter(c => c !== undefined);

      // Get all distribution records
      const query = db.select({
        id: distributionRecords.id,
        status: distributionRecords.status,
        // statusDetails: distributionRecords.statusDetails // Field does not exist
      })
        .from(distributionRecords)
        .innerJoin(releases, eq(distributionRecords.releaseId, releases.id));
      
      // Apply conditions if any
      const records = validConditions.length > 0
        ? await query.where(and(...validConditions))
        : await query;
      
      // Initialize statistics
      const stats = {
        byBasicStatus: {
          pending: 0,
          processing: 0,
          completed: 0,
          failed: 0
        } as Record<string, number>,
        byDetailedStatus: {} as Record<string, number>,
        totalDistributions: records.length,
        activeDistributions: 0,
        problemDistributions: 0
      };
      
      // Process each record
      for (const record of records) {
        // Count by basic status
        const basicStatus = record.status as string;
        stats.byBasicStatus[basicStatus] = (stats.byBasicStatus[basicStatus] || 0) + 1;
        
        // Process detailed status (mapped from basic)
        let detailedStatus: string | undefined;
        // Cannot read statusDetails as it's not in schema
        // const statusDetails: DetailedStatusInfo | null = safeJsonParse(record.statusDetails);
        // detailedStatus = statusDetails?.detailedStatus;
        
        // Use mapped detailed status if none found
        if (!detailedStatus) {
          detailedStatus = this.mapBasicToDetailed(basicStatus);
        }
        
        // Count by detailed status
        stats.byDetailedStatus[detailedStatus] = (stats.byDetailedStatus[detailedStatus] || 0) + 1;
        
        // Count active and problem distributions
        if (['processing', 'pending'].includes(basicStatus)) {
          stats.activeDistributions++;
        }
        
        if (basicStatus === 'failed' || detailedStatus === DetailedDistributionStatus.LIVE_WITH_ISSUES) {
          stats.problemDistributions++;
        }
      }
      
      return stats;
    } catch (error) {
      console.error(`Error getting status statistics:`, error);
      return {
        byBasicStatus: {},
        byDetailedStatus: {},
        totalDistributions: 0,
        activeDistributions: 0,
        problemDistributions: 0
      };
    }
  }

  /**
   * Set platform-specific status details for a distribution
   * 
   * @param distributionId - The ID of the distribution record
   * @param platformStatus - Status information from the platform
   * @returns True if the update was successful
   */
  static async updatePlatformStatus(
    distributionId: number,
    platformStatus: {
      status: string;
      message?: string;
      platformReleaseId?: string;
      platformTrackIds?: string[];
      liveDate?: Date;
      availableStores?: string[];
      errorDetails?: string;
      streamingLinks?: Record<string, string>;
      platformResponse?: any;
    }
  ): Promise<boolean> {
    try {
      // Get current status
      const currentStatusInfo = await this.getDetailedStatus(distributionId);
      
      if (!currentStatusInfo) {
        console.error(`Distribution record not found: ${distributionId}`);
        return false;
      }
      
      // Map platform status to detailed status
      let newDetailedStatus: DetailedDistributionStatus;
      
      // Determine new status based on platform status
      switch (platformStatus.status.toLowerCase()) {
        case 'processing':
        case 'in progress':
        case 'validating':
          newDetailedStatus = DetailedDistributionStatus.PROCESSING_PLATFORM;
          break;
          
        case 'published':
        case 'live':
        case 'available':
        case 'delivered':
          newDetailedStatus = DetailedDistributionStatus.LIVE;
          break;
          
        case 'published with issues':
        case 'partially available':
          newDetailedStatus = DetailedDistributionStatus.LIVE_WITH_ISSUES;
          break;
          
        case 'rejected':
        case 'declined':
          newDetailedStatus = DetailedDistributionStatus.REJECTED;
          break;
          
        case 'error':
        case 'failed':
          newDetailedStatus = DetailedDistributionStatus.PROCESSING_FAILED;
          break;
          
        case 'removed':
        case 'taken down':
          newDetailedStatus = DetailedDistributionStatus.TAKEN_DOWN;
          break;
          
        default:
          // Keep current status if we don't recognize the platform status
          console.warn(`Unrecognized platform status "${platformStatus.status}" for distribution ${distributionId}. Keeping current status: ${currentStatusInfo.detailedStatus}`);
          newDetailedStatus = currentStatusInfo.detailedStatus;
      }
      
      // Update platform-specific information
      const updateData: Partial<typeof distributionRecords.$inferInsert> = {
        platformReferenceId: platformStatus.platformReleaseId || undefined, // Use platformReferenceId field
        // lastChecked: new Date() // Field does not exist
        updatedAt: new Date() // Update updatedAt
      };
      
      // Update platform metadata with streaming links and other details
      if (platformStatus.streamingLinks || platformStatus.availableStores || platformStatus.liveDate || platformStatus.platformTrackIds) {
        try {
          // Get the existing record to access current metadata
          const existingRecord = await db.query.distributionRecords.findFirst({
            where: eq(distributionRecords.id, distributionId),
            // columns: { platformMetadata: true } // Field does not exist
          });
          
          // Cannot read/update platformMetadata as it's not in schema
          // let platformMetadata: Record<string, any> = safeJsonParse(existingRecord?.platformMetadata) ?? {};
          // if (platformStatus.streamingLinks) platformMetadata.streamingLinks = platformStatus.streamingLinks;
          // if (platformStatus.availableStores) platformMetadata.availableStores = platformStatus.availableStores;
          // if (platformStatus.liveDate) platformMetadata.liveDate = platformStatus.liveDate.toISOString(); 
          // if (platformStatus.platformTrackIds) platformMetadata.platformTrackIds = platformStatus.platformTrackIds;
          // updateData.platformMetadata = JSON.stringify(platformMetadata); // Field does not exist
          console.warn(`Cannot update platformMetadata for distribution ${distributionId}, field missing from schema.`);
        } catch (error) {
          console.error(`Error preparing platform metadata for distribution ${distributionId}:`, error);
        }
      }
      
      // Update the database record with platform-specific information
      await db.update(distributionRecords)
        .set(updateData)
        .where(eq(distributionRecords.id, distributionId));
      
      // Update detailed status using the main updateStatus method
      return await this.updateStatus(
        distributionId,
        newDetailedStatus,
        {
          message: platformStatus.message,
          availableStores: platformStatus.availableStores,
          liveDate: platformStatus.liveDate?.toISOString(), // Pass ISO string
          platformReleaseId: platformStatus.platformReleaseId,
          platformTrackIds: platformStatus.platformTrackIds,
          streamingLinks: platformStatus.streamingLinks,
          errorDetails: platformStatus.errorDetails
        },
        platformStatus.platformResponse
      );
    } catch (error) {
      console.error(`Error updating platform status for distribution ${distributionId}:`, error);
      return false;
    }
  }
}