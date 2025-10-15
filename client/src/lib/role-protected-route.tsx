import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

/**
 * Role-based protected route component
 * 
 * This component extends the standard ProtectedRoute to add role-based access control.
 * It only renders the protected component if the user has the required role.
 * 
 * @param path - The route path
 * @param component - The component to render if authorized
 * @param requiredRoles - Array of roles that are allowed to access this route
 * @param adminOnly - If true, only admin users can access the route (shorthand for requiredRoles=['admin'])
 */
export function RoleProtectedRoute({
  path,
  component: Component,
  requiredRoles = [],
  adminOnly = false,
}: {
  path: string;
  component: React.ComponentType;
  requiredRoles?: Array<string>;
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Not authenticated at all
  if (!user) {
    return <Redirect to="/auth" />;
  }

  // Check for admin-only routes
  if (adminOnly && user.role !== 'admin') {
    // Redirect to a permission denied page or dashboard
    return <Redirect to="/dashboard" />;
  }

  // Check for role-based access
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Redirect to a permission denied page or dashboard
    return <Redirect to="/dashboard" />;
  }

  // User has the required role, render the component
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}