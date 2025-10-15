import React, { useState } from 'react';
import { Link } from 'wouter';
import { useThemeConfig } from '@/hooks/use-theme-config';
import ThemeScript from '@/components/theme/ThemeScript'; // Correct default import
import { useToast } from '@/components/ui/use-toast';
import {
  Menu,
  MessageSquare,
  Home,
  Music,
  BarChart2,
  Settings,
  Award,
  LayoutDashboard,
  Users,
  PackageOpen,
  CreditCard,
  HelpCircle,
  Globe,
  ChevronDown,
  Bell,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

interface NavbarProps {
  toggleSidebar: () => void;
  collapsed: boolean; // Add missing prop
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

// Main Layout component that wraps the entire application
export function MainLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Get theme config and update function
  const { config, updateTheme } = useThemeConfig();

  // Determine dark mode based on config and system preference
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const darkMode = config.appearance === 'dark' || (config.appearance === 'system' && systemPrefersDark);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Function to toggle theme appearance
  const toggleDarkMode = () => {
    const newAppearance = darkMode ? 'light' : 'dark';
    updateTheme({ appearance: newAppearance });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ThemeScript />
      {/* Pass darkMode and toggleDarkMode props to Navbar */}
      <Navbar
        toggleSidebar={toggleSidebar}
        collapsed={sidebarCollapsed}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
      />
      <div className="flex flex-1">
        <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
          <div className="container mx-auto p-4">
            {children}
          </div>
        </main>
      </div>
      {/* TODO: config.showFooter is not defined in useThemeConfig. Temporarily removed. Review required. */}
      {/* {config.showFooter && <Footer />} */}
      <Footer /> {/* Render footer unconditionally for now */}
    </div>
  );
}

// Navbar component
function Navbar({ toggleSidebar, collapsed }: NavbarProps) {
  // Destructure correct properties: updateTheme, whiteLabelConfig
  const { config, whiteLabelConfig, updateTheme } = useThemeConfig();
  const { toast } = useToast();
  
  return (
    <header className="bg-background border-b sticky top-0 z-50">
      <div className="flex h-16 items-center px-4 shadow-sm">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-2 rounded-md hover:bg-accent/10"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
        
        <Link href="/" className="flex items-center gap-2 mr-8">
          <img
            // Use whiteLabelConfig for logoUrl
            src={whiteLabelConfig.logoUrl}
            alt="Logo"
            className="h-8 w-8"
            onError={(e) => {
              // Fallback to a text logo if image fails to load
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Use whiteLabelConfig for brandName */}
          {!collapsed && <span className="font-bold text-xl">{whiteLabelConfig.brandName}</span>}
        </Link>
        
        <div className="flex-1 flex justify-center">
          <nav className="hidden md:flex items-center space-x-4">
            <Link href="/dashboard" className="px-3 py-2 text-sm hover:text-primary">
              Dashboard
            </Link>
            <Link href="/catalog" className="px-3 py-2 text-sm hover:text-primary">
              Catalog
            </Link>
            <Link href="/analytics" className="px-3 py-2 text-sm hover:text-primary">
              Analytics
            </Link>
            <div className="relative group">
              <button className="px-3 py-2 text-sm hover:text-primary flex items-center gap-1">
                More <ChevronDown size={14} />
              </button>
              <div className="absolute left-0 mt-1 w-48 bg-background shadow-lg rounded-md border hidden group-hover:block">
                <div className="p-2 flex flex-col">
                  <Link href="/rights" className="px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
                    Rights Management
                  </Link>
                  <Link href="/payments" className="px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
                    Payments
                  </Link>
                  <Link href="/support" className="px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
                    Support
                  </Link>
                </div>
              </div>
            </div>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <button 
              className="p-2 rounded-full hover:bg-accent/10"
              onClick={() => toast({ title: "Coming soon", description: "This feature is not yet implemented" })}
            >
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="absolute right-0 mt-1 w-80 bg-background shadow-lg rounded-md border hidden group-hover:block">
              <div className="p-3 border-b">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="p-2 max-h-80 overflow-auto">
                <div className="p-2 hover:bg-accent/10 rounded-md">
                  <p className="text-sm font-medium">New distribution completed</p>
                  <p className="text-xs text-muted-foreground">Your release "Summer Vibes" has been distributed to Spotify</p>
                  <p className="text-xs text-muted-foreground mt-1">10 minutes ago</p>
                </div>
                <div className="p-2 hover:bg-accent/10 rounded-md">
                  <p className="text-sm font-medium">Royalty payment received</p>
                  <p className="text-xs text-muted-foreground">You received a payment of $125.40</p>
                  <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <button 
              className="p-2 rounded-full hover:bg-accent/10"
              aria-label="Theme"
            >
              {/* Use config.appearance instead of config.theme */}
              {config.appearance === 'light' ? (
                <Sun size={18} />
              ) : config.appearance === 'dark' ? (
                <Moon size={18} />
              ) : (
                <Laptop size={18} />
              )}
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-background shadow-lg rounded-md border hidden group-hover:block">
              <div className="p-2">
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent/10 rounded-md"
                  // Use updateTheme
                  onClick={() => updateTheme({ appearance: 'light' })}
                >
                  <Sun size={16} />
                  <span>Light</span>
                  {/* Use config.appearance */}
                  {config.appearance === 'light' && <span className="ml-auto text-primary">✓</span>}
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent/10 rounded-md"
                   // Use updateTheme
                  onClick={() => updateTheme({ appearance: 'dark' })}
                >
                  <Moon size={16} />
                  <span>Dark</span>
                   {/* Use config.appearance */}
                  {config.appearance === 'dark' && <span className="ml-auto text-primary">✓</span>}
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent/10 rounded-md"
                   // Use updateTheme
                  onClick={() => updateTheme({ appearance: 'system' })}
                >
                  <Laptop size={16} />
                  <span>System</span>
                   {/* Use config.appearance */}
                  {config.appearance === 'system' && <span className="ml-auto text-primary">✓</span>}
                </button>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <button className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                JD
              </div>
            </button>
            <div className="absolute right-0 mt-1 w-56 bg-background shadow-lg rounded-md border hidden group-hover:block">
              <div className="p-3 border-b">
                <p className="font-semibold">John Doe</p>
                <p className="text-xs text-muted-foreground">john.doe@example.com</p>
              </div>
              <div className="p-2">
                <Link href="/settings/profile" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
                  <Settings size={16} />
                  <span>Settings</span>
                </Link>
                <Link href="/support" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
                  <HelpCircle size={16} />
                  <span>Help & Support</span>
                </Link>
                <button 
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent/10 rounded-md w-full text-left text-red-500"
                  onClick={() => {
                    // Handle logout
                    toast({ 
                      title: "Logged out", 
                      description: "You have been successfully logged out" 
                    })
                  }}
                >
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// Sidebar component
function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { config } = useThemeConfig();
  
  return (
    <aside 
      className={`bg-background border-r fixed h-[calc(100vh-4rem)] top-16 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="p-4">
        <div className="space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
            <Home size={18} />
            {!collapsed && <span>Dashboard</span>}
          </Link>
          <Link href="/catalog" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
            <Music size={18} />
            {!collapsed && <span>Catalog</span>}
          </Link>
          <Link href="/analytics" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
            <BarChart2 size={18} />
            {!collapsed && <span>Analytics</span>}
          </Link>
          <Link href="/rights" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
            <Award size={18} />
            {!collapsed && <span>Rights Management</span>}
          </Link>
          <Link href="/payments" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
            <CreditCard size={18} />
            {!collapsed && <span>Payments</span>}
          </Link>
          <Link href="/support" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
            <MessageSquare size={18} />
            {!collapsed && <span>Support</span>}
          </Link>
          
          {!collapsed && <div className="my-4 border-t"></div>}
          
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
            <Settings size={18} />
            {!collapsed && <span>Settings</span>}
          </Link>
          
          {/* Super Admin Access */}
          {!collapsed && <div className="my-4 border-t"></div>}
          
          <Link href="/super-admin/dashboard" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
            <LayoutDashboard size={18} />
            {!collapsed && <span>Super Admin</span>}
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
            <Users size={18} />
            {!collapsed && <span>User Management</span>}
          </Link>
          <Link href="/admin/content" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
            <PackageOpen size={18} />
            {!collapsed && <span>Content Approval</span>}
          </Link>
          <Link href="/admin/white-label" className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-accent/10 rounded-md">
            <Globe size={18} />
            {!collapsed && <span>White Label</span>}
          </Link>
        </div>
      </div>
    </aside>
  );
}

// Footer component
function Footer() {
  const { config, whiteLabelConfig } = useThemeConfig();
  const year = new Date().getFullYear();
  
  // Construct footer text using whiteLabelConfig.brandName
  // Remove check for non-existent footerText property
  const footerText = `© ${year} ${whiteLabelConfig.brandName}. All rights reserved.`;
  
  return (
    <footer className="border-t py-4 text-center text-sm text-muted-foreground">
      <div className="container">
        {footerText}
      </div>
    </footer>
  );
}

export default MainLayout;