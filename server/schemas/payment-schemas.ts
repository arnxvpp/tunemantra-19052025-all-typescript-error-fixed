/**
 * Payment Validation Schemas
 * 
 * This module provides validation schemas for payment-related endpoints.
 * These schemas ensure data integrity and security for payment operations.
 */

import { z } from 'zod';

/**
 * Validation schema for verifying payment
 * 
 * Used in POST /api/payments/verify
 */
export const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1),
  amount: z.string().or(z.number().positive()),
  paymentProvider: z.enum(['stripe', 'razorpay', 'paypal']),
  providerPaymentId: z.string().min(1),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for payment provider webhooks
 * 
 * Used in POST /api/webhooks/payment/:provider
 */
export const webhookSchema = z.object({
  provider: z.enum(['stripe', 'razorpay', 'paypal']),
  event: z.string().min(1),
  payload: z.record(z.any()),
  signature: z.string().optional()
});

/**
 * Validation schema for creating a subscription
 * 
 * Used in POST /api/subscriptions
 */
export const createSubscriptionSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(['monthly', 'quarterly', 'annual']),
  paymentMethodId: z.number().int().positive(),
  autoRenew: z.boolean().optional().default(true),
  promoCode: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
});

/**
 * Validation schema for querying subscription status
 * 
 * Used in GET /api/subscriptions/status
 */
export const subscriptionStatusQuerySchema = z.object({
  includeDetails: z.boolean().optional().default(false),
  includeInvoices: z.boolean().optional().default(false),
  includePlanDetails: z.boolean().optional().default(true)
});

/**
 * Validation schema for cancelling a subscription
 * 
 * Used in POST /api/subscriptions/cancel
 */
export const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1),
  reason: z.enum(['cost', 'features', 'service', 'competitor', 'temporary', 'other']).optional(),
  feedback: z.string().optional(),
  cancelImmediately: z.boolean().optional().default(false)
});

/**
 * Validation schema for creating a new payment method
 * 
 * Used in POST /api/payment-methods
 */
export const createPaymentMethodSchema = z.object({
  type: z.enum(['bank_account', 'paypal', 'stripe', 'razorpay', 'wise']),
  name: z.string().min(1).max(100),
  isDefault: z.boolean().optional().default(false),
  details: z.object({
    // Common fields
    currency: z.string().min(3).max(3),
    country: z.string().min(2).max(2),
    
    // Bank account specific fields
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    swiftCode: z.string().optional(),
    ibanNumber: z.string().optional(),
    bankName: z.string().optional(),
    accountHolderName: z.string().optional(),
    accountType: z.enum(['checking', 'savings']).optional(),
    
    // PayPal specific fields
    email: z.string().email().optional(),
    
    // Stripe specific fields
    stripeConnectedAccountId: z.string().optional(),
    
    // Razorpay specific fields
    razorpayContactId: z.string().optional(),
    
    // Wise specific fields
    wiseProfileId: z.string().optional(),
    wiseRecipientId: z.string().optional()
  }),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for updating a payment method
 * 
 * Used in PUT /api/payment-methods/:id
 */
export const updatePaymentMethodSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
  details: z.object({
    // Common fields
    currency: z.string().min(3).max(3).optional(),
    country: z.string().min(2).max(2).optional(),
    
    // Bank account specific fields
    accountNumber: z.string().optional(),
    routingNumber: z.string().optional(),
    swiftCode: z.string().optional(),
    ibanNumber: z.string().optional(),
    bankName: z.string().optional(),
    accountHolderName: z.string().optional(),
    accountType: z.enum(['checking', 'savings']).optional(),
    
    // PayPal specific fields
    email: z.string().email().optional(),
    
    // Stripe specific fields
    stripeConnectedAccountId: z.string().optional(),
    
    // Razorpay specific fields
    razorpayContactId: z.string().optional(),
    
    // Wise specific fields
    wiseProfileId: z.string().optional(),
    wiseRecipientId: z.string().optional()
  }).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for creating a withdrawal request
 * 
 * Used in POST /api/withdrawals
 */
export const createWithdrawalSchema = z.object({
  amount: z.string().or(z.number().positive()),
  paymentMethodId: z.number().int().positive(),
  currency: z.string().min(3).max(3),
  notes: z.string().optional()
});

/**
 * Validation schema for updating a withdrawal request
 * 
 * Used in PUT /api/withdrawals/:id (admin only)
 */
export const updateWithdrawalSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']),
  processingDetails: z.object({
    transactionId: z.string().optional(),
    processedAmount: z.string().or(z.number().positive()).optional(),
    processingFee: z.string().or(z.number().min(0)).optional(),
    processorName: z.string().optional(),
    estimatedArrivalDate: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: "Estimated arrival date must be a valid date string"
    }).optional()
  }).optional(),
  adminNotes: z.string().optional()
});

