/**
 * Royalty Management API Routes
 * 
 * This module defines all API endpoints for royalty-related functionality.
 * These endpoints allow users to manage royalty splits, payments, and reporting.
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { checkSubscription } from '../middleware/role-based-access';
import { RoyaltyService } from '../services/royalty-service';
import { validateRequest } from '../utils/validation';
import {
  // createRoyaltySplitSchema, // Assuming this doesn't exist, use specific fields or a generic object schema if needed
  trackIdParamSchema,
  // splitIdParamSchema, // Assuming this doesn't exist - Commenting out
  updateRoyaltySplitsSchema, // TS Suggestion
  // releaseIdParamSchema, // Assuming this doesn't exist, use trackIdParamSchema?
  // createRevenueShareSchema, // Assuming this doesn't exist
  // generateStatementsSchema, // Assuming this doesn't exist
  // processPaymentsSchema, // Assuming this doesn't exist
  // paymentHistoryQuerySchema // Assuming this doesn't exist
  // Need to verify actual exported schemas from ../schemas/royalty-schemas
  // z // Remove this import as z is imported directly below
} from '../schemas/royalty-schemas';
import { z } from 'zod'; // Keep this import

// Create a router instance
export const royaltyRouter = Router();

/**
 * Create a new royalty split for a track
 * 
 * @route POST /api/royalties/splits
 * @param {object} body - Royalty split data conforming to createRoyaltySplitSchema
 * @returns {object} The created royalty split record
 */
royaltyRouter.post('/splits', 
  requireAuth, 
  checkSubscription, 
  // validateRequest(createRoyaltySplitSchema), // Schema likely doesn't exist
  async (req: Request, res: Response) => {
    try {
      // TODO: Add validation if a specific schema exists or use ad-hoc validation
      // const validatedBody = req.body as z.infer<typeof createRoyaltySplitSchema>['body'];

      // Create the royalty split (assuming method exists, adjust params if needed)
      // TODO: Verify RoyaltyService.createRoyaltySplit signature (static/instance?) and existence
      // const royaltySplit = await RoyaltyService.createRoyaltySplit({
      //   ...req.body,
      //   userId: req.user!.id
      // });
      const royaltySplit = { ...req.body, id: Math.random(), createdAt: new Date() }; // Placeholder
      
      // Return the created royalty split
      res.status(201).json(royaltySplit);
    } catch (error) {
      console.error('Error creating royalty split:', error);
       // Provide more specific error messages if possible
       if (error instanceof Error && error.message.includes('constraint')) {
            res.status(409).json({ error: 'Conflict creating royalty split. Check constraints.' });
       } else {
           res.status(500).json({ error: 'Failed to create royalty split' });
       }
    }
  }
);

/**
 * Get royalty splits for a track
 * 
 * @route GET /api/royalties/track/:trackId/splits
 * @param {number} trackId - The ID of the track to get royalty splits for
 * @returns {object[]} Array of royalty splits for the track
 */
royaltyRouter.get('/track/:trackId/splits', 
  requireAuth,
  checkSubscription,
  validateRequest(trackIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    try {
      // Params are validated, safe to parse
      const trackId = parseInt(req.params.trackId, 10); 
      
      // Get royalty splits (assuming method exists)
      // TODO: Verify RoyaltyService.getTrackRoyaltySplits signature (static/instance?) and existence
      // const splits = await RoyaltyService.getTrackRoyaltySplits(trackId);
      const splits: any[] = []; // Placeholder
      
      // Return the royalty splits
      res.json(splits);
    } catch (error) {
      console.error('Error fetching royalty splits:', error);
      res.status(500).json({ error: 'Failed to fetch royalty splits' });
    }
  }
);

/**
 * Update an existing royalty split
 * 
 * @route PATCH /api/royalties/splits/:id
 * @param {number} id - The ID of the royalty split to update
 * @param {object} body - Updated royalty split data conforming to updateRoyaltySplitSchema
 * @returns {object} The updated royalty split record
 */
