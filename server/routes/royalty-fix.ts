/**
 * Royalty API Routes
 * 
 * These routes handle royalty calculation and distribution functionality.
 * They are fixed versions of the original royalty routes with proper error handling
 * and correct content type headers.
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireAdmin } from '../auth';
import { RoyaltyService } from '../services/royalty-service-new';
import { IStorage } from '../types';
import { db } from '../db';
import { PLATFORM_RATES } from '@shared/constants';
import { eq, and, gte, lte, sql, inArray, count, sum, avg, not, isNull, desc } from 'drizzle-orm';
import { validateRequest } from '../utils/validation';
import { 
  batchCalculateSchema as batchRoyaltyCalculationSchema, 
  updateRoyaltySplitsSchema as releaseRoyaltySplitSchema,
  royaltyCalculationsQuerySchema as statusQuerySchema
} from '../schemas/royalty-schemas';
import { z } from 'zod';
import { commonValidationSchemas } from '../utils/validation';

// Schema for validating releaseId parameter
const releaseIdParamSchema = z.object({
  releaseId: z.string().refine(
    (val) => !isNaN(parseInt(val)) && parseInt(val) > 0,
    { message: "Release ID must be a positive integer" }
  )
});

/**
 * Initialize royalty routes
 * 
 * @param router - Express router
 * @param storage - Storage interface for database access
 */
export function registerRoyaltyFixRoutes(router: Router, storage: IStorage) {
  
  /**
   * Process batch royalty calculations
   * 
   * This endpoint triggers batch processing of royalty calculations for multiple tracks
   * or entire releases, optimized for background processing and bulk operations.
   * 
   * Request body:
   * - trackIds?: number[] - Optional array of track IDs to process
   * - releaseId?: number - Optional release ID to process all tracks from
   * - userId?: number - Optional user ID to process all their tracks
   * - timeframe?: { startDate: string, endDate: string } - Optional date range for calculations
   * - forceRecalculation?: boolean - Whether to force recalculation of existing data
   */
  router.post('/batch-calculations', requireAuth, validateRequest(batchRoyaltyCalculationSchema), async (req: Request, res: Response) => {
    try {
      console.log('Received batch calculation request with body:', JSON.stringify(req.body));
      console.log('Authenticated user:', req.user ? `ID: ${req.user.id}, Username: ${req.user.username}` : 'No user');
      console.log('Full req.user object:', JSON.stringify(req.user || {}));
      console.log('Authentication check:', req.isAuthenticated ? `Authenticated: ${req.isAuthenticated()}` : 'No isAuthenticated method');
      console.log('Session:', req.session);
      
      // Debugging: Return immediately instead of proceeding with calculations
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication error',
          message: 'User is not authenticated or session expired'
        });
      }
      
      const { 
        trackIds,
        releaseId,
        userId = req.user?.id, // Default to the authenticated user
        forceRecalculation = false,
        storeResults = true,
        calculationPeriod
      } = req.body;

      console.log('Extracted parameters:', { 
        trackIds: trackIds ? `${trackIds.length} tracks` : 'none',
        releaseId, 
        userId, 
        forceRecalculation, 
        storeResults 
      });

      // Validate input
      if (!trackIds && !releaseId && !userId) {
        console.log('Validation failed: No trackIds, releaseId, or userId provided');
        return res.status(400).json({ 
          error: 'Invalid request', 
          message: 'You must provide at least one of: trackIds, releaseId, or userId' 
        });
      }

      console.log('Validated input parameters for batch calculation');
      
      let result;
      try {
        if (trackIds && trackIds.length > 0) {
          console.log(`Processing batch royalty calculation for ${trackIds.length} tracks:`, trackIds);
          console.log('Options:', { storeResults, updateExisting: forceRecalculation });
          
          result = await RoyaltyService.batchCalculateTrackRoyalties(trackIds, {
            storeResults,
            updateExisting: forceRecalculation
          });
          console.log('Successfully processed batch track royalties');
        } else if (releaseId) {
          console.log(`Processing royalty calculation for release ${releaseId}`);
          result = await RoyaltyService.calculateReleaseRoyalties(releaseId, undefined, {
            forceRecalculation,
            storeResults
          });
          console.log('Successfully processed release royalties');
        } else if (userId) {
          console.log(`Processing royalty calculation for user ${userId}`);
          result = await RoyaltyService.calculateUserRoyalties(userId, undefined, {
            forceRecalculation,
            storeResults
          });
          console.log('Successfully processed user royalties');
        }
      } catch (serviceError) {
        console.error('Error in RoyaltyService method:', serviceError);
        console.error('Error stack:', serviceError instanceof Error ? serviceError.stack : 'No stack trace');
        // Re-throw to be caught by the outer try/catch
        throw serviceError;
      }

      console.log('Preparing successful response');
      // Always return a JSON response
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        success: true,
        data: result,
        message: 'Royalty calculations processed successfully'
      });
    } catch (error) {
      console.error('Error processing batch royalty calculations:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
  });



  /**
   * Get royalty calculation status
   * 
   * Get the current status of royalty calculations, including:
   * - Recent calculations
   * - Pending calculations
   * - Error states
   * - Calculation statistics
   */
  router.get('/status', requireAuth, requireAdmin, validateRequest(statusQuerySchema, 'query'), async (req: Request, res: Response) => {
    try {
      // Parse query parameters
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const includeRecent = req.query.includeRecent === 'true';
      const includePending = req.query.includePending === 'true';
      const includeErrors = req.query.includeErrors === 'true';
      
      const status = await RoyaltyService.getRoyaltyCalculationStatus({
        limit,
        includeRecent,
        includePending,
        includeErrors
      });
      
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error retrieving royalty calculation status:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  /**
   * Get platform royalty rates
   * 
   * This endpoint returns the current royalty rates for each platform.
   * It's used by the frontend to display rate information and calculate
   * projected earnings.
   */
  router.get('/platform-rates', requireAuth, async (req: Request, res: Response) => {
    try {
      // No parameters to validate since this is a simple GET endpoint that returns a constant
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        success: true,
        data: PLATFORM_RATES
      });
    } catch (error) {
      console.error('Error retrieving platform royalty rates:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  /**
   * Get royalty splits for a release
   * 
   * Retrieves all royalty split configurations for a specific release,
   * which defines how earnings are distributed among stakeholders.
   */
  router.get('/splits/:releaseId', requireAuth, validateRequest(releaseIdParamSchema, 'params'), async (req: Request, res: Response) => {
    try {
      const releaseId = parseInt(req.params.releaseId);
      
      const splits = await RoyaltyService.getRoyaltySplitsByReleaseId(releaseId);
      
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        success: true,
        data: splits
      });
    } catch (error) {
      console.error('Error retrieving royalty splits:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });

  /**
   * Update royalty splits for a release
   * 
   * Updates the royalty split configurations for a specific release,
   * reconfiguring how earnings are distributed among stakeholders.
   */
  router.post('/splits/:releaseId', requireAuth, validateRequest(releaseIdParamSchema, 'params'), validateRequest(releaseRoyaltySplitSchema), async (req: Request, res: Response) => {
    try {
      const releaseId = parseInt(req.params.releaseId);
      const { splits } = req.body;
      
      const updatedSplits = await RoyaltyService.updateRoyaltySplitsForRelease(releaseId, splits);
      
      res.setHeader('Content-Type', 'application/json');
      return res.json({
        success: true,
        data: updatedSplits,
        message: 'Royalty splits updated successfully'
      });
    } catch (error) {
      console.error('Error updating royalty splits:', error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        error: 'Server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  });
}