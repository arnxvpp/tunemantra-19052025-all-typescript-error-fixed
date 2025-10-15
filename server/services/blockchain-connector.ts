import { ethers } from 'ethers';
import { db } from '../db';
import { blockchainTransactions, nftTokens, rightsRecords } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { 
  createBlockchainTransaction, 
  updateBlockchainTransactionStatus,
  updateRightsVerificationStatus,
  findRightsRecordsByNetworkAndAssetId,
  findRightsRecordsByVerificationHash,
  createRightsRecord
} from './db-helpers';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development' });

interface BlockchainConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nftContractAddress: string;
  rightsContractAddress: string;
}

// Define blockchain network configurations
const blockchainNetworks: Record<string, BlockchainConfig> = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.public.blastapi.io',
    explorerUrl: 'https://etherscan.io',
    nftContractAddress: process.env.ETHEREUM_NFT_CONTRACT_ADDRESS || '',
    rightsContractAddress: process.env.ETHEREUM_RIGHTS_CONTRACT_ADDRESS || '',
  },
  polygon: {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nftContractAddress: process.env.POLYGON_NFT_CONTRACT_ADDRESS || '',
    rightsContractAddress: process.env.POLYGON_RIGHTS_CONTRACT_ADDRESS || '',
  },
  mumbai: {
    chainId: 80001,
    name: 'Polygon Mumbai Testnet',
    rpcUrl: process.env.MUMBAI_RPC_URL || 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    nftContractAddress: process.env.MUMBAI_NFT_CONTRACT_ADDRESS || '',
    rightsContractAddress: process.env.MUMBAI_RIGHTS_CONTRACT_ADDRESS || '',
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    nftContractAddress: process.env.OPTIMISM_NFT_CONTRACT_ADDRESS || '',
    rightsContractAddress: process.env.OPTIMISM_RIGHTS_CONTRACT_ADDRESS || '',
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nftContractAddress: process.env.ARBITRUM_NFT_CONTRACT_ADDRESS || '',
    rightsContractAddress: process.env.ARBITRUM_RIGHTS_CONTRACT_ADDRESS || '',
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nftContractAddress: process.env.BASE_NFT_CONTRACT_ADDRESS || '',
    rightsContractAddress: process.env.BASE_RIGHTS_CONTRACT_ADDRESS || '',
  },
};

// NFT Contract ABI (minimal for basic functionality)
const nftContractAbi = [
  'function mint(address to, string memory uri) external returns (uint256)',
  'function tokenURI(uint256 tokenId) external view returns (string memory)',
  'function transferFrom(address from, address to, uint256 tokenId) external',
  'function ownerOf(uint256 tokenId) external view returns (address)',
];

// Rights Management Contract ABI (minimal for basic functionality)
const rightsContractAbi = [
  'function registerRights(string memory assetId, uint8 assetType, uint8 rightsType, uint8 ownerType, address owner, uint256 percentage, uint64 startDate, uint64 endDate, string[] memory territories) external returns (uint256)',
  'function verifyRights(uint256 rightsId, address verifier, bytes memory signature) external returns (bool)',
  'function getRightsInfo(uint256 rightsId) external view returns (string memory assetId, uint8 assetType, uint8 rightsType, uint8 ownerType, address owner, uint256 percentage, uint64 startDate, uint64 endDate, string[] memory territories, bool verified)',
  'function updateRights(uint256 rightsId, uint256 percentage, uint64 endDate, string[] memory territories) external returns (bool)',
];

class BlockchainConnector {
  private providers: Record<string, ethers.JsonRpcProvider> = {};
  private nftContracts: Record<string, ethers.Contract> = {};
  private rightsContracts: Record<string, ethers.Contract> = {};
  private wallets: Record<string, ethers.Wallet> = {};

  constructor() {
    this.initializeProviders();
  }

