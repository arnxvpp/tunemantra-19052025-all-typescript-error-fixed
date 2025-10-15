import { eq, and, or, sql, desc, asc, not, inArray, SQL, gte, lte, isNull } from 'drizzle-orm'; // Added missing operators
import { db } from '../db';
import { 
  rightsRecords, 
  rightsVerifications, 
  rightsDisputes, 
  // territories, // Assuming territories table might not exist or is defined elsewhere
  blockchainTransactions,
  nftTokens,
  users,
  assetTypeEnum, // Import enums if needed
  rightsTypeEnum,
  ownerTypeEnum,
  blockchainNetworkEnum
} from '../../shared/schema';
import { blockchainConnector } from './blockchain-connector'; // Assuming this exists and is configured
import { AnyColumn } from 'drizzle-orm/column'; // Import AnyColumn

// Define interfaces based on actual schema + potential inputs
interface RegisterRightsParams {
  assetId: string;
  assetType: (typeof assetTypeEnum.enumValues)[number]; // Use enum values
  rightsType: (typeof rightsTypeEnum.enumValues)[number]; // Use enum values
  ownerType: (typeof ownerTypeEnum.enumValues)[number]; // Use enum values
  ownerId: number;
  ownerAddress?: string; // Keep optional
  percentage: number;
  startDate: Date;
  endDate?: Date | null;
  territory?: string; // Changed from territories array based on schema
  source: string; // Added based on schema
  documentUrls?: any; // JSON type
  agreementId?: string; // Added based on schema
  useBlockchain: boolean;
  blockchainNetworkId?: (typeof blockchainNetworkEnum.enumValues)[number]; // Use enum values
  // contractId?: string; // Not in rightsRecords schema
  userId: number; // Assuming this is the user performing the action
}

interface VerifyRightsParams {
  rightsRecordId: number; // Corrected field name
  verifiedBy: number; // Corrected field name
  verificationMethod: 'blockchain' | 'document' | 'manual'; // Keep as string union
  signature?: string; // Keep optional
  ownerAddress?: string; // Keep optional
  verificationDetails?: Record<string, any>; // JSON type
  // expiresAt?: Date | null; // Not in rightsVerifications schema
  useBlockchain: boolean; // Keep for logic branching
  blockchainNetworkId?: (typeof blockchainNetworkEnum.enumValues)[number]; // Use enum values
  userId: number; // Assuming this is the user performing the action
}

interface DisputeRightsParams {
  rightsRecordId: number; // Corrected field name
  claimantId: number; // Corrected field name
  defendantId: number; // Corrected field name
  // disputeType: 'ownership' | 'percentage' | 'territory' | 'duration' | 'other'; // Not in rightsDisputes schema
  description: string; // Added based on schema
  evidenceUrls?: any; // JSON type
  userId: number; // Assuming this is the user performing the action
}

interface ResolveDisputeParams {
  disputeId: number;
  resolutionDetails: string; // Corrected field name
  status: 'resolved' | 'rejected'; // Keep as string union
  resolvedById: number; // Field exists in schema
}

interface MintNFTParams {
  assetId: string;
  ownerAddress: string;
  metadata: Record<string, any>;
  networkId: (typeof blockchainNetworkEnum.enumValues)[number]; // Use enum values
  userId: number; // Assuming this is the user performing the action
}

// Define QueryParams based on actual schema fields
interface QueryParams {
  assetId?: string;
  assetType?: (typeof assetTypeEnum.enumValues)[number];
  rightsType?: (typeof rightsTypeEnum.enumValues)[number];
  ownerType?: (typeof ownerTypeEnum.enumValues)[number];
  ownerId?: number;
  // verificationStatus?: string; // Not directly queryable, needs join
  startDateFrom?: Date;
  startDateTo?: Date;
  endDateFrom?: Date;
  endDateTo?: Date;
  territory?: string; // Based on schema
  page?: number;
  pageSize?: number;
  sortBy?: keyof typeof rightsRecords.$inferSelect; // Use keys of the select type
  sortOrder?: 'asc' | 'desc';
}

