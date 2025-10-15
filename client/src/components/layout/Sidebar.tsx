import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Music,
  Upload,
  BarChart3,
  Users,
  Settings,
  ShieldCheck,
  HelpCircle,
  Globe,
  Database,
  MessageSquare,
  BookOpen,
  Zap,
  Bell,
  LogOut,
  LifeBuoy,
  FileText,
  Folder,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string | number;
  badgeVariant?: 'default' | 'outline' | 'secondary' | 'destructive';
  onClick?: () => void;
  collapsed?: boolean;
}

interface SidebarMenuProps {
  icon: React.ReactNode;
  label: string;
  defaultOpen?: boolean;
  badge?: string | number;
  badgeVariant?: 'default' | 'outline' | 'secondary' | 'destructive';
  children: React.ReactNode;
  collapsed?: boolean;
}

export function SidebarLink({ 
  href, 
  icon, 
  label, 
  active, 
  badge, 
  badgeVariant = 'default',
  onClick,
  collapsed
}: SidebarLinkProps) {
  return (
    <Link 
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent group relative",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <div className={cn("shrink-0 w-5 h-5", collapsed && "w-6 h-6")}>
        {icon}
      </div>
      {!collapsed && (
        <span className="truncate">{label}</span>
      )}
      {collapsed && (
        <span className="absolute left-full rounded-md px-2 py-1 ml-2 text-xs bg-accent text-accent-foreground invisible opacity-0 -translate-x-3 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all">
          {label}
        </span>
      )}
      {badge && !collapsed && (
        <Badge variant={badgeVariant} className="ml-auto">
          {badge}
        </Badge>
      )}
      {badge && collapsed && (
        <Badge variant={badgeVariant} className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
          {Number(badge) > 9 ? '9+' : badge}
        </Badge>
      )}
    </Link>
  );
}

