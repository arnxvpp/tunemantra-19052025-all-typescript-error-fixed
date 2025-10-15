import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings,
  MessageSquare,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThemeToggle from '../ui/theme-toggle';

interface NavbarProps {
  toggleSidebar: () => void;
  darkMode: boolean; // Add darkMode prop
  toggleDarkMode: () => void; // Add toggle function prop
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar, darkMode, toggleDarkMode }) => { // Accept props
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search query:', searchQuery);
    // Implement search functionality
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="navbar">
      <div className="navbar-start">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <Menu className="menu-icon" />
        </button>
        
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-input-wrapper">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </form>
      </div>
      
      <div className="navbar-end">
        {/* Pass required props to ThemeToggle */}
        <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="navbar-icon-btn notification-btn">
              <Bell size={20} />
              <span className="notification-badge">5</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="notification-menu">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="notification-list">
              <div className="notification-item">
                <div className="notification-icon success">
                  <Bell size={14} />
                </div>
                <div className="notification-content">
                  <p className="notification-title">Your release was approved</p>
                  <p className="notification-time">2 hours ago</p>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon warning">
                  <Bell size={14} />
                </div>
                <div className="notification-content">
                  <p className="notification-title">Distribution started for "New Album"</p>
                  <p className="notification-time">5 hours ago</p>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon info">
                  <MessageSquare size={14} />
                </div>
                <div className="notification-content">
                  <p className="notification-title">New message from support</p>
                  <p className="notification-time">1 day ago</p>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="view-all">
              <Link to="/notifications">View all notifications</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="user-profile-btn">
              <Avatar className="user-avatar">
                <AvatarImage src={user?.avatarUrl || ''} />
                <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div className="user-info">
                <span className="user-name">{user?.fullName || user?.username || 'User'}</span>
                <span className="user-role">{user?.role?.replace('_', ' ') || 'Guest'}</span>
              </div>
              <ChevronDown size={16} className="dropdown-arrow" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="user-dropdown-menu">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Link to="/settings/profile" className="dropdown-menu-item">
                  <User className="dropdown-menu-icon" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/settings" className="dropdown-menu-item">
                  <Settings className="dropdown-menu-icon" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link to="/support" className="dropdown-menu-item">
                  <HelpCircle className="dropdown-menu-icon" />
                  <span>Support</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <div className="dropdown-menu-item">
                <LogOut className="dropdown-menu-icon" />
                <span>Logout</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;