/**
 * AppShell Component
 * 
 * This is the main shell component that wraps all pages in the application.
 * It provides a consistent layout with navigation, sidebar, and content area.
 * The component is aware of both admin and regular user contexts and adapts accordingly.
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { 
  Home, Music, BarChart2, DollarSign, Shield, Settings, 
  LogOut, User, Users, HelpCircle, Menu, X, 
  FileText, Package, PieChart, Wrench, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
};

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => {
  return (
    <Link href={to}>
      <a
        className={`flex items-center px-4 py-3 rounded-md transition-all duration-200 no-underline ${
          isActive 
            ? 'bg-primary text-primary-foreground shadow-sm' 
            : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
        }`}
      >
        <span className="mr-3">{icon}</span>
        <span className="font-medium">{label}</span>
      </a>
    </Link>
  );
};

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { isAdmin, adminLogout } = useAdminAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();
  
  // Determine if we're in the admin section
  const isAdminSection = location.startsWith('/admin');
  
  // Use the appropriate logout function based on context
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      
      if (isAdminSection) {
        await adminLogout();
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of the admin panel",
          variant: "default"
        });
        window.location.href = '/admin/login';
      } else {
        await logout();
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account",
          variant: "default"
        });
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging you out. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  // Generate navigation based on user role and context
  const renderNavigation = () => {
    if (isAdminSection) {
      return (
        <>
          <NavItem 
            to="/admin/dashboard" 
            icon={<Home size={20} />} 
            label="Dashboard" 
            isActive={location === '/admin/dashboard'} 
          />
          <NavItem 
            to="/admin/accounts" 
            icon={<Users size={20} />} 
            label="Accounts" 
            isActive={location.startsWith('/admin/accounts')} 
          />
          <NavItem 
            to="/admin/managed-artists" 
            icon={<Music size={20} />} 
            label="Managed Artists" 
            isActive={location.startsWith('/admin/managed-artists')} 
          />
          <NavItem 
            to="/admin/content" 
            icon={<FileText size={20} />} 
            label="Content Quality" 
            isActive={location.startsWith('/admin/content')} 
          />
          <NavItem 
            to="/admin/tickets" 
            icon={<HelpCircle size={20} />} 
            label="Support Tickets" 
            isActive={location.startsWith('/admin/tickets')} 
          />
          <NavItem 
            to="/admin/statistics" 
            icon={<BarChart2 size={20} />} 
            label="Statistics" 
            isActive={location.startsWith('/admin/statistics')} 
          />
          <NavItem 
            to="/admin/imports" 
            icon={<Database size={20} />} 
            label="Data Imports" 
            isActive={location.startsWith('/admin/imports')} 
          />
          <NavItem 
            to="/admin/export-hub" 
            icon={<Package size={20} />} 
            label="Export Hub" 
            isActive={location.startsWith('/admin/export-hub')} 
          />
          <NavItem 
            to="/admin/settings" 
            icon={<Settings size={20} />} 
            label="Settings" 
            isActive={location.startsWith('/admin/settings')} 
          />
          
          {/* Bridge to user area */}
          <Separator className="my-4" />
          <div className="px-4 py-2 text-sm font-medium text-slate-500">User Portal</div>
          <NavItem 
            to="/" 
            icon={<Home size={20} />} 
            label="Go to User Dashboard" 
            isActive={false} 
          />
        </>
      );
    } else {
      return (
        <>
          <NavItem 
            to="/" 
            icon={<Home size={20} />} 
            label="Dashboard" 
            isActive={location === '/'} 
          />
          <NavItem 
            to="/catalog" 
            icon={<Music size={20} />} 
            label="Catalog" 
            isActive={location.startsWith('/catalog')} 
          />
          <NavItem 
            to="/upload" 
            icon={<Package size={20} />} 
            label="Upload" 
            isActive={location.startsWith('/upload')} 
          />
          <NavItem 
            to="/analytics" 
            icon={<BarChart2 size={20} />} 
            label="Analytics" 
            isActive={location.startsWith('/analytics')} 
          />
          <NavItem 
            to="/payments" 
            icon={<DollarSign size={20} />} 
            label="Payments" 
            isActive={location.startsWith('/payments')} 
          />
          <NavItem 
            to="/rights" 
            icon={<Shield size={20} />} 
            label="Rights Management" 
            isActive={location.startsWith('/rights')} 
          />
          <NavItem 
            to="/settings" 
            icon={<Settings size={20} />} 
            label="Settings" 
            isActive={location.startsWith('/settings')} 
          />
          <NavItem 
            to="/support" 
            icon={<HelpCircle size={20} />} 
            label="Support" 
            isActive={location.startsWith('/support')} 
          />
          
          {/* Bridge to admin area (only for admins) */}
          {isAdmin && (
            <>
              <Separator className="my-4" />
              <div className="px-4 py-2 text-sm font-medium text-slate-500">Admin Portal</div>
              <NavItem 
                to="/admin/dashboard" 
                icon={<Wrench size={20} />} 
                label="Go to Admin Dashboard" 
                isActive={false} 
              />
            </>
          )}
        </>
      );
    }
  };
  
  // Show login page if not authenticated
  if (!user && !isAdminSection) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {children}
      </div>
    );
  }
  
  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Mobile menu toggle button (visible on small screens) */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="fixed z-50 p-2 m-4 bg-white rounded-md shadow-md md:hidden dark:bg-slate-800"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {/* Sidebar (hidden on mobile unless menu is open) */}
      <div 
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-background/95 border-r shadow-md transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo and app name */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-border/40">
          <Link href={isAdminSection ? "/admin/dashboard" : "/"}>
            <a className="no-underline">
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">TuneMantra</span>
                {isAdminSection && <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded-md">ADMIN</span>}
              </div>
            </a>
          </Link>
        </div>
        
        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {renderNavigation()}
          </nav>
        </ScrollArea>
        
        {/* User info and logout */}
        <div className="p-4 border-t border-border/40">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.avatarUrl || ''} alt={user?.fullName || 'User'} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.fullName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.fullName || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {isAdminSection ? 'Administrator' : user?.role?.replace('_', ' ') || 'User'}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" 
              onClick={handleLogout}
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 md:ml-64">
        <div className="h-full p-4 overflow-auto">
          {children}
        </div>
      </div>
      
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}

export default AppShell;