  // Initialize providers for all supported networks
  private initializeProviders() {
    console.log('Initializing blockchain providers...');
    console.log('Environment variables:');
    console.log('MUMBAI_RPC_URL:', process.env.MUMBAI_RPC_URL);
    console.log('MUMBAI_PRIVATE_KEY:', process.env.MUMBAI_PRIVATE_KEY ? 'Set (not showing full value)' : 'Not set');
    console.log('MUMBAI_NFT_CONTRACT_ADDRESS:', process.env.MUMBAI_NFT_CONTRACT_ADDRESS);
    console.log('MUMBAI_RIGHTS_CONTRACT_ADDRESS:', process.env.MUMBAI_RIGHTS_CONTRACT_ADDRESS);
    
    console.log('Blockchain networks configuration:');
    console.log(JSON.stringify(blockchainNetworks, null, 2));
    
    for (const [networkId, config] of Object.entries(blockchainNetworks)) {
      console.log(`Initializing network: ${networkId}`);
      try {
        // Create provider
        this.providers[networkId] = new ethers.JsonRpcProvider(config.rpcUrl);
        console.log(`- Provider created for ${networkId}`);
        
        // Create wallet with private key if available
        const privateKey = process.env[`${networkId.toUpperCase()}_PRIVATE_KEY`];
        if (privateKey) {
          console.log(`- Private key found for ${networkId}`);
          this.wallets[networkId] = new ethers.Wallet(privateKey, this.providers[networkId]);
          console.log(`- Wallet created for ${networkId}`);
          
          // Initialize contracts if contract addresses are available
          if (config.nftContractAddress) {
            console.log(`- NFT contract address found for ${networkId}: ${config.nftContractAddress}`);
            this.nftContracts[networkId] = new ethers.Contract(
              config.nftContractAddress, 
              nftContractAbi, 
              this.wallets[networkId]
            );
            console.log(`- NFT contract initialized for ${networkId}`);
          } else {
            console.log(`- No NFT contract address for ${networkId}`);
          }
          
          if (config.rightsContractAddress) {
            console.log(`- Rights contract address found for ${networkId}: ${config.rightsContractAddress}`);
            this.rightsContracts[networkId] = new ethers.Contract(
              config.rightsContractAddress, 
              rightsContractAbi, 
              this.wallets[networkId]
            );
            console.log(`- Rights contract initialized for ${networkId}`);
          } else {
            console.log(`- No rights contract address for ${networkId}`);
          }
        } else {
          console.log(`- No private key for ${networkId}`);
        }
      } catch (error) {
        console.error(`Error initializing network ${networkId}:`, error);
      }
    }
  }

  // Get provider for specified network
  public getProvider(networkId: string): ethers.JsonRpcProvider {
    if (!this.providers[networkId]) {
      throw new Error(`Provider for network ${networkId} not initialized`);
    }
    return this.providers[networkId];
  }

  // Get wallet for specified network
  public getWallet(networkId: string): ethers.Wallet {
    if (!this.wallets[networkId]) {
      // For development/simulation mode, return a dummy wallet if not configured
      if (process.env.NODE_ENV === 'development' && process.env.BLOCKCHAIN_SIMULATION === 'true') {
        console.log(`Creating simulation wallet for ${networkId}...`);
        // Use a hard-coded test private key for simulation (never use in production)
        const testPrivateKey = '0x0123456789012345678901234567890123456789012345678901234567890123';
        return new ethers.Wallet(testPrivateKey, this.getProvider(networkId));
      }
      
      throw new Error(`Wallet for network ${networkId} not initialized. Make sure you have set the ${networkId.toUpperCase()}_PRIVATE_KEY in your environment variables.`);
    }
    return this.wallets[networkId];
  }

  // Get NFT contract instance for specified network
  public getNftContract(networkId: string): ethers.Contract {
    if (!this.nftContracts[networkId]) {
      // For development/simulation mode, create a mock contract instance
      if (process.env.NODE_ENV === 'development' && process.env.BLOCKCHAIN_SIMULATION === 'true') {
        console.log(`Creating simulation NFT contract for ${networkId}...`);
        
        // Use a dummy address for simulation
        const mockAddress = '0x0000000000000000000000000000000000000001';
        
        // Create a mock contract with the same interface
        const wallet = this.getWallet(networkId);
        this.nftContracts[networkId] = new ethers.Contract(
          mockAddress,
          nftContractAbi,
          wallet
        );
        
        console.log(`Created simulation NFT contract for ${networkId}`);
        return this.nftContracts[networkId];
      }
      
      throw new Error(`NFT contract for network ${networkId} not initialized. Make sure you have set the ${networkId.toUpperCase()}_NFT_CONTRACT_ADDRESS in your environment variables.`);
    }
    return this.nftContracts[networkId];
  }

  // Get Rights contract instance for specified network
  public getRightsContract(networkId: string): ethers.Contract {
    if (!this.rightsContracts[networkId]) {
      // For development/simulation mode, create a mock contract instance
      if (process.env.NODE_ENV === 'development' && process.env.BLOCKCHAIN_SIMULATION === 'true') {
        console.log(`Creating simulation Rights contract for ${networkId}...`);
        
        // Use a dummy address for simulation
        const mockAddress = '0x0000000000000000000000000000000000000002';
        
        // Create a mock contract with the same interface
        const wallet = this.getWallet(networkId);
        this.rightsContracts[networkId] = new ethers.Contract(
          mockAddress,
          rightsContractAbi,
          wallet
        );
        
        console.log(`Created simulation Rights contract for ${networkId}`);
        return this.rightsContracts[networkId];
      }
      
      throw new Error(`Rights contract for network ${networkId} not initialized. Make sure you have set the ${networkId.toUpperCase()}_RIGHTS_CONTRACT_ADDRESS in your environment variables.`);
    }
    return this.rightsContracts[networkId];
  }