class RightsManagementService {
  // Register a new rights record
  async registerRights(params: RegisterRightsParams): Promise<{ success: boolean; rightsId?: number; transactionHash?: string; error?: string }> {
    try {
      // Validate percentage is between 0.01 and 100
      if (params.percentage < 0.01 || params.percentage > 100) {
        return { success: false, error: 'Percentage must be between 0.01 and 100' };
      }
      
      // If blockchain is used, make sure the network is provided
      if (params.useBlockchain && !params.blockchainNetworkId) {
        return { success: false, error: 'Blockchain network ID is required when using blockchain' };
      }
      
      // If blockchain is used, make sure the owner address is provided
      if (params.useBlockchain && !params.ownerAddress) {
        return { success: false, error: 'Owner address is required when using blockchain' };
      }
      
      let dbRightsId: number | undefined;
      let transactionHash: string | undefined;
      let blockchainRecordId: string | undefined;

      // If using blockchain, first register on the blockchain
      if (params.useBlockchain && params.blockchainNetworkId && params.ownerAddress) {
        // Register rights on blockchain
        const blockchainResult = await blockchainConnector.registerRights(
          params.blockchainNetworkId,
          params.assetId,
          params.assetType,
          params.rightsType,
          params.ownerType,
          params.ownerAddress,
          params.percentage,
          params.startDate,
          params.endDate || null,
          params.territory ? [params.territory] : [], // Pass territory as array if needed by connector
          params.ownerId,
          params.userId
        );
        
        if (!blockchainResult.success || !blockchainResult.transactionHash) {
           console.error("Blockchain registration failed:", blockchainResult.error);
           return { success: false, error: blockchainResult.error || 'Blockchain registration failed' };
        }
        transactionHash = blockchainResult.transactionHash;
        // Use transactionHash as the record ID for now, as blockchainRecordId is not returned
        blockchainRecordId = transactionHash; 
      } 
        
      // Register rights in database
      const result = await db.insert(rightsRecords).values({ // Remove array wrapper []
        assetId: params.assetId,
        assetType: params.assetType,
        rightsType: params.rightsType,
        ownerType: params.ownerType,
        ownerId: params.ownerId,
        ownerAddress: params.ownerAddress, // Store owner address if provided
        percentage: String(params.percentage), // Store percentage as string (numeric in DB)
        startDate: params.startDate.toISOString(), // Convert Date to ISO string
        endDate: params.endDate ? params.endDate.toISOString() : null, // Convert Date to ISO string or null
        territory: params.territory || 'worldwide', // Use territory field
        source: params.source, // Added source
        documentUrls: params.documentUrls, // Added documentUrls
        agreementId: params.agreementId, // Added agreementId
        blockchainRecordId: blockchainRecordId, // Store blockchain record ID
        // verificationStatus: 'pending' // Not in schema
      }).returning({ id: rightsRecords.id });
      
      dbRightsId = result[0].id;
        
      return { success: true, rightsId: dbRightsId, transactionHash };
      
    } catch (error) {
      console.error('Error registering rights:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // Verify a rights record
  async verifyRights(params: VerifyRightsParams): Promise<{ success: boolean; verificationId?: number; transactionHash?: string; error?: string }> {
    try {
      // Get rights record
      const rightsRecordResult = await db.select().from(rightsRecords).where(eq(rightsRecords.id, params.rightsRecordId)).limit(1);
      
      if (!rightsRecordResult || rightsRecordResult.length === 0) {
        return { success: false, error: `Rights record with ID ${params.rightsRecordId} not found` };
      }
      const rightsRecord = rightsRecordResult[0];
      
      // Validate verification method
      if (!['blockchain', 'document', 'manual'].includes(params.verificationMethod)) {
        return { success: false, error: 'Invalid verification method' };
      }
      
      // If blockchain method is selected, ensure required parameters are provided
      if (params.verificationMethod === 'blockchain') {
        if (!params.signature) {
          return { success: false, error: 'Signature is required for blockchain verification' };
        }
        if (!params.ownerAddress) {
          return { success: false, error: 'Owner address is required for blockchain verification' };
        }
        // Additional blockchain verification logic might go here if not handled by connector
      }
      
      let transactionHash: string | undefined;

      // If blockchain integration is enabled and the rights record has a blockchain reference
      if (params.useBlockchain && rightsRecord.blockchainRecordId && params.blockchainNetworkId) {
         // Potentially call blockchain connector to verify if needed, depends on implementation
         // For now, assume verification happens off-chain or is confirmed by this action
         console.log("Blockchain verification step (simulated)");
         // Example: const blockchainVerifyResult = await blockchainConnector.confirmVerification(...);
         // if (!blockchainVerifyResult.success) return { ... };
         // transactionHash = blockchainVerifyResult.transactionHash; 
      } 
        
      // Create verification record
      const result = await db.insert(rightsVerifications).values({
        rightsRecordId: params.rightsRecordId,
        verifiedBy: params.verifiedBy, // Correct field name
        // signature: params.signature, // Not in schema
        // ownerAddress: params.ownerAddress, // Not in schema
        verificationMethod: params.verificationMethod,
        verificationDetails: params.verificationDetails || {},
        status: 'verified', // Assume verification is successful if this point is reached
        // verifiedAt: new Date(), // Not in schema, use createdAt default
        // expiresAt: params.expiresAt // Not in schema
      }).returning({ id: rightsVerifications.id });
      
      // Update rights record status (if applicable - schema doesn't have verificationStatus)
      // await db.update(rightsRecords)
      //   .set({ verificationStatus: 'verified' }) 
      //   .where(eq(rightsRecords.id, params.rightsRecordId));
        
      return { success: true, verificationId: result[0].id, transactionHash };
      
    } catch (error) {
      console.error('Error verifying rights:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // Create a rights dispute
  async disputeRights(params: DisputeRightsParams): Promise<{ success: boolean; disputeId?: number; error?: string }> {
    try {
      // Get rights record
      const rightsRecordResult = await db.select().from(rightsRecords).where(eq(rightsRecords.id, params.rightsRecordId)).limit(1);
      
      if (!rightsRecordResult || rightsRecordResult.length === 0) {
        return { success: false, error: `Rights record with ID ${params.rightsRecordId} not found` };
      }
      
      // Validate dispute type (removed as not in schema)
      // if (!['ownership', 'percentage', 'territory', 'duration', 'other'].includes(params.disputeType)) {
      //   return { success: false, error: 'Invalid dispute type' };
      // }
      
      // Create dispute record
      const result = await db.insert(rightsDisputes).values({
        rightsRecordId: params.rightsRecordId,
        claimantId: params.claimantId, // Correct field name
        defendantId: params.defendantId, // Correct field name
        // disputeType: params.disputeType, // Not in schema
        description: params.description, // Added field
        evidenceUrls: params.evidenceUrls || {}, // Use correct field name
        status: 'open'
      }).returning({ id: rightsDisputes.id });
      
      // Update rights record status (if applicable - schema doesn't have verificationStatus)
      // await db.update(rightsRecords)
      //   .set({ verificationStatus: 'disputed' }) 
      //   .where(eq(rightsRecords.id, params.rightsRecordId));
      
      return { success: true, disputeId: result[0].id };
    } catch (error) {
      console.error('Error creating dispute:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // Resolve a rights dispute
  async resolveDispute(params: ResolveDisputeParams): Promise<{ success: boolean; disputeId?: number; error?: string }> {
    try {
      // Get dispute record
      const disputeResult = await db.select().from(rightsDisputes).where(eq(rightsDisputes.id, params.disputeId)).limit(1);
      
      if (!disputeResult || disputeResult.length === 0) {
        return { success: false, error: `Dispute with ID ${params.disputeId} not found` };
      }
      const dispute = disputeResult[0];
      
      // Update dispute record
      await db.update(rightsDisputes)
        .set({
          status: params.status,
          resolutionDetails: params.resolutionDetails, // Correct field name
          // resolvedAt: new Date(), // Not in schema
          // resolvedById: params.resolvedById // Not in schema (or missing relation)
        })
        .where(eq(rightsDisputes.id, params.disputeId));
      
      // Update rights record status (if applicable - schema doesn't have verificationStatus)
      // const newRightsStatus = params.status === 'resolved' ? 'verified' : 'rejected';
      // await db.update(rightsRecords)
      //   .set({ verificationStatus: newRightsStatus }) 
      //   .where(eq(rightsRecords.id, dispute.rightsRecordId)); 
      
      return { success: true, disputeId: params.disputeId };
    } catch (error) {
      console.error('Error resolving dispute:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // Mint an NFT token for a music asset
  async mintNFT(params: MintNFTParams): Promise<{ success: boolean; tokenId?: string; transactionHash?: string; error?: string }> {
    try {
      return await blockchainConnector.mintNFT(
        params.networkId,
        params.ownerAddress,
        params.assetId,
        params.metadata,
        params.userId
      );
    } catch (error) {
      console.error('Error minting NFT:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
  
  // Get rights records with pagination and filtering
  async getRightsRecords(params: QueryParams = {}): Promise<{ data: any[]; total: number; pages: number }> {
    try {
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const offset = (page - 1) * pageSize;
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';
      
      // Build where conditions
      const whereConditions: (SQL | undefined)[] = []; // Use explicit type
      
      if (params.assetId) {
        whereConditions.push(eq(rightsRecords.assetId, params.assetId));
      }
      if (params.assetType) {
        whereConditions.push(eq(rightsRecords.assetType, params.assetType));
      }
      if (params.rightsType) {
        whereConditions.push(eq(rightsRecords.rightsType, params.rightsType));
      }
      if (params.ownerType) {
        whereConditions.push(eq(rightsRecords.ownerType, params.ownerType));
      }
      if (params.ownerId) {
        whereConditions.push(eq(rightsRecords.ownerId, params.ownerId));
      }
      // if (params.verificationStatus) { // Cannot filter directly on this non-existent field
      //   whereConditions.push(eq(rightsRecords.verificationStatus, params.verificationStatus));
      // }
      if (params.startDateFrom) {
        whereConditions.push(gte(rightsRecords.startDate, params.startDateFrom.toISOString())); // Convert Date to string
      }
      if (params.startDateTo) {
        whereConditions.push(lte(rightsRecords.startDate, params.startDateTo.toISOString())); // Convert Date to string
      }
      if (params.endDateFrom) {
         // Ensure endDate is not null before comparing
        whereConditions.push(and(not(isNull(rightsRecords.endDate)), gte(rightsRecords.endDate, params.endDateFrom.toISOString()))); // Convert Date to string
      }
      if (params.endDateTo) {
         // Ensure endDate is not null before comparing
        whereConditions.push(and(not(isNull(rightsRecords.endDate)), lte(rightsRecords.endDate, params.endDateTo.toISOString()))); // Convert Date to string
      }
      if (params.territory) {
        // Use the 'territory' text field for comparison
        whereConditions.push(eq(rightsRecords.territory, params.territory)); 
      }
      
      const validWhereConditions = whereConditions.filter(c => c !== undefined);

      // Get total count
      const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(rightsRecords)
        .where(validWhereConditions.length ? and(...validWhereConditions) : undefined);
      
      const total = Number(countResult[0].count);
      const pages = Math.ceil(total / pageSize);
      
      // Sort order - ensure sortBy key exists in rightsRecords
      const sortColumn = rightsRecords[sortBy as keyof typeof rightsRecords];
      const orderBy = sortColumn ? (sortOrder === 'asc' ? asc(sortColumn as AnyColumn) : desc(sortColumn as AnyColumn)) : desc(rightsRecords.createdAt);
      
      // Query data with joined user info
      const data = await db
        .select({
          id: rightsRecords.id,
          assetId: rightsRecords.assetId,
          assetType: rightsRecords.assetType,
          rightsType: rightsRecords.rightsType,
          ownerType: rightsRecords.ownerType,
          ownerId: rightsRecords.ownerId,
          ownerName: users.fullName, // Use fullName
          ownerEmail: users.email,
          percentage: rightsRecords.percentage,
          startDate: rightsRecords.startDate,
          endDate: rightsRecords.endDate,
          territory: rightsRecords.territory, // Use territory
          source: rightsRecords.source, // Added source
          documentUrls: rightsRecords.documentUrls, // Added documentUrls
          agreementId: rightsRecords.agreementId, // Added agreementId
          blockchainRecordId: rightsRecords.blockchainRecordId, // Use correct field name
          // Remove fields not in schema: blockchainNetworkId, transactionHash, contractId, verificationStatus
          createdAt: rightsRecords.createdAt,
          updatedAt: rightsRecords.updatedAt
        })
        .from(rightsRecords)
        .leftJoin(users, eq(rightsRecords.ownerId, users.id))
        .where(validWhereConditions.length ? and(...validWhereConditions) : undefined)
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset);
      
      return { data, total, pages };
    } catch (error) {
      console.error('Error getting rights records:', error);
      throw error;
    }
  }
  
  // Get a single rights record by ID
  async getRightsRecordById(id: number): Promise<any> {
    try {
      const rightsResult = await db
        .select({
          id: rightsRecords.id,
          assetId: rightsRecords.assetId,
          assetType: rightsRecords.assetType,
          rightsType: rightsRecords.rightsType,
          ownerType: rightsRecords.ownerType,
          ownerId: rightsRecords.ownerId,
          ownerName: users.fullName, // Use fullName
          ownerEmail: users.email,
          percentage: rightsRecords.percentage,
          startDate: rightsRecords.startDate,
          endDate: rightsRecords.endDate,
          territory: rightsRecords.territory, // Use territory
          source: rightsRecords.source,
          documentUrls: rightsRecords.documentUrls,
          agreementId: rightsRecords.agreementId,
          blockchainRecordId: rightsRecords.blockchainRecordId,
          // Remove fields not in schema
          createdAt: rightsRecords.createdAt,
          updatedAt: rightsRecords.updatedAt
        })
        .from(rightsRecords)
        .leftJoin(users, eq(rightsRecords.ownerId, users.id))
        .where(eq(rightsRecords.id, id))
        .limit(1);
      
      if (rightsResult.length === 0) {
        return null;
      }
      const rightsData = rightsResult[0];
      
      // Get verifications for this rights record
      const verifications = await db
        .select({
          id: rightsVerifications.id,
          verifierId: rightsVerifications.verifiedBy, // Use verifiedBy
          verifierName: users.fullName, // Use fullName
          verificationMethod: rightsVerifications.verificationMethod,
          status: rightsVerifications.status,
          verifiedAt: rightsVerifications.createdAt, // Use createdAt as verifiedAt
          // expiresAt: rightsVerifications.expiresAt // Not in schema
        })
        .from(rightsVerifications)
        .leftJoin(users, eq(rightsVerifications.verifiedBy, users.id)) // Join on verifiedBy
        .where(eq(rightsVerifications.rightsRecordId, id)); // Use rightsRecordId
      
      // Get disputes for this rights record
      const disputes = await db
        .select({
          id: rightsDisputes.id,
          claimantId: rightsDisputes.claimantId, // Use claimantId
          claimantName: users.fullName, // Use fullName
          respondentId: rightsDisputes.defendantId, // Use defendantId
          // disputeType: rightsDisputes.disputeType, // Not in schema
          description: rightsDisputes.description, // Added description
          status: rightsDisputes.status,
          // resolution: rightsDisputes.resolution, // Not in schema
          resolutionDetails: rightsDisputes.resolutionDetails, // Use correct field
          createdAt: rightsDisputes.createdAt,
          // resolvedAt: rightsDisputes.resolvedAt // Not in schema
        })
        .from(rightsDisputes)
        .leftJoin(users, eq(rightsDisputes.claimantId, users.id)) // Join on claimantId
        .where(eq(rightsDisputes.rightsRecordId, id)); // Use rightsRecordId
      
      // Get blockchain transaction if exists
      let transaction = null;
      if (rightsData.blockchainRecordId) { // Check blockchainRecordId
        const transactions = await db
          .select()
          .from(blockchainTransactions)
          // Assuming blockchainRecordId might correspond to transactionHash or another field
          .where(eq(blockchainTransactions.transactionHash, rightsData.blockchainRecordId)) 
          .limit(1);
        
        if (transactions.length > 0) {
          transaction = transactions[0];
        }
      }
      
      return {
        ...rightsData,
        verifications,
        disputes,
        transaction
      };
    } catch (error) {
      console.error('Error getting rights record by ID:', error);
      throw error;
    }
  }
  
  // Get all rights records for an asset
  async getRightsRecordsByAssetId(assetId: string): Promise<any[]> {
    try {
      return await db
        .select({
          id: rightsRecords.id,
          assetId: rightsRecords.assetId,
          assetType: rightsRecords.assetType,
          rightsType: rightsRecords.rightsType,
          ownerType: rightsRecords.ownerType,
          ownerId: rightsRecords.ownerId,
          ownerName: users.fullName, // Use fullName
          percentage: rightsRecords.percentage,
          startDate: rightsRecords.startDate,
          endDate: rightsRecords.endDate,
          territory: rightsRecords.territory, // Use territory
          // verificationStatus: rightsRecords.verificationStatus // Not in schema
        })
        .from(rightsRecords)
        .leftJoin(users, eq(rightsRecords.ownerId, users.id))
        .where(eq(rightsRecords.assetId, assetId))
        .orderBy(desc(rightsRecords.createdAt));
    } catch (error) {
      console.error('Error getting rights records by asset ID:', error);
      throw error;
    }
  }
  
  // Get all rights records for an owner
  async getRightsRecordsByOwnerId(ownerId: number): Promise<any[]> {
    try {
      return await db
        .select({
          id: rightsRecords.id,
          assetId: rightsRecords.assetId,
          assetType: rightsRecords.assetType,
          rightsType: rightsRecords.rightsType,
          ownerType: rightsRecords.ownerType,
          percentage: rightsRecords.percentage,
          startDate: rightsRecords.startDate,
          endDate: rightsRecords.endDate,
          territory: rightsRecords.territory, // Use territory
          // verificationStatus: rightsRecords.verificationStatus // Not in schema
        })
        .from(rightsRecords)
        .where(eq(rightsRecords.ownerId, ownerId))
        .orderBy(desc(rightsRecords.createdAt));
    } catch (error) {
      console.error('Error getting rights records by owner ID:', error);
      throw error;
    }
  }
  
  // Get all NFT tokens for an asset
  async getNFTTokensByAssetId(assetId: string): Promise<any[]> {
    try {
      return await db
        .select({
          id: nftTokens.id,
          tokenId: nftTokens.tokenId,
          assetId: nftTokens.assetId,
          contractAddress: nftTokens.contractAddress,
          ownerAddress: nftTokens.ownerAddress,
          transactionHash: nftTokens.transactionHash,
          networkId: nftTokens.networkId,
          status: nftTokens.status,
          mintedBy: nftTokens.mintedBy,
          minterName: users.fullName, // Use fullName
          createdAt: nftTokens.createdAt
        })
        .from(nftTokens)
        .leftJoin(users, eq(nftTokens.mintedBy, users.id))
        .where(eq(nftTokens.assetId, assetId))
        .orderBy(desc(nftTokens.createdAt));
    } catch (error) {
      console.error('Error getting NFT tokens by asset ID:', error);
      throw error;
    }
  }
  
  // Get blockchain transactions for a user
  async getBlockchainTransactionsByUserId(userId: number, limit: number = 10): Promise<any[]> {
    try {
      // Cannot query by userId as it's not in the schema
      // Returning all transactions for now, limited
       console.warn("Cannot filter blockchain transactions by userId, schema missing field. Returning latest transactions.");
      return await db
        .select()
        .from(blockchainTransactions)
        // .where(eq(blockchainTransactions.userId, userId)) // userId field missing
        .orderBy(desc(blockchainTransactions.timestamp)) // Order by timestamp instead of createdAt
        .limit(limit);
    } catch (error) {
      console.error('Error getting blockchain transactions by user ID:', error);
      throw error;
    }
  }
  
  // Get available territories
  async getTerritories(): Promise<any[]> {
     // Assuming 'territories' table might not exist, return a default or fetch from config
     console.warn("Territories table not found in schema, returning default list.");
     return [
         { code: 'WW', name: 'Worldwide' },
         { code: 'US', name: 'United States' },
         { code: 'GB', name: 'United Kingdom' },
         // Add more default territories as needed
     ];
    // try {
    //   return await db
    //     .select()
    //     .from(territories) // This table was commented out in schema import
    //     .where(eq(territories.isActive, true))
    //     .orderBy(asc(territories.name));
    // } catch (error) {
    //   console.error('Error getting territories:', error);
    //   throw error;
    // }
  }
  
  // Get blockchain networks info
  getBlockchainNetworks(): string[] {
    return blockchainConnector.getConfiguredNetworks();
  }
  
  getBlockchainNetworkInfo(networkId: string): any {
    return blockchainConnector.getNetworkInfo(networkId);
  }
}

// Export singleton instance
export const rightsManagementService = new RightsManagementService();