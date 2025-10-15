import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RazorpayCheckout } from './RazorpayCheckout';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: string;
  onSuccess: () => void;
}

export function PaymentModal({ open, onOpenChange, planType, onSuccess }: PaymentModalProps) {
  const [paymentComplete, setPaymentComplete] = useState(false);
  const { toast } = useToast();

  const handlePaymentSuccess = () => {
    setPaymentComplete(true);
    toast({
      title: 'Subscription Activated!',
      description: 'Your account has been upgraded successfully.',
    });
    setTimeout(() => {
      onSuccess();
      onOpenChange(false);
    }, 1500);
  };

  const handleCancel = () => {
    onOpenChange(false);
    toast({
      variant: 'default',
      title: 'Payment Cancelled',
      description: 'You can complete your subscription later from your account dashboard.',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-black/80 backdrop-blur-md border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-white">{paymentComplete ? 'Subscription Activated!' : 'Complete Your Subscription'}</DialogTitle>
          <DialogDescription className="text-slate-300">
            {paymentComplete 
              ? 'Your account has been successfully upgraded.' 
              : 'Please complete the payment process to activate your subscription.'
            }
          </DialogDescription>
        </DialogHeader>

        {!paymentComplete && (
          <RazorpayCheckout 
            planType={planType} 
            onSuccess={handlePaymentSuccess} 
            onCancel={handleCancel} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
}