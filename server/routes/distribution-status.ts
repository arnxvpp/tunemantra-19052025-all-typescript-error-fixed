/**
 * Distribution Status API Routes
 * 
 * This module implements API routes for the distribution status tracking system.
 * These endpoints provide a way to:
 * 1. Monitor the status of distribution records
 * 2. View status history and transitions
 * 3. Update platform-specific status information
 * 4. Get distribution status statistics
 */

import { Router, Request } from 'express';
import { requireAuth } from '../auth';
import { DistributionStatusTracker } from '../services/distribution-status-tracker';
import { eq } from 'drizzle-orm';
import { distributionRecords } from '../../shared/schema';
import { db } from '../db';
import { validateRequest } from '../utils/validation';
import { 
  getStatusRecordsSchema, 
  distributionIdParamSchema, 
  updateStatusSchema,
  statusStatisticsSchema
} from '../schemas/distribution-status-schemas';

// Simplified type for authenticated request
interface AuthenticatedRequest extends Request {
  user: any; // We know the user has an id property when authenticated
}

const router = Router();

/**
 * Get current status for all distribution records for the user
 * 
 * This endpoint returns the current distribution status for all
 * distribution records owned by the authenticated user.
 * 
 * Query parameters:
 * - platformId: Optional filter by distribution platform ID
 * - releaseId: Optional filter by release ID
 * - startDate: Optional filter by start date
 * - endDate: Optional filter by end date
 * - status: Optional filter by status
 */
router.get('/records', requireAuth, validateRequest(getStatusRecordsSchema, 'query'), async (req: AuthenticatedRequest, res) => {
  try {
    // Extract query parameters
    const platformId = req.query.platformId ? parseInt(req.query.platformId as string) : undefined;
    const releaseId = req.query.releaseId ? parseInt(req.query.releaseId as string) : undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const status = req.query.status as string | undefined;

    // Get user ID from session
    const userId = req.user.id;

    // Get distribution records with their status
    const statusRecords = await DistributionStatusTracker.getUserDistributionStatus(
      userId,
      {
        platformId,
        releaseId,
        startDate,
        endDate,
        status
      }
    );

    // Return records
    res.json({
      success: true,
      records: statusRecords
    });
  } catch (error) {
    console.error('Error getting distribution status records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve distribution status records',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get detailed distribution status for a specific record
 * 
 * This endpoint returns detailed status information for a single
 * distribution record, including platform-specific data.
 * 
 * URL parameters:
 * - id: Distribution record ID
 */
router.get('/records/:id', requireAuth, validateRequest(distributionIdParamSchema, 'params'), async (req: AuthenticatedRequest, res) => {
  try {
    const distributionId = parseInt(req.params.id);
    
    // Get user ID from session
    const userId = req.user.id;
    
    // Get the distribution record
    const record = await db.query.distributionRecords.findFirst({
      where: eq(distributionRecords.id, distributionId)
    });
    
    // If record doesn't exist or doesn't belong to user, return 404
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Distribution record not found'
      });
    }
    
    // Get detailed status information
    const statusDetails = await DistributionStatusTracker.getDetailedStatus(distributionId);
    
    // Return status details
    res.json({
      success: true,
      record: statusDetails
    });
  } catch (error) {
    console.error('Error getting detailed distribution status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve detailed distribution status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get status history for a distribution record
 * 
 * This endpoint returns the complete status history for a distribution record,
 * showing all status transitions and timestamps.
 * 
 * URL parameters:
 * - id: Distribution record ID
 */
router.get('/history/:id', requireAuth, validateRequest(distributionIdParamSchema, 'params'), async (req: AuthenticatedRequest, res) => {
  try {
    const distributionId = parseInt(req.params.id);
    
    // Get user ID from session
    const userId = req.user.id;
    
    // Get the distribution record
    const record = await db.query.distributionRecords.findFirst({
      where: eq(distributionRecords.id, distributionId)
    });
    
    // If record doesn't exist or doesn't belong to user, return 404
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Distribution record not found'
      });
    }
    
    // Get status history
    const statusHistory = await DistributionStatusTracker.getStatusHistory(distributionId);
    
    // Return history
    res.json({
      success: true,
      history: statusHistory
    });
  } catch (error) {
    console.error('Error getting distribution status history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve distribution status history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Update platform-specific status for a distribution record
 * 
 * This endpoint allows updating the platform-specific status for a
 * distribution record, which can trigger status transitions and
 * notifications.
 * 
 * URL parameters:
 * - id: Distribution record ID
 * 
 * Request body:
 * - status: New status value
 * - message: Optional status message
 * - platformReleaseId: Optional platform-specific release ID
 * - platformTrackIds: Optional array of platform-specific track IDs
 * - liveDate: Optional date when the content went live
 * - availableStores: Optional array of stores where content is available
 * - errorDetails: Optional error details if status is 'failed'
 * - streamingLinks: Optional object with streaming links by platform
 * - platformResponse: Optional raw response from the platform
 */
router.post('/update/:id', requireAuth, validateRequest(distributionIdParamSchema, 'params'), validateRequest(updateStatusSchema, 'body'), async (req: AuthenticatedRequest, res) => {
  try {
    const distributionId = parseInt(req.params.id);
    
    // Get user ID from session
    const userId = req.user.id;
    
    // Get the distribution record
    const record = await db.query.distributionRecords.findFirst({
      where: eq(distributionRecords.id, distributionId)
    });
    
    // If record doesn't exist or doesn't belong to user, return 404
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Distribution record not found'
      });
    }
    
    // Update platform status
    const updatedStatus = await DistributionStatusTracker.updatePlatformStatus(
      distributionId,
      {
        status: req.body.status,
        message: req.body.message,
        platformReleaseId: req.body.platformReleaseId,
        platformTrackIds: req.body.platformTrackIds,
        liveDate: req.body.liveDate ? new Date(req.body.liveDate) : undefined,
        availableStores: req.body.availableStores,
        errorDetails: req.body.errorDetails || undefined,
        streamingLinks: req.body.streamingLinks,
        platformResponse: req.body.platformResponse
      }
    );
    
    // Return updated status
    res.json({
      success: true,
      status: updatedStatus
    });
  } catch (error) {
    console.error('Error updating distribution platform status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update distribution platform status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get distribution status statistics
 * 
 * This endpoint returns aggregated statistics for distribution status,
 * including counts by status, platform, and error type.
 * 
 * Query parameters:
 * - startDate: Optional filter by start date
 * - endDate: Optional filter by end date
 * - platformId: Optional filter by distribution platform ID
 */
router.get('/statistics', requireAuth, validateRequest(statusStatisticsSchema, 'query'), async (req: AuthenticatedRequest, res) => {
  try {
    // Extract query parameters
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    const platformId = req.query.platformId ? parseInt(req.query.platformId as string) : undefined;
    
    // Get statistics
    const statistics = await DistributionStatusTracker.getStatusStatistics({
      userId: req.user.id,
      startDate,
      endDate,
      platformId
    });
    
    // Return statistics
    res.json({
      success: true,
      statistics
    });
  } catch (error) {
    console.error('Error getting distribution status statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve distribution status statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;