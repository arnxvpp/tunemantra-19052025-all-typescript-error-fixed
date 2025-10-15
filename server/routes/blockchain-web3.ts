/**
 * Blockchain Web3 API Routes
 * 
 * This module handles Web3-specific blockchain operations, including:
 * - Rights registration on blockchain
 * - Rights verification on blockchain
 * - Network information and connection
 * 
 * These routes complement the existing blockchain routes and rights management
 * routes by providing a simple interface for Web3 wallet-based operations.
 */

import express from 'express';
import { requireAuth } from '../auth';
import { blockchainConnector } from '../services/blockchain-connector';
import { rightsManagementService } from '../services/rights-management-service';
import { z } from 'zod';
import { checkSubscription } from '../middleware/role-based-access';

const router = express.Router();

// Schema for rights registration requests via Web3
const registerRightsSchema = z.object({
  assetId: z.string(),
  assetType: z.enum(['track', 'album', 'composition', 'sample', 'stem', 'remix']),
  rightsType: z.enum(['master', 'publishing', 'sync', 'mechanical', 'performance', 'derivative']),
  ownerType: z.enum(['artist', 'songwriter', 'producer', 'label', 'publisher', 'distributor']),
  ownerId: z.number().optional(),
  walletAddress: z.string(),
  networkId: z.string(),
  percentage: z.number().min(0.01).max(100),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).nullable().optional(),
  territories: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional().default({}),
});

// Schema for rights verification requests via Web3
const verifyRightsSchema = z.object({
  rightsId: z.number(),
  walletAddress: z.string(),
  networkId: z.string(),
  signature: z.string().optional(),
  verificationData: z.record(z.any()).optional().default({}),
});

/**
 * POST /api/blockchain/register-rights
 * 
 * Registers rights on blockchain using wallet
 * Requires authentication and valid subscription
 */
router.post('/register-rights', requireAuth, checkSubscription, async (req, res) => {
  try {
    const parseResult = registerRightsSchema.safeParse({
      ...req.body,
    });
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid rights registration data', 
        details: parseResult.error.format()
      });
    }
    
    const data = parseResult.data;
    
    // Parse dates if they are strings
    const startDate = typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate;
    const endDate = data.endDate ? (typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate) : null;
    
    // If no ownerId is provided, use the authenticated user's ID
    const ownerId = data.ownerId || req.user!.id;
    
    // Register rights in the blockchain
    const result = await blockchainConnector.registerRights(
      data.networkId,
      data.assetId,
      data.assetType,
      data.rightsType,
      data.ownerType,
      data.walletAddress,
      data.percentage,
      startDate,
      endDate,
      data.territories || [],
      ownerId,
      req.user!.id
    );
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({ 
        success: false,
        error: result.error || 'Failed to register rights on blockchain'
      });
    }
  } catch (error: any) {
    console.error('Error registering rights on blockchain:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to register rights on blockchain'
    });
  }
});

/**
 * POST /api/blockchain/verify-rights
 * 
 * Verifies rights on blockchain using wallet
 * Requires authentication
 */
router.post('/verify-rights', requireAuth, async (req, res) => {
  try {
    const parseResult = verifyRightsSchema.safeParse({
      ...req.body,
    });
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid rights verification data', 
        details: parseResult.error.format()
      });
    }
    
    const data = parseResult.data;
    
    // Verify the rights record exists
    const rightsRecord = await rightsManagementService.getRightsRecordById(data.rightsId);
    if (!rightsRecord) {
      return res.status(404).json({ 
        success: false,
        error: 'Rights record not found'
      });
    }
    
    // Verify rights on blockchain
    const result = await blockchainConnector.verifyRights(
      data.networkId,
      data.rightsId,
      data.walletAddress,
      data.signature || '',
      req.user!.id
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        verified: result.verificationStatus === 'verified',
        message: 'Rights verification complete',
        transactionHash: result.transactionHash,
        verificationStatus: result.verificationStatus
      });
    } else {
      res.status(400).json({ 
        success: false,
        verified: false,
        error: result.error || 'Failed to verify rights on blockchain'
      });
    }
  } catch (error: any) {
    console.error('Error verifying rights on blockchain:', error);
    res.status(500).json({ 
      success: false,
      verified: false,
      error: error.message || 'Failed to verify rights on blockchain'
    });
  }
});

export default router;