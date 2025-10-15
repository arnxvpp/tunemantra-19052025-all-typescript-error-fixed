import axios from 'axios';

interface LoginCredentials {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    id: number;
    username: string;
    isAdmin: boolean;
  };
}

// Create an admin-specific axios instance with credentials
const adminApi = axios.create({
  baseURL: '/api/admin',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

export async function adminLogin(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await adminApi.post('/login', credentials);
    
    if (response.status === 200) {
      return { 
        success: true, 
        user: response.data.user 
      };
    }
    
    return { 
      success: false, 
      message: response.data.message || 'Authentication failed' 
    };
  } catch (error: any) {
    console.error('Admin login error:', error);
    
    return {
      success: false,
      message: error.response?.data?.message || 'Authentication failed. Please try again.',
    };
  }
}

export async function adminLogout(): Promise<{success: boolean}> {
  try {
    await adminApi.post('/logout');
    return { success: true };
  } catch (error) {
    console.error('Admin logout error:', error);
    return { success: false };
  }
}

export async function checkAdminSession(): Promise<{isLoggedIn: boolean, isAdmin: boolean}> {
  try {
    const response = await adminApi.get('/check-session');
    return { 
      isLoggedIn: true, 
      isAdmin: response.data.isAdmin
    };
  } catch (error) {
    return { isLoggedIn: false, isAdmin: false };
  }
}

export async function getAccountsPending() {
  try {
    const response = await adminApi.get('/accounts/pending');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching pending accounts:', error);
    return { success: false, error: 'Failed to fetch pending accounts' };
  }
}

/**
 * Get all pending subscription approvals
 * @returns Array of user accounts awaiting approval
 */
export async function getPendingApprovals() {
  try {
    const response = await adminApi.get('/approvals/pending');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return { success: false, error: 'Failed to fetch pending approvals' };
  }
}

/**
 * Get details of a specific pending approval
 * @param userId User ID to get approval details for
 * @returns User account details with subscription info
 */
export async function getApprovalDetails(userId: number) {
  try {
    const response = await adminApi.get(`/approvals/${userId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching approval details:', error);
    return { success: false, error: 'Failed to fetch approval details' };
  }
}

/**
 * Get all accounts based on optional filters
 * @param filters Optional filtering parameters
 * @returns Array of user accounts
 */
export async function getAccounts(filters = {}) {
  try {
    const response = await adminApi.get('/accounts', { params: filters });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return { success: false, error: 'Failed to fetch accounts' };
  }
}

/**
 * Update a user account status
 * @param userId User ID to update
 * @param status New status value
 * @param notes Admin notes about the status change
 * @returns Updated user data
 */
export async function updateAccountStatus(userId: number, status: string, notes: string) {
  try {
    const response = await adminApi.put(`/accounts/${userId}/status`, { status, notes });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error updating account status:', error);
    return { success: false, error: 'Failed to update account status' };
  }
}

/**
 * Approve a user's subscription payment
 * @param userId User ID to approve
 * @param notes Optional admin notes about the approval
 * @returns Success status and message
 */
export async function approveAccountPayment(userId: number, notes: string) {
  try {
    const response = await adminApi.post(`/approvals/${userId}/approve`, { notes });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error approving payment:', error);
    return { success: false, error: 'Failed to approve payment' };
  }
}

/**
 * Reject a user's subscription payment
 * @param userId User ID to reject
 * @param notes Required admin notes about rejection reason
 * @returns Success status and message
 */
export async function rejectAccountPayment(userId: number, notes: string) {
  try {
    if (!notes || notes.trim() === '') {
      return { success: false, error: 'Rejection reason is required' };
    }
    
    const response = await adminApi.post(`/approvals/${userId}/reject`, { notes });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return { success: false, error: 'Failed to reject payment' };
  }
}

/**
 * Batch approve multiple user payments
 * @param userIds Array of user IDs to approve
 * @param notes Optional admin notes about batch approval
 * @returns Success status and message
 */
export async function batchApprovePayments(userIds: number[], notes: string) {
  try {
    const response = await adminApi.post('/approvals/batch/approve', { userIds, notes });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error in batch approval:', error);
    return { success: false, error: 'Failed to process batch approval' };
  }
}

export async function getAdminStats() {
  try {
    const response = await adminApi.get('/stats');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return { success: false, error: 'Failed to fetch admin stats' };
  }
}

export default {
  adminLogin,
  adminLogout,
  checkAdminSession,
  getAccountsPending,
  getPendingApprovals,
  getApprovalDetails,
  getAccounts,
  updateAccountStatus,
  approveAccountPayment,
  rejectAccountPayment,
  batchApprovePayments,
  getAdminStats
};