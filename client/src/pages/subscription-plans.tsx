import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Shield, Music, Users, Check, Star, Clock, Loader2 } from "lucide-react";
import axios from "axios";

// Types for subscription plans
type SubscriptionPlan = "free" | "artist" | "artist_manager" | "label";

// Plan feature interface
interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string | number;
}

// Plan details interface
interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: {
    monthly: number | null;
    yearly: number;
  };
  features: PlanFeature[];
  icon: React.ReactNode;
  badge?: string;
}

// Component for feature list items
const FeatureItem = ({ feature }: { feature: PlanFeature }) => (
  <div className="flex items-center py-1.5">
    <Check 
      className={`h-4 w-4 mr-2 ${feature.included 
        ? "text-green-500" 
        : "text-gray-300 dark:text-gray-600"
      }`} 
    />
    <span className={!feature.included ? "text-muted-foreground line-through" : ""}>
      {feature.name} {feature.limit ? <span className="font-semibold">{feature.limit}</span> : ""}
    </span>
  </div>
);

export default function SubscriptionPlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<"yearly" | "monthly">("yearly");
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<{
    plan: SubscriptionPlan;
    status: string;
    endDate?: string;
  } | null>(null);

  useEffect(() => {
    // Fetch current subscription status
    const fetchSubscriptionStatus = async () => {
      try {
        if (user) {
          const response = await axios.get('/api/payment/subscription-status');
          
          if (response.data && user.subscriptionInfo) {
            const subscriptionInfo = user.subscriptionInfo as any;
            setCurrentSubscription({
              plan: subscriptionInfo.plan || 'free' as SubscriptionPlan,
              status: subscriptionInfo.status || 'inactive',
              endDate: subscriptionInfo.endDate 
                ? new Date(subscriptionInfo.endDate).toLocaleDateString() 
                : undefined
            });
          }
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      }
    };

    fetchSubscriptionStatus();
  }, [user]);

  // Plans definition
  const plans: PlanDetails[] = [
    {
      id: "free",
      name: "Basic",
      description: "For solo artists just getting started",
      price: {
        monthly: null,
        yearly: 0,
      },
      icon: <Music className="h-6 w-6 text-primary" />,
      features: [
        { name: "Artist profile management", included: true },
        { name: "Release", included: true, limit: "1 per month" },
        { name: "Track", included: true, limit: "1 per release" },
        { name: "Analytics dashboard (basic)", included: true },
        { name: "Standard support", included: true },
        { name: "Artist management", included: false },
        { name: "Revenue splits", included: false },
        { name: "Priority distribution", included: false },
        { name: "Advanced analytics", included: false },
        { name: "Label management", included: false }
      ]
    },
    {
      id: "artist",
      name: "Artist",
      description: "For independent artists who need more flexibility",
      price: {
        monthly: 89,
        yearly: 999,
      },
      badge: "Popular",
      icon: <Star className="h-6 w-6 text-primary" />,
      features: [
        { name: "Artist profile management", included: true },
        { name: "Releases", included: true, limit: "Unlimited" },
        { name: "Tracks", included: true, limit: "Unlimited" },
        { name: "Analytics dashboard", included: true },
        { name: "Email support", included: true },
        { name: "Artist management", included: false },
        { name: "Revenue splits", included: true },
        { name: "Priority distribution", included: false },
        { name: "AI-powered metadata", included: true },
        { name: "Label management", included: false }
      ]
    },
    {
      id: "artist_manager",
      name: "Artist Manager",
      description: "For managers handling multiple artists",
      price: {
        monthly: 220,
        yearly: 2499,
      },
      icon: <Users className="h-6 w-6 text-primary" />,
      features: [
        { name: "Artist profile management", included: true },
        { name: "Releases", included: true, limit: "Unlimited" },
        { name: "Tracks", included: true, limit: "Unlimited" },
        { name: "Advanced analytics", included: true },
        { name: "Priority support", included: true },
        { name: "Multiple artists", included: true, limit: "Up to 10 artists" },
        { name: "Revenue splits", included: true },
        { name: "Priority distribution", included: true },
        { name: "Advanced metadata tools", included: true },
        { name: "Label management", included: false }
      ]
    },
    {
      id: "label",
      name: "Label",
      description: "Enterprise features for labels of any size",
      price: {
        monthly: 550,
        yearly: 6000,
      },
      icon: <Shield className="h-6 w-6 text-primary" />,
      features: [
        { name: "Label profile management", included: true },
        { name: "Releases", included: true, limit: "Unlimited" },
        { name: "Tracks", included: true, limit: "Unlimited" },
        { name: "Advanced analytics with exports", included: true },
        { name: "Dedicated support manager", included: true },
        { name: "Multiple artists", included: true, limit: "Unlimited" },
        { name: "Revenue splits", included: true },
        { name: "Priority distribution", included: true },
        { name: "Enterprise metadata tools", included: true },
        { name: "Label management", included: true }
      ]
    }
  ];

  // Handle subscription checkout process
  const handleSubscribe = async (planId: SubscriptionPlan) => {
    if (planId === "free") {
      try {
        setLoading(true);
        const response = await axios.post('/api/payment/create-subscription', {
          planType: planId
        });
        
        if (response.data.skipPayment) {
          toast({
            title: "Free Plan Activated",
            description: "Your free plan has been activated successfully.",
          });
          // Refresh user data or redirect
        }
      } catch (error) {
        console.error('Error activating free plan:', error);
        toast({
          title: "Activation Failed",
          description: "Failed to activate free plan. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setSelectedPlan(planId);
      
      // Create subscription order
      const response = await axios.post('/api/payment/create-subscription', {
        planType: planId
      });
      
      if (response.data.skipPayment) {
        // Handle free plan activation
        toast({
          title: "Plan Activated",
          description: "Your plan has been activated successfully.",
        });
        return;
      }
      
      // Initialize Razorpay checkout with enhanced features
      const options = {
        key: response.data.key,
        amount: response.data.amount * 100, // Convert to paise
        currency: response.data.currency,
        name: "Music Distribution Platform",
        description: `${planId.replace('_', ' ')} subscription`,
        order_id: response.data.order_id,
        prefill: {
          name: response.data.name,
          email: response.data.email,
          contact: response.data.contact || "",
        },
        notes: response.data.notes, // Pass through the notes from backend
        theme: {
          color: "#7f56d9",
        },
        // Define a custom successful callback URL
        callback_url: response.data.callback_url,
        redirect: response.data.redirect || true,
        // Use the modal config from backend
        modal: response.data.modal || {
          escape: false,
          confirm_close: true,
          animation: true,
          ondismiss: function() {
            setLoading(false);
            setSelectedPlan(null);
          }
        },
        // Enhanced handler for payment success
        handler: async function (response: any) {
          try {
            // Show initial success message
            toast({
              title: "Payment Processing",
              description: "Your payment is being processed...",
            });
            
            // Verify payment and activate subscription
            const verificationResponse = await axios.post('/api/payment/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: planId
            });
            
            if (verificationResponse.data.success) {
              // Clear processing toast and show success
              toast({
                title: "Payment Successful",
                description: verificationResponse.data.message || "Your subscription is now pending admin approval.",
              });
              
              // Update local subscription state
              setCurrentSubscription({
                plan: planId,
                status: 'pending_approval'
              });
              
              // If server provided a redirect URL, use it
              if (verificationResponse.data.redirectTo) {
                setTimeout(() => {
                  window.location.href = verificationResponse.data.redirectTo;
                }, 1500);
              }
            }
          } catch (error: any) {
            console.error('Payment verification error:', error);
            toast({
              title: "Verification Failed",
              description: error.response?.data?.error || "Payment was processed but verification failed. Please contact support.",
              variant: "destructive",
            });
          } finally {
            setLoading(false);
          }
        },
      };
      
      // Initialize Razorpay
      // @ts-ignore
      const razorpay = new window.Razorpay(options);
      
      // Open Razorpay payment modal
      razorpay.open();
      
      // Set up a fallback in case the modal is closed without completing
      razorpay.on('payment.failed', function (response: any) {
        toast({
          title: "Payment Failed",
          description: response.error?.description || "Your payment attempt was unsuccessful. Please try again.",
          variant: "destructive",
        });
        setLoading(false);
        setSelectedPlan(null);
      });
      
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  // Helper to format subscription status into display text
  const formatStatus = (status: string): { label: string; className: string } => {
    switch (status) {
      case 'active':
        return { label: 'Active', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' };
      case 'pending_approval':
        return { label: 'Pending Approval', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' };
      case 'canceled':
        return { label: 'Canceled', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' };
      case 'expired':
        return { label: 'Expired', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' };
      default:
        return { label: status.charAt(0).toUpperCase() + status.slice(1), className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    }
  };

  return (
    <div className="container max-w-6xl py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Plans</h1>
          <p className="text-muted-foreground mt-2">
            Choose the right plan for your music distribution needs
          </p>
        </div>

        {/* Current Subscription Banner */}
        {currentSubscription && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-medium">Current Subscription</h3>
                  <div className="flex flex-wrap gap-2 mt-2 items-center">
                    <Badge variant="outline" className="font-semibold capitalize">
                      {currentSubscription.plan.replace('_', ' ')}
                    </Badge>
                    <Badge className={formatStatus(currentSubscription.status).className}>
                      {formatStatus(currentSubscription.status).label}
                    </Badge>
                    {currentSubscription.endDate && (
                      <span className="text-muted-foreground text-sm flex items-center">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Expires: {currentSubscription.endDate}
                      </span>
                    )}
                  </div>
                  {currentSubscription.status === 'pending_approval' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Your subscription is being reviewed by our team and will be activated soon.
                    </p>
                  )}
                </div>
                <div>
                  {currentSubscription.status === 'active' && (
                    <Button variant="outline" onClick={() => {
                      // Open a dialog to confirm cancellation
                      if (window.confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
                        axios.post('/api/payment/cancel-subscription')
                          .then(() => {
                            toast({
                              title: "Subscription Canceled",
                              description: "Your subscription has been canceled successfully.",
                            });
                            // Update local state
                            setCurrentSubscription({
                              ...currentSubscription,
                              status: 'canceled'
                            });
                          })
                          .catch(error => {
                            console.error('Error canceling subscription:', error);
                            toast({
                              title: "Cancellation Failed",
                              description: "Failed to cancel subscription. Please try again.",
                              variant: "destructive",
                            });
                          });
                      }
                    }}>
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Billing Cycle Selector */}
        <div className="flex justify-center mb-8">
          <Tabs 
            defaultValue="yearly" 
            value={selectedBillingCycle}
            onValueChange={(value) => setSelectedBillingCycle(value as "yearly" | "monthly")}
            className="w-[300px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                <Badge variant="outline" className="ml-2 bg-primary text-primary-foreground py-0 px-1.5 text-xs">
                  Save 15%
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.badge ? "border-primary" : ""}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary hover:bg-primary text-white">{plan.badge}</Badge>
                </div>
              )}
              <CardHeader>
                <div className="flex justify-center mb-2">{plan.icon}</div>
                <CardTitle className="text-center">{plan.name}</CardTitle>
                <CardDescription className="text-center">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="space-y-2">
                  <p className="text-3xl font-bold">
                    ₹{selectedBillingCycle === "yearly" ? plan.price.yearly.toLocaleString() : (plan.price.monthly || 0).toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">
                      {plan.id !== "free" && `/${selectedBillingCycle === "yearly" ? "year" : "month"}`}
                    </span>
                  </p>
                  {plan.id !== "free" && selectedBillingCycle === "yearly" && (
                    <p className="text-sm text-muted-foreground">
                      ₹{Math.round(plan.price.yearly / 12).toLocaleString()} per month, billed annually
                    </p>
                  )}
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-1 text-left">
                  {plan.features.map((feature, index) => (
                    <FeatureItem key={index} feature={feature} />
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={plan.id === "free" ? "outline" : "default"}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading || selectedPlan !== null || 
                    (currentSubscription?.status === 'active' && currentSubscription?.plan === plan.id) ||
                    currentSubscription?.status === 'pending_approval'}
                >
                  {loading && selectedPlan === plan.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : currentSubscription?.status === 'active' && currentSubscription?.plan === plan.id ? (
                    'Current Plan'
                  ) : currentSubscription?.status === 'pending_approval' ? (
                    'Waiting Approval'
                  ) : (
                    plan.id === "free" ? 'Get Started' : 'Subscribe'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>All prices are in Indian Rupees (₹). By subscribing, you agree to our terms of service.</p>
          <p className="mt-1">Need help choosing a plan? <a href="#" className="text-primary underline">Contact our sales team</a>.</p>
        </div>
      </div>
    </div>
  );
}