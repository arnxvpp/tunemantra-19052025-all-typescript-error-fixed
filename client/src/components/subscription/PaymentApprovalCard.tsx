import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Clock, UserCircle, Calendar, CreditCard } from "lucide-react";
import { format } from 'date-fns';
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export type SubscriptionStatus = 'pending_approval' | 'approved' | 'rejected';
export type SubscriptionPlan = 'free' | 'artist' | 'artist_manager' | 'label_admin';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  entityName: string | null;
  status: string;
  createdAt: string;
  role?: string;
  subscriptionInfo?: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate: Date;
    endDate: Date;
    paymentId?: string;
  };
}

interface PaymentApprovalCardProps {
  user: User;
  onStatusChange: () => void;
}

export function PaymentApprovalCard({ user, onStatusChange }: PaymentApprovalCardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState({ approve: false, reject: false });
  const [notes, setNotes] = useState('');

  const formatDate = (dateString: Date | string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getPlanLabel = (plan: SubscriptionPlan) => {
    switch (plan) {
      case 'label_admin':
        return 'Label Admin (₹6000/year)';
      case 'artist_manager':
        return 'Artist Manager (₹2499/year)';
      case 'artist':
        return 'Artist (₹999/year)';
      case 'free':
        return 'Free Plan';
      default:
        return plan;
    }
  };

  const handleApprove = async () => {
    setLoading({ ...loading, approve: true });
    try {
      const response = await axios.post(`/api/admin/approvals/${user.id}/approved`, { notes });
      
      if (response.data.success) {
        toast({
          title: 'Subscription Approved',
          description: `${user.username}'s subscription has been successfully approved.`,
        });
        onStatusChange();
      }
    } catch (error) {
      console.error('Error approving subscription:', error);
      toast({
        title: 'Approval Failed',
        description: 'Failed to approve subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading({ ...loading, approve: false });
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      toast({
        title: 'Notes Required',
        description: 'Please provide a reason for rejecting this subscription.',
        variant: 'destructive',
      });
      return;
    }

    setLoading({ ...loading, reject: true });
    try {
      const response = await axios.post(`/api/admin/approvals/${user.id}/rejected`, { notes });
      
      if (response.data.success) {
        toast({
          title: 'Subscription Rejected',
          description: `${user.username}'s subscription has been rejected.`,
        });
        onStatusChange();
      }
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      toast({
        title: 'Rejection Failed',
        description: 'Failed to reject subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading({ ...loading, reject: false });
    }
  };

  // Get subscription info safely
  const subscriptionInfo = user.subscriptionInfo || { 
    plan: 'free' as SubscriptionPlan,
    status: 'pending_approval' as SubscriptionStatus,
    startDate: new Date(),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              {user.fullName || user.username}
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            <Clock className="h-3.5 w-3.5 mr-1" /> Pending Approval
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Plan:</span>
              <span className="ml-2 font-medium">{getPlanLabel(subscriptionInfo.plan)}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">Start Date:</span>
              <span className="ml-2 font-medium">{formatDate(subscriptionInfo.startDate)}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">End Date:</span>
              <span className="ml-2 font-medium">{formatDate(subscriptionInfo.endDate)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground">User Since:</span>
              <span className="ml-2 font-medium">{formatDate(user.createdAt)}</span>
            </div>
            
            {subscriptionInfo.paymentId && (
              <div className="flex items-center text-sm">
                <CreditCard className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">Payment ID:</span>
                <span className="ml-2 font-medium">{subscriptionInfo.paymentId}</span>
              </div>
            )}
            
            {user.entityName && (
              <div className="flex items-center text-sm">
                <UserCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">Entity Name:</span>
                <span className="ml-2 font-medium">{user.entityName}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="pt-2">
          <label className="text-sm font-medium">Admin Notes:</label>
          <Textarea 
            placeholder="Add notes about this approval or rejection (required for rejection)" 
            className="mt-1.5"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </CardContent>
      <CardFooter className="justify-end space-x-2">
        <Button 
          variant="outline" 
          onClick={handleReject}
          disabled={loading.approve || loading.reject}
          className="border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          {loading.reject ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing
            </span>
          ) : (
            <span className="flex items-center">
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </span>
          )}
        </Button>
        <Button 
          onClick={handleApprove}
          disabled={loading.approve || loading.reject}
        >
          {loading.approve ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing
            </span>
          ) : (
            <span className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </span>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}