  // Check if a network is properly configured
  public isNetworkConfigured(networkId: string): boolean {
    console.log(`Checking if network ${networkId} is configured...`);
    console.log(`Provider exists: ${!!this.providers[networkId]}`);
    console.log(`Wallet exists: ${!!this.wallets[networkId]}`);
    console.log(`NFT contract exists: ${!!this.nftContracts[networkId]}`);
    console.log(`Rights contract exists: ${!!this.rightsContracts[networkId]}`);
    
    // For development/testing, we'll use very relaxed conditions
    if (process.env.NODE_ENV === 'development' && process.env.BLOCKCHAIN_SIMULATION === 'true') {
      console.log('Using relaxed network configuration check for development/testing...');
      
      // In development mode, only require the provider to be configured
      return !!this.providers[networkId];
    }
    
    return (
      !!this.providers[networkId] && 
      !!this.wallets[networkId] && 
      !!this.nftContracts[networkId] && 
      !!this.rightsContracts[networkId]
    );
  }

  // Get the list of configured networks
  public getConfiguredNetworks(): string[] {
    console.log('Getting configured networks...');
    const networks = Object.keys(blockchainNetworks);
    console.log(`All defined networks: ${networks.join(', ')}`);
    
    const configuredNetworks = networks.filter(networkId => this.isNetworkConfigured(networkId));
    console.log(`Configured networks: ${configuredNetworks.join(', ')}`);
    
    return configuredNetworks;
  }

  // Get blockchain network information
  public getNetworkInfo(networkId: string): BlockchainConfig | null {
    return blockchainNetworks[networkId] || null;
  }

  // Record a blockchain transaction in the database
  private async recordTransaction(
    networkId: string,
    transactionHash: string,
    fromAddress: string,
    toAddress: string,
    value: string,
    status: 'pending' | 'confirmed' | 'failed',
    userId: number,
    functionName?: string,
    functionArgs?: Record<string, any>,
    relatedEntityType?: string,
    relatedEntityId?: number
  ) {
    try {
      await createBlockchainTransaction({
        networkId,
        transactionHash,
        fromAddress,
        toAddress,
        value,
        status,
        functionName,
        functionArgs,
        relatedEntityType,
        relatedEntityId,
        userId
      });
      
      return true;
    } catch (error) {
      console.error('Error recording transaction:', error);
      return false;
    }
  }