export function SidebarMenu({ 
  icon, 
  label, 
  children, 
  defaultOpen, 
  badge, 
  badgeVariant = 'default',
  collapsed
}: SidebarMenuProps) {
  const [open, setOpen] = useState(defaultOpen);
  
  if (collapsed) {
    return (
      <div className="relative group">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center rounded-lg p-2 w-full text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
        >
          <div className="w-6 h-6">
            {icon}
          </div>
          
          {badge && (
            <Badge variant={badgeVariant} className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
              {Number(badge) > 9 ? '9+' : badge}
            </Badge>
          )}
        </button>
        
        <div className="absolute left-full rounded-md px-2 py-1 ml-2 bg-background border text-foreground invisible opacity-0 -translate-x-3 group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 transition-all min-w-[12rem] z-50">
          <div className="font-medium mb-1 pb-1 border-b flex justify-between items-center">
            {label}
            {badge && (
              <Badge variant={badgeVariant}>
                {badge}
              </Badge>
            )}
          </div>
          <div className="space-y-1 pt-1">
            {children}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-all",
          open && "text-foreground"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-5 h-5">
            {icon}
          </div>
          <span>{label}</span>
        </div>
        
        {badge && (
          <Badge variant={badgeVariant} className="mr-1">
            {badge}
          </Badge>
        )}
        
        <div className="shrink-0 w-4 h-4">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>
      
      {open && (
        <div className="pl-6 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

export interface SidebarProps {
  collapsed: boolean;
  onClose?: () => void;
}

export function Sidebar({ collapsed, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Check if current path matches the link's href or starts with href for nested routes
  const isActive = (href: string) => {
    if (href === '/') {
      return location === '/';
    }
    return location === href || (href !== '/' && location.startsWith(href));
  };
  
  const isAdmin = user?.role === 'admin' || user?.role === 'label';
  
  return (
    <aside className={cn(
      "flex flex-col border-r bg-background fixed inset-y-0 z-50 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="flex items-center p-2 h-16 border-b">
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </button>
        )}
        
        <div className={cn(
          "flex items-center",
          collapsed ? "justify-center w-full" : "ml-2"
        )}>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex shrink-0 items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground">
              <Music className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="font-semibold">MusicPro</span>
            )}
          </Link>
        </div>
      </div>
      
      <div className={cn(
        "flex-1 overflow-y-auto py-3 px-2",
        collapsed && "px-1"
      )}>
        <nav className="space-y-1">
          <SidebarLink 
            href="/" 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={isActive('/')}
            collapsed={collapsed}
          />
          
          <SidebarLink 
            href="/catalog" 
            icon={<Music />} 
            label="Music Catalog" 
            active={isActive('/catalog')}
            collapsed={collapsed}
          />
          
          <SidebarLink 
            href="/upload" 
            icon={<Upload />} 
            label="Upload Music" 
            active={isActive('/upload')}
            collapsed={collapsed}
          />
          
          <SidebarMenu 
            icon={<BarChart3 />} 
            label="Analytics" 
            defaultOpen={isActive('/analytics')}
            collapsed={collapsed}
          >
            <SidebarLink 
              href="/analytics" 
              icon={<BarChart3 />} 
              label="Overview" 
              active={location === '/analytics'}
              collapsed={collapsed}
            />
            <SidebarLink 
              href="/analytics/revenue" 
              icon={<BarChart3 />} 
              label="Revenue" 
              active={isActive('/analytics/revenue')}
              collapsed={collapsed}
            />
            <SidebarLink 
              href="/analytics/trends" 
              icon={<BarChart3 />} 
              label="Trends" 
              active={isActive('/analytics/trends')}
              collapsed={collapsed}
            />
            <SidebarLink 
              href="/analytics/geo" 
              icon={<Globe />} 
              label="Geography" 
              active={isActive('/analytics/geo')}
              collapsed={collapsed}
            />
          </SidebarMenu>
          
          <SidebarMenu 
            icon={<Database />} 
            label="Rights Management" 
            defaultOpen={isActive('/rights')}
            collapsed={collapsed}
          >
            <SidebarLink 
              href="/rights" 
              icon={<Database />} 
              label="Overview" 
              active={location === '/rights'}
              collapsed={collapsed}
            />
            <SidebarLink 
              href="/rights/copyrights" 
              icon={<FileText />} 
              label="Copyrights" 
              active={isActive('/rights/copyrights')}
              collapsed={collapsed}
            />
            <SidebarLink 
              href="/rights/publishing" 
              icon={<BookOpen />} 
              label="Publishing" 
              active={isActive('/rights/publishing')}
              collapsed={collapsed}
            />
            <SidebarLink 
              href="/rights/licenses" 
              icon={<Folder />} 
              label="Licenses" 
              active={isActive('/rights/licenses')}
              collapsed={collapsed}
            />
          </SidebarMenu>
          
          {isAdmin && (
            <SidebarMenu 
              icon={<Users />} 
              label="Team Management" 
              defaultOpen={isActive('/settings/team')}
              badge={3}
              collapsed={collapsed}
            >
              <SidebarLink 
                href="/settings/team-members" 
                icon={<Users />} 
                label="Team Members" 
                active={isActive('/settings/team-members')}
                collapsed={collapsed}
              />
              <SidebarLink 
                href="/settings/managed-artists" 
                icon={<Music />} 
                label="Managed Artists" 
                active={isActive('/settings/managed-artists')}
                collapsed={collapsed}
              />
              <SidebarLink 
                href="/settings/permission-templates" 
                icon={<ShieldCheck />} 
                label="Permissions" 
                active={isActive('/settings/permission-templates')}
                collapsed={collapsed}
              />
            </SidebarMenu>
          )}
          
          <SidebarLink 
            href="/payments" 
            icon={<Zap />} 
            label="Payments & Royalties" 
            active={isActive('/payments')}
            collapsed={collapsed}
          />
          
          <SidebarLink 
            href="/support" 
            icon={<MessageSquare />} 
            label="Support Tickets" 
            active={isActive('/support')}
            badge={2}
            badgeVariant="secondary"
            collapsed={collapsed}
          />
          
          {isAdmin && (
            <SidebarLink 
              href="/admin" 
              icon={<ShieldCheck />} 
              label="Admin Panel" 
              active={isActive('/admin')}
              collapsed={collapsed}
            />
          )}
        </nav>
      </div>
      
      <div className={cn(
        "border-t py-2 px-2",
        collapsed && "px-1"
      )}>
        <div className="space-y-1">
          <SidebarLink 
            href="/settings/profile" 
            icon={<Settings />} 
            label="Settings" 
            active={isActive('/settings')}
            collapsed={collapsed}
          />
          
          <SidebarLink 
            href="/help" 
            icon={<HelpCircle />} 
            label="Help & Resources" 
            active={isActive('/help')}
            collapsed={collapsed}
          />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;