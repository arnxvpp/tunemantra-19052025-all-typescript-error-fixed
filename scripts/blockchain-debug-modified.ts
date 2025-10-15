/**
 * Enhanced Blockchain Debugging Test
 * 
 * This script provides detailed logging for troubleshooting blockchain interaction issues.
 * 
 * USAGE: npx tsx scripts/blockchain-debug-modified.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

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

import { ethers } from 'ethers';
import { blockchainConnector } from '../server/services/blockchain-connector';
import { createRightsRecord } from '../server/services/db-helpers';
import { assetTypeEnum, rightsTypeEnum, ownerTypeEnum, blockchainNetworkEnum } from '../shared/schema';
import { db } from '../server/db';
import { eq } from 'drizzle-orm';

// Force re-initialization of the connector with our loaded environment variables
console.log("\n🔄 Reinitializing blockchain connector with updated environment variables...");
(blockchainConnector as any).initializeProviders();

// Test data for rights verification
const TEST_DATA = {
  networkId: 'mumbai', // Polygon Mumbai testnet
  assetId: 'TRACK123456789',
  assetType: 'track',
  ownerAddress: '0x1234567890123456789012345678901234567890',
  rightsType: 'master', // Must match one of the valid rightsTypeEnum values
  ownerType: 'artist',
  startDate: new Date(),
  endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  territory: 'global',
  distributionChannels: ['streaming', 'download'],
  usageRights: ['commercial', 'non-commercial'],
  paymentTerms: 'on_delivery'
};

/**
 * Check database schema and column names
 */
async function checkDatabaseSchema() {
  console.log("\n📊 Checking database schema for rights records...");
  
  try {
    // Try to directly query the table structure
    const tableInfo = await db.execute(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_name = 'rights_records' 
       ORDER BY ordinal_position`
    );
    
    console.log("Rights records table structure:");
    if (tableInfo.rows.length > 0) {
      console.table(tableInfo.rows);
    } else {
      console.log("❌ Could not retrieve table structure");
    }
    
    // Check enums
    console.log("\nEnum values in schema:");
    console.log("- Asset Types:", Object.values(assetTypeEnum.enumValues));
    console.log("- Rights Types:", Object.values(rightsTypeEnum.enumValues));
    console.log("- Owner Types:", Object.values(ownerTypeEnum.enumValues));
    console.log("- Blockchain Networks:", Object.values(blockchainNetworkEnum.enumValues));
    
  } catch (error) {
    console.error("❌ Error checking database schema:", error);
  }
}

/**
 * Try to create a rights record directly in the database
 */
async function testDirectDatabaseInsertion() {
  console.log("\n📝 Testing direct rights record insertion to database...");
  
  try {
    // Create a simple rights record directly in the database
    const result = await createRightsRecord({
      assetId: "DIRECT_TEST_" + Date.now(),
      assetType: "track",
      rightsType: "master",
      ownerType: "artist",
      ownerId: 1,
      ownerAddress: "0x1234567890123456789012345678901234567890",
      percentage: 100,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      territories: ["global"],
      blockchainNetworkId: "mumbai",
      verificationStatus: "pending"
    });
    
    console.log("✅ Direct database insertion successful!");
    console.log("Inserted record:", result);
    
    return result;
  } catch (error) {
    console.error("❌ Error with direct database insertion:");
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error(error);
    }
    
    return null;
  }
}

/**
 * Test the blockchain connector's registerRights method
 */
async function testRegisterRights() {
  console.log("\n🔗 Testing blockchain connector registerRights method...");
  
  try {
    console.log('Using parameters:');
    console.log('- Network ID:', TEST_DATA.networkId);
    console.log('- Asset ID:', TEST_DATA.assetId);
    console.log('- Asset Type:', TEST_DATA.assetType);
    console.log('- Rights Type:', TEST_DATA.rightsType);
    console.log('- Owner Type:', TEST_DATA.ownerType);
    console.log('- Owner Address:', TEST_DATA.ownerAddress);
    console.log('- Start Date:', TEST_DATA.startDate);
    console.log('- End Date:', TEST_DATA.endDate);
    
    const registerResult = await blockchainConnector.registerRights(
      TEST_DATA.networkId,
      TEST_DATA.assetId,
      TEST_DATA.assetType,
      TEST_DATA.rightsType,
      TEST_DATA.ownerType,
      TEST_DATA.ownerAddress,
      75, // percentage (75%)
      TEST_DATA.startDate,
      TEST_DATA.endDate,
      ['global'], // territories
      1, // ownerId
      1  // userId
    );
    
    console.log("Register rights result:", registerResult);
    
    if (!registerResult.success) {
      console.error(`❌ Failed to register rights: ${registerResult.error}`);
      return null;
    }
    
    console.log('✅ Rights registered successfully!');
    console.log('Rights ID:', registerResult.rightsId);
    console.log('Transaction Hash:', registerResult.transactionHash);
    
    return registerResult;
  } catch (error) {
    console.error("❌ Exception during rights registration:");
    if (error instanceof Error) {
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    } else {
      console.error(error);
    }
    
    return null;
  }
}

/**
 * Main function to run all tests
 */
async function runTests() {
  try {
    // 1. Check networks configuration
    console.log("\n🔍 Checking blockchain networks...");
    const networks = blockchainConnector.getConfiguredNetworks();
    console.log('Available networks:', networks);
    
    if (!networks.includes(TEST_DATA.networkId)) {
      console.error(`❌ Test network ${TEST_DATA.networkId} not available. Available networks: ${networks.join(', ')}`);
      return;
    }
    
    // 2. Check database schema
    await checkDatabaseSchema();
    
    // 3. Try direct database insertion
    const directInsertResult = await testDirectDatabaseInsertion();
    
    // 4. Only continue with blockchain connector test if direct insertion worked
    if (directInsertResult) {
      console.log("\n✅ Direct database test successful, continuing with blockchain connector test...");
      
      // 5. Try registerRights method
      const registerResult = await testRegisterRights();
      
      if (registerResult && registerResult.success) {
        console.log("\n✅ All tests completed successfully!");
      } else {
        console.error("\n❌ RegisterRights test failed but direct database insertion worked.");
        console.log("This suggests the issue is in the blockchain connector, not in the database schema.");
      }
    } else {
      console.error("\n❌ Direct database test failed. Need to fix database-related issues first.");
    }
    
  } catch (error) {
    console.error("❌ Test suite failed:", error);
  }
}

// Run the tests
runTests();