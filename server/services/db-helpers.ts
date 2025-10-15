/**
 * Database Helper Functions
 * 
 * This file contains helper functions for database operations.
 */

import { SQL, eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { blockchainTransactions, rightsRecords, InsertRightsRecord } from '../../shared/schema';

/**
 * Create a blockchain transaction record
 */
export async function createBlockchainTransaction(
  data: {
    transactionHash: string;
    networkId: string;
    fromAddress: string;
    toAddress: string;
    value: string;
    status: string;
    functionName?: string;
    functionArgs?: Record<string, any>;
    relatedEntityType?: string;
    relatedEntityId?: number;
    userId: number;
  }
) {
  try {
    // Extract the networkId and handle special casting manually
    const { networkId, ...otherData } = data;
    
    // Insert with raw SQL for the networkId to handle enum typing
    const transaction = await db.execute(
      sql`INSERT INTO blockchain_transactions
        (transaction_hash, network_id, from_address, to_address, value, status, 
         function_name, function_args, related_entity_type, related_entity_id, user_id)
        VALUES
        (${data.transactionHash}, ${networkId}::blockchain_network, ${data.fromAddress}, 
         ${data.toAddress}, ${data.value}, ${data.status}, ${data.functionName || null}, 
         ${data.functionArgs ? JSON.stringify(data.functionArgs) : null}, 
         ${data.relatedEntityType || null}, ${data.relatedEntityId || null}, ${data.userId})
        RETURNING *`
    );
    
    return transaction.rows[0];
  } catch (error) {
    console.error('Error creating blockchain transaction:', error);
    throw error;
  }
}

/**
 * Update a blockchain transaction's status
 */
export async function updateBlockchainTransactionStatus(
  transactionHash: string,
  status: string,
  blockNumber?: number,
  blockTimestamp?: Date
) {
  try {
    const updateData: Record<string, any> = { status };
    
    if (blockNumber !== undefined) {
      updateData.blockNumber = blockNumber;
    }
    
    if (blockTimestamp) {
      updateData.blockTimestamp = blockTimestamp;
    }
    
    const transaction = await db.update(blockchainTransactions)
      .set(updateData)
      .where(eq(blockchainTransactions.transactionHash, transactionHash))
      .returning();
    
    return transaction[0];
  } catch (error) {
    console.error('Error updating blockchain transaction status:', error);
    throw error;
  }
}

/**
 * Update rights record verification status
 */
export async function updateRightsVerificationStatus(
  rightsId: number,
  status: string,
  verifiedBy?: number,
  verificationDate?: Date,
  verificationTransactionHash?: string
) {
  try {
    const updateData: Record<string, any> = { 
      verificationStatus: status 
    };
    
    if (verifiedBy !== undefined) {
      updateData.verifiedBy = verifiedBy;
    }
    
    if (verificationDate) {
      updateData.verificationDate = verificationDate;
    }
    
    if (verificationTransactionHash) {
      updateData.verificationTransactionHash = verificationTransactionHash;
    }
    
    const rights = await db.update(rightsRecords)
      .set(updateData)
      .where(eq(rightsRecords.id, rightsId))
      .returning();
    
    return rights[0];
  } catch (error) {
    console.error('Error updating rights verification status:', error);
    throw error;
  }
}

/**
 * Find rights records by network and asset ID
 */
export async function findRightsRecordsByNetworkAndAssetId(
  networkId: string,
  assetId: string
) {
  try {
    // Use SQL tag for proper type handling
    const rights = await db.select()
      .from(rightsRecords)
      .where(
        and(
          // Use raw SQL for the enum comparison - cast both sides to text for safe comparison
          sql`${rightsRecords.blockchainRecordId}::text = ${networkId}::text`,
          eq(rightsRecords.assetId, assetId)
        )
      );
    
    return rights;
  } catch (error) {
    console.error('Error finding rights records:', error);
    throw error;
  }
}

/**
 * Find verified rights records by verification transaction hash
 */
export async function findRightsRecordsByVerificationHash(
  verificationTransactionHash: string
) {
  try {
    const rights = await db.select()
      .from(rightsRecords)
      .where(eq(rightsRecords.verificationTransactionHash, verificationTransactionHash));
    
    return rights;
  } catch (error) {
    console.error('Error finding rights records by verification hash:', error);
    throw error;
  }
}

/**
 * Get a rights record by ID
 */
export async function getRightsRecordById(
  id: number
) {
  try {
    const rights = await db.select()
      .from(rightsRecords)
      .where(eq(rightsRecords.id, id));
    
    return rights[0] || null;
  } catch (error) {
    console.error('Error finding rights record by ID:', error);
    throw error;
  }
}

/**
 * Get rights records by asset ID
 */
export async function getRightsRecordsByAssetId(
  assetId: string
) {
  try {
    const rights = await db.select()
      .from(rightsRecords)
      .where(eq(rightsRecords.assetId, assetId));
    
    return rights;
  } catch (error) {
    console.error('Error finding rights records by asset ID:', error);
    throw error;
  }
}

/**
 * Create a rights record with proper handling of territories JSON field
 */
export async function createRightsRecord(
  data: {
    assetId: string;
    assetType: string;
    rightsType: string;
    ownerType: string;
    ownerId: number;
    ownerAddress?: string;
    percentage: number;
    startDate: Date;
    endDate?: Date | null;
    territories?: string[];
    tokenId?: string;
    agreementId?: string;  // Changed from contractId
    blockchainNetworkId?: string;  // This is used as blockchain_record_id in the database
    // transactionHash removed as it's no longer stored in the rights_records table
    verificationStatus?: string;
  }
) {
  try {
    // Get the derived territory from territories array or use 'worldwide' default
    const territory = data.territories && data.territories.length > 0 
      ? data.territories[0] // Use first territory code
      : 'worldwide';
    
    // Use raw SQL for insertion to handle proper enum casting and match actual DB schema
    // Enhanced debugging for SQL operation
    console.log("Inserting rights record with parameters:", {
      assetId: data.assetId,
      assetType: data.assetType,
      rightsType: data.rightsType,
      ownerType: data.ownerType,
      ownerId: data.ownerId,
      ownerAddress: data.ownerAddress,
      percentage: data.percentage,
      startDate: data.startDate,
      endDate: data.endDate,
      territory: territory,
      agreementId: data.agreementId,
      blockchain_record_id: data.blockchainNetworkId,
      verificationStatus: data.verificationStatus || 'pending'
    });
    
    // Transaction hash is no longer stored in the rights_records table
    // It's now tracked in the blockchain_transactions table
    const result = await db.execute(
      sql`INSERT INTO rights_records
        (asset_id, asset_type, rights_type, owner_type, owner_id, owner_address,
         percentage, start_date, end_date, territory, source, agreement_id,
         blockchain_record_id, verification_status)
        VALUES
        (${data.assetId}, 
         ${data.assetType}::asset_type, 
         ${data.rightsType}::rights_type, 
         ${data.ownerType}::owner_type, 
         ${data.ownerId}, 
         ${data.ownerAddress || null},
         ${data.percentage}, 
         ${data.startDate}, 
         ${data.endDate || null}, 
         ${territory}, 
         ${'blockchain'}, 
         ${data.agreementId || null},
         ${data.blockchainNetworkId || null}, 
         ${data.verificationStatus || 'pending'})
        RETURNING *`
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating rights record:', error);
    throw error;
  }
}