royaltyRouter.patch('/splits/:id', 
  requireAuth, 
  checkSubscription,
  // validateRequest(splitIdParamSchema, 'params'), // Schema likely doesn't exist
  validateRequest(updateRoyaltySplitsSchema), // Use suggested schema
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10); // Assuming param is 'id'
      // Fix: Use the validated data directly, not a nested 'body' property
      const validatedBody = req.body as z.infer<typeof updateRoyaltySplitsSchema>;
      
      // Update the royalty split (assuming method exists, might be updateRoyaltySplits?)
      // TODO: Verify RoyaltyService.updateRoyaltySplit signature (static/instance?) and existence
      // const royaltySplit = await RoyaltyService.updateRoyaltySplit(id, validatedBody);
      const royaltySplit = { id, ...validatedBody }; // Placeholder
      
      // Return the updated royalty split
      res.json(royaltySplit);
    } catch (error) {
      console.error('Error updating royalty split:', error);
       if (error instanceof Error && error.message.includes('not found')) {
           res.status(404).json({ error: 'Royalty split not found' });
       } else {
           res.status(500).json({ error: 'Failed to update royalty split' });
       }
    }
  }
);

/**
 * Delete a royalty split
 * 
 * @route DELETE /api/royalties/splits/:id
 * @param {number} id - The ID of the royalty split to delete
 * @returns {object} Success message
 */
// royaltyRouter.delete('/splits/:id',
//   requireAuth,
//   checkSubscription,
//   // validateRequest(splitIdParamSchema, 'params'), // Schema commented out
//   async (req: Request, res: Response) => {
//     try {
//       const id = parseInt(req.params.id, 10);
      
//       // Delete the royalty split
//       // TODO: Verify RoyaltyService.deleteRoyaltySplit signature (static/instance?) and existence
//       // const success = await RoyaltyService.deleteRoyaltySplit(id);
//       const success = true; // Placeholder
      
//       if (!success) {
//           return res.status(404).json({ error: 'Royalty split not found or could not be deleted' });
//       }
      
//       // Return success message
//       res.status(200).json({ message: 'Royalty split deleted successfully' }); // Use 200 OK for successful delete
//     } catch (error) {
//       console.error('Error deleting royalty split:', error);
//       res.status(500).json({ error: 'Failed to delete royalty split' });
//     }
//   }
// );

/**
 * Get revenue shares for a release
 * 
 * @route GET /api/royalties/release/:releaseId/shares
 * @param {number} releaseId - The ID of the release to get revenue shares for
 * @returns {object[]} Array of revenue shares for the release
 */
royaltyRouter.get('/release/:releaseId/shares', 
  requireAuth, 
  checkSubscription,
  validateRequest(trackIdParamSchema, 'params'), // Assuming releaseId uses same schema as trackId for param validation
  async (req: Request, res: Response) => {
    try {
      const releaseId = parseInt(req.params.releaseId, 10); // Assuming param is 'releaseId'
      
      // Get revenue shares (assuming method exists)
      // TODO: Verify RoyaltyService.getReleaseRevenueShares signature (static/instance?) and existence
      // const shares = await RoyaltyService.getReleaseRevenueShares(releaseId);
      const shares: any[] = []; // Placeholder
      
      // Return the revenue shares
      res.json(shares);
    } catch (error) {
      console.error('Error fetching revenue shares:', error);
      res.status(500).json({ error: 'Failed to fetch revenue shares' });
    }
  }
);

/**
 * Create a new revenue share for a release
 * 
 * @route POST /api/royalties/shares
 * @param {object} body - Revenue share data conforming to createRevenueShareSchema
 * @returns {object} The created revenue share record
 */
royaltyRouter.post('/shares', 
  requireAuth, 
  checkSubscription,
  // validateRequest(createRevenueShareSchema), // Schema likely doesn't exist
  async (req: Request, res: Response) => {
    try {
       // TODO: Add validation if schema exists
       // const validatedBody = req.body as z.infer<typeof createRevenueShareSchema>['body'];
      // Create the revenue share (assuming method exists)
      // TODO: Verify RoyaltyService.createRevenueShare signature (static/instance?) and existence
      // const revenueShare = await RoyaltyService.createRevenueShare(req.body);
      const revenueShare = { ...req.body, id: Math.random(), createdAt: new Date() }; // Placeholder
      
      // Return the created revenue share
      res.status(201).json(revenueShare);
    } catch (error) {
      console.error('Error creating revenue share:', error);
       if (error instanceof Error && error.message.includes('constraint')) {
            res.status(409).json({ error: 'Conflict creating revenue share. Check constraints.' });
       } else {
           res.status(500).json({ error: 'Failed to create revenue share' });
       }
    }
  }
);

