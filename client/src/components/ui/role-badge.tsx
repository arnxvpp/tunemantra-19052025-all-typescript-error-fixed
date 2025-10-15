import React from 'react';
import { UserRole } from '@/lib/user-roles';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { 
  Shield, 
  Crown, 
  UserCog, 
  Music, 
  Users,
  Star
} from 'lucide-react';

type RoleType = 'super_admin' | 'label_admin' | 'artist_manager' | 'artist' | 'team_member';

interface RoleBadgeProps {
  /**
   * The user role to display
   */
  role: string;
  
  /**
   * Size of the badge
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Show tooltip with role description on hover
   */
  showTooltip?: boolean;
  
  /**
   * Additional classes to apply to the badge 
   */
  className?: string;
}

// Define role colors, icons, and descriptions
const roleConfig: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}> = {
  'super_admin': {
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: <Crown className="h-3 w-3" />,
    label: 'Super Admin',
    description: 'Has full access to all platform features and user accounts'
  },
  'label_admin': {
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: <Shield className="h-3 w-3" />,
    label: 'Label Admin',
    description: 'Manages a record label with multiple artists and team members'
  },
  'artist_manager': {
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: <UserCog className="h-3 w-3" />,
    label: 'Artist Manager',
    description: 'Manages artists and releases on behalf of performers'
  },
  'artist': {
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: <Music className="h-3 w-3" />,
    label: 'Artist',
    description: 'Individual music creator with their own catalog and team'
  },
  'team_member': {
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: <Users className="h-3 w-3" />,
    label: 'Team Member',
    description: 'Works on behalf of an artist or label with limited permissions'
  }
};

export function RoleBadge({ 
  role,
  size = 'md',
  showTooltip = true,
  className = ''
}: RoleBadgeProps) {
  // Sanitize role and ensure it's one of our valid types
  const safeRole: RoleType = 
    (role && ['super_admin', 'label_admin', 'artist_manager', 'artist', 'team_member'].includes(role))
      ? (role as RoleType)
      : 'team_member';
  
  // Get the configuration for this role
  const config = roleConfig[safeRole];
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1'
  };
  
  const badge = (
    <Badge 
      variant="outline" 
      className={`
        ${config.color} ${config.bgColor} ${config.borderColor}
        font-medium border flex items-center gap-1 
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
  
  // Add tooltip if showTooltip is true
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col">
              <div className="flex items-center gap-1 font-medium">
                {config.icon}
                <span>{config.label} Role</span>
              </div>
              <p className="text-xs mt-1 max-w-[220px]">
                {config.description}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return badge;
}