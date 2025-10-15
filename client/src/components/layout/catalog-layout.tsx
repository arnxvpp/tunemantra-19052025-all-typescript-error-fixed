import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Separator } from "@/components/ui/separator";
import { Music, ListMusic, Upload, CalendarClock, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatalogLayoutProps {
  children: ReactNode;
}

/**
 * Catalog Layout
 * 
 * This component provides a consistent layout for all catalog-related pages,
 * including a tabbed navigation system for moving between different
 * catalog management views.
 */
export function CatalogLayout({ children }: CatalogLayoutProps) {
  const [location] = useLocation();

  // Navigation items
  const navItems = [
    {
      href: "/catalog/releases",
      label: "Releases",
      icon: <Music className="h-4 w-4 mr-2" />,
      active: location === '/catalog' || location.includes('/catalog/releases')
    },
    {
      href: "/catalog/tracks",
      label: "Tracks",
      icon: <ListMusic className="h-4 w-4 mr-2" />,
      active: location.includes('/catalog/tracks')
    },
    {
      href: "/catalog/bulk-upload",
      label: "Bulk Upload",
      icon: <Upload className="h-4 w-4 mr-2" />,
      active: location.includes('/catalog/bulk-upload')
    },
    {
      href: "/catalog/distribution-schedule",
      label: "Distribution Schedule",
      icon: <CalendarClock className="h-4 w-4 mr-2" />,
      active: location.includes('/catalog/distribution-schedule')
    },
    {
      href: "/catalog/distribution-analytics",
      label: "Distribution Analytics",
      icon: <BarChart2 className="h-4 w-4 mr-2" />,
      active: location.includes('/catalog/distribution-analytics')
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catalog Management</h1>
        <p className="text-muted-foreground">
          Manage your music catalog, tracks, and distribution
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

export default CatalogLayout;