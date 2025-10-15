import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Home,
  BarChart2,
  Users,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Inbox,
  Mail,
  Calendar,
  FileText,
  ShoppingCart,
  List,
  Layers,
  HelpCircle,
  Heart,
  AlertCircle,
  Sliders,
  Database,
  Shield,
  DollarSign,
  Music,
  Package
} from 'lucide-react';

// CoreUI specific styles
import './coreui-styles.css';

interface CoreUIAppShellProps {
  children: React.ReactNode;
}

export function CoreUIAppShell({ children }: CoreUIAppShellProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { isAdmin, adminLogout } = useAdminAuth();
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { toast } = useToast();

  // Create memoized mobile check function to prevent excessive rerenders
  const checkIfMobile = useCallback(() => {
    const isMobileView = window.innerWidth < 768;
    setIsMobile(isMobileView);
    
    // Auto-collapse sidebar on mobile
    if (isMobileView) {
      setSidebarVisible(false);
    } else if (!sidebarVisible && !isMobileView) {
      setSidebarVisible(true);
    }
  }, [sidebarVisible]);

  // Check for mobile viewport with debounce for better performance
  useEffect(() => {
    // Initial check
    checkIfMobile();
    
    // Debounced resize handler
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        checkIfMobile();
      }, 150); // Debounce time of 150ms
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [checkIfMobile]);

  // Determine if we're in the admin section
  const isAdminSection = location.startsWith('/admin');

  // Handle logout
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

  // Navigation items based on context
  const navigationItems = isAdminSection
    ? [
        { to: '/admin/dashboard', icon: <Home size={18} />, label: 'Dashboard', active: location === '/admin/dashboard' },
        { to: '/admin/accounts', icon: <Users size={18} />, label: 'Accounts', active: location.startsWith('/admin/accounts') },
        { to: '/admin/managed-artists', icon: <Music size={18} />, label: 'Managed Artists', active: location.startsWith('/admin/managed-artists') },
        { to: '/admin/content', icon: <FileText size={18} />, label: 'Content', active: location.startsWith('/admin/content') },
        { to: '/admin/statistics', icon: <BarChart2 size={18} />, label: 'Statistics', active: location.startsWith('/admin/statistics') },
        { to: '/admin/tickets', icon: <HelpCircle size={18} />, label: 'Support Tickets', active: location.startsWith('/admin/tickets') },
        { to: '/admin/imports', icon: <Database size={18} />, label: 'Data Imports', active: location.startsWith('/admin/imports') },
        { to: '/admin/settings', icon: <Settings size={18} />, label: 'Settings', active: location.startsWith('/admin/settings') },
        { to: '/', icon: <Home size={18} />, label: 'User Dashboard', active: false },
      ]
    : [
        { to: '/', icon: <Home size={18} />, label: 'Dashboard', active: location === '/' },
        { to: '/catalog', icon: <Music size={18} />, label: 'Catalog', active: location.startsWith('/catalog') },
        { to: '/upload', icon: <Package size={18} />, label: 'Upload', active: location.startsWith('/upload') },
        { to: '/analytics', icon: <BarChart2 size={18} />, label: 'Analytics', active: location.startsWith('/analytics') },
        { to: '/payments', icon: <DollarSign size={18} />, label: 'Payments', active: location.startsWith('/payments') },
        { to: '/rights', icon: <Shield size={18} />, label: 'Rights', active: location.startsWith('/rights') },
        { to: '/settings', icon: <Settings size={18} />, label: 'Settings', active: location.startsWith('/settings') },
        { to: '/support', icon: <HelpCircle size={18} />, label: 'Support', active: location.startsWith('/support') },
      ];

  // Show login page if not authenticated
  if (!user && !isAdminSection) {
    return (
      <div className="min-h-screen bg-light dark:bg-dark">
        {children}
      </div>
    );
  }

  return (
    <div className="c-app">
      {/* Sidebar */}
      <div className={`c-sidebar c-sidebar-dark c-sidebar-fixed ${sidebarVisible ? 'c-sidebar-show' : 'c-sidebar-hide'}`}>
        {/* Sidebar brand */}
        <div className="c-sidebar-brand d-lg-down-none">
          <Link href={isAdminSection ? "/admin/dashboard" : "/"}>
            <div className="c-sidebar-brand-full">
              <span className="h4 mb-0 text-gradient">TuneMantra</span>
              {isAdminSection && <span className="badge bg-danger ms-2">ADMIN</span>}
            </div>
          </Link>
          <div className="c-sidebar-brand-minimized">
            <span className="h4 mb-0">TM</span>
          </div>
        </div>

        {/* Sidebar nav */}
        <ScrollArea className="c-sidebar-nav">
          <ul className="c-sidebar-nav-items">
            {navigationItems.map((item, index) => (
              <li className="c-sidebar-nav-item" key={index}>
                <Link href={item.to}>
                  <a className={`c-sidebar-nav-link ${item.active ? 'c-active' : ''}`}>
                    <div className="c-sidebar-nav-icon">{item.icon}</div> 
                    {item.label}
                  </a>
                </Link>
              </li>
            ))}

            {/* Bridge to admin area (only for admins) */}
            {!isAdminSection && isAdmin && (
              <>
                <li className="c-sidebar-nav-divider my-3"></li>
                <li className="c-sidebar-nav-title">Admin</li>
                <li className="c-sidebar-nav-item">
                  <Link href="/admin/dashboard">
                    <a className="c-sidebar-nav-link">
                      <div className="c-sidebar-nav-icon"><Settings size={18} /></div>
                      Admin Dashboard
                    </a>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </ScrollArea>

        {/* Sidebar minimizer */}
        <button 
          className="c-sidebar-minimizer c-class-toggler" 
          onClick={() => setSidebarVisible(!sidebarVisible)}
        ></button>
      </div>

      {/* Main wrapper */}
      <div className="c-wrapper">
        {/* Header */}
        <header className="c-header c-header-light c-header-fixed">
          <button 
            className="c-header-toggler c-class-toggler d-lg-none" 
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
            <span className="c-header-toggler-icon"></span>
          </button>
          
          <button 
            className="c-header-toggler c-class-toggler ml-3 d-md-down-none" 
            onClick={() => setSidebarVisible(!sidebarVisible)}
          >
            <span className="c-header-toggler-icon"></span>
          </button>

          {/* Brand */}
          <div className="c-header-brand d-lg-none">
            <span className="h4 mb-0">TuneMantra</span>
          </div>

          {/* Header nav */}
          <ul className="c-header-nav ml-auto">
            {/* Notifications */}
            <li className="c-header-nav-item dropdown">
              <a className="c-header-nav-link" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                <Bell size={18} />
                <span className="badge badge-pill badge-danger">5</span>
              </a>
            </li>

            {/* User */}
            <li className="c-header-nav-item dropdown">
              <a className="c-header-nav-link dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">
                <Avatar className="c-avatar-img">
                  <AvatarImage src={user?.avatarUrl || ''} alt={user?.fullName || 'User'} />
                  <AvatarFallback className="bg-primary-gradient text-white">
                    {user?.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </a>
              <div className="dropdown-menu dropdown-menu-right pt-0">
                <div className="dropdown-header bg-light py-2">
                  <strong>Account</strong>
                </div>
                <a className="dropdown-item" href="#">
                  <User size={18} className="mr-2" /> Profile
                </a>
                <a className="dropdown-item" href="#">
                  <Settings size={18} className="mr-2" /> Settings
                </a>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item" 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  <LogOut size={18} className="mr-2" /> 
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </li>
          </ul>
        </header>

        {/* Page content */}
        <div className="c-body">
          <main className="c-main">
            <div className="container-fluid">
              {children}
            </div>
          </main>
        </div>

        {/* Footer */}
        <footer className="c-footer">
          <div>
            <span>TuneMantra © {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default CoreUIAppShell;