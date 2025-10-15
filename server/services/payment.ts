import { InsertUser, User, userRoleEnum, accountApprovals } from '@shared/schema';
import { db } from '../db';
import { storage } from '../storage';
import { randomBytes, createHmac } from 'crypto';
import { eq } from 'drizzle-orm';

// Razorpay integration
// Note: These would be environment variables in production
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_YourTestKeyId';
const RAZORPAY_SECRET = process.env.RAZORPAY_SECRET || 'YourRazorpaySecretKey';

// User account approval status types
export type ApprovalStatus = 'pending_approval' | 'approved' | 'rejected';

interface RazorpayOrderOptions {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  notes?: Record<string, string>;
}

interface RazorpayPaymentVerificationOptions {
  order_id: string;
  payment_id: string;
  signature: string;
}

// Mock Razorpay class for development without actual Razorpay integration
class Razorpay {
  key_id: string;
  key_secret: string;

  constructor(options: { key_id: string; key_secret: string }) {
    this.key_id = options.key_id;
    this.key_secret = options.key_secret;
  }

  orders = {
    create: async (options: RazorpayOrderOptions): Promise<RazorpayOrder> => {
      return {
        id: `order_${randomBytes(8).toString('hex')}`,
        amount: options.amount,
        currency: options.currency,
        receipt: options.receipt,
        status: 'created',
        notes: options.notes
      };
    },
  };

  // Helper to verify payment signatures
  validatePaymentVerification(options: RazorpayPaymentVerificationOptions): boolean {
    const { order_id, payment_id, signature } = options;
    const text = order_id + '|' + payment_id;
    const generated_signature = createHmac('sha256', this.key_secret)
      .update(text)
      .digest('hex');
    return generated_signature === signature;
  }
}

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_SECRET,
});

/**
 * Create a subscription checkout session
 * @param userId The ID of the user making the subscription
 * @param planType The type of subscription plan
 * @returns Checkout session data
 */
