/**
 * Support Ticket Validation Schemas
 * 
 * This module provides validation schemas for support ticket management endpoints.
 * These schemas ensure data integrity and security for support ticket operations.
 */

import { z } from 'zod';

/**
 * Validation schema for creating a new support ticket
 * 
 * Used in POST /api/support/tickets
 */
export const createTicketSchema = z.object({
  subject: z.string().min(3).max(100),
  message: z.string().min(10),
  category: z.enum([
    'account', 
    'billing', 
    'distribution', 
    'royalties', 
    'technical', 
    'other'
  ]),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  attachments: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
});

/**
 * Validation schema for support ticket ID parameter
 * 
 * Used in GET /api/support/tickets/:id
 */
export const ticketIdParamSchema = z.object({
  id: z.string().refine(val => !isNaN(parseInt(val)) && parseInt(val) > 0, {
    message: "Ticket ID must be a positive integer"
  })
});

/**
 * Validation schema for adding a message to a ticket
 * 
 * Used in POST /api/support/tickets/:id/messages
 */
export const addTicketMessageSchema = z.object({
  message: z.string().min(1),
  attachments: z.array(z.string()).optional(),
  isInternal: z.boolean().optional().default(false)
});

/**
 * Validation schema for updating ticket status
 * 
 * Used in PUT /api/support/tickets/:id/status
 */
export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting', 'closed']),
  message: z.string().optional(),
  notifyUser: z.boolean().optional().default(true)
});

/**
 * Validation schema for assigning a ticket
 * 
 * Used in PUT /api/support/tickets/:id/assign
 */
export const assignTicketSchema = z.object({
  adminId: z.number().int().positive(),
  message: z.string().optional(),
  notifyAssignee: z.boolean().optional().default(true)
});

/**
 * Validation schema for ticket filtering
 * 
 * Used in GET /api/support/tickets
 */
export const ticketFilterSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting', 'closed', 'all']).optional().default('all'),
  category: z.enum([
    'account', 
    'billing', 
    'distribution', 
    'royalties', 
    'technical', 
    'other',
    'all'
  ]).optional().default('all'),
  priority: z.enum(['low', 'medium', 'high', 'urgent', 'all']).optional().default('all'),
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  sortBy: z.enum(['created', 'updated', 'priority', 'status']).optional().default('updated'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});