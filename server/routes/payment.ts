import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import {
  createSubscription,
  verifyPayment,
  activateSubscription,
  cancelSubscription,
  hasActiveSubscription,
  type SubscriptionPlan
} from '../services/payment';
import { validateRequest } from '../utils/validation';
import { 
  createSubscriptionSchema, 
  verifyPaymentSchema, 
  cancelSubscriptionSchema, 
  subscriptionStatusQuerySchema,
  webhookSchema
} from '../schemas/payment-schemas';

export const paymentRouter = Router();

/**
 * Create a subscription checkout session
 */
paymentRouter.post(
  '/create-subscription', 
  requireAuth, 
  validateRequest(createSubscriptionSchema),
  async (req: Request, res: Response) => {
    try {
      const { plan, interval } = req.body;
      
      // Create subscription checkout session
      const userId = req.userId!;
      const checkoutData = await createSubscription(userId, plan as SubscriptionPlan);
      
      res.json(checkoutData);
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: error.message || 'Failed to create subscription checkout' });
    }
  }
);

/**
 * Verify payment and activate subscription
 * 
 * This endpoint can be called in two ways:
 * 1. Directly from the frontend after a successful payment (with auth)
 * 2. As a callback from Razorpay (without auth, but with payment verification)
 */
paymentRouter.post(
  '/verify-payment', 
  validateRequest(verifyPaymentSchema),
  async (req: Request, res: Response) => {
    try {
      const {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        signature: razorpay_signature,
        currency,
        amount
      } = req.body;

      // Verify payment signature first to ensure this is a legitimate payment
      const verifyResult = verifyPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!verifyResult.success) {
        return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
      }
      
      let userId: number;
      let planType: SubscriptionPlan;
      
      // Check if this is an authenticated request from our frontend
      if (req.userId) {
        // This is a user-initiated verification from our frontend
        if (!req.body.plan) {
          return res.status(400).json({ error: 'Plan type is required for manual verification' });
        }
        
        userId = req.userId;
        planType = req.body.plan as SubscriptionPlan;
      } else {
        // This might be a callback from Razorpay
        // In this case, we need to extract user ID and plan from the order notes
        
        // Fetch order details from Razorpay to get the notes
        try {
          // Normally we would call Razorpay API here, but for simplicity we'll
          // parse the order ID which contains userId and planType in our system
          // In production, you should fetch the order from Razorpay API
          
          // For simplicity in this demo, we'll require these values in the request body
          // When integrating the actual Razorpay API, you'd fetch the order and get these values
          if (!req.body.notes || !req.body.notes.userId || !req.body.notes.planType) {
            return res.status(400).json({ 
              error: 'Missing order notes. Please include notes.userId and notes.planType in the request.' 
            });
          }
          
          userId = parseInt(req.body.notes.userId);
          planType = req.body.notes.planType as SubscriptionPlan;
          
          if (isNaN(userId)) {
            return res.status(400).json({ error: 'Invalid user ID in order notes' });
          }
        } catch (err) {
          console.error('Error fetching order notes:', err);
          return res.status(400).json({ error: 'Could not process order details' });
        }
      }
      
      // Activate the subscription
      const activationResult = await activateSubscription(userId, planType, razorpay_payment_id);
      
      // Log successful payment activation
      console.log(`Subscription activated for user ${userId}, plan ${planType}, payment ${razorpay_payment_id}`);
      
      // Determine response based on type of request
      if (req.userId) {
        // If user-initiated, return detailed response
        res.json({
          success: true,
          message: 'Subscription activated successfully. Your account is pending admin approval.',
          user: activationResult.user,
          redirectTo: '/dashboard'
        });
      } else {
        // If Razorpay callback, return simple confirmation
        res.json({
          success: true,
          message: 'Payment verification successful'
        });
      }
    } catch (error: any) {
      console.error('Error verifying payment:', error);
      res.status(500).json({ error: error.message || 'Failed to verify payment' });
    }
  }
);

