/**
 * DistributionService: Music Distribution Core Service
 * 
 * Handles all aspects of music distribution to various platforms including:
 * - Distributing releases to multiple platforms
 * - Tracking distribution status
 * - Retrieving distribution history and analytics
 * - Supporting various delivery methods (API, FTP, etc.)
 */

import * as crypto from 'crypto';
import { db } from '../db';
import { distributionRecords, distributionPlatforms, scheduledDistributions, releases, tracks } from '@shared/schema'; // Added releases, tracks
import { eq, and, desc, sql, gte, lte, inArray, asc } from 'drizzle-orm'; // Added asc
import { IntegrationService } from './integration-service'; // Assuming IntegrationService exists

// Define type alias for track data to avoid recursive type issue
type TrackData = typeof tracks.$inferSelect;

export class DistributionService {
  /**
   * Schedule distribution for a specific date
   */
  static async scheduleDistribution(releaseId: number, platformId: number, scheduledDate: Date) {
    try {
      // Create scheduled distribution record
      const record = await db.insert(scheduledDistributions)
        .values({
          releaseId,
          platformId,
          scheduledDate,
          status: 'scheduled'
        })
        .returning();
        
      return {
        success: true,
        scheduledDistributionId: record[0].id,
        scheduledDate
      };
    } catch (error) {
      console.error(`Error scheduling distribution:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error in scheduling process'
      };
    }
  }
  /**
   * Distribute a release to multiple platforms
   */
  static async distributeRelease(releaseId: number, platformIds: number[]) {
    console.log(`Distributing release ${releaseId} to platforms: ${platformIds.join(', ')}`);
    
    const results = [];
    
    for (const platformId of platformIds) {
      // Call the version of distributeToPlatform that takes ID
      results.push(await this.distributeToPlatform(releaseId, platformId)); 
    }
    
    return results;
  }

  /**
   * Distribute a release to a specific platform by IDs
   */
  static async distributeToPlatform(releaseId: number, platformId: number): Promise<{
      success: boolean;
      distributionId?: number;
      platformReleaseId?: string | null; // Use platformReferenceId from schema
      platformUrl?: string; // This field doesn't exist in schema, maybe store in metadata?
      error?: string;
    }> 
  {
    try {
      console.log(`Starting distribution of release ${releaseId} to platform ${platformId}`);
      
      // Retrieve platform info from the database
      const platformResult = await db.select().from(distributionPlatforms)
        .where(eq(distributionPlatforms.id, platformId));
      
      if (platformResult.length === 0) {
        return {
          success: false,
          error: `Platform with ID ${platformId} not found`
        };
      }
      const platform = platformResult[0];

      // Retrieve release info (needed for the other processDistribution overload)
       const releaseResult = await db.select().from(releases).where(eq(releases.id, releaseId)).limit(1);
       if (releaseResult.length === 0) {
           return { success: false, error: `Release with ID ${releaseId} not found` };
       }
       const release = releaseResult[0];

       // Retrieve tracks info (needed for the other processDistribution overload)
       const tracksResult = await db.select().from(tracks).where(eq(tracks.releaseId, releaseId));
       if (tracksResult.length === 0) {
           // Decide if this is an error or if distribution can proceed without tracks
           console.warn(`No tracks found for release ${releaseId}`);
       }
      
      // Create distribution record in pending status
      const newDistributionRecordResult = await db.insert(distributionRecords).values({
        releaseId,
        platformId,
        status: 'pending',
        distributedAt: null, // Use distributedAt, set to null initially
        platformReferenceId: null, // Use platformReferenceId
      }).returning({ id: distributionRecords.id }); // Specify returning column
      
      const recordId = newDistributionRecordResult[0].id;
      
      // Simulate distribution process using the platform object overload
      const result = await this.processDistribution(platform, release, tracksResult);
      
      // Update record with results
      if (result.success) {
        await db.update(distributionRecords)
          .set({
            status: 'completed', // Use 'completed' status
            distributedAt: new Date(), // Set distributedAt on success
            platformReferenceId: result.platformReleaseId, // Use platformReferenceId
            // platformMetadata: { url: result.platformUrl } // Field does not exist
          })
          .where(eq(distributionRecords.id, recordId));
          
        return {
          success: true,
          distributionId: recordId,
          platformReleaseId: result.platformReleaseId,
          // platformUrl: result.platformUrl // Field does not exist
        };
      } else {
        await db.update(distributionRecords)
          .set({
            status: 'failed',
            errorDetails: result.errorDetails // errorDetails expects string | null
          })
          .where(eq(distributionRecords.id, recordId));
          
        return {
          success: false,
          distributionId: recordId,
          error: result.errorDetails ?? undefined // Handle null case
        };
      }
    } catch (error) {
      console.error('Distribution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown distribution error'
      };
    }
  }

  /**
   * Process a specific distribution record by ID
   * 
   * @param distributionId The ID of the distribution record to process
   * @returns True if the distribution was successful, false otherwise
   */
  static async processDistribution(distributionId: number): Promise<boolean>;
  
  /**
   * Process distribution for a release on a specific platform (internal use)
   * 
   * @param platform The platform object
   * @param release The release object
   * @param tracks The tracks array
   * @returns Distribution result object
   */
  static async processDistribution(
    platform: typeof distributionPlatforms.$inferSelect, 
    release: typeof releases.$inferSelect, 
    tracks: TrackData[] // Use type alias
  ): Promise<{
    success: boolean;
    platformReleaseId?: string | null; // Match schema type
    platformUrl?: string; // This field doesn't exist, maybe remove or store elsewhere
    errorDetails?: string | null; // Match schema type
  }>;
  
  // Implementation combining both overloads
  static async processDistribution(
    platformOrId: number | typeof distributionPlatforms.$inferSelect,
    release?: typeof releases.$inferSelect,
    tracks?: TrackData[] // Use type alias
  ): Promise<boolean | { 
    success: boolean;
    platformReleaseId?: string | null;
    platformUrl?: string;
    errorDetails?: string | null;
  }> {
    // Handle first overload (processing by ID)
    if (typeof platformOrId === 'number' && release === undefined && tracks === undefined) {
      const distributionId = platformOrId;
      try {
        // Get the distribution record
        const recordResult = await db.select().from(distributionRecords)
          .where(eq(distributionRecords.id, distributionId)).limit(1);
          
        if (recordResult.length === 0) {
          console.error(`Distribution record ${distributionId} not found`);
          return false;
        }
        const record = recordResult[0];
        
        // Update status to processing
        await db.update(distributionRecords)
          .set({
            status: 'processing',
            // lastAttempt: new Date() // Field does not exist
            updatedAt: new Date() // Update timestamp
          })
          .where(eq(distributionRecords.id, distributionId));
        
        // Get platform details
        const platformResult = await db.select().from(distributionPlatforms)
          .where(eq(distributionPlatforms.id, record.platformId)).limit(1);
          
        if (platformResult.length === 0) {
          console.error(`Platform ${record.platformId} not found`);
          await db.update(distributionRecords)
            .set({
              status: 'failed',
              errorDetails: `Platform with ID ${record.platformId} not found` // Pass string
            })
            .where(eq(distributionRecords.id, distributionId));
          return false;
        }
        const platform = platformResult[0];
        
        // Get release and track data
         const releaseData = await db.select().from(releases).where(eq(releases.id, record.releaseId)).limit(1).then(res => res[0]);
         // Re-import tracks locally to resolve potential scoping issue
         const { tracks: localTracks } = await import('@shared/schema');
         const tracksData = await db.select()
             .from(localTracks) // Use locally imported 'tracks'
             .where(eq(localTracks.releaseId, record.releaseId)); // Use locally imported 'tracks'

         if (!releaseData) {
             console.error(`Release ${record.releaseId} not found for distribution ${distributionId}`);
             await db.update(distributionRecords).set({ status: 'failed', errorDetails: `Release ${record.releaseId} not found` }).where(eq(distributionRecords.id, distributionId));
             return false;
         }

        // Process the distribution using the second overload logic
        const result = await this.platformDistribution(platform, releaseData, tracksData);
        
        if (result.success) {
          // Update status to successful
          await db.update(distributionRecords)
            .set({
              status: 'completed', // Use 'completed' status
              distributedAt: new Date(), // Use distributedAt
              platformReferenceId: result.platformReleaseId, // Use platformReferenceId
              // platformMetadata: { url: result.platformUrl } // Field does not exist
            })
            .where(eq(distributionRecords.id, distributionId));
            
          return true;
        } else {
          // Update status to failed
          await db.update(distributionRecords)
            .set({
              status: 'failed',
              errorDetails: result.errorDetails // Pass string or null
            })
            .where(eq(distributionRecords.id, distributionId));
            
          return false;
        }
      } catch (error) {
        console.error(`Error processing distribution ${platformOrId}:`, error);
        
        // Update status to failed
        await db.update(distributionRecords)
          .set({
            status: 'failed',
            errorDetails: error instanceof Error ? error.message : 'Unknown error' // Pass string
          })
          .where(eq(distributionRecords.id, platformOrId as number)); // Cast needed here
          
        return false;
      }
    } 
    // Handle second overload (processing with objects)
    else if (typeof platformOrId === 'object' && release && tracks) {
      const platform = platformOrId as typeof distributionPlatforms.$inferSelect;
      try {
        // Call the platformDistribution method to handle the distribution
        return await this.platformDistribution(platform, release, tracks);
      } catch (error) {
        console.error(`Error in direct distribution process:`, error);
        return {
          success: false,
          errorDetails: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    } 
    // Handle invalid arguments
    else {
        console.error("Invalid arguments passed to processDistribution");
        // Depending on the overload signature, return appropriate error/value
        // For the boolean overload:
        // return false; 
        // For the object overload:
        return { success: false, errorDetails: "Invalid arguments" };
    }
  }
  
  /**
   * Process distribution to a platform (Internal Logic)
   */
  private static async platformDistribution(
      platform: typeof distributionPlatforms.$inferSelect, 
      release: typeof releases.$inferSelect, 
      tracks: TrackData[] // Use type alias
    ): Promise<{
      success: boolean;
      platformReleaseId?: string | null;
      platformUrl?: string; // This field doesn't exist in schema
      errorDetails?: string | null;
    }> {
    try {
      console.log(`Processing distribution to ${platform.name}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate fake platform ID
      const platformReleaseId = `${platform.name.substring(0, 2).toUpperCase()}-${release.upc?.substring(0, 4) || '0000'}-${crypto.randomBytes(4).toString('hex')}`;
      
      return {
        success: true,
        platformReleaseId,
        platformUrl: `https://${platform.name.toLowerCase().replace(/\s+/g, '')}.com/release/${platformReleaseId}`
      };
    } catch (error) {
      console.error(`Distribution error for ${platform.name}:`, error);
      return {
        success: false,
        errorDetails: error instanceof Error ? error.message : `Unknown ${platform.name} API error`
      };
    }
  }

  /**
   * Get distribution history for a release
   */
  static async getDistributionHistory(releaseId: number) {
    const records = await db.select().from(distributionRecords)
      .where(eq(distributionRecords.releaseId, releaseId))
      .orderBy(desc(distributionRecords.createdAt)); // Use createdAt
      
    return records;
  }

  /**
   * Get distribution status for a specific record
   */
  static async getDistributionStatus(distributionId: number) {
    const recordResult = await db.select().from(distributionRecords)
      .where(eq(distributionRecords.id, distributionId)).limit(1);
      
    if (recordResult.length === 0) {
      return { found: false };
    }
    const record = recordResult[0];
    
    return {
      found: true,
      status: record.status,
      platformId: record.platformId,
      distributionDate: record.distributedAt, // Use distributedAt
      platformReleaseId: record.platformReferenceId, // Use platformReferenceId
      errorDetails: record.errorDetails
    };
  }

  /**
   * Update distribution status (Simplified - use DistributionStatusTracker.updateStatus for detailed tracking)
   */
  static async updateDistributionStatus(distributionId: number, status: string, details?: any) {
     console.warn("Deprecated: Use DistributionStatusTracker.updateStatus for detailed tracking.");
    await db.update(distributionRecords)
      .set({
        status,
        errorDetails: typeof details === 'string' ? details : JSON.stringify(details), // Store details in errorDetails if needed
        updatedAt: new Date()
      })
      .where(eq(distributionRecords.id, distributionId));
      
    return { success: true };
  }

  /**
   * Check if platform has credentials (Simplified - assumes credentials check elsewhere)
   */
  static async hasPlatformCredentials(platformId: number): Promise<boolean> {
    const platform = await db.select().from(distributionPlatforms)
      .where(eq(distributionPlatforms.id, platformId)).limit(1);
      
    if (platform.length === 0) {
      return false;
    }
    
    // Simplified check - In reality, would check for specific credential fields
    // return platform[0].apiCredentials !== null; // apiCredentials does not exist
    return !!platform[0].apiKey || !!platform[0].apiUrl; // Check if some credential-like fields exist
  }

  /**
   * Get platform by name
   */
  static async getPlatformByName(name: string) {
    // Use Drizzle's built-in SQL function for case-insensitive comparison
    // This prevents SQL injection by properly parameterizing the input
    const platform = await db.select().from(distributionPlatforms)
      .where(sql`LOWER(${distributionPlatforms.name}) = LOWER(${name})`).limit(1);
      
    return platform.length > 0 ? platform[0] : null;
  }

  /**
   * Get active platforms
   */
  static async getActivePlatforms() {
    return db.select().from(distributionPlatforms)
      // .where(eq(distributionPlatforms.status, 'active')) // status field does not exist
      .where(eq(distributionPlatforms.isActive, true)) // Use isActive field
      .orderBy(asc(distributionPlatforms.name));
  }
}

/**
 * IntegrationService: Cross-platform Distribution Integration
 * 
 * This service handles integrations with external API services to distribute music
 * across different platforms. It manages the connection, authentication, data formatting,
 * and delivery specifics for each platform.
 */
// IntegrationService class removed from this file.
// It should reside in server/services/integration-service.ts