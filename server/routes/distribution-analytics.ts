/**
 * Distribution Analytics Routes
 * 
 * This router handles API endpoints for analyzing distribution performance,
 * platform-specific analytics, territorial coverage, and error patterns
 * across distribution channels.
 * 
 * Key features:
 * - Comprehensive distribution analytics by release
 * - Platform comparison metrics for data-driven platform selection
 * - Processing time analysis across different platforms
 * - Geographic coverage and territorial analysis
 * - Error pattern analysis with resolution suggestions
 */

import { Router } from 'express';
import { requireAuth } from '../auth';
import { storage } from '../storage';
import { DistributionAnalyticsService } from '../services/distribution-analytics';
import { z } from 'zod';

// Create the router
export const distributionAnalyticsRouter = Router();

/**
 * Get comprehensive distribution analytics for a release
 * 
 * This endpoint provides detailed analytics on distribution performance
 * including platform success rates, processing times, and error patterns.
 * 
 * @route GET /api/distribution-analytics/releases/:releaseId
 * @param {number} releaseId - The ID of the release to analyze
 * @returns Comprehensive distribution analytics data
 */
distributionAnalyticsRouter.get('/releases/:releaseId', requireAuth, async (req, res) => {
  try {
    const releaseId = parseInt(req.params.releaseId);
    
    // Verify the release exists and belongs to the user
    const release = await storage.getReleaseById(releaseId);
    if (!release) {
      return res.status(404).json({ 
        success: false,
        error: 'Release not found' 
      });
    }
    
    if (release.userId !== req.user!.id) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized access to release' 
      });
    }
    
    // Generate comprehensive distribution analytics
    const analytics = await DistributionAnalyticsService.generateDistributionAnalytics(releaseId);
    
    // Return the data in standardized format
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error generating distribution analytics:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate distribution analytics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Compare platform performance across different metrics
 * 
 * This endpoint provides comparative analysis of distribution platforms
 * based on specified metrics like streams, revenue, error rates, etc.
 * 
 * @route GET /api/distribution-analytics/platform-comparison
 * @query {string} metric - Metric to compare (streams, revenue, errorRate, processingTime)
 * @query {string} startDate - Optional start date for the comparison period
 * @query {string} endDate - Optional end date for the comparison period
 * @returns Platform comparison results
 */
distributionAnalyticsRouter.get('/platform-comparison', requireAuth, async (req, res) => {
  try {
    // Validate query parameters
    const schema = z.object({
      metric: z.enum(['streams', 'revenue', 'errorRate', 'processingTime']),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    });
    
    const query = schema.safeParse(req.query);
    if (!query.success) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid query parameters',
        details: query.error.format()
      });
    }
    
    // Parse dates if provided
    const startDate = query.data.startDate ? new Date(query.data.startDate) : undefined;
    const endDate = query.data.endDate ? new Date(query.data.endDate) : undefined;
    
    // Get platform comparison data
    const comparison = await DistributionAnalyticsService.comparePlatformPerformance(
      req.user!.id,
      startDate,
      endDate,
      query.data.metric
    );
    
    // Return the data in standardized format
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error comparing platforms:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to compare platform performance',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get timeline of distribution events for a release
 * 
 * This endpoint provides a chronological timeline of distribution events
 * for a specific release, including status changes, errors, and platform activations.
 * 
 * @route GET /api/distribution-analytics/timeline/:releaseId
 * @param {number} releaseId - The ID of the release to analyze
 * @returns Timeline of distribution events
 */
distributionAnalyticsRouter.get('/timeline/:releaseId', requireAuth, async (req, res) => {
  try {
    const releaseId = parseInt(req.params.releaseId);
    
    // Verify the release exists and belongs to the user
    const release = await storage.getReleaseById(releaseId);
    if (!release) {
      return res.status(404).json({ 
        success: false, 
        error: 'Release not found' 
      });
    }
    
    if (release.userId !== req.user!.id) {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized access to release' 
      });
    }
    
    // Generate timeline data
    const timeline = await DistributionAnalyticsService.generateDistributionTimeline(releaseId);
    
    // Return the data in standardized format
    res.json({
      success: true,
      data: timeline
    });
  } catch (error) {
    console.error('Error generating distribution timeline:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate distribution timeline',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get geographic distribution coverage
 * 
 * This endpoint provides analysis of geographic coverage across
 * different territories and regions for a user's content.
 * 
 * @route GET /api/distribution-analytics/geography
 * @query {string} startDate - Optional start date for the analysis period
 * @query {string} endDate - Optional end date for the analysis period
 * @returns Geographic distribution coverage data
 */
distributionAnalyticsRouter.get('/geography', requireAuth, async (req, res) => {
  try {
    // Parse dates if provided
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    // Get geographic distribution data
    const geography = await DistributionAnalyticsService.analyzeGeographicDistribution(
      req.user!.id,
      startDate,
      endDate
    );
    
    // Return the data in standardized format
    res.json({
      success: true,
      data: geography
    });
  } catch (error) {
    console.error('Error analyzing geographic distribution:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to analyze geographic distribution',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get error patterns analysis across distributions
 * 
 * This endpoint provides analysis of common error patterns,
 * their frequency, affected platforms, and suggested resolutions.
 * 
 * @route GET /api/distribution-analytics/error-patterns
 * @query {string} startDate - Optional start date for the analysis period
 * @query {string} endDate - Optional end date for the analysis period
 * @returns Error pattern analysis data
 */
distributionAnalyticsRouter.get('/error-patterns', requireAuth, async (req, res) => {
  try {
    // Parse dates if provided
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    // Get error pattern analysis
    const errorAnalysis = await DistributionAnalyticsService.analyzeErrorPatterns(
      req.user!.id,
      startDate,
      endDate
    );
    
    // Return the data in standardized format
    res.json({
      success: true,
      data: errorAnalysis
    });
  } catch (error) {
    console.error('Error analyzing error patterns:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze error patterns',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get distribution performance dashboard data
 * 
 * This endpoint provides comprehensive dashboard data
 * for analyzing overall distribution performance.
 * 
 * @route GET /api/distribution-analytics/dashboard
 * @query {string} timeframe - Time period for the dashboard (week, month, quarter, year)
 * @returns Dashboard data with key performance indicators
 */
distributionAnalyticsRouter.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Validate timeframe parameter
    const timeframe = req.query.timeframe as string || 'month';
    if (!['week', 'month', 'quarter', 'year'].includes(timeframe)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid timeframe parameter',
        message: 'Timeframe must be one of: week, month, quarter, year'
      });
    }
    
    // Get dashboard data
    const dashboard = await DistributionAnalyticsService.generateDistributionDashboard(
      req.user!.id,
      timeframe
    );
    
    // Return the data in standardized format
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    console.error('Error generating distribution dashboard:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate distribution dashboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});