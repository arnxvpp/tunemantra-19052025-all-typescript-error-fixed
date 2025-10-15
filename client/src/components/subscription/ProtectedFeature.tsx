import React, { ReactNode } from 'react';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { FeatureType } from '@/lib/feature-access';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RoleBadge } from '@/components/ui/role-badge';
import { useAuth } from '@/hooks/use-auth';

interface ProtectedFeatureProps {
  /**
   * The feature to protect 
   */
  feature: FeatureType;
  
  /**
   * The content to show if the user has access to the feature
   */
  children: ReactNode;
  
  /**
   * The content to show if the user doesn't have access
   */
  fallback?: ReactNode;
  
  /**
   * Show a locked warning card instead of the fallback
   */
  showLockedCard?: boolean;
  
  /**
   * Show upgrade button in the locked card
   */
  showUpgradeButton?: boolean;
  
  /**
   * Text to display on the locked card
   */
  lockedMessage?: string;
  
  /**
   * Title for the locked card
   */
  lockedTitle?: string;
  
  /**
   * Custom class names
   */
  className?: string;
}

export function ProtectedFeature({
  feature,
  children,
  fallback,
  showLockedCard = false,
  showUpgradeButton = true,
  lockedMessage,
  lockedTitle = 'Subscription Required',
  className
}: ProtectedFeatureProps) {
  const { canAccess, getPlanName } = useFeatureAccess();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Default locked message for subscription-based access
  const defaultLockedMessage = `This feature requires a higher subscription level. Upgrade your plan to unlock this feature.`;
  
  const finalLockedMessage = lockedMessage || defaultLockedMessage;
  
  // Handle upgrade click - redirect to subscription plans
  const handleUpgradeClick = () => {
    window.location.href = '/subscription-plans';
  };
  
  // If user has access, show the children
  if (canAccess(feature)) {
    return <>{children}</>;
  }
  
  // Show a locked card if requested
  if (showLockedCard) {
    return (
      <Card className={`border-amber-200 bg-amber-50 ${className}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-800">{lockedTitle}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-amber-700 mb-4">
            {finalLockedMessage}
          </CardDescription>
          
          {showUpgradeButton && (
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleUpgradeClick}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Upgrade Plan
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Show the fallback content or a simple notification
  return (
    <>
      {fallback || (
        <Alert variant="destructive" className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {finalLockedMessage}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

export function SubscriptionFeatureCard({ 
  feature, 
  icon, 
  title, 
  description, 
  action, 
  available = true 
}: { 
  feature: FeatureType;
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  available?: boolean;
}) {
  const { canAccess } = useFeatureAccess();
  const { user } = useAuth();
  const hasAccess = canAccess(feature);
  
  return (
    <Card className={`transition-all ${!available || !hasAccess ? 'opacity-70' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          
          {!available || !hasAccess ? (
            <Lock className="h-4 w-4 text-gray-400" />
          ) : (
            user?.role && (
              <div className="flex items-center">
                <RoleBadge role={user.role} size="sm" />
              </div>
            )
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="min-h-[40px]">
          {description}
        </CardDescription>
        
        <div className="mt-4">
          {action}
        </div>
      </CardContent>
    </Card>
  );
}