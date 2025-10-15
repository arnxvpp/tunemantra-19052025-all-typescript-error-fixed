/**
 * Rights Management API Routes
 * 
 * This module handles all rights management-related API endpoints, including:
 * - Rights registration and verification
 * - Rights record queries and filtering
 * - Dispute creation and resolution
 * - Territorial rights management
 * - Blockchain rights verification
 * 
 * These routes interact with the rights management service to perform
 * operations for tracking and verifying music rights.
 */

import express from 'express';
import { requireAuth } from '../auth';
import { rightsManagementService } from '../services/rights-management-service';
import { blockchainConnector } from '../services/blockchain-connector';
import { z } from 'zod';
import { checkSubscription } from '../middleware/role-based-access';

const router = express.Router();

// Schema for rights registration requests
const registerRightsSchema = z.object({
  assetId: z.string(),
  assetType: z.enum(['track', 'album', 'composition', 'sample', 'stem', 'remix']),
  rightsType: z.enum(['master', 'publishing', 'sync', 'mechanical', 'performance', 'derivative']),
  ownerType: z.enum(['artist', 'songwriter', 'producer', 'label', 'publisher', 'distributor']),
  ownerId: z.number(),
  ownerAddress: z.string().optional(),
  percentage: z.number().min(0.01).max(100),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).nullable().optional(),
  territories: z.array(z.string()).optional(),
  useBlockchain: z.boolean().default(false),
  blockchainNetworkId: z.string().optional(),
  contractId: z.string().optional(),
  userId: z.number()
});

// Schema for rights verification requests
const verifyRightsSchema = z.object({
  rightsId: z.number(),
  verifierId: z.number(),
  verificationMethod: z.enum(['blockchain', 'document', 'manual']),
  signature: z.string().optional(),
  ownerAddress: z.string().optional(),
  verificationData: z.record(z.any()).optional(),
  expiresAt: z.string().or(z.date()).nullable().optional(),
  useBlockchain: z.boolean().default(false),
  blockchainNetworkId: z.string().optional(),
  userId: z.number()
});

// Schema for rights dispute requests
const disputeRightsSchema = z.object({
  rightsId: z.number(),
  complainantId: z.number(),
  respondentId: z.number(),
  disputeType: z.enum(['ownership', 'percentage', 'territory', 'duration', 'other']),
  evidence: z.record(z.any()).optional(),
  userId: z.number()
});

// Schema for dispute resolution requests
const resolveDisputeSchema = z.object({
  disputeId: z.number(),
  resolution: z.string(),
  status: z.enum(['resolved', 'rejected']),
  resolvedById: z.number()
});

/**
 * GET /api/rights
 * 
 * Returns rights records with filtering and pagination
 * Supports filtering by assetId, ownerId, and more
 * Requires authentication
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const assetId = req.query.assetId as string;
    const ownerId = req.query.ownerId ? parseInt(req.query.ownerId as string) : undefined;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
    
    // If assetId is provided, get rights for that asset
    if (assetId) {
      const records = await rightsManagementService.getRightsRecordsByAssetId(assetId);
      return res.json(records);
    }
    
    // If ownerId is provided, get rights for that owner
    if (ownerId) {
      const records = await rightsManagementService.getRightsRecordsByOwnerId(ownerId);
      return res.json(records);
    }
    
    // If no specific filter, use pagination with default to current user's rights
    const queryParams: any = {
      page,
      pageSize,
      ownerId: userId,
      ...req.query
    };
    
    const result = await rightsManagementService.getRightsRecords(queryParams);
    res.json(result);
  } catch (error) {
    console.error('Error fetching rights records:', error);
    res.status(500).json({ error: 'Failed to fetch rights records' });
  }
});

/**
 * POST /api/rights
 * 
 * Registers a new rights record
 * Requires authentication and valid subscription
 */
