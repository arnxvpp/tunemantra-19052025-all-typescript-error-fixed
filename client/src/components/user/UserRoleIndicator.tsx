import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { RoleBadge } from '@/components/ui/role-badge';
import { Badge } from '@/components/ui/badge';

type UserRoleIndicatorProps = {
  /**
   * Display variant
   */
  variant?: 'full' | 'compact';
  
  /**
   * Additional classes
   */
  className?: string;
};

export function UserRoleIndicator({ variant = 'full', className = '' }: UserRoleIndicatorProps) {
  const { user } = useAuth();
  const { getPlanName } = useFeatureAccess();
  
  if (!user) return null;
  
  // Use default role if null
  const userRole = user.role || 'artist';
  const planName = getPlanName();

  // Simplified indicator that just shows the role badge
  if (variant === 'compact') {
    return (
      <div className={`flex items-center ${className}`}>
        <RoleBadge role={userRole} size="sm" />
      </div>
    );
  }
  
  // Full version with role and plan
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <RoleBadge role={userRole} />
      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
        {planName}
      </Badge>
    </div>
  );
}