  // Mint an NFT token for a music asset
  public async mintNFT(
    networkId: string,
    to: string,
    assetId: string,
    metadata: Record<string, any>,
    userId: number
  ): Promise<{ success: boolean; tokenId?: string; transactionHash?: string; error?: string }> {
    try {
      // Check if the network is properly configured
      if (!this.isNetworkConfigured(networkId)) {
        return { success: false, error: `Network ${networkId} is not properly configured` };
      }

      const nftContract = this.getNftContract(networkId);
      const wallet = this.getWallet(networkId);
      
      // Prepare metadata URI (in production, this would be stored on IPFS)
      const metadataUri = `ipfs://${JSON.stringify(metadata)}`;
      
      // Estimate gas
      const gasEstimate = await nftContract.mint.estimateGas(to, metadataUri);
      
      // Send transaction
      const tx = await nftContract.mint(to, metadataUri, {
        gasLimit: Math.floor(Number(gasEstimate) * 1.2) // Add 20% buffer
      });
      
      // Record pending transaction
      await this.recordTransaction(
        networkId,
        tx.hash,
        wallet.address,
        to,
        '0',
        'pending',
        userId,
        'mint',
        { to, metadataUri },
        'nft',
        undefined
      );
      
      // Wait for transaction receipt
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        // Success - extract token ID from event logs
        const mintEvent = receipt.logs.find(
          (log: any) => log.topics[0] === ethers.id('Transfer(address,address,uint256)')
        );
        
        if (!mintEvent) {
          return { success: false, transactionHash: tx.hash, error: 'Mint event not found in transaction logs' };
        }
        
        const tokenId = ethers.toBigInt(mintEvent.topics[3]).toString();
        
        // Store token in database
        await db.insert(nftTokens).values({
          tokenId,
          assetId,
          networkId: networkId as any, // Cast to any to avoid type error with enum
          contractAddress: nftContract.target as string,
          ownerAddress: to,
          transactionHash: tx.hash,
          metadata,
          mintedBy: userId,
          status: 'active'
        });
        
        // Update transaction status to confirmed
        await db.update(blockchainTransactions)
          .set({ 
            status: 'confirmed',
            blockNumber: receipt.blockNumber,
            blockTimestamp: new Date(),
            relatedEntityId: Number(tokenId)
          })
          .where(eq(blockchainTransactions.transactionHash, tx.hash));
        
        return { success: true, tokenId, transactionHash: tx.hash };
      } else {
        // Update transaction status to failed
        await db.update(blockchainTransactions)
          .set({ status: 'failed' })
          .where(eq(blockchainTransactions.transactionHash, tx.hash));
        
        return { success: false, transactionHash: tx.hash, error: 'Transaction failed' };
      }
    } catch (error) {
      console.error('Error minting NFT:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Register rights for a music asset
  public async registerRights(
    networkId: string,
    assetId: string,
    assetType: string,
    rightsType: string,
    ownerType: string,
    ownerAddress: string,
    percentage: number,
    startDate: Date,
    endDate: Date | null,
    territories: string[],
    ownerId: number,
    userId: number
  ): Promise<{ success: boolean; rightsId?: number; transactionHash?: string; error?: string }> {
    try {
      // Check if the network is properly configured
      if (!this.isNetworkConfigured(networkId)) {
        return { success: false, error: `Network ${networkId} is not properly configured` };
      }

      const rightsContract = this.getRightsContract(networkId);
      const wallet = this.getWallet(networkId);
      
      // Convert dates to Unix timestamps
      const startTimestamp = Math.floor(startDate.getTime() / 1000);
      const endTimestamp = endDate ? Math.floor(endDate.getTime() / 1000) : 0;
      
      // Convert asset type, rights type, and owner type to numeric values (enum index)
      const assetTypeIndex = this.assetTypeToIndex(assetType);
      const rightsTypeIndex = this.rightsTypeToIndex(rightsType);
      const ownerTypeIndex = this.ownerTypeToIndex(ownerType);
      
      // Check if we're in simulation mode
      let tx;
      let gasEstimate;
      
      if (process.env.NODE_ENV === 'development' && process.env.BLOCKCHAIN_SIMULATION === 'true') {
        console.log('🔄 Running in blockchain simulation mode for registerRights...');
        
        // Generate a fake transaction hash
        const fakeHash = `0x${Array(64).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`;
        
        // Create a simulated transaction object
        tx = {
          hash: fakeHash,
          wait: async () => {
            // Simulate delay for realistic behavior
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Return a simulated transaction receipt
            return {
              status: 1,
              blockNumber: 12345678,
              logs: [
                {
                  topics: [
                    ethers.id('RightsRegistered(uint256,string,address)'),
                    ethers.toBeHex(Date.now()), // Use timestamp as a unique ID
                    ethers.encodeBytes32String(assetId),
                    ethers.zeroPadValue(ownerAddress, 32)
                  ]
                }
              ]
            };
          }
        };
      } else {
        // Actual blockchain interaction
        
        // Estimate gas
        gasEstimate = await rightsContract.registerRights.estimateGas(
          assetId,
          assetTypeIndex,
          rightsTypeIndex,
          ownerTypeIndex,
          ownerAddress,
          ethers.parseUnits(percentage.toString(), 2), // 2 decimals
          startTimestamp,
          endTimestamp,
          territories
        );
        
        // Send transaction
        tx = await rightsContract.registerRights(
          assetId,
          assetTypeIndex,
          rightsTypeIndex,
          ownerTypeIndex,
          ownerAddress,
          ethers.parseUnits(percentage.toString(), 2), // 2 decimals
          startTimestamp,
          endTimestamp,
          territories,
          {
            gasLimit: Math.floor(Number(gasEstimate) * 1.2) // Add 20% buffer
          }
        );
      }
      
      // Record pending transaction
      await this.recordTransaction(
        networkId,
        tx.hash,
        wallet.address,
        rightsContract.target as string,
        '0',
        'pending',
        userId,
        'registerRights',
        {
          assetId,
          assetType,
          rightsType,
          ownerType,
          ownerAddress,
          percentage,
          startDate: startDate.toISOString(),
          endDate: endDate?.toISOString(),
          territories
        },
        'rights',
        undefined
      );
      
      // Wait for transaction receipt
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        // Success - extract rights ID from event logs
        const rightsRegisteredEvent = receipt.logs.find(
          (log: any) => log.topics[0] === ethers.id('RightsRegistered(uint256,string,address)')
        );
        
        if (!rightsRegisteredEvent) {
          return { success: false, transactionHash: tx.hash, error: 'RightsRegistered event not found in transaction logs' };
        }
        
        const rightsId = Number(ethers.toBigInt(rightsRegisteredEvent.topics[1]));
        
        // Store rights record in database using our helper function to properly handle territories
        const result = await createRightsRecord({
          assetId,
          assetType,
          rightsType,
          ownerType,
          ownerId,
          ownerAddress,
          percentage,
          startDate,
          endDate,
          territories: territories.length > 0 ? territories : [],
          // The parameter name in createRightsRecord is blockchainNetworkId but the column is blockchain_record_id
          blockchainNetworkId: networkId,
          verificationStatus: 'pending'
        });
        
        const dbRightsId = result.id;
        
        // Update transaction status to confirmed
        await db.update(blockchainTransactions)
          .set({ 
            status: 'confirmed',
            blockNumber: receipt.blockNumber,
            blockTimestamp: new Date(),
            relatedEntityId: Number(dbRightsId)
          })
          .where(eq(blockchainTransactions.transactionHash, tx.hash));
        
        return { success: true, rightsId: Number(dbRightsId), transactionHash: tx.hash };
      } else {
        // Update transaction status to failed
        await db.update(blockchainTransactions)
          .set({ status: 'failed' })
          .where(eq(blockchainTransactions.transactionHash, tx.hash));
        
        return { success: false, transactionHash: tx.hash, error: 'Transaction failed' };
      }
    } catch (error) {
      console.error('Error registering rights:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // This has been replaced by the more comprehensive verifyRights implementation below

  // Get token details from the blockchain
  public async getTokenDetails(
    networkId: string,
    tokenId: string
  ): Promise<{ success: boolean; metadata?: string; owner?: string; error?: string }> {
    try {
      // Check if the network is properly configured
      if (!this.isNetworkConfigured(networkId)) {
        return { success: false, error: `Network ${networkId} is not properly configured` };
      }

      const nftContract = this.getNftContract(networkId);
      
      // Get token URI and owner in parallel
      const [tokenUri, owner] = await Promise.all([
        nftContract.tokenURI(tokenId),
        nftContract.ownerOf(tokenId)
      ]);
      
      return {
        success: true,
        metadata: tokenUri,
        owner
      };
    } catch (error) {
      console.error('Error getting token details:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get rights details from the blockchain
  public async getRightsDetails(
    networkId: string,
    rightsId: number
  ): Promise<{ success: boolean; details?: any; error?: string }> {
    try {
      // Check if the network is properly configured
      if (!this.isNetworkConfigured(networkId)) {
        return { success: false, error: `Network ${networkId} is not properly configured` };
      }

      const rightsContract = this.getRightsContract(networkId);
      
      // Get rights info
      const [
        assetId, 
        assetType, 
        rightsType, 
        ownerType, 
        owner, 
        percentage, 
        startDate, 
        endDate, 
        territories, 
        verified
      ] = await rightsContract.getRightsInfo(rightsId);
      
      return {
        success: true,
        details: {
          assetId,
          assetType: this.indexToAssetType(assetType),
          rightsType: this.indexToRightsType(rightsType),
          ownerType: this.indexToOwnerType(ownerType),
          owner,
          percentage: ethers.formatUnits(percentage, 2),
          startDate: new Date(Number(startDate) * 1000),
          endDate: Number(endDate) > 0 ? new Date(Number(endDate) * 1000) : null,
          territories,
          verified
        }
      };
    } catch (error) {
      console.error('Error getting rights details:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Update rights details on the blockchain
  public async updateRights(
    networkId: string,
    rightsId: number,
    percentage: number,
    endDate: Date | null,
    territories: string[],
    userId: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      // Check if the network is properly configured
      if (!this.isNetworkConfigured(networkId)) {
        return { success: false, error: `Network ${networkId} is not properly configured` };
      }

      const rightsContract = this.getRightsContract(networkId);
      const wallet = this.getWallet(networkId);
      
      // Convert endDate to Unix timestamp
      const endTimestamp = endDate ? Math.floor(endDate.getTime() / 1000) : 0;
      
      // Check if we're in simulation mode
      let tx;
      let gasEstimate;
      
      if (process.env.NODE_ENV === 'development' && process.env.BLOCKCHAIN_SIMULATION === 'true') {
        console.log('🔄 Running in blockchain simulation mode for updateRights...');
        
        // Generate a fake transaction hash
        const fakeHash = `0x${Array(64).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`;
        
        // Create a simulated transaction object
        tx = {
          hash: fakeHash,
          wait: async () => {
            // Simulate delay for realistic behavior
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Return a simulated transaction receipt
            return {
              status: 1,
              blockNumber: 12345678,
              logs: [
                {
                  topics: [
                    ethers.id('RightsUpdated(uint256,uint256,uint64,string[])'),
                    ethers.toBeHex(rightsId),
                    ethers.toBeHex(ethers.parseUnits(percentage.toString(), 2)),
                    ethers.toBeHex(endTimestamp)
                  ]
                }
              ]
            };
          }
        };
      } else {
        // Actual blockchain interaction
        
        // Estimate gas
        gasEstimate = await rightsContract.updateRights.estimateGas(
          rightsId,
          ethers.parseUnits(percentage.toString(), 2),
          endTimestamp,
          territories
        );
        
        // Send transaction
        tx = await rightsContract.updateRights(
          rightsId,
          ethers.parseUnits(percentage.toString(), 2),
          endTimestamp,
          territories,
          {
            gasLimit: Math.floor(Number(gasEstimate) * 1.2) // Add 20% buffer
          }
        );
      }
      
      // Record pending transaction
      await this.recordTransaction(
        networkId,
        tx.hash,
        wallet.address,
        rightsContract.target as string,
        '0',
        'pending',
        userId,
        'updateRights',
        {
          rightsId,
          percentage,
          endDate: endDate?.toISOString(),
          territories
        },
        'rights',
        rightsId
      );
      
      // Wait for transaction receipt
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        // Update rights record in database
        await db.update(rightsRecords)
          .set({ 
            percentage: percentage.toString(),
            endDate: endDate ? endDate.toISOString() : null,
            territory: territories.length > 0 ? territories[0] : 'worldwide'
          })
          .where(eq(rightsRecords.id, rightsId));
        
        // Update transaction status to confirmed
        await db.update(blockchainTransactions)
          .set({ 
            status: 'confirmed',
            blockNumber: receipt.blockNumber,
            blockTimestamp: new Date()
          })
          .where(eq(blockchainTransactions.transactionHash, tx.hash));
        
        return { success: true, transactionHash: tx.hash };
      } else {
        // Update transaction status to failed
        await db.update(blockchainTransactions)
          .set({ status: 'failed' })
          .where(eq(blockchainTransactions.transactionHash, tx.hash));
        
        return { success: false, transactionHash: tx.hash, error: 'Transaction failed' };
      }
    } catch (error) {
      console.error('Error updating rights:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Utility functions to convert between string enum and numeric index
  private assetTypeToIndex(assetType: string): number {
    const assetTypes = ['track', 'album', 'composition', 'sample', 'stem', 'remix'];
    return assetTypes.indexOf(assetType);
  }

  private indexToAssetType(index: number): string {
    const assetTypes = ['track', 'album', 'composition', 'sample', 'stem', 'remix'];
    return assetTypes[index] || 'unknown';
  }

  private rightsTypeToIndex(rightsType: string): number {
    const rightsTypes = ['master', 'publishing', 'sync', 'mechanical', 'performance', 'derivative'];
    return rightsTypes.indexOf(rightsType);
  }

  private indexToRightsType(index: number): string {
    const rightsTypes = ['master', 'publishing', 'sync', 'mechanical', 'performance', 'derivative'];
    return rightsTypes[index] || 'unknown';
  }

  private ownerTypeToIndex(ownerType: string): number {
    const ownerTypes = ['artist', 'songwriter', 'producer', 'label', 'publisher', 'distributor'];
    return ownerTypes.indexOf(ownerType);
  }

  private indexToOwnerType(index: number): string {
    const ownerTypes = ['artist', 'songwriter', 'producer', 'label', 'publisher', 'distributor'];
    return ownerTypes[index] || 'unknown';
  }
  
  /**
   * Verify rights record on the blockchain
   * @param networkId - The blockchain network ID
   * @param rightsId - The rights ID to verify
   * @param verifierAddress - Address of the verifier
   * @param signature - Signature from the verifier
   * @param userId - ID of the user performing the verification
   * @returns Verification result
   */
  public async verifyRights(
    networkId: string,
    rightsId: number,
    verifierAddress: string,
    signature: string,
    userId: number
  ): Promise<{ success: boolean; transactionHash?: string; error?: string; verificationStatus?: string }> {
    try {
      // Check if the network is properly configured
      if (!this.isNetworkConfigured(networkId)) {
        return { success: false, error: `Network ${networkId} is not properly configured` };
      }

      // Get rights record from database
      const rightsRecord = await db.select().from(rightsRecords).where(eq(rightsRecords.id, rightsId)).limit(1);
      
      if (!rightsRecord || rightsRecord.length === 0) {
        return { success: false, error: `Rights record with ID ${rightsId} not found` };
      }
      
      // Get contracts and wallet
      const rightsContract = this.getRightsContract(networkId);
      const wallet = this.getWallet(networkId);
      
      // Check if we're in simulation mode
      let tx;
      let gasEstimate;
      
      if (process.env.NODE_ENV === 'development' && process.env.BLOCKCHAIN_SIMULATION === 'true') {
        console.log('🔄 Running in blockchain simulation mode for verifyRights...');
        
        // Generate a fake transaction hash
        const fakeHash = `0x${Array(64).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)).join('')}`;
        
        // Create a simulated transaction object
        tx = {
          hash: fakeHash,
          wait: async () => {
            // Simulate delay for realistic behavior
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Return a simulated transaction receipt
            return {
              status: 1,
              blockNumber: 12345678,
              logs: [
                {
                  topics: [
                    ethers.id('RightsVerified(uint256,address)'),
                    ethers.toBeHex(rightsId),
                    ethers.zeroPadValue(verifierAddress, 32)
                  ]
                }
              ]
            };
          }
        };
      } else {
        // Actual blockchain interaction
        
        // Estimate gas
        gasEstimate = await rightsContract.verifyRights.estimateGas(
          rightsId,
          verifierAddress,
          signature
        );
        
        // Send transaction
        tx = await rightsContract.verifyRights(
          rightsId,
          verifierAddress,
          signature,
          {
            gasLimit: Math.floor(Number(gasEstimate) * 1.2) // Add 20% buffer
          }
        );
      }
      
      // Record pending transaction
      await this.recordTransaction(
        networkId,
        tx.hash,
        wallet.address,
        rightsContract.target as string,
        '0',
        'pending',
        userId,
        'verifyRights',
        {
          rightsId,
          verifierAddress,
          signatureHash: ethers.keccak256(ethers.toUtf8Bytes(signature))
        },
        'rights-verification',
        rightsId
      );
      
      // Wait for transaction receipt
      const receipt = await tx.wait();
      
      if (receipt && receipt.status === 1) {
        // Success - update rights record verification status
        await updateRightsVerificationStatus(
          rightsId,
          'verified',
          userId,
          new Date(),
          tx.hash
        );
        
        // Update transaction status to confirmed
        await updateBlockchainTransactionStatus(
          tx.hash,
          'confirmed',
          receipt.blockNumber,
          new Date()
        );
        
        return { 
          success: true, 
          transactionHash: tx.hash, 
          verificationStatus: 'verified' 
        };
      } else {
        // Update transaction status to failed
        await updateBlockchainTransactionStatus(
          tx.hash,
          'failed'
        );
        
        return { 
          success: false, 
          transactionHash: tx.hash, 
          error: 'Transaction failed', 
          verificationStatus: 'failed' 
        };
      }
    } catch (error) {
      console.error('Error verifying rights:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        verificationStatus: 'error' 
      };
    }
  }

  /**
   * Get rights information from the blockchain
   * @param networkId - The blockchain network ID
   * @param rightsId - The rights ID to get information for
   * @returns Rights information
   */
  public async getRightsInfo(
    networkId: string,
    rightsId: number
  ): Promise<{ 
    success: boolean; 
    data?: {
      assetId: string;
      assetType: string;
      rightsType: string;
      ownerType: string;
      owner: string;
      percentage: number;
      startDate: Date;
      endDate: Date | null;
      territories: string[];
      verified: boolean;
    };
    error?: string 
  }> {
    try {
      // Check if the network is properly configured
      if (!this.isNetworkConfigured(networkId)) {
        return { success: false, error: `Network ${networkId} is not properly configured` };
      }

      // Get rights contract
      const rightsContract = this.getRightsContract(networkId);
      
      let info;
      
      if (process.env.NODE_ENV === 'development' && process.env.BLOCKCHAIN_SIMULATION === 'true') {
        console.log('🔄 Running in blockchain simulation mode for getRightsInfo...');
        
        // First check if we have this record in the database to use real data when possible
        const dbRecord = await db.select().from(rightsRecords).where(eq(rightsRecords.id, rightsId)).limit(1);
        
        if (dbRecord && dbRecord.length > 0) {
          // Create a simulated blockchain response using the database record
          const record = dbRecord[0];
          
          // Ensure we convert Date objects properly and handle any potential type issues
          const startDate = typeof record.startDate === 'string' 
            ? new Date(record.startDate) 
            : record.startDate as Date;
          
          const endDate = record.endDate 
            ? (typeof record.endDate === 'string' ? new Date(record.endDate) : record.endDate as Date)
            : null;
            
          const startDateUnix = startDate 
            ? Math.floor(startDate.getTime() / 1000)
            : Math.floor(Date.now() / 1000) - 86400; // fallback to yesterday
            
          const endDateUnix = endDate 
            ? Math.floor(endDate.getTime() / 1000)
            : 0; // no end date
            
          // Create a properly typed mock blockchain response
          info = {
            assetId: record.assetId.toString(),
            assetType: this.assetTypeToIndex(record.assetType),
            rightsType: this.rightsTypeToIndex(record.rightsType),
            ownerType: this.ownerTypeToIndex(record.ownerType),
            owner: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
            percentage: ethers.parseUnits(record.percentage.toString(), 2),
            startDate: BigInt(startDateUnix),
            endDate: endDateUnix > 0 ? BigInt(endDateUnix) : BigInt(0),
            territories: record.territory ? [record.territory] : ['worldwide'],
            verified: record.verificationStatus === 'verified'
          };
        } else {
          // Create default mock data if we don't have a real record
          info = {
            assetId: `asset-${rightsId}`,
            assetType: 0, // track
            rightsType: 0, // master
            ownerType: 0, // artist
            owner: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
            percentage: ethers.parseUnits('100', 2),
            startDate: BigInt(Math.floor(Date.now() / 1000) - 86400), // yesterday
            endDate: BigInt(0), // no end date
            territories: ['GLOBAL'],
            verified: false
          };
        }
      } else {
        // Call actual contract method on the blockchain
        info = await rightsContract.getRightsInfo(rightsId);
      }
      
      // Validate response
      if (!info || !info.assetId) {
        return { success: false, error: 'Rights information not found on the blockchain' };
      }
      
      // Parse and format the response
      return {
        success: true,
        data: {
          assetId: info.assetId,
          assetType: this.indexToAssetType(info.assetType),
          rightsType: this.indexToRightsType(info.rightsType),
          ownerType: this.indexToOwnerType(info.ownerType),
          owner: info.owner,
          percentage: Number(ethers.formatUnits(info.percentage, 2)), // 2 decimals
          startDate: new Date(Number(info.startDate) * 1000),
          endDate: info.endDate && Number(info.endDate) > 0 ? new Date(Number(info.endDate) * 1000) : null,
          territories: info.territories,
          verified: info.verified
        }
      };
    } catch (error) {
      console.error('Error getting rights info:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check if rights record exists on the blockchain
   * @param networkId - The blockchain network ID
   * @param assetId - The asset ID to check
   * @param ownerAddress - The owner address to check
   * @returns Check result
   */
  public async checkRightsExistence(
    networkId: string,
    assetId: string,
    ownerAddress: string
  ): Promise<{ 
    success: boolean; 
    exists: boolean;
    rightsIds?: number[];
    error?: string 
  }> {
    try {
      // This is a helper method to check if rights exist before trying to register
      
      // Check if we're in simulation mode
      if (process.env.NODE_ENV === 'development' && process.env.BLOCKCHAIN_SIMULATION === 'true') {
        console.log('🔄 Running in blockchain simulation mode for checkRightsExistence...');
        
        // In simulation mode, we'll just check the database directly and simulate the blockchain check
        // Get rights records from database with matching asset ID
        const records = await findRightsRecordsByNetworkAndAssetId(networkId, assetId);
        
        // For simulation, we'll assume any records in the database could exist on the blockchain
        if (records.length === 0) {
          return { success: true, exists: false };
        }
        
        // For each record, create a simulated match
        const matchingRecords = records.map(record => record.id);
        
        // Return a simulated result
        return { 
          success: true, 
          exists: matchingRecords.length > 0,
          rightsIds: matchingRecords.length > 0 ? matchingRecords : undefined
        };
      } else {
        // For actual blockchain mode, get records from database first
        // Get rights records from database with matching asset ID
        const records = await findRightsRecordsByNetworkAndAssetId(networkId, assetId);
        
        // Filter records that have blockchain verification
        const verifiedRecords = records.filter(record => 
          record.verificationStatus === 'verified' &&
          record.verificationTransactionHash
        );
        
        if (verifiedRecords.length === 0) {
          return { success: true, exists: false };
        }
        
        // For each verified record, check if the owner matches
        const matchingRecords = [];
        
        for (const record of verifiedRecords) {
          try {
            // Get rights info from blockchain
            const rightsInfo = await this.getRightsInfo(networkId, record.id);
            
            if (rightsInfo.success && 
                rightsInfo.data && 
                rightsInfo.data.owner.toLowerCase() === ownerAddress.toLowerCase()) {
              matchingRecords.push(record.id);
            }
          } catch (error) {
            console.warn(`Error checking rights info for record ${record.id}:`, error);
            // Continue checking other records
          }
        }
        
        return { 
          success: true, 
          exists: matchingRecords.length > 0,
          rightsIds: matchingRecords.length > 0 ? matchingRecords : undefined
        };
      }
    } catch (error) {
      console.error('Error checking rights existence:', error);
      return { 
        success: false, 
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Export singleton instance
export const blockchainConnector = new BlockchainConnector();