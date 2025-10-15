/**
 * Authentication Validation Schemas
 * 
 * This file defines Zod validation schemas for authentication-related
 * requests, including user registration and login.
 */

import { z } from 'zod';
import { commonValidationSchemas } from '../utils/validation';

/**
 * User Registration Schema
 * 
 * Validates user registration data with requirements for:
 * - Username: 3-20 alphanumeric characters
 * - Password: At least 8 characters with at least one number and special character
 * - Email: Valid email format
 * - Other fields have appropriate validation
 */
export const registerUserSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 
    'Username must contain only letters, numbers, and underscores'),
  password: commonValidationSchemas.password,
  email: commonValidationSchemas.email,
  fullName: z.string().min(1).max(100).optional(),
  phoneNumber: z.string().regex(/^\+?[0-9]{10,15}$/, 'Invalid phone number format').optional(),
  entityName: z.string().max(100).optional(),
  // Allow roles selectable during registration
  role: z.enum(['artist', 'label', 'artist_manager']).default('artist'),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions'
  })
});

/**
 * User Login Schema
 * 
 * Validates login credentials with:
 * - Username: Required string
 * - Password: Required string (full validation happens after login)
 */
export const loginUserSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

/**
 * Password Reset Request Schema
 */
export const passwordResetRequestSchema = z.object({
  email: commonValidationSchemas.email
});

/**
 * Password Reset Confirmation Schema
 */
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: commonValidationSchemas.password,
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

/**
 * Password Change Schema
 */
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: commonValidationSchemas.password,
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});