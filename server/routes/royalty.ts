/**
 * Royalty Calculation Routes
 * 
 * This module handles routes for royalty calculations, batch processing, and reporting.
 * It interacts with the RoyaltyService to perform calculations and manage royalty data.
 */

import { Router } from 'express';
import { requireAuth } from '../auth';
import { RoyaltyService } from '../services/royalty-service-new';
import { IntegrationService } from '../services/integration-service';
import { db } from '../db';
import { royaltySplits } from '../../shared/enhanced-metadata-schema';
import { eq } from 'drizzle-orm';
import { validateRequest } from '../utils/validation';
import { 
  batchCalculateSchema,
  royaltyCalculationsQuerySchema,
  royaltySplitsQuerySchema,
  trackIdParamSchema,
  updateRoyaltySplitsSchema,
  royaltyStatementsQuerySchema,
  distributionIdParamSchema,
  integrationOptionsSchema,
  batchIntegrationSchema,
  integrationStatusQuerySchema
} from '../schemas/royalty-schemas';

const router = Router();

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
router.post('/batch-calculate', requireAuth, validateRequest(batchCalculateSchema), async (req, res) => {
  try {
    const { 
      trackIds, 
      releaseId, 
      timeframe, 
      forceRecalculation = false,
      userId
    } = req.body;
    
    // Validate request parameters
    if (!trackIds && !releaseId && !userId) {
      return res.status(400).json({ 
        success: false,
        error: "At least one of trackIds, releaseId, or userId must be provided" 
      });
    }
    
    // Set default calculation options
    const calculationOptions = {
      forceRecalculation,
      storeResults: true,
      updateAnalytics: true,
      notifyStakeholders: false,
    };
    
    let results;
    
    // Process based on the provided parameters
    if (trackIds && trackIds.length > 0) {
      // Calculate for specific tracks
      const timeframeObj = timeframe ? {
        startDate: new Date(timeframe.startDate),
        endDate: new Date(timeframe.endDate)
      } : undefined;
      
      results = await RoyaltyService.batchCalculateTrackRoyalties(
        trackIds,
        { 
          timeframe: timeframeObj,
          storeResults: calculationOptions.storeResults,
          updateExisting: calculationOptions.forceRecalculation
        }
      );
    } else if (releaseId) {
      // Calculate for all tracks in a release
      const timeframeObj = timeframe ? {
        startDate: new Date(timeframe.startDate),
        endDate: new Date(timeframe.endDate)
      } : undefined;
      
      results = await RoyaltyService.calculateReleaseRoyalties(
        parseInt(releaseId),
        timeframeObj,
        {
          storeResults: calculationOptions.storeResults,
          forceRecalculation: calculationOptions.forceRecalculation
        }
      );
    } else if (userId) {
      // Calculate for all tracks owned by a user
      const timeframeObj = timeframe ? {
        startDate: new Date(timeframe.startDate),
        endDate: new Date(timeframe.endDate)
      } : undefined;
      
      results = await RoyaltyService.calculateUserRoyalties(
        parseInt(userId),
        timeframeObj,
        {
          storeResults: calculationOptions.storeResults,
          forceRecalculation: calculationOptions.forceRecalculation
        }
      );
    }
    
    // Return the calculation results
    res.json({
      success: true,
      results,
      message: "Batch royalty calculation completed successfully"
    });
  } catch (error) {
    console.error("Error processing batch royalty calculations:", error);
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace available');
    res.status(500).json({ 
      success: false,
      error: "Failed to process batch royalty calculations",
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

/**
 * Get royalty calculation history
 * 
 * This endpoint retrieves the historical royalty calculations for tracks or releases,
 * with options for filtering by date range, status, and calculation type.
 */
router.get('/calculations', requireAuth, validateRequest(royaltyCalculationsQuerySchema, 'query'), async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }
    const userId = req.user.id;
    const { 
      trackId, 
      releaseId, 
      startDate, 
      endDate,
      status,
      limit = 20,
      offset = 0
    } = req.query as any;
    
    const results = await RoyaltyService.getRoyaltyCalculations({
      userId,
      trackId: trackId ? parseInt(trackId) : undefined,
      releaseId: releaseId ? parseInt(releaseId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      limit: parseInt(limit.toString())
    });
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("Error retrieving royalty calculation history:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to retrieve royalty calculation history",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get royalty split details
 * 
 * This endpoint retrieves royalty split information for tracks or releases,
 * showing how revenue is distributed among stakeholders.
 */
router.get('/splits', requireAuth, validateRequest(royaltySplitsQuerySchema, 'query'), async (req, res) => {
  try {
    const { trackId, releaseId } = req.query as any;
    
    if (!trackId && !releaseId) {
      return res.status(400).json({ 
        success: false,
        error: "Either trackId or releaseId must be provided" 
      });
    }
    
    let results;
    
    if (trackId) {
      results = await db
        .select()
        .from(royaltySplits)
        .where(eq(royaltySplits.trackId, parseInt(trackId)));
    } else if (releaseId) {
      results = await db
        .select()
        .from(royaltySplits)
        .where(eq(royaltySplits.releaseId, parseInt(releaseId)));
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error("Error retrieving royalty splits:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to retrieve royalty splits",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update royalty splits
 * 
 * This endpoint allows updating the royalty split information for a track,
 * defining how revenue is distributed among stakeholders.
 */
router.post('/splits/:trackId', requireAuth, validateRequest(updateRoyaltySplitsSchema), async (req, res) => {
  try {
    const trackId = parseInt(req.params.trackId);
    const { splits } = req.body;
    
    if (!Array.isArray(splits)) {
      return res.status(400).json({ 
        success: false,
        error: "Splits must be provided as an array" 
      });
    }
    
    // Validate splits total to 100%
    const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return res.status(400).json({ 
        success: false,
        error: "Split percentages must total 100%" 
      });
    }
    
    // Update each split record in the database
    const results = await Promise.all(
      splits.map(async (split) => {
        return await db
          .update(royaltySplits)
          .set({
            splitPercentage: split.percentage.toString(),
            recipientName: split.recipientName,
            recipientType: split.recipientType,
            roleType: split.roleType || 'contributor'
          })
          .where(
            eq(royaltySplits.id, split.id)
          )
          .returning();
      })
    );
    
    res.json({
      success: true,
      data: results,
      message: "Royalty splits updated successfully"
    });
  } catch (error) {
    console.error("Error updating royalty splits:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update royalty splits",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get royalty statements
 * 
 * This endpoint generates and retrieves royalty statements for a specific user,
 * timeframe, and optionally filtered by release or track.
 */
router.get('/statements', requireAuth, validateRequest(royaltyStatementsQuerySchema, 'query'), async (req, res) => {
  try {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }
    const userId = req.user.id;
    const { 
      startDate, 
      endDate,
      releaseId,
      trackId,
      format = 'json'
    } = req.query as any;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false,
        error: "startDate and endDate are required parameters" 
      });
    }
    
    const results = await RoyaltyService.generateRoyaltyStatement(
      userId,
      new Date(startDate),
      new Date(endDate),
      format
    );
    
    if (format === 'pdf') {
      // For PDF format, set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=royalty-statement-${startDate}-${endDate}.pdf`);
      // Assuming results contains the PDF data directly in format = 'pdf' mode
      res.send(results);
    } else {
      // For JSON format, return the data directly in standardized format
      res.json({
        success: true,
        data: results
      });
    }
  } catch (error) {
    console.error("Error generating royalty statement:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate royalty statement",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Process integration between distribution and royalty systems
 * 
 * This endpoint triggers the integration flow between distribution records
 * and royalty calculations, creating the necessary links for tracking revenue.
 */
router.post('/integrate-distribution/:distributionId', requireAuth, validateRequest(distributionIdParamSchema, 'params'), validateRequest(integrationOptionsSchema), async (req, res) => {
  try {
    const distributionId = parseInt(req.params.distributionId);
    
    const result = await IntegrationService.processDistributionRoyaltyIntegration(
      distributionId, 
      { forceRecalculation: req.body.forceRecalculation }
    );
    
    res.json({
      success: true,
      data: result,
      message: "Distribution-royalty integration processed successfully"
    });
  } catch (error) {
    console.error("Error processing distribution-royalty integration:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to process distribution-royalty integration",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Process batch integration of distribution to royalty systems
 * 
 * This endpoint handles batch processing of distribution-to-royalty integration
 * with options for different selection criteria and processing modes.
 */
router.post('/integrate-distribution-batch', requireAuth, validateRequest(batchIntegrationSchema), async (req, res) => {
  try {
    const {
      userId,
      startDate,
      endDate,
      limit,
      includeFailedDistributions,
      forceRecalculation
    } = req.body;
    
    // Ensure user is authenticated for default user ID
    if (!userId && !req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }
    
    const result = await IntegrationService.processDistributionRoyaltyBatch({
      userId: userId || (req.user ? req.user.id : undefined),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      limit,
      includeFailedDistributions,
      forceRecalculation
    });
    
    res.json({
      success: true,
      data: result,
      message: "Batch distribution-royalty integration processed successfully"
    });
  } catch (error) {
    console.error("Error processing batch distribution-royalty integration:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to process batch distribution-royalty integration",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get integration status
 * 
 * This endpoint provides the status of integration between distribution and royalty systems,
 * showing pending and completed integrations.
 */
router.get('/integration-status', requireAuth, validateRequest(integrationStatusQuerySchema, 'query'), async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query as any;
    
    // Ensure user is authenticated if no userId provided
    if (!userId && !req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required"
      });
    }
    
    const result = await IntegrationService.getDistributionRoyaltyIntegrationStatus({
      userId: userId ? parseInt(userId) : (req.user ? req.user.id : undefined),
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined
    });
    
    res.json({
      success: true,
      data: result,
      message: "Integration status retrieved successfully"
    });
  } catch (error) {
    console.error("Error retrieving integration status:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to retrieve integration status",
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;