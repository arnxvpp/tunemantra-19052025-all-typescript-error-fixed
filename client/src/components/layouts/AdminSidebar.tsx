import React from 'react';
import { useLocation } from 'wouter';
import { 
  HardDrive, Disc, Users, Tag, Share2, Radio, FileText, Package as PackageIcon,
  BarChart3, CreditCard, Settings, AlertCircle, MessageSquare, LifeBuoy,
  Upload, Download
} from 'lucide-react';

type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
};

export const AdminSidebar: React.FC = () => {
  const [pathname] = useLocation();
  
  const navItems: NavItem[] = [
    // Content Management
    { href: '/admin/catalog', icon: <HardDrive className="h-5 w-5" />, label: 'Catalog', active: pathname.startsWith('/admin/catalog') },
    { href: '/admin/releases', icon: <Disc className="h-5 w-5" />, label: 'Releases', active: pathname.startsWith('/admin/releases') },
    { href: '/admin/artists', icon: <Users className="h-5 w-5" />, label: 'Artists', active: pathname.startsWith('/admin/artists') },
    { href: '/admin/labels', icon: <Tag className="h-5 w-5" />, label: 'Labels', active: pathname.startsWith('/admin/labels') },

    // Distribution
    { href: '/admin/distribution', icon: <Share2 className="h-5 w-5" />, label: 'Distribution', active: pathname.startsWith('/admin/distribution') },
    { href: '/admin/platforms', icon: <Radio className="h-5 w-5" />, label: 'Platforms', active: pathname.startsWith('/admin/platforms') },
    { href: '/admin/metadata-export', icon: <Download className="h-5 w-5" />, label: 'Metadata Export', active: pathname.startsWith('/admin/metadata-export') },
    { href: '/admin/metadata-import', icon: <Upload className="h-5 w-5" />, label: 'Metadata Import', active: pathname.startsWith('/admin/metadata-import') },
    { href: '/admin/asset-bundle-import', icon: <PackageIcon className="h-5 w-5" />, label: 'Asset Bundle Import', active: pathname.startsWith('/admin/asset-bundle-import') },
    
    // Analytics & Reporting
    { href: '/admin/analytics', icon: <BarChart3 className="h-5 w-5" />, label: 'Analytics', active: pathname.startsWith('/admin/analytics') },
    { href: '/admin/reports', icon: <FileText className="h-5 w-5" />, label: 'Reports', active: pathname.startsWith('/admin/reports') },
    
    // Financial
    { href: '/admin/payments', icon: <CreditCard className="h-5 w-5" />, label: 'Payments', active: pathname.startsWith('/admin/payments') },
    
    // System
    { href: '/admin/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings', active: pathname.startsWith('/admin/settings') },
    { href: '/admin/issues', icon: <AlertCircle className="h-5 w-5" />, label: 'Issues', active: pathname.startsWith('/admin/issues') },
    { href: '/admin/support', icon: <MessageSquare className="h-5 w-5" />, label: 'Support', active: pathname.startsWith('/admin/support') },
    { href: '/admin/help', icon: <LifeBuoy className="h-5 w-5" />, label: 'Help', active: pathname.startsWith('/admin/help') },
  ];

  return (
    <div className="w-64 bg-background border-r h-screen p-4">
      <div className="font-bold text-xl mb-8 px-4">TuneMantra Admin</div>
      
      <nav className="space-y-1">
        {navItems.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors ${
              item.active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;