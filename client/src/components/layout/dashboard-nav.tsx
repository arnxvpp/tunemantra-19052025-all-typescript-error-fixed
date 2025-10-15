
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, Album, Upload, Users2, BarChart2, CircleDollarSign, LifeBuoy, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed inset-y-0 left-0 w-16 bg-zinc-950 border-r border-white/10">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-4">
          <div className="flex items-center justify-center">
            <img src="/logo.png" alt="Logo" className="w-8 h-8" />
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-4">
          <div className="space-y-4">
            {/* Overview Section */}
            <div className="space-y-2">
              <NavLink href="/" icon={Home} active={location === "/"} />
            </div>

            {/* Content Section */}
            <div className="space-y-2">
              <NavLink 
                href="/catalog/releases" 
                icon={Album} 
                active={location.startsWith("/catalog")} 
              />
              <NavLink 
                href="/upload" 
                icon={Upload} 
                active={location === "/upload"} 
              />
              <NavLink 
                href="/catalog/bulk-upload" 
                icon={Upload} 
                active={location.startsWith("/catalog/bulk-upload")} 
              />
            </div>

            {/* Other Sections */}
            <div className="space-y-2">
              <NavLink href="/team" icon={Users2} active={location === "/team"} />
              <NavLink 
                href="/analytics/consumption" 
                icon={BarChart2} 
                active={location.startsWith("/analytics")} 
              />
              <NavLink href="/finances" icon={CircleDollarSign} active={location === "/finances"} />
              <NavLink 
                href="/support" 
                icon={MessageSquare} 
                active={location.startsWith("/support")} 
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

function NavLink({ 
  href, 
  icon: Icon, 
  active 
}: { 
  href: string; 
  icon: any;
  active: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "w-full aspect-square",
        active && "bg-white/10 text-white",
        !active && "text-white/70"
      )}
      asChild
    >
      <Link href={href}>
        <Icon className="w-5 h-5" />
      </Link>
    </Button>
  );
}
