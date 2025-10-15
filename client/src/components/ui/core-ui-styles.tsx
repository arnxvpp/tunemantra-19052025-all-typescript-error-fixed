import React from 'react';

interface CoreUIStylesProps {
  children: string;
}

/**
 * CoreUIStyles component
 * 
 * This component properly renders styles for CoreUI components
 * without causing warnings about JSX attribute usage.
 */
export function CoreUIStyles({ children }: CoreUIStylesProps) {
  // Use dangerouslySetInnerHTML to inject styles safely
  return (
    <style dangerouslySetInnerHTML={{ __html: children }} />
  );
}

export default CoreUIStyles;