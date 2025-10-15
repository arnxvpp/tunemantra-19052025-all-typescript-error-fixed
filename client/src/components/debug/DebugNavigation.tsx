import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

// Add all main navigation routes here
const mainRoutes = [
  { name: "Dashboard", path: "/" },
  { name: "Catalog", path: "/catalog" },
  { name: "Tracks", path: "/catalog/tracks" },
  { name: "Analytics", path: "/analytics" },
  { name: "Rights Management", path: "/rights" },
  { name: "Distribution", path: "/distribution" },
  { name: "Settings", path: "/settings" },
];

// Add feature-specific routes here
const featureRoutes = [
  { name: "Track Upload", path: "/catalog/upload" },
  { name: "Royalty Splits", path: "/rights/splits" },
  { name: "Distribution Platforms", path: "/distribution/platforms" },
  { name: "Account Settings", path: "/settings/account" },
  { name: "Blockchain NFTs", path: "/nft/gallery" },
  { name: "Team Management", path: "/settings/team" },
  { name: "Contracts", path: "/rights/contracts" },
];

// Add admin-only routes here
const adminRoutes = [
  { name: "Admin Dashboard", path: "/admin" },
  { name: "User Management", path: "/admin/users" },
  { name: "Platform Settings", path: "/admin/settings" },
  { name: "Content Moderation", path: "/admin/moderation" },
];

export function DebugNavigation() {
  const [, navigate] = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(
    document.documentElement.classList.contains("dark")
  );

  // Synchronize dark mode state with document class
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Set initial state based on system preference or saved preference
    const savedTheme = localStorage.getItem('theme');
    const systemPreference = darkModeMediaQuery.matches ? 'dark' : 'light';
    const currentTheme = savedTheme || systemPreference;
    
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
    
    // Listen for preference changes
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('theme') === null) {
        if (e.matches) {
          document.documentElement.classList.add('dark');
          setIsDarkMode(true);
        } else {
          document.documentElement.classList.remove('dark');
          setIsDarkMode(false);
        }
      }
    };
    
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Card className="w-full max-w-4xl mt-2 mx-auto">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Test Navigation</span>
          <div className="flex items-center space-x-2">
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <Switch
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>
        </CardTitle>
        <CardDescription>
          Use these navigation options to quickly access different parts of the application
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {/* Main routes as direct buttons */}
        {mainRoutes.map((route) => (
          <Button 
            key={route.path}
            variant="outline"
            size="sm"
            onClick={() => navigate(route.path)}
          >
            {route.name}
          </Button>
        ))}
        
        {/* Feature routes in dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm">Features</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Feature Pages</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {featureRoutes.map((route) => (
              <DropdownMenuItem 
                key={route.path}
                onClick={() => navigate(route.path)}
              >
                {route.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Admin routes in dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="destructive" size="sm">Admin</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Admin Pages</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {adminRoutes.map((route) => (
              <DropdownMenuItem 
                key={route.path}
                onClick={() => navigate(route.path)}
              >
                {route.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Debug routes dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">Debug</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Debug Pages</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/login-debug")}>
              Login Debug
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}