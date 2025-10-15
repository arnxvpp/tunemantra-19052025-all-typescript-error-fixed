/**
 * Distribution Analytics Service
 * 
 * This service provides comprehensive analytics for music distribution across
 * various platforms, tracking distribution success rates, platform-specific
 * performance, error patterns, and geographic coverage.
 * 
 * It allows labels and artists to optimize their distribution strategy
 * based on data-driven insights from past distribution performance.
 */

import { db } from '../db';
import { 
  eq, and, gte, lte, sql, inArray, count, sum, avg, not, isNull, desc, SQL
} from 'drizzle-orm';

import { 
  releases,
  tracks,
  distributionRecords,
  distributionPlatforms,
  analytics
} from '../../shared/schema';

/**
 * Distribution Analytics Service
 * 
 * Core features:
 * - Comprehensive distribution success/failure analysis
 * - Platform-specific performance tracking
 * - Geographic distribution coverage mapping
 * - Error pattern analysis and resolution recommendations
 * - Timeline visualization of distribution events
 */
export class DistributionAnalyticsService {
  /**
   * Generate comprehensive distribution analytics
   * 
   * This method analyzes the distribution data for a release, providing
   * insights into platform performance, processing times, errors,
   * and distribution coverage.
   * 
   * @param releaseId - The release ID to generate analytics for
   * @returns Comprehensive distribution analytics data
   */
  static async generateDistributionAnalytics(releaseId: number): Promise<{
    status: string;
    summary: {
      totalPlatforms: number;
      successfulDistributions: number;
      failedDistributions: number;
      pendingDistributions: number;
      totalStreams?: number;
      totalRevenue?: number;
      averageProcessingTime: number;
    };
    platformBreakdown: Array<{
      platformId: number;
      platformName: string;
      status: string;
      distributionDate?: Date;
      processingTime?: number;
      errorRate?: number;
      takedownRate?: number;
      reDistributionCount?: number;
      streamCount?: number;
      revenue?: number;
    }>;
    errorAnalysis: {
      commonErrors: Array<{
        errorType: string;
        count: number;
        affectedPlatforms: string[];
        resolution?: string;
      }>;
      errorTrend: Array<{
        date: string;
        count: number;
      }>;
    };
    geographicCoverage: Record<string, {
      platforms: string[];
      status: string;
      restrictions?: string[];
    }>;
    timeline: Array<{
      date: string;
      event: string;
      platformId?: number;
      platformName?: string;
      details?: any;
    }>;
    recommendations: string[];
  }> {
    try {
      // Get the release details, distribution records, platforms, and analytics in parallel
      const [release, distributionData, platforms, analyticsData] = await Promise.all([
        db.query.releases.findFirst({ where: eq(releases.id, releaseId) }),
        db.query.distributionRecords.findMany({ where: eq(distributionRecords.releaseId, releaseId) }),
        db.query.distributionPlatforms.findMany(),
        db.query.analytics.findMany({ where: eq(analytics.releaseId, releaseId) })
      ]);
      
      if (!release) {
        throw new Error(`Release with ID ${releaseId} not found`);
      }
      
      // Calculate summary statistics
      const successfulDistributions = distributionData.filter(
        record => record.status === 'distributed'
      ).length;
      
      const failedDistributions = distributionData.filter(
        record => record.status === 'failed'
      ).length;
      
      const pendingDistributions = distributionData.filter(
        record => record.status === 'pending' || record.status === 'processing' // Check both statuses
      ).length;
      
      // Calculate processing times (assuming distributedAt marks completion)
      const processingTimes = distributionData
        .filter(record => record.distributedAt && record.createdAt) // Use distributedAt and createdAt
        .map(record => {
          const completed = new Date(record.distributedAt!);
          const started = new Date(record.createdAt!); // Use createdAt as start time
          return (completed.getTime() - started.getTime()) / (1000 * 60); // in minutes
        });
      
      const averageProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;
      
      // Calculate total streams and revenue
      const totalStreams = analyticsData.reduce(
        (sum, data) => sum + data.streams, 
        0
      );
      
      const totalRevenue = analyticsData.reduce(
        (sum, data) => sum + Number(data.revenue), // Convert revenue to number
        0
      );
      
      // Generate platform breakdown
      const platformMap = new Map(platforms.map(p => [p.id, p]));
      
      const platformBreakdown = distributionData.map(record => {
        const platform = platformMap.get(record.platformId);
        const platformAnalytics = analyticsData.filter(
          // Compare platformId with analytics.platform (assuming it holds ID as text)
          a => a.platform === String(record.platformId) 
        );
        
        const streamCount = platformAnalytics.reduce(
          (sum, data) => sum + (data.streams || 0), // Handle potential null streams
          0
        );
        
        const revenue = platformAnalytics.reduce(
          (sum, data) => sum + (Number(data.revenue) || 0), // Convert revenue to number
          0
        );
        
        // Use distributedAt for distributionDate and createdAt for start time
        const distributionDate = record.distributedAt;
        const processingTime = distributionDate && record.createdAt
            ? (new Date(distributionDate).getTime() - new Date(record.createdAt).getTime()) / (1000 * 60)
            : undefined;

        // Placeholder for error/takedown/retry counts as they don't exist on the schema
        const errorRate = 0; // Placeholder
        const takedownRate = 0; // Placeholder
        const reDistributionCount = 0; // Placeholder

        return {
          platformId: record.platformId,
          platformName: platform ? platform.name : `Platform ${record.platformId}`,
          status: record.status,
          distributionDate: distributionDate || undefined, // Use || undefined for clarity
          processingTime,
          errorRate, 
          takedownRate, 
          reDistributionCount, 
          streamCount,
          revenue
        };
      });
      
      // Generate error analysis
      const errorTypes = new Map();
      
      distributionData.forEach(record => {
        // Use errorDetails field which is text, not an array of errors
        if (record.status === 'failed' && record.errorDetails) { 
          const errorType = record.errorDetails.split(':')[0] || 'Unknown error'; // Simple parsing
          const errorData = errorTypes.get(errorType) || {
            count: 0,
            platforms: new Set<string>() // Explicitly type Set
          };
          
          errorData.count += 1;
          errorData.platforms.add(
            platformMap.get(record.platformId)?.name || `Platform ${record.platformId}`
          );
          
          errorTypes.set(errorType, errorData);
        }
      });
      
      const commonErrors: Array<{ errorType: string; count: number; affectedPlatforms: string[]; resolution?: string }> =
        Array.from(errorTypes.entries()).map(([errorType, data]: [string, { count: number; platforms: Set<string> }]) => ({ 
          errorType,
          count: data.count,
          affectedPlatforms: Array.from(data.platforms), 
          resolution: this.getErrorResolution(errorType)
      })).sort((a, b) => b.count - a.count); // Ensure correct type is returned
      
      // Generate error trend (by month)
      const errorsByMonth = new Map();
      
      distributionData.forEach(record => {
         // Use errorDetails and updatedAt for error trend
        if (record.status === 'failed' && record.errorDetails) {
            const errorDate = new Date(record.updatedAt); // Use updatedAt as error timestamp
            const monthKey = `${errorDate.getFullYear()}-${String(errorDate.getMonth() + 1).padStart(2, '0')}`;
            const monthCount = errorsByMonth.get(monthKey) || 0;
            errorsByMonth.set(monthKey, monthCount + 1);
        }
      });
      
      const errorTrend = Array.from(errorsByMonth.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
      
      // Generate geographic coverage
      const geographicCoverage: Record<string, { platforms: string[]; status: string; restrictions?: string[] }> = {}; // Add type annotation
      
      // Geographic coverage needs adjustment as 'territories' and 'restrictions' don't exist
      // Placeholder logic - assumes global distribution unless failed
      platforms.forEach(platform => {
          const record = distributionData.find(r => r.platformId === platform.id);
          const status = record ? (record.status === 'distributed' ? 'available' : record.status) : 'not_distributed';
          // Initialize 'global' coverage if it doesn't exist
          if (!geographicCoverage['global']) { 
              geographicCoverage['global'] = { platforms: [], status: 'pending', restrictions: [] };
          }
          if (status === 'available') {
              geographicCoverage['global'].platforms.push(platform.name);
              geographicCoverage['global'].status = 'available'; // Mark global as available if at least one platform succeeded
          } else if (status === 'failed' && geographicCoverage['global'].status === 'pending') {
              geographicCoverage['global'].status = 'partially_failed'; // Indicate some failures
          }
          // Add platform name even if failed/pending for visibility
          if (record && !geographicCoverage['global'].platforms.includes(platform.name)) {
             geographicCoverage['global'].platforms.push(`${platform.name} (${status})`);
          }
      });
      
      // Generate timeline
      const timeline: Array<{ date: string; event: string; platformId?: number; platformName?: string; details?: any }> = []; // Add type annotation
      
      distributionData.forEach(record => {
        const platform = platformMap.get(record.platformId);
        const platformName = platform ? platform.name : `Platform ${record.platformId}`;
        
        // Add creation event (using createdAt)
        timeline.push({
          date: record.createdAt.toISOString(),
          event: 'distribution_requested', // More accurate term
          platformId: record.platformId,
          platformName,
          details: { status: 'pending' }
        });
        
        // Add completion/failure event (using distributedAt or updatedAt)
        const completionDate = record.distributedAt || record.updatedAt;
        if (completionDate) {
           timeline.push({
             date: new Date(completionDate).toISOString(),
             event: record.status === 'distributed' 
               ? 'distribution_completed' 
               : 'distribution_failed',
             platformId: record.platformId,
             platformName,
             details: {
               status: record.status,
               duration: record.createdAt // Calculate duration based on createdAt
                 ? (new Date(completionDate).getTime() - new Date(record.createdAt).getTime()) / (1000 * 60)
                 : undefined,
               error: record.errorDetails // Use errorDetails
             }
           });
        }
        // Note: retryHistory, startedAt, completedAt, errors, method, restrictions, territories don't exist on schema
      });
      
      // Sort timeline by date
      timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Generate recommendations
      const recommendations = [];
      
      // Recommendation for platforms with high error rates
      const platformsWithHighErrorRate = platformBreakdown
        .filter(p => (p.errorRate || 0) > 0.3)
        .map(p => p.platformName);
      
      if (platformsWithHighErrorRate.length > 0) {
        recommendations.push(
          `Consider reviewing distribution settings for ${platformsWithHighErrorRate.join(', ')} due to high error rates.`
        );
      }
      
      // Recommendation for missing key platforms
      const distributedPlatformIds = new Set(distributionData.map((r: typeof distributionRecords.$inferSelect) => r.platformId)); // Use distributionData and add type for r
      const missingKeyPlatforms = platforms
        // .filter(p => p.tier === 'premium' && !distributedPlatformIds.has(p.id)) // 'tier' property doesn't exist
        .filter(p => !distributedPlatformIds.has(p.id)) // Filter based on ID only for now
        .map(p => p.name);
      
      if (missingKeyPlatforms.length > 0) {
        recommendations.push(
          `Consider distributing to key platforms you're missing: ${missingKeyPlatforms.join(', ')}.`
        );
      }
      
      // Recommendation for regional expansion
      const coveredTerritories = Object.keys(geographicCoverage);
      const majorTerritories = ['US', 'UK', 'EU', 'JP', 'global'];
      const missingTerritories = majorTerritories.filter(
        t => !coveredTerritories.includes(t) && t !== 'global'
      );
      
      if (missingTerritories.length > 0 && !coveredTerritories.includes('global')) {
        recommendations.push(
          `Consider expanding distribution to these key markets: ${missingTerritories.join(', ')}.`
        );
      }
      
      // Return the complete analytics data
      return {
        status: 'success',
        summary: {
          totalPlatforms: distributionData.length, // Use distributionData
          successfulDistributions,
          failedDistributions,
          pendingDistributions,
          totalStreams,
          totalRevenue,
          averageProcessingTime
        },
        platformBreakdown,
        errorAnalysis: {
          commonErrors,
          errorTrend
        },
        geographicCoverage,
        timeline,
        recommendations
      };
    } catch (error) {
      console.error('Error generating distribution analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get resolution suggestion for common errors
   * 
   * @param errorType - The type of error
   * @returns Suggested resolution for the error
   */
  private static getErrorResolution(errorType: string): string {
    const resolutions = {
      'metadata_error': 'Review and correct the release metadata, ensuring all required fields are properly filled out.',
      'file_format_error': 'Ensure audio files meet platform requirements (format, bitrate, sample rate).',
      'artwork_error': 'Check artwork dimensions and format. Most platforms require 3000x3000px JPG/PNG files.',
      'content_policy_violation': 'Review platform content policies and ensure your content complies with their guidelines.',
      'authentication_error': 'Update your distribution credentials for the platform in settings.',
      'api_error': 'This is typically a temporary platform issue. Try redistributing later.',
      'delivery_timeout': 'The platform may be experiencing high load. Try redistributing later.',
      'duplicate_upc': 'Your UPC/EAN code conflicts with an existing release. Obtain a new UPC code.',
      'rights_conflict': 'Another distributor may have claimed rights to this content. Contact support to resolve.',
      'territory_restriction': 'Review territory restrictions and consider adjusting your distribution settings.'
    };
    
    // Use type assertion and check if key exists
    const resolutionMap = resolutions as Record<string, string>;
    return resolutionMap[errorType] ?? 'Contact support for assistance with this error.'; // Use nullish coalescing
  }
  
  /**
   * Compare distribution performance across platforms
   * 
   * This method compares performance metrics across different platforms for a user,
   * allowing for data-driven platform selection in future distributions.
   * 
   * @param userId - User ID to analyze distribution for
   * @param startDate - Optional start date for the comparison period
   * @param endDate - Optional end date for the comparison period
   * @param metric - Metric to compare (streams, revenue, errorRate, processingTime)
   * @returns Platform comparison results
   */
  static async comparePlatformPerformance(
    userId: number,
    startDate?: Date,
    endDate?: Date,
    metric: 'streams' | 'revenue' | 'errorRate' | 'processingTime' = 'revenue'
  ): Promise<{
    status: string;
    // Update return type to reflect added comparePercentage
    platforms: Array<{ 
      platformId: number;
      platformName: string;
      metricValue: number | undefined; 
      metricRank: number;
      comparePercentage?: number; 
      timeframe: {
        start: string;
        end: string;
      };
    }>;
    topPlatform?: {
      platformId: number;
      platformName: string;
      metricValue: number;
    };
    worstPlatform?: {
      platformId: number;
      platformName: string;
      metricValue: number;
    };
    averageValue: number;
    recommendations: string[];
  }> {
    try {
      // Set default date range if not provided
      const now = new Date();
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      
      const effectiveStartDate = startDate || threeMonthsAgo;
      const effectiveEndDate = endDate || now;
      
      // Get all releases for this user
      const userReleases = await db.query.releases.findMany({
        where: eq(releases.userId, userId)
      });
      
      if (userReleases.length === 0) {
        return {
          status: 'no_data',
          platforms: [],
          averageValue: 0,
          recommendations: [
            'No releases found for this user. Create a release to analyze platform performance.'
          ]
        };
      }
      
      const releaseIds = userReleases.map(release => release.id);
      
      // Get all distribution records for these releases
      const distributions = await db.query.distributionRecords.findMany({
        where: inArray(distributionRecords.releaseId, releaseIds)
      });
      
      // Get all analytics data for these releases
      const analyticsData = await db.query.analytics.findMany({
        where: and(
          inArray(analytics.releaseId, releaseIds),
          gte(analytics.date, effectiveStartDate),
          lte(analytics.date, effectiveEndDate)
        )
      });
      
      // Get all platforms
      const platforms = await db.query.distributionPlatforms.findMany();
      const platformMap = new Map(platforms.map(p => [p.id, p]));
      
      // Group data by platform
      const platformData = new Map();
      
      // Process distribution data
      distributions.forEach(record => {
        const platformId = record.platformId;
        const data = platformData.get(platformId) || {
          platformId,
          platformName: platformMap.get(platformId)?.name || `Platform ${platformId}`,
          distributions: 0,
          successfulDistributions: 0,
          failedDistributions: 0,
          processingTimes: [] as number[], // Initialize processingTimes array
          streams: 0,
          revenue: 0
        };
        
        data.distributions += 1;
        if (record.status === 'distributed') data.successfulDistributions += 1;
        if (record.status === 'failed') data.failedDistributions += 1;
        
        // Use distributedAt and createdAt for processing time calculation
        if (record.distributedAt && record.createdAt) { 
          const completed = new Date(record.distributedAt);
          const started = new Date(record.createdAt);
          data.processingTimes.push((completed.getTime() - started.getTime()) / (1000 * 60)); // Add to array
        }
        
        platformData.set(platformId, data);
      });
      
      // Process analytics data using a for...of loop to allow 'continue'
      for (const record of analyticsData) {
        // Assuming record.platform holds the platform ID as text
        const platformId = Number(record.platform); 
        if (isNaN(platformId)) continue; // Skip if platform is not a valid number
        
        const data = platformData.get(platformId) || {
          platformId,
          platformName: platformMap.get(platformId)?.name || `Platform ${platformId}`,
          distributions: 0,
          successfulDistributions: 0,
          failedDistributions: 0,
          processingTimes: [] as number[],
          streams: 0,
          revenue: 0
        };
        
        data.streams += record.streams;
        data.revenue += Number(record.revenue) || 0; // Convert revenue to number
        
        platformData.set(platformId, data);
      }
      
      // Calculate metrics for each platform
      const platformMetrics = Array.from(platformData.values()).map(data => {
        let metricValue: number | undefined = undefined; // Allow undefined
        
        switch (metric) {
          case 'streams':
            metricValue = data.streams;
            break;
          case 'revenue':
            metricValue = data.revenue;
            break;
          case 'errorRate':
            // Calculate error rate based on available data
            metricValue = data.distributions > 0 
              ? (data.failedDistributions / data.distributions) 
              : 0;
            // Invert so that lower error rates rank higher
            metricValue = 1 - metricValue;
            break;
          case 'processingTime':
             // Calculate average processing time
            metricValue = data.processingTimes.length > 0 
              ? (data.processingTimes.reduce((s: number, t: number) => s + t, 0) / data.processingTimes.length) 
              : undefined; // Use undefined if no processing times
            // Invert so that faster processing times rank higher (handle undefined)
            if (metricValue !== undefined) {
                metricValue = 100 - Math.min(metricValue, 100); 
            }
            break;
        }
        
        return {
          platformId: data.platformId,
          platformName: data.platformName,
          metricValue,
          metricRank: 0, // will be calculated below
          timeframe: {
            start: effectiveStartDate.toISOString(),
            end: effectiveEndDate.toISOString()
          }
        };
      });
      
      // Sort platforms by metric value and assign ranks
      platformMetrics.sort((a, b) => (b.metricValue ?? -Infinity) - (a.metricValue ?? -Infinity)); // Handle undefined
      
      platformMetrics.forEach((platform, index) => {
        platform.metricRank = index + 1;
      });
      
      // Calculate average metric value (excluding undefined values)
      const validMetricValues = platformMetrics.map(p => p.metricValue).filter(v => v !== undefined) as number[];
      const totalValue = validMetricValues.reduce((sum, v) => sum + v, 0);
      const averageValue = validMetricValues.length > 0 
        ? totalValue / validMetricValues.length 
        : 0;
      
      // Add comparePercentage calculation directly to the map result and assign rank
      const platformMetricsWithComparison = platformMetrics
        .map((platform) => { // No need to sort again, already sorted
          let comparePercentage: number | undefined = undefined;
          if (averageValue > 0 && platform.metricValue !== undefined) {
              comparePercentage = (platform.metricValue / averageValue) * 100 - 100;
          }
          // Rank is already assigned
          return { ...platform, comparePercentage }; 
      });

      const topPlatform = platformMetricsWithComparison[0];
      const worstPlatform = platformMetricsWithComparison[platformMetricsWithComparison.length - 1];
      
      // Generate recommendations
      const recommendations = [];
      
      // Recommend increasing distribution to high-performing platforms
      if (topPlatform && topPlatform.comparePercentage !== undefined && topPlatform.comparePercentage > 50) {
        recommendations.push(
          `${topPlatform.platformName} is performing ${topPlatform.comparePercentage.toFixed(0)}% better than average for ${metric}. Consider prioritizing this platform for future releases.`
        );
      }
      
      // Recommend de-emphasizing or fixing issues with low-performing platforms
      if (worstPlatform && worstPlatform.comparePercentage !== undefined && worstPlatform.comparePercentage < -50) {
        recommendations.push(
          `${worstPlatform.platformName} is performing ${Math.abs(worstPlatform.comparePercentage).toFixed(0)}% worse than average for ${metric}. Consider optimizing your content for this platform or de-emphasizing it in your distribution strategy.`
        );
      }
      
      // Platform diversification recommendation
      if (platformMetrics.length < 5) {
        const potentialPlatforms = platforms
          .filter(p => !platformData.has(p.id))
          .slice(0, 3)
          .map(p => p.name);
        
        if (potentialPlatforms.length > 0) {
          recommendations.push(
            `Consider diversifying your distribution to include more platforms, such as: ${potentialPlatforms.join(', ')}.`
          );
        }
      }
      
      return {
        status: 'success',
        platforms: platformMetricsWithComparison, // Return the array with comparePercentage
        topPlatform: topPlatform && topPlatform.metricValue !== undefined
          ? { 
              platformId: topPlatform.platformId,
              platformName: topPlatform.platformName,
              metricValue: topPlatform.metricValue
            }
          : undefined,
        worstPlatform: worstPlatform && worstPlatform.metricValue !== undefined
          ? {
              platformId: worstPlatform.platformId,
              platformName: worstPlatform.platformName,
              metricValue: worstPlatform.metricValue
            }
          : undefined,
        averageValue,
        recommendations
      };
    } catch (error) {
      console.error('Error comparing platform performance:', error);
      throw error;
    }
  }
}