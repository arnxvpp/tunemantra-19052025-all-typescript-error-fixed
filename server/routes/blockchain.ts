/**
 * Blockchain API Routes
 * 
 * This module handles all blockchain-related API endpoints, including:
 * - Network information retrieval
 * - NFT token minting and querying
 * - Blockchain transaction history
 * 
 * These routes interact with the blockchain connector service to perform
 * operations on various blockchain networks like Ethereum, Polygon, etc.
 */

import express from 'express';
import { requireAuth } from '../auth';
import { blockchainConnector } from '../services/blockchain-connector';
import { rightsManagementService } from '../services/rights-management-service';
import { z } from 'zod';
import { checkSubscription } from '../middleware/role-based-access';

const router = express.Router();

// Schema for minting NFT requests
const mintNFTSchema = z.object({
  assetId: z.string(),
  ownerAddress: z.string(),
  metadata: z.record(z.any()).optional().default({}),
  networkId: z.string(),
  userId: z.number()
});

// Schema for token details requests
const tokenDetailsSchema = z.object({
  networkId: z.string(),
  tokenId: z.string()
});

/**
 * GET /api/blockchain/networks
 * 
 * Returns information about all configured blockchain networks
 * Requires authentication
 */
router.get('/networks', requireAuth, async (req, res) => {
  try {
    const networks = blockchainConnector.getConfiguredNetworks();
    const networkInfo = networks.map(networkId => ({
      id: networkId,
      ...blockchainConnector.getNetworkInfo(networkId),
    }));
    
    res.json(networkInfo);
  } catch (error) {
    console.error('Error fetching blockchain networks:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain networks' });
  }
});

/**
 * GET /api/blockchain/networks/:networkId
 * 
 * Returns information about a specific blockchain network
 * Requires authentication
 */
router.get('/networks/:networkId', requireAuth, async (req, res) => {
  try {
    const networkId = req.params.networkId;
    const networkInfo = blockchainConnector.getNetworkInfo(networkId);
    
    if (!networkInfo) {
      return res.status(404).json({ error: `Network ${networkId} not found` });
    }
    
    res.json({ id: networkId, ...networkInfo });
  } catch (error) {
    console.error('Error fetching blockchain network info:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain network info' });
  }
});

/**
 * GET /api/blockchain/transactions
 * 
 * Returns blockchain transactions for the authenticated user
 * Supports pagination with limit parameter
 * Requires authentication and valid subscription
 */
router.get('/transactions', requireAuth, checkSubscription, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    const transactions = await rightsManagementService.getBlockchainTransactionsByUserId(userId, limit);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching blockchain transactions:', error);
    res.status(500).json({ error: 'Failed to fetch blockchain transactions' });
  }
});

/**
 * POST /api/blockchain/nfts/mint
 * 
 * Mints a new NFT token for the specified asset
 * Requires authentication and valid subscription
 */
router.post('/nfts/mint', requireAuth, checkSubscription, async (req, res) => {
  try {
    const parseResult = mintNFTSchema.safeParse({
      ...req.body,
      userId: req.user!.id
    });
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid NFT minting data', 
        details: parseResult.error.format()
      });
    }
    
    const result = await rightsManagementService.mintNFT(parseResult.data);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error minting NFT:', error);
    res.status(500).json({ error: 'Failed to mint NFT' });
  }
});

/**
 * GET /api/blockchain/nfts/:tokenId
 * 
 * Returns details for a specific NFT token
 * Requires authentication
 */
router.get('/nfts/:tokenId', requireAuth, async (req, res) => {
  try {
    const tokenId = req.params.tokenId;
    const networkId = req.query.networkId as string;
    
    if (!networkId) {
      return res.status(400).json({ error: 'Network ID is required' });
    }
    
    const parseResult = tokenDetailsSchema.safeParse({
      networkId,
      tokenId
    });
    
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: 'Invalid token details request', 
        details: parseResult.error.format()
      });
    }
    
    const result = await blockchainConnector.getTokenDetails(networkId, tokenId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error fetching NFT details:', error);
    res.status(500).json({ error: 'Failed to fetch NFT details' });
  }
});

/**
 * GET /api/blockchain/nfts
 * 
 * Returns all NFT tokens for the authenticated user
 * Can filter by assetId with query parameter
 * Requires authentication
 */
router.get('/nfts', requireAuth, async (req, res) => {
  try {
    const assetId = req.query.assetId as string;
    const userId = req.user!.id;
    
    let tokens;
    if (assetId) {
      tokens = await rightsManagementService.getNFTTokensByAssetId(assetId);
    } else {
      tokens = await rightsManagementService.getBlockchainTransactionsByUserId(userId);
    }
    
    res.json(tokens);
  } catch (error) {
    console.error('Error fetching NFT tokens:', error);
    res.status(500).json({ error: 'Failed to fetch NFT tokens' });
  }
});

export default router;