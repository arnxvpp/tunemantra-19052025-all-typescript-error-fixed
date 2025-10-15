/**
 * Blockchain Debug Test
 * 
 * This script tests the blockchain functionality with additional debug logging
 * 
 * USAGE: npx tsx scripts/blockchain-debug.ts
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Set NODE_ENV for testing
process.env.NODE_ENV = 'development';

// Get current file and directory path in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check for and load environment variables from the root directory
const rootDir = path.resolve(__dirname, '..');
const devEnvPath = path.join(rootDir, '.env.development');

console.log(`Looking for environment file at: ${devEnvPath}`);
console.log(`File exists: ${fs.existsSync(devEnvPath)}`);

// Load the development environment variables
dotenv.config({ path: devEnvPath });

// Manually set BLOCKCHAIN_SIMULATION to true for this test
process.env.BLOCKCHAIN_SIMULATION = 'true';

// Log the environment variables to verify they are loaded
console.log("Environment variables loaded:", {
  NODE_ENV: process.env.NODE_ENV,
  BLOCKCHAIN_SIMULATION: process.env.BLOCKCHAIN_SIMULATION,
  MUMBAI_RPC_URL: process.env.MUMBAI_RPC_URL,
  MUMBAI_PRIVATE_KEY: process.env.MUMBAI_PRIVATE_KEY ? "Set (not showing full value)" : "Not set",
  MUMBAI_NFT_CONTRACT_ADDRESS: process.env.MUMBAI_NFT_CONTRACT_ADDRESS,
  MUMBAI_RIGHTS_CONTRACT_ADDRESS: process.env.MUMBAI_RIGHTS_CONTRACT_ADDRESS
});

// Only import after setting environment variables
import { blockchainConnector } from '../server/services/blockchain-connector';
import { db } from '../server/db';
import { rightsRecords, blockchainTransactions } from '../shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

// Simple logger utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`INFO: ${message}`, data !== undefined ? data : '');
  },
  error: (message: string, error?: any) => {
    console.error(`ERROR: ${message}`, error !== undefined ? error : '');
  },
  success: (message: string, data?: any) => {
    console.log(`✅ SUCCESS: ${message}`, data !== undefined ? data : '');
  }
};

/**
 * Function to check the database tables
 */
async function checkDatabaseTables() {
  try {
    logger.info('Checking rights_records table...');
    
    // Check if the rights_records table exists
    const rightsRecordsResult = await db.execute(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'rights_records'
       );`
    );
    
    const rightsRecordsTableExists = rightsRecordsResult.rows?.[0]?.exists === true;
    logger.info(`rights_records table exists: ${rightsRecordsTableExists}`);
    
    // Check if the blockchain_transactions table exists
    const blockchainTransactionsResult = await db.execute(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name = 'blockchain_transactions'
       );`
    );
    
    const blockchainTransactionsTableExists = blockchainTransactionsResult.rows?.[0]?.exists === true;
    logger.info(`blockchain_transactions table exists: ${blockchainTransactionsTableExists}`);
    
    // Check how many records are in the tables
    if (rightsRecordsTableExists) {
      const rightsCount = await db.select({ count: sql`count(*)` }).from(rightsRecords);
      logger.info(`rights_records count: ${rightsCount?.[0]?.count || 0}`);
      
      // Get the latest 5 rights records - selecting only columns that exist in the actual database
      const latestRights = await db.execute(`
        SELECT id, asset_id, asset_type, rights_type, owner_type, owner_id, 
               percentage, territory, start_date, end_date, verification_status,
               blockchain_record_id, verification_transaction_hash,
               created_at, updated_at
        FROM rights_records
        ORDER BY created_at DESC
        LIMIT 5
      `);
      logger.info(`Latest 5 rights records:`, latestRights);
    }
    
    if (blockchainTransactionsTableExists) {
      const transactionsCount = await db.select({ count: sql`count(*)` }).from(blockchainTransactions);
      logger.info(`blockchain_transactions count: ${transactionsCount?.[0]?.count || 0}`);
      
      // Get the latest 5 blockchain transactions - using raw SQL with the correct columns
      const latestTransactions = await db.execute(`
        SELECT id, network_id, transaction_hash, function_name, status, user_id, 
               created_at, related_entity_type, related_entity_id
        FROM blockchain_transactions
        ORDER BY created_at DESC
        LIMIT 5
      `);
      logger.info(`Latest 5 blockchain transactions:`, latestTransactions);
    }
  } catch (error) {
    logger.error('Error checking database tables:', error);
  }
}

/**
 * Test blockchain connector functions individually
 */
async function testBlockchainFunctions() {
  try {
    logger.info('Testing blockchain connector functions...');
    
    // 1. Check available networks
    const networks = blockchainConnector.getConfiguredNetworks();
    logger.info('Available networks:', networks);
    
    // 2. Check if Mumbai is properly configured
    const networkId = 'mumbai';
    if (!networks.includes(networkId)) {
      logger.error(`Test network ${networkId} not available`);
      return;
    }
    
    logger.success(`Network ${networkId} is available`);
    
    // 3. Get network info
    const networkInfo = blockchainConnector.getNetworkInfo(networkId);
    logger.info('Network info:', networkInfo);
    
    // 4. Create a test rights record
    logger.info('Creating test rights record...');
    
    // Test data
    const assetId = `TEST_ASSET_${Date.now()}`;
    const result = await blockchainConnector.registerRights(
      networkId,
      assetId,
      'track',
      'master',
      'artist',
      '0x1234567890123456789012345678901234567890',
      100, // 100% ownership
      new Date(),
      null, // no end date
      ['GLOBAL'], // territories
      1, // ownerId
      1  // userId
    );
    
    if (!result.success) {
      logger.error('Failed to register rights:', result.error);
      return;
    }
    
    logger.success('Rights registered successfully', {
      rightsId: result.rightsId,
      transactionHash: result.transactionHash
    });
    
    // 5. Get rights info
    if (result.rightsId) {
      logger.info(`Getting rights info for ID ${result.rightsId}...`);
      const rightsInfo = await blockchainConnector.getRightsInfo(
        networkId,
        result.rightsId
      );
      
      if (rightsInfo.success) {
        logger.success('Rights info retrieved successfully', rightsInfo.data);
      } else {
        logger.error('Failed to get rights info:', rightsInfo.error);
      }
    }
    
    // 6. Verify rights
    if (result.rightsId) {
      logger.info(`Verifying rights for ID ${result.rightsId}...`);
      
      const verifierAddress = '0x9876543210987654321098765432109876543210';
      const signature = 'test-signature-for-verification';
      
      const verificationResult = await blockchainConnector.verifyRights(
        networkId,
        result.rightsId,
        verifierAddress,
        signature,
        1 // userId
      );
      
      if (verificationResult.success) {
        logger.success('Rights verified successfully', verificationResult);
      } else {
        logger.error('Failed to verify rights:', verificationResult.error);
      }
    }
  } catch (error) {
    logger.error('Error in blockchain test:', error);
  }
}

// Main function
async function main() {
  try {
    // Check database tables first
    await checkDatabaseTables();
    
    // Test blockchain functions
    await testBlockchainFunctions();
    
    // Check database again after tests
    logger.info('\nRechecking database after tests...');
    await checkDatabaseTables();
    
    logger.success('All tests completed');
  } catch (error) {
    logger.error('Test failed:', error);
  }
}

// Run the main function
main();