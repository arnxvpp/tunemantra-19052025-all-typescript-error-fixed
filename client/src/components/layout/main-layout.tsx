import React, { ReactNode } from 'react';
import { AppShell } from './AppShell';
import { Toaster } from '@/components/ui/toaster';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Main Layout
 * 
 * This component is a thin wrapper around AppShell that provides the main layout for user pages.
 * It ensures consistent user experience throughout the user portal.
 */
export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <>
      <AppShell>
        {children}
      </AppShell>
      <Toaster />
    </>
  );
};

export default MainLayout;