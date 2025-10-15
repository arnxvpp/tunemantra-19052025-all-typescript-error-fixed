/**
 * Comprehensive Security Middleware for TuneMantra
 * 
 * This module provides protection against multiple security threats:
 * - XSS (Cross-Site Scripting)
 * - CSRF (Cross-Site Request Forgery)
 * - SQL Injection (additional layer beyond Drizzle)
 * - Security Headers
 * - Rate Limiting
 * - Input Validation
 */

import { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import xss from 'xss';
import crypto from 'crypto';

// Generate CSRF tokens
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Sanitize object recursively for XSS
function sanitizeObject(obj: any): any {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return xss(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
    return sanitized;
  }
  
  return obj;
}

// Setup all security middleware
export function setupSecurityMiddleware(app: Express): void {
  // 1. Security Headers using Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"], // Allow Razorpay script
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", "https://api.razorpay.com"] // Allow self and Razorpay API iframe
      }
    },
    xssFilter: true,
    noSniff: true
  }));
  
  // 2. CSRF Protection
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip for GET, HEAD, OPTIONS requests (they should be safe)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Skip for API endpoints that use tokens for auth
    if (req.path.startsWith('/api/external/') || req.path === '/api/login' || req.path === '/api/register') {
      return next();
    }
    
    if (!req.session) {
      console.error('Session middleware is not properly configured');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    
    const token = req.headers['x-csrf-token'] || req.body?._csrf;
    
    // Check if token exists in session
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCSRFToken();
    }
    
    // Validate token
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).json({ error: 'Invalid or missing CSRF token' });
    }
    
    // Token is valid
    next();
  });
  
  // 3. XSS Protection Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Sanitize request body, query and params
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    if (req.params) {
      req.params = sanitizeObject(req.params);
    }
    
    // Override res.json to sanitize responses
    const originalJson = res.json;
    res.json = function(body) {
      return originalJson.call(this, sanitizeObject(body));
    };
    
    next();
  });
  
  // 4. Rate Limiting
  // Login rate limiting
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' }
  });
  app.use('/api/login', loginLimiter);
  
  // Registration rate limiting
  const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    // Allow many more registrations in development
    max: process.env.NODE_ENV === 'development' ? 100 : 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many accounts created. Please try again later.' }
  });
  app.use('/api/register', registrationLimiter);
  
  // General API rate limiting
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/', apiLimiter);
  
  // 5. CSRF Token Provider Endpoint
  app.get('/api/csrf-token', (req: Request, res: Response) => {
    if (!req.session) {
      return res.status(500).json({ error: 'Session not configured' });
    }
    
    // Generate a new token if one doesn't exist
    if (!req.session.csrfToken) {
      req.session.csrfToken = generateCSRFToken();
    }
    
    res.json({ csrfToken: req.session.csrfToken });
  });
  
  console.log('Security middleware configured successfully');
}

// Export sanitization utility for use in other parts of the app
export { sanitizeObject };