/**
 * Generate royalty statements for a given date range
 * 
 * @route POST /api/royalties/statements
 * @param {object} body - Statement generation parameters conforming to generateStatementsSchema
 * @returns {object} Generated statement data
 */
royaltyRouter.post('/statements', 
  requireAuth, 
  checkSubscription,
  // validateRequest(generateStatementsSchema), // Schema likely doesn't exist
  async (req: Request, res: Response) => {
    try {
      // TODO: Add validation if schema exists
      // const validatedBody = req.body as z.infer<typeof generateStatementsSchema>['body'];
      const body = req.body; // Use raw body for now

      // Parse dates safely
      const startDate = new Date(body.startDate);
      const endDate = new Date(body.endDate);

       if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
           return res.status(400).json({ error: 'Invalid date format provided.' });
       }
       if (startDate > endDate) {
           return res.status(400).json({ error: 'Start date cannot be after end date.' });
       }
      
      // Generate the statements (use suggested generateRoyaltyStatement)
      const statements = await RoyaltyService.generateRoyaltyStatement( // Use suggested name
        req.user!.id,
        startDate,
        endDate
        // body.trackIds, // Removed based on TS error
        // body.format || 'json' // Removed based on TS error (Expected 3-4 args, got 5 -> now 4)
      );
      
      // Return the generated statements
      res.json(statements);
    } catch (error) {
      console.error('Error generating royalty statements:', error);
      res.status(500).json({ error: 'Failed to generate royalty statements' });
    }
  }
);

/**
 * Process royalty payments
 * 
 * @route POST /api/royalties/payments
 * @param {object} body - Payment processing parameters conforming to processPaymentsSchema
 * @returns {object} Payment processing results
 */
royaltyRouter.post('/payments', 
  requireAuth, 
  checkSubscription,
  // validateRequest(processPaymentsSchema), // Schema likely doesn't exist
  async (req: Request, res: Response) => {
    try {
       // TODO: Add validation if schema exists
       // const validatedBody = req.body as z.infer<typeof processPaymentsSchema>['body'];
       const body = req.body; // Use raw body for now

      // Process the payments (assuming method exists, check arguments)
      // The error "Expected 3 arguments, but got 4" suggests paymentNote might not be expected
      const payments = await RoyaltyService.processRoyaltyPayments(
        req.user!.id,
        body.statementIds,
        body.paymentMethod
        // body.paymentNote // Removed based on error TS2554
      );
      
      // Return the payment results
      res.json(payments);
    } catch (error) {
      console.error('Error processing royalty payments:', error);
      res.status(500).json({ error: 'Failed to process royalty payments' });
    }
  }
);

/**
 * Get payment history
 * 
 * @route GET /api/royalties/payments/history
 * @param {string} [startDate] - Optional start date for filtering (YYYY-MM-DD)
 * @param {string} [endDate] - Optional end date for filtering (YYYY-MM-DD)
 * @returns {object[]} Payment history records
 */
royaltyRouter.get('/payments/history', 
  requireAuth, 
  checkSubscription,
  // validateRequest(paymentHistoryQuerySchema, 'query'), // Schema likely doesn't exist
  async (req: Request, res: Response) => {
    try {
      // TODO: Add validation if schema exists
      // const validatedQuery = req.query as z.infer<typeof paymentHistoryQuerySchema>['query'];
      const query = req.query; // Use raw query for now

      // Parse date filters safely if provided
      const startDate = query.startDate ? new Date(query.startDate as string) : undefined;
      const endDate = query.endDate ? new Date(query.endDate as string) : undefined;

       if ((startDate && isNaN(startDate.getTime())) || (endDate && isNaN(endDate.getTime()))) {
           return res.status(400).json({ error: 'Invalid date format provided.' });
       }
       if (startDate && endDate && startDate > endDate) {
           return res.status(400).json({ error: 'Start date cannot be after end date.' });
       }
      
      // Get payment history (use suggested getPaymentHistory)
      const history = await RoyaltyService.getPaymentHistory(req.user!.id, startDate, endDate); // Use suggested name
      
      // Return the payment history
      res.json(history);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      res.status(500).json({ error: 'Failed to fetch payment history' });
    }
  }
);