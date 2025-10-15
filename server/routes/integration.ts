/**
 * Integration Routes
 * 
 * These routes handle the integration between different components of the platform,
 * particularly the connection between distribution, royalty calculations, and analytics.
 */

import { Router } from 'express';
import { requireAuth } from '../auth';
import { IntegrationService } from '../services/integration-service';
import { validateRequest } from '../utils/validation';
import { 
  distributionIdParamSchema, 
  batchIntegrationSchema, 
  statusChangeSchema, 
  integrationStatusQuerySchema 
} from '../schemas/integration-schemas';

const router = Router();

/**
 * Trigger distribution-to-royalty integration manually
 * 
 * This allows admins to manually trigger the integration flow for a specific
 * distribution record, useful for testing or fixing issues.
 */
router.post(
  '/process/:distributionId', 
  requireAuth, 
  validateRequest(distributionIdParamSchema, 'params'),
  async (req, res) => {
    try {
      const distributionId = parseInt(req.params.distributionId);
      
      // Process the integration
      const result = await IntegrationService.processDistributionRoyaltyIntegration(distributionId);
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Error processing integration:', error);
      return res.status(500).json({ 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
);

/**
 * Process batch integration for multiple distribution records
 * 
 * This endpoint allows processing multiple distribution records at once,
 * useful for bulk operations or catching up after system downtime.
 */
router.post(
  '/process-batch', 
  requireAuth, 
  validateRequest(batchIntegrationSchema),
  async (req, res) => {
    try {
      const { 
        userId, 
        startDate, 
        endDate, 
        status, 
        platformId, 
        limit 
      } = req.body;
      
      // Validate user's permissions - only admins can process for all users
      const isProcessingForOthers = userId && userId !== req.user?.id;
      if (isProcessingForOthers && !req.user?.isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to process records for other users' 
        });
      }
      
      // Convert date strings to Date objects if provided
      const parsedOptions: any = {
        userId: userId || req.user?.id,
        status,
        platformId,
        limit
      };
      
      if (startDate) {
        parsedOptions.startDate = new Date(startDate);
      }
      
      if (endDate) {
        parsedOptions.endDate = new Date(endDate);
      }
      
      // Process the batch integration
      const result = await IntegrationService.processBatchIntegration(parsedOptions);
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Error processing batch integration:', error);
      return res.status(500).json({ 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
);

/**
 * Handle distribution status change
 * 
 * This endpoint is called when a distribution record changes status,
 * triggering appropriate actions in other systems.
 */
router.post(
  '/status-change', 
  requireAuth, 
  validateRequest(statusChangeSchema),
  async (req, res) => {
    try {
      const { distributionId, oldStatus, newStatus, details } = req.body;
      
      // Process the status change
      const result = await IntegrationService.processDistributionStatusChange({
        distributionId,
        oldStatus: oldStatus || 'unknown',
        newStatus,
        details
      });
      
      return res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      console.error('Error processing status change:', error);
      return res.status(500).json({ 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
);

/**
 * Get distribution-to-royalty integration status
 * 
 * This endpoint provides an overview of the integration state between 
 * distribution and royalty systems, showing pending and completed integrations.
 */
router.get(
  '/status', 
  requireAuth, 
  validateRequest(integrationStatusQuerySchema, 'query'),
  async (req, res) => {
    try {
      // Check if user is admin - only admins can see global status
      if (!req.user?.isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'Only administrators can view global integration status' 
        });
      }
      
      // Get the integration status
      const status = await IntegrationService.getIntegrationStatus();
      
      return res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting integration status:', error);
      return res.status(500).json({ 
        success: false, 
        message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    }
  }
);

export default router;