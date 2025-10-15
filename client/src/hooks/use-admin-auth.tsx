import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import apiService from '../lib/api-service';
import { useToast } from '@/hooks/use-toast';

// Admin user type
export interface AdminUser {
  id: number;
  username: string;
  role: string;
  permissions: Record<string, boolean>;
}

// Admin auth context type definition
export interface AdminAuthContextType {
  admin: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  adminLogout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
}

// Create admin auth context
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Admin auth provider component
export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check for existing admin session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Try to retrieve admin session from backend
        const response = await apiService.admin.checkSession();
        
        if (response && response.isLoggedIn && response.admin) {
          setAdmin(response.admin);
        } else {
          // Fallback to local storage if backend check fails
          const savedAdmin = localStorage.getItem('admin_user');
          if (savedAdmin) {
            try {
              setAdmin(JSON.parse(savedAdmin));
            } catch (e) {
              console.error('Failed to parse saved admin:', e);
              localStorage.removeItem('admin_user');
            }
          }
        }
      } catch (error) {
        console.error('Admin session check failed:', error);
        // Clear invalid session data
        localStorage.removeItem('admin_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Refresh admin data from server
  const refreshAdmin = async () => {
    if (!admin) return;
    
    try {
      setIsLoading(true);
      const response = await apiService.admin.checkSession();
      
      if (response && response.isLoggedIn && response.admin) {
        setAdmin(response.admin);
        localStorage.setItem('admin_user', JSON.stringify(response.admin));
      }
    } catch (error) {
      console.error('Failed to refresh admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Admin login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await apiService.admin.login(username, password);
      
      if (response.success && response.admin) {
        setAdmin(response.admin);
        localStorage.setItem('admin_user', JSON.stringify(response.admin));
        
        // Notify success
        toast({
          title: 'Login successful',
          description: 'You have been logged in as an administrator.',
        });
        
        // Force a complete page reload to ensure clean state
        setTimeout(() => {
          window.location.href = '/admin/dashboard';
        }, 300);
        
        return { success: true };
      }
      
      return { 
        success: false, 
        message: response.message || 'Invalid administrator credentials' 
      };
    } catch (error: any) {
      console.error('Admin login failed:', error);
      return { 
        success: false, 
        message: error.message || 'An error occurred during login' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Admin logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Call the API to invalidate the session
      await apiService.admin.logout();
      
      toast({
        title: "Admin logout successful",
        description: "You have been logged out of the admin panel",
        variant: "default"
      });
    } catch (error) {
      console.error('Admin logout API call failed:', error);
      
      // Continue with local logout even if API call fails
      toast({
        title: "Logout warning",
        description: "Server logout failed, but you've been logged out locally",
        variant: "default"
      });
    } finally {
      // Clear local state
      setAdmin(null);
      localStorage.removeItem('admin_user');
      setIsLoading(false);
      
      // Force a complete page reload to clear any lingering state
      window.location.href = '/admin/login';
    }
  };

  // Context value
  const value = {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    isAdmin: !!admin,
    login,
    logout,
    adminLogout: logout, // Alias for consistent naming
    refreshAdmin
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Hook for using admin auth context
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  
  return context;
}

export default useAdminAuth;