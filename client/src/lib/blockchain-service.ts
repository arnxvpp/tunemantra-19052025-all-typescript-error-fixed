import { apiRequest } from './queryClient';
import { MintParams, TransferParams, VerifyRightsParams, RegisterRightsParams } from '../web3/types';

/**
 * Interface for NFT details response
 */
export interface NFTDetails {
  tokenId: string;
  owner: string;
  metadata: {
    name: string;
    description: string;
    image?: string;
    attributes: Array<{
      trait_type: string;
      value: string | number;
    }>;
    [key: string]: any;
  };
  contract: string;
  chainId: number;
  transactionHash: string;
  timestamp: number;
}

/**
 * Mint a new NFT token for a track
 * @param trackId Track ID to mint
 * @param networkId Optional blockchain network ID
 * @returns Promise with minting result
 */
export async function mintTrackNFT(trackId: number, networkId?: string): Promise<{ success: boolean; tokenId?: string; message?: string }> {
  try {
    const response = await apiRequest<{ success: boolean; tokenId?: string; message?: string }>('/api/blockchain/mint-track', {
      method: 'POST',
      data: {
        trackId,
        networkId
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error minting Track NFT:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to mint NFT'
    };
  }
}

/**
 * Register rights with blockchain
 * @param params Rights registration parameters
 * @returns Promise with registration result
 */
export async function registerRightsWithBlockchain(params: RegisterRightsParams): Promise<{
  success: boolean;
  tokenId?: string;
  rightsId?: number;
  message?: string;
}> {
  try {
    const response = await apiRequest<{
      success: boolean;
      tokenId?: string;
      rightsId?: number;
      message?: string;
    }>('/api/blockchain/register-rights', {
      method: 'POST',
      data: params
    });
    
    return response;
  } catch (error) {
    console.error('Error registering rights with blockchain:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to register rights with blockchain'
    };
  }
}

/**
 * Verify rights on blockchain
 * @param params Rights verification parameters
 * @returns Promise with verification result (boolean)
 */
export async function verifyRightsWithBlockchain(params: VerifyRightsParams): Promise<boolean> {
  try {
    const response = await apiRequest<{ verified: boolean }>('/api/blockchain/verify-rights', {
      method: 'POST',
      data: params
    });
    
    return response.verified;
  } catch (error) {
    console.error('Error verifying rights on blockchain:', error);
    return false;
  }
}

/**
 * Transfer rights token to another address
 * @param params Transfer parameters
 * @returns Promise with transfer result
 */
export async function transferRightsToken(params: TransferParams): Promise<{ success: boolean; message?: string; transaction?: string }> {
  try {
    const response = await apiRequest<{ success: boolean; message?: string; transaction?: string }>('/api/blockchain/transfer-rights', {
      method: 'POST',
      data: params
    });
    
    return response;
  } catch (error) {
    console.error('Error transferring rights token:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to transfer rights token'
    };
  }
}

/**
 * Get NFT details by token ID
 * @param tokenId The token ID
 * @param networkId Optional blockchain network ID
 * @returns Promise with NFT details
 */
export async function getNFTDetails(tokenId: string, networkId?: string): Promise<NFTDetails | null> {
  try {
    const response = await apiRequest<{ success: boolean; details?: NFTDetails; message?: string }>('/api/blockchain/nft-details', {
      method: 'POST',
      data: {
        tokenId,
        networkId
      }
    });
    
    if (response.success && response.details) {
      return response.details;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching NFT details:', error);
    return null;
  }
}

/**
 * Get NFT balance for an address
 * @param address Blockchain address to check
 * @param networkId Optional blockchain network ID
 * @returns Promise with balance count
 */
export async function getNFTBalance(address: string, networkId?: string): Promise<number> {
  try {
    const response = await apiRequest<{ success: boolean; balance: number; message?: string }>('/api/blockchain/nft-balance', {
      method: 'POST',
      data: {
        address,
        networkId
      }
    });
    
    if (response.success) {
      return response.balance;
    }
    
    return 0;
  } catch (error) {
    console.error('Error fetching NFT balance:', error);
    return 0;
  }
}

/**
 * Get supported blockchain networks
 * @returns Promise with array of supported networks
 */
export async function getSupportedNetworks(): Promise<Array<{ id: string; name: string; chainId: number; active: boolean }>> {
  try {
    const response = await apiRequest<{ networks: Array<{ id: string; name: string; chainId: number; active: boolean }> }>('/api/blockchain/networks');
    
    return response.networks;
  } catch (error) {
    console.error('Error fetching supported networks:', error);
    return [];
  }
}