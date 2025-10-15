/**
 * Integration Service
 * 
 * This service connects the distribution system with other platform components
 * such as royalty calculations, analytics, and notifications. It ensures data
 * flows properly between these systems.
 */

import { db } from '../db';
import { eq, and, sql, desc, gte, lte, SQL, inArray } from 'drizzle-orm';
import { PgSelect } from 'drizzle-orm/pg-core';
import {
  distributionRecords,
  analytics,
  dailyStats,
  releases,
  tracks,
  RoyaltyCalculation, // Type import
  royaltyCalculations, // Table object import
  DistributionRecord, // Type import
  Track // Type import
} from '@shared/schema';
import { PLATFORM_RATES } from '@shared/constants';

type TimeframeType = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DistributionStatusChange {
  distributionId: number;
  oldStatus: string;
  newStatus: string;
  details?: any;
}

interface IntegrationResult {
  success: boolean;
  message?: string;
  data?: {
    releaseId?: number;
    trackCount?: number;
    distributionCount?: number;
    successCount?: number;
    failureCount?: number;
    results?: any[];
    error?: any;
    [key: string]: any;
  };
  adminOptions?: any;
  additionalInfo?: any;
  status?: string; // Derived from success property
  timestamp?: Date; // When the integration was performed
}

/**
 * Integration Service for connecting distribution with other platform components
 */
