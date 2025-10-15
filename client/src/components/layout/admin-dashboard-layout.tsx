import React, { useState } from "react"
import { Link, useLocation } from "wouter"
import { 
  BarChart3, 
  Building2, 
  ChevronRight, 
  Home, 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  PanelRight, 
  Settings, 
  Sliders, 
  Users,
  Palette,
  Package,
  FileText,
  TicketCheck
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import ThemeScript from "@/components/theme/ThemeScript"

/**
 * Admin Dashboard Layout component
 * Core layout component for the admin dashboard that provides sidebar navigation
 * and theme management capabilities.
 */
export function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { toast } = useToast()

  // Function to toggle sidebar collapse state
  const toggleSidebar = () => {
    setCollapsed(prev => !prev)
    toast({
      title: collapsed ? "Sidebar Expanded" : "Sidebar Collapsed",
      description: collapsed 
        ? "Navigation labels are now visible" 
        : "Navigation is now compact",
      duration: 2000,
    })
  }

  // Define navigation items for the sidebar
  const navItems = [
    {
      title: "Dashboard",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      active: location === "/admin/dashboard",
    },
    {
      title: "Accounts",
      href: "/admin/accounts",
      icon: <Users className="h-5 w-5" />,
      active: location === "/admin/accounts" || location.startsWith("/admin/accounts/"),
    },
    {
      title: "Managed Artists",
      href: "/admin/managed-artists",
      icon: <Building2 className="h-5 w-5" />,
      active: location === "/admin/managed-artists",
    },
    {
      title: "Content",
      href: "/admin/content",
      icon: <Package className="h-5 w-5" />,
      active: location === "/admin/content",
    },
    {
      title: "Batch Export",
      href: "/admin/batch-export",
      icon: <FileText className="h-5 w-5" />,
      active: location === "/admin/batch-export",
    },
    {
      title: "Tickets",
      href: "/admin/tickets",
      icon: <TicketCheck className="h-5 w-5" />,
      active: location === "/admin/tickets",
    },
    {
      title: "Statistics",
      href: "/admin/statistics",
      icon: <BarChart3 className="h-5 w-5" />,
      active: location === "/admin/statistics",
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
      active: location === "/admin/settings",
    },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* Ensure proper theme initialization and prevent flicker */}
      <ThemeScript />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside 
          className={cn(
            "bg-card border-r border-r-border flex flex-col transition-all duration-300",
            collapsed ? "w-[70px]" : "w-[240px]"
          )}
        >
          {/* Sidebar header with logo */}
          <div className="flex items-center h-16 px-4">
            <Link 
              href="/admin/dashboard" 
              className="flex items-center space-x-2 font-semibold"
            >
              <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary flex items-center justify-center rounded-md">
                <Home className="h-5 w-5" />
              </div>
              {!collapsed && (
                <span className="text-lg font-bold truncate">TuneMantra</span>
              )}
            </Link>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelRight className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Sidebar navigation items */}
          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-2">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm rounded-md",
                    item.active
                      ? "bg-secondary text-secondary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center"
                  )}
                >
                  {item.icon}
                  {!collapsed && <span>{item.title}</span>}
                  {item.active && !collapsed && (
                    <ChevronRight className="ml-auto h-4 w-4" />
                  )}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* User profile at bottom of sidebar */}
          <div className="mt-auto p-4">
            <div 
              className={cn(
                "flex items-center gap-3 py-2",
                collapsed ? "justify-center" : "px-3"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.png" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Admin User</span>
                  <span className="text-xs text-muted-foreground">
                    Administrator
                  </span>
                </div>
              )}
              {!collapsed && (
                <Link href="/logout">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </aside>
        
        {/* Main content area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Content area with automatic scrolling */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}

export default AdminDashboardLayout