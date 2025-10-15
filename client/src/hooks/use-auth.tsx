import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { User } from '../types/user';
import apiService from '../lib/api-service';
import { useToast } from '@/hooks/use-toast';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/permissions';

// Auth context type definition
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<{ success: boolean; message?: string; id?: number }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Try to retrieve session from backend
        const response = await apiService.auth.checkSession();
        
        if (response && response.isLoggedIn && response.user) {
          setUser(response.user);
        } else {
          // Fallback to local storage if backend check fails
          const savedUser = localStorage.getItem('auth_user');
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch (e) {
              console.error('Failed to parse saved user:', e);
              localStorage.removeItem('auth_user');
            }
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
        // Clear invalid session data
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // Refresh user data from server
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const response = await apiService.auth.checkSession();
      
      if (response && response.isLoggedIn && response.user) {
        setUser(response.user);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await apiService.auth.login(username, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
        
        toast({
          title: "Login successful",
          description: "Welcome back to TuneMantra!",
          variant: "default"
        });
        
        // Navigate to home page after successful login using wouter
        setLocation('/');
        
        return { success: true };
      }
      
      toast({
        title: "Login failed",
        description: response.message || 'Invalid username or password',
        variant: "destructive"
      });
      
      return { 
        success: false, 
        message: response.message || 'Invalid username or password' 
      };
    } catch (error: any) {
      console.error('Login failed:', error);
      
      toast({
        title: "Login error",
        description: error.message || 'An error occurred during login',
        variant: "destructive"
      });
      
      return { 
        success: false, 
        message: error.message || 'An error occurred during login' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      // Call the API to invalidate the session
      await apiService.auth.logout();
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
        variant: "default"
      });
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
      toast({
        title: "Logout error",
        description: "Server logout failed, but you've been logged out locally",
        variant: "default"
      });
    } finally {
      // Clear local state
      setUser(null);
      localStorage.removeItem('auth_user');
      setIsLoading(false);
      
      // Navigate to auth page using wouter
      setLocation('/auth');
    }
  };

  // Register function
  const register = async (userData: any) => {
    setIsLoading(true);
    
    try {
      const response = await apiService.auth.register(userData);
      
      if (response.success) {
        toast({
          title: 'Registration successful',
          description: response.message || 'Your account has been created.',
        });
        
        return { 
          success: true, 
          message: response.message || 'Registration successful!',
          id: response.id
        };
      }
      
      return { 
        success: false, 
        message: response.message || 'Registration failed.' 
      };
    } catch (error: any) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        message: error.message || 'An error occurred during registration'
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Verify email function
  const verifyEmail = async (token: string) => {
    setIsLoading(true);
    
    try {
      // In a real app, we would make an API call here
      // For now, simulate a successful verification
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return { 
        success: true, 
        message: 'Email verification successful! You can now log in.' 
      };
    } catch (error: any) {
      console.error('Email verification failed:', error);
      return { 
        success: false, 
        message: error.message || 'Invalid or expired verification token' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    setIsLoading(true);
    
    try {
      // In a real app, we would make an API call here
      // For now, simulate a successful password reset request
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return { 
        success: true, 
        message: 'If an account with that email exists, a password reset link has been sent.' 
      };
    } catch (error: any) {
      console.error('Forgot password request failed:', error);
      return { 
        success: false, 
        message: error.message || 'An error occurred while processing your request' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string) => {
    setIsLoading(true);
    
    try {
      // In a real app, we would make an API call here
      // For now, simulate a successful password reset
      await new Promise(resolve => setTimeout(resolve, 800));
      
      return { 
        success: true, 
        message: 'Password has been reset successfully! You can now log in with your new password.' 
      };
    } catch (error: any) {
      console.error('Password reset failed:', error);
      return { 
        success: false, 
        message: error.message || 'Invalid or expired reset token' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Permission check helper methods
  const checkPermission = (permission: string) => {
    // Convert user permissions to the correct format expected by the permission functions
    const userPerms = user?.permissions ? 
      Object.entries(user.permissions).reduce((acc, [key, value]) => {
        acc[key] = value === true;
        return acc;
      }, {} as Record<string, boolean>) : 
      undefined;
    
    return hasPermission(user?.role, permission, userPerms);
  };

  const checkAllPermissions = (permissions: string[]) => {
    // Convert user permissions to the correct format expected by the permission functions
    const userPerms = user?.permissions ? 
      Object.entries(user.permissions).reduce((acc, [key, value]) => {
        acc[key] = value === true;
        return acc;
      }, {} as Record<string, boolean>) : 
      undefined;
    
    return hasAllPermissions(user?.role, permissions, userPerms);
  };

  const checkAnyPermission = (permissions: string[]) => {
    // Convert user permissions to the correct format expected by the permission functions
    const userPerms = user?.permissions ? 
      Object.entries(user.permissions).reduce((acc, [key, value]) => {
        acc[key] = value === true;
        return acc;
      }, {} as Record<string, boolean>) : 
      undefined;
    
    return hasAnyPermission(user?.role, permissions, userPerms);
  };

  // Context value
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    register,
    verifyEmail,
    forgotPassword,
    resetPassword,
    refreshUser,
    // Permission helpers
    hasPermission: checkPermission,
    hasAllPermissions: checkAllPermissions,
    hasAnyPermission: checkAnyPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

export default useAuth;