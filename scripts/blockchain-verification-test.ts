/**
 * Blockchain Rights Verification Test
 * 
 * This script tests the blockchain rights verification functionality in TuneMantra.
 * It simulates the verification of a rights record on the blockchain.
 * 
 * USAGE: npx tsx scripts/blockchain-verification-test.ts
 */

/**
 * Direct Blockchain Rights Verification Test
 * 
 * This script tests the blockchain functionality directly without using the API
 * 
 * USAGE: npx tsx scripts/blockchain-verification-test.ts
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

// Helper function to generate a fake blockchain signature
async function generateTestSignature(message: string, privateKey: string): Promise<string> {
  const wallet = new ethers.Wallet(privateKey);
  return wallet.signMessage(message);
}

/**
 * Direct blockchain tests
 */
async function runTests() {
  try {
    // 1. Check network configuration
    console.log("\n🔍 Checking blockchain networks...");
    const networks = blockchainConnector.getConfiguredNetworks();
    console.log('Available networks:', networks);
    
    if (!networks.includes(TEST_DATA.networkId)) {
      console.error(`❌ Test network ${TEST_DATA.networkId} not available. Available networks: ${networks.join(', ')}`);
      return;
    }
    
    // 2. Check network info
    const networkInfo = blockchainConnector.getNetworkInfo(TEST_DATA.networkId);
    console.log('Network info:', networkInfo);
    
    // 3. Register rights directly
    console.log('\n📝 Registering rights on blockchain...');
    let registerResult;
    try {
      console.log('Using rights type:', TEST_DATA.rightsType);
      console.log('Valid rights types per schema:', ['master', 'publishing', 'sync', 'mechanical', 'performance', 'derivative']);
      
      // First check if the database helper function exists
      if (typeof createRightsRecord !== 'function') {
        console.error('❌ createRightsRecord function not found. It should be imported from server/services/db-helpers');
        const { createRightsRecord } = await import('../server/services/db-helpers');
        if (typeof createRightsRecord !== 'function') {
          console.error('❌ Failed to import createRightsRecord function');
          return;
        } else {
          console.log('✅ Successfully imported createRightsRecord function');
        }
      } else {
        console.log('✅ createRightsRecord function exists');
      }
      
      registerResult = await blockchainConnector.registerRights(
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
      
      if (!registerResult || !registerResult.success) {
        console.error(`❌ Failed to register rights: ${registerResult?.error || 'Unknown error'}`);
        return;
      }
      
      console.log('✅ Rights registered successfully');
    } catch (error) {
      console.error('❌ Exception during rights registration:');
      if (error instanceof Error) {
        console.error(`   Message: ${error.message}`);
        console.error(`   Stack: ${error.stack}`);
      } else {
        console.error(error);
      }
      return;
    }
    
    const rightsId = registerResult?.rightsId;
    console.log('Rights registered with ID:', rightsId);
    console.log('Transaction hash:', registerResult?.transactionHash);
    
    // 4. Get rights details
    console.log('\n🔍 Getting rights details from blockchain...');
    if (rightsId) {
      const rightsDetails = await blockchainConnector.getRightsDetails(
        TEST_DATA.networkId,
        rightsId
      );
      
      console.log('Rights details:', rightsDetails);
    } else {
      console.error('Cannot get rights details without a valid rightsId');
      return;
    }
    
    // 5. Verify rights on blockchain
    console.log('\n🔐 Verifying rights on blockchain...');
    
    // Generate a test signature
    const testPrivateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
    const messageToSign = `Verify rights record ${rightsId} for asset ${TEST_DATA.assetId}`;
    const signature = await generateTestSignature(messageToSign, testPrivateKey);
    
    const verifierAddress = '0x123456789012345678901234567890123456789a'; // Example address
    
    if (rightsId) {
      const verificationResult = await blockchainConnector.verifyRights(
        TEST_DATA.networkId,
        rightsId,
        verifierAddress,
        signature,
        1 // userId
      );
      
      console.log('Verification result:', verificationResult);
    } else {
      console.error('Cannot verify rights without a valid rightsId');
      return;
    }
    
    // 6. Check rights info from blockchain
    console.log('\n🔍 Getting rights info from blockchain...');
    if (rightsId) {
      const rightsInfo = await blockchainConnector.getRightsInfo(
        TEST_DATA.networkId,
        rightsId
      );
      
      console.log('Rights info:', rightsInfo);
    } else {
      console.error('Cannot get rights info without a valid rightsId');
      return;
    }
    
    console.log('\n✅ Blockchain verification test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests();