import React from 'react';
import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  children?: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <img src="/images/logo.svg" alt="Able Pro Logo" className="auth-logo-image" />
            <span className="auth-logo-text">Able Pro</span>
          </Link>
        </div>
        
        <div className="auth-card">
          {children || <Outlet />}
        </div>
        
        <div className="auth-footer">
          <p className="copyright">
            © {new Date().getFullYear()} Able Pro Admin - All rights reserved.
          </p>
        </div>
      </div>
      
      <div className="auth-background">
        <div className="auth-background-image"></div>
        <div className="auth-background-overlay"></div>
      </div>
    </div>
  );
};

export default AuthLayout;