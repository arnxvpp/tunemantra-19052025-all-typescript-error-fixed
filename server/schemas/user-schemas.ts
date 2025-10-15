/**
 * User Management Validation Schemas
 * 
 * This module provides validation schemas for user-related endpoints.
 * These schemas ensure data integrity and security for user management operations.
 */

import { z } from 'zod';

/**
 * Validation schema for user registration
 * 
 * Used in POST /api/register
 */
export const registerUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  email: z.string().email(),
  fullName: z.string().min(1).max(100),
  entityName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().optional(),
  role: z.enum(['artist', 'label', 'distributor']),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  }),
  timezone: z.string().optional(),
  marketingConsent: z.boolean().optional(),
  referralCode: z.string().optional()
});

/**
 * Validation schema for user login
 * 
 * Used in POST /api/login
 */
export const loginUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  rememberMe: z.boolean().optional()
});

/**
 * Validation schema for updating user profile
 * 
 * Used in PUT /api/users/profile
 */
export const updateProfileSchema = z.object({
  fullName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  entityName: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  socialLinks: z.record(z.string().url()).optional(),
  notificationPreferences: z.record(z.boolean()).optional(),
  displaySettings: z.record(z.any()).optional(),
  timezone: z.string().optional()
});

/**
 * Validation schema for changing password
 * 
 * Used in PUT /api/users/password
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8)
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

/**
 * Validation schema for requesting password reset
 * 
 * Used in POST /api/users/forgot-password
 */
export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

/**
 * Validation schema for resetting password
 * 
 * Used in POST /api/users/reset-password
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8)
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

/**
 * Validation schema for updating user status
 * 
 * Used in PUT /api/admin/users/:id/status
 */
export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'pending', 'suspended', 'deleted']),
  reason: z.string().optional(),
  notifyUser: z.boolean().optional().default(true)
});

/**
 * Validation schema for user filtering
 * 
 * Used in GET /api/admin/users
 */
export const userFilterSchema = z.object({
  status: z.enum(['active', 'pending', 'suspended', 'deleted', 'all']).optional().default('all'),
  role: z.enum(['artist', 'label', 'distributor', 'admin', 'all']).optional().default('all'),
  search: z.string().optional(),
  sort: z.enum(['created', 'username', 'role', 'status']).optional().default('created'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  approvalDate: z.object({
    start: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: "Start date must be a valid date string"
    }),
    end: z.string().refine(val => !isNaN(Date.parse(val)), {
      message: "End date must be a valid date string"
    })
  }).optional()
});

/**
 * Validation schema for updating tax information
 * 
 * Used in PUT /api/users/tax-info
 */
export const updateTaxInfoSchema = z.object({
  taxId: z.string().optional(),
  taxType: z.enum(['individual', 'business']).optional(),
  country: z.string().min(2).max(2).optional(),
  taxWithholding: z.number().min(0).max(100).optional(),
  legalName: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().min(2).max(2).optional()
  }).optional(),
  hasTaxExemption: z.boolean().optional(),
  exemptionDetails: z.string().optional(),
  taxDocuments: z.array(z.string().url()).optional()
});

/**
 * Validation schema for user ID parameter
 * 
 * Used in various endpoints with :userId parameter
 */
export const userIdParamSchema = z.object({
  userId: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "User ID must be a positive integer"
  })
});