router.post('/', requireAuth, checkSubscription, async (req, res) => {
  try {
    const parseResult = registerRightsSchema.safeParse({
      ...req.body,
      userId: req.user!.id
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
    
    const result = await rightsManagementService.registerRights({
      ...data,
      startDate,
      endDate
    });
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error registering rights:', error);
    res.status(500).json({ error: 'Failed to register rights' });
  }
});

/**
 * GET /api/rights/:id
 * 
 * Returns details for a specific rights record
 * Requires authentication
 */
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const rightsId = parseInt(req.params.id);
    if (isNaN(rightsId)) {
      return res.status(400).json({ error: 'Invalid rights ID' });
    }
    
    const rights = await rightsManagementService.getRightsRecordById(rightsId);
    if (!rights) {
      return res.status(404).json({ error: 'Rights record not found' });
    }
    
    res.json(rights);
  } catch (error) {
    console.error('Error fetching rights record:', error);
    res.status(500).json({ error: 'Failed to fetch rights record' });
  }
});

/**
 * POST /api/rights/:id/verify
 * 
 * Verifies a rights record
 * Requires authentication and valid subscription
 */
router.post('/:id/verify', requireAuth, checkSubscription, async (req, res) => {
  try {
    const rightsId = parseInt(req.params.id);
    if (isNaN(rightsId)) {
      return res.status(400).json({ error: 'Invalid rights ID' });
    }
    
    const parseResult = verifyRightsSchema.safeParse({
      ...req.body,
      rightsId,
      userId: req.user!.id
    });
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid rights verification data', 
        details: parseResult.error.format()
      });
    }
    
    const data = parseResult.data;
    
    // Parse expiresAt date if it's a string
    const expiresAt = data.expiresAt && typeof data.expiresAt === 'string' 
      ? new Date(data.expiresAt) 
      : data.expiresAt;
    
    const result = await rightsManagementService.verifyRights({
      ...data,
      expiresAt
    });
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error verifying rights:', error);
    res.status(500).json({ error: 'Failed to verify rights' });
  }
});

/**
 * POST /api/rights/:id/dispute
 * 
 * Creates a dispute for a rights record
 * Requires authentication and valid subscription
 */
router.post('/:id/dispute', requireAuth, checkSubscription, async (req, res) => {
  try {
    const rightsId = parseInt(req.params.id);
    if (isNaN(rightsId)) {
      return res.status(400).json({ error: 'Invalid rights ID' });
    }
    
    const parseResult = disputeRightsSchema.safeParse({
      ...req.body,
      rightsId,
      userId: req.user!.id
    });
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid rights dispute data', 
        details: parseResult.error.format()
      });
    }
    
    const result = await rightsManagementService.disputeRights(parseResult.data);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error creating dispute:', error);
    res.status(500).json({ error: 'Failed to create dispute' });
  }
});

/**
 * POST /api/rights/disputes/:id/resolve
 * 
 * Resolves a rights dispute
 * Requires authentication and admin rights
 */
router.post('/disputes/:id/resolve', requireAuth, async (req, res) => {
  try {
    const disputeId = parseInt(req.params.id);
    if (isNaN(disputeId)) {
      return res.status(400).json({ error: 'Invalid dispute ID' });
    }
    
    // Only admins or the rights owner should be able to resolve disputes
    if (req.user!.role !== 'admin' && req.user!.role !== 'superAdmin') {
      return res.status(403).json({ error: 'Unauthorized to resolve disputes' });
    }
    
    const parseResult = resolveDisputeSchema.safeParse({
      ...req.body,
      disputeId,
      resolvedById: req.user!.id
    });
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid dispute resolution data', 
        details: parseResult.error.format()
      });
    }
    
    const result = await rightsManagementService.resolveDispute(parseResult.data);
    
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error resolving dispute:', error);
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
});

/**
 * GET /api/rights/territories
 * 
 * Returns all available territories for rights registration
 * Requires authentication
 */
router.get('/territories', requireAuth, async (req, res) => {
  try {
    const territories = await rightsManagementService.getTerritories();
    res.json(territories);
  } catch (error) {
    console.error('Error fetching territories:', error);
    res.status(500).json({ error: 'Failed to fetch territories' });
  }
});

