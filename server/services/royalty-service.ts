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
  eq, and, gte, lte, sql, inArray, count, sum, avg, not, isNull, desc, SQL // Import SQL type
} from 'drizzle-orm';

// Import from schema for non-royalty tables
import { 
  tracks,
  releases,
  analytics,
  revenueShares,
  users,
  distributionRecords
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
   * Process batch royalty calculations for multiple tracks
   * This optimized method handles bulk calculations for improved performance
   * 
   * @param options - Options for batch processing
   * @returns Batch processing results
   */
  static async processBatchRoyaltyCalculations(options: {
    userId?: number;
    trackIds?: number[];
    releaseId?: number;
    startDate?: Date;
    endDate?: Date;
    platformId?: number;
    forceRecalculation?: boolean;
  }) {
    try {
      const startTime = Date.now();
      let trackIds: number[] = options.trackIds || [];
      
      // If releaseId is provided, get all tracks for that release
      if (options.releaseId && !trackIds.length) {
        const releaseTracks = await db.select({ id: tracks.id })
          .from(tracks)
          .where(eq(tracks.releaseId, options.releaseId));
          
        trackIds = releaseTracks.map(t => t.id);
      }
      
      // If userId is provided but no specific trackIds or releaseId,
      // get all tracks for that user
      if (options.userId && !trackIds.length && !options.releaseId) {
        const userTracks = await db.select({ id: tracks.id })
          .from(tracks)
          .where(eq(tracks.userId, options.userId));
          
        trackIds = userTracks.map(t => t.id);
      }
      
      if (trackIds.length === 0) {
        return {
          status: 'no_data',
          message: 'No tracks found for the specified criteria',
          processed: 0
        };
      }
      
      // Process tracks in batches for better performance
      const BATCH_SIZE = 10;
      const results = [];
      let successCount = 0;
      let errorCount = 0;
      
      // Process in chunks to avoid overloading the database
      for (let i = 0; i < trackIds.length; i += BATCH_SIZE) {
        const batchIds = trackIds.slice(i, i + BATCH_SIZE);
        
        // Process each track ID in the current batch
        for (const trackId of batchIds) {
          try {
            // --- Start: Inline royalty calculation logic for a single track ---
            const trackData = await db.select({
              track: tracks,
              userId: tracks.userId,
              releaseId: tracks.releaseId,
            })
            .from(tracks)
            .where(eq(tracks.id, trackId))
            .limit(1);

            if (trackData.length === 0) {
              throw new Error(`Track with ID ${trackId} not found`);
            }
            // Ensure userId and releaseId are not null before proceeding
            const userId = trackData[0].userId;
            const releaseId = trackData[0].releaseId;
             if (userId === null || releaseId === null) {
               throw new Error(`Track ${trackId} is missing userId or releaseId`);
             }


            // Build analytics query
            const analyticsConditions: (SQL | undefined)[] = [eq(analytics.trackId, trackId)];
            if (options.platformId) {
              analyticsConditions.push(eq(analytics.platform, String(options.platformId)));
            }
            if (options.startDate && options.endDate) {
              analyticsConditions.push(gte(analytics.date, options.startDate));
              analyticsConditions.push(lte(analytics.date, options.endDate));
            }
            const validAnalyticsConditions = analyticsConditions.filter(c => c !== undefined) as SQL[];
            
            const trackAnalytics = await db.select({
                revenue: analytics.revenue,
                streams: analytics.streams,
                platform: analytics.platform,
                distributionRecordId: distributionRecords.id // Needed for storing calculations
            })
            .from(analytics)
            // Join based on releaseId and platform (assuming analytics.platform stores platform ID as text)
            .leftJoin(distributionRecords, and(
                eq(analytics.releaseId, distributionRecords.releaseId),
                eq(analytics.platform, sql`${distributionRecords.platformId}::text`) // Cast platformId to text for comparison
             )) 
            .where(and(...validAnalyticsConditions));

            if (trackAnalytics.length === 0) {
               results.push({ trackId, status: 'no_data', message: 'No analytics data found' });
               continue; 
            }

            // Get splits directly using db query as getTrackRoyaltySplits was removed
            const splits = await db.select().from(royaltySplits)
              .where(eq(royaltySplits.trackId, trackId))
              .orderBy(desc(royaltySplits.splitPercentage));
              
            const effectiveSplits = splits.length > 0 ? splits : [{
              id: 0, trackId, recipientId: userId, splitPercentage: '100', roleType: 'performance', 
              // Add other required fields with default/null values if necessary
              recipientName: 'Track Owner', recipientType: 'artist', paymentDetails: null, createdAt: new Date() 
            }];

            // Calculate total revenue/streams for the track within the timeframe/platform
            let totalRevenue = 0;
            let totalStreams = 0;
            trackAnalytics.forEach(a => {
                totalRevenue += Number(a.revenue) || 0;
                totalStreams += Number(a.streams) || 0;
            });

            // Prepare calculations for storage
            const calculationsToStore = [];
            for (const split of effectiveSplits) {
                const splitPercentage = Number(split.splitPercentage);
                const amount = (totalRevenue * splitPercentage) / 100;
                
                // Find a relevant distribution record ID (can be simplified/improved)
                const distRecordId = trackAnalytics.find(a => a.distributionRecordId)?.distributionRecordId ?? 0; 

                calculationsToStore.push({
                    userId,
                    trackId,
                    releaseId,
                    distributionRecordId: distRecordId, 
                    platformId: options.platformId || 0, // Use provided or default
                    amount: String(amount),
                    streamCount: String(totalStreams), // Store total streams for context
                    ratePerStream: String(totalStreams > 0 ? totalRevenue / totalStreams : 0),
                    timeframe: options.startDate && options.endDate ? { startDate: options.startDate, endDate: options.endDate } : null,
                    roleType: split.roleType || 'performance',
                    status: 'calculated',
                    isProcessed: false,
                    isPaid: false,
                    splitId: split.id || null,
                    recipientId: split.recipientId,
                    splitPercentage: String(splitPercentage), 
                    // Add other necessary fields from InsertRoyaltyCalculation type
                    metadata: { source: 'batch_recalculation' } 
                });
            }

            // Store results if needed (consider updateExisting/forceRecalculation logic here)
            if (calculationsToStore.length > 0) {
                 // TODO: Implement logic for options.forceRecalculation (delete existing before insert?)
                 await RoyaltyService.storeRoyaltyCalculations(calculationsToStore as any);
            }
            // --- End: Inline royalty calculation logic ---
            
            results.push({ trackId, status: 'success' });
            successCount++;
          } catch (error) {
             console.error(`Error processing track ${trackId}:`, error);
             results.push({ 
               trackId, 
               status: 'error', 
               error: error instanceof Error ? error.message : 'Unknown error'
             });
             errorCount++;
          }
        }
      }
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      return {
        status: 'success',
        message: `Batch processing completed in ${processingTime}ms`,
        total: trackIds.length,
        processed: successCount,
        failed: errorCount,
        processingTimeMs: processingTime,
        results
      };
    } catch (error) {
      console.error('Error in batch royalty processing:', error);
      throw error;
    }
  }
  
  /**
   * Calculate royalties for a specific time period for a user
   * 
   * @param userId - The ID of the user to calculate royalties for
   * @param startDate - The start date for the calculation period
   * @param endDate - The end date for the calculation period
   * @returns Calculated royalties for the period
   */
  static async calculateRoyalties(userId: number, startDate: Date, endDate: Date) {
    try {
      // Query analytics data for the given period
      const analyticsData = await db.select({
        trackId: analytics.trackId,
        platform: analytics.platform,
        streams: analytics.streams,
        revenue: analytics.revenue,
        date: analytics.date
      })
      .from(analytics)
      .leftJoin(tracks, eq(tracks.id, analytics.trackId))
      .where(
        and(
          eq(tracks.userId, userId),
          gte(analytics.date, startDate),
          lte(analytics.date, endDate)
        )
      );
      
      // Calculate total revenue by track
      const revenueByTrack = new Map<number, number>();
      const streamsByTrack = new Map<number, number>();
      
      // Use a single-pass aggregation
      for (const item of analyticsData) {
        const revenue = Number(item.revenue) || 0;
        const streams = Number(item.streams) || 0;
        const trackId = Number(item.trackId);
        
        revenueByTrack.set(
          trackId, 
          (revenueByTrack.get(trackId) || 0) + revenue
        );
        
        streamsByTrack.set(
          trackId, 
          (streamsByTrack.get(trackId) || 0) + streams
        );
      }
      
      // Get all tracks and their royalty splits information
      const trackIds = Array.from(revenueByTrack.keys()); // Use Array.from for iterator
      
      if (trackIds.length === 0) {
        return {
          status: 'no_data',
          message: 'No analytics data found for the specified period',
          userId,
          startDate,
          endDate,
          totalRevenue: 0,
          totalStreams: 0,
          calculations: []
        };
      }
      
      // Get tracks and their release information
      const tracksData = await db.select({
        track: tracks,
        releaseId: tracks.releaseId,
        releaseTitle: releases.title,
        artistName: releases.artistName
      })
      .from(tracks)
      .leftJoin(releases, eq(releases.id, tracks.releaseId))
      .where(() => {
        // Use parameterized OR conditions for multiple track IDs
        const trackConditions = trackIds.map(id => eq(tracks.id, id));
        return trackConditions.length === 1 
          ? trackConditions[0] 
          : sql`(${sql.join(trackConditions, sql` OR `)})`;
      });
      
      // Get all royalty splits for these tracks in a single query
      const allSplits = await db.select()
        .from(royaltySplits)
        .where(() => {
          // Use parameterized OR conditions for multiple track IDs
          const trackConditions = trackIds.map(id => eq(royaltySplits.trackId, id));
          return trackConditions.length === 1 
            ? trackConditions[0] 
            : sql`(${sql.join(trackConditions, sql` OR `)})`;
        });
      
      // Map splits by track ID for quick lookup
      const splitsByTrack = new Map<number, typeof royaltySplits.$inferSelect[]>();
      for (const split of allSplits) {
         // Ensure split.trackId is not null before using it as a key
         if (split.trackId !== null) { 
            if (!splitsByTrack.has(split.trackId)) {
              splitsByTrack.set(split.trackId, []);
            }
            splitsByTrack.get(split.trackId)!.push(split);
        }
      }
      
      // Calculate royalties for each track
      const calculations = [];
      let totalRevenue = 0;
      let totalStreams = 0;
      
      for (const track of tracksData) {
        const trackId = track.track.id;
        const revenue = revenueByTrack.get(trackId) || 0;
        const streams = streamsByTrack.get(trackId) || 0;
        
        totalRevenue += revenue;
        totalStreams += streams;
        
        // Get splits for this track
        const splits = splitsByTrack.get(trackId) || [];
        
        if (splits.length === 0) {
          // If no splits, all revenue goes to the track owner
          calculations.push({
            distributionRecordId: 0, // Will be linked later during actual distribution
            trackId,
            releaseId: track.releaseId,
            userId,
            amount: String(revenue),
            streamCount: streams,
            ratePerStream: String(streams > 0 ? revenue / streams : 0),
            timeframe: { startDate, endDate },
            roleType: 'performance', // Default type
            platformId: 0, // Generic platform ID
            status: 'calculated',
            isProcessed: false,
            isPaid: false,
            trackTitle: track.track.title,
            releaseTitle: track.releaseTitle,
            artistName: track.artistName,
            recipientName: track.artistName || 'Artist',
            recipientId: userId,
            splitPercentage: "100",
            metadata: {
              calculationMethod: 'automatic',
              source: 'analytics',
            }
          });
        } else {
          // Calculate royalties based on splits
          for (const split of splits) {
            const splitPercentage = Number(split.splitPercentage) || 0;
            const amount = (revenue * splitPercentage) / 100;
            
            calculations.push({
              distributionRecordId: 0, // Will be linked later during actual distribution
              trackId,
              releaseId: track.releaseId,
              userId,
              splitId: split.id,
              amount: String(amount),
              streamCount: streams,
              ratePerStream: String(streams > 0 ? revenue / streams : 0),
              timeframe: { startDate, endDate },
              roleType: split.roleType || 'performance',
              platformId: 0, // Generic platform ID
              status: 'calculated',
              isProcessed: false,
              isPaid: false,
              trackTitle: track.track.title,
              releaseTitle: track.releaseTitle,
              artistName: track.artistName,
              recipientName: split.recipientName,
              recipientId: split.recipientId,
              splitPercentage: String(splitPercentage),
              metadata: {
                calculationMethod: 'split-based',
                source: 'analytics',
                splitType: split.recipientType
              }
            });
          }
        }
      }
      
      // Store calculations for future reference
      // Cast calculations to the expected type for storeRoyaltyCalculations
      await this.storeRoyaltyCalculations(calculations as any);
      
      return {
        status: 'success',
        message: 'Royalties calculated successfully',
        userId,
        startDate,
        endDate,
        totalRevenue,
        totalStreams,
        trackCount: trackIds.length,
        calculations
      };
    } catch (error) {
      console.error('Error calculating royalties:', error);
      throw error;
    }
  }
  
  /**
   * Calculate projected royalties for future periods
   * 
   * @param userId - The ID of the user to calculate projections for
   * @param months - Number of months to project into the future
   * @returns Projected royalties for future periods
   */
  static async calculateRoyaltyProjections(userId: number, months: number = 3) {
    try {
      // Calculate the last 3 months of actual data to use as a baseline
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      // Get recent royalty data for baseline
      const recentRoyalties = await db.select({
        trackId: royaltyCalculations.trackId,
        releaseId: royaltyCalculations.releaseId,
        amount: royaltyCalculations.amount,
        streamCount: royaltyCalculations.streamCount,
        calculationDate: royaltyCalculations.calculationDate
      })
      .from(royaltyCalculations)
      .where(
        and(
          eq(royaltyCalculations.userId, userId),
          gte(royaltyCalculations.calculationDate, threeMonthsAgo)
        )
      );
      
      // Aggregate data by month for trending
      const monthlyRevenue = new Map<string, number>();
      const monthlyStreams = new Map<string, number>();
      
      for (const item of recentRoyalties) {
        const date = new Date(item.calculationDate);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const amount = Number(item.amount) || 0;
        const streams = Number(item.streamCount) || 0;
        
        monthlyRevenue.set(
          monthKey, 
          (monthlyRevenue.get(monthKey) || 0) + amount
        );
        
        monthlyStreams.set(
          monthKey, 
          (monthlyStreams.get(monthKey) || 0) + streams
        );
      }
      
      // Calculate month-over-month growth rates
      const monthKeys = Array.from(monthlyRevenue.keys()).sort(); // Use Array.from for iterator
      let avgRevenueGrowth = 0;
      let avgStreamsGrowth = 0;
      
      if (monthKeys.length >= 2) {
        let growthRateSum = 0;
        let streamGrowthRateSum = 0;
        let periods = 0;
        
        for (let i = 1; i < monthKeys.length; i++) {
          const prevMonth = monthKeys[i - 1];
          const currentMonth = monthKeys[i];
          
          const prevRevenue = monthlyRevenue.get(prevMonth) || 0;
          const currentRevenue = monthlyRevenue.get(currentMonth) || 0;
          
          const prevStreams = monthlyStreams.get(prevMonth) || 0;
          const currentStreams = monthlyStreams.get(currentMonth) || 0;
          
          if (prevRevenue > 0) {
            growthRateSum += (currentRevenue - prevRevenue) / prevRevenue;
            periods++;
          }
          
          if (prevStreams > 0) {
            streamGrowthRateSum += (currentStreams - prevStreams) / prevStreams;
          }
        }
        
        avgRevenueGrowth = periods > 0 ? growthRateSum / periods : 0;
        avgStreamsGrowth = periods > 0 ? streamGrowthRateSum / periods : 0;
      }
      
      // Use most recent month as baseline
      const lastMonth = monthKeys[monthKeys.length - 1];
      const baselineRevenue = monthlyRevenue.get(lastMonth) || 0;
      const baselineStreams = monthlyStreams.get(lastMonth) || 0;
      
      // Generate projections for future months
      const projections: { 
          month: number; 
          date: Date; 
          estimatedRevenue: number; 
          estimatedStreams: number; 
          growthRate: number; 
          cumulativeRevenue: number; 
      }[] = []; // Add explicit type annotation
      let projectedRevenue = baselineRevenue;
      let projectedStreams = baselineStreams;
      
      for (let i = 1; i <= months; i++) {
        const projectionDate = new Date();
        projectionDate.setMonth(today.getMonth() + i);
        
        // Apply growth rate to get projected values
        projectedRevenue = projectedRevenue * (1 + avgRevenueGrowth);
        projectedStreams = projectedStreams * (1 + avgStreamsGrowth);
        
        projections.push({
          month: i,
          date: projectionDate,
          estimatedRevenue: projectedRevenue,
          estimatedStreams: projectedStreams,
          growthRate: avgRevenueGrowth,
          cumulativeRevenue: i === 1 ? projectedRevenue : projections[i - 2].cumulativeRevenue + projectedRevenue
        });
      }
      
      return {
        status: 'success',
        message: 'Royalty projections calculated successfully',
        baselineData: {
          months: monthKeys,
          revenues: monthKeys.map(month => monthlyRevenue.get(month) || 0),
          streams: monthKeys.map(month => monthlyStreams.get(month) || 0)
        },
        growthRate: {
          revenue: avgRevenueGrowth,
          streams: avgStreamsGrowth
        },
        projections
      };
    } catch (error) {
      console.error('Error calculating royalty projections:', error);
      throw error;
    }
  }
  
  /**
   * Generate a royalty statement for a specific time period
   * 
   * @param userId - The ID of the user to generate statement for
   * @param startDate - The start date for the statement period
   * @param endDate - The end date for the statement period
   * @param format - The format of the statement (pdf, csv, json)
   * @returns Royalty statement data or download link
   */
  static async generateRoyaltyStatement(
    userId: number,
    startDate: Date,
    endDate: Date,
    format: 'pdf' | 'csv' | 'json' = 'json'
  ) {
    try {
      // Get royalty calculations for the period
      const calculations = await db.select()
        .from(royaltyCalculations)
        .where(
          and(
            eq(royaltyCalculations.userId, userId),
            gte(royaltyCalculations.calculationDate, startDate),
            lte(royaltyCalculations.calculationDate, endDate)
          )
        );
      
      // Get user information
      const userData = await db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      if (userData.length === 0) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      const user = userData[0];
      
      // Aggregate data for the statement
      let totalRevenue = 0;
      let totalStreams = 0;
      let trackCount = new Set();
      let releaseCount = new Set();
      
      const revenueByTrack = new Map<number, number>();
      const streamsByTrack = new Map<number, number>();
      const revenueByPlatform = new Map<number, number>();
      const streamsByPlatform = new Map<number, number>();
      
      for (const calc of calculations) {
        const amount = Number(calc.amount) || 0;
        const streams = Number(calc.streamCount) || 0;
        const trackId = Number(calc.trackId);
        const releaseId = Number(calc.releaseId);
        const platformId = Number(calc.platformId);
        
        totalRevenue += amount;
        totalStreams += streams;
        trackCount.add(trackId);
        releaseCount.add(releaseId);
        
        // Aggregate by track
        revenueByTrack.set(
          trackId, 
          (revenueByTrack.get(trackId) || 0) + amount
        );
        streamsByTrack.set(
          trackId, 
          (streamsByTrack.get(trackId) || 0) + streams
        );
        
        // Aggregate by platform
        if (platformId) {
          revenueByPlatform.set(
            platformId, 
            (revenueByPlatform.get(platformId) || 0) + amount
          );
          streamsByPlatform.set(
            platformId, 
            (streamsByPlatform.get(platformId) || 0) + streams
          );
        }
      }
      
      // Prepare statement data
      const statementData = {
        user: {
          id: user.id,
          name: user.fullName, // Use fullName if available
          email: user.email,
          entityName: user.entityName // Use entityName if available
        },
        period: {
          startDate,
          endDate
        },
        summary: {
          totalRevenue,
          totalStreams,
          trackCount: trackCount.size,
          releaseCount: releaseCount.size,
          avgRevenuePerStream: totalStreams > 0 ? totalRevenue / totalStreams : 0
        },
        byTrack: Array.from(revenueByTrack.entries()).map(([trackId, revenue]) => ({
          trackId,
          revenue,
          streams: streamsByTrack.get(trackId) || 0,
          revenuePerStream: (streamsByTrack.get(trackId) || 0) > 0 
            ? revenue / (streamsByTrack.get(trackId) || 1) 
            : 0
        })),
        byPlatform: Array.from(revenueByPlatform.entries()).map(([platformId, revenue]) => ({
          platformId,
          revenue,
          streams: streamsByPlatform.get(platformId) || 0,
          revenuePerStream: (streamsByPlatform.get(platformId) || 0) > 0 
            ? revenue / (streamsByPlatform.get(platformId) || 1) 
            : 0
        })),
        details: calculations
      };
      
      // Return data in the requested format
      if (format === 'json') {
        return {
          status: 'success',
          format: 'json',
          statement: statementData
        };
      } 
      
      // For other formats, just return JSON for now with a message
      // In a real implementation, we'd generate actual PDF or CSV files
      return {
        status: 'success',
        format: format,
        message: `${format.toUpperCase()} generation not implemented yet. Returning JSON data.`,
        statement: statementData
      };
    } catch (error) {
      console.error('Error generating royalty statement:', error);
      throw error;
    }
  }
  
  /**
   * Get payment history for a user
   * 
   * @param userId - The ID of the user to get payment history for
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @param status - Optional payment status for filtering
   * @returns Payment history data
   */
  static async getPaymentHistory(userId: number, startDate?: Date, endDate?: Date, status?: string) {
    try {
      // For this prototype, we'll get payment history based on royalty calculations
      
      // Build conditions array dynamically
      const conditions: (SQL | undefined)[] = [eq(royaltyCalculations.userId, userId)];
      if (startDate) {
        conditions.push(gte(royaltyCalculations.calculationDate, startDate));
      }
      if (endDate) {
        conditions.push(lte(royaltyCalculations.calculationDate, endDate));
      }
      if (status) {
        conditions.push(eq(royaltyCalculations.status, status));
      } else {
        // Default to only showing paid royalties
        conditions.push(eq(royaltyCalculations.status, 'paid'));
      }
      const validConditions = conditions.filter(c => c !== undefined) as SQL[];

      // Apply conditions in a single where clause
      const results = await db.select({
          id: royaltyCalculations.id,
          trackId: royaltyCalculations.trackId,
          releaseId: royaltyCalculations.releaseId,
          amount: royaltyCalculations.amount,
          status: royaltyCalculations.status,
          platformId: royaltyCalculations.platformId,
          recipientId: royaltyCalculations.recipientId,
          // recipientName: royaltyCalculations.recipientName, // recipientName doesn't exist
          paymentDate: royaltyCalculations.paymentDate,
          paymentReference: royaltyCalculations.paymentReference,
          calculationDate: royaltyCalculations.calculationDate
        })
        .from(royaltyCalculations)
        .where(and(...validConditions));
      
      // Transform into payment records
      const payments = results.map(calc => ({
        id: calc.id,
        userId,
        amount: Number(calc.amount),
        currency: 'USD', // Hardcoded for prototype
        status: calc.status,
        paymentDate: calc.paymentDate || calc.calculationDate, // Use payment date if available
        paymentMethod: 'Direct Deposit', // Hardcoded for prototype
        reference: calc.paymentReference || `PAY-${calc.id}`,
        description: `Royalty payment for track ID ${calc.trackId}`,
        // recipient: calc.recipientName, // recipientName doesn't exist on calc
        recipientId: calc.recipientId,
        trackId: calc.trackId,
        releaseId: calc.releaseId,
        platformId: calc.platformId
      }));
      
      // Group payments by month for summary
      const paymentsByMonth = new Map<string, number>();
      for (const payment of payments) {
        const date = new Date(payment.paymentDate);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        paymentsByMonth.set(
          monthKey, 
          (paymentsByMonth.get(monthKey) || 0) + payment.amount
        );
      }
      
      return {
        status: 'success',
        userId,
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        summary: {
          byMonth: Array.from(paymentsByMonth.entries()).map(([month, amount]) => ({
            month,
            amount
          }))
        },
        payments
      };
    } catch (error) {
      console.error('Error retrieving payment history:', error);
      throw error;
    }
  }
  
  /**
   * Process royalty payments for tracks or releases
   * 
   * @param userId - The ID of the user processing payments
   * @param method - The payment method to use
   * @param options - Options for processing payments
   * @returns Results of payment processing
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
      // Build conditions array dynamically
      const conditions: (SQL | undefined)[] = [
        eq(royaltyCalculations.userId, userId),
        eq(royaltyCalculations.status, 'calculated')
      ];
      if (options.trackIds && options.trackIds.length > 0) {
        conditions.push(inArray(royaltyCalculations.trackId, options.trackIds));
      } else if (options.releaseId) {
        conditions.push(eq(royaltyCalculations.releaseId, options.releaseId));
      }
      const validConditions = conditions.filter(c => c !== undefined) as SQL[];

      // Build and execute the query
      const calculations = await db.select()
        .from(royaltyCalculations)
        .where(and(...validConditions));
      
      if (calculations.length === 0) {
        return {
          status: 'no_data',
          message: 'No calculated royalties found to process for payment',
          userId,
          processed: 0
        };
      }
      
      // Group calculations by recipient for aggregation
      const paymentsByRecipient = new Map<number, {
        recipientId: number;
        recipientName: string;
        amount: number;
        calculations: typeof royaltyCalculations.$inferSelect[];
      }>();
      
      for (const calc of calculations) {
        const recipientId = Number(calc.recipientId) || 0;
        const amount = Number(calc.amount) || 0;
        
        if (!paymentsByRecipient.has(recipientId)) {
          paymentsByRecipient.set(recipientId, {
            recipientId,
            recipientName: 'Unknown', // Use a placeholder as recipientName doesn't exist on calc
            amount: 0,
            calculations: []
          });
        }
        
        const recipient = paymentsByRecipient.get(recipientId)!;
        recipient.amount += amount;
        recipient.calculations.push(calc);
      }
      
      // Process payments (in a real app, this would interact with payment APIs)
      const paymentResults = [];
      
      for (const [recipientId, data] of Array.from(paymentsByRecipient.entries())) { // Use Array.from for iterator
        // Skip payments below minimum threshold
        const MINIMUM_PAYMENT = 50; // $50 minimum payout
        if (data.amount < MINIMUM_PAYMENT) {
          paymentResults.push({
            recipientId,
            recipientName: data.recipientName,
            status: 'skipped',
            message: `Payment amount ${data.amount} is below minimum threshold of ${MINIMUM_PAYMENT}`,
            amount: data.amount,
            calculationCount: data.calculations.length
          });
          continue;
        }
        
        // In a real app, process the actual payment here
        // For now, just simulate success
        const paymentReference = `PAY-${Date.now()}-${recipientId}`;
        paymentResults.push({
          recipientId,
          recipientName: data.recipientName,
          status: 'success',
          message: `Successfully processed payment of ${data.amount} via ${method}`,
          amount: data.amount,
          paymentMethod: method,
          paymentDate: new Date(),
          paymentReference,
          calculationCount: data.calculations.length
        });
        
        // Update the status of processed calculations
        const calculationIds = data.calculations.map((c: typeof royaltyCalculations.$inferSelect) => c.id); // Add type annotation for c
        await db.update(royaltyCalculations)
          .set({
            status: 'paid',
            isPaid: true,
            paymentDate: new Date(),
            paymentReference,
            updatedAt: new Date()
          })
          .where(inArray(royaltyCalculations.id, calculationIds)); // Use inArray for multiple IDs
      }
      
      return {
        status: 'success',
        message: `Processed payments for ${paymentResults.length} recipients`,
        userId,
        paymentMethod: method,
        processed: paymentResults.filter(r => r.status === 'success').length,
        skipped: paymentResults.filter(r => r.status === 'skipped').length,
        totalAmount: paymentResults.reduce((sum, r) => sum + r.amount, 0),
        results: paymentResults
      };
    } catch (error) {
      console.error('Error processing royalty payments:', error);
      throw error;
    }
  }
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
      
      // Build the query in a single chain
      const query = db.select()
        .from(royaltyCalculations)
        .where(and(...validConditions))
        .orderBy(desc(royaltyCalculations.calculationDate))
        .limit(options.limit || 1000); // Add a default limit if none provided

      // Execute query and return results
      const results = await query;
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
  static async storeRoyaltyCalculations(calculations: Omit<InsertRoyaltyCalculation, 'id' | 'calculationDate'>[]) {
    try {
      if (!calculations.length) {
        return { status: 'no_data', message: 'No calculations to store', saved: 0 };
      }
      
      // Validate the calculation data
      calculations.forEach(calc => {
        if (!calc.distributionRecordId || !calc.trackId || !calc.releaseId || !calc.userId) {
          throw new Error('Missing required fields in calculation data');
        }
        
        if (!calc.amount && calc.amount !== 0) {
          throw new Error('Royalty amount is required');
        }
      });
      
      // Prepare data for insertion, converting number fields to strings where needed
      const dataToInsert = calculations.map(calc => ({
        ...calc,
        amount: String(calc.amount), // Ensure amount is string
        streamCount: calc.streamCount ? String(calc.streamCount) : '0',
        ratePerStream: calc.ratePerStream ? String(calc.ratePerStream) : '0',
        // Ensure splitPercentage is string or null/undefined
        splitPercentage: calc.splitPercentage !== undefined && calc.splitPercentage !== null 
            ? String(calc.splitPercentage) 
            : null, 
      }));
      
      // Store the calculations with a batch operation
      // Cast dataToInsert to the expected type to satisfy the overload
      const result = await db.insert(royaltyCalculations).values(dataToInsert as any).returning();
      
      return {
        status: 'success',
        message: `Successfully stored ${result.length} royalty calculations`,
        saved: result.length,
        calculations: result
      };
    } catch (error) {
      console.error('Error storing royalty calculations:', error);
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
   */
} // Add missing closing brace for the class
