/**
 * Platform-Specific Royalty Analytics Service
 * 
 * This service provides detailed analytics and breakdowns of royalty calculations
 * across different distribution platforms (Spotify, Apple Music, etc.). It enables
 * comprehensive analysis of revenue streams based on platform-specific metrics and rates.
 * 
 * Key features:
 * - Platform-specific royalty rate calculations
 * - Revenue comparison across platforms
 * - Market share analysis by platform
 * - Trend analysis for platform performance
 * - Geographic distribution of platform earnings
 */

import { db } from '../db';
import { distributionRecords, distributionPlatforms, releases, tracks, users, analytics as analyticsTable, revenueShares } from '../../shared/schema';
import { royaltyCalculations } from '../../shared/enhanced-metadata-schema';
import { eq, and, gte, lte, sql, desc, asc, inArray } from 'drizzle-orm';

// Import custom types
interface PlatformRoyaltyRate {
  platformId: number;
  platformName: string;
  baseRatePerStream: number;
  premiumRatePerStream: number;
  minimumPayable: number;
  paymentThreshold: number;
  effectiveDate: Date;
}

/**
 * Platform Royalty Analytics Service
 * 
 * This service provides detailed analytics for royalty calculations across different
 * streaming platforms. It helps artists and labels understand their revenue sources
 * and optimize their distribution strategies.
 */
export class PlatformRoyaltyAnalyticsService {
  /**
   * Helper method to get a color for a platform based on its name
   * Used as a fallback when platform color is not defined in the database
   * 
   * @param platformName - The name of the platform
   * @returns A hex color code for the platform
   */
  static getPlatformColor(platformName: string): string {
    const colorMap: {[key: string]: string} = {
      'Spotify': '#1DB954',
      'Apple Music': '#FC3C44',
      'Amazon Music': '#00A8E1',
      'YouTube Music': '#FF0000',
      'Tidal': '#000000',
      'Deezer': '#EF5466',
      'Pandora': '#3668FF',
      'SoundCloud': '#FF7700',
      'Bandcamp': '#629AA9',
      'TikTok': '#000000',
      'Facebook': '#1877F2',
      'Instagram': '#E1306C',
      'Napster': '#222222',
      'Boomplay': '#E9332A',
      'Anghami': '#9C1BD4'
    };
    
    return colorMap[platformName] || '#888888'; // Default gray color if platform not found
  }
  
