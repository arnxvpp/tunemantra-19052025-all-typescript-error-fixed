/**
 * Analytics API Routes
 * 
 * This module defines all API endpoints for analytics-related functionality.
 * These endpoints allow users to access analytics data for their tracks, releases,
 * and overall account performance.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { checkSubscription } from '../middleware/role-based-access';
import { AnalyticsService } from '../services/analytics-service';

// Create a router instance
export const analyticsRouter = Router();

/**
 * Get analytics data for a specific track
 * 
 * @route GET /api/analytics/track/:trackId
 * @param {number} trackId - The ID of the track to get analytics for
 * @param {string} [startDate] - Optional start date for filtering (YYYY-MM-DD)
 * @param {string} [endDate] - Optional end date for filtering (YYYY-MM-DD)
 * @returns {object} Analytics data for the track
 */
analyticsRouter.get('/track/:trackId', requireAuth, checkSubscription, async (req: Request, res: Response) => {
  try {
    const trackId = parseInt(req.params.trackId);
    
    // Parse date filters if provided
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    // Get analytics data
    const analytics = await AnalyticsService.getTrackAnalytics(trackId, startDate, endDate);
    
    // Return the analytics data in a consistent format
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching track analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch track analytics' 
    });
  }
});

/**
 * Get analytics data for a specific release
 * 
 * @route GET /api/analytics/release/:releaseId
 * @param {number} releaseId - The ID of the release to get analytics for
 * @param {string} [startDate] - Optional start date for filtering (YYYY-MM-DD)
 * @param {string} [endDate] - Optional end date for filtering (YYYY-MM-DD)
 * @returns {object} Analytics data for the release
 */
analyticsRouter.get('/release/:releaseId', requireAuth, checkSubscription, async (req: Request, res: Response) => {
  try {
    const releaseId = parseInt(req.params.releaseId);
    
    // Parse date filters if provided
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    // Get analytics data
    const analytics = await AnalyticsService.getReleaseAnalytics(releaseId, startDate, endDate);
    
    // Return the analytics data in a consistent format
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching release analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch release analytics' 
    });
  }
});

/**
 * Get daily statistics for the current user
 * 
 * @route GET /api/analytics/daily-stats
 * @param {string} [startDate] - Optional start date for filtering (YYYY-MM-DD)
 * @param {string} [endDate] - Optional end date for filtering (YYYY-MM-DD)
 * @returns {object} Daily statistics for the user
 */
analyticsRouter.get('/daily-stats', requireAuth, checkSubscription, async (req: Request, res: Response) => {
  try {
    // Parse date filters if provided
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    // Get daily statistics
    const stats = await AnalyticsService.getUserDailyStats(req.user!.id, startDate, endDate);
    
    // Return the statistics in a consistent format
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching daily statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch daily statistics' 
    });
  }
});

/**
 * Get platform-specific analytics for a track
 * 
 * @route GET /api/analytics/track/:trackId/platform/:platform
 * @param {number} trackId - The ID of the track to get analytics for
 * @param {string} platform - The platform to filter by (e.g., 'spotify', 'apple')
 * @returns {object} Platform-specific analytics for the track
 */
analyticsRouter.get('/track/:trackId/platform/:platform', requireAuth, checkSubscription, async (req: Request, res: Response) => {
  try {
    const trackId = parseInt(req.params.trackId);
    const platform = req.params.platform;
    
    // Get platform-specific analytics data
    const analytics = await AnalyticsService.getTrackPlatformAnalytics(trackId, platform);
    
    // Return the analytics data in a consistent format
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching platform-specific analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch platform-specific analytics' 
    });
  }
});

/**
 * Generate a summary of the user's catalog performance
 * 
 * @route GET /api/analytics/catalog-summary
 * @returns {object} Summary analytics data for the user's catalog
 */
analyticsRouter.get('/catalog-summary', requireAuth, checkSubscription, async (req: Request, res: Response) => {
  try {
    // Generate catalog summary
    const summary = await AnalyticsService.generateUserCatalogSummary(req.user!.id);
    
    // Return the summary data in a consistent format
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error generating catalog summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate catalog summary' 
    });
  }
});

/**
 * Refresh analytics data from distribution platforms
 * 
 * @route POST /api/analytics/refresh
 * @returns {object} Status of the refresh operation
 */
analyticsRouter.post('/refresh', requireAuth, checkSubscription, async (req: Request, res: Response) => {
  try {
    // Refresh analytics data
    const status = await AnalyticsService.refreshAnalyticsFromPlatforms(req.user!.id);
    
    // Return the refresh status in a consistent format
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error refreshing analytics data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to refresh analytics data' 
    });
  }
});

/**
 * Get geographic analytics data
 * 
 * This endpoint provides insights into the geographic distribution of streams and revenue
 * across different countries for a user's content.
 * 
 * @route GET /api/analytics/geographic
 * @param {string} [startDate] - Optional start date for filtering (YYYY-MM-DD)
 * @param {string} [endDate] - Optional end date for filtering (YYYY-MM-DD)
 * @returns {object} Geographic analytics data grouped by country
 */
analyticsRouter.get('/geographic', requireAuth, checkSubscription, async (req: Request, res: Response) => {
  try {
    // Parse date filters if provided
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    // Get geographic analytics data
    const geographicData = await AnalyticsService.getGeographicAnalytics(
      req.user!.id,
      startDate,
      endDate
    );
    
    // Return the data in a standardized format
    res.json({
      success: true,
      data: geographicData
    });
  } catch (error) {
    console.error('Error fetching geographic analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch geographic analytics' 
    });
  }
});