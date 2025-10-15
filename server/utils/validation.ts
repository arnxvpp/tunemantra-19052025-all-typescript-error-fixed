/**
 * Input Validation Utilities for TuneMantra
 * 
 * This module provides consistent input validation functions
 * for use across the application. It leverages Zod for schema
 * validation and provides middleware for Express routes.
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sanitizeObject } from '../middleware/security';

// Type for validation functions
type ValidationFunction = (req: Request, res: Response, next: NextFunction) => void;

/**
 * Create a validation middleware for an Express route
 * 
 * @param schema The Zod schema to validate against
 * @param source Where to find the data to validate ('body', 'query', 'params')
 * @returns Express middleware function
 */
export function validateRequest(schema: z.ZodType<any>, source: 'body' | 'query' | 'params' = 'body'): ValidationFunction {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get the data from the request
      const data = req[source];
      
      // First sanitize the input data to prevent XSS
      const sanitizedData = sanitizeObject(data);
      
      // Validate the sanitized data against the schema
      const validatedData = schema.parse(sanitizedData);
      
      // Replace the original data with the validated and sanitized data
      req[source] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format the validation errors in a user-friendly way
        const validationErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({ 
          error: 'Validation Error', 
          details: validationErrors
        });
      }
      
      // For other types of errors, pass to the global error handler
      next(error);
    }
  };
}

/**
 * Create a validation middleware for file uploads
 * 
 * @param options Configuration options for file validation
 * @returns Express middleware function
 */
export function validateFileUpload(options: {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}): ValidationFunction {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.files && !req.file) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // Handle single file upload
    if (req.file) {
      const file = req.file;
      
      // Check file type
      if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          error: 'Invalid file type', 
          allowedTypes: options.allowedTypes
        });
      }
      
      // Check file size
      if (options.maxSize && file.size > options.maxSize) {
        return res.status(400).json({ 
          error: 'File too large', 
          maxSize: options.maxSize,
          actualSize: file.size
        });
      }
      
      next();
      return;
    }
    
    // Handle multiple file upload
    if (req.files) {
      const files = Array.isArray(req.files) 
        ? req.files 
        : Object.values(req.files).flat();
      
      // Check number of files
      if (options.maxFiles && files.length > options.maxFiles) {
        return res.status(400).json({ 
          error: 'Too many files', 
          maxFiles: options.maxFiles,
          actualFiles: files.length
        });
      }
      
      // Check each file
      for (const file of files) {
        // Check file type
        if (options.allowedTypes && !options.allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({ 
            error: 'Invalid file type', 
            filename: file.originalname,
            mimetype: file.mimetype,
            allowedTypes: options.allowedTypes
          });
        }
        
        // Check file size
        if (options.maxSize && file.size > options.maxSize) {
          return res.status(400).json({ 
            error: 'File too large', 
            filename: file.originalname,
            maxSize: options.maxSize,
            actualSize: file.size
          });
        }
      }
      
      next();
      return;
    }
    
    next();
  };
}

/**
 * Common validation schemas reused throughout the application
 */
export const commonValidationSchemas = {
  // Basic ID validation
  id: z.number().int().positive(),
  
  // Basic pagination parameters
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  }),
  
  // Date range parameters
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  
  // Email validation
  email: z.string().email(),
  
  // Password validation (8+ chars, must include number and special char)
  password: z.string().min(8).regex(/.*[0-9].*/).regex(/.*[!@#$%^&*].*/, 
    'Password must contain at least one special character (!@#$%^&*)')
};