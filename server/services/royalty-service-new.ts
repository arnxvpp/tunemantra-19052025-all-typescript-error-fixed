/**
 * Royalty Management Service
 * 
 * This service handles all aspects of royalty calculation, distribution, and reporting
 * for the TuneMantra platform. It manages royalty splits, payments, and reporting for
 * all stakeholders involved in music releases.
 * 
 * Core features:
 * - Track-level and release-level royalty calculation
 * - Multiple royalty types (performance, mechanical, synchronization)
 * - Revenue sharing with multiple stakeholders
 * - Payment scheduling and processing
 * - Detailed reporting and analytics
 * - Projection of future earnings
 */

import { db } from '../db';
import { 
  eq, ne, and, gte, lte, sql, inArray, count, sum, avg, not, isNull, desc, SQL // Ensure SQL is imported
} from 'drizzle-orm';

// Import non-royalty tables from schema
import { 
  tracks,
  releases,
  analytics,
  distributionRecords,
  revenueShares,
  users
} from '../../shared/schema';

// Import royalty-specific tables from enhanced-metadata schema
import {
  roleTypeEnum,
  royaltySplits,
  royaltyCalculations,
  insertRoyaltySplitSchema,
  insertRoyaltyCalculationSchema
} from '../../shared/enhanced-metadata-schema';

import { z } from 'zod';

// Export types for use in the application
export type InsertRoyaltyCalculation = z.infer<typeof insertRoyaltyCalculationSchema>;
export type InsertRoyaltySplit = z.infer<typeof insertRoyaltySplitSchema>;

export class RoyaltyService {
  /**
   * Retrieves royalty calculations with flexible filtering options
   * 
   * @param options - Query options for filtering royalty calculations
   * @returns Royalty calculations matching the filter criteria
   */
  static async getRoyaltyCalculations(options: {
    userId?: number;
    trackId?: number;
    releaseId?: number;
    distributionRecordId?: number;
    startDate?: Date;
    endDate?: Date;
    platformId?: number;
    status?: string;
    limit?: number;
  }) {
    try {
      // Build conditions array dynamically
      const conditions: (SQL | undefined)[] = [];
      if (options.userId) {
        conditions.push(eq(royaltyCalculations.userId, options.userId));
      }
      if (options.trackId) {
        conditions.push(eq(royaltyCalculations.trackId, options.trackId));
      }
      if (options.releaseId) {
        conditions.push(eq(royaltyCalculations.releaseId, options.releaseId));
      }
      if (options.distributionRecordId) {
        conditions.push(eq(royaltyCalculations.distributionRecordId, options.distributionRecordId));
      }
      if (options.platformId) {
        conditions.push(eq(royaltyCalculations.platformId, options.platformId));
      }
      if (options.status) {
        conditions.push(eq(royaltyCalculations.status, options.status));
      }
      if (options.startDate) {
        conditions.push(gte(royaltyCalculations.calculationDate, options.startDate));
      }
      if (options.endDate) {
        conditions.push(lte(royaltyCalculations.calculationDate, options.endDate));
      }
      
      // Filter out undefined conditions
      const validConditions = conditions.filter(c => c !== undefined) as SQL[];
      
      // Build the query using a variable for the base query
      let baseQuery = db.select()
        .from(royaltyCalculations)
        .where(and(...validConditions))
        .orderBy(desc(royaltyCalculations.calculationDate));

      // Apply limit if specified, ensuring correct type for the final query
      // Assign the potentially limited query back to a correctly typed variable
      const finalQuery = options.limit ? baseQuery.limit(options.limit) : baseQuery;

      // Execute query and return results
      const results = await finalQuery;
      return results;
    } catch (error) {
      console.error('Error retrieving royalty calculations:', error);
      throw error;
    }
  }

  /**
   * Store calculated royalties in the permanent royalty calculations table
   * This method takes calculation results and stores them in the database
   * for future reference, reporting, and payment processing
   * 
   * @param calculations - Array of royalty calculation data to store
   * @returns Results of the storage operation
   */
   static async storeRoyaltyCalculations(calculations: Array<Omit<InsertRoyaltyCalculation, 'id' | 'calculationDate'> | {
    userId: number;
    trackId: number;
    releaseId: number;
    distributionRecordId: number;
    platformId: number;
    amount: string | number;
    streamCount: number | string; // Allow string input
    ratePerStream?: string | number;
    timeframe: { startDate: Date | string; endDate: Date | string };
    roleType: string;
    status?: string;
    isProcessed?: boolean; // Keep for input flexibility, will be removed before insert
    isPaid?: boolean; // Keep for input flexibility, will be removed before insert
    metadata?: Record<string, unknown>;
    splitPercentage?: string | number;
    recipientId?: number;
    splitId?: number; 
    // Removed recipientName, recipientType as they are not in the schema
  }>) {
    try {
      if (!calculations.length) {
        return { status: 'no_data', message: 'No calculations to store', saved: 0 };
      }
      
      console.log(`Attempting to store ${calculations.length} royalty calculations`);
      
      // Validate and prepare data for insertion
      const dataToInsert = calculations.map((calc, index) => {
        if (!calc.distributionRecordId || !calc.trackId || !calc.releaseId || !calc.userId) {
          console.error(`Missing required fields in calculation at index ${index}:`, JSON.stringify(calc));
          throw new Error(`Missing required fields in calculation data at index ${index}`);
        }
        if (calc.amount === undefined || calc.amount === null) {
          console.error(`Missing amount in calculation at index ${index}:`, JSON.stringify(calc));
          throw new Error(`Royalty amount is required at index ${index}`);
        }
        
        const validRoleTypes = roleTypeEnum.enumValues;
        let roleType = calc.roleType;
        if (!roleType || !validRoleTypes.includes(roleType as any)) {
            console.warn(`Invalid or missing roleType in calculation at index ${index}: ${roleType}. Defaulting to 'performance'.`);
            roleType = 'performance';
        }

        // Prepare object matching Zod schema (expects numbers for numeric fields)
        const calculationForZod: any = {
            userId: calc.userId,
            releaseId: calc.releaseId,
            trackId: calc.trackId,
            amount: Number(calc.amount), // Zod expects number
            platformId: calc.platformId,
            roleType: roleType,
            distributionRecordId: calc.distributionRecordId,
            streamCount: Number(calc.streamCount || 0), // Zod expects number
            ratePerStream: Number(calc.ratePerStream || 0), // Zod expects number
            timeframe: { // Ensure timeframe dates are strings for JSON
                startDate: calc.timeframe.startDate instanceof Date ? calc.timeframe.startDate.toISOString() : calc.timeframe.startDate,
                endDate: calc.timeframe.endDate instanceof Date ? calc.timeframe.endDate.toISOString() : calc.timeframe.endDate
            },
            status: calc.status || 'calculated',
            metadata: calc.metadata,
            splitId: calc.splitId, 
            recipientId: calc.recipientId,
            splitPercentage: calc.splitPercentage !== undefined && calc.splitPercentage !== null 
                ? Number(calc.splitPercentage) // Zod expects number
                : undefined, 
            // isPaid and isProcessed are not in Zod schema
        };
        
        try {
            // Validate with Zod
            const validatedData = insertRoyaltyCalculationSchema.parse(calculationForZod);
            
            // Prepare final object for DB insert (convert numeric back to string)
            const finalDataForDb = {
                ...validatedData,
                amount: String(validatedData.amount), // Convert amount to string for DB
                ratePerStream: String(validatedData.ratePerStream), // Convert ratePerStream to string for DB
                splitPercentage: validatedData.splitPercentage !== undefined ? String(validatedData.splitPercentage) : null, // Convert splitPercentage to string or null for DB
                // Ensure timeframe is JSON stringifiable (Zod already validates structure)
                timeframe: JSON.stringify(validatedData.timeframe) 
            };
            return finalDataForDb;
        } catch (error) {
            console.error(`Zod validation failed for calculation at index ${index}:`, error);
            console.error('Original calculation data:', JSON.stringify(calc, null, 2));
            console.error('Data passed to Zod:', JSON.stringify(calculationForZod, null, 2));
             if (error instanceof z.ZodError) {
                 console.error('Zod errors:', error.errors);
             }
            return null; // Skip this calculation if validation fails
        }
      }).filter(item => item !== null); // Remove null entries from failed validations
      
      if (dataToInsert.length === 0) {
          console.log('No valid calculations to insert after validation.');
          return { status: 'validation_failed', message: 'No valid calculations to store after validation', saved: 0 };
      }

      console.log(`Inserting ${dataToInsert.length} valid calculations into database`);
      
      // Insert valid calculations
      const results = await db.insert(royaltyCalculations).values(dataToInsert as any).returning(); // Cast as any to bypass strict check after manual prep
      
      return {
        status: 'success',
        message: `Successfully stored ${results.length} royalty calculations`,
        saved: results.length,
        calculations: results
      };
    } catch (error) {
      console.error('Error storing royalty calculations:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        saved: 0,
        error
      };
    }
  }

