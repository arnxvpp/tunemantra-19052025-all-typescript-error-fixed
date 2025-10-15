import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { 
  User, 
  Shield, 
  CreditCard, 
  Music2, 
  Settings as SettingsIcon, 
  Calendar, 
  Users,
  KeyRound,
  BookOpen
} from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";

const routes = [
  {
    href: "/settings/profile",
    label: "Profile",
    icon: User,
    roles: ['admin', 'manager', 'artist']
  },
  {
    href: "/settings/team",
    label: "Team Management",
    icon: Users,
    roles: ['admin']
  },
  {
    href: "/settings/permissions",
    label: "Permission Templates",
    icon: KeyRound,
    roles: ['admin']
  },
  {
    href: "/settings/sub-labels",
    label: "Sub-Labels",
    icon: BookOpen,
    roles: ['admin']
  },
  {
    href: "/settings/catalog",
    label: "Catalog",
    icon: Music2,
    roles: ['admin', 'manager', 'artist']
  },
  {
    href: "/settings/billing",
    label: "Billing",
    icon: CreditCard,
    roles: ['admin', 'manager']
  },
  {
    href: "/settings",
    label: "General",
    icon: SettingsIcon,
    roles: ['admin', 'manager', 'artist']
  }
];

export function SettingsLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, hasPermission } = useAuth();
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
    <MainLayout>
      <PageLoader isLoading={isLoading} />
      <div className="container py-6">
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <nav className="flex flex-row space-x-2 overflow-x-auto px-4 lg:flex-col lg:space-x-0 lg:space-y-1">
              {routes.map((route) => {
                // Check if user's role is included in the allowed roles for the route
                const userRole = user?.role;
                if (!userRole || !route.roles.includes(userRole)) {
                  return null;
                }

                const isActive = location === route.href;
                return (
                  <Button
                    key={route.href}
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "justify-start whitespace-nowrap lg:w-full",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                    asChild
                  >
                    <a href={route.href} className="flex items-center gap-2">
                      <route.icon className="h-4 w-4" />
                      <span>{route.label}</span>
                    </a>
                  </Button>
                );
              })}
            </nav>
          </aside>
          <div className="flex-1 lg:max-w-3xl">{children}</div>
        </div>
      </div>
    </MainLayout>
  );
}