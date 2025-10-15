import React, { useState, useEffect } from 'react';
import { Redirect, useLocation } from 'wouter';
import { useAdminAuth } from '../hooks/use-admin-auth';
import { Loader2 } from 'lucide-react';

interface AdminProtectedRouteProps {
  component: React.ComponentType<any>;
  path: string;
  exact?: boolean;
}

/**
 * AdminProtectedRoute: Component that protects admin routes by checking for admin authentication
 * 
 * This component:
 * 1. Checks if the user is authenticated as an admin
 * 2. If authenticated, renders the requested component
 * 3. If not authenticated, redirects to the admin login page
 * 4. Shows a loading state while checking authentication
 * 
 * @param component - The component to render if authenticated
 * @param path - The current route path (for debugging)
 * @param exact - Whether the route should match exactly
 */
const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  component: Component, 
  path,
  ...rest 
}) => {
  const { admin, isAuthenticated, isLoading } = useAdminAuth();
  const [, setLocation] = useLocation();
  const [showingLoader, setShowingLoader] = useState(true);

  // Effect to hide loader after a minimum display time
  // This prevents UI flashes for quick auth checks
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowingLoader(false);
    }, 750);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loader while checking authentication
  if (isLoading || showingLoader) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-semibold">Authenticating...</h2>
          <p className="text-muted-foreground">Please wait while we verify your access.</p>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to admin login
  if (!isAuthenticated) {
    console.log('Admin not authenticated, redirecting to login page');
    
    // Use a timeout to ensure state is consistent before redirecting
    setTimeout(() => {
      // Force a clean navigation to login page
      window.location.href = '/admin/login';
    }, 100);
    
    // Return a loader while redirecting
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Authenticated, render the protected component
  return <Component {...rest} />;
};

export default AdminProtectedRoute;