/**
 * Cancel subscription
 */
paymentRouter.post(
  '/cancel-subscription', 
  requireAuth, 
  validateRequest(cancelSubscriptionSchema),
  async (req: Request, res: Response) => {
    try {
      // Cancel subscription
      const userId = req.userId!;
      const result = await cancelSubscription(userId);
      
      res.json({
        success: true,
        message: 'Subscription canceled successfully',
        user: result.user
      });
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      res.status(500).json({ error: error.message || 'Failed to cancel subscription' });
    }
  }
);

/**
 * Get subscription status
 */
paymentRouter.get(
  '/subscription-status', 
  requireAuth, 
  validateRequest(subscriptionStatusQuerySchema),
  async (req: Request, res: Response) => {
    try {
      // Check if subscription is active
      const userId = req.userId!;
      const isActive = await hasActiveSubscription(userId);
      
      res.json({
        active: isActive
      });
    } catch (error: any) {
      console.error('Error checking subscription status:', error);
      res.status(500).json({ error: error.message || 'Failed to check subscription status' });
    }
  }
);

/**
 * Razorpay webhook handler
 * 
 * This endpoint receives event notifications from Razorpay
 * Events include payment success, failure, and other status updates
 */
paymentRouter.post(
  '/webhook', 
  validateRequest(webhookSchema),
  async (req: Request, res: Response) => {
    try {
      // Get the signature from the headers
      const signature = req.headers['x-razorpay-signature'] as string;
      
      // In production, verify the webhook signature
      // This ensures the webhook is genuinely from Razorpay
      if (process.env.NODE_ENV === 'production' && process.env.RAZORPAY_WEBHOOK_SECRET) {
        // For security in production, we would verify the signature
        const crypto = require('crypto');
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        
        // Create an HMAC hex digest of the payload
        // This is the expected signature calculation for Razorpay
        const shasum = crypto.createHmac('sha256', secret);
        shasum.update(JSON.stringify(req.body));
        const digest = shasum.digest('hex');
        
        // Compare the calculated signature with the one provided by Razorpay
        if (digest !== signature) {
          console.error('Invalid webhook signature');
          return res.status(400).json({ error: 'Invalid signature' });
        }
      }
      
      const event = req.body;
      console.log('Received Razorpay webhook:', event.event);
      
      // Handle different event types
      if (event.event === 'payment.captured' || event.event === 'payment.authorized') {
        // Payment succeeded
        const paymentId = event.payload.payment.entity.id;
        const orderId = event.payload.payment.entity.order_id;
        const notes = event.payload.payment.entity.notes || {};
        const userId = notes.userId;
        const planType = notes.planType;
        
        if (userId && planType) {
          console.log(`Activating subscription for user ${userId}, plan ${planType}, payment ${paymentId}`);
          await activateSubscription(parseInt(userId), planType as SubscriptionPlan, paymentId);
          
          // Log this successful payment
          console.log(`Subscription payment processed: User ID ${userId}, Plan: ${planType}, Payment ID: ${paymentId}`);
        } else {
          console.error('Missing user ID or plan type in payment notes', notes);
        }
      } else if (event.event === 'payment.failed') {
        // Payment failed
        const paymentId = event.payload.payment.entity.id;
        const notes = event.payload.payment.entity.notes || {};
        const userId = notes.userId;
        
        if (userId) {
          // We could add code here to update the user's payment status to failed
          console.log(`Payment failed for user ${userId}, payment ${paymentId}`);
          
          // In a complete implementation, we might:
          // 1. Update a payment_attempts table
          // 2. Send an email to the user
          // 3. Show a notification in their dashboard
        }
      }
      
      // Acknowledge webhook receipt to Razorpay
      res.status(200).json({ received: true, status: 'success' });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: error.message || 'Webhook error' });
    }
  }
);