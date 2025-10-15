import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BarChart3, Users, TrendingUp, DollarSign, Globe, FileSpreadsheet } from "lucide-react";
import { useState, useEffect } from "react";
import { PageLoader } from "@/components/ui/page-loader";
import { RoleBasedContent } from "@/components/RoleBasedContent";

// Define the route types
interface RouteItem {
  href: string;
  icon: React.ElementType;
  label: string;
  adminOnly?: boolean;
}

// Define standard routes available to all users with analytics access
const standardRoutes: RouteItem[] = [
  { href: "/analytics/dashboard", icon: BarChart3, label: "Dashboard" },
  { href: "/analytics/trends", icon: TrendingUp, label: "Trends" },
  { href: "/analytics/engagement", icon: Users, label: "Engagement" },
  { href: "/analytics/revenue", icon: DollarSign, label: "Revenue" },
  { href: "/analytics/geo", icon: Globe, label: "Geo" }
];

// Define admin-only routes
const adminRoutes: RouteItem[] = [
  { href: "/analytics/import-reports", icon: FileSpreadsheet, label: "Import Reports", adminOnly: true }
];

export function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [lastLocation, setLastLocation] = useState(location);

  // Effect to handle page transitions
  useEffect(() => {
    if (location !== lastLocation) {
      setIsLoading(true);
      setLastLocation(location);

      // Simulate loading delay with a timeout
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800); // Adjust loading time as needed

      return () => clearTimeout(timer);
    }
  }, [location, lastLocation]);

  return (
    <div className="space-y-6">
      <PageLoader isLoading={isLoading} />
      {/* Analytics Sub-Navigation */}
      <div className="border-b border-border">
        <nav className="flex space-x-2 py-4">
          {/* Standard routes visible to all users */}
          {standardRoutes.map((route) => (
            <Button
              key={route.href}
              variant={location === route.href ? "default" : "ghost"}
              className={cn(
                "flex items-center gap-2",
                location === route.href && "bg-primary text-primary-foreground"
              )}
              asChild
            >
              <Link href={route.href}>
                <route.icon className="h-4 w-4" />
                <span>{route.label}</span>
              </Link>
            </Button>
          ))}
          
          {/* Admin-only routes with role-based access control */}
          {adminRoutes.map((route) => (
            <RoleBasedContent key={route.href} allowedRoles={['admin']}>
              <Button
                variant={location === route.href ? "default" : "ghost"}
                className={cn(
                  "flex items-center gap-2",
                  location === route.href && "bg-primary text-primary-foreground"
                )}
                asChild
              >
                <Link href={route.href}>
                  <route.icon className="h-4 w-4" />
                  <span>{route.label}</span>
                </Link>
              </Button>
            </RoleBasedContent>
          ))}
        </nav>
      </div>

      {/* Content Section */}
      {children}
    </div>
  );
}