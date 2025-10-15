import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark' | 'outline-primary' | 'outline-secondary' | 'outline-success' | 'outline-danger' | 'outline-warning' | 'outline-info' | 'outline-light' | 'outline-dark' | 'ghost' | 'link';

type ButtonSize = 'sm' | 'md' | 'lg';

interface CoreUIButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

/**
 * CoreUIButton component
 * 
 * A consistent button component that follows CoreUI styling and conventions
 * 
 * @param variant - Button style variant
 * @param size - Button size
 * @param icon - Optional icon
 * @param iconPosition - Position of the icon ('left' or 'right')
 * @param children - Button content
 * @param ...props - Other button props
 */
export function CoreUIButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  children,
  className = '',
  ...props
}: CoreUIButtonProps) {
  
  // Map CoreUI variants to shadcn variants
  const getShadcnVariant = (coreVariant: ButtonVariant) => {
    if (coreVariant.startsWith('outline-')) {
      return 'outline';
    }
    
    switch (coreVariant) {
      case 'primary': return 'default';
      case 'secondary': return 'secondary';
      case 'danger': return 'destructive';
      case 'ghost': return 'ghost';
      case 'link': return 'link';
      default: return 'default';
    }
  };
  
  // Map CoreUI sizes to shadcn sizes
  const getShadcnSize = (coreSize: ButtonSize) => {
    switch (coreSize) {
      case 'sm': return 'sm';
      case 'lg': return 'lg';
      default: return 'default';
    }
  };
  
  // CoreUI class based on variant
  const getCoreUIClass = (coreVariant: ButtonVariant) => {
    return `btn btn-${coreVariant}`;
  };
  
  return (
    <Button
      variant={getShadcnVariant(variant) as any}
      size={getShadcnSize(size) as any}
      className={`${getCoreUIClass(variant)} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span className="btn-icon-left">{icon}</span>
      )}
      {children}
      {icon && iconPosition === 'right' && (
        <span className="btn-icon-right">{icon}</span>
      )}
    </Button>
  );
}

export default CoreUIButton;