  /**
   * Helper method for getting detailed track royalties
   * 
   * @param trackId - The track ID to get detailed royalties for
   * @param startDate - Start date for the royalty period
   * @param endDate - End date for the royalty period
   * @returns Detailed royalty breakdown for the track
   */
  /**
   * Get detailed royalty information for a specific track
   * 
   * @param trackId - The track ID to get detailed royalties for
   * @param startDate - Start date for the royalty period
   * @param endDate - End date for the royalty period 
   * @returns Detailed breakdown of track royalties by platform and time
   */
  private static async getDetailedTrackRoyalties(trackId: number, startDate: Date, endDate: Date) {
    try {
      // Get daily royalty data
      const dailyRoyalties = await db
        .select({
          calculationDate: royaltyCalculations.calculationDate,
          platformId: distributionRecords.platformId,
          platformName: distributionPlatforms.name,
          amount: royaltyCalculations.amount,
          streams: royaltyCalculations.streamCount,
          roleType: royaltyCalculations.roleType
        })
        .from(royaltyCalculations)
        .innerJoin(
          distributionRecords,
          eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
        )
        .innerJoin(
          distributionPlatforms,
          eq(distributionRecords.platformId, distributionPlatforms.id)
        )
        .where(
          and(
            eq(royaltyCalculations.trackId, trackId),
            gte(royaltyCalculations.calculationDate, startDate),
            lte(royaltyCalculations.calculationDate, endDate)
          )
        )
        .orderBy(asc(royaltyCalculations.calculationDate));
      
      // Process data for timeline visualization
      const dailyTotals: { [date: string]: { revenue: number, streams: number } } = {};
      
      dailyRoyalties.forEach(entry => {
        const dateString = entry.calculationDate.toISOString().split('T')[0];
        
        if (!dailyTotals[dateString]) {
          dailyTotals[dateString] = { revenue: 0, streams: 0 };
        }
        
        dailyTotals[dateString].revenue += Number(entry.amount || 0);
        dailyTotals[dateString].streams += Number(entry.streams || 0);
      });
      
      // Convert to timeline format
      const timeline = Object.keys(dailyTotals).map(date => ({
        date,
        revenue: dailyTotals[date].revenue,
        streams: dailyTotals[date].streams,
        ratePerStream: dailyTotals[date].streams > 0 
          ? dailyTotals[date].revenue / dailyTotals[date].streams 
          : 0
      }));
      
      // Group by platform for platform breakdown
      const platformBreakdown: { [platformId: number]: { 
        platformId: number,
        name: string,
        daily: { [date: string]: { revenue: number, streams: number } }
      } } = {};
      
      dailyRoyalties.forEach(entry => {
        if (!platformBreakdown[entry.platformId]) {
          platformBreakdown[entry.platformId] = {
            platformId: entry.platformId,
            name: entry.platformName,
            daily: {}
          };
        }
        
        const dateString = entry.calculationDate.toISOString().split('T')[0];
        
        if (!platformBreakdown[entry.platformId].daily[dateString]) {
          platformBreakdown[entry.platformId].daily[dateString] = { 
            revenue: 0, 
            streams: 0 
          };
        }
        
        platformBreakdown[entry.platformId].daily[dateString].revenue += Number(entry.amount || 0);
        platformBreakdown[entry.platformId].daily[dateString].streams += Number(entry.streams || 0);
      });
      
      // Group by royalty type for royalty type breakdown
      const roleTypeBreakdown: { [type: string]: { 
        type: string,
        revenue: number,
        percentage: number
      } } = {};
      
      let totalRoyaltyAmount = 0;
      
      dailyRoyalties.forEach(entry => {
        const type = entry.roleType || 'unknown';
        
        if (!roleTypeBreakdown[type]) {
          roleTypeBreakdown[type] = {
            type,
            revenue: 0,
            percentage: 0
          };
        }
        
        roleTypeBreakdown[type].revenue += Number(entry.amount || 0);
        totalRoyaltyAmount += Number(entry.amount || 0);
      });
      
      // Calculate percentages for role types
      Object.values(roleTypeBreakdown).forEach(breakdownItem => {
        breakdownItem.percentage = totalRoyaltyAmount > 0 
          ? (breakdownItem.revenue / totalRoyaltyAmount) * 100 
          : 0;
      });
      
      return {
        timeline,
        platformBreakdown: Object.values(platformBreakdown).map(platform => ({
          platformId: platform.platformId,
          name: platform.name,
          color: this.getPlatformColor(platform.name),
          timeline: Object.keys(platform.daily).map(date => ({
            date,
            revenue: platform.daily[date].revenue,
            streams: platform.daily[date].streams,
            ratePerStream: platform.daily[date].streams > 0 
              ? platform.daily[date].revenue / platform.daily[date].streams 
              : 0
          }))
        })),
        roleTypeBreakdown: Object.values(roleTypeBreakdown)
      };
    } catch (error) {
      console.error('Error getting detailed track royalties:', error);
      return {
        error: 'Failed to retrieve detailed track royalties',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  /**
   * Get track-specific platform royalties
   * 
   * @param trackId - The track ID to get royalties for
   * @param startDate - Start date for the royalty period
   * @param endDate - End date for the royalty period
   * @param detailed - Whether to include detailed breakdowns
   * @returns Detailed platform royalty data for the track
   */
  static async getTrackPlatformRoyalties(
    trackId: number,
    startDate: Date | string,
    endDate: Date | string,
    detailed: boolean = false
  ) {
    try {
      // Validate and convert date parameters
      const validatedStartDate = this.validateDate(startDate);
      const validatedEndDate = this.validateDate(endDate);
      
      if (!validatedStartDate || !validatedEndDate) {
        return { 
          error: 'Invalid date parameters', 
          message: 'Please provide valid startDate and endDate values'
        };
      }
      
      // Ensure endDate is not before startDate
      if (validatedStartDate > validatedEndDate) {
        return {
          error: 'Invalid date range',
          message: 'End date cannot be before start date'
        };
      }
      // Get track information
      const trackData = await db
        .select()
        .from(tracks)
        .where(eq(tracks.id, trackId))
        .then(results => results[0]);
      
      if (!trackData) {
        return { error: 'Track not found' };
      }
      
      // Get distribution records for the track
      const distributionData = await db
        .select({
          platformId: distributionRecords.platformId,
          platform: distributionPlatforms.name,
          // platformIcon: distributionPlatforms.icon, // Field does not exist
          // platformColor: distributionPlatforms.color, // Field does not exist
          status: distributionRecords.status,
          distributionDate: distributionRecords.distributedAt, // Use distributedAt
        })
        .from(distributionRecords)
        .innerJoin(
          distributionPlatforms,
          eq(distributionRecords.platformId, distributionPlatforms.id)
        )
        .innerJoin(
          releases,
          eq(distributionRecords.releaseId, releases.id)
        )
        .where(
          and(
            eq(releases.id, trackData.releaseId),
            // Only include distributed records
            eq(distributionRecords.status, 'distributed')
          )
        );
      
      // Get royalty data for the track across platforms
      const royaltyData = await db
        .select({
          platformId: distributionRecords.platformId,
          revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
          streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
        })
        .from(royaltyCalculations)
        .innerJoin(
          distributionRecords,
          eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
        )
        .innerJoin(
          releases,
          eq(distributionRecords.releaseId, releases.id)
        )
        .where(
          and(
            eq(royaltyCalculations.trackId, trackId),
            gte(royaltyCalculations.calculationDate, validatedStartDate),
            lte(royaltyCalculations.calculationDate, validatedEndDate)
          )
        )
        .groupBy(distributionRecords.platformId);
      
      // Get platform-specific details
      const platforms = await db
        .select()
        .from(distributionPlatforms);
      
      // Calculate total royalties and streams
      const totalRevenue = royaltyData.reduce((sum, item) => sum + item.revenue, 0);
      const totalStreams = royaltyData.reduce((sum, item) => sum + item.streams, 0);
      
      // Format platform data
      const platformRoyalties = royaltyData.map(data => {
        const platformInfo = platforms.find(p => p.id === data.platformId);
        const distributionInfo = distributionData.find(d => d.platformId === data.platformId);
        
        if (!platformInfo || !distributionInfo) {
          return null;
        }
        
        const platformRevenuePercentage = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
        const platformStreamPercentage = totalStreams > 0 ? (data.streams / totalStreams) * 100 : 0;
        const platformRatePerStream = data.streams > 0 ? data.revenue / data.streams : 0;
        
        return {
          platformId: platformInfo.id,
          name: platformInfo.name,
          // icon: platformInfo.icon, // Field does not exist
          color: this.getPlatformColor(platformInfo.name), // Use helper for color
          distributionDate: distributionInfo.distributionDate || null, // Use correct field (distributedAt)
          status: distributionInfo.status,
          metrics: {
            revenue: data.revenue,
            streams: data.streams,
            revenuePercentage: platformRevenuePercentage,
            streamPercentage: platformStreamPercentage,
            ratePerStream: platformRatePerStream
          }
        };
      }).filter(Boolean);
      
      // Create response with a more specific type to allow detailed property
      interface TrackRoyaltyResponse {
        track: {
          id: number;
          title: string;
          artistName: string; // Using consistent naming with our schema
          releaseId: number;
        };
        timeframe: {
          start: string;
          end: string;
        };
        summary: {
          totalRevenue: number;
          totalStreams: number;
          averageRatePerStream: number;
          platformCount: number;
        };
        platforms: Array<{
          platformId: number;
          name: string;
          // icon: string | null; // Removed as it doesn't exist in schema
          color: string;
          distributionDate: Date | null; // Allow null for distribution date
          status: string;
          metrics: {
            revenue: number;
            streams: number;
            revenuePercentage: number;
            streamPercentage: number;
            ratePerStream: number;
          };
        } | null>;
        detailed?: any; // Allow for detailed data
      }
      
      // Create response with the specific type
      const response: TrackRoyaltyResponse = {
        track: {
          id: trackData.id,
          title: trackData.title,
          artistName: trackData.artistName || trackData.artist, // Handle both naming conventions
          releaseId: trackData.releaseId
        },
        timeframe: {
          start: this.formatDateToISOString(startDate),
          end: this.formatDateToISOString(endDate)
        },
        summary: {
          totalRevenue,
          totalStreams,
          averageRatePerStream: totalStreams > 0 ? totalRevenue / totalStreams : 0,
          platformCount: platformRoyalties.length
        },
        platforms: platformRoyalties
      };
      
      // Add detailed breakdown if requested
      if (detailed) {
        // Ensure we're passing valid Date objects
        if (validatedStartDate && validatedEndDate) {
          const detailedData = await this.getDetailedTrackRoyalties(trackId, validatedStartDate, validatedEndDate);
          response.detailed = detailedData;
        }
      }
      
      return response;
    } catch (error) {
      console.error('Error getting track platform royalties:', error);
      return {
        error: 'Failed to retrieve track platform royalties',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get release-specific platform royalties
   * 
   * @param releaseId - The release ID to get royalties for
   * @param startDate - Start date for the royalty period
   * @param endDate - End date for the royalty period
   * @param includeTrackBreakdown - Whether to include track-level breakdowns
   * @returns Detailed platform royalty data for the release
   */
  static async getReleasePlatformRoyalties(
    releaseId: number,
    startDate: Date | string,
    endDate: Date | string,
    includeTrackBreakdown: boolean = false
  ) {
    try {
      // Validate and convert date parameters
      const validatedStartDate = this.validateDate(startDate);
      const validatedEndDate = this.validateDate(endDate);
      
      if (!validatedStartDate || !validatedEndDate) {
        return { 
          error: 'Invalid date parameters', 
          message: 'Please provide valid startDate and endDate values'
        };
      }
      
      // Ensure endDate is not before startDate
      if (validatedStartDate > validatedEndDate) {
        return {
          error: 'Invalid date range',
          message: 'End date cannot be before start date'
        };
      }
      // Get release information
      const releaseData = await db
        .select()
        .from(releases)
        .where(eq(releases.id, releaseId))
        .then(results => results[0]);
      
      if (!releaseData) {
        return { error: 'Release not found' };
      }
      
      // Get distribution records for the release
      const distributionData = await db
        .select({
          id: distributionRecords.id,
          platformId: distributionRecords.platformId,
          platform: distributionPlatforms.name,
          // platformIcon: distributionPlatforms.icon, // Field does not exist
          // platformColor: distributionPlatforms.color, // Field does not exist
          status: distributionRecords.status,
          distributionDate: distributionRecords.distributedAt, // Use distributedAt
        })
        .from(distributionRecords)
        .innerJoin(
          distributionPlatforms,
          eq(distributionRecords.platformId, distributionPlatforms.id)
        )
        .where(
          and(
            eq(distributionRecords.releaseId, releaseId),
            // Only include distributed records
            eq(distributionRecords.status, 'distributed')
          )
        );
      
      // Get royalty data for the release across platforms
      const royaltyData = await db
        .select({
          platformId: distributionRecords.platformId,
          revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
          streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
        })
        .from(royaltyCalculations)
        .innerJoin(
          distributionRecords,
          eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
        )
        .where(
          and(
            eq(distributionRecords.releaseId, releaseId),
            gte(royaltyCalculations.calculationDate, validatedStartDate),
            lte(royaltyCalculations.calculationDate, validatedEndDate)
          )
        )
        .groupBy(distributionRecords.platformId);
      
      // Calculate total royalties and streams
      const totalRevenue = royaltyData.reduce((sum, item) => sum + item.revenue, 0);
      const totalStreams = royaltyData.reduce((sum, item) => sum + item.streams, 0);
      
      // Format platform data
      const platformRoyalties = royaltyData.map(data => {
        const distributionInfo = distributionData.find(d => d.platformId === data.platformId);
        
        if (!distributionInfo) {
          return null;
        }
        
        const platformRevenuePercentage = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
        const platformStreamPercentage = totalStreams > 0 ? (data.streams / totalStreams) * 100 : 0;
        const platformRatePerStream = data.streams > 0 ? data.revenue / data.streams : 0;
        
        return {
          platformId: distributionInfo.platformId,
          name: distributionInfo.platform,
          // icon: distributionInfo.platformIcon, // Field does not exist
          color: this.getPlatformColor(distributionInfo.platform), // Use helper for color
          distributionDate: distributionInfo.distributionDate || null, // Use correct field (distributedAt)
          status: distributionInfo.status,
          metrics: {
            revenue: data.revenue,
            streams: data.streams,
            revenuePercentage: platformRevenuePercentage,
            streamPercentage: platformStreamPercentage,
            ratePerStream: platformRatePerStream
          }
        };
      }).filter(Boolean);
      
      // Define a type for release royalty response to ensure type safety
      interface ReleasePlatformRoyaltyResponse {
        release: {
          id: number;
          title: string;
          artistName: string; // Using consistent naming with our schema
          type: string;
          releaseDate: Date;
        };
        timeframe: {
          start: string;
          end: string;
        };
        summary: {
          totalRevenue: number;
          totalStreams: number;
          averageRatePerStream: number;
          platformCount: number;
        };
        platforms: Array<{
          platformId: number;
          name: string;
          // icon: string | null; // Field does not exist
          color: string;
          distributionDate: Date | null; // Allow null for distribution date
          status: string;
          metrics: {
            revenue: number;
            streams: number;
            revenuePercentage: number;
            streamPercentage: number;
            ratePerStream: number;
          };
        } | null>;
        tracks?: Array<any>; // Allow for track data
      }
      
      // Create response with explicit type
      const response: ReleasePlatformRoyaltyResponse = {
        release: {
          id: releaseData.id,
          title: releaseData.title,
          artistName: releaseData.artistName, // Using consistent naming
          type: releaseData.type,
          releaseDate: releaseData.releaseDate
        },
        timeframe: {
          start: this.formatDateToISOString(startDate),
          end: this.formatDateToISOString(endDate)
        },
        summary: {
          totalRevenue,
          totalStreams,
          averageRatePerStream: totalStreams > 0 ? totalRevenue / totalStreams : 0,
          platformCount: platformRoyalties.length
        },
        platforms: platformRoyalties
      };
      
      // Add track breakdown if requested
      if (includeTrackBreakdown) {
        // Get tracks in the release
        const releaseTracks = await db
          .select()
          .from(tracks)
          .where(eq(tracks.releaseId, releaseId));
        
        // Get track-level royalty data
        const trackRoyaltyPromises = releaseTracks.map(track =>
          this.getTrackPlatformRoyalties(track.id, startDate, endDate, false)
        );
        
        const trackRoyalties = await Promise.all(trackRoyaltyPromises);
        // Add tracks property to response object with type safety
        (response as any).tracks = trackRoyalties.map(data => {
          // Type guard to check for error response
          if ('error' in data) return null;
          
          // Safely access track data
          return {
            id: data.track?.id,
            title: data.track?.title,
            artistName: data.track?.artistName,
            totalRevenue: data.summary?.totalRevenue || 0,
            totalStreams: data.summary?.totalStreams || 0,
            platformBreakdown: data.platforms?.map((p: any) => ({
              platformId: p.platformId,
              name: p.name,
              revenue: p.metrics.revenue,
              streams: p.metrics.streams
            })) || []
          };
        }).filter(Boolean);
      }
      
      return response;
    } catch (error) {
      console.error('Error getting release platform royalties:', error);
      return {
        error: 'Failed to retrieve release platform royalties',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get user-specific platform royalties across all their content
   * 
   * @param userId - The user ID to get royalties for
   * @param startDate - Start date for the royalty period
   * @param endDate - End date for the royalty period
   * @param groupBy - How to group the results (default: platform)
   * @returns Comprehensive platform royalty data for all user content
   */
  static async getUserPlatformRoyalties(
    userId: number,
    startDate: Date,
    endDate: Date,
    groupBy: 'platform' | 'release' | 'track' = 'platform'
  ) {
    try {
      // Get basic user information
      const userData = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .then(results => results[0]);
      
      if (!userData) {
        return { error: 'User not found' };
      }
      
      // Different query based on grouping
      let royaltyData: any[] = [];
      
      if (groupBy === 'platform') {
        // Group by platform
        royaltyData = await db
          .select({
            platformId: distributionRecords.platformId,
            platform: distributionPlatforms.name,
            // platformIcon: distributionPlatforms.icon, // Field does not exist
            // platformColor: distributionPlatforms.color, // Field does not exist
            revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
            streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
          })
          .from(royaltyCalculations)
          .innerJoin(
            distributionRecords,
            eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
          )
          .innerJoin(
            distributionPlatforms,
            eq(distributionRecords.platformId, distributionPlatforms.id)
          )
          .innerJoin(
            releases,
            eq(distributionRecords.releaseId, releases.id)
          )
          .where(
            and(
              eq(releases.userId, userId),
              gte(royaltyCalculations.calculationDate, startDate),
              lte(royaltyCalculations.calculationDate, endDate)
            )
          )
          .groupBy(distributionRecords.platformId, distributionPlatforms.name); // Group only by existing fields
      } else if (groupBy === 'release') {
        // Group by release
        royaltyData = await db
          .select({
            releaseId: releases.id,
            releaseTitle: releases.title,
            releaseType: releases.type,
            artistName: releases.artistName,
            revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
            streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
          })
          .from(royaltyCalculations)
          .innerJoin(
            distributionRecords,
            eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
          )
          .innerJoin(
            releases,
            eq(distributionRecords.releaseId, releases.id)
          )
          .where(
            and(
              eq(releases.userId, userId),
              gte(royaltyCalculations.calculationDate, startDate),
              lte(royaltyCalculations.calculationDate, endDate)
            )
          )
          .groupBy(releases.id, releases.title, releases.type, releases.artistName);
      } else {
        // Group by track
        royaltyData = await db
          .select({
            trackId: tracks.id,
            trackTitle: tracks.title,
            artistName: tracks.artistName,
            releaseId: tracks.releaseId,
            revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
            streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
          })
          .from(royaltyCalculations)
          .innerJoin(
            tracks,
            eq(royaltyCalculations.trackId, tracks.id)
          )
          .innerJoin(
            releases,
            eq(tracks.releaseId, releases.id)
          )
          .where(
            and(
              eq(releases.userId, userId),
              gte(royaltyCalculations.calculationDate, startDate),
              lte(royaltyCalculations.calculationDate, endDate)
            )
          )
          .groupBy(tracks.id, tracks.title, tracks.artistName, tracks.releaseId);
      }
      
      // Calculate total royalties and streams
      const totalRevenue = royaltyData.reduce((sum, item) => sum + item.revenue, 0);
      const totalStreams = royaltyData.reduce((sum, item) => sum + item.streams, 0);
      
      // Format data based on grouping
      let formattedData: any[] = [];
      
      if (groupBy === 'platform') {
        formattedData = royaltyData.map(data => {
          const platformRevenuePercentage = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
          const platformStreamPercentage = totalStreams > 0 ? (data.streams / totalStreams) * 100 : 0;
          const platformRatePerStream = data.streams > 0 ? data.revenue / data.streams : 0;
          
          return {
            platformId: data.platformId,
            name: data.platform,
            // icon: data.platformIcon, // Field does not exist
            color: this.getPlatformColor(data.platform), // Use helper
            metrics: {
              revenue: data.revenue,
              streams: data.streams,
              revenuePercentage: platformRevenuePercentage,
              streamPercentage: platformStreamPercentage,
              ratePerStream: platformRatePerStream
            }
          };
        });
      } else if (groupBy === 'release') {
        formattedData = royaltyData.map(data => {
          const releaseRevenuePercentage = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
          const releaseStreamPercentage = totalStreams > 0 ? (data.streams / totalStreams) * 100 : 0;
          const releaseRatePerStream = data.streams > 0 ? data.revenue / data.streams : 0;
          
          return {
            releaseId: data.releaseId,
            title: data.releaseTitle,
            type: data.releaseType,
            artistName: data.artistName,
            metrics: {
              revenue: data.revenue,
              streams: data.streams,
              revenuePercentage: releaseRevenuePercentage,
              streamPercentage: releaseStreamPercentage,
              ratePerStream: releaseRatePerStream
            }
          };
        });
      } else {
        formattedData = royaltyData.map(data => {
          const trackRevenuePercentage = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
          const trackStreamPercentage = totalStreams > 0 ? (data.streams / totalStreams) * 100 : 0;
          const trackRatePerStream = data.streams > 0 ? data.revenue / data.streams : 0;
          
          return {
            trackId: data.trackId,
            title: data.trackTitle,
            artistName: data.artistName,
            releaseId: data.releaseId,
            metrics: {
              revenue: data.revenue,
              streams: data.streams,
              revenuePercentage: trackRevenuePercentage,
              streamPercentage: trackStreamPercentage,
              ratePerStream: trackRatePerStream
            }
          };
        });
      }
      
      // Create response
      return {
        user: {
          id: userData.id,
          name: userData.fullName || userData.username,
          entityName: userData.entityName
        },
        timeframe: {
          start: this.formatDateToISOString(startDate),
          end: this.formatDateToISOString(endDate)
        },
        summary: {
          totalRevenue,
          totalStreams,
          averageRatePerStream: totalStreams > 0 ? totalRevenue / totalStreams : 0,
          itemCount: formattedData.length
        },
        groupBy,
        data: formattedData
      };
    } catch (error) {
      console.error('Error getting user platform royalties:', error);
      return {
        error: 'Failed to retrieve user platform royalties',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Compare platform performance between two periods
   * 
   * @param userId - The user ID to compare data for
   * @param currentPeriodStart - Start date of current period
   * @param currentPeriodEnd - End date of current period
   * @param previousPeriodStart - Start date of previous period for comparison
   * @param previousPeriodEnd - End date of previous period for comparison
   * @returns Comparison data between the two periods
   */
  static async comparePlatformPerformance(
    userId: number,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    previousPeriodStart: Date,
    previousPeriodEnd: Date
  ) {
    try {
      // Get current period data
      const currentPeriodData = await db
        .select({
          platformId: distributionRecords.platformId,
          platform: distributionPlatforms.name,
          // platformIcon: distributionPlatforms.icon, // Field does not exist
          // platformColor: distributionPlatforms.color, // Field does not exist
          revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
          streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
        })
        .from(royaltyCalculations)
        .innerJoin(
          distributionRecords,
          eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
        )
        .innerJoin(
          distributionPlatforms,
          eq(distributionRecords.platformId, distributionPlatforms.id)
        )
        .innerJoin(
          releases,
          eq(distributionRecords.releaseId, releases.id)
        )
        .where(
          and(
            eq(releases.userId, userId),
            gte(royaltyCalculations.calculationDate, currentPeriodStart),
            lte(royaltyCalculations.calculationDate, currentPeriodEnd)
          )
        )
        .groupBy(distributionRecords.platformId, distributionPlatforms.name); // Group only by existing fields
      
      // Get previous period data
      const previousPeriodData = await db
        .select({
          platformId: distributionRecords.platformId,
          platform: distributionPlatforms.name,
          revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
          streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
        })
        .from(royaltyCalculations)
        .innerJoin(
          distributionRecords,
          eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
        )
        .innerJoin(
          distributionPlatforms,
          eq(distributionRecords.platformId, distributionPlatforms.id)
        )
        .innerJoin(
          releases,
          eq(distributionRecords.releaseId, releases.id)
        )
        .where(
          and(
            eq(releases.userId, userId),
            gte(royaltyCalculations.calculationDate, previousPeriodStart),
            lte(royaltyCalculations.calculationDate, previousPeriodEnd)
          )
        )
        .groupBy(distributionRecords.platformId, distributionPlatforms.name);
      
      // Calculate total royalties and streams for both periods
      const currentTotalRevenue = currentPeriodData.reduce((sum, item) => sum + item.revenue, 0);
      const currentTotalStreams = currentPeriodData.reduce((sum, item) => sum + item.streams, 0);
      const previousTotalRevenue = previousPeriodData.reduce((sum, item) => sum + item.revenue, 0);
      const previousTotalStreams = previousPeriodData.reduce((sum, item) => sum + item.streams, 0);
      
      // Calculate overall changes
      const revenueChange = previousTotalRevenue > 0 
        ? ((currentTotalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
        : currentTotalRevenue > 0 ? 100 : 0;
      
      const streamsChange = previousTotalStreams > 0 
        ? ((currentTotalStreams - previousTotalStreams) / previousTotalStreams) * 100 
        : currentTotalStreams > 0 ? 100 : 0;
      
      const currentRatePerStream = currentTotalStreams > 0 ? currentTotalRevenue / currentTotalStreams : 0;
      const previousRatePerStream = previousTotalStreams > 0 ? previousTotalRevenue / previousTotalStreams : 0;
      const ratePerStreamChange = previousRatePerStream > 0 
        ? ((currentRatePerStream - previousRatePerStream) / previousRatePerStream) * 100 
        : currentRatePerStream > 0 ? 100 : 0;
      
      // Format comparison data
      const platformComparisons = currentPeriodData.map(current => {
        const previous = previousPeriodData.find(p => p.platformId === current.platformId);
        
        const previousRevenue = previous ? previous.revenue : 0;
        const previousStreams = previous ? previous.streams : 0;
        
        const platformRevenueChange = previousRevenue > 0 
          ? ((current.revenue - previousRevenue) / previousRevenue) * 100 
          : current.revenue > 0 ? 100 : 0;
        
        const platformStreamsChange = previousStreams > 0 
          ? ((current.streams - previousStreams) / previousStreams) * 100 
          : current.streams > 0 ? 100 : 0;
        
        const currentPlatformRate = current.streams > 0 ? current.revenue / current.streams : 0;
        const previousPlatformRate = previousStreams > 0 ? previousRevenue / previousStreams : 0;
        const platformRateChange = previousPlatformRate > 0 
          ? ((currentPlatformRate - previousPlatformRate) / previousPlatformRate) * 100 
          : currentPlatformRate > 0 ? 100 : 0;
        
        // Current period market share
        const revenueShare = currentTotalRevenue > 0 ? (current.revenue / currentTotalRevenue) * 100 : 0;
        const streamShare = currentTotalStreams > 0 ? (current.streams / currentTotalStreams) * 100 : 0;
        
        // Previous period market share
        const previousRevenueShare = previousTotalRevenue > 0 && previous 
          ? (previous.revenue / previousTotalRevenue) * 100 
          : 0;
        
        const previousStreamShare = previousTotalStreams > 0 && previous 
          ? (previous.streams / previousTotalStreams) * 100 
          : 0;
        
        // Market share change
        const revenueShareChange = previousRevenueShare > 0 
          ? revenueShare - previousRevenueShare 
          : revenueShare;
        
        const streamShareChange = previousStreamShare > 0 
          ? streamShare - previousStreamShare 
          : streamShare;
        
        return {
          platformId: current.platformId,
          name: current.platform,
          // icon: current.platformIcon, // Field does not exist
          color: this.getPlatformColor(current.platform), // Use helper
          current: {
            revenue: current.revenue,
            streams: current.streams,
            ratePerStream: currentPlatformRate,
            revenueShare,
            streamShare
          },
          previous: {
            revenue: previousRevenue,
            streams: previousStreams,
            ratePerStream: previousPlatformRate,
            revenueShare: previousRevenueShare,
            streamShare: previousStreamShare
          },
          change: {
            revenue: platformRevenueChange,
            streams: platformStreamsChange,
            ratePerStream: platformRateChange,
            revenueShare: revenueShareChange,
            streamShare: streamShareChange
          }
        };
      });
      
      // Sort platforms by revenue change (highest first)
      platformComparisons.sort((a, b) => b.change.revenue - a.change.revenue);
      
      // Determine winners and losers
      const winners = platformComparisons
        .filter(p => p.change.revenue > 0)
        .slice(0, 3)
        .map(p => ({
          platformId: p.platformId,
          name: p.name,
          // icon: p.icon, // Field does not exist
          growth: p.change.revenue,
          revenue: p.current.revenue
        }));
      
      const losers = platformComparisons
        .filter(p => p.change.revenue < 0)
        .slice(0, 3)
        .map(p => ({
          platformId: p.platformId,
          name: p.name,
          // icon: p.icon, // Field does not exist
          decline: p.change.revenue,
          revenue: p.current.revenue
        }));
      
      // Create response
      return {
        timeframe: {
          current: {
            start: this.formatDateToISOString(currentPeriodStart),
            end: this.formatDateToISOString(currentPeriodEnd)
          },
          previous: {
            start: this.formatDateToISOString(previousPeriodStart),
            end: this.formatDateToISOString(previousPeriodEnd)
          }
        },
        summary: {
          current: {
            revenue: currentTotalRevenue,
            streams: currentTotalStreams,
            ratePerStream: currentRatePerStream
          },
          previous: {
            revenue: previousTotalRevenue,
            streams: previousTotalStreams,
            ratePerStream: previousRatePerStream
          },
          change: {
            revenue: revenueChange,
            streams: streamsChange,
            ratePerStream: ratePerStreamChange
          }
        },
        platforms: platformComparisons,
        insights: {
          winners,
          losers,
          totalPlatforms: platformComparisons.length,
          growingPlatforms: platformComparisons.filter(p => p.change.revenue > 0).length,
          decliningPlatforms: platformComparisons.filter(p => p.change.revenue < 0).length
        }
      };
    } catch (error) {
      console.error('Error comparing platform performance:', error);
      return {
        error: 'Failed to compare platform performance',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  


  /**
   * Get comprehensive platform royalty analytics
   * 
   * This method provides a centralized analytics dashboard for platform-specific
   * royalty data, including performance metrics, trends, and comparison data.
   * It serves as the primary endpoint for the analytics dashboard, aggregating
   * multiple data points into a single comprehensive view.
   * 
   * Key features:
   * - Platform-specific performance metrics (streams, revenue, rate)
   * - Time-based trend analysis with growth indicators
   * - Platform comparison showing relative performance
   * - Revenue forecasting based on current trends
   * - Geographic breakdown of platform earnings
   * 
   * When platformId is provided, this returns detailed analytics for a specific platform.
   * Otherwise, it returns aggregated analytics across all platforms for the user.
   * 
   * @param userId - The user ID to generate analytics for
   * @param timeframe - Time period for analysis ('day', 'week', 'month', 'quarter', 'year')
   * @param platformId - Optional platform ID to filter results for a specific platform
   * @returns Comprehensive platform royalty analytics dashboard data
   */
  static async getPlatformRoyaltyAnalytics(userId: number, timeframe: string, platformId?: number) {
    try {
      // Determine date range based on timeframe
      const { startDate, endDate } = this.getDateRangeFromTimeframe(timeframe);
      
      // Build query to fetch royalty data
      let query = db
        .select({
          platformId: distributionRecords.platformId,
          revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
          streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
        })
        .from(royaltyCalculations)
        .innerJoin(
          distributionRecords,
          eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
        )
        .innerJoin(
          releases,
          eq(distributionRecords.releaseId, releases.id)
        )
        .where(
          and(
            eq(releases.userId, userId),
            gte(royaltyCalculations.calculationDate, startDate),
            lte(royaltyCalculations.calculationDate, endDate)
          )
        )
        .groupBy(distributionRecords.platformId);
      
      // Add platform filter if specified in the initial WHERE clause
      // Since we can't add a where clause after groupBy, we need to recreate
      // the query or include it in the initial where condition
      const royaltyData = platformId !== undefined
        ? await db
            .select({
              platformId: distributionRecords.platformId,
              revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
              streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
            })
            .from(royaltyCalculations)
            .innerJoin(
              distributionRecords,
              eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
            )
            .innerJoin(
              releases,
              eq(distributionRecords.releaseId, releases.id)
            )
            .where(
              and(
                eq(releases.userId, userId),
                eq(distributionRecords.platformId, platformId),
                gte(royaltyCalculations.calculationDate, startDate),
                lte(royaltyCalculations.calculationDate, endDate)
              )
            )
            .groupBy(distributionRecords.platformId)
        : await query;
      
      // Get platform information
      const platforms = await db.select().from(distributionPlatforms);
      
      // Get previous period data for trend calculation
      const prevPeriod = this.getDateRangeFromTimeframe(timeframe, true);
      const previousRoyaltyData = await db
        .select({
          platformId: distributionRecords.platformId,
          revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
          streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
        })
        .from(royaltyCalculations)
        .innerJoin(
          distributionRecords,
          eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
        )
        .innerJoin(
          releases,
          eq(distributionRecords.releaseId, releases.id)
        )
        .where(
          and(
            eq(releases.userId, userId),
            gte(royaltyCalculations.calculationDate, prevPeriod.startDate),
            lte(royaltyCalculations.calculationDate, prevPeriod.endDate)
          )
        )
        .groupBy(distributionRecords.platformId);
      
      // Calculate totals and platform percentages
      const totalRevenue = royaltyData.reduce((sum, item) => sum + item.revenue, 0);
      const totalStreams = royaltyData.reduce((sum, item) => sum + item.streams, 0);
      
      // Previous period totals
      const prevTotalRevenue = previousRoyaltyData.reduce((sum, item) => sum + item.revenue, 0);
      const prevTotalStreams = previousRoyaltyData.reduce((sum, item) => sum + item.streams, 0);
      
      // Calculate trends
      const revenueChange = prevTotalRevenue > 0 
        ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 
        : 0;
      const streamChange = prevTotalStreams > 0 
        ? ((totalStreams - prevTotalStreams) / prevTotalStreams) * 100 
        : 0;
      
      // Find fastest growing platform
      let fastestGrowingPlatform = null;
      let maxGrowth = -Infinity;
      
      for (const platform of royaltyData) {
        const prevPlatformData = previousRoyaltyData.find(p => p.platformId === platform.platformId);
        
        if (prevPlatformData && prevPlatformData.revenue > 0) {
          const growth = ((platform.revenue - prevPlatformData.revenue) / prevPlatformData.revenue) * 100;
          
          if (growth > maxGrowth) {
            maxGrowth = growth;
            const platformInfo = platforms.find(p => p.id === platform.platformId);
            
            if (platformInfo) {
              fastestGrowingPlatform = {
                id: platformInfo.id,
                name: platformInfo.name,
                growth: growth,
                // icon: platformInfo.icon // Field does not exist
              };
            }
          }
        }
      }
      
      // Calculate average rate per stream
      const averageRatePerStream = totalStreams > 0 ? totalRevenue / totalStreams : 0;
      
      // Format platform data with names and percentages
      const platformData = royaltyData.map(data => {
        const platformInfo = platforms.find(p => p.id === data.platformId);
        
        if (!platformInfo) {
          return null;
        }
        
        const prevPlatformData = previousRoyaltyData.find(p => p.platformId === data.platformId);
        const platformRevenuePercentage = totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0;
        const platformStreamPercentage = totalStreams > 0 ? (data.streams / totalStreams) * 100 : 0;
        
        // Calculate platform-specific rate per stream
        const platformRatePerStream = data.streams > 0 ? data.revenue / data.streams : 0;
        
        // Calculate platform growth
        const platformRevenueGrowth = prevPlatformData && prevPlatformData.revenue > 0
          ? ((data.revenue - prevPlatformData.revenue) / prevPlatformData.revenue) * 100
          : 0;
          
        const platformStreamGrowth = prevPlatformData && prevPlatformData.streams > 0
          ? ((data.streams - prevPlatformData.streams) / prevPlatformData.streams) * 100
          : 0;
        
        return {
          id: platformInfo.id,
          name: platformInfo.name,
          revenue: data.revenue,
          streams: data.streams,
          revenuePercentage: platformRevenuePercentage,
          streamPercentage: platformStreamPercentage,
          ratePerStream: platformRatePerStream,
          color: this.getPlatformColor(platformInfo.name), // Use helper
          // icon: platformInfo.icon, // Field does not exist
          growth: {
            revenue: platformRevenueGrowth,
            streams: platformStreamGrowth
          }
        };
      }).filter(Boolean);
      
      // Calculate projected growth separately to avoid potential issues in JSON serialization
      const projectedGrowth = this.calculateProjectedGrowth(revenueChange, streamChange);
      
      // Handle potential null values for fastestGrowingPlatform
      const safeGrowingPlatform = fastestGrowingPlatform ? {
        id: fastestGrowingPlatform.id,
        name: fastestGrowingPlatform.name,
        growth: fastestGrowingPlatform.growth,
        // icon: fastestGrowingPlatform.icon || null // Field does not exist
      } : null;
      
      // Ensure all numeric values are safe for JSON serialization
      // Convert all values to ensure they're proper numbers and handle potential NaN/Infinity
      const safeRevenue = typeof totalRevenue === 'number' ? Number(totalRevenue.toFixed(4)) : Number(totalRevenue || 0);
      const safeStreams = typeof totalStreams === 'number' ? Number(totalStreams) : Number(totalStreams || 0);
      const safeAvgRate = typeof averageRatePerStream === 'number' ? Number(averageRatePerStream.toFixed(6)) : 0;
      const safeRevChange = typeof revenueChange === 'number' ? Number(revenueChange.toFixed(2)) : 0;
      const safeStreamChange = typeof streamChange === 'number' ? Number(streamChange.toFixed(2)) : 0;
      const safeProjGrowth = typeof projectedGrowth === 'number' ? Number(projectedGrowth.toFixed(2)) : 0;
      
      // Create the response object with explicitly formatted values
      // This ensures proper JSON serialization
      return {
        timeframe,
        dateRange: {
          start: this.formatDateToISOString(startDate),
          end: this.formatDateToISOString(endDate),
          previous: {
            start: this.formatDateToISOString(prevPeriod.startDate),
            end: this.formatDateToISOString(prevPeriod.endDate)
          }
        },
        totalRevenue: safeRevenue,
        totalStreams: safeStreams,
        averageRatePerStream: safeAvgRate,
        platforms: platformData,
        trends: {
          revenueChange: safeRevChange,
          streamChange: safeStreamChange,
          fastestGrowingPlatform: safeGrowingPlatform,
          projectedGrowth: safeProjGrowth
        }
      };
    } catch (error) {
      console.error('Error getting platform royalty analytics:', error);
      return {
        error: 'Failed to retrieve platform royalty analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  

  /**
   * Get comparative analysis of platform royalty performance
   * 
   * This method enables side-by-side comparison of multiple streaming platforms,
   * allowing artists and labels to identify which platforms generate the most value.
   * The comparison can focus on different metrics including revenue, streams, or
   * per-stream rates.
   * 
   * This comparison is essential for:
   * - Making strategic decisions on marketing platform focus
   * - Understanding the financial impact of different platforms
   * - Identifying platforms with growth potential or declining performance
   * - Optimizing promotional efforts based on platform value
   * 
   * @param userId - The user ID to get comparison data for
   * @param platformIds - Array of platform IDs to compare
   * @param metric - The metric to compare ('revenue', 'streams', or 'rate')
   * @param timeframe - Time range for comparison ('day', 'week', 'month', 'quarter', 'year')
   * @returns Structured comparison data with platform performance metrics
   */
  static async getPlatformRoyaltyComparison(
    userId: number, 
    platformIds: number[], 
    metric: string,
    timeframe: string
  ) {
    try {
      // Get date range based on timeframe
      const { startDate, endDate } = this.getDateRangeFromTimeframe(timeframe);
      
      // Get platform information
      const platforms = await db
        .select()
        .from(distributionPlatforms)
        .where(inArray(distributionPlatforms.id, platformIds));
      
      if (platforms.length === 0) {
        return { error: 'No matching platforms found' };
      }
      
      // Get royalty data for each platform
      const royaltyData = await db
        .select({
          platformId: distributionRecords.platformId,
          revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
          streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
        })
        .from(royaltyCalculations)
        .innerJoin(
          distributionRecords,
          eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
        )
        .innerJoin(
          releases,
          eq(distributionRecords.releaseId, releases.id)
        )
        .where(
          and(
            eq(releases.userId, userId),
            inArray(distributionRecords.platformId, platformIds),
            gte(royaltyCalculations.calculationDate, startDate),
            lte(royaltyCalculations.calculationDate, endDate)
          )
        )
        .groupBy(distributionRecords.platformId);
      
      // Get historical data for trend analysis
      const historicalData = await this.getHistoricalPlatformData(userId, platformIds, timeframe);
      
      // Prepare comparison data
      const comparisonData = platforms.map(platform => {
        const data = royaltyData.find(d => d.platformId === platform.id);
        const platformHistory = historicalData.filter(h => h.platformId === platform.id);
        
        const revenue = data?.revenue || 0;
        const streams = data?.streams || 0;
        const ratePerStream = streams > 0 ? revenue / streams : 0;
        
        // Determine trend direction based on metric
        let trendDirection: 'up' | 'down' | 'flat' = 'flat';
        let trendValue = 0;
        
        if (platformHistory.length >= 2) {
          const sortedHistory = [...platformHistory].sort(
            (a, b) => {
              // Dates are strings from the query result
              const dateA = new Date(a.date);
              const dateB = new Date(b.date);
              return dateA.getTime() - dateB.getTime();
            }
          );
          
          if (sortedHistory.length > 1) {
            const oldestPoint = sortedHistory[0];
            const newestPoint = sortedHistory[sortedHistory.length - 1];
            
            let oldValue = 0;
            let newValue = 0;
            
            switch (metric) {
              case 'revenue':
                oldValue = oldestPoint.revenue;
                newValue = newestPoint.revenue;
                break;
              case 'streams':
                oldValue = oldestPoint.streams;
                newValue = newestPoint.streams;
                break;
              case 'rate':
                oldValue = oldestPoint.streams > 0 ? oldestPoint.revenue / oldestPoint.streams : 0;
                newValue = newestPoint.streams > 0 ? newestPoint.revenue / newestPoint.streams : 0;
                break;
            }
            
            if (oldValue > 0) {
              trendValue = ((newValue - oldValue) / oldValue) * 100;
              trendDirection = trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'flat';
            }
          }
        }
        
        return {
          platformId: platform.id,
          name: platform.name,
          // icon: platform.icon, // Field does not exist
          color: this.getPlatformColor(platform.name), // Use helper
          metrics: {
            revenue,
            streams,
            ratePerStream
          },
          trend: {
            direction: trendDirection,
            value: trendValue
          },
          history: platformHistory.map(h => ({
            date: h.date,
            revenue: h.revenue,
            streams: h.streams,
            rate: h.streams > 0 ? h.revenue / h.streams : 0
          }))
        };
      });
      
      // Sort comparison data based on the selected metric
      let sortedData = [...comparisonData];
      
      switch (metric) {
        case 'revenue':
          sortedData.sort((a, b) => b.metrics.revenue - a.metrics.revenue);
          break;
        case 'streams':
          sortedData.sort((a, b) => b.metrics.streams - a.metrics.streams);
          break;
        case 'rate':
          sortedData.sort((a, b) => b.metrics.ratePerStream - a.metrics.ratePerStream);
          break;
      }
      
      return {
        metric,
        timeframe,
        dateRange: {
          start: this.formatDateToISOString(startDate),
          end: this.formatDateToISOString(endDate)
        },
        platforms: sortedData
      };
    } catch (error) {
      console.error('Error getting platform comparison:', error);
      return {
        error: 'Failed to retrieve platform comparison data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  

  /**
   * Get platform-specific royalty timeline data
   * 
   * This method generates a time-series analysis of platform performance over a specified period,
   * allowing for visualization of trends in streams, revenue, and payout rates. The timeline
   * can be customized with different time intervals (daily, weekly, monthly) and metrics.
   * 
   * This is particularly useful for:
   * - Identifying seasonal trends in platform performance
   * - Analyzing the impact of marketing campaigns on specific platforms
   * - Visualizing growth or decline in platform value over time
   * - Comparing rate changes across different time periods
   * 
   * @param userId - The user ID to get timeline data for
   * @param platformId - The platform ID to analyze
   * @param startDate - Start date for the timeline
   * @param endDate - End date for the timeline
   * @param interval - Time grouping interval ('day', 'week', 'month', 'quarter', 'year')
   * @param metrics - Array of metrics to include ('revenue', 'streams', 'rate')
   * @returns Detailed timeline data with specified metrics and totals
   */
  static async getPlatformRoyaltyTimeline(
    userId: number,
    platformId: number,
    startDate: Date,
    endDate: Date,
    interval: string,
    metrics: string[]
  ) {
    try {
      // Validate platform exists
      const platform = await db
        .select()
        .from(distributionPlatforms)
        .where(eq(distributionPlatforms.id, platformId))
        .then(results => results[0]);
      
      if (!platform) {
        return { error: 'Platform not found' };
      }
      
      // Get appropriate SQL date format for grouping by interval
      const dateFormat = this.getDateFormatForInterval(interval);
      
      // Get timeline data grouped by interval
      const timelineData = await db
        .select({
          datePeriod: sql`${dateFormat}`,
          revenue: sql<number>`SUM(${royaltyCalculations.amount})`,
          streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
        })
        .from(royaltyCalculations)
        .innerJoin(
          distributionRecords,
          eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
        )
        .innerJoin(
          releases,
          eq(distributionRecords.releaseId, releases.id)
        )
        .where(
          and(
            eq(releases.userId, userId),
            eq(distributionRecords.platformId, platformId),
            gte(royaltyCalculations.calculationDate, startDate),
            lte(royaltyCalculations.calculationDate, endDate)
          )
        )
        .groupBy(sql`${dateFormat}`)
        .orderBy(sql`${dateFormat}`);
      
      // Format timeline data into datapoints
      const dataPoints = timelineData.map(point => {
        // Safely parse date with type checking
        const date = typeof point.datePeriod === 'string' || point.datePeriod instanceof Date 
          ? new Date(point.datePeriod) 
          : new Date();
        const rate = point.streams > 0 ? point.revenue / point.streams : 0;
        
        // Only include requested metrics
        const dataPoint: any = { date };
        
        if (metrics.includes('revenue')) {
          dataPoint.revenue = point.revenue;
        }
        
        if (metrics.includes('streams')) {
          dataPoint.streams = point.streams;
        }
        
        if (metrics.includes('rate')) {
          dataPoint.rate = rate;
        }
        
        return dataPoint;
      });
      
      // Calculate totals
      const totalRevenue = timelineData.reduce((sum, point) => sum + point.revenue, 0);
      const totalStreams = timelineData.reduce((sum, point) => sum + point.streams, 0);
      const avgRatePerStream = totalStreams > 0 ? totalRevenue / totalStreams : 0;
      
      return {
        platformId,
        platformName: platform.name,
        // platformIcon: platform.icon, // Field does not exist
        platformColor: this.getPlatformColor(platform.name), // Use helper
        interval,
        dateRange: {
          start: this.formatDateToISOString(startDate),
          end: this.formatDateToISOString(endDate)
        },
        metrics: {
          included: metrics,
          totals: {
            revenue: totalRevenue,
            streams: totalStreams,
            averageRate: avgRatePerStream
          }
        },
        dataPoints
      };
    } catch (error) {
      console.error('Error getting platform timeline:', error);
      return {
        error: 'Failed to retrieve platform timeline data',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get historical platform data for trend analysis
   * 
   * @param userId - The user ID
   * @param platformIds - Array of platform IDs
   * @param timeframe - The timeframe for historical data
   * @returns Historical data for platforms
   */
  private static async getHistoricalPlatformData(
    userId: number, 
    platformIds: number[],
    timeframe: string
  ) {
    // Determine the appropriate interval based on timeframe
    let interval: string;
    let numberOfPoints: number;
    
    switch (timeframe) {
      case 'week':
        interval = 'day';
        numberOfPoints = 7;
        break;
      case 'month':
        interval = 'week';
        numberOfPoints = 4;
        break;
      case 'quarter':
        interval = 'week';
        numberOfPoints = 12;
        break;
      case 'year':
        interval = 'month';
        numberOfPoints = 12;
        break;
      default: // day
        interval = 'hour';
        numberOfPoints = 24;
        break;
    }
    
    // Get date range
    const { startDate, endDate } = this.getDateRangeFromTimeframe(timeframe);
    
    // Get date format for SQL
    const dateFormat = this.getDateFormatForInterval(interval);
    
    try {
      // Get historical data grouped by platform and interval
      const historicalData = await db
        .select({
          platformId: distributionRecords.platformId,
          datePeriod: sql<string>`${dateFormat}`.as('datePeriod'), // Cast datePeriod to string
          revenue: sql<number>`SUM(${royaltyCalculations.amount})`.mapWith(Number),
          streams: sql<number>`SUM(${royaltyCalculations.streamCount})`,
        })
        .from(royaltyCalculations)
        .innerJoin(
          distributionRecords,
          eq(royaltyCalculations.distributionRecordId, distributionRecords.id)
        )
        .innerJoin(
          releases,
          eq(distributionRecords.releaseId, releases.id)
        )
        .where(
          and(
            eq(releases.userId, userId),
            inArray(distributionRecords.platformId, platformIds),
            gte(royaltyCalculations.calculationDate, startDate),
            lte(royaltyCalculations.calculationDate, endDate)
          )
        )
        .groupBy(distributionRecords.platformId, sql`${dateFormat}`)
        .orderBy(distributionRecords.platformId, sql`${dateFormat}`);
      
      // Format historical data with safe number handling
      return historicalData.map(point => {
        // Ensure all numeric values are serializable and handle edge cases
        const revenue = Number.isFinite(point.revenue) ? Number(point.revenue.toFixed(4)) : 0;
        const streams = Number.isFinite(point.streams) ? Number(point.streams) : 0;
        
        return {
          platformId: point.platformId,
          date: point.datePeriod,
          revenue: revenue,
          streams: streams,
          // Add derived value with safety check
          ratePerStream: streams > 0 ? Number((revenue / streams).toFixed(6)) : 0
        };
      });
    } catch (error) {
      console.error('Error fetching historical platform data:', error);
      // Return empty array instead of throwing to prevent API failures
      return [];
    }
  }
  
  /**
   * Get the appropriate SQL date format for grouping by interval
   * 
   * @param interval - The interval to get date format for
   * @returns SQL fragment for date formatting
   */
  private static getDateFormatForInterval(interval: string) {
    switch (interval) {
      case 'hour':
        return sql`DATE_TRUNC('hour', ${royaltyCalculations.calculationDate})`;
      case 'day':
        return sql`DATE_TRUNC('day', ${royaltyCalculations.calculationDate})`;
      case 'week':
        return sql`DATE_TRUNC('week', ${royaltyCalculations.calculationDate})`;
      case 'month':
        return sql`DATE_TRUNC('month', ${royaltyCalculations.calculationDate})`;
      default:
        return sql`DATE_TRUNC('day', ${royaltyCalculations.calculationDate})`;
    }
  }
  
  /**
   * Get date range from timeframe string
   * 
   * @param timeframe - The timeframe string (day, week, month, quarter, year)
   * @param getPrevious - Whether to get the previous period
   * @returns Object with startDate and endDate
   */
  /**
   * Convert a timeframe string to a date range
   * 
   * This method takes a timeframe string (day, week, month, etc.) and returns
   * the corresponding date range. It also handles invalid inputs by defaulting
   * to a 30-day range.
   * 
   * @param timeframe - The timeframe string (day, week, month, quarter, year)
   * @param getPrevious - Whether to get the previous timeframe instead of current
   * @returns Object with startDate and endDate
   */
  private static getDateRangeFromTimeframe(timeframe: string, getPrevious: boolean = false): { startDate: Date, endDate: Date } {
    // Validate timeframe input
    const validTimeframes = ['day', 'week', 'month', 'quarter', 'year'];
    if (typeof timeframe !== 'string' || !validTimeframes.includes(timeframe.toLowerCase())) {
      console.warn(`Invalid timeframe: ${timeframe}. Defaulting to 30 days.`);
      timeframe = '30days';
    }
    
    timeframe = timeframe.toLowerCase();
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();
    
    // Set end date to end of current day
    endDate.setHours(23, 59, 59, 999);
    
    // Calculate start date based on timeframe
    switch (timeframe) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        if (getPrevious) {
          startDate.setDate(startDate.getDate() - 1);
          endDate.setDate(endDate.getDate() - 1);
        }
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - startDate.getDay());
        startDate.setHours(0, 0, 0, 0);
        if (getPrevious) {
          startDate.setDate(startDate.getDate() - 7);
          endDate.setDate(endDate.getDate() - 7);
        }
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        if (getPrevious) {
          startDate.setMonth(startDate.getMonth() - 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        }
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1, 0, 0, 0, 0);
        if (getPrevious) {
          startDate.setMonth(startDate.getMonth() - 3);
          endDate = new Date(
            quarter === 0 ? now.getFullYear() - 1 : now.getFullYear(),
            quarter === 0 ? 9 : (quarter - 1) * 3 + 2,
            0, 23, 59, 59, 999
          );
        }
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        if (getPrevious) {
          startDate.setFullYear(startDate.getFullYear() - 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        }
        break;
      default: // Default to 30 days
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        if (getPrevious) {
          startDate.setDate(startDate.getDate() - 30);
          endDate.setDate(endDate.getDate() - 30);
        }
    }
    
    return { startDate, endDate };
  }
  
  /**
   * Validate and convert a date input to a proper Date object
   * 
   * @param dateInput - The date input to validate (Date object or string)
   * @returns A valid Date object or null if invalid
   */
  private static validateDate(dateInput: Date | string | undefined): Date | null {
    if (!dateInput) {
      return null;
    }
    
    try {
      // If it's already a Date object
      if (dateInput instanceof Date) {
        // Check if it's a valid date (not NaN)
        return isNaN(dateInput.getTime()) ? null : dateInput;
      }
      
      // If it's a string, try to parse it
      if (typeof dateInput === 'string') {
        const parsedDate = new Date(dateInput);
        return isNaN(parsedDate.getTime()) ? null : parsedDate;
      }
      
      // For any other type, return null
    }
    catch (e) {
      return null;
    }
    
    return null;
  }
  
  /**
   * Safely convert a date to ISO string format
   * 
   * @param date - The date to convert (could be Date object or string)
   * @returns An ISO string representation of the date
   */
  private static formatDateToISOString(date: Date | string | null): string {
    if (!date) return '';
    
    if (date instanceof Date) {
      return date.toISOString();
    }
    
    // If it's already a string, try to parse it as a date
    try {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate.toISOString();
      }
    } catch (e) {
      // If parsing fails, return the original string
    }
    
    return String(date);
  }

  /**
   * Calculate projected growth based on current trends
   * 
   * @param revenueChange - Revenue change percentage
   * @param streamChange - Stream change percentage
   * @returns Projected growth percentage
   */
  private static calculateProjectedGrowth(revenueChange: number, streamChange: number): number {
    // Handle NaN, Infinity and extremely large values to prevent JSON parsing issues
    const safeRevenueChange = Number.isFinite(revenueChange) ? revenueChange : 0;
    const safeStreamChange = Number.isFinite(streamChange) ? streamChange : 0;
    
    // Limit extreme values that could cause issues
    const cappedRevenueChange = Math.max(Math.min(safeRevenueChange, 1000), -1000);
    const cappedStreamChange = Math.max(Math.min(safeStreamChange, 1000), -1000);
    
    // Simple projection model based on weighted average of revenue and stream growth
    // This could be enhanced with more sophisticated models in the future
    const weightedGrowth = (cappedRevenueChange * 0.7) + (cappedStreamChange * 0.3);
    
    // Apply a conservative adjustment factor
    const adjustmentFactor = 0.8;
    
    // Return rounded value to avoid floating point precision issues
    return Number((weightedGrowth * adjustmentFactor).toFixed(2));
  }


}