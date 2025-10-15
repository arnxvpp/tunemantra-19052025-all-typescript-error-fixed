import React from 'react';
import { CoreUIAppShell } from './CoreUIAppShell';

interface CoreUIMainLayoutProps {
  children: React.ReactNode;
}

export function CoreUIMainLayout({ children }: CoreUIMainLayoutProps) {
  return (
    <CoreUIAppShell>
      {children}
    </CoreUIAppShell>
  );
}

export default CoreUIMainLayout;