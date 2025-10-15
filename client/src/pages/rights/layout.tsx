import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { FileText, Shield, Book, Scale, GalleryVertical, UserCheck, Plus, Database, Blocks } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { PageLoader } from "@/components/ui/page-loader";

const routes = [
  {
    href: "/rights/overview",
    label: "Overview",
    icon: GalleryVertical,
    roles: ['admin', 'manager', 'artist']
  },
  {
    href: "/rights/licenses",
    label: "Licenses",
    icon: FileText,
    roles: ['admin', 'manager', 'artist']
  },
  {
    href: "/rights/copyrights",
    label: "Copyrights",
    icon: Shield,
    roles: ['admin', 'manager', 'artist']
  },
  {
    href: "/rights/publishing",
    label: "Publishing",
    icon: Book,
    roles: ['admin', 'manager', 'artist']
  },
  {
    href: "/rights/associations",
    label: "Pro Associations",
    icon: UserCheck,
    roles: ['admin', 'manager', 'artist']
  },
  {
    href: "/rights/legal",
    label: "Legal",
    icon: Scale,
    roles: ['admin', 'manager', 'artist']
  },
  {
    href: "/rights/web3",
    label: "Web3 Rights",
    icon: Blocks,
    roles: ['admin', 'manager', 'artist']
  }
];

const quickActions = [
  {
    label: "Add License",
    href: "/rights/licenses?action=new",
    icon: FileText,
    color: "text-primary"
  },
  {
    label: "Register Copyright",
    href: "/rights/copyrights?action=new",
    icon: Shield,
    color: "text-emerald-500"
  },
  {
    label: "Add PRO",
    href: "/rights/associations?action=new",
    icon: UserCheck,
    color: "text-yellow-500"
  }
];

export function RightsLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [lastLocation, setLastLocation] = useState(location);

  // Effect to handle page transitions
  useEffect(() => {
    if (location !== lastLocation) {
      setIsLoading(true);
      setLastLocation(location);

      // Simulate loading delay with a timeout (you can remove this in production)
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800); // Adjust loading time as needed

      return () => clearTimeout(timer);
    }
  }, [location, lastLocation]);

  return (
    <div className="flex h-full">
      <PageLoader isLoading={isLoading} />
      <div className="w-64 border-r border-border bg-muted/20">
        <div className="p-4">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-foreground">Navigation</h2>
          <nav className="space-y-1">
            {routes.map((route) => {
              // For development, allow all routes without permission check
              if (process.env.NODE_ENV !== 'development') {
                if (!auth.user || !route.roles.includes(auth.user.role)) return null;
              }

              return (
                <Button
                  key={route.href}
                  variant={location === route.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    location === route.href && "bg-muted/50"
                  )}
                  asChild
                >
                  <a href={route.href}>
                    <route.icon className="mr-2 h-4 w-4" />
                    {route.label}
                  </a>
                </Button>
              );
            })}
          </nav>
        </div>

        <Separator className="my-4" />

        <div className="p-4">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-foreground">Quick Actions</h2>
          <div className="space-y-1">
            {quickActions.map((action) => (
              <Button
                key={action.href}
                variant="ghost"
                className="w-full justify-start hover:bg-muted/30"
                asChild
              >
                <a href={action.href}>
                  <Plus className={cn("mr-2 h-4 w-4", action.color)} />
                  {action.label}
                </a>
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-screen-2xl py-6">
          {children}
        </div>
      </div>
    </div>
  );
}