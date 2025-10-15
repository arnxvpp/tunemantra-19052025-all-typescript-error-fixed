import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Separator } from "@/components/ui/separator";
import { BarChart2, LineChart, PieChart, TrendingUp, DollarSign, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsLayoutProps {
  children: ReactNode;
}

/**
 * Analytics Layout
 * 
 * This component provides a consistent layout for all analytics pages,
 * including a tabbed navigation system for moving between different
 * analytics views.
 */
export function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  const [location] = useLocation();
  
  // Navigation items
  const navItems = [
    {
      href: "/analytics/dashboard",
      label: "Dashboard",
      icon: <BarChart2 className="h-4 w-4 mr-2" />,
      active: location === '/analytics' || location === '/analytics/dashboard'
    },
    {
      href: "/analytics/trends",
      label: "Trends",
      icon: <TrendingUp className="h-4 w-4 mr-2" />,
      active: location.includes('/analytics/trends')
    },
    {
      href: "/analytics/engagement",
      label: "Engagement",
      icon: <LineChart className="h-4 w-4 mr-2" />,
      active: location.includes('/analytics/engagement')
    },
    {
      href: "/analytics/revenue",
      label: "Revenue",
      icon: <DollarSign className="h-4 w-4 mr-2" />,
      active: location.includes('/analytics/revenue')
    },
    {
      href: "/analytics/import-reports",
      label: "Import Reports",
      icon: <Share2 className="h-4 w-4 mr-2" />,
      active: location.includes('/analytics/import-reports')
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track, visualize, and analyze your music performance data
        </p>
      </div>
      
      <Separator className="my-6" />
      
      {/* Custom Tab Navigation */}
      <div className="flex overflow-x-auto pb-2 -mb-px">
        <div className="flex space-x-1">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "flex items-center px-4 py-2 rounded-md font-medium text-sm transition-colors duration-200",
                item.active 
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      
      {/* Page content */}
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}

export default AnalyticsLayout;