export async function createSubscription(userId: number, planType: SubscriptionPlan) {
  try {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if plan is free
    if (planType === 'free') {
      // Activate free subscription directly
      await activateSubscription(userId, planType as SubscriptionPlan, 'free_subscription');
      return { skipPayment: true, message: 'Free subscription activated' };
    }

    // Get plan price
    const price = getPlanPrice(planType);
    
    // Create order in Razorpay
    const order = await razorpay.orders.create({
      amount: price, // in INR
      currency: 'INR',
      receipt: `sub_${userId}_${new Date().getTime()}`,
      notes: {
        userId: userId.toString(),
        planType: planType as string,
      },
    });

    // Get the application base URL for callbacks
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    
    // Return checkout data with enhanced options
    return {
      order_id: order.id,
      amount: price / 100, // Convert paise to rupees for display
      currency: 'INR',
      key: razorpay.key_id,
      name: user.username || 'User',
      email: user.email || '',
      contact: user.phoneNumber || '',
      // Include checkout callback URLs
      callback_url: `${baseUrl}/api/payment/verify-payment`,
      redirect: true, // Enable redirect after payment
      modal: {
        confirm_close: true, // Ask for confirmation before closing payment modal
        escape: false, // Prevent closing payment modal with ESC key
        animation: true // Enable payment modal animations
      },
      send_sms_hash: true, // For improved mobile UX with automatic OTP reading
      remember_customer: true, // Remember customer details for future payments
      notes: {
        userId: userId.toString(),
        planType: planType as string,
        accountType: 'music_distribution',
        orderedAt: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw new Error('Failed to create subscription checkout');
  }
}

/**
 * Verify a payment is valid
 * @param razorpayOrderId The Razorpay order ID
 * @param razorpayPaymentId The Razorpay payment ID
 * @param signature The signature from Razorpay
 */
export function verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, signature: string) {
  try {
    const isValid = razorpay.validatePaymentVerification({
      order_id: razorpayOrderId,
      payment_id: razorpayPaymentId,
      signature: signature,
    });

    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    return { success: true };
  } catch (error) {
    console.error('Payment verification error:', error);
    throw new Error('Payment verification failed');
  }
}

type SubscriptionType = 'label' | 'artist_manager' | 'artist' | 'free';
type SubscriptionStatus = 'active' | 'pending' | 'pending_approval' | 'canceled' | 'expired' | 'inactive' | 'rejected';
export type SubscriptionPlan = 'label' | 'artist_manager' | 'artist' | 'free';

interface SubscriptionInfo {
  plan: SubscriptionPlan;
  startDate: Date;
  endDate: Date;
  status: SubscriptionStatus;
  paymentId?: string;
  features?: string[];
  yearlyPriceInINR?: number;
}

/**
 * Process a subscription after payment, setting it to pending for admin approval
 * @param userId The user ID
 * @param planType The subscription plan type
 * @param paymentId The payment ID
 */
export async function activateSubscription(userId: number, planType: SubscriptionPlan, paymentId: string) {
  try {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate subscription dates
    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

    // Get the appropriate role based on plan
    const role = mapPlanToRole(planType);
    
    // Get default permissions for this role
    const defaultPermissions = getDefaultPermissions(role);
    
    // For free accounts, set status to active immediately
    // For paid accounts, set to pending_approval until admin approval
    const subscriptionStatus: SubscriptionStatus = planType === 'free' ? 'active' : 'pending_approval';
    
    // Prepare subscription info
    const subscriptionInfo: SubscriptionInfo = {
      plan: planType,
      startDate: now,
      endDate: endDate,
      status: subscriptionStatus,
      paymentId,
    };
    
    // Update user status to "pending_approval" for paid accounts
    const userStatus = planType === 'free' ? 'active' : 'pending_approval';
    
    // Update user with subscription info and permissions
    // Permissions will only be effective after admin approval
    const updatedUser = await storage.updateUser(userId, {
      role: role,
      status: userStatus,
      permissions: defaultPermissions,
      subscriptionInfo: subscriptionInfo
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Error processing subscription payment:', error);
    throw new Error('Failed to process subscription payment');
  }
}

/**
 * Maps a plan type to a user role
 * @param planType The subscription plan type
 * @returns The corresponding user role
 */
function mapPlanToRole(planType: SubscriptionPlan): "admin" | "label" | "artist_manager" | "artist" | "team_member" {
  switch (planType) {
    case 'label':
      return 'label';
    case 'artist_manager':
      return 'artist_manager';
    case 'artist':
    case 'free':
      return 'artist';
    default:
      return 'artist'; // Default to artist role
  }
}

/**
 * Get the price of a subscription plan in INR
 * @param planType The type of plan
 * @returns The price in INR
 */
function getPlanPrice(planType: SubscriptionPlan): number {
  // Prices in INR (paise)
  switch (planType) {
    case 'label':
      return 600000; // ₹6000
    case 'artist_manager':
      return 249900; // ₹2499
    case 'artist':
      return 99900; // ₹999
    case 'free':
    default:
      return 0;
  }
}

/**
 * Cancel a subscription
 * @param userId The user ID
 */
export async function cancelSubscription(userId: number) {
  try {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentSubscription = user.subscriptionInfo || {};
    
    // Update user with subscription canceled status
    const updatedSubscriptionInfo: SubscriptionInfo = {
      plan: typeof currentSubscription === 'object' && 'plan' in currentSubscription 
        ? (currentSubscription.plan as SubscriptionPlan) 
        : 'free',
      startDate: typeof currentSubscription === 'object' && 'startDate' in currentSubscription 
        ? new Date(currentSubscription.startDate as Date) 
        : new Date(),
      endDate: typeof currentSubscription === 'object' && 'endDate' in currentSubscription 
        ? new Date(currentSubscription.endDate as Date) 
        : new Date(),
      status: 'canceled',
      paymentId: typeof currentSubscription === 'object' && 'paymentId' in currentSubscription 
        ? currentSubscription.paymentId as string 
        : undefined
    };
    
    const updatedUser = await storage.updateUser(userId, {
      subscriptionInfo: updatedSubscriptionInfo
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw new Error('Failed to cancel subscription');
  }
}

/**
 * Check if a user has an active subscription
 * @param userId The user ID
 * @returns Whether the subscription is active
 */
export async function hasActiveSubscription(userId: number): Promise<boolean> {
  try {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user || !user.subscriptionInfo) {
      return false;
    }

    const subscriptionInfo = user.subscriptionInfo;
    
    // Check if subscription is active and not expired
    const status = typeof subscriptionInfo === 'object' && 'status' in subscriptionInfo 
      ? subscriptionInfo.status as SubscriptionStatus 
      : 'expired';
      
    const endDate = typeof subscriptionInfo === 'object' && 'endDate' in subscriptionInfo 
      ? new Date(subscriptionInfo.endDate as Date) 
      : null;
    
    if (status !== 'active' || !endDate) {
      return false;
    }

    // Check if subscription has expired
    const now = new Date();
    return endDate > now;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

import { getDefaultPermissions } from '../utils/permissions-helper';

/**
 * Create a new user with subscription data during registration
 * @param userData The user data
 * @param subscriptionData The subscription data
 */
export async function createUserWithSubscription(
  userData: InsertUser,
  subscriptionData: {
    plan: SubscriptionPlan;
    startDate: Date;
    endDate: Date;
  }
): Promise<User> {
  try {
    // Get the appropriate role based on plan
    const role = mapPlanToRole(subscriptionData.plan);
    
    // Get default permissions for this role
    const defaultPermissions = getDefaultPermissions(role);
    
    // For free accounts, set status to active immediately
    // For paid accounts, set to pending_approval until admin approval
    const subscriptionStatus: SubscriptionStatus = subscriptionData.plan === 'free' ? 'active' : 'pending_approval';
    
    // Prepare subscription info
    const subscriptionInfo: SubscriptionInfo = {
      plan: subscriptionData.plan,
      startDate: subscriptionData.startDate,
      endDate: subscriptionData.endDate,
      status: subscriptionStatus,
    };
    
    // Update user status to "pending_approval" for paid accounts
    const userStatus = subscriptionData.plan === 'free' ? 'active' : 'pending_approval';
    
    // Create user with subscription info and proper permissions
    const user = await storage.createUser({
      ...userData,
      role: role,
      status: userStatus,
      permissions: defaultPermissions,
      subscriptionInfo: subscriptionInfo
    });

    return user;
  } catch (error) {
    console.error('Error creating user with subscription:', error);
    throw new Error('Failed to create user with subscription');
  }
}

/**
 * Admin function to approve or reject a user account after payment
 * @param userId The user ID to approve or reject
 * @param status The approval status (approved or rejected)
 * @param adminUserId The admin user ID performing the action
 * @param notes Optional notes about the approval/rejection
 */
export async function updateAccountApprovalStatus(
  userId: number, 
  status: 'approved' | 'rejected',
  adminUserId: number,
  notes?: string
) {
  try {
    // Get the user
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is in pending_approval state
    if (user.status !== 'pending_approval') {
      throw new Error('User is not in pending approval state');
    }

    const subscriptionInfo = user.subscriptionInfo || {};
    
    // Update subscription status based on approval status
    const updatedSubscriptionStatus: SubscriptionStatus = 
      status === 'approved' ? 'active' : 'inactive';
    
    // Prepare updated subscription info
    const updatedSubscriptionInfo: SubscriptionInfo = {
      plan: typeof subscriptionInfo === 'object' && 'plan' in subscriptionInfo 
        ? (subscriptionInfo.plan as SubscriptionPlan) 
        : 'free',
      startDate: typeof subscriptionInfo === 'object' && 'startDate' in subscriptionInfo 
        ? new Date(subscriptionInfo.startDate as Date) 
        : new Date(),
      endDate: typeof subscriptionInfo === 'object' && 'endDate' in subscriptionInfo 
        ? new Date(subscriptionInfo.endDate as Date) 
        : new Date(),
      status: updatedSubscriptionStatus,
      paymentId: typeof subscriptionInfo === 'object' && 'paymentId' in subscriptionInfo 
        ? subscriptionInfo.paymentId as string 
        : undefined
    };
    
    // Update user account status
    const userStatus = status === 'approved' ? 'active' : 'rejected';
    
    // Update user with new status and subscription info
    const updatedUser = await storage.updateUser(userId, {
      status: userStatus,
      subscriptionInfo: updatedSubscriptionInfo
    });
    
    // Create or update approval details in separate table
    try {
      // Check if an approval record already exists
      const existingApproval = await db.query.accountApprovals.findFirst({
        where: (approval, { eq }) => eq(approval.userId, userId)
      });
      
      if (existingApproval) {
        // Update existing approval record
        await db.update(accountApprovals)
          .set({
            approvedById: adminUserId,
            approvalDate: new Date(),
            status: status === 'approved' ? 'approved' : 'rejected',
            notes: notes || 'No notes provided',
            updatedAt: new Date()
          })
          .where(eq(accountApprovals.userId, userId));
      } else {
        // Create new approval record
        await db.insert(accountApprovals).values({
          userId: userId,
          approvedById: adminUserId,
          approvalDate: new Date(),
          status: status === 'approved' ? 'approved' : 'rejected',
          notes: notes || 'No notes provided'
        });
      }
    } catch (error) {
      console.error('Error updating approval details:', error);
      // Continue since we've already updated the user record
    }

    // Audit this admin action
    // This would typically log the action to a separate table
    console.log(`User ${userId} ${status} by admin ${adminUserId} with notes: ${notes || 'N/A'}`);

    return { 
      success: true, 
      user: updatedUser, 
      message: `User account has been ${status}` 
    };
  } catch (error) {
    console.error(`Error ${status} user account:`, error);
    throw new Error(`Failed to ${status} user account`);
  }
}