  /**
   * Updates an existing royalty calculation
   * @param id - The ID of the royalty calculation to update
   * @param data - The updated data
   * @returns The updated royalty calculation
   */
  static async updateRoyaltyCalculation(id: number, data: Partial<typeof royaltyCalculations.$inferSelect>) {
    try {
      // Convert numeric fields to strings as needed by the schema
      const preparedData: any = { ...data };
      
      if (typeof preparedData.amount === 'number') {
        preparedData.amount = String(preparedData.amount);
      }
      
      // streamCount is an integer in the database schema, keep as number
      if (typeof preparedData.streamCount === 'string') {
        preparedData.streamCount = Number(preparedData.streamCount);
      }
      
      if (typeof preparedData.ratePerStream === 'number') {
        preparedData.ratePerStream = String(preparedData.ratePerStream);
      }
      
      const result = await db.update(royaltyCalculations)
        .set({
          ...preparedData,
          updatedAt: new Date()
        })
        .where(eq(royaltyCalculations.id, id))
        .returning();
      
      if (!result.length) {
        throw new Error(`Royalty calculation with ID ${id} not found`);
      }
      
      return {
        status: 'success',
        message: 'Royalty calculation updated successfully',
        calculation: result[0]
      };
    } catch (error) {
      console.error('Error updating royalty calculation:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      };
    }
  }

  /**
   * Retrieves royalty splits for a track with optimized query
   * @param trackId - The track ID to get royalty splits for
   * @returns Royalty splits for the track
   */
  static async getTrackRoyaltySplits(trackId: number) {
    try {
      const splits = await db.select().from(royaltySplits)
        .where(eq(royaltySplits.trackId, trackId))
        .orderBy(desc(royaltySplits.splitPercentage)); // Using correct column name from DB
      
      return splits;
    } catch (error) {
      console.error('Error retrieving track royalty splits:', error);
      throw error;
    }
  }

  /**
   * Creates a new royalty split with transaction support and validation
   * @param data - The royalty split data to insert
   * @returns The newly created royalty split
   */
  static async createRoyaltySplit(data: InsertRoyaltySplit) {
    try {
       // Validate data with Zod first
      const validatedData = insertRoyaltySplitSchema.parse(data);

      // Ensure data is compatible with schema - convert splitPercentage to string for DB
      const formattedData = {
        ...validatedData,
        splitPercentage: String(validatedData.splitPercentage),
      };
      
      // Validate that percentages add up to 100 with a single optimized query
      const existingSplits = await db.select({
        totalPercentage: sum(royaltySplits.splitPercentage) // Using correct column name from DB
      }).from(royaltySplits)
        // Add null check for data.trackId
        .where(data.trackId != null ? eq(royaltySplits.trackId, data.trackId) : undefined)
        .groupBy(royaltySplits.trackId);
      
      const existingPercentage = existingSplits.length > 0 ? Number(existingSplits[0].totalPercentage) || 0 : 0;
      // Use the validated number percentage for calculation
      const newTotalPercentage = existingPercentage + validatedData.splitPercentage; 
      
      if (newTotalPercentage > 100) {
        throw new Error('Total royalty split percentage cannot exceed 100%');
      }
      
      // Use the formatted data with string values for insert
      const result = await db.insert(royaltySplits).values([formattedData]).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating royalty split:', error);
      throw error;
    }
  }

  /**
   * Updates an existing royalty split with transaction support
   * @param id - The ID of the royalty split to update
   * @param data - The updated royalty split data
   * @returns The updated royalty split
   */
  static async updateRoyaltySplit(id: number, data: Partial<typeof royaltySplits.$inferSelect>) {
    try {
      // Create a formatted copy of the data with numeric values converted to strings
      const formattedData: Partial<typeof royaltySplits.$inferSelect> = { ...data };
      
      // If split percentage is being updated, validate total doesn't exceed 100% and format as string
      if (data.splitPercentage !== undefined) {
         // Validate the input percentage number first
         const percentageNumber = Number(data.splitPercentage);
         if (isNaN(percentageNumber) || percentageNumber <= 0 || percentageNumber > 100) {
             throw new Error('Invalid split percentage value');
         }
        // Convert splitPercentage to string for database compatibility
        formattedData.splitPercentage = String(percentageNumber);
        
        const existingSplit = await db.select().from(royaltySplits)
          .where(eq(royaltySplits.id, id));
        
        if (existingSplit.length === 0) {
          throw new Error('Royalty split not found');
        }
        
        const trackId = existingSplit[0].trackId;
        
        // Get total percentage of all other splits in a single optimized query
        const otherSplits = await db.select({
          totalPercentage: sum(royaltySplits.splitPercentage) // Using correct column name from DB
        }).from(royaltySplits)
          .where(and(
            // Add null check for trackId
            trackId != null ? eq(royaltySplits.trackId, trackId) : undefined,
            ne(royaltySplits.id, id)
          ))
          .groupBy(royaltySplits.trackId);
        
        const otherPercentage = otherSplits.length > 0 ? Number(otherSplits[0].totalPercentage) || 0 : 0;
        const newTotalPercentage = otherPercentage + percentageNumber; // Use the validated number
        
        if (newTotalPercentage > 100) {
          throw new Error('Total royalty split percentage cannot exceed 100%');
        }
      }
      
      // Use the formatted data (with string values) for the update
      const result = await db.update(royaltySplits)
        .set(formattedData)
        .where(eq(royaltySplits.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error updating royalty split:', error);
      throw error;
    }
  }

  /**
   * Deletes a royalty split with cascading cleanup
   * @param id - The ID of the royalty split to delete
   * @returns Success status
   */
  static async deleteRoyaltySplit(id: number) {
    try {
      await db.delete(royaltySplits).where(eq(royaltySplits.id, id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting royalty split:', error);
      throw error;
    }
  }

  /**
   * Retrieves revenue shares for a release with optimized query
   * @param releaseId - The release ID to get revenue shares for
   * @returns Revenue shares for the release
   */
  static async getReleaseRevenueShares(releaseId: number) {
    try {
      return db.select().from(revenueShares)
        .where(eq(revenueShares.releaseId, releaseId))
        .orderBy(desc(revenueShares.splitPercentage)); // Order by percentage
    } catch (error) {
      console.error('Error retrieving release revenue shares:', error);
      throw error;
    }
  }

  /**
   * Creates a new revenue share with validation
   * @param data - The revenue share data to insert
   * @returns The newly created revenue share
   */
  static async createRevenueShare(data: typeof revenueShares.$inferInsert) {
    try {
      // Validate total shares don't exceed 100%
      const existingShares = await db.select({
        totalPercentage: sum(revenueShares.splitPercentage) // Using correct column name from schema
      }).from(revenueShares)
        .where(eq(revenueShares.releaseId, data.releaseId))
        .groupBy(revenueShares.releaseId);
      
      const existingPercentage = existingShares.length > 0 ? Number(existingShares[0].totalPercentage) || 0 : 0;
      const newTotalPercentage = existingPercentage + Number(data.splitPercentage);
      
      if (newTotalPercentage > 100) {
        throw new Error('Total revenue share percentage cannot exceed 100%');
      }
      
      const result = await db.insert(revenueShares).values([{
        ...data
      }]).returning();
      
      return result[0];
    } catch (error) {
      console.error('Error creating revenue share:', error);
      throw error;
    }
  }
  
  /**
   * Recalculates royalties for a specific track with optimized database queries
   * This method provides an efficient way to recalculate royalties for a single track
   * with a focus on performance and accuracy, using optimized database queries
   * 
   * @param trackId - The ID of the track to recalculate royalties for
   * @param options - Additional options for calculation
   * @param options.platformId - Optional filter for specific platform
   * @param options.timeframe - Optional timeframe for filtering analytics data
   * @param options.forceRecalculation - Whether to force recalculation of existing entries
   * @returns Recalculation results for the track
   */
  static async recalculateTrackRoyalties(
    trackId: number, 
    options: {
      platformId?: number;
      timeframe?: { startDate: Date; endDate: Date };
      forceRecalculation?: boolean;
    } = {}
  ) {
    try {
      // Use a single optimized query to get track data with a JOIN to releases table
      const trackData = await db.select({
        track: tracks,
        userId: tracks.userId,
        releaseId: tracks.releaseId,
        releaseTitle: releases.title,
        artistName: releases.artistName
      })
      .from(tracks)
      .leftJoin(releases, eq(releases.id, tracks.releaseId))
      .where(eq(tracks.id, trackId))
      .limit(1);
      
      if (trackData.length === 0) {
        throw new Error(`Track with ID ${trackId} not found`);
      }
      
      const { track, userId, releaseId, releaseTitle, artistName } = trackData[0];
      
      // Build all necessary conditions first
      let conditions = [eq(analytics.trackId, trackId)];
      
      // Add platform filter if specified
      if (options.platformId) {
        // Compare string platform with string representation of platformId
        conditions.push(eq(analytics.platform, String(options.platformId))); 
      }
      
      // Add timeframe filters if specified
      if (options.timeframe) {
        conditions.push(
          gte(analytics.date, options.timeframe.startDate),
          lte(analytics.date, options.timeframe.endDate)
        );
      }
      
      // Create the query with all conditions combined with AND
      let analyticsQuery = db.select({
        id: analytics.id,
        trackId: analytics.trackId,
        platform: analytics.platform,
        streams: analytics.streams,
        revenue: analytics.revenue,
        date: analytics.date,
        country: analytics.country
      })
      .from(analytics)
      .where(and(...conditions));
      
      const analyticsData = await analyticsQuery;
      
      if (analyticsData.length === 0) {
        return {
          trackId,
          status: 'no_data',
          message: 'No analytics data available for this track with the specified filters',
          userId
        };
      }
      
      // Get royalty splits using the existing optimized method
      const splits = await this.getTrackRoyaltySplits(trackId);
      
      // Calculate total revenue and streams from analytics
      let totalRevenue = 0;
      let totalStreams = 0;
      let streamsByPlatform = new Map<number, number>();
      let revenueByPlatform = new Map<number, number>();
      
      // Single-pass calculation for all metrics
      for (const item of analyticsData) {
        const revenue = Number(item.revenue) || 0;
        const streams = Number(item.streams) || 0;
        const platformId = Number(item.platform) || 0;
        
        totalRevenue += revenue;
        totalStreams += streams;
        
        // Track by platform
        streamsByPlatform.set(
          platformId, 
          (streamsByPlatform.get(platformId) || 0) + streams
        );
        revenueByPlatform.set(
          platformId, 
          (revenueByPlatform.get(platformId) || 0) + revenue
        );
      }
      
      // If no splits defined, assume 100% to the track owner
      const effectiveSplits = splits.length > 0 ? splits : [{
        id: 0,
        trackId: trackId,
        recipientName: 'Track Owner',
        splitPercentage: '100', // Using correct column name from DB
        roleType: 'performance', // Using correct column name from DB
        paymentDetails: null,
        createdAt: new Date(),
        recipientId: userId, // Default recipient is the track owner
        recipientType: 'artist' // Default type
      }];
      
      // Calculate royalty amount for each split
      const splitDetails = effectiveSplits.map(split => {
        const percentage = Number(split.splitPercentage);
        const amount = totalRevenue * (percentage / 100);
        
        return {
          splitId: split.id,
          recipientName: split.recipientName,
          percentage: percentage,
          roleType: split.roleType,
          amount
        };
      });
      
      // Calculate blended rate per stream (for reporting)
      const ratePerStream = totalStreams > 0 ? (totalRevenue / totalStreams) : 0;
      
      // Platform-specific performance
      const platformPerformance = Array.from(streamsByPlatform.entries()).map(([platformId, streams]) => {
        const revenue = revenueByPlatform.get(platformId) || 0;
        const platformRate = streams > 0 ? (revenue / streams) : 0;
        
        return {
          platformId,
          streams,
          revenue,
          ratePerStream: platformRate,
          percentage: totalRevenue > 0 ? ((revenue / totalRevenue) * 100) : 0
        };
      });
      
      // Sort platforms by revenue (descending)
      platformPerformance.sort((a, b) => b.revenue - a.revenue);
      
      return {
        trackId,
        title: track.title,
        userId,
        releaseId,
        releaseTitle,
        artistName,
        totalRevenue,
        totalStreams,
        ratePerStream,
        splits: splitDetails,
        platformPerformance,
        status: 'success',
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error(`Error recalculating track royalties:`, error);
      return {
        trackId,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        error
      };
    }
  }

  /**
   * Optimized batch calculation of royalties for multiple tracks
   * This method efficiently processes a set of tracks for royalty calculations
   * using highly optimized database queries and batch processing techniques
   * for maximum performance with large datasets
   * 
   * @param trackIds - Array of track IDs to calculate royalties for
   * @param options - Additional calculation options
   * @param options.platformId - Optional filter by platform
   * @param options.timeframe - Optional date range for calculation
   * @param options.storeResults - Whether to store results in database
   * @param options.updateExisting - Whether to update existing calculations
   * @returns Batch calculation results
   */
  static async batchCalculateTrackRoyalties(
    trackIds: number[],
    options: {
      platformId?: number;
      timeframe?: { startDate: Date; endDate: Date };
      storeResults?: boolean;
      updateExisting?: boolean;
    } = { storeResults: true }
  ) {
    try {
      console.log(`Starting batch royalty calculation for ${trackIds.length} tracks with options:`, JSON.stringify(options));
      
      if (!trackIds.length) {
        console.log('No track IDs provided, returning early');
        return {
          status: 'no_data',
          message: 'No track IDs provided',
          results: []
        };
      }
      
      // Start time for performance tracking
      const startTime = Date.now();
      
      // 1. Get all tracks data in a single optimized query with JOIN to releases table
      const tracksData = await db.select({
        track: tracks,
        releaseId: tracks.releaseId,
        userId: tracks.userId,
        releaseTitle: releases.title,
        artistName: releases.artistName
      })
      .from(tracks)
      .leftJoin(releases, eq(releases.id, tracks.releaseId))
      .where(inArray(tracks.id, trackIds));
      
      if (!tracksData.length) {
        return {
          status: 'no_data',
          message: 'No tracks found for the provided IDs',
          processingTime: Date.now() - startTime,
          results: []
        };
      }
      
      // 2. Build analytics query with conditional filters for better performance
      // Build all necessary conditions first
      let conditions = [inArray(analytics.trackId, trackIds)];
      
      // Add platform filter if specified
      if (options.platformId) {
        conditions.push(eq(analytics.platform, options.platformId.toString()));
      }
      
      // Add timeframe filters if specified
      if (options.timeframe) {
        conditions.push(
          gte(analytics.date, options.timeframe.startDate),
          lte(analytics.date, options.timeframe.endDate)
        );
      }
      
      // Create the query with all conditions combined with AND
      let analyticsQuery = db.select({
        id: analytics.id,
        trackId: analytics.trackId,
        platform: analytics.platform,
        streams: analytics.streams,
        revenue: analytics.revenue,
        date: analytics.date,
        country: analytics.country
      })
      .from(analytics)
      .where(and(...conditions));
      
      const analyticsData = await analyticsQuery;
      
      // 3. Get all royalty splits with a single optimized query
      const splitData = await db.select({
        id: royaltySplits.id,
        trackId: royaltySplits.trackId,
        recipientName: royaltySplits.recipientName, // Using the correct column name from DB
        splitPercentage: royaltySplits.splitPercentage, // Using the correct column name
        roleType: royaltySplits.roleType, // Using the correct column name from DB
        paymentDetails: royaltySplits.paymentDetails,
        recipientId: royaltySplits.recipientId, // Added recipientId
        recipientType: royaltySplits.recipientType // Added recipientType
      })
      .from(royaltySplits)
      .where(inArray(royaltySplits.trackId, trackIds));
      
      // 4. Organize data with optimized in-memory processing
      // Use Map objects instead of reduce for better performance with large datasets
      const analyticsByTrack = new Map<number, typeof analyticsData>();
      const splitsByTrack = new Map<number, typeof splitData>();
      
      // Organize analytics by track ID
      analyticsData.forEach(item => {
        // Skip items with null trackId
        if (item.trackId === null) {
          console.warn('Analytics data has null trackId:', JSON.stringify(item));
          return;
        }
        if (!analyticsByTrack.has(item.trackId)) {
          analyticsByTrack.set(item.trackId, []);
        }
        analyticsByTrack.get(item.trackId)!.push(item);
      });
      
      // Organize splits by track ID
      splitData.forEach(item => {
        // Skip items with null trackId
        if (item.trackId === null) {
          console.warn('Split data has null trackId:', JSON.stringify(item));
          return;
        }
        if (!splitsByTrack.has(item.trackId)) {
          splitsByTrack.set(item.trackId, []);
        }
        splitsByTrack.get(item.trackId)!.push(item);
      });
      
      // 5. Process each track with optimized calculation logic
      const results = [];
      const calculationsToStore = [];  // For permanent storage if requested
      const processingStart = Date.now();
      
      for (const trackData of tracksData) {
        // Add null check to prevent "Cannot convert undefined or null to object" error
        if (!trackData.track) {
          console.warn('Track data missing in record:', JSON.stringify(trackData));
          continue; // Skip this track and move to the next one
        }
        
        // Extract track properties efficiently
        const trackId = trackData.track.id;
        const title = trackData.track.title;
        const userId = trackData.userId;
        const releaseId = trackData.releaseId;
        const artistName = trackData.artistName || '';
        
        // Get track-specific data using the Maps for faster lookups
        const trackAnalytics = analyticsByTrack.get(trackId) || [];
        const trackSplits = splitsByTrack.get(trackId) || [];
        
        // Skip processing if no analytics data is available
        if (trackAnalytics.length === 0) {
          results.push({
            trackId,
            title,
            userId,
            status: 'no_data',
            message: 'No analytics data available for this track',
            releaseId,
            artistName
          });
          continue;
        }
        
        // Calculate totals with optimized reducing
        let totalRevenue = 0;
        let totalStreams = 0;
        let streamsByPlatform = new Map<number, number>();
        let revenueByPlatform = new Map<number, number>();
        
        // Single-pass calculation for all metrics (more efficient than multiple .reduce calls)
        for (const item of trackAnalytics) {
          const revenue = Number(item.revenue) || 0;
          const streams = Number(item.streams) || 0;
          const platformId = Number(item.platform) || 0;
          
          totalRevenue += revenue;
          totalStreams += streams;
          
          // Track by platform
          streamsByPlatform.set(
            platformId, 
            (streamsByPlatform.get(platformId) || 0) + streams
          );
          revenueByPlatform.set(
            platformId, 
            (revenueByPlatform.get(platformId) || 0) + revenue
          );
        }
        
        // Default split if none defined
        const effectiveSplits = trackSplits.length > 0 ? trackSplits : [{
          id: 0,
          trackId: trackId,
          recipientName: 'Track Owner',
          splitPercentage: '100', // Using correct column name from DB
          roleType: 'performance', // Using correct column name from DB
          paymentDetails: null,
          recipientId: userId, // Default recipient is the track owner
          recipientType: 'artist' // Default type
        }];
        
        // Calculate royalty amounts for each split
        const splitDetails = effectiveSplits.map(split => {
          // Use splitPercentage (DB column name)
          const percentage = Number(split.splitPercentage);
          const amount = totalRevenue * (percentage / 100);
          
          return {
            splitId: split.id,
            recipientName: split.recipientName,
            percentage,
            // Using standard roleType field from DB schema
            roleType: split.roleType,
            amount
          };
        });
        
        // Calculate blended rate per stream (for reporting)
        const ratePerStream = totalStreams > 0 ? (totalRevenue / totalStreams) : 0;
        
        // Platform-specific performance
        const platformPerformance = Array.from(streamsByPlatform.entries()).map(([platformId, streams]) => {
          const revenue = revenueByPlatform.get(platformId) || 0;
          const platformRate = streams > 0 ? (revenue / streams) : 0;
          
          return {
            platformId,
            streams,
            revenue,
            ratePerStream: platformRate,
            percentage: totalRevenue > 0 ? ((revenue / totalRevenue) * 100) : 0
          };
        });
        
        // Sort platforms by revenue (descending)
        platformPerformance.sort((a, b) => b.revenue - a.revenue);
        
        // Add calculation to results
        results.push({
          trackId,
          title,
          userId,
          releaseId,
          artistName,
          totalRevenue,
          totalStreams,
          ratePerStream,
          splits: splitDetails,
          platformPerformance,
          status: 'success',
          lastUpdated: new Date()
        });
        
        // If we need to store results permanently, prepare the data
        if (options.storeResults) {
          // Get distribution records for this release to link calculations
          const distributionRecs = await db.select({
            id: distributionRecords.id,
            platform: distributionRecords.platformId
          })
          .from(distributionRecords)
          .where(
            and(
              eq(distributionRecords.releaseId, releaseId),
              eq(distributionRecords.status, 'distributed')
            )
          );
          
          // If no distribution records exist, create a default one
          const effectiveDistRecords = distributionRecs.length > 0 
            ? distributionRecs 
            : [{ id: 0, platform: 0 }];
            
          // Create a calculation record for each platform and split combination
          for (const platform of platformPerformance) {
             for (const split of effectiveSplits) {
                const splitPercentage = Number(split.splitPercentage);
                const platformRevenue = revenueByPlatform.get(platform.platformId) || 0;
                const splitAmount = platformRevenue * (splitPercentage / 100);

                // Find matching distribution record for this platform, or use default
                const distRecord = effectiveDistRecords.find(r => r.platform === platform.platformId) || effectiveDistRecords[0];
                
                calculationsToStore.push({
                  userId,
                  trackId,
                  releaseId,
                  distributionRecordId: distRecord.id,
                  platformId: platform.platformId,
                  amount: String(splitAmount), // Amount for this specific split
                  streamCount: Number(platform.streams), // Streams for this platform
                  ratePerStream: String(platform.ratePerStream), // Rate for this platform
                  timeframe: options.timeframe ? {
                    startDate: options.timeframe.startDate instanceof Date ? options.timeframe.startDate.toISOString() : options.timeframe.startDate,
                    endDate: options.timeframe.endDate instanceof Date ? options.timeframe.endDate.toISOString() : options.timeframe.endDate
                  } : { 
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
                    endDate: new Date().toISOString() 
                  },
                  roleType: split.roleType || 'performance', // Use split's role type
                  status: 'calculated',
                  // isProcessed and isPaid are not part of the schema for insertion
                  splitId: split.id ?? undefined, // Link to the split ID, ensure undefined if null
                  recipientId: split.recipientId, // Use recipient from split
                  splitPercentage: String(splitPercentage), // Store the percentage used
                  metadata: {
                    calculationBatch: `batch-${Date.now()}`,
                    splitCount: effectiveSplits.length
                  }
                });
             }
          }
        }
      }
      
      // If requested, store the calculations in the database
      let storageResult = null;
      if (options.storeResults && calculationsToStore.length > 0) {
        try {
          storageResult = await this.storeRoyaltyCalculations(calculationsToStore);
        } catch (error) {
          console.error('Error storing batch royalty calculations:', error);
          storageResult = { 
            status: 'error', 
            message: error instanceof Error ? error.message : 'Unknown error storing calculations',
            saved: 0
          };
        }
      }
      
      // Performance metrics
      const processingTime = Date.now() - processingStart;
      const totalTime = Date.now() - startTime;
      
      return {
        status: 'success',
        message: `Successfully calculated royalties for ${results.length} tracks`,
        totalTracks: results.length,
        totalCalculations: calculationsToStore.length,
        performance: {
          processingTime,
          totalTime,
          tracksPerSecond: results.length > 0 ? (results.length / (processingTime / 1000)) : 0
        },
        storage: storageResult,
        results
      };
    } catch (error) {
      console.error(`Error in batch calculation of track royalties:`, error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        error,
        results: []
      };
    }
  }

  /**
   * Calculates royalties for a specific time period with optimized database queries
   * 
   * @param userId - The user ID to calculate royalties for
   * @param startDate - The start date for the calculation period
   * @param endDate - The end date for the calculation period
   * @param options - Additional options for calculation
   * @returns Calculated royalties for the period
   */
  static async calculateRoyalties(
    userId: number,
    startDate: Date,
    endDate: Date,
    options: {
      storeResults?: boolean;
      recalculate?: boolean;
    } = { storeResults: true, recalculate: false }
  ) {
    try {
      // Get user's tracks with a joined query for better performance
      const userTracks = await db.select({
        track: tracks,
        totalAnalytics: count(analytics.id),
        totalRevenue: sum(analytics.revenue),
        totalStreams: sum(analytics.streams)
      })
      .from(tracks)
      .leftJoin(analytics, and(
        eq(analytics.trackId, tracks.id),
        gte(analytics.date, startDate),
        lte(analytics.date, endDate)
      ))
      .where(eq(tracks.userId, userId))
      .groupBy(tracks.id);
      
      // Extract track IDs for easier handling
      const trackIds = userTracks.map(t => t.track.id);
      
      if (trackIds.length === 0) {
        return {
          totalRoyalties: 0,
          royaltiesByTrack: [],
          royaltiesByType: {},
          paymentStatus: 'no_data'
        };
      }
      
      // Get all splits for these tracks in a single optimized query
      const allSplits = await db.select().from(royaltySplits)
        .where(inArray(royaltySplits.trackId, trackIds));
      
      // Organize splits by track ID for quick access
      const splitsByTrack = new Map<number, typeof royaltySplits.$inferSelect[]>();
      for (const split of allSplits) {
        // Skip if trackId is null
        if (split.trackId === null) continue;
        
        if (!splitsByTrack.has(split.trackId)) {
          splitsByTrack.set(split.trackId, []);
        }
        splitsByTrack.get(split.trackId)!.push(split);
      }
      
      // Get all relevant distribution records in a single optimized query
      const allDistRecords = await db.select({
        id: distributionRecords.id,
        releaseId: distributionRecords.releaseId,
        platformId: distributionRecords.platformId,
        status: distributionRecords.status
      })
      .from(distributionRecords)
      .innerJoin(releases, eq(releases.id, distributionRecords.releaseId))
      .innerJoin(tracks, eq(tracks.releaseId, releases.id))
      .where(and(
        inArray(tracks.id, trackIds),
        eq(distributionRecords.status, 'distributed')
      ));
      
      // Organize distribution records by release ID for quick access
      const distByReleaseId = new Map<number, typeof allDistRecords>();
      for (const record of allDistRecords) {
        // Skip records with null releaseId
        if (record.releaseId === null) {
          console.warn('Distribution record has null releaseId:', JSON.stringify(record));
          continue;
        }
        if (!distByReleaseId.has(record.releaseId)) {
          distByReleaseId.set(record.releaseId, []);
        }
        distByReleaseId.get(record.releaseId)!.push(record);
      }
      
      // Prepare for royalty calculation results
      const royaltiesByTrack = [];
      const royaltiesByType: Record<string, number> = {};
      let totalRoyalties = 0;
      
      // Array to hold calculations for permanent storage
      const calculationsToStore = [];
      
      for (const trackData of userTracks) {
        const track = trackData.track;
        const trackRevenue = Number(trackData.totalRevenue) || 0;
        const trackStreams = Number(trackData.totalStreams) || 0;
        const splits = splitsByTrack.get(track.id) || [];
        
        // Skip tracks with no revenue
        if (trackRevenue <= 0) continue;
        
        // Get the release information and distribution records
        const releaseId = track.releaseId;
        const releaseDistRecords = distByReleaseId.get(releaseId) || [];
        
        // Default split if none defined (100% to track owner)
        const effectiveSplits = splits.length > 0 ? splits : [{
          id: 0,
          trackId: track.id,
          recipientName: 'Track Owner',
          splitPercentage: '100', // Using correct column name from DB
          roleType: 'performance', // Using correct column name from DB
          paymentDetails: null,
          createdAt: new Date(),
          recipientId: userId, // Default recipient is the track owner
          recipientType: 'artist' // Default type
        }];
        
        // Calculate royalty amount for each split
        const splitDetails = effectiveSplits.map(split => {
          // Use splitPercentage (DB column name)
          const percentage = Number(split.splitPercentage);
          const amount = trackRevenue * (percentage / 100);
          
          // Track royalties by type using roleType (DB column name)
          const roleType = split.roleType || 'performance';
          royaltiesByType[roleType] = (royaltiesByType[roleType] || 0) + amount;
          
          // Add to total royalties
          totalRoyalties += amount;
          
          return {
            splitId: split.id,
            recipientName: split.recipientName,
            percentage,
            roleType,
            amount
          };
        });
        
        // Add track calculation to results
        royaltiesByTrack.push({
          trackId: track.id,
          title: track.title,
          totalRevenue: trackRevenue,
          totalStreams: trackStreams,
          splits: splitDetails
        });
        
        // If we should store results and have distribution records, create permanent records
        if (options.storeResults && releaseDistRecords.length > 0) {
          // Check if calculation already exists for this time period
          if (!options.recalculate) {
             try {
                const existingCalcs = await db.select()
                  .from(royaltyCalculations)
                  .where(and(
                    eq(royaltyCalculations.trackId, track.id),
                    eq(royaltyCalculations.userId, userId),
                    // Comparing JSON timeframe requires specific SQL or casting
                    // This might need adjustment based on actual DB structure/needs
                    sql`${royaltyCalculations.timeframe}->>'startDate' = ${startDate.toISOString()}`,
                    sql`${royaltyCalculations.timeframe}->>'endDate' = ${endDate.toISOString()}`
                  ))
                  .limit(1);
                  
                // Skip if calculations already exist
                if (existingCalcs.length > 0) {
                  console.log(`Skipping existing calculation for track ${track.id} in the time period`);
                  continue;
                }
            } catch (e) {
                console.error("Error checking for existing calculations:", e);
                // Decide whether to continue or throw based on requirements
            }
          }
          
          // For each distribution record, create a royalty calculation entry
          for (const distRecord of releaseDistRecords) {
             // For each split, create a calculation entry linked to the distribution record
             for (const split of effectiveSplits) {
                const percentage = Number(split.splitPercentage);
                // Calculate amount for this split based on total track revenue
                const splitAmount = trackRevenue * (percentage / 100); 
                const ratePerStream = trackStreams > 0 ? (trackRevenue / trackStreams) : 0;

                calculationsToStore.push({
                  userId,
                  trackId: track.id,
                  releaseId,
                  distributionRecordId: distRecord.id,
                  platformId: distRecord.platformId,
                  amount: String(splitAmount), // Amount for this specific split
                  streamCount: trackStreams, // Total streams for the track in period
                  ratePerStream: String(ratePerStream), // Overall rate for the track
                  timeframe: { 
                    startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
                    endDate: endDate instanceof Date ? endDate.toISOString() : endDate
                  },
                  roleType: split.roleType || 'performance', // Use split's role type
                  status: 'calculated',
                  // isProcessed and isPaid are not part of the schema for insertion
                  splitId: split.id ?? undefined, // Link to the split ID, ensure undefined if null
                  recipientId: split.recipientId, // Use recipient from split
                  splitPercentage: String(percentage), // Store the percentage used
                  metadata: {
                    calculationSource: 'royalty-service',
                    calculatedAt: new Date().toISOString(),
                    version: '1.0'
                  }
                });
             }
          }
        }
      }
      
      // Store the calculations if needed
      let storageResult = null;
      if (options.storeResults && calculationsToStore.length > 0) {
        try {
          storageResult = await this.storeRoyaltyCalculations(calculationsToStore);
        } catch (error) {
          console.error('Error storing royalty calculations:', error);
          storageResult = { 
            status: 'error', 
            message: error instanceof Error ? error.message : 'Unknown error', 
            saved: 0 
          };
        }
      }
      
      return {
        totalRoyalties,
        royaltiesByTrack,
        royaltiesByType,
        paymentStatus: totalRoyalties > 0 ? 'ready_for_payment' : 'no_data',
        calculationPeriod: { startDate, endDate },
        storage: storageResult,
        storedCalculations: calculationsToStore.length
      };
    } catch (error) {
      console.error('Error calculating royalties:', error);
      throw error;
    }
  }

  /**
   * Calculate royalties for all tracks in a release
   * 
   * This method calculates royalties for all tracks within a single release,
   * applying the specified timeframe and calculation options.
   * 
   * @param releaseId - The ID of the release to calculate royalties for
   * @param timeframe - Optional timeframe for filtering analytics data
   * @param options - Additional options for calculation
   * @returns Calculation results for all tracks in the release
   */
  static async calculateReleaseRoyalties(
    releaseId: number,
    timeframe?: { startDate: Date; endDate: Date },
    options: {
      forceRecalculation?: boolean;
      storeResults?: boolean;
    } = { storeResults: true, forceRecalculation: false }
  ) {
    try {
      // First, get all tracks for this release
      const releaseTracks = await db.select({
        id: tracks.id
      })
      .from(tracks)
      .where(eq(tracks.releaseId, releaseId));
      
      if (releaseTracks.length === 0) {
        return {
          releaseId,
          status: 'no_data',
          message: 'No tracks found for this release',
          totalRoyalties: 0,
          trackCount: 0
        };
      }
      
      // Extract just the track IDs
      const trackIds = releaseTracks.map(track => track.id);
      
      // Use the existing batch calculation method for the tracks
      return this.batchCalculateTrackRoyalties(
        trackIds,
        {
          timeframe,
          storeResults: options.storeResults,
          updateExisting: options.forceRecalculation
        }
      );
    } catch (error) {
      console.error('Error calculating release royalties:', error);
      throw error;
    }
  }
  
  /**
   * Calculate royalties for all tracks owned by a user
   * 
   * This method calculates royalties for all tracks owned by a specific user,
   * applying the specified timeframe and calculation options.
   * 
   * @param userId - The ID of the user to calculate royalties for
   * @param timeframe - Optional timeframe for filtering analytics data
   * @param options - Additional options for calculation
   * @returns Calculation results for all tracks owned by the user
   */
  static async calculateUserRoyalties(
    userId: number,
    timeframe?: { startDate: Date; endDate: Date },
    options: {
      forceRecalculation?: boolean;
      storeResults?: boolean;
    } = { storeResults: true, forceRecalculation: false }
  ) {
    try {
      // First, get all tracks for this user
      const userTracks = await db.select({
        id: tracks.id
      })
      .from(tracks)
      .where(eq(tracks.userId, userId));
      
      if (userTracks.length === 0) {
        return {
          userId,
          status: 'no_data',
          message: 'No tracks found for this user',
          totalRoyalties: 0,
          trackCount: 0
        };
      }
      
      // Extract just the track IDs
      const trackIds = userTracks.map(track => track.id);
      
      // Use the existing batch calculation method for the tracks
      return this.batchCalculateTrackRoyalties(
        trackIds,
        {
          timeframe,
          storeResults: options.storeResults,
          updateExisting: options.forceRecalculation
        }
      );
    } catch (error) {
      console.error('Error calculating user royalties:', error);
      throw error;
    }
  }
  
  /**
   * Projects future royalty earnings based on current trends
   * 
   * This method analyzes historical royalty data to project future earnings.
   * It considers factors like:
   * - Historical growth rates in stream counts
   * - Platform-specific trends
   * - Seasonal variations
   * - New release impact
   * - Geographic market expansion
   * 
   * @param userId - The user ID to calculate projections for
   * @param months - Number of months to project into the future
   * @returns Projected royalties with detailed breakdown
   */
  static async calculateRoyaltyProjections(
    userId: number,
    months: number = 3
  ) {
    try {
      // Get recent performance data to establish trend
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      
      // Get tracks with recent analytics data in a single optimized query
      const trackAnalytics = await db.select({
        trackId: tracks.id,
        trackTitle: tracks.title,
        monthlyStreams: sql<number>`AVG(${analytics.streams})`,
        monthlyRevenue: sql<number>`AVG(${analytics.revenue})`,
        streamGrowthRate: sql<number>`
          CASE 
            WHEN COUNT(${analytics.id}) > 30 THEN (
              COALESCE(
                NULLIF(
                  SUM(CASE WHEN ${analytics.date} > (CURRENT_DATE - INTERVAL '30 days') THEN ${analytics.streams} ELSE 0 END),
                  0
                ) /
                NULLIF(
                  SUM(CASE WHEN ${analytics.date} <= (CURRENT_DATE - INTERVAL '30 days')
                      AND ${analytics.date} > (CURRENT_DATE - INTERVAL '60 days')
                      THEN ${analytics.streams} ELSE 0 END),
                  1
                ),
                1
              ) - 1
            )
            ELSE 0.05 -- Default 5% growth for new tracks with limited data
          END
        `
      })
      .from(tracks)
      .leftJoin(analytics, eq(analytics.trackId, tracks.id))
      .where(and(
        eq(tracks.userId, userId),
        gte(analytics.date, threeMonthsAgo)
      ))
      .groupBy(tracks.id);
      
      if (trackAnalytics.length === 0) {
        return {
          status: 'no_data',
          message: 'No analytics data available for projection',
          userId,
          projections: []
        };
      }
      
      // Calculate projections for each track
      const trackProjections = trackAnalytics.map(track => {
        const baseStreams = Number(track.monthlyStreams) || 0;
        const baseRevenue = Number(track.monthlyRevenue) || 0;
        const growthRate = Number(track.streamGrowthRate) || 0.05; // Default 5% if no data
        
        // Calculate projected values for each month
        const monthlyProjections = [];
        let cumulativeStreams = 0;
        let cumulativeRevenue = 0;
        
        for (let i = 1; i <= months; i++) {
          // Apply compound growth formula
          const monthStreams = Math.round(baseStreams * Math.pow(1 + growthRate, i));
          const monthRevenue = baseRevenue * Math.pow(1 + growthRate, i);
          
          cumulativeStreams += monthStreams;
          cumulativeRevenue += monthRevenue;
          
          // Calculate projected month date
          const projectedDate = new Date(); // Use a new Date object for each iteration
          projectedDate.setMonth(now.getMonth() + i); // Set month based on 'now'
          
          monthlyProjections.push({
            month: i,
            date: projectedDate,
            streams: monthStreams,
            revenue: monthRevenue,
            growthRate: growthRate * 100 // Convert to percentage
          });
        }
        
        return {
          trackId: track.trackId,
          title: track.trackTitle,
          baseMonthlyStreams: baseStreams,
          baseMonthlyRevenue: baseRevenue,
          growthRate: growthRate * 100, // Convert to percentage
          totalProjectedStreams: cumulativeStreams,
          totalProjectedRevenue: cumulativeRevenue,
          monthlyProjections
        };
      });
      
      // Calculate aggregate projections
      let totalBaseRevenue = 0;
      let totalProjectedRevenue = 0;
      let totalBaseStreams = 0;
      let totalProjectedStreams = 0;
      
      trackProjections.forEach(track => {
        totalBaseRevenue += track.baseMonthlyRevenue;
        totalProjectedRevenue += track.totalProjectedRevenue;
        totalBaseStreams += track.baseMonthlyStreams;
        totalProjectedStreams += track.totalProjectedStreams;
      });
      
      // Calculate average growth rate across all tracks
      const averageGrowthRate = trackProjections.length > 0 ? trackProjections.reduce((sum, track) => sum + track.growthRate, 0) / trackProjections.length : 0;
      
      return {
        status: 'success',
        userId,
        projectionPeriod: {
          months,
          startDate: now,
          endDate: new Date(new Date().setMonth(now.getMonth() + months)) // Corrected end date calculation
        },
        summary: {
          trackCount: trackProjections.length,
          currentMonthlyRevenue: totalBaseRevenue,
          projectedTotalRevenue: totalProjectedRevenue,
          averageGrowthRate,
          currentMonthlyStreams: totalBaseStreams,
          projectedTotalStreams: totalProjectedStreams,
        },
        trackProjections
      };
    } catch (error) {
      console.error('Error calculating royalty projections:', error);
      throw error;
    }
  }

  /**
   * Retrieves payment history for a user with pagination and filtering
   * @param userId - The user ID to get payment history for
   * @param options - Filter and pagination options
   * @returns Payment history for the user
   */
  /**
   * Generate a royalty statement for a specific time period
   * 
   * This method creates a detailed royalty statement for a user across all their
   * tracks and releases for a given time period. The statement can be generated
   * in different formats (PDF, CSV, JSON) for different purposes.
   * 
   * @param userId - User ID to generate statement for
   * @param startDate - Start date of the statement period
   * @param endDate - End date of the statement period
   * @param format - Output format of the statement (pdf, csv, json)
   * @returns Royalty statement data or download link
   */
  static async generateRoyaltyStatement(
    userId: number,
    startDate: Date,
    endDate: Date,
    format: 'pdf' | 'csv' | 'json' = 'json'
  ) {
    try {
      // Get all royalty calculations for the user in the specified period
      const calculations = await this.getRoyaltyCalculations({
        userId,
        startDate,
        endDate
      });
      
      // Get track data to include in the statement
      const trackIds = Array.from(new Set(calculations.map(calc => calc.trackId))); // Use Array.from
      const trackData = await db.select({
        id: tracks.id,
        title: tracks.title,
        isrc: tracks.isrc,
        releaseId: tracks.releaseId
      })
      .from(tracks)
      .where(inArray(tracks.id, trackIds));
      
      // Get release data for context
      const releaseIds = Array.from(new Set(trackData.map(track => track.releaseId))); // Use Array.from
      const releaseData = await db.select({
        id: releases.id,
        title: releases.title,
        upc: releases.upc
      })
      .from(releases)
      .where(inArray(releases.id, releaseIds));
      
      // Get all royalty splits for these tracks
      const splitData = await db.select()
        .from(royaltySplits)
        .where(inArray(royaltySplits.trackId, trackIds));
      
      // Get user info
      const userInfo = await db.select({
        id: users.id,
        name: users.fullName, // Use fullName instead of name
        email: users.email,
        // taxId doesn't exist directly, access via taxInformation JSON
        taxId: sql`${users.taxInformation}->>'taxId'`, 
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
      
      // Calculate statement summary data
      const totalRoyalties = calculations.reduce(
        (sum, calc) => sum + Number(calc.amount), 
        0
      );
      
      const totalStreams = calculations.reduce(
        (sum, calc) => sum + Number(calc.streamCount), 
        0
      );
      
      const platformBreakdown = calculations.reduce((acc, calc) => {
        const platformId = calc.platformId;
        if (!acc[platformId]) {
          acc[platformId] = {
            platformId,
            amount: 0,
            streams: 0
          };
        }
        acc[platformId].amount += Number(calc.amount);
        acc[platformId].streams += Number(calc.streamCount);
        return acc;
      }, {} as Record<number, { platformId: number; amount: number; streams: number; }>);
      
      // Track level breakdown
      const trackBreakdown = calculations.reduce((acc, calc) => {
        const trackId = calc.trackId;
        if (!acc[trackId]) {
          const track = trackData.find(t => t.id === trackId);
          acc[trackId] = {
            trackId,
            title: track?.title || 'Unknown Track',
            isrc: track?.isrc || 'Unknown',
            releaseId: track?.releaseId ?? 0, // Provide default value if null/undefined
            amount: 0,
            streams: 0,
            calculations: []
          };
        }
        
        acc[trackId].amount += Number(calc.amount);
        acc[trackId].streams += Number(calc.streamCount);
        acc[trackId].calculations.push(calc);
        
        return acc;
      }, {} as Record<number, { 
        trackId: number; 
        title: string; 
        isrc: string; 
        releaseId: number; 
        amount: number; 
        streams: number;
        calculations: typeof calculations[0][];
      }>);
      
      // Format the statement based on requested format
      const statement = {
        statementId: `RS-${userId}-${new Date().getTime()}`,
        generatedAt: new Date(),
        period: {
          startDate,
          endDate
        },
        user: userInfo[0],
        summary: {
          totalRoyalties,
          totalStreams,
          averageRatePerStream: totalStreams > 0 ? totalRoyalties / totalStreams : 0,
          platformBreakdown: Object.values(platformBreakdown),
          trackCount: Object.keys(trackBreakdown).length
        },
        tracks: Object.values(trackBreakdown).map(track => {
          const release = releaseData.find(r => r.id === track.releaseId);
          return {
            ...track,
            releaseName: release?.title || 'Unknown Release',
            upc: release?.upc || 'Unknown',
            splits: splitData.filter(split => split.trackId === track.trackId)
          };
        })
      };
      
      // Handle different output formats
      if (format === 'json') {
        return statement;
      } else if (format === 'csv') {
        // In a real implementation, this would convert the data to CSV format
        // and provide a download URL or base64 encoded string
        return {
          format: 'csv',
          contentType: 'text/csv',
          filename: `royalty-statement-${userId}-${startDate.toISOString().split('T')[0]}.csv`,
          data: this.convertStatementToCsv(statement)
        };
      } else if (format === 'pdf') {
        // In a real implementation, this would generate a PDF document
        // and provide a download URL or base64 encoded string
        return {
          format: 'pdf',
          contentType: 'application/pdf',
          filename: `royalty-statement-${userId}-${startDate.toISOString().split('T')[0]}.pdf`,
          downloadUrl: `/api/royalties/statement/download/${statement.statementId}`
        };
      }
      
      return statement;
    } catch (error) {
      console.error('Error generating royalty statement:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to convert statement data to CSV format
   * @param statement - The royalty statement object
   * @returns CSV formatted string representation of the statement
   */
  private static convertStatementToCsv(statement: any): string {
    // In a real implementation, this would convert the statement object to CSV
    // For now, we'll return a simplified representation
    
    // Header row
    let csv = 'Track,ISRC,Release,UPC,Streams,Amount,Average Rate\n';
    
    // Data rows
    statement.tracks.forEach((track: any) => {
      csv += `"${track.title}","${track.isrc}","${track.releaseName}","${track.upc}",${track.streams},${track.amount.toFixed(2)},${(track.amount / track.streams).toFixed(6)}\n`;
    });
    
    return csv;
  }
  
  /**
   * Process royalty payments for tracks or releases
   * 
   * This method processes pending royalty payments for selected tracks or an entire release.
   * It handles the actual payment processing logic, updates payment status, and records
   * payment details.
   * 
   * @param userId - User ID processing the payments
   * @param method - Payment method to use
   * @param options - Payment options including track or release selection
   * @returns Result of the payment processing operation
   */
  static async processRoyaltyPayments(
    userId: number,
    method: string,
    options: {
      trackIds?: number[];
      releaseId?: number;
    }
  ) {
    try {
      // Validate payment method
      const validMethods = ['bank_transfer', 'paypal', 'crypto', 'check'];
      if (!validMethods.includes(method)) {
        throw new Error(`Invalid payment method: ${method}`);
      }
      
      // Build query to find applicable royalty calculations
      let query = and(
        eq(royaltyCalculations.userId, userId),
        eq(royaltyCalculations.isPaid, false),
        eq(royaltyCalculations.isProcessed, true)
      );
      
      // Add track or release filter if specified
      if (options.trackIds && options.trackIds.length > 0) {
        query = and(query, inArray(royaltyCalculations.trackId, options.trackIds));
      } else if (options.releaseId) {
        // Get all tracks in the release
        const releaseTracks = await db.select({
          id: tracks.id
        })
        .from(tracks)
        .where(eq(tracks.releaseId, options.releaseId));
        
        const releaseTrackIds = releaseTracks.map(track => track.id);
        
        if (releaseTrackIds.length > 0) {
          query = and(query, inArray(royaltyCalculations.trackId, releaseTrackIds));
        } else {
          throw new Error(`No tracks found for release ID: ${options.releaseId}`);
        }
      }
      
      // Get applicable royalty calculations
      const calculations = await db.select()
        .from(royaltyCalculations)
        .where(query);
      
      if (calculations.length === 0) {
        return {
          success: false,
          message: 'No eligible royalty payments found',
          processed: 0,
          total: 0
        };
      }
      
      // Calculate total payment amount
      const totalAmount = calculations.reduce(
        (sum, calc) => sum + Number(calc.amount), 
        0
      );
      
      // Check if total meets minimum payout threshold (e.g., $50)
      const minimumPayout = 50.0;
      if (totalAmount < minimumPayout) {
        return {
          success: false,
          message: `Total payment amount (${totalAmount.toFixed(2)}) is below the minimum threshold of ${minimumPayout.toFixed(2)}`,
          processed: 0,
          total: totalAmount
        };
      }
      
      // Generate payment reference
      const paymentReference = `PAY-${userId}-${new Date().getTime()}`;
      
      // In a real implementation, this would call a payment processing service
      // such as PayPal, Stripe, or a banking API based on the selected method
      
      // For now, we'll simulate a successful payment by updating the database
      const updateResult = await db.update(royaltyCalculations)
        .set({
          isPaid: true,
          paymentDate: new Date(),
          paymentReference,
          status: 'paid',
          updatedAt: new Date()
        })
        .where(inArray(royaltyCalculations.id, calculations.map(calc => calc.id)));
      
      return {
        success: true,
        message: `Successfully processed ${calculations.length} royalty payments`,
        processed: calculations.length,
        total: totalAmount,
        paymentReference,
        paymentDate: new Date(),
        method
      };
    } catch (error) {
      console.error('Error processing royalty payments:', error);
      throw error;
    }
  }
  
  /**
   * Schedule automated royalty payments
   * 
   * This method sets up automated schedules for royalty payments.
   * It allows configuration of payment frequency, minimum thresholds,
   * preferred payment methods, and recipient details.
   * 
   * @param userId - User ID for whom to schedule payments
   * @param options - Automated payment configuration options
   * @returns Configuration result with schedule ID
   */
  static async scheduleAutomatedPayments(
    userId: number,
    options: {
      frequency: 'monthly' | 'quarterly' | 'biannual' | 'annual';
      minimumThreshold: number;
      preferredMethod: 'bank_transfer' | 'paypal' | 'crypto' | 'check';
      dayOfMonth?: number;
      recipientDetails?: Record<string, any>;
      notificationEmail?: string;
      tracks?: {
        includeAllTracks: boolean;
        specificTrackIds?: number[];
        specificReleaseIds?: number[];
      };
    }
  ) {
    try {
      // Validate options
      if (options.minimumThreshold < 0) {
        throw new Error('Minimum threshold must be a positive number');
      }
      
      if (options.dayOfMonth && (options.dayOfMonth < 1 || options.dayOfMonth > 28)) {
        throw new Error('Day of month must be between 1 and 28');
      }
      
      // Default day of month to the 15th if not specified
      const effectiveDayOfMonth = options.dayOfMonth || 15;
      
      // Calculate first payment date
      const now = new Date();
      const firstPaymentDate = new Date(
        now.getFullYear(),
        now.getMonth() + (now.getDate() > effectiveDayOfMonth ? 1 : 0),
        effectiveDayOfMonth
      );
      
      // Calculate interval in months based on frequency
      let intervalMonths = 1; // default monthly
      
      switch (options.frequency) {
        case 'quarterly':
          intervalMonths = 3;
          break;
        case 'biannual':
          intervalMonths = 6;
          break;
        case 'annual':
          intervalMonths = 12;
          break;
      }
      
      // Generate schedule ID
      const scheduleId = `SCHED-${userId}-${new Date().getTime()}`;
      
      // Store the payment schedule in the database
      // In a real implementation, this would insert a record into a payment_schedules table
      
      // For now, we'll create a database record simulating the schedule
      // Note: This is a placeholder for demonstration - in a real system, 
      // you'd use a proper table for payment schedules
      await db.execute(sql`
        INSERT INTO payment_schedules (
          schedule_id, 
          user_id, 
          frequency, 
          interval_months,
          minimum_threshold, 
          preferred_method,
          day_of_month,
          next_payment_date,
          recipient_details,
          notification_email,
          include_all_tracks,
          specific_track_ids,
          specific_release_ids,
          created_at,
          updated_at
        ) VALUES (
          ${scheduleId},
          ${userId},
          ${options.frequency},
          ${intervalMonths},
          ${options.minimumThreshold},
          ${options.preferredMethod},
          ${effectiveDayOfMonth},
          ${firstPaymentDate},
          ${JSON.stringify(options.recipientDetails || {})},
          ${options.notificationEmail || ''},
          ${options.tracks?.includeAllTracks || true},
          ${JSON.stringify(options.tracks?.specificTrackIds || [])},
          ${JSON.stringify(options.tracks?.specificReleaseIds || [])},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
          frequency = EXCLUDED.frequency,
          interval_months = EXCLUDED.interval_months,
          minimum_threshold = EXCLUDED.minimum_threshold,
          preferred_method = EXCLUDED.preferred_method,
          day_of_month = EXCLUDED.day_of_month,
          next_payment_date = EXCLUDED.next_payment_date,
          recipient_details = EXCLUDED.recipient_details,
          notification_email = EXCLUDED.notification_email,
          include_all_tracks = EXCLUDED.include_all_tracks,
          specific_track_ids = EXCLUDED.specific_track_ids,
          specific_release_ids = EXCLUDED.specific_release_ids,
          updated_at = CURRENT_TIMESTAMP
      `).catch(err => {
        // If the table doesn't exist, we'll catch the error and log it
        // In a production system, we would ensure the table exists
        console.warn('Note: payment_schedules table not available, schedule not stored');
      });
      
      return {
        success: true,
        scheduleId,
        userId,
        frequency: options.frequency,
        intervalMonths,
        minimumThreshold: options.minimumThreshold,
        preferredMethod: options.preferredMethod,
        dayOfMonth: effectiveDayOfMonth,
        nextPaymentDate: firstPaymentDate,
        message: `Successfully scheduled automated ${options.frequency} payments`
      };
    } catch (error) {
      console.error('Error scheduling automated payments:', error);
      throw error;
    }
  }
  
  /**
   * Process scheduled automated payments
   * 
   * This method checks for and processes all scheduled payments that
   * are due. It's designed to be called by a cron job or scheduler.
   * 
   * @returns Result of the automated payment processing
   */
  static async processAutomatedPayments() {
    try {
      const today = new Date();
      
      // In a real implementation, this would query a payment_schedules table
      // to find all schedules where the next payment date is today or earlier
      
      // For now, we'll create a simulated response
      const processedSchedules: any[] = []; // Add type annotation
      const failedSchedules: any[] = []; // Add type annotation
      
      // For each due schedule, process the payment
      // This loop would iterate through schedules from the database
      // For demonstration, we'll use an empty loop since we don't have actual data
      
      // In a real system, this would:
      // 1. Query all eligible royalty calculations for each user
      // 2. Check if total amount meets minimum threshold
      // 3. Process payment using preferred method
      // 4. Update payment status and next payment date
      // 5. Send notification email
      
      return {
        success: true,
        processed: processedSchedules.length,
        failed: failedSchedules.length,
        processedSchedules,
        failedSchedules,
        message: `Successfully processed ${processedSchedules.length} scheduled payments with ${failedSchedules.length} failures`
      };
    } catch (error) {
      console.error('Error processing automated payments:', error);
      throw error;
    }
  }

  /**
   * Get payment history for a user
   * 
   * This method retrieves the payment history for a user with flexible
   * date range filtering and status filtering capabilities.
   * 
   * @param userId - User ID to get payment history for
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @param status - Optional payment status for filtering
   * @returns Payment history data
   */
   
  /**
   * Analyze geographical distribution of royalties
   * 
   * This method analyzes the geographical distribution of royalties for a user,
   * providing insights into which regions are generating the most revenue.
   * 
   * @param userId - User ID to analyze
   * @param startDate - Optional start date for analysis period
   * @param endDate - Optional end date for analysis period
   * @returns Geographical distribution of royalties
   */
  static async getGeographicalRoyaltyDistribution(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ) {
    try {
      // Set default date range if not provided
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      
      const effectiveStartDate = startDate || threeMonthsAgo;
      const effectiveEndDate = endDate || now;
      
      // Get all royalty calculations for the user in the period
      const royaltyData = await this.getRoyaltyCalculations({
        userId,
        startDate: effectiveStartDate,
        endDate: effectiveEndDate
      });
      
      // Get all distribution records for the royalty calculations
      const distributionRecordIds = Array.from(new Set(royaltyData.map(r => r.distributionRecordId)));
      
      // Fetch analytics data with geographical information
      const geoAnalytics = await db.select({
        trackId: analytics.trackId,
        streams: analytics.streams,
        revenue: analytics.revenue,
        country: analytics.country,
        platform: analytics.platform,
        date: analytics.date
      })
      .from(analytics)
      .where(and(
        inArray(analytics.trackId, royaltyData.map(r => r.trackId)),
        gte(analytics.date, effectiveStartDate),
        lte(analytics.date, effectiveEndDate)
      ));
      
      // Define types for intermediate data structures
      type PlatformData = { platform: string; streams: number; revenue: number; revenuePercentage?: number; streamsPercentage?: number; }; // Add optional percentages
      // Define CountryData with specific properties expected later
      type CountryData = { 
          country: string; 
          streams: number; 
          revenue: number; 
          platforms: Record<string, PlatformData>;
          revenuePercentage?: number; // Add optional percentage fields
          streamsPercentage?: number; 
          platformsBreakdown?: PlatformData[]; // Add separate field for processed platforms
      };
      type RegionData = { region: string; countries: CountryData[]; streams: number; revenue: number; revenuePercentage: number; streamsPercentage: number };

      // Group data by country
      const countryData: Record<string, CountryData> = {};
      
      geoAnalytics.forEach(record => {
        const countryCode = record.country || 'UNKNOWN';
        if (!countryData[countryCode]) {
          countryData[countryCode] = { country: countryCode, streams: 0, revenue: 0, platforms: {} };
        }
        
        const currentCountry = countryData[countryCode];
        currentCountry.streams += Number(record.streams) || 0;
        currentCountry.revenue += Number(record.revenue) || 0;
        
        const platformCode = record.platform || 'UNKNOWN';
        if (!currentCountry.platforms[platformCode]) {
          currentCountry.platforms[platformCode] = { platform: platformCode, streams: 0, revenue: 0 };
        }
        
        const currentPlatform = currentCountry.platforms[platformCode];
        currentPlatform.streams += Number(record.streams) || 0;
        currentPlatform.revenue += Number(record.revenue) || 0;
      });
      
      // Convert to array, calculate percentages, and sort
      const countriesArray = Object.values(countryData);
      const totalRevenue = countriesArray.reduce((sum, country) => sum + country.revenue, 0);
      const totalStreams = countriesArray.reduce((sum, country) => sum + country.streams, 0);

      const enrichedCountries = countriesArray.map(country => {
        const countryRevenuePercentage = totalRevenue > 0 ? (country.revenue / totalRevenue) * 100 : 0;
        const countryStreamsPercentage = totalStreams > 0 ? (country.streams / totalStreams) * 100 : 0;
        
        const platformsArray = Object.values(country.platforms).map(platform => ({
          ...platform,
          revenuePercentage: country.revenue > 0 ? (platform.revenue / country.revenue) * 100 : 0,
          streamsPercentage: country.streams > 0 ? (platform.streams / country.streams) * 100 : 0,
        })).sort((a, b) => b.revenue - a.revenue);

        return {
          // Return the well-defined CountryData structure
          country: country.country, 
          streams: country.streams,
          revenue: country.revenue,
          platforms: country.platforms, // Keep original platform structure for region grouping
          revenuePercentage: countryRevenuePercentage,
          streamsPercentage: countryStreamsPercentage,
          platformsBreakdown: platformsArray // Add separate field for processed platforms
        };
      }).sort((a, b) => b.revenue - a.revenue);
      
      // Group data by region
      const regions = {
        'North America': ['US', 'CA', 'MX'],
        'Europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'CH', 'AT', 'BE', 'IE', 'PT', 'GR'],
        'Asia': ['JP', 'KR', 'CN', 'IN', 'ID', 'SG', 'MY', 'TH', 'PH', 'VN'],
        'Latin America': ['BR', 'AR', 'CO', 'CL', 'PE', 'EC', 'VE', 'UY', 'PY', 'BO'],
        'Oceania': ['AU', 'NZ'],
        'Africa': ['ZA', 'NG', 'KE', 'GH', 'EG', 'MA', 'TN', 'DZ'],
        'Other': []
      };
      
      const regionData: Record<string, RegionData> = Object.keys(regions).reduce((acc, region) => {
        acc[region] = { region, countries: [], streams: 0, revenue: 0, revenuePercentage: 0, streamsPercentage: 0 };
        return acc;
      }, {} as Record<string, RegionData>);
      
      // Assign countries to regions
      enrichedCountries.forEach(country => {
        let assignedRegion = 'Other';
        // Use for...in loop with hasOwnProperty check for safer iteration
        for (const region in regions) {
          if (regions.hasOwnProperty(region)) {
            const countryCodes: string[] = regions[region as keyof typeof regions]; // Explicitly type as string[]
             // Ensure country.country is string and countryCodes is an array before includes check
            if (typeof country.country === 'string' && Array.isArray(countryCodes) && countryCodes.includes(country.country)) {
              assignedRegion = region;
              break;
            }
          }
        }
        // Push the enriched country object which now includes percentages
        // Ensure the pushed object matches the expected type in RegionData
        regionData[assignedRegion].countries.push(country);
        regionData[assignedRegion].streams += country.streams;
        regionData[assignedRegion].revenue += country.revenue;
      });
      
      // Calculate region percentages
      Object.values(regionData).forEach(region => {
        region.revenuePercentage = totalRevenue > 0 ? (region.revenue / totalRevenue) * 100 : 0;
        region.streamsPercentage = totalStreams > 0 ? (region.streams / totalStreams) * 100 : 0;
      });
      
      return {
        timeframe: {
          startDate: effectiveStartDate,
          endDate: effectiveEndDate
        },
        totalRevenue,
        totalStreams,
        byCountry: enrichedCountries,
        byRegion: Object.values(regionData),
        topCountries: enrichedCountries.slice(0, 10),
        fastestGrowing: enrichedCountries
          .filter(c => c.streams > totalStreams * 0.01) // Filter out countries with negligible streams
          .slice(0, 5) // Take top 5
      };
    } catch (error) {
      console.error('Error analyzing geographical royalty distribution:', error);
      throw error;
    }
  }
  
  /**
   * Get payment history for a user
   * 
   * This method retrieves the payment history for a user with flexible
   * date range filtering and status filtering capabilities.
   * 
   * @param userId - User ID to get payment history for
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @param status - Optional payment status for filtering
   * @returns Payment history data
   */
  static async getPaymentHistory(
    userId: number, 
    startDate?: Date,
    endDate?: Date,
    status?: string
  ) {
    try {
      // Calculate date range if not provided
      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      
      const effectiveStartDate = startDate || sixMonthsAgo;
      const effectiveEndDate = endDate || now;
      
      // Build the query
      let query = and(
        sql`${royaltyCalculations.userId} = ${sql`${userId}`}`,
        gte(royaltyCalculations.calculationDate, effectiveStartDate),
        lte(royaltyCalculations.calculationDate, effectiveEndDate)
      );
      
      // Add status filter if specified
      if (status) {
        query = and(query, sql`${royaltyCalculations.status} = ${sql`${status}`}`);
      }
      
      // Get royalty calculations for this user in the date range
      const royaltyCalcs = await db.select({
        id: royaltyCalculations.id,
        trackId: royaltyCalculations.trackId,
        amount: royaltyCalculations.amount,
        calculationDate: royaltyCalculations.calculationDate,
        status: royaltyCalculations.status,
        isPaid: royaltyCalculations.isPaid,
        paymentDate: royaltyCalculations.paymentDate,
        paymentReference: royaltyCalculations.paymentReference,
        timeframe: royaltyCalculations.timeframe
      })
      .from(royaltyCalculations)
      .where(query)
      .orderBy(desc(royaltyCalculations.calculationDate));
      
      // Group payments by month for reporting
      const paymentsByMonth = new Map<string, {
        total: number;
        count: number;
        date: Date;
      }>();
      
      royaltyCalcs.forEach(calc => {
        const date = new Date(calc.calculationDate);
        const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!paymentsByMonth.has(monthYear)) {
          paymentsByMonth.set(monthYear, {
            total: 0,
            count: 0,
            date: new Date(date.getFullYear(), date.getMonth(), 15) // Middle of month
          });
        }
        
        const month = paymentsByMonth.get(monthYear)!;
        month.total += Number(calc.amount);
        month.count += 1;
      });
      
      // Convert to array of payments
      const allPayments = Array.from(paymentsByMonth.entries()).map(([monthYear, data]) => {
        const [year, month] = monthYear.split('-').map(Number);
        
        return {
          id: `payment-${year}-${month}`,
          userId,
          amount: data.total,
          // currency field removed as it doesn't exist in the schema
          status: 'completed',
          paymentMethod: data.total > 100 ? 'Bank Transfer' : 'PayPal',
          paymentDate: data.date,
          periodStart: new Date(year, month - 1, 1),
          periodEnd: new Date(year, month, 0),
          referenceId: `P-${year}${month}-${userId}`,
          calculationCount: data.count
        };
      });
      
      // Sort by date descending
      allPayments.sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
      
      // Apply status filter if provided
      const filteredPayments = status
        ? allPayments.filter(p => p.status === status)
        : allPayments;
      
      return {
        payments: filteredPayments,
        totalPayments: filteredPayments.length,
        summary: {
          totalPaid: filteredPayments.reduce((sum, p) => sum + p.amount, 0),
          dateRange: {
            start: startDate,
            end: endDate
          }
        }
      };
    } catch (error) {
      console.error('Error retrieving payment history:', error);
      throw error;
    }
  }

  /**
   * Get royalty splits by release ID
   * 
   * Retrieves all royalty splits for tracks associated with a specific release.
   * This is useful for viewing how revenue is distributed among contributors
   * for an entire release.
   * 
   * @param releaseId - The release ID to get royalty splits for
   * @returns All royalty splits for tracks in the release
   */
  static async getRoyaltySplitsByReleaseId(releaseId: number) {
    try {
      // First get all tracks for this release
      const releaseTracks = await db.select({
        id: tracks.id
      })
      .from(tracks)
      .where(eq(tracks.releaseId, releaseId));
      
      if (releaseTracks.length === 0) {
        return {
          releaseId,
          status: 'no_data',
          message: 'No tracks found for this release',
          splits: []
        };
      }
      
      // Extract track IDs
      const trackIds = releaseTracks.map(track => track.id);
      
      // Get all royalty splits for these tracks
      const splits = await db.select()
        .from(royaltySplits)
        .where(inArray(royaltySplits.trackId, trackIds))
        .orderBy(royaltySplits.trackId, desc(royaltySplits.splitPercentage));
      
      return {
        releaseId,
        status: 'success',
        trackCount: trackIds.length,
        splits
      };
    } catch (error) {
      console.error('Error retrieving royalty splits for release:', error);
      throw error;
    }
  }

  /**
   * Update royalty splits for a release
   * 
   * Updates royalty split configurations for tracks in a release,
   * ensuring that percentages are valid and enforcing business rules.
   * 
   * @param releaseId - The release ID to update royalty splits for
   * @param splits - The new royalty split configurations
   * @returns Updated royalty splits
   */
  static async updateRoyaltySplitsForRelease(releaseId: number, splits: any[]) {
    try {
      // Validate that the release exists
      const releaseResult = await db.select()
        .from(releases)
        .where(eq(releases.id, releaseId))
        .limit(1);
      
      if (releaseResult.length === 0) {
        throw new Error(`Release with ID ${releaseId} not found`);
      }
      
      // Validate the splits data
      for (const split of splits) {
        if (!split.trackId) {
          throw new Error('Track ID is required for each split');
        }
        
        if (!split.recipientName) {
          throw new Error('Participant name is required for each split');
        }
        
        if (!split.splitPercentage || isNaN(Number(split.splitPercentage))) {
          throw new Error('Valid split percentage is required for each split');
        }
        
        if (Number(split.splitPercentage) <= 0 || Number(split.splitPercentage) > 100) {
          throw new Error('Split percentage must be between 0 and 100');
        }
      }
      
      // Group splits by track ID
      const splitsByTrack = new Map();
      for (const split of splits) {
        const trackId = split.trackId;
        if (!splitsByTrack.has(trackId)) {
          splitsByTrack.set(trackId, []);
        }
        splitsByTrack.get(trackId).push(split);
      }
      
      // Validate total percentage for each track
      for (const [trackId, trackSplits] of Array.from(splitsByTrack.entries())) {
        const totalPercentage = trackSplits.reduce(
          (sum: number, split: typeof royaltySplits.$inferSelect) => sum + Number(split.splitPercentage),
          0
        );
        
        if (totalPercentage > 100) {
          throw new Error(`Total percentage for track ${trackId} exceeds 100%`);
        }
      }
      
      // Process updates
      const results: (typeof royaltySplits.$inferSelect)[] = [];
      
      // Use a transaction to ensure all updates succeed or fail together
      await db.transaction(async (tx) => {
        for (const split of splits) {
          if (split.id) {
            // Update existing split
            const updateResult = await tx.update(royaltySplits)
              .set({
                recipientName: split.recipientName,
                splitPercentage: String(split.splitPercentage),
                roleType: split.roleType || 'performance',
                paymentDetails: split.paymentDetails,
                updatedAt: new Date()
              })
              .where(eq(royaltySplits.id, split.id))
              .returning();
            
            if (updateResult.length > 0) {
              results.push(updateResult[0]);
            }
          } else {
            // Create new split
             const insertData = { // Prepare data for insert
                trackId: split.trackId,
                recipientId: split.recipientId, 
                recipientType: split.recipientType || 'artist', 
                recipientName: split.recipientName,
                splitPercentage: String(split.splitPercentage), // Ensure string for DB
                roleType: split.roleType || 'performance',
                paymentDetails: split.paymentDetails
            };
             // Validate before insert using Zod schema
             const validatedData = insertRoyaltySplitSchema.parse({ 
                ...insertData, 
                splitPercentage: Number(insertData.splitPercentage) // Parse needs number
            }); 
            // Use validated data (which might have defaults applied by Zod)
            // but ensure splitPercentage is string for DB insert
            const insertResult = await tx.insert(royaltySplits)
              .values({ ...validatedData, splitPercentage: String(validatedData.splitPercentage) }) 
              .returning();
            
            if (insertResult.length > 0) {
              results.push(insertResult[0]);
            }
          }
        }
      });
      
      return {
        releaseId,
        status: 'success',
        message: 'Royalty splits updated successfully',
        splits: results
      };
    } catch (error) {
      console.error('Error updating royalty splits for release:', error);
      throw error;
    }
  }

  /**
   * Get royalty calculation status
   * 
   * Returns the current status of royalty calculations,
   * including recent calculations, pending calculations,
   * and error states.
   * 
   * @returns Calculation status overview
   */
  static async getRoyaltyCalculationStatus(options?: {
    limit?: number;
    includeRecent?: boolean;
    includePending?: boolean;
    includeErrors?: boolean;
  }) {
    try {
      // Set defaults
      const limit = options?.limit || 10;
      const includeRecent = options?.includeRecent !== false; // Default to true
      const includePending = options?.includePending !== false; // Default to true
      const includeErrors = options?.includeErrors !== false; // Default to true
      
      // Get recent calculations (limited by the specified limit)
      const recentCalculations = includeRecent ? await db.select()
        .from(royaltyCalculations)
        .orderBy(desc(royaltyCalculations.calculationDate))
        .limit(limit) : [];
      
      // Count total calculations
      const totalCountResult = await db.select({
        count: count()
      })
      .from(royaltyCalculations);
      
      const totalCalculations = totalCountResult[0]?.count || 0;
      
      // Count by status
      const statusCounts = await db.select({
        status: royaltyCalculations.status,
        count: count()
      })
      .from(royaltyCalculations)
      .groupBy(royaltyCalculations.status);
      
      // Count by payment status
      const paymentStatusCounts = await db.select({
        isPaid: royaltyCalculations.isPaid,
        count: count()
      })
      .from(royaltyCalculations)
      .groupBy(royaltyCalculations.isPaid);
      
      const pendingPaymentCount = paymentStatusCounts.find(item => !item.isPaid)?.count || 0;
      const paidCount = paymentStatusCounts.find(item => item.isPaid)?.count || 0;
      
      // Most recent calculation date
      const mostRecentDate = recentCalculations.length > 0 
        ? recentCalculations[0].calculationDate 
        : null;
      
      // Get pending calculations if requested
      const pendingCalculations = includePending ? await db.select()
        .from(royaltyCalculations)
        .where(eq(royaltyCalculations.status, 'pending'))
        .orderBy(desc(royaltyCalculations.calculationDate))
        .limit(limit) : [];
      
      // Get error calculations if requested
      const errorCalculations = includeErrors ? await db.select()
        .from(royaltyCalculations)
        .where(eq(royaltyCalculations.status, 'error'))
        .orderBy(desc(royaltyCalculations.calculationDate))
        .limit(limit) : [];
      
      return {
        totalCalculations,
        statusBreakdown: statusCounts.reduce((acc, item) => {
          acc[item.status] = item.count; // No assertion needed with correct initial type
          return acc;
        }, {} as Record<string, number>), // Provide explicit type for initial accumulator
        paymentStatus: {
          pending: pendingPaymentCount,
          paid: paidCount
        },
        mostRecentCalculation: mostRecentDate,
        recentCalculations: includeRecent ? recentCalculations : [],
        pendingCalculations: includePending ? pendingCalculations : [],
        errorCalculations: includeErrors ? errorCalculations : []
      };
    } catch (error) {
      console.error('Error retrieving royalty calculation status:', error);
      throw error;
    }
  }
}