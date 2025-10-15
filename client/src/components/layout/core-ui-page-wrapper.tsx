import React from 'react';
import { Card } from '@/components/ui/card';

interface CoreUIPageWrapperProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * CoreUIPageWrapper component
 * 
 * A consistent wrapper for all pages in the application that applies the CoreUI styling.
 * 
 * @param children - The main content of the page
 * @param title - The page title displayed in the header
 * @param subtitle - Optional subtitle displayed below the title
 * @param icon - Optional icon displayed beside the title
 * @param actions - Optional actions displayed in the header (buttons, etc.)
 */
export function CoreUIPageWrapper({
  children,
  title,
  subtitle,
  icon,
  actions
}: CoreUIPageWrapperProps) {
  return (
    <div className="c-page-wrapper">
      {/* Page header */}
      <div className="c-row mb-4">
        <div className="c-col">
          <Card className="c-card mb-4">
            <div className="c-card-body d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                {icon && (
                  <div className="c-page-icon mr-3 text-primary">
                    {icon}
                  </div>
                )}
                <div>
                  <h2 className="c-page-title mb-0">{title}</h2>
                  {subtitle && (
                    <p className="c-page-subtitle text-muted mb-0">{subtitle}</p>
                  )}
                </div>
              </div>
              {actions && (
                <div className="c-page-actions">
                  {actions}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Page content */}
      <div className="c-row">
        <div className="c-col">
          {children}
        </div>
      </div>

      {/* <style jsx> block removed as it's incompatible with Vite.
          Styling needs to be reimplemented using global CSS, CSS Modules, or Tailwind. */}
    </div>
  );
}

export default CoreUIPageWrapper;