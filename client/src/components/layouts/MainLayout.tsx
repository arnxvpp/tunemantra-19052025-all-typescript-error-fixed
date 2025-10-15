import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar'; // Imports Navbar from the same directory
import Footer from './Footer';
import '../../styles/layouts.css';
import { useThemeConfig } from '@/hooks/use-theme-config'; // Import theme hook

interface MainLayoutProps {
  children?: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  // Get theme config and update function
  const { config, updateTheme } = useThemeConfig(); 

  // Determine dark mode based on config and system preference
  const systemPrefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const darkMode = config.appearance === 'dark' || (config.appearance === 'system' && systemPrefersDark);

  useEffect(() => {
    // Check if it's mobile view on initial render
    checkMobileView();
    // Add resize event listener
    window.addEventListener('resize', checkMobileView);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('resize', checkMobileView);
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  const checkMobileView = () => {
    const mobileView = window.innerWidth < 992;
    setIsMobile(mobileView);
    
    // If it's mobile view, collapse sidebar by default
    if (mobileView && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Function to toggle theme appearance
  const toggleDarkMode = () => {
    const newAppearance = darkMode ? 'light' : 'dark';
    updateTheme({ appearance: newAppearance });
  };

  return (
    <div className="able-pro-layout">
      <Sidebar collapsed={sidebarCollapsed} />
      
      <div className={`main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
        {/* Pass required props including theme state */}
        <Navbar 
          toggleSidebar={toggleSidebar} 
          darkMode={darkMode} 
          toggleDarkMode={toggleDarkMode} 
        />
        
        <div className="page-content">
          {children || <Outlet />}
        </div>
        
        <Footer />
      </div>
    </div>
  );
};

export default MainLayout;