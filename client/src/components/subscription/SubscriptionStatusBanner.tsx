import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Info, Clock, CheckCircle2, Ban, ShieldAlert } from 'lucide-react';
import { RoleBadge } from '@/components/ui/role-badge';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

// Define types for subscription plans and statuses
export type SubscriptionPlan = 'free' | 'artist' | 'artist_manager' | 'label_admin';
export type SubscriptionStatus = 
  | 'active' 
  | 'pending' 
  | 'pending_approval' 
  | 'canceled' 
  | 'expired' 
  | 'inactive'
  | 'rejected';

// Export the interface
export interface SubscriptionInfo {
 plan: 'free' | 'artist' | 'artist_manager' | 'label_admin';
 status: 'active' | 'pending' | 'pending_approval' | 'canceled' | 'expired' | 'inactive' | 'rejected';
  startDate: Date;
  endDate: Date;
  paymentId?: string;
}

interface SubscriptionStatusBannerProps {
  showDetails?: boolean;
  variant?: 'compact' | 'full';
  subscriptionInfo?: SubscriptionInfo;
  onRefresh?: () => Promise<void>;
}

export function SubscriptionStatusBanner({ 
  showDetails = true,
  variant = 'full',
  subscriptionInfo,
  onRefresh
}: SubscriptionStatusBannerProps) {
  const { user } = useAuth();
  const { 
    hasActiveSubscription, 
    isPendingApproval
  } = useFeatureAccess();
  
  if (!user) return null;
  
  // Use prop if provided, otherwise fall back to user's subscription info
  const subscription = subscriptionInfo || user.subscriptionInfo;
  const status = subscription?.status;
  const plan = subscription?.plan;
  
  // Calculate if we need to show a notification banner
  const needsBanner = 
    (isPendingApproval && isPendingApproval()) || 
    status === 'canceled' || 
    status === 'expired' || 
    status === 'rejected';
  
  if (!needsBanner && !showDetails) {
    return null;
  }
  
  // Get the appropriate alert styling and content based on subscription status
  const getStatusDetails = () => {
    switch (status) {
      case 'pending_approval':
        return {
          icon: <Clock className="h-5 w-5" />,
          title: 'Subscription Pending Approval',
          description: 'Your subscription payment is being processed. You will have full access once approved.',
          variant: 'default' as const,
          className: 'bg-amber-50 border-amber-200 text-amber-800'
        };
      case 'canceled':
        return {
          icon: <Ban className="h-5 w-5" />,
          title: 'Subscription Canceled',
          description: 'Your subscription has been canceled. Some features may be unavailable.',
          variant: 'destructive' as const,
          className: 'bg-red-50 border-red-200'
        };
      case 'expired':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          title: 'Subscription Expired',
          description: 'Your subscription has expired. Please renew to regain access to premium features.',
          variant: 'destructive' as const,
          className: 'bg-red-50 border-red-200'
        };
      case 'rejected':
        return {
          icon: <ShieldAlert className="h-5 w-5" />,
          title: 'Subscription Rejected',
          description: 'Your subscription payment was rejected. Please update your payment method and try again.',
          variant: 'destructive' as const,
          className: 'bg-red-50 border-red-200'
        };
      case 'active':
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          title: `Active ${plan?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Subscription'} Plan`,
          description: 'Your subscription is active. You have access to all features included in your plan.',
          variant: 'default' as const,
          className: 'bg-green-50 border-green-200 text-green-800'
        };
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          title: plan === 'free' ? 'Free Plan' : 'Inactive Subscription',
          description: plan === 'free' 
            ? 'You are on the free plan with limited features. Upgrade for full access.'
            : 'Your subscription is not active. Some features may be unavailable.',
          variant: 'default' as const,
          className: 'bg-blue-50 border-blue-200 text-blue-800'
        };
    }
  };
  
  const statusDetails = getStatusDetails();
  
  return (
    <Alert 
      variant={statusDetails.variant}
      className={`mb-4 ${statusDetails.className}`}
    >
      {statusDetails.icon}
      <div className="flex flex-col space-y-1">
        <AlertTitle className="flex items-center space-x-2">
          <span>{statusDetails.title}</span>
          {variant === 'full' && user.role && <RoleBadge role={user.role} size="sm" />}
        </AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{statusDetails.description}</p>
          
          {variant === 'full' && showDetails && (
            <div className="mt-2 space-x-2">
              {needsBanner && status !== 'rejected' && (
                <Link href="/subscription-plans">
                  <Button variant="outline" size="sm" className="mt-1">
                    View Plans
                  </Button>
                </Link>
              )}
              
              {status === 'rejected' && (
                <Link href="/payments">
                  <Button variant="outline" size="sm" className="mt-1">
                    Update Payment
                  </Button>
                </Link>
              )}
            </div>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
}