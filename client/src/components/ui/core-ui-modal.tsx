import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import CoreUIStyles from './core-ui-styles';

interface CoreUIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * CoreUIModal component
 * 
 * A pure implementation of a modal dialog that follows CoreUI styling and conventions
 * 
 * @param open - Whether the modal is open
 * @param onOpenChange - Callback when modal open state changes
 * @param title - Modal title
 * @param description - Optional description
 * @param children - Modal content
 * @param footer - Optional footer content (typically buttons)
 * @param size - Modal size (sm, md, lg, xl)
 */
export function CoreUIModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md'
}: CoreUIModalProps) {
  
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    
    document.addEventListener('keydown', handleEscapeKey);
    
    // Prevent body scrolling when modal is open
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);
  
  // Define max width based on size
  const sizeClass = {
    sm: 'coreui-modal-sm',
    md: 'coreui-modal-md',
    lg: 'coreui-modal-lg',
    xl: 'coreui-modal-xl'
  }[size];
  
  // If not open, return null
  if (!open) return null;
  
  // Click on backdrop to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false);
    }
  };
  
  // Render modal using createPortal to avoid z-index issues
  return createPortal(
    <div className="coreui-modal-wrapper">
      <div className="coreui-modal-backdrop" onClick={handleBackdropClick}></div>
      <div className={`coreui-modal-container ${sizeClass}`}>
        <div className="coreui-modal-content">
          <div className="coreui-modal-header">
            <h5 className="coreui-modal-title">{title}</h5>
            {description && <div className="coreui-modal-description">{description}</div>}
            <button 
              className="coreui-modal-close" 
              onClick={() => onOpenChange(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          
          <div className="coreui-modal-body">
            {children}
          </div>
          
          {footer && (
            <div className="coreui-modal-footer">
              {footer}
            </div>
          )}
        </div>
      </div>
      
      <CoreUIStyles>{`
        .coreui-modal-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }
        
        .coreui-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1000;
        }
        
        .coreui-modal-container {
          position: relative;
          width: 100%;
          max-height: 90vh;
          margin: 0 auto;
          z-index: 1001;
        }
        
        .coreui-modal-sm {
          max-width: 425px;
        }
        
        .coreui-modal-md {
          max-width: 550px;
        }
        
        .coreui-modal-lg {
          max-width: 750px;
        }
        
        .coreui-modal-xl {
          max-width: 900px;
        }
        
        .coreui-modal-content {
          position: relative;
          display: flex;
          flex-direction: column;
          width: 100%;
          background-color: #fff;
          border: 1px solid rgba(0, 0, 21, 0.2);
          border-radius: 0.3rem;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }
        
        .coreui-modal-header {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 1rem;
          border-bottom: 1px solid #d8dbe0;
          background-color: #f8f9fa;
        }
        
        .coreui-modal-title {
          margin: 0;
          line-height: 1.5;
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .coreui-modal-description {
          margin-top: 0.25rem;
          font-size: 0.875rem;
          color: #768192;
        }
        
        .coreui-modal-body {
          position: relative;
          flex: 1 1 auto;
          padding: 1.5rem;
          background-color: #fff;
          overflow-y: auto;
          max-height: calc(90vh - 130px);
        }
        
        .coreui-modal-footer {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          padding: 1rem;
          border-top: 1px solid #d8dbe0;
          background-color: #f8f9fa;
        }
        
        .coreui-modal-close {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          padding: 0.25rem;
          background-color: transparent;
          border: 0;
          appearance: none;
          cursor: pointer;
          color: #5c6873;
          opacity: 0.5;
          transition: opacity 0.15s ease;
        }
        
        .coreui-modal-close:hover {
          opacity: 1;
        }
      `}</CoreUIStyles>
    </div>,
    document.body
  );
}

export default CoreUIModal;