import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../../hooks/use-auth';

// Define Razorpay interface for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  planType: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface CheckoutData {
  order_id: string;
  amount: number;
  currency: string;
  key: string;
  name: string;
  email: string;
  contact: string;
}

export function RazorpayCheckout({ planType, onSuccess, onCancel }: RazorpayCheckoutProps) {
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, refreshUser } = useAuth();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      console.log('Razorpay SDK loaded');
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Create checkout session
  useEffect(() => {
    if (!user) return;

    const createCheckout = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/payment/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ planType }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to create checkout session');
        }

        // If this is a free plan or already handled on server
        if (data.skipPayment) {
          toast({
            title: 'Subscription Activated',
            description: data.message || 'Your free plan has been activated',
          });
          onSuccess();
          return;
        }

        setCheckoutData(data);
      } catch (err: any) {
        console.error('Error creating checkout:', err);
        setError(err.message || 'Failed to create checkout');
        toast({
          variant: 'destructive',
          title: 'Checkout Error',
          description: err.message || 'Failed to create checkout session',
        });
      } finally {
        setIsLoading(false);
      }
    };

    createCheckout();
  }, [user, planType, toast, onSuccess]);

  // Handle payment
  const handlePayment = () => {
    if (!checkoutData || !window.Razorpay) {
      setError('Payment system not ready yet. Please try again.');
      return;
    }

    const options = {
      key: checkoutData.key,
      amount: checkoutData.amount * 100, // Razorpay expects amount in paise
      currency: checkoutData.currency,
      name: 'TuneMantra Distribution',
      description: `Subscription for ${planType} plan`,
      order_id: checkoutData.order_id,
      prefill: {
        name: user?.username || '',
        email: user?.email || '',
        contact: user?.phoneNumber || '',
      },
      theme: {
        color: '#0891b2', // cyan-600
      },
      handler: async function (response: any) {
        try {
          // Verify the payment
          const verifyResponse = await fetch('/api/payment/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan_type: planType,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok) {
            throw new Error(verifyData.message || 'Payment verification failed');
          }

          // Payment successful
          toast({
            title: 'Payment Successful',
            description: 'Your subscription has been activated',
          });

          // Refresh user data
          await refreshUser();

          // Notify parent component
          onSuccess();
        } catch (err: any) {
          console.error('Payment verification error:', err);
          toast({
            variant: 'destructive',
            title: 'Payment Verification Failed',
            description: err.message || 'Failed to verify payment',
          });
        }
      },
      modal: {
        ondismiss: function () {
          toast({
            title: 'Payment Cancelled',
            description: 'You can complete the payment later',
          });
          onCancel();
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto bg-black/60 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Setting Up Payment</CardTitle>
          <CardDescription className="text-slate-300">
            Please wait while we set up your payment...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card className="w-full max-w-md mx-auto bg-black/60 backdrop-blur-sm border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Payment Error</CardTitle>
          <CardDescription className="text-slate-300">
            There was a problem setting up the payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-400">{error}</p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Show payment card
  return (
    <Card className="w-full max-w-md mx-auto bg-black/60 backdrop-blur-sm border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Complete Your Subscription</CardTitle>
        <CardDescription className="text-slate-300">
          You're subscribing to the {planType.replace('_', ' ')} plan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {checkoutData && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-300">Subscription</span>
              <span className="text-white font-medium">{planType.replace('_', ' ')} Plan</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span className="text-slate-300">Amount</span>
              <span className="text-white font-medium">
                {checkoutData.currency} {checkoutData.amount.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handlePayment} className="bg-cyan-500 hover:bg-cyan-600">
          Pay Now
        </Button>
      </CardFooter>
    </Card>
  );
}