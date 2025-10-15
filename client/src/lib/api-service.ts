/**
 * API Service
 * 
 * This service provides a consistent interface for making API calls to the backend.
 * It handles common tasks like authentication, error handling, and response parsing.
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Create base axios instance with common configuration
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle session expiration
    if (error.response?.status === 401) {
      // If we get a 401 from any endpoint other than login, redirect to login
      if (!error.config?.url?.includes('/login')) {
        console.warn('Session expired. Redirecting to login page.');
        // Check if this is an admin endpoint
        if (error.config?.url?.includes('/admin')) {
          window.location.href = '/admin/login';
        } else {
          window.location.href = '/auth';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Types for API responses
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Common API service methods
export const apiService = {
  // User Authentication
  auth: {
    login: async (username: string, password: string) => {
      try {
        const response = await api.post('/login', { username, password });
        return response.data;
      } catch (error) {
        console.error('Login error:', error);
        throw handleApiError(error);
      }
    },
    
    logout: async () => {
      try {
        const response = await api.post('/logout');
        return response.data;
      } catch (error) {
        console.error('Logout error:', error);
        throw handleApiError(error);
      }
    },
    
    register: async (userData: any) => {
      try {
        const response = await api.post('/register', userData);
        return response.data;
      } catch (error) {
        console.error('Registration error:', error);
        throw handleApiError(error);
      }
    },
    
    checkSession: async () => {
      try {
        const response = await api.get('/check-session');
        return response.data;
      } catch (error) {
        console.error('Session check error:', error);
        throw handleApiError(error);
      }
    }
  },
  
  // Admin specific endpoints
  admin: {
    login: async (username: string, password: string) => {
      try {
        const response = await api.post('/admin/login', { username, password });
        return response.data;
      } catch (error) {
        console.error('Admin login error:', error);
        throw handleApiError(error);
      }
    },
    
    logout: async () => {
      try {
        const response = await api.post('/admin/logout');
        return response.data;
      } catch (error) {
        console.error('Admin logout error:', error);
        throw handleApiError(error);
      }
    },
    
    checkSession: async () => {
      try {
        const response = await api.get('/admin/check-session');
        return response.data;
      } catch (error) {
        console.error('Admin session check error:', error);
        throw handleApiError(error);
      }
    },
    
    getUsers: async (filter?: { status?: string, search?: string, page?: number, limit?: number }) => {
      try {
        const response = await api.get('/admin/users', { params: filter });
        return response.data;
      } catch (error) {
        console.error('Get users error:', error);
        throw handleApiError(error);
      }
    },
    
    updateUserStatus: async (userId: number, status: string) => {
      try {
        const response = await api.patch(`/admin/users/${userId}/status`, { status });
        return response.data;
      } catch (error) {
        console.error('Update user status error:', error);
        throw handleApiError(error);
      }
    },

    getStatistics: async () => {
      try {
        const response = await api.get('/admin/statistics');
        return response.data;
      } catch (error) {
        console.error('Get statistics error:', error);
        throw handleApiError(error);
      }
    }
  },
  
  // Catalog Management
  catalog: {
    getTracks: async (userId?: number) => {
      try {
        const params = userId ? { userId } : undefined;
        const response = await api.get('/tracks', { params });
        return response.data;
      } catch (error) {
        console.error('Get tracks error:', error);
        throw handleApiError(error);
      }
    },
    
    createTrack: async (trackData: any) => {
      try {
        const response = await api.post('/tracks', trackData);
        return response.data;
      } catch (error) {
        console.error('Create track error:', error);
        throw handleApiError(error);
      }
    },
    
    updateTrack: async (trackId: number, trackData: any) => {
      try {
        const response = await api.patch(`/tracks/${trackId}`, trackData);
        return response.data;
      } catch (error) {
        console.error('Update track error:', error);
        throw handleApiError(error);
      }
    },
    
    getReleases: async (userId?: number) => {
      try {
        const params = userId ? { userId } : undefined;
        const response = await api.get('/releases', { params });
        return response.data;
      } catch (error) {
        console.error('Get releases error:', error);
        throw handleApiError(error);
      }
    },
    
    getRelease: async (releaseId: number) => {
      try {
        const response = await api.get(`/releases/${releaseId}`);
        return response.data;
      } catch (error) {
        console.error('Get release error:', error);
        throw handleApiError(error);
      }
    },
    
    createRelease: async (releaseData: any) => {
      try {
        const response = await api.post('/releases', releaseData);
        return response.data;
      } catch (error) {
        console.error('Create release error:', error);
        throw handleApiError(error);
      }
    },
    
    updateRelease: async (releaseId: number, releaseData: any) => {
      try {
        const response = await api.patch(`/releases/${releaseId}`, releaseData);
        return response.data;
      } catch (error) {
        console.error('Update release error:', error);
        throw handleApiError(error);
      }
    }
  },
  
  // Analytics
  analytics: {
    getTrackAnalytics: async (trackId: number) => {
      try {
        const response = await api.get(`/analytics/tracks/${trackId}`);
        return response.data;
      } catch (error) {
        console.error('Get track analytics error:', error);
        throw handleApiError(error);
      }
    },
    
    getReleaseAnalytics: async (releaseId: number) => {
      try {
        const response = await api.get(`/analytics/releases/${releaseId}`);
        return response.data;
      } catch (error) {
        console.error('Get release analytics error:', error);
        throw handleApiError(error);
      }
    },
    
    getUserDailyStats: async (userId: number, startDate?: string, endDate?: string) => {
      try {
        const params: Record<string, any> = { userId };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        
        const response = await api.get('/analytics/daily-stats', { params });
        return response.data;
      } catch (error) {
        console.error('Get user daily stats error:', error);
        throw handleApiError(error);
      }
    }
  },
  
  // Payments and royalties
  finance: {
    getPaymentMethods: async () => {
      try {
        const response = await api.get('/payment-methods');
        return response.data;
      } catch (error) {
        console.error('Get payment methods error:', error);
        throw handleApiError(error);
      }
    },
    
    createPaymentMethod: async (methodData: any) => {
      try {
        const response = await api.post('/payment-methods', methodData);
        return response.data;
      } catch (error) {
        console.error('Create payment method error:', error);
        throw handleApiError(error);
      }
    },
    
    getWithdrawals: async () => {
      try {
        const response = await api.get('/withdrawals');
        return response.data;
      } catch (error) {
        console.error('Get withdrawals error:', error);
        throw handleApiError(error);
      }
    },
    
    createWithdrawal: async (withdrawalData: any) => {
      try {
        const response = await api.post('/withdrawals', withdrawalData);
        return response.data;
      } catch (error) {
        console.error('Create withdrawal error:', error);
        throw handleApiError(error);
      }
    },
    
    getRoyaltyCalculations: async (params?: any) => {
      try {
        const response = await api.get('/royalty-calculations', { params });
        return response.data;
      } catch (error) {
        console.error('Get royalty calculations error:', error);
        throw handleApiError(error);
      }
    },
    
    getRevenueShares: async (releaseId: number) => {
      try {
        const response = await api.get(`/revenue-shares/${releaseId}`);
        return response.data;
      } catch (error) {
        console.error('Get revenue shares error:', error);
        throw handleApiError(error);
      }
    },
    
    createRevenueShare: async (shareData: any) => {
      try {
        const response = await api.post('/revenue-shares', shareData);
        return response.data;
      } catch (error) {
        console.error('Create revenue share error:', error);
        throw handleApiError(error);
      }
    }
  },
  
  // Distribution
  distribution: {
    getDistributionPlatforms: async () => {
      try {
        const response = await api.get('/distribution-platforms');
        return response.data;
      } catch (error) {
        console.error('Get distribution platforms error:', error);
        throw handleApiError(error);
      }
    },
    
    getDistributionRecords: async (releaseId?: number) => {
      try {
        const params = releaseId ? { releaseId } : undefined;
        const response = await api.get('/distribution-records', { params });
        return response.data;
      } catch (error) {
        console.error('Get distribution records error:', error);
        throw handleApiError(error);
      }
    },
    
    createDistributionRecord: async (recordData: any) => {
      try {
        const response = await api.post('/distribution-records', recordData);
        return response.data;
      } catch (error) {
        console.error('Create distribution record error:', error);
        throw handleApiError(error);
      }
    },
    
    getScheduledDistributions: async () => {
      try {
        const response = await api.get('/scheduled-distributions');
        return response.data;
      } catch (error) {
        console.error('Get scheduled distributions error:', error);
        throw handleApiError(error);
      }
    },
    
    createScheduledDistribution: async (distributionData: any) => {
      try {
        const response = await api.post('/scheduled-distributions', distributionData);
        return response.data;
      } catch (error) {
        console.error('Create scheduled distribution error:', error);
        throw handleApiError(error);
      }
    },
    
    updateScheduledDistribution: async (id: number, updateData: any) => {
      try {
        const response = await api.patch(`/scheduled-distributions/${id}`, updateData);
        return response.data;
      } catch (error) {
        console.error('Update scheduled distribution error:', error);
        throw handleApiError(error);
      }
    }
  },
  
  // Upload helpers
  upload: {
    uploadTrackFile: async (file: File, metadata: any) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('metadata', JSON.stringify(metadata));
        
        const response = await api.post('/upload/track', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } catch (error) {
        console.error('Upload track error:', error);
        throw handleApiError(error);
      }
    },
    
    uploadArtwork: async (file: File, type: 'release' | 'artist') => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        const response = await api.post('/upload/artwork', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } catch (error) {
        console.error('Upload artwork error:', error);
        throw handleApiError(error);
      }
    }
  }
};

// Error handling helper
function handleApiError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    // Extract error message from response if available
    const errorMessage = 
      axiosError.response?.data?.message || 
      axiosError.message || 
      'An unknown error occurred';
    
    return new Error(errorMessage);
  }
  
  // For non-Axios errors, return as is or wrapped
  return error instanceof Error ? error : new Error(String(error));
}

export default apiService;