/**
 * Validation schema for filtering withdrawals
 * 
 * Used in GET /api/withdrawals and GET /api/admin/withdrawals
 */
export const withdrawalFilterSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'all']).optional().default('all'),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  minAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  paymentMethodId: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  sortBy: z.enum(['amount', 'created', 'updated', 'status']).optional().default('created'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  userId: z.string().optional().transform(val => val ? parseInt(val) : undefined) // Admin only
});

/**
 * Validation schema for revenue share creation
 * 
 * Used in POST /api/revenue-shares
 */
export const createRevenueShareSchema = z.object({
  releaseId: z.number().int().positive(),
  recipientId: z.number().int().positive(),
  percentage: z.number().min(0.01).max(100),
  shareType: z.enum(['artist', 'producer', 'writer', 'label', 'distributor', 'other']),
  notes: z.string().optional(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional()
});

/**
 * Validation schema for updating revenue shares
 * 
 * Used in PUT /api/revenue-shares/:id
 */
export const updateRevenueShareSchema = z.object({
  percentage: z.number().min(0.01).max(100).optional(),
  shareType: z.enum(['artist', 'producer', 'writer', 'label', 'distributor', 'other']).optional(),
  notes: z.string().optional(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }).optional(),
  isActive: z.boolean().optional()
});

/**
 * Validation schema for creating a revenue split
 * 
 * Used in POST /api/revenue-splits
 */
export const createRevenueSplitSchema = z.object({
  trackId: z.number().int().positive(),
  participants: z.array(
    z.object({
      userId: z.number().int().positive(),
      role: z.enum(['primary_artist', 'featured_artist', 'producer', 'songwriter', 'label', 'publisher', 'other']),
      percentage: z.number().min(0.01).max(100),
      notes: z.string().optional()
    })
  ),
  effectiveDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Effective date must be a valid date string"
  }).optional()
}).refine(data => {
  // Validate that percentages add up to 100%
  const total = data.participants.reduce((sum, p) => sum + p.percentage, 0);
  return Math.abs(total - 100) < 0.01; // Allow a small margin of error for floating point
}, {
  message: "Percentages must add up to 100%",
  path: ["participants"]
});

/**
 * Validation schema for updating a revenue split
 * 
 * Used in PUT /api/revenue-splits/:id
 */
export const updateRevenueSplitSchema = z.object({
  participants: z.array(
    z.object({
      userId: z.number().int().positive(),
      role: z.enum(['primary_artist', 'featured_artist', 'producer', 'songwriter', 'label', 'publisher', 'other']),
      percentage: z.number().min(0.01).max(100),
      notes: z.string().optional()
    })
  ).optional(),
  effectiveDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Effective date must be a valid date string"
  }).optional(),
  isActive: z.boolean().optional()
}).refine(data => {
  // Validate that percentages add up to 100% if participants are provided
  if (data.participants) {
    const total = data.participants.reduce((sum, p) => sum + p.percentage, 0);
    return Math.abs(total - 100) < 0.01; // Allow a small margin of error for floating point
  }
  return true;
}, {
  message: "Percentages must add up to 100%",
  path: ["participants"]
});

/**
 * Validation schema for payment method ID parameter
 * 
 * Used in various endpoints with :paymentMethodId parameter
 */
export const paymentMethodIdParamSchema = z.object({
  paymentMethodId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Payment method ID must be a positive integer"
  })
});

/**
 * Validation schema for withdrawal ID parameter
 * 
 * Used in various endpoints with :withdrawalId parameter
 */
export const withdrawalIdParamSchema = z.object({
  withdrawalId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Withdrawal ID must be a positive integer"
  })
});

/**
 * Validation schema for revenue share ID parameter
 * 
 * Used in various endpoints with :revenueShareId parameter
 */
export const revenueShareIdParamSchema = z.object({
  revenueShareId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Revenue share ID must be a positive integer"
  })
});

/**
 * Validation schema for revenue split ID parameter
 * 
 * Used in various endpoints with :revenueSplitId parameter
 */
export const revenueSplitIdParamSchema = z.object({
  revenueSplitId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Revenue split ID must be a positive integer"
  })
});