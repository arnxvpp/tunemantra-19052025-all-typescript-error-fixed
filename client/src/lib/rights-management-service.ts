import { apiRequest } from './queryClient';
import { RegisterRightsParams } from '../web3/types';

/**
 * Interface for rights details response from the API
 */
export interface RightsDetails {
  id: number;
  assetId: string;
  assetType: string;
  rightsType: string;
  ownerType: string;
  percentage: number;
  territory?: string;
  startDate: string;
  endDate?: string | null;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  tokenId?: string;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Response for rights registration
 */
export interface RegisterRightsResponse {
  success: boolean;
  rightsId?: number;
  tokenId?: string;
  message?: string;
}

/**
 * Register rights for a music asset
 * @param params Rights registration parameters
 * @returns Promise with registration result
 */
export async function registerRights(params: RegisterRightsParams): Promise<RegisterRightsResponse> {
  try {
    const response = await apiRequest<RegisterRightsResponse>('/api/rights-management/register', {
      method: 'POST',
      data: params
    });
    
    return response;
  } catch (error) {
    console.error('Error registering rights:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to register rights'
    };
  }
}

/**
 * Get rights details by ID
 * @param rightsId The ID of the rights record
 * @returns Promise with rights details
 */
export async function getRightsById(rightsId: number): Promise<RightsDetails | null> {
  try {
    const response = await apiRequest<RightsDetails>(`/api/rights-management/rights/${rightsId}`);
    return response;
  } catch (error) {
    console.error('Error fetching rights details:', error);
    return null;
  }
}

/**
 * Get rights by asset
 * @param assetId Asset identifier
 * @param rightsType Optional rights type filter
 * @returns Promise with array of rights details
 */
export async function getRightsByAsset(assetId: string, rightsType?: string): Promise<RightsDetails[]> {
  try {
    const endpoint = '/api/rights-management/rights/by-asset';
    const response = await apiRequest<RightsDetails[]>(endpoint, {
      method: 'POST',
      data: {
        assetId,
        rightsType
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching rights by asset:', error);
    return [];
  }
}

/**
 * Get all rights for the current user
 * @returns Promise with array of rights details
 */
export async function getUserRights(): Promise<RightsDetails[]> {
  try {
    const response = await apiRequest<RightsDetails[]>('/api/rights-management/rights/user');
    return response;
  } catch (error) {
    console.error('Error fetching user rights:', error);
    return [];
  }
}

/**
 * Update rights verification status
 * @param rightsId The ID of the rights record
 * @param status New verification status
 * @param tokenId Optional blockchain token ID
 * @param transactionHash Optional blockchain transaction hash
 * @returns Promise with updated rights details
 */
export async function updateRightsVerificationStatus(
  rightsId: number,
  status: 'pending' | 'verified' | 'rejected',
  tokenId?: string,
  transactionHash?: string
): Promise<RightsDetails | null> {
  try {
    const response = await apiRequest<RightsDetails>(`/api/rights-management/rights/${rightsId}/verification`, {
      method: 'PUT',
      data: {
        status,
        tokenId,
        transactionHash
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error updating rights verification status:', error);
    return null;
  }
}

/**
 * Delete rights record
 * @param rightsId The ID of the rights record
 * @returns Promise with success status
 */
export async function deleteRights(rightsId: number): Promise<{ success: boolean, message?: string }> {
  try {
    const response = await apiRequest<{ success: boolean, message?: string }>(`/api/rights-management/rights/${rightsId}`, {
      method: 'DELETE'
    });
    
    return response;
  } catch (error) {
    console.error('Error deleting rights:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete rights'
    };
  }
}