/**
 * GET /api/rights/blockchain/networks
 * 
 * Returns all available blockchain networks for rights verification
 * Requires authentication
 */
router.get('/blockchain/networks', requireAuth, async (req, res) => {
  try {
    const networks = blockchainConnector.getConfiguredNetworks().map(networkId => {
      const networkInfo = blockchainConnector.getNetworkInfo(networkId);
      return {
        id: networkId,
        name: networkInfo?.name || networkId,
        chainId: networkInfo?.chainId || 0,
        active: !!networkInfo
      };
    });
    
    res.json(networks);
  } catch (error) {
    console.error('Error fetching blockchain networks:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain networks' });
  }
});

/**
 * POST /api/rights/:id/blockchain-verify
 * 
 * Verifies a rights record using blockchain
 * Requires authentication and valid subscription
 */
router.post('/:id/blockchain-verify', requireAuth, checkSubscription, async (req, res) => {
  try {
    const rightsId = parseInt(req.params.id);
    if (isNaN(rightsId)) {
      return res.status(400).json({ error: 'Invalid rights ID' });
    }
    
    // Get the rights record to ensure it exists
    const rightsRecord = await rightsManagementService.getRightsRecordById(rightsId);
    if (!rightsRecord) {
      return res.status(404).json({ error: 'Rights record not found' });
    }
    
    // Validate request parameters
    const schema = z.object({
      networkId: z.string(),
      verifierAddress: z.string(),
      signature: z.string(),
    });
    
    const parseResult = schema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid blockchain verification data', 
        details: parseResult.error.format()
      });
    }
    
    const { networkId, verifierAddress, signature } = parseResult.data;
    
    // Call blockchain connector to verify rights
    const result = await blockchainConnector.verifyRights(
      networkId,
      rightsId,
      verifierAddress,
      signature,
      req.user!.id
    );
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Rights verified on blockchain successfully',
        transactionHash: result.transactionHash,
        verificationStatus: result.verificationStatus
      });
    } else {
      res.status(400).json({ 
        success: false,
        error: result.error || 'Failed to verify rights on blockchain'
      });
    }
  } catch (error) {
    console.error('Error verifying rights on blockchain:', error);
    res.status(500).json({ error: 'Failed to verify rights on blockchain' });
  }
});

/**
 * GET /api/rights/:id/blockchain-info
 * 
 * Gets blockchain information for a specific rights record
 * Requires authentication
 */
router.get('/:id/blockchain-info', requireAuth, async (req, res) => {
  try {
    const rightsId = parseInt(req.params.id);
    if (isNaN(rightsId)) {
      return res.status(400).json({ error: 'Invalid rights ID' });
    }
    
    // Get the rights record to ensure it exists
    const rightsRecord = await rightsManagementService.getRightsRecordById(rightsId);
    if (!rightsRecord) {
      return res.status(404).json({ error: 'Rights record not found' });
    }
    
    // If the rights record doesn't have blockchain info, return appropriate response
    if (!rightsRecord.blockchainNetworkId) {
      return res.json({
        success: true,
        hasBlockchainInfo: false,
        message: 'This rights record is not registered on the blockchain'
      });
    }
    
    // Get blockchain info from blockchain connector
    const blockchainInfo = await blockchainConnector.getRightsInfo(
      rightsRecord.blockchainNetworkId,
      rightsId
    );
    
    if (blockchainInfo.success && blockchainInfo.data) {
      res.json({
        success: true,
        hasBlockchainInfo: true,
        blockchainNetworkId: rightsRecord.blockchainNetworkId,
        data: blockchainInfo.data,
        verificationStatus: rightsRecord.verificationStatus
      });
    } else {
      res.json({
        success: true,
        hasBlockchainInfo: false,
        blockchainNetworkId: rightsRecord.blockchainNetworkId,
        message: blockchainInfo.error || 'No blockchain information available',
        verificationStatus: rightsRecord.verificationStatus
      });
    }
  } catch (error) {
    console.error('Error getting blockchain information:', error);
    res.status(500).json({ error: 'Failed to get blockchain information' });
  }
});

export default router;