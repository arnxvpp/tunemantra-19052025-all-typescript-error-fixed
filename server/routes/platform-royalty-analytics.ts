/**
 * Platform Royalty Analytics Routes
 * 
 * This file contains routes for platform-specific royalty analytics
 * including platform comparison, timeline data, and platform performance metrics.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { storage } from '../storage';
import { PlatformRoyaltyAnalyticsService } from '../services/platform-royalty-analytics';
import { z } from 'zod';

export const platformRoyaltyAnalyticsRouter = Router();

/**
 * Compare platforms royalty data
 * 
 * This endpoint compares performance metrics between multiple platforms.
 * It supports comparison of revenue, streams, and rate metrics across
 * platforms for a specific timeframe.
 * 
 * Query parameters:
 * - userId: User ID for the data
 * - platformIds: Comma-separated list of platform IDs to compare
 * - metric: Metric to compare ('revenue', 'streams', 'rate')
 * - timeframe: Time period for the comparison ('day', 'week', 'month', 'quarter', 'year')
 * 
 * @route GET /api/platform-royalty-analytics/compare-platforms
 * @access Private
 */
platformRoyaltyAnalyticsRouter.get('/compare-platforms', requireAuth, async (req: Request, res: Response) => {
  try {
    // Parse user ID (if provided, otherwise use authenticated user)
    const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    // Parse platform IDs
    const platformIdsStr = req.query.platformIds as string;
    if (!platformIdsStr) {
      return res.status(400).json({ 
        success: false, 
        error: 'Platform IDs are required' 
      });
    }

    // Convert comma-separated platformIds to array of numbers
    const platformIds = platformIdsStr.split(',').map(id => parseInt(id.trim()));
    
    // Validate platform IDs
    if (platformIds.some(id => isNaN(id))) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid platform IDs' 
      });
    }

    // Parse metric and timeframe
    const metric = req.query.metric as string || 'revenue';
    const timeframe = req.query.timeframe as string || 'month';

    // Validate metric
    const validMetrics = ['revenue', 'streams', 'rate'];
    if (!validMetrics.includes(metric)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}` 
      });
    }

    // Validate timeframe
    const validTimeframes = ['day', 'week', 'month', 'quarter', 'year'];
    if (!validTimeframes.includes(timeframe)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}` 
      });
    }

    // Get platform comparison data
    const comparisonData = await PlatformRoyaltyAnalyticsService.getPlatformRoyaltyComparison(
      userId,
      platformIds,
      metric,
      timeframe
    );

    // Return result
    return res.status(200).json({
      success: true,
      data: comparisonData
    });
  } catch (error) {
    console.error('Error comparing platforms:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to compare platforms' 
    });
  }
});

/**
 * Get platform timeline data
 * 
 * This endpoint provides timeline data for a specific platform
 * with flexible date ranges and metrics selection.
 * 
 * Query parameters:
 * - userId: User ID for the data
 * - platformId: Platform ID for the timeline
 * - startDate: Start date in ISO format
 * - endDate: End date in ISO format
 * - interval: Data interval ('day', 'week', 'month')
 * - metrics: Comma-separated list of metrics to include
 * 
 * @route GET /api/platform-royalty-analytics/platform-timeline
 * @access Private
 */
platformRoyaltyAnalyticsRouter.get('/platform-timeline', requireAuth, async (req: Request, res: Response) => {
  try {
    // Parse user ID (if provided, otherwise use authenticated user)
    const userId = req.query.userId ? parseInt(req.query.userId as string) : req.user?.id;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required' 
      });
    }

    // Parse platform ID
    const platformId = req.query.platformId ? parseInt(req.query.platformId as string) : null;
    
    if (!platformId || isNaN(platformId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid platform ID is required' 
      });
    }

    // Parse date range
    const startDateStr = req.query.startDate as string;
    const endDateStr = req.query.endDate as string;
    
    if (!startDateStr || !endDateStr) {
      return res.status(400).json({ 
        success: false, 
        error: 'Start date and end date are required' 
      });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid date format. Use ISO format (YYYY-MM-DD)' 
      });
    }

    // Parse interval and metrics
    const interval = req.query.interval as string || 'day';
    const metricsStr = req.query.metrics as string || 'revenue,streams';
    const metrics = metricsStr.split(',');
    
    // Validate interval
    const validIntervals = ['day', 'week', 'month'];
    if (!validIntervals.includes(interval)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid interval. Must be one of: ${validIntervals.join(', ')}` 
      });
    }
    
    // Validate metrics
    const validMetrics = ['revenue', 'streams', 'rate', 'growth'];
    if (metrics.some(m => !validMetrics.includes(m))) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid metrics. Must be from: ${validMetrics.join(', ')}` 
      });
    }

    // Get platform timeline data
    const timelineData = await PlatformRoyaltyAnalyticsService.getPlatformRoyaltyTimeline(
      userId,
      platformId,
      startDate,
      endDate,
      interval,
      metrics
    );

    // Return result
    return res.status(200).json({
      success: true,
      data: timelineData
    });
  } catch (error) {
    console.error('Error getting platform timeline:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get platform timeline data' 
    });
  }
});

export default platformRoyaltyAnalyticsRouter;