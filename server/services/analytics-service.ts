/**
 * Analytics Service
 * 
 * This service provides comprehensive analytics functionality for the TuneMantra platform.
 * It processes and analyzes streaming data, track performance, revenue metrics, and 
 * geographic distribution of listeners.
 * 
 * Key capabilities:
 * - Platform-specific data aggregation and comparison
 * - Time-series analysis with flexible date ranges
 * - Geographic audience segmentation
 * - Trend identification and forecasting
 * - Performance benchmarking against industry standards
 */

import { db } from '../db';
import { analytics, tracks, releases, dailyStats, InsertAnalytics, InsertDailyStats, DistributionPlatform, Track, Release } from '../../shared/schema'; // Added Track, Release, DistributionPlatform
import { eq, and, gte, lte, desc, asc, sql, count, sum, avg, inArray, isNotNull, SQL } from 'drizzle-orm'; // Added SQL type
import { PLATFORM_RATES } from '../../shared/constants';
import { subDays, subMonths, format, isAfter, isBefore, parseISO } from 'date-fns';

// Define types for clarity
type AnalyticsRecord = typeof analytics.$inferSelect;
type DailyStatsRecord = typeof dailyStats.$inferSelect;

export class AnalyticsService {
  /**
   * Retrieves analytics data for a specific track
   * @param trackId - The track ID to get analytics for
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @returns Analytics data for the track
   */
  static async getTrackAnalytics(
    trackId: number, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<AnalyticsRecord[]> { // Added return type
    const conditions: (SQL | undefined)[] = [eq(analytics.trackId, trackId)]; // Use explicit type
    
    if (startDate) {
      conditions.push(gte(analytics.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(analytics.date, endDate));
    }
    
    // Filter out undefined conditions before passing to and()
    const validConditions = conditions.filter(c => c !== undefined) as SQL[];

    return db.select()
      .from(analytics)
      .where(and(...validConditions)) // Apply all conditions at once
      .orderBy(desc(analytics.date));
  }

  /**
   * Retrieves analytics data for a specific release
   * @param releaseId - The release ID to get analytics for
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @returns Analytics data for the release
   */
  static async getReleaseAnalytics(
    releaseId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsRecord[]> { // Added return type
    // Get all tracks for this release
    const releaseTracks = await db.select({ id: tracks.id }).from(tracks) // Select only id
      .where(eq(tracks.releaseId, releaseId));
    
    const trackIds = releaseTracks.map(track => track.id);
    
    if (trackIds.length === 0) {
      return [];
    }
    
    // Build conditions array
    const conditions: (SQL | undefined)[] = [inArray(analytics.trackId, trackIds)]; // Use explicit type
    
    if (startDate) {
      conditions.push(gte(analytics.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(analytics.date, endDate));
    }

    // Filter out undefined conditions before passing to and()
    const validConditions = conditions.filter(c => c !== undefined) as SQL[];
    
    // Get analytics for all tracks in this release
    return db.select()
      .from(analytics)
      .where(and(...validConditions)) // Apply all conditions at once
      .orderBy(desc(analytics.date));
  }

  /**
   * Retrieves daily statistics for a user's content
   * @param userId - The user ID to get statistics for
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @returns Daily statistics for the user
   */
  static async getUserDailyStats(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<DailyStatsRecord[]> { // Added return type
    const conditions: (SQL | undefined)[] = [eq(dailyStats.userId, userId)]; // Use explicit type
    
    if (startDate) {
      conditions.push(gte(dailyStats.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(dailyStats.date, endDate));
    }

    // Filter out undefined conditions before passing to and()
    const validConditions = conditions.filter(c => c !== undefined) as SQL[];
    
    return db.select()
      .from(dailyStats)
      .where(and(...validConditions)) // Apply all conditions at once
      .orderBy(desc(dailyStats.date));
  }

  /**
   * Creates a new analytics record
   * @param data - The analytics data to insert
   * @returns The newly created analytics record
   */
  static async createAnalytics(data: InsertAnalytics): Promise<AnalyticsRecord> { // Added return type
    const result = await db.insert(analytics).values(data).returning();
    return result[0];
  }

  /**
   * Creates a new daily statistics record
   * @param data - The daily statistics data to insert
   * @returns The newly created daily statistics record
   */
  static async createDailyStats(data: InsertDailyStats): Promise<DailyStatsRecord> { // Added return type
    const result = await db.insert(dailyStats).values(data).returning();
    return result[0];
  }

  /**
   * Retrieves platform-specific analytics for a track
   * @param trackId - The track ID to get analytics for
   * @param platform - The platform to filter by (e.g., 'spotify', 'apple')
   * @returns Platform-specific analytics for the track
   */
  static async getTrackPlatformAnalytics(trackId: number, platform: string): Promise<AnalyticsRecord[]> { // Added return type
    return db.select().from(analytics)
      .where(and(
        eq(analytics.trackId, trackId),
        eq(analytics.platform, platform)
      ))
      .orderBy(desc(analytics.date));
  }

  /**
   * Generates summary analytics for a user's catalog
   * @param userId - The user ID to generate summary for
   * @returns Summary analytics data
   */
  static async generateUserCatalogSummary(userId: number) {
    // Get user's tracks
    const userTracks = await db.select({ id: tracks.id }).from(tracks) // Select only id
      .where(eq(tracks.userId, userId));
    
    const trackIds = userTracks.map(track => track.id);
    
    const emptySummary = {
      totalStreams: 0,
      totalRevenue: 0,
      topPlatforms: [],
      topTracks: [],
      revenueByPlatform: {},
      streamsByDay: {},
      geographicDistribution: {}
    };

    if (trackIds.length === 0) {
      return emptySummary;
    }
    
    // Get all analytics for these tracks
    const allAnalytics = await db.select().from(analytics)
      .where(inArray(analytics.trackId, trackIds));
      
    if (allAnalytics.length === 0) {
        return emptySummary;
    }
    
    // Calculate total streams and revenue
    // Ensure revenue and streams are treated as numbers
    const totalStreams = allAnalytics.reduce((sum, record) => sum + Number(record.streams || 0), 0);
    const totalRevenue = allAnalytics.reduce((sum, record) => sum + Number(record.revenue || 0), 0);
    
    // Calculate top platforms
    const platformsMap: Record<string, number> = {};
    const revenueByPlatform: Record<string, number> = {};
    
    for (const record of allAnalytics) {
      const streams = Number(record.streams || 0);
      const revenue = Number(record.revenue || 0);
      platformsMap[record.platform] = (platformsMap[record.platform] || 0) + streams;
      revenueByPlatform[record.platform] = (revenueByPlatform[record.platform] || 0) + revenue;
    }
    
    const topPlatforms = Object.entries(platformsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([platform, streams]) => ({ platform, streams }));
    
    // Calculate top tracks
    const trackStreamsMap: Record<number, number> = {};
    const trackRevenueMap: Record<number, number> = {};
    
    for (const record of allAnalytics) {
       const streams = Number(record.streams || 0);
       const revenue = Number(record.revenue || 0);
       // Ensure trackId is not null before using it as a key
       if (record.trackId !== null) { 
         trackStreamsMap[record.trackId] = (trackStreamsMap[record.trackId] || 0) + streams;
         trackRevenueMap[record.trackId] = (trackRevenueMap[record.trackId] || 0) + revenue;
       }
    }
    
    const trackIdsWithData = Object.keys(trackStreamsMap).map(Number);
    
    let tracksData: Track[] = []; // Use Track type
    if (trackIdsWithData.length > 0) {
        tracksData = await db.select().from(tracks)
          .where(inArray(tracks.id, trackIdsWithData));
    }
    
    const tracksMap: Record<number, Track> = {}; // Use Track type
    for (const track of tracksData) {
      tracksMap[track.id] = track;
    }
    
    const topTracks = Object.entries(trackStreamsMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([trackIdStr, streams]) => {
        const trackId = Number(trackIdStr);
        return {
          trackId: trackId,
          title: tracksMap[trackId]?.title || 'Unknown Track',
          streams,
          revenue: trackRevenueMap[trackId] || 0
        };
      });
    
    // Calculate streams by day
    const streamsByDay: Record<string, number> = {};
    for (const record of allAnalytics) {
      if (record.date) { // Ensure date is not null
        const dateStr = format(record.date, 'yyyy-MM-dd'); // Use format from date-fns
        streamsByDay[dateStr] = (streamsByDay[dateStr] || 0) + Number(record.streams || 0);
      }
    }
    
    // Calculate geographic distribution
    const geographicDistribution: Record<string, number> = {};
    for (const record of allAnalytics) {
      if (record.country) {
        geographicDistribution[record.country] = (geographicDistribution[record.country] || 0) + Number(record.streams || 0);
      }
    }
    
    return {
      totalStreams,
      totalRevenue,
      topPlatforms,
      topTracks,
      revenueByPlatform,
      streamsByDay,
      geographicDistribution
    };
  }

  /**
   * Refreshes analytics data from distribution platforms
   * @param userId - The user ID to refresh data for
   * @returns Status of the refresh operation
   */
  static async refreshAnalyticsFromPlatforms(userId: number) {
    // In a real implementation, this would connect to various platform APIs
    // to fetch the latest analytics data. For now, we'll just return a success status.
    console.warn(`Placeholder: Refreshing analytics for user ${userId}`);
    return { success: true, message: 'Analytics data refresh initiated' };
  }

  /**
   * Performs comparative analysis between platforms for a specific metric
   * @param userId - The user ID to analyze data for
   * @param metric - The metric to compare (streams, revenue, growth, engagement)
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @returns Comparative platform analysis for the specified metric
   */
  static async comparePlatformsByMetric(
    userId: number,
    metric: 'streams' | 'revenue' | 'growth' | 'engagement',
    startDate?: Date,
    endDate?: Date
  ) {
    // Get user's tracks
    const userTracks = await db.select({ id: tracks.id }).from(tracks) // Select only id
      .where(eq(tracks.userId, userId));
    
    const trackIds = userTracks.map(track => track.id);
    
    if (trackIds.length === 0) {
      return [];
    }
    
    // Build conditions for the main query
    const currentConditions: (SQL | undefined)[] = [inArray(analytics.trackId, trackIds)];
    if (startDate) {
      currentConditions.push(gte(analytics.date, startDate));
    }
    if (endDate) {
      currentConditions.push(lte(analytics.date, endDate));
    }
    const validCurrentConditions = currentConditions.filter(c => c !== undefined) as SQL[];

    // Base query for current period
    const baseQuery = db.select({
        platform: analytics.platform,
        // Ensure aggregation functions handle potential nulls or non-numeric types gracefully
        streams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number), 
        revenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number),
        likes: sql<number>`sum(CAST(${analytics.likes} AS numeric))`.mapWith(Number),
        comments: sql<number>`sum(CAST(${analytics.comments} AS numeric))`.mapWith(Number),
        shares: sql<number>`sum(CAST(${analytics.shares} AS numeric))`.mapWith(Number)
      })
      .from(analytics)
      .where(and(...validCurrentConditions))
      .groupBy(analytics.platform);

    const results = await baseQuery;

    // Calculate growth if requested (comparing to previous period)
    if (metric === 'growth' && startDate && endDate) {
      const periodLength = endDate.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodLength);
      const previousEndDate = new Date(endDate.getTime() - periodLength);
      
      // Build conditions for the previous period query
      const previousConditions: (SQL | undefined)[] = [
          inArray(analytics.trackId, trackIds),
          gte(analytics.date, previousStartDate),
          lte(analytics.date, previousEndDate)
      ];
      const validPreviousConditions = previousConditions.filter(c => c !== undefined) as SQL[];

      // Query for previous period data
      const previousResults = await db.select({
          platform: analytics.platform,
          streams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number),
          revenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number)
        })
        .from(analytics)
        .where(and(...validPreviousConditions))
        .groupBy(analytics.platform);
      
      // Map previous results by platform
      const previousByPlatform = new Map<string, { streams: number; revenue: number }>();
      for (const result of previousResults) {
        previousByPlatform.set(result.platform, { streams: result.streams || 0, revenue: result.revenue || 0 });
      }
      
      // Calculate growth rates
      return results.map(current => {
        const currentStreams = current.streams || 0;
        const currentRevenue = current.revenue || 0;
        const previous = previousByPlatform.get(current.platform);
        const previousStreams = previous?.streams || 0;
        const previousRevenue = previous?.revenue || 0;

        const streamsGrowth = previousStreams !== 0 
          ? (currentStreams - previousStreams) / previousStreams 
          : (currentStreams > 0 ? Infinity : 0); // Handle division by zero or growth from zero
        const revenueGrowth = previousRevenue !== 0 
          ? (currentRevenue - previousRevenue) / previousRevenue 
          : (currentRevenue > 0 ? Infinity : 0); // Handle division by zero or growth from zero
        
        return {
          platform: current.platform,
          streams: currentStreams,
          revenue: currentRevenue,
          // Return null for growth if previous value was 0 and current is 0, otherwise calculate
          streamsGrowth: streamsGrowth === Infinity ? null : streamsGrowth, 
          revenueGrowth: revenueGrowth === Infinity ? null : revenueGrowth
        };
      }).sort((a, b) => (b.streams ?? 0) - (a.streams ?? 0)); // Sort by streams descending
    }
    
    // Calculate engagement metrics if requested
    if (metric === 'engagement') {
      // Calculate engagement scores
      return results.map(data => {
        const streams = data.streams || 0;
        const likes = data.likes || 0;
        const comments = data.comments || 0;
        const shares = data.shares || 0;

        const engagementScore = streams > 0
          ? (likes + comments * 3 + shares * 5) / streams
          : 0;
        
        return {
          platform: data.platform,
          streams: streams,
          engagementScore,
          likeRate: streams > 0 ? likes / streams : 0,
          commentRate: streams > 0 ? comments / streams : 0,
          shareRate: streams > 0 ? shares / streams : 0
        };
      }).sort((a, b) => b.engagementScore - a.engagementScore); // Sort by engagement score descending
    }
    
    // Sort results based on the requested metric for streams or revenue
    if (metric === 'streams') {
      return results.sort((a, b) => (b.streams || 0) - (a.streams || 0));
    } else if (metric === 'revenue') {
      return results.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
    }
    
    // Default return (unsorted or based on DB default) if metric doesn't match specific sorting
    return results;
  }

  /**
   * Generates platform-specific analytics breakdown
   * @param userId - The user ID to generate analytics for
   * @param timeframe - Time period to analyze (week, month, quarter, year)
   * @returns Platform-specific analytics breakdown
   */
  static async getPlatformAnalyticsBreakdown(
    userId: number,
    timeframe: 'week' | 'month' | 'quarter' | 'year' = 'month'
  ) {
    // Get start date based on timeframe
    const endDate = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case 'week':
        startDate = subDays(endDate, 7);
        break;
      case 'month':
        startDate = subMonths(endDate, 1);
        break;
      case 'quarter':
        startDate = subMonths(endDate, 3);
        break;
      case 'year':
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = subMonths(endDate, 1);
    }
    
    // Get the user's tracks
    const userTracks = await db.select({ id: tracks.id }).from(tracks) // Select only id
      .where(eq(tracks.userId, userId));
    
    const trackIds = userTracks.map(track => track.id);
    
    const emptyBreakdown = {
        totalStreams: 0,
        totalRevenue: 0,
        platformBreakdown: [],
        timeSeriesData: {}
    };

    if (trackIds.length === 0) {
      return emptyBreakdown;
    }
    
    // Build conditions
    const conditions: (SQL | undefined)[] = [
        inArray(analytics.trackId, trackIds),
        gte(analytics.date, startDate),
        lte(analytics.date, endDate)
    ];
    const validConditions = conditions.filter(c => c !== undefined) as SQL[];

    // Get platform breakdown
    const platformData = await db.select({
      platform: analytics.platform,
      streams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number),
      revenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number),
      likes: sql<number>`sum(CAST(${analytics.likes} AS numeric))`.mapWith(Number),
      comments: sql<number>`sum(CAST(${analytics.comments} AS numeric))`.mapWith(Number),
      shares: sql<number>`sum(CAST(${analytics.shares} AS numeric))`.mapWith(Number)
    })
    .from(analytics)
    .where(and(...validConditions))
    .groupBy(analytics.platform);
    
    // Get time series data by platform
    const timeSeriesData: Record<string, Record<string, number>> = {};
    
    // Get daily data for the time period
    const dailyData = await db.select({
      platform: analytics.platform,
      date: analytics.date,
      streams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number),
      revenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number)
    })
    .from(analytics)
    .where(and(...validConditions))
    .groupBy(analytics.platform, analytics.date)
    .orderBy(asc(analytics.date));
    
    // Organize time series data by platform
    for (const record of dailyData) {
      if (record.date) { // Ensure date is not null
        const dateStr = format(record.date, 'yyyy-MM-dd');
        const platform = record.platform;
        
        if (!timeSeriesData[platform]) {
          timeSeriesData[platform] = {};
        }
        
        timeSeriesData[platform][dateStr] = record.streams || 0;
      }
    }
    
    // Calculate totals
    const totalStreams = platformData.reduce((sum, data) => sum + (data.streams || 0), 0);
    const totalRevenue = platformData.reduce((sum, data) => sum + (data.revenue || 0), 0);
    
    // Format the platform data with percentages
    const platformBreakdown = platformData.map(data => {
      const streamValue = data.streams || 0;
      const revenueValue = data.revenue || 0;
      const likesValue = data.likes || 0;
      const commentsValue = data.comments || 0;
      const sharesValue = data.shares || 0;

      return {
        platform: data.platform,
        streams: streamValue,
        revenue: revenueValue,
        streamPercentage: totalStreams > 0 ? streamValue / totalStreams : 0,
        revenuePercentage: totalRevenue > 0 ? revenueValue / totalRevenue : 0,
        revenuePerStream: streamValue > 0 ? revenueValue / streamValue : 0,
        engagementRate: streamValue > 0 
          ? (likesValue + commentsValue * 3 + sharesValue * 5) / streamValue 
          : 0
      };
    }).sort((a, b) => b.streams - a.streams);
    
    return {
      totalStreams,
      totalRevenue,
      platformBreakdown,
      timeSeriesData
    };
  }

  /**
   * Analyzes performance trends over different timeframes
   * @param userId - The user ID to analyze trends for
   * @param trackId - Optional track ID to focus analysis
   * @returns Trend analysis data
   */
  static async analyzePerformanceTrends(userId: number, trackId?: number) {
    const timeframes = [
      { label: 'Last 7 Days', days: 7 },
      { label: 'Last 30 Days', days: 30 },
      { label: 'Last 90 Days', days: 90 },
      { label: 'Last Year', days: 365 }
    ];
    
    const trendData: Record<string, { streams: number; revenue: number }> = {};
    
    // Base conditions
    const baseConditions: (SQL | undefined)[] = [];
    if (trackId) {
      baseConditions.push(eq(analytics.trackId, trackId));
    } else {
      // If no specific track, get all tracks for the user
      const userTracks = await db.select({ id: tracks.id }).from(tracks)
        .where(eq(tracks.userId, userId));
      const trackIds = userTracks.map(t => t.id);
      if (trackIds.length > 0) {
        baseConditions.push(inArray(analytics.trackId, trackIds));
      } else {
        // No tracks for user, return empty trends
        return timeframes.reduce((acc, tf) => {
          acc[tf.label] = { streams: 0, revenue: 0 };
          return acc;
        }, {} as Record<string, { streams: number; revenue: number }>);
      }
    }

    for (const tf of timeframes) {
      const endDate = new Date();
      const startDate = subDays(endDate, tf.days);
      
      const conditions = [
        ...baseConditions,
        gte(analytics.date, startDate),
        lte(analytics.date, endDate)
      ].filter(c => c !== undefined) as SQL[];

      const result = await db.select({
        streams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number),
        revenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number)
      })
      .from(analytics)
      .where(and(...conditions));
      
      trendData[tf.label] = {
        streams: result[0]?.streams || 0,
        revenue: result[0]?.revenue || 0
      };
    }
    
    return trendData;
  }

  /**
   * Compares performance of multiple tracks
   * @param userId - The user ID owning the tracks
   * @param trackIds - Array of track IDs to compare
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @returns Comparative performance data for the tracks
   */
  static async compareTrackPerformance(
    userId: number,
    trackIds: number[],
    startDate?: Date,
    endDate?: Date
  ) {
    if (trackIds.length === 0) {
      return [];
    }
    
    // Verify user owns these tracks (optional but recommended for security)
    const ownedTracks = await db.select({ id: tracks.id }).from(tracks)
      .where(and(
        eq(tracks.userId, userId),
        inArray(tracks.id, trackIds)
      ));
    const ownedTrackIds = ownedTracks.map(t => t.id);
    
    if (ownedTrackIds.length === 0) {
      // User doesn't own any of the requested tracks
      return []; 
    }

    // Build conditions
    const conditions: (SQL | undefined)[] = [
        inArray(analytics.trackId, ownedTrackIds) // Use only owned track IDs
    ];
    if (startDate) {
      conditions.push(gte(analytics.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(analytics.date, endDate));
    }
    const validConditions = conditions.filter(c => c !== undefined) as SQL[];

    // Fetch aggregated data per track
    const results = await db.select({
      trackId: analytics.trackId,
      streams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number),
      revenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number),
      likes: sql<number>`sum(CAST(${analytics.likes} AS numeric))`.mapWith(Number),
      comments: sql<number>`sum(CAST(${analytics.comments} AS numeric))`.mapWith(Number),
      shares: sql<number>`sum(CAST(${analytics.shares} AS numeric))`.mapWith(Number)
    })
    .from(analytics)
    .where(and(...validConditions))
    .groupBy(analytics.trackId); // Group by trackId

    // Fetch track details to add titles
    const trackDetails = await db.select({ id: tracks.id, title: tracks.title }).from(tracks)
      .where(inArray(tracks.id, ownedTrackIds)); // Fetch details only for owned tracks
      
    const trackTitleMap = new Map<number, string>();
    trackDetails.forEach(t => trackTitleMap.set(t.id, t.title));

    // Combine results with track titles and calculate rates
    return results.map(result => {
      const trackId = result.trackId; // trackId should not be null due to groupBy
      const streams = result.streams || 0;
      const revenue = result.revenue || 0;
      const likes = result.likes || 0;
      const comments = result.comments || 0;
      const shares = result.shares || 0;

      return {
        trackId: trackId,
        title: trackTitleMap.get(trackId) || 'Unknown Track',
        streams: streams,
        revenue: revenue,
        revenuePerStream: streams > 0 ? revenue / streams : 0,
        likeRate: streams > 0 ? likes / streams : 0,
        commentRate: streams > 0 ? comments / streams : 0,
        shareRate: streams > 0 ? shares / streams : 0,
        engagementScore: streams > 0 ? (likes + comments * 3 + shares * 5) / streams : 0
      };
    }).sort((a, b) => {
      // Sort by streams descending as a default comparison metric
      return b.streams - a.streams;
    });
  }

  /**
   * Generates an advanced analytics dashboard for a user
   * @param userId - The user ID to generate the dashboard for
   * @returns Advanced analytics dashboard data
   */
  static async generateAdvancedAnalyticsDashboard(userId: number) {
    // --- 1. Fetch User's Tracks ---
    const userTracks = await db.select({ id: tracks.id, title: tracks.title }).from(tracks)
      .where(eq(tracks.userId, userId));
    const trackIds = userTracks.map(t => t.id);
    const trackTitleMap = new Map(userTracks.map(t => [t.id, t.title]));

    const emptyDashboard = {
        overallSummary: { totalStreams: 0, totalRevenue: 0, avgRevenuePerStream: 0, trackCount: 0 },
        platformPerformance: [],
        topPerformingTracks: [],
        geographicDistribution: [],
        timeSeriesTrends: { streams: {}, revenue: {} },
        demographicInsights: { age: {}, gender: {} } // Placeholder
    };

    if (trackIds.length === 0) {
      return emptyDashboard;
    }

    // --- 2. Define Time Range (e.g., Last 90 Days) ---
    const endDate = new Date();
    const startDate = subDays(endDate, 90);

    // --- 3. Build Base Conditions ---
    const baseConditions: SQL[] = [
      inArray(analytics.trackId, trackIds),
      gte(analytics.date, startDate),
      lte(analytics.date, endDate)
    ];

    // --- 4. Overall Summary ---
    const overallStats = await db.select({
      totalStreams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number),
      totalRevenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number)
    })
    .from(analytics)
    .where(and(...baseConditions));

    const totalStreams = overallStats[0]?.totalStreams || 0;
    const totalRevenue = overallStats[0]?.totalRevenue || 0;
    const avgRevenuePerStream = totalStreams > 0 ? totalRevenue / totalStreams : 0;

    // --- 5. Platform Performance ---
    const platformData = await db.select({
      platform: analytics.platform,
      streams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number),
      revenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number)
    })
    .from(analytics)
    .where(and(...baseConditions))
    .groupBy(analytics.platform)
    .orderBy(desc(sql`sum(CAST(${analytics.streams} AS numeric))`)); // Order by streams

    const processedPlatformData = platformData.map(platform => ({
      platform: platform.platform,
      streams: platform.streams || 0,
      revenue: platform.revenue || 0,
      streamPercentage: totalStreams > 0 ? (platform.streams || 0) / totalStreams : 0,
      revenuePercentage: totalRevenue > 0 ? (platform.revenue || 0) / totalRevenue : 0,
      revenuePerStream: (platform.streams || 0) > 0 ? (platform.revenue || 0) / (platform.streams || 1) : 0 // Avoid division by zero
    }));

    // --- 6. Top Performing Tracks ---
    const topTracksData = await db.select({
      trackId: analytics.trackId,
      streams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number),
      revenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number)
    })
    .from(analytics)
    .where(and(...baseConditions))
    .groupBy(analytics.trackId)
    .orderBy(desc(sql`sum(CAST(${analytics.streams} AS numeric))`)) // Order by streams
    .limit(10);

    const topTracks = topTracksData.map(data => {
        const trackId = data.trackId; // Should not be null due to groupBy
        return {
            trackId: trackId,
            title: trackTitleMap.get(trackId) || 'Unknown Track',
            streams: data.streams || 0,
            revenue: data.revenue || 0,
            revenuePerStream: (data.streams || 0) > 0 ? (data.revenue || 0) / (data.streams || 1) : 0
        };
    });


    // --- 7. Geographic Distribution ---
    const geographicData = await db.select({
      country: analytics.country,
      streams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number),
      revenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number)
    })
    .from(analytics)
    .where(and(...baseConditions, isNotNull(analytics.country))) // Ensure country is not null
    .groupBy(analytics.country)
    .orderBy(desc(sql`sum(CAST(${analytics.streams} AS numeric))`)) // Order by streams
    .limit(20); // Limit to top 20 countries

    const processedGeographicData = geographicData.map(geoData => ({
      country: geoData.country, // Country should be string due to isNotNull filter
      streams: geoData.streams || 0,
      revenue: geoData.revenue || 0,
      streamPercentage: totalStreams > 0 ? (geoData.streams || 0) / totalStreams : 0
    }));

    // --- 8. Time Series Trends (Daily) ---
    const dailyData = await db.select({
      date: sql<string>`DATE(${analytics.date})`.mapWith(String), // Group by date part only
      streams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number),
      revenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number)
    })
    .from(analytics)
    .where(and(...baseConditions))
    .groupBy(sql`DATE(${analytics.date})`)
    .orderBy(asc(sql`DATE(${analytics.date})`));

    const timeSeriesStreams: Record<string, number> = {};
    const timeSeriesRevenue: Record<string, number> = {};
    dailyData.forEach(day => {
      if (day.date) { // Ensure date string is present
        timeSeriesStreams[day.date] = day.streams || 0;
        timeSeriesRevenue[day.date] = day.revenue || 0;
      }
    });

    // --- 9. Demographic Insights (Placeholder - Requires demographics data in schema) ---
    // This part needs the 'analytics' table to have demographic columns (age, gender)
    // Example structure (assuming demographics JSON column):
    /*
    const demographicData = await db.select({
        // Extract age groups and genders from JSON
    }).from(analytics).where(and(...baseConditions));
    // Process demographicData to aggregate counts...
    */
    const demographicInsights = {
      age: { /* aggregated age data */ },
      gender: { /* aggregated gender data */ }
    };
    console.warn("Demographic insights are placeholders and require schema updates.");


    // --- 10. Assemble Dashboard Data ---
    return {
      overallSummary: {
        totalStreams,
        totalRevenue,
        avgRevenuePerStream,
        trackCount: trackIds.length
      },
      platformPerformance: processedPlatformData,
      topPerformingTracks: topTracks,
      geographicDistribution: processedGeographicData,
      timeSeriesTrends: {
        streams: timeSeriesStreams,
        revenue: timeSeriesRevenue
      },
      demographicInsights // Placeholder
    };
  }


  /**
   * Retrieves geographic analytics for a user or specific track/release
   * @param userId - The user ID
   * @param options - Optional filters (trackId, releaseId, startDate, endDate)
   * @returns Geographic analytics data (streams/revenue per country)
   */
  static async getGeographicAnalytics(
    userId: number,
    options: {
      trackId?: number;
      releaseId?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const { trackId, releaseId, startDate, endDate } = options;

    // Determine relevant track IDs
    let relevantTrackIds: number[] = [];
    if (trackId) {
      // Verify user owns this track
      const track = await db.select({ id: tracks.id }).from(tracks)
        .where(and(eq(tracks.id, trackId), eq(tracks.userId, userId))).limit(1);
      if (track.length > 0) {
        relevantTrackIds = [trackId];
      }
    } else if (releaseId) {
      // Get tracks for this release owned by the user
      const releaseTracks = await db.select({ id: tracks.id }).from(tracks)
        .innerJoin(releases, eq(tracks.releaseId, releases.id))
        .where(and(eq(releases.id, releaseId), eq(releases.userId, userId)));
      relevantTrackIds = releaseTracks.map(t => t.id);
    } else {
      // Get all tracks for the user
      const userTracks = await db.select({ id: tracks.id }).from(tracks)
        .where(eq(tracks.userId, userId));
      relevantTrackIds = userTracks.map(t => t.id);
    }

    if (relevantTrackIds.length === 0) {
      return { totalStreams: 0, totalRevenue: 0, countries: [] };
    }

    // Build conditions
    const conditions: (SQL | undefined)[] = [
      inArray(analytics.trackId, relevantTrackIds),
      isNotNull(analytics.country) // Only include records with country data
    ];
    if (startDate) {
      conditions.push(gte(analytics.date, startDate));
    }
    if (endDate) {
      conditions.push(lte(analytics.date, endDate));
    }
    const validConditions = conditions.filter(c => c !== undefined) as SQL[];

    // Fetch aggregated data per country
    const geographicData = await db.select({
      country: analytics.country,
      streams: sql<number>`sum(CAST(${analytics.streams} AS numeric))`.mapWith(Number),
      revenue: sql<number>`sum(CAST(${analytics.revenue} AS numeric))`.mapWith(Number)
    })
    .from(analytics)
    .where(and(...validConditions))
    .groupBy(analytics.country)
    .orderBy(desc(sql`sum(CAST(${analytics.streams} AS numeric))`)); // Order by streams

    const totalStreams = geographicData.reduce((sum, item) => sum + (item.streams || 0), 0);
    const totalRevenue = geographicData.reduce((sum, item) => sum + (item.revenue || 0), 0);

    const countries = geographicData.map(item => ({
      country: item.country, // Country should be string due to isNotNull filter
      streams: item.streams || 0,
      revenue: item.revenue || 0,
      streamPercentage: totalStreams > 0 ? (item.streams || 0) / totalStreams : 0
    }));

    return {
      totalStreams,
      totalRevenue,
      countries
    };
  }
}