export class IntegrationService {
  /**
   * Process a change in distribution status
   * 
   * This method is called when a distribution record changes status.
   * It triggers appropriate actions in other systems based on the status change.
   * 
   * @param change Distribution status change details
   * @returns Integration result
   */
  static async processDistributionStatusChange(
    change: DistributionStatusChange
  ): Promise<IntegrationResult> {
    try {
      // Get distribution record details
      const distributionRecord = await db.query.distributionRecords.findFirst({
        where: eq(distributionRecords.id, change.distributionId)
      });
      
      if (!distributionRecord) {
        return {
          success: false,
          message: `Distribution record with ID ${change.distributionId} not found`
        };
      }
      
      // Get release details
      const release = await db.query.releases.findFirst({
        where: eq(releases.id, distributionRecord.releaseId)
      });
      
      if (!release) {
        return {
          success: false,
          message: `Release with ID ${distributionRecord.releaseId} not found`
        };
      }
      
      // Based on the status change, trigger appropriate actions
      switch (change.newStatus) {
        case 'distributed':
          // Distribution was successful, update analytics
          await this.updateAnalyticsForDistribution(distributionRecord);
          
          // Create initial royalty calculations
          // Create initial royalty calculations
          await this.initializeRoyaltyCalculations(distributionRecord);
          
          // Update royalty integration status on the distribution record
          await db.update(distributionRecords)
            .set({
              royaltyIntegrationStatus: 'initialized',
              lastUpdateDetails: {
                message: 'Initial royalty calculations created',
                timestamp: new Date().toISOString()
              },
              updatedAt: new Date() // Update timestamp
            })
            .where(eq(distributionRecords.id, change.distributionId));
          
          return {
            success: true,
            message: 'Distribution status processed successfully. Analytics updated and royalty calculations initialized.'
          };
          
        case 'failed':
          // Log the failure in analytics
          await this.recordDistributionFailure(distributionRecord, change.details);
          
          return {
            success: true,
            message: 'Distribution failure recorded in analytics.'
          };
          
        case 'processing':
          // Just record the status change, no special actions needed
          return {
            success: true,
            message: 'Distribution status updated to processing.'
          };
          
        case 'scheduled':
          // Record in analytics that distribution is scheduled
          await this.recordScheduledDistribution(distributionRecord);
          
          return {
            success: true,
            message: 'Scheduled distribution recorded in analytics.'
          };
          
        default:
          return {
            success: true,
            message: `Distribution status changed to ${change.newStatus}. No specific actions required.`
          };
      }
    } catch (error) {
      console.error('Error processing distribution status change:', error);
      return {
        success: false,
        message: `Error processing distribution status change: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error }
      };
    }
  }
  
  /**
   * Process integration between distribution and royalty systems
   * 
   * This method is called to integrate a specific distribution record with
   * the royalty calculation system, ensuring that royalties are calculated
   * based on the latest distribution data.
   * 
   * @param distributionId Distribution record ID to process
   * @returns Integration result
   */
  static async processDistributionRoyaltyIntegration(
    distributionId: number,
    options?: {
      forceRecalculation?: boolean;
      timeframe?: { startDate: string; endDate: string };
      storeResults?: boolean;
      updateAnalytics?: boolean;
      notifyStakeholders?: boolean;
    }
  ): Promise<IntegrationResult> {
    try {
      // Get distribution record details
      const distributionRecord = await db.query.distributionRecords.findFirst({
        where: eq(distributionRecords.id, distributionId)
      });
      
      if (!distributionRecord) {
        return {
          success: false,
          message: `Distribution record with ID ${distributionId} not found`
        };
      }
      
      // Check if distribution is in a state that can be processed
      if (distributionRecord.status !== 'distributed') {
        return {
          success: false,
          message: `Distribution record must be in 'distributed' status to process royalties. Current status: ${distributionRecord.status}`
        };
      }
      
      // Get release details
      const release = await db.query.releases.findFirst({
        where: eq(releases.id, distributionRecord.releaseId)
      });
      
      if (!release) {
        return {
          success: false,
          message: `Release with ID ${distributionRecord.releaseId} not found`
        };
      }
      
      // Get all tracks for this release
      const releaseTracks = await db.query.tracks.findMany({
        where: eq(tracks.releaseId, release.id)
      });
      
      if (releaseTracks.length === 0) {
        return {
          success: false,
          message: `No tracks found for release ID ${release.id}`
        };
      }
      
      // Initialize royalty calculations for each track
      for (const track of releaseTracks) {
        await this.calculateRoyaltiesForTrack(
          track.id, 
          distributionRecord.platformId, 
          undefined, 
          false, 
          { initialIntegration: true }
        );
      }
      
      // Update royalty integration status on the distribution record
      await db.update(distributionRecords)
        .set({
          status: 'processed', // Keep this? Or rely on royaltyIntegrationStatus? Let's keep for now.
          royaltyIntegrationStatus: 'processed',
          statusDetails: {
            message: 'Royalty calculations processed',
            processingDate: new Date().toISOString(),
            recordsCreated: releaseTracks.length,
            royaltyProcessed: true
          },
          lastUpdateDetails: {
            message: 'Royalty calculations fully processed',
            timestamp: new Date().toISOString(),
            trackCount: releaseTracks.length
          },
          updatedAt: new Date() // Update timestamp
        })
        .where(eq(distributionRecords.id, distributionId));
      
      return {
        success: true,
        message: 'Distribution royalty integration processed successfully.',
        data: {
          releaseId: release.id,
          trackCount: releaseTracks.length,
          platformId: distributionRecord.platformId
        }
      };
    } catch (error) {
      console.error('Error processing distribution royalty integration:', error);
      return {
        success: false,
        message: `Error processing distribution royalty integration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error }
      };
    }
  }
  
  /**
   * Process batch integration for multiple distribution records
   * 
   * This method processes multiple distribution records at once, useful for
   * batch operations or catching up after system downtime.
   * 
   * @param options Filter options for selecting distribution records
   * @returns Integration result
   */
  static async processBatchIntegration(options: {
    userId?: number;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    platformId?: number;
    limit?: number;
  }): Promise<IntegrationResult> {
    try {
      const { userId, startDate, endDate, status, platformId, limit = 50 } = options;
      
      // Use query builder method for distribution records
      // Create conditions array 
      const conditions: SQL[] = [];
      
      if (status) {
        // Use proper parameterization to prevent SQL injection
        conditions.push(eq(distributionRecords.status, status));
      }
      
      if (platformId) {
        conditions.push(eq(distributionRecords.platformId, platformId));
      }
      
      if (startDate) {
        conditions.push(gte(distributionRecords.updatedAt, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(distributionRecords.updatedAt, endDate));
      }
      
      if (userId) {
        // Get all releases for the user
        const userReleases = await db.query.releases.findMany({
          where: eq(releases.userId, userId),
          columns: { id: true }
        });
        
        const releaseIds = userReleases.map(r => r.id);
        
        if (releaseIds.length > 0) {
          // Use OR logic for parameterized IN clause
          const releaseConditions = releaseIds.map(id => eq(distributionRecords.releaseId, id));
          conditions.push(
            releaseConditions.length === 1 
              ? releaseConditions[0] 
              : sql`(${sql.join(releaseConditions, sql` OR `)})`
          );
        } else {
          // No releases for this user, return empty result
          return {
            success: true,
            message: 'No releases found for the specified user.',
            data: { count: 0 }
          };
        }
      }
      
      // Build the query with all conditions
      // Execute query with appropriate filters and limits
      const recordsToProcess = await db.select()
        .from(distributionRecords)
        .where(conditions.length > 0 ? 
          // Create a single SQL condition by combining all conditions
          (() => {
            let sqlCondition = sql`${conditions[0]}`;
            for (let i = 1; i < conditions.length; i++) {
              sqlCondition = sql`${sqlCondition} AND ${conditions[i]}`;
            }
            return sqlCondition;
          })() 
          : sql`1=1`)
        .limit(limit);
      
      if (recordsToProcess.length === 0) {
        return {
          success: true,
          message: 'No distribution records found matching the criteria.',
          data: { count: 0 }
        };
      }
      
      // Process each record
      const results = [];
      for (const record of recordsToProcess) {
        const distributionId = record.id;
        const result = await this.processDistributionRoyaltyIntegration(distributionId);
        results.push({
          distributionId,
          success: result.success,
          message: result.message
        });
      }
      
      return {
        success: true,
        message: `Processed ${results.length} distribution records.`,
        data: {
          processed: results.length,
          results
        }
      };
    } catch (error) {
      console.error('Error processing batch integration:', error);
      return {
        success: false,
        message: `Error processing batch integration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error }
      };
    }
  }
  
  /**
   * Get integration status summary
   * 
   * This method provides an overview of the integration state between
   * distribution and royalty systems.
   * 
   * @returns Integration status summary
   */
  static async getIntegrationStatus(): Promise<any> {
    try {
      // Count distribution records by status - using parameterized queries
      const pendingCount = await db.select({ count: sql`count(*)` })
        .from(distributionRecords)
        .where(eq(distributionRecords.status, 'pending'));
      
      const processingCount = await db.select({ count: sql`count(*)` })
        .from(distributionRecords)
        .where(eq(distributionRecords.status, 'processing'));
      
      const distributedCount = await db.select({ count: sql`count(*)` })
        .from(distributionRecords)
        .where(eq(distributionRecords.status, 'distributed'));
      
      const failedCount = await db.select({ count: sql`count(*)` })
        .from(distributionRecords)
        .where(eq(distributionRecords.status, 'failed'));
      
      // Count distribution records by integration status
      const integratedCount = await db.select({ count: sql`count(*)` })
        .from(distributionRecords)
        .where(eq(distributionRecords.status, 'processed'));
      
      // For complex conditions like JSON access, we still need to use SQL template literals
      // but we ensure parameters are properly handled
      const pendingIntegrationCount = await db.select({ count: sql`count(*)` })
        .from(distributionRecords)
        .where(and(eq(distributionRecords.status, 'distributed'), eq(distributionRecords.royaltyIntegrationStatus, 'pending')));
      
      // Get latest processed records
      const latestProcessed = await db.select()
        .from(distributionRecords)
        .where(eq(distributionRecords.status, 'processed'))
        .orderBy(desc(distributionRecords.updatedAt))
        .limit(5);
      
      // Safely handle potentially null count objects
      const getPendingCount = pendingCount && pendingCount.length > 0 ? Number(pendingCount[0].count) || 0 : 0;
      const getProcessingCount = processingCount && processingCount.length > 0 ? Number(processingCount[0].count) || 0 : 0;
      const getDistributedCount = distributedCount && distributedCount.length > 0 ? Number(distributedCount[0].count) || 0 : 0;
      const getFailedCount = failedCount && failedCount.length > 0 ? Number(failedCount[0].count) || 0 : 0;
      const getIntegratedCount = integratedCount && integratedCount.length > 0 ? Number(integratedCount[0].count) || 0 : 0;
      
      return {
        totalDistributions: getPendingCount + getProcessingCount + getDistributedCount + getFailedCount,
        status: {
          pending: getPendingCount,
          processing: getProcessingCount,
          distributed: getDistributedCount,
          failed: getFailedCount
        },
        integration: {
          integrated: getIntegratedCount,
          pending: pendingIntegrationCount && pendingIntegrationCount.length > 0 ? Number(pendingIntegrationCount[0].count) || 0 : 0
        },
        latestProcessed: latestProcessed && latestProcessed.length > 0 ? 
          latestProcessed.map(record => ({
            id: record.id,
            releaseId: record.releaseId,
            platformId: record.platformId,
            status: record.status,
            integrationStatus: record.royaltyIntegrationStatus,
            updatedAt: record.updatedAt
          })) : []
      };
    } catch (error) {
      console.error('Error getting integration status:', error);
      throw error;
    }
  }
  
  /**
   * Update analytics data for a successful distribution
   * 
   * @param distribution Distribution record
   */
  private static async updateAnalyticsForDistribution(distribution: any): Promise<void> {
    try {
      // Validate distribution object
      if (!distribution || !distribution.releaseId) {
        throw new Error('Invalid distribution record: missing releaseId');
      }
      
      // Make sure platformId exists and is valid
      const platformId = distribution.platformId || 0;
      if (!platformId) {
        console.warn(`Distribution record ${distribution.id} has no platformId, using default platform`);
      }
      
      // Get the release and its tracks
      const release = await db.query.releases.findFirst({
        where: eq(releases.id, distribution.releaseId)
      });
      
      if (!release) {
        throw new Error(`Release with ID ${distribution.releaseId} not found`);
      }
      
      const releaseTracks = await db.query.tracks.findMany({
        where: eq(tracks.releaseId, release.id)
      });
      
      if (!releaseTracks || releaseTracks.length === 0) {
        console.warn(`No tracks found for release ID ${release.id}`);
        return;
      }
      
      // Update analytics for each track
      for (const track of releaseTracks) {
        if (!track || !track.id) {
          console.warn('Skipping invalid track in release', release.id);
          continue;
        }
        
        // Create analytics entry for the distribution event
        await db.insert(analytics).values([{
          trackId: track.id,
          releaseId: release.id,
          platform: platformId.toString(), // Store platform ID as string
          date: new Date(),
          event: 'distribution',
          eventDetails: JSON.stringify({
            distributionId: distribution.id || 0,
            platformId: platformId,
            status: distribution.status || 'unknown',
            distributionDate: distribution.distributionDate || new Date()
          })
        }]);
      }
    } catch (error) {
      console.error('Error updating analytics for distribution:', error);
      throw error;
    }
  }
  
  /**
   * Record a distribution failure in analytics
   * 
   * @param distribution Distribution record
   * @param details Error details
   */
  private static async recordDistributionFailure(distribution: any, details: any): Promise<void> {
    try {
      // Validate distribution object
      if (!distribution || !distribution.releaseId) {
        throw new Error('Invalid distribution record: missing releaseId');
      }
      
      // Make sure platformId exists and is valid
      const platformId = distribution.platformId || 0;
      if (!platformId) {
        console.warn(`Distribution record ${distribution.id || 'unknown'} has no platformId, using default platform`);
      }
      
      const release = await db.query.releases.findFirst({
        where: eq(releases.id, distribution.releaseId)
      });
      
      if (!release) {
        throw new Error(`Release with ID ${distribution.releaseId} not found`);
      }
      
      // Create analytics entry for the failure event
      await db.insert(analytics).values([{
        trackId: 0, // Will be updated with actual track IDs later
        releaseId: release.id,
        platform: platformId.toString(),
        date: new Date(),
        event: 'distribution_failure',
        eventDetails: JSON.stringify({
          distributionId: distribution.id || 0,
          platformId: platformId,
          errorDetails: details || distribution.errorDetails || 'Unknown error',
          attemptDate: distribution.lastAttempt || new Date()
        })
      }]);
    } catch (error) {
      console.error('Error recording distribution failure:', error);
      throw error;
    }
  }
  
  /**
   * Process batch royalty calculations
   * 
   * This method processes royalty calculations for multiple tracks or entire releases,
   * optimized for background processing and bulk operations.
   * 
   * @param options Options for batch processing
   * @param options.trackIds Optional array of track IDs to process
   * @param options.releaseId Optional release ID to process all tracks from
   * @param options.userId Optional user ID to process all their tracks
   * @param options.timeframe Optional date range for calculations
   * @param options.forceRecalculation Whether to force recalculation of existing data
   * @returns Integration result with details of processed calculations
   */
  static async processBatchRoyaltyCalculations(options: {
    trackIds?: number[];
    releaseId?: number;
    userId?: number;
    timeframe?: { startDate: string; endDate: string };
    forceRecalculation?: boolean;
  }): Promise<IntegrationResult> {
    try {
      const { trackIds, releaseId, userId, timeframe, forceRecalculation = false } = options;
      
      // Determine date range for calculations
      let dateRange: DateRange;
      if (timeframe) {
        dateRange = {
          startDate: new Date(timeframe.startDate),
          endDate: new Date(timeframe.endDate)
        };
      } else {
        // Default to last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        dateRange = { startDate, endDate };
      }
      
      // Collect tracks to process
      let tracksToProcess: any[] = [];
      
      if (trackIds && trackIds.length > 0) {
        // Process specific tracks - use OR conditions for parameterized queries
        const trackConditions = trackIds.map(id => eq(tracks.id, id));
        tracksToProcess = await db.query.tracks.findMany({
          where: trackConditions.length === 1 
            ? trackConditions[0] 
            : sql`(${sql.join(trackConditions, sql` OR `)})`
        });
      } else if (releaseId) {
        // Process all tracks from a release
        tracksToProcess = await db.query.tracks.findMany({
          where: eq(tracks.releaseId, releaseId)
        });
      } else if (userId) {
        // Process all tracks from a user
        const userReleases = await db.query.releases.findMany({
          where: eq(releases.userId, userId)
        });
        
        for (const release of userReleases) {
          const releaseTracks = await db.query.tracks.findMany({
            where: eq(tracks.releaseId, release.id)
          });
          tracksToProcess = [...tracksToProcess, ...releaseTracks];
        }
      } else {
        return {
          success: false,
          message: 'At least one filter (trackIds, releaseId, or userId) is required.'
        };
      }
      
      if (tracksToProcess.length === 0) {
        return {
          success: true,
          message: 'No tracks found matching the criteria.',
          data: { count: 0 }
        };
      }
      
      // Process royalty calculations for each track
      const results = [];
      for (const track of tracksToProcess) {
        // Get all platforms this track has been distributed to
        const distRecords = await db.query.distributionRecords.findMany({
          where: and(
            eq(distributionRecords.releaseId, track.releaseId),
            eq(distributionRecords.status, 'distributed')
          )
        });
        
        // Extract platform IDs from distribution records
        const platformIds = distRecords.map(record => record.platformId || 0);
        const uniquePlatformIds = Array.from(new Set(platformIds.filter(id => id !== 0)));
        
        // Calculate royalties for each platform
        for (const platformId of uniquePlatformIds) {
          const result = await this.calculateRoyaltiesForTrack(
            track.id, 
            platformId, 
            dateRange,
            forceRecalculation,
            { batchProcessing: true }
          );
          
          results.push({
            trackId: track.id,
            platformId,
            success: result.success,
            message: result.message
          });
        }
      }
      
      return {
        success: true,
        message: `Processed royalty calculations for ${tracksToProcess.length} tracks across multiple platforms.`,
        data: {
          processed: results.length,
          trackCount: tracksToProcess.length,
          dateRange,
          results
        }
      };
    } catch (error) {
      console.error('Error processing batch royalty calculations:', error);
      return {
        success: false,
        message: `Error processing batch royalty calculations: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error }
      };
    }
  }
  
  /**
   * Process batch integration of distribution to royalty systems
   * 
   * This method handles batch processing of distribution-to-royalty integration
   * with options for different selection criteria and processing modes.
   * 
   * @param options Filter options for selecting distribution records
   * @param integrationOptions Options for the integration process
   * @returns Integration result
   */
  static async processBatchRoyaltyIntegration(
    options: {
      userId?: number;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      includeFailedDistributions?: boolean;
    },
    integrationOptions: {
      forceRecalculation?: boolean;
      timeframe?: { startDate: string; endDate: string };
    } = {}
  ): Promise<IntegrationResult> {
    try {
      const { 
        userId, 
        startDate, 
        endDate, 
        limit = 50, 
        includeFailedDistributions = false 
      } = options;
      
      const { forceRecalculation = false, timeframe } = integrationOptions;
      
      // Build conditions for distribution record query
      const conditions: SQL<unknown>[] = [];
      
      // Filter for distributed records (optionally include failed) using parameterized queries
      if (includeFailedDistributions) {
        // Use OR logic instead of inArray since it's not imported
        conditions.push(
          sql`(${eq(distributionRecords.status, 'distributed')} OR ${eq(distributionRecords.status, 'failed')})`
        );
      } else {
        conditions.push(eq(distributionRecords.status, 'distributed'));
      }
      
      // Apply date filters
      if (startDate) {
        conditions.push(gte(distributionRecords.updatedAt, startDate));
      }
      
      if (endDate) {
        conditions.push(lte(distributionRecords.updatedAt, endDate));
      }
      
      // Execute query using the Drizzle and() function to combine conditions safely
      const recordsToProcess = await db.select()
        .from(distributionRecords)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .limit(limit);
        
      // If user filter is needed, we'll filter in memory or do a separate query for user's releases
      // This avoids the query builder issues with joins
      
      if (!recordsToProcess || recordsToProcess.length === 0) {
        return {
          success: true,
          message: 'No distribution records found matching the criteria.',
          data: { count: 0 }
        };
      }
      
      // Process each record
      const results = [];
      // Use an array instead of Set to avoid TypeScript issues
      const processedReleaseIds: number[] = [];
      
      for (const record of recordsToProcess) {
        // Ensure record and releaseId are valid
        if (!record || !record.releaseId) {
          console.warn('Skipping invalid distribution record', record);
          continue;
        }
        
        const releaseId = record.releaseId;
        
        // Skip if we've already processed this release
        if (processedReleaseIds.includes(releaseId)) {
          continue;
        }
        
        // Mark this release as processed
        processedReleaseIds.push(releaseId);
        
        // Process royalty calculations for all tracks in this release
        const result = await this.processBatchRoyaltyCalculations({
          releaseId,
          timeframe,
          forceRecalculation
        });
        
        results.push({
          releaseId,
          success: result.success,
          message: result.message,
          data: result.data
        });
      }
      
      return {
        success: true,
        message: `Processed royalty integration for ${processedReleaseIds.length} releases.`,
        data: {
          processed: results.length,
          releaseCount: processedReleaseIds.length,
          results
        }
      };
    } catch (error) {
      console.error('Error processing batch royalty integration:', error);
      return {
        success: false,
        message: `Error processing batch royalty integration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error }
      };
    }
  }

  /**
   * Record a scheduled distribution in analytics
   * 
   * @param distribution Distribution record
   */
  private static async recordScheduledDistribution(distribution: any): Promise<void> {
    try {
      // Validate distribution object
      if (!distribution || !distribution.releaseId) {
        throw new Error('Invalid distribution record: missing releaseId');
      }
      
      // Make sure platformId exists and is valid
      const platformId = distribution.platformId || 0;
      if (!platformId) {
        console.warn(`Distribution record ${distribution.id} has no platformId, using default platform`);
      }
      
      const release = await db.query.releases.findFirst({
        where: eq(releases.id, distribution.releaseId)
      });
      
      if (!release) {
        throw new Error(`Release with ID ${distribution.releaseId} not found`);
      }
      
      // Create analytics entry for the scheduled event
      await db.insert(analytics).values([{
        trackId: 0, // Will be updated with actual track IDs later
        releaseId: release.id,
        platform: platformId.toString(),
        date: new Date(),
        event: 'distribution_scheduled',
        eventDetails: JSON.stringify({
          distributionId: distribution.id,
          platformId: platformId,
          scheduledDate: distribution.distributionDate || new Date()
        })
      }]);
    } catch (error) {
      console.error('Error recording scheduled distribution:', error);
      throw error;
    }
  }
  
  /**
   * Initialize royalty calculations for a newly distributed release
   * 
   * @param distribution Distribution record
   */
  private static async initializeRoyaltyCalculations(distribution: DistributionRecord): Promise<void> {
    try {
      // Validate distribution object
      if (!distribution || !distribution.releaseId) {
        throw new Error('Invalid distribution record: missing releaseId');
      }
      
      // Make sure platformId exists and is valid
      const platformId = distribution.platformId || 0;
      if (!platformId) {
        console.warn(`Distribution record ${distribution.id} has no platformId, using default platform`);
      }
      
      // Get the release and its tracks
      const release = await db.query.releases.findFirst({
        where: eq(releases.id, distribution.releaseId)
      });
      
      if (!release) {
        throw new Error(`Release with ID ${distribution.releaseId} not found`);
      }
      
      const releaseTracks = await db.query.tracks.findMany({
        where: eq(tracks.releaseId, release.id)
      });
      
      if (!releaseTracks || releaseTracks.length === 0) {
        console.warn(`No tracks found for release ID ${release.id}`);
        return;
      }
      
      // Create initial royalty calculation records for each track
      const calculationDate = new Date();
      // Determine reporting period (e.g., current month)
      const reportingPeriodStart = new Date(calculationDate.getFullYear(), calculationDate.getMonth(), 1);
      const reportingPeriodEnd = new Date(calculationDate.getFullYear(), calculationDate.getMonth() + 1, 0);
      
      const royaltyRecordsToInsert = releaseTracks.map((track: Track) => {
        // Get platform-specific rate or default
        // Get platform-specific rate or default - Access directly from PLATFORM_RATES
        const platformRate = PLATFORM_RATES[distribution.platformId as number] || 0.70; // Default 70%
        
        return {
          trackId: track.id,
          distributionRecordId: distribution.id,
          platformId: distribution.platformId,
          calculationDate: calculationDate,
          reportingPeriodStart: reportingPeriodStart,
          reportingPeriodEnd: reportingPeriodEnd,
          streams: 0, // Initial streams are 0
          revenueGenerated: '0', // Initial revenue is 0
          royaltyRate: platformRate.toString(), // Store rate as string
          royaltyAmount: '0', // Initial royalty is 0
          currency: 'USD', // Default currency, adjust if needed
          status: 'initialized', // Initial status
          notes: 'Initial record created upon distribution',
          createdAt: calculationDate, // Use calculationDate for consistency
          updatedAt: calculationDate,
        };
      });
      
      // Insert records into the database
      if (royaltyRecordsToInsert.length > 0) {
        await db.insert(royaltyCalculations).values(royaltyRecordsToInsert);
        console.log(`Initialized ${royaltyRecordsToInsert.length} royalty calculation records for distribution ID ${distribution.id}`);
      }

      // Update distribution record status to reflect initialization
      await db.update(distributionRecords)
        .set({
          royaltyIntegrationStatus: 'initialized',
          statusDetails: {
            message: 'Royalty calculations initialized',
            processingDate: new Date().toISOString(),
            recordsCreated: royaltyRecordsToInsert.length,
            royaltyProcessed: false // Not fully processed yet
          },
          lastUpdateDetails: { // Also update lastUpdateDetails here
            message: 'Initial royalty calculations created',
            timestamp: new Date().toISOString()
          },
          updatedAt: new Date()
        })
        .where(eq(distributionRecords.id, distribution.id));
        
    } catch (error) {
      console.error('Error initializing royalty calculations:', error);
      // Update distribution record status to 'failed' on error
      await db.update(distributionRecords)
        .set({
          royaltyIntegrationStatus: 'failed',
          statusDetails: { message: `Royalty initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
          updatedAt: new Date()
        }); // Closing brace for the update call
      // Closing brace for the catch block
    }
  },
  private static async calculateRoyaltiesForTrack(
    trackId: number, 
    platformId: number,
    dateRange?: DateRange,
    forceRecalculation: boolean = false,
    options: {
      initialIntegration?: boolean;
      batchProcessing?: boolean;
      skipDailyStats?: boolean;
      storeResults?: boolean;
      timeframe?: { startDate: string; endDate: string };
    } = {}
  ): Promise<IntegrationResult> {
    try {
      // Get the track and its release
      const track = await db.query.tracks.findFirst({
        where: eq(tracks.id, trackId)
      });
      
      if (!track) {
        return {
          success: false,
          message: `Track with ID ${trackId} not found`,
          data: { trackId, platformId }
        };
      }
      
      const release = await db.query.releases.findFirst({
        where: eq(releases.id, track.releaseId)
      });
      
      if (!release) {
        return {
          success: false,
          message: `Release with ID ${track.releaseId} not found`,
          data: { trackId, platformId, releaseId: track.releaseId }
        };
      }
      
      // Determine calculation date range
      let calculationPeriod: DateRange;
      
      // Priority: 1) options.timeframe (new standard param), 2) dateRange (legacy param), 3) default to today
      if (options.timeframe) {
        calculationPeriod = {
          startDate: new Date(options.timeframe.startDate),
          endDate: new Date(options.timeframe.endDate)
        };
      } else if (dateRange) {
        calculationPeriod = dateRange;
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        calculationPeriod = {
          startDate: today,
          endDate: today
        };
      }
      
      // Get platform-specific rate - default to a reasonable value if not found
      // When platformId is a number and PLATFORM_RATES is an object with string keys
      const platformKey = String(platformId);
      const platformRate = (PLATFORM_RATES as Record<string, number>)[platformKey] || 0.003; // Default rate if not found
      
      // Check if we already have a royalty calculation for this period/track/platform
      const existingCalculation = await db.query.royaltyCalculations.findFirst({
        where: and(
          eq(royaltyCalculations.trackId, trackId),
          eq(royaltyCalculations.platformId, platformId),
          eq(royaltyCalculations.calculationDate, calculationPeriod.startDate)
        )
      });
      
      // Skip calculation if it exists and we're not forcing recalculation
      if (existingCalculation && !forceRecalculation && !options.initialIntegration) {
        return {
          success: true,
          message: `Royalty calculation already exists for track ${trackId} on platform ${platformId}`,
          data: {
            trackId,
            platformId,
            calculationId: existingCalculation.id,
            calculationDate: existingCalculation.calculationDate,
            existingCalculation: true,
            skipped: true
          }
        };
      }
      
      // Get stream data for the calculation period
      // This wouldgit typically come from analytics data or platform reports
      // For now, we'll initialize with zero values or use existing data
      
      let streamCount = 0;
      let estimatedRevenue = 0;
      
      // In a real implementation, this would query analytics data for actual stream counts
      // For example: const analyticsData = await db.query.analytics...
      
      // For existing calculations, we might want to use the previous values as a starting point
      if (existingCalculation && !options.initialIntegration) {
        streamCount = existingCalculation.streams || 0; // Use correct property name and default to 0
        estimatedRevenue = parseFloat(existingCalculation.revenueGenerated || '0'); // Use correct property name and handle string conversion
      }
      
      // Calculate the estimated revenue based on streams and platform rate
      // In a real implementation, this would use actual stream counts
      const calculatedRevenue = streamCount * platformRate;
      
      // Store the calculation if storeResults is true (default) or not specified
      if (options.storeResults !== false) {
        const calculationMetadata = {
          updated: Boolean(existingCalculation),
          initialIntegration: Boolean(options.initialIntegration),
          batchProcessed: Boolean(options.batchProcessing),
          lastUpdated: new Date().toISOString(),
          platformRate,
          dateRange: {
            startDate: calculationPeriod.startDate.toISOString(),
            endDate: calculationPeriod.endDate.toISOString()
          },
          message: existingCalculation 
            ? 'Royalty calculation updated' 
            : 'Initial royalty calculation created'
        };
        
        if (existingCalculation) {
          // Update existing calculation
          await db.update(royaltyCalculations)
            .set({
              // Ensure proper type compatibility with schema
              streams: Number(streamCount), // Use correct property name
              revenueGenerated: String(calculatedRevenue), // Use correct property name
              ratePerStream: String(calculatedRevenue / Math.max(1, streamCount)), // Numeric column needs string type
              status: 'calculated',
              isProcessed: false,
              isPaid: false,
              metadata: calculationMetadata // PostgreSQL will handle the JSON conversion
            })
            .where(eq(royaltyCalculations.id, existingCalculation.id));
        } else {
          // Create new calculation with proper type compatibility for PostgreSQL
          const calculationData = {
            userId: release.userId,
            trackId,
            releaseId: release.id,
            platformId,
            calculationDate: calculationPeriod.startDate,
            // Ensure proper type compatibility with schema
            streamCount: Number(streamCount), // Integer column needs number type
            amount: String(calculatedRevenue), // Numeric column needs string type
            ratePerStream: String(calculatedRevenue / Math.max(1, streamCount)), // Numeric column needs string type
            royaltyType: 'performance' as const, // Match enum values from schema
            status: 'calculated',
            isProcessed: false,
            isPaid: false,
            timeframe: {
              startDate: calculationPeriod.startDate.toISOString(),
              endDate: calculationPeriod.endDate.toISOString()
            },
            // Store additional metadata as a JSON string for PostgreSQL JSONB columns
            metadata: {
              calculationType: options.initialIntegration ? 'initial' : 'standard',
              timeframe: {
                startDate: calculationPeriod.startDate.toISOString(),
                endDate: calculationPeriod.endDate.toISOString()
              },
              platformRate,
              calculatedAt: new Date().toISOString()
            },
            // Required by schema
            distributionRecordId: 0 // Default value, would be set in a real implementation
          };
          
          // Insert the record
          await db.insert(royaltyCalculations).values(calculationData); // Use table object
        }
      }
      
      // Initialize or update daily stats (skip if requested)
      if (!options.skipDailyStats) {
        const existingStats = await db.query.dailyStats.findFirst({
          where: and(
            eq(dailyStats.trackId, trackId),
            eq(dailyStats.platform, platformId.toString()),
            eq(dailyStats.date, calculationPeriod.startDate)
          )
        });
        
        if (existingStats) {
          // Stats already exist, update if needed
          if (forceRecalculation) {
            await db.update(dailyStats)
              .set({
                totalStreams: Number(streamCount), // Integer column needs number type
                totalRevenue: String(calculatedRevenue.toFixed(2)) // String format for numeric column
              })
              .where(eq(dailyStats.id, existingStats.id));
          }
        } else {
          // Create new daily stats with proper type conversions
          await db.insert(dailyStats).values([{
            userId: track.userId, // Add userId
            date: calculationPeriod.startDate,
            trackId,
            platform: platformId.toString(),
            totalStreams: Number(streamCount), // Integer column needs number type
            uniqueListeners: 0, // Would be populated in a real implementation
            totalRevenue: String(calculatedRevenue.toFixed(2)), // String format for numeric column
            avgListenTime: '0:00'
          }]);
        }
      }
      
      // Return success result with details
      return {
        success: true,
        message: `Royalty calculation completed for track ${trackId} on platform ${platformId}`,
        data: {
          trackId,
          platformId,
          streamCount,
          revenue: calculatedRevenue,
          calculationDate: calculationPeriod.startDate,
          dateRange: {
            startDate: calculationPeriod.startDate.toISOString(),
            endDate: calculationPeriod.endDate.toISOString()
          },
          wasUpdated: Boolean(existingCalculation && !options.initialIntegration)
        }
      };
    } catch (error) {
      console.error(`Error calculating royalties for track ${trackId} on platform ${platformId}:`, error);
      return {
        success: false,
        message: `Error calculating royalties: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { trackId, platformId, error }
      };
    }
  }

  /**
   * Process batch royalty integration for admin
   * 
   * This is an admin-specific version of the batch processing function
   * with additional options and capabilities.
   * 
   * @param options Filter and selection options
   * @param integrationOptions Additional integration options for admin users
   * @returns Integration result
   */
  static async processBatchRoyaltyIntegrationAdmin(
    options: {
      userId?: number;
      releaseId?: number;
      trackIds?: number[];
      startDate?: Date;
      endDate?: Date;
      platformId?: number;
      status?: string;
      limit?: number;
    },
    integrationOptions: {
      forceRecalculation: boolean;
      storeResults: boolean;
      updateAnalytics: boolean;
      recalculateExisting: boolean;
      priority: string;
      timeframe?: { 
        startDate: string; 
        endDate: string 
      };
    }
  ): Promise<IntegrationResult> {
    try {
      // Admin-specific implementation with enhanced capabilities
      const result = await this.processBatchRoyaltyIntegration(
        options,
        {
          forceRecalculation: integrationOptions.forceRecalculation,
          timeframe: integrationOptions.timeframe
        }
      );
      
      // Apply additional admin-specific processing
      if (integrationOptions.updateAnalytics) {
        // Update analytics based on royalty calculations
        await this.updateAnalyticsFromRoyalties(options);
      }
      
      if (integrationOptions.recalculateExisting) {
        // Force recalculation of existing royalty records
        await this.recalculateExistingRoyalties(options);
      }
      
      return {
        ...result,
        adminOptions: integrationOptions,
        additionalInfo: {
          analyticsUpdated: integrationOptions.updateAnalytics,
          existingRecalculated: integrationOptions.recalculateExisting,
          priority: integrationOptions.priority
        }
      };
    } catch (error) {
      console.error('Error in admin batch royalty integration:', error);
      return {
        success: false,
        message: `Error in admin batch royalty integration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error }
      };
    }
  }

  /**
   * Synchronize all royalties for a specific release
   * 
   * This method recalculates and synchronizes all royalty data for a release,
   * ensuring consistency across all tracks and platforms.
   * 
   * @param releaseId The release ID to synchronize
   * @param options Additional synchronization options
   * @returns Integration result
   */
  static async synchronizeReleaseRoyalties(
    releaseId: number,
    options?: {
      forceRecalculation?: boolean;
      includePlatforms?: number[];
      excludePlatforms?: number[];
      notifyStakeholders?: boolean;
      timeframe?: { 
        startDate: string; 
        endDate: string 
      };
    }
  ): Promise<IntegrationResult> {
    try {
      // Get all distribution records for this release
      const distributionRecordsData = await db.query.distributionRecords.findMany({
        where: eq(distributionRecords.releaseId, releaseId)
      });
      
      if (!distributionRecordsData || distributionRecordsData.length === 0) {
        return {
          success: false,
          message: `No distribution records found for release ID ${releaseId}`
        };
      }
      
      // Get all tracks for this release
      const releaseTracks = await db.query.tracks.findMany({
        where: eq(tracks.releaseId, releaseId)
      });
      
      if (releaseTracks.length === 0) {
        return {
          success: false,
          message: `No tracks found for release ID ${releaseId}`
        };
      }
      
      // Process each track with each platform
      const results: any[] = [];
      let successCount = 0;
      let failureCount = 0;
      
      for (const track of releaseTracks) {
        // Make sure distributionRecordsData is array-like before iteration
        const distributionRecordsArray = Array.isArray(distributionRecordsData) 
          ? distributionRecordsData 
          : (distributionRecordsData ? [distributionRecordsData] : []);
          
        for (const distribution of distributionRecordsArray) {
          // Validate distribution record
          if (!distribution) {
            console.warn('Skipping invalid distribution record');
            continue;
          }
          
          // Skip if not distributed or in wrong status
          if (distribution.status !== 'distributed' && distribution.status !== 'processed') {
            continue;
          }
          
          // Make sure platformId exists and is valid
          const platformId = distribution.platformId || 0;
          if (!platformId) {
            console.warn(`Distribution record ${distribution.id} has no platformId, skipping`);
            continue;
          }
          
          // Skip if platform is excluded
          if (options?.excludePlatforms?.includes(platformId)) {
            continue;
          }
          
          // Skip if platforms are specified and this one is not included
          if (options?.includePlatforms?.length && !options.includePlatforms.includes(platformId)) {
            continue;
          }
          
          // Calculate royalties for this track and platform
          const result = await this.calculateRoyaltiesForTrack(
            track.id, 
            platformId, 
            undefined, 
            options?.forceRecalculation,
            { 
              // Only pass supported options
              initialIntegration: false,
              batchProcessing: false,
              skipDailyStats: false,
              storeResults: true,
              timeframe: options?.timeframe
            }
          );
          if (result.success) {
            successCount++;
            results.push({
              trackId: track.id,
              platformId: platformId,
              success: true
            });
          } else {
            failureCount++;
            results.push({
              trackId: track.id,
              platformId: platformId,
              success: false,
              error: result.message
            });
          }
        }
      }
      
      if (options?.notifyStakeholders) {
        // Send notifications to stakeholders (not implemented yet)
        console.log('Notification to stakeholders would be sent here');
      }
      
      // Create an array version of distributionRecordsData for safe access
      const distributionRecordsArray = Array.isArray(distributionRecordsData) 
        ? distributionRecordsData 
        : (distributionRecordsData ? [distributionRecordsData] : []);
        
      return {
        success: true,
        message: `Synchronized royalties for release ID ${releaseId}. ${successCount} successful, ${failureCount} failed.`,
        data: {
          releaseId,
          trackCount: releaseTracks.length,
          distributionCount: distributionRecordsArray.length,
          successCount,
          failureCount,
          results
        }
      };
    } catch (error) {
      console.error('Error synchronizing release royalties:', error);
      return {
        success: false,
        message: `Error synchronizing release royalties: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: { error, releaseId }
      };
    }
  }
  
  /**
   * Update analytics data based on royalty calculations
   */
  private static async updateAnalyticsFromRoyalties(options: any): Promise<void> {
    // Implementation would go here
    console.log('Updating analytics from royalties with options:', options);
  }
  
  /**
   * Recalculate existing royalty records
   */
  private static async recalculateExistingRoyalties(options: any): Promise<void> {
    // Implementation would go here
    console.log('Recalculating existing royalties with options:', options);
  }
  
  /**
   * Get date range based on timeframe
   * 
   * @param timeframe Timeframe type or custom date range
   * @returns Date range object with start and end dates
   */
  private static getDateRange(timeframe: TimeframeType | DateRange): DateRange {
    if (typeof timeframe !== 'string') {
      // Custom date range provided
      return {
        startDate: new Date(timeframe.startDate),
        endDate: new Date(timeframe.endDate)
      };
    }
    
    const now = new Date();
    const startDate = new Date(now);
    const endDate = new Date(now);
    
    // Reset to start of day
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    switch (timeframe) {
      case 'day':
        // Today
        break;
        
      case 'week':
        // Current week (last 7 days)
        startDate.setDate(startDate.getDate() - 7);
        break;
        
      case 'month':
        // Current month
        startDate.setDate(1);
        break;
        
      case 'quarter':
        // Current quarter
        const quarter = Math.floor(now.getMonth() / 3);
        startDate.setMonth(quarter * 3);
        startDate.setDate(1);
        endDate.setMonth(quarter * 3 + 3);
        endDate.setDate(0);
        break;
        
      case 'year':
        // Current year
        startDate.setMonth(0);
        startDate.setDate(1);
        break;
        
      default:
        // Default to last 30 days if invalid timeframe
        startDate.setDate(startDate.getDate() - 30);
    }
    
    return { startDate, endDate };
  }
}

export default IntegrationService;