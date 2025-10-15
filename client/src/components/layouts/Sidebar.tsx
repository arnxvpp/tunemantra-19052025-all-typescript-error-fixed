import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { 
  Home, 
  Music, 
  BarChart2, 
  Users, 
  Settings, 
  HelpCircle,
  File,
  Shield,
  Upload,
  DollarSign,
  Globe,
  Info,
  ChevronDown,
  ChevronRight,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
}

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  role?: string[];
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleSubmenu = (title: string) => {
    if (openMenus.includes(title)) {
      setOpenMenus(openMenus.filter(menu => menu !== title));
    } else {
      setOpenMenus([...openMenus, title]);
    }
  };

  const menuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      path: '/',
      icon: <Home className="menu-icon" />
    },
    {
      title: 'Catalog',
      icon: <Music className="menu-icon" />,
      children: [
        { title: 'Releases', path: '/catalog/releases', icon: <File className="submenu-icon" /> },
        { title: 'Tracks', path: '/catalog/tracks', icon: <Music className="submenu-icon" /> },
        { title: 'Distribution Schedule', path: '/catalog/distribution-schedule', icon: <Globe className="submenu-icon" /> },
        { title: 'Distribution Analytics', path: '/catalog/distribution-analytics', icon: <BarChart2 className="submenu-icon" /> },
        { title: 'Categories', path: '/catalog/categories', icon: <Info className="submenu-icon" /> }
      ]
    },
    {
      title: 'Upload',
      path: '/upload',
      icon: <Upload className="menu-icon" />
    },
    {
      title: 'Analytics',
      icon: <BarChart2 className="menu-icon" />,
      children: [
        { title: 'Dashboard', path: '/analytics/dashboard', icon: <BarChart2 className="submenu-icon" /> },
        { title: 'Revenue', path: '/analytics/revenue', icon: <DollarSign className="submenu-icon" /> },
        { title: 'Engagement', path: '/analytics/engagement', icon: <Users className="submenu-icon" /> },
        { title: 'Geographic', path: '/analytics/geo', icon: <Globe className="submenu-icon" /> },
        { title: 'Trends', path: '/analytics/trends', icon: <BarChart2 className="submenu-icon" /> }
      ]
    },
    {
      title: 'Rights',
      icon: <Shield className="menu-icon" />,
      children: [
        { title: 'Overview', path: '/rights/overview', icon: <Info className="submenu-icon" /> },
        { title: 'Copyrights', path: '/rights/copyrights', icon: <Shield className="submenu-icon" /> },
        { title: 'Publishing', path: '/rights/publishing', icon: <Globe className="submenu-icon" /> },
        { title: 'Licenses', path: '/rights/licenses', icon: <File className="submenu-icon" /> },
        { title: 'Legal', path: '/rights/legal', icon: <Shield className="submenu-icon" /> }
      ]
    },
    {
      title: 'Payments',
      path: '/payments',
      icon: <DollarSign className="menu-icon" />
    },
    {
      title: 'Team',
      path: '/settings/team-members',
      icon: <Users className="menu-icon" />,
      role: ['label_admin', 'artist_manager', 'super_admin']
    },
    {
      title: 'Settings',
      icon: <Settings className="menu-icon" />,
      children: [
        { title: 'Profile', path: '/settings/profile', icon: <Users className="submenu-icon" /> },
        { title: 'Team Management', path: '/settings/team-management', icon: <Users className="submenu-icon" />, role: ['label_admin', 'super_admin'] },
        { title: 'Distribution Settings', path: '/catalog/distribution-settings', icon: <Settings className="submenu-icon" /> },
        { title: 'Permission Templates', path: '/settings/permission-templates', icon: <Shield className="submenu-icon" />, role: ['label_admin', 'super_admin'] }
      ]
    },
    {
      title: 'Support',
      path: '/support',
      icon: <HelpCircle className="menu-icon" />
    },
    {
      title: 'Admin Panel',
      path: '/admin/dashboard',
      icon: <Shield className="menu-icon" />,
      role: ['super_admin']
    }
  ];

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  const isSubmenuActive = (children: MenuItem[]): boolean => {
    return children.some(child => child.path && location.pathname === child.path);
  };

  const shouldShowMenuItem = (item: MenuItem): boolean => {
    if (!item.role) return true;
    if (!user) return false;
    return item.role.includes(user.role);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-box">
          {collapsed ? (
            <span className="logo-icon">AP</span>
          ) : (
            <span className="logo-text">Able Pro</span>
          )}
        </div>
      </div>
      
      <div className="sidebar-content">
        <nav className="menu">
          <ul className="menu-items">
            {menuItems.map((item, index) => (
              shouldShowMenuItem(item) && (
                <li key={index} className={`menu-item ${item.children && openMenus.includes(item.title) ? 'open' : ''} ${item.children && isSubmenuActive(item.children) ? 'active-parent' : ''} ${item.path && isActive(item.path) ? 'active' : ''}`}>
                  {item.path ? (
                    <Link to={item.path} className="menu-link">
                      {item.icon}
                      {!collapsed && <span className="menu-text">{item.title}</span>}
                    </Link>
                  ) : (
                    <div className="menu-link" onClick={() => toggleSubmenu(item.title)}>
                      {item.icon}
                      {!collapsed && (
                        <>
                          <span className="menu-text">{item.title}</span>
                          <span className="menu-arrow">
                            {openMenus.includes(item.title) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {item.children && (
                    <ul className={`submenu ${openMenus.includes(item.title) || isSubmenuActive(item.children) ? 'open' : ''}`}>
                      {item.children.map((child, childIndex) => (
                        shouldShowMenuItem(child) && (
                          <li key={childIndex} className={`submenu-item ${child.path && isActive(child.path) ? 'active' : ''}`}>
                            <Link to={child.path || '#'} className="submenu-link">
                              {child.icon}
                              {!collapsed && <span className="submenu-text">{child.title}</span>}
                            </Link>
                          </li>
                        )
                      ))}
                    </ul>
                  )}
                </li>
              )
            ))}
          </ul>
        </nav>
      </div>
      
      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <LogOut className="logout-icon" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;