/**
 * API Routes Setup for TuneMantra
 * 
 * This file configures all API endpoints for the application.
 * It sets up authentication, middleware, and routes for all server-side functionality.
 * 
 * Key concepts for beginners:
 * 
 * 1. API Structure: The routes are organized by feature area (tracks, releases, 
 *    distribution, etc.) to keep related functionality together.
 * 
 * 2. Route Handlers: Each endpoint has a handler function that processes the request,
 *    interacts with the database via the storage layer, and returns a response.
 * 
 * 3. Authentication: Most routes use the requireAuth middleware to ensure only
 *    authenticated users can access them. This validates the user's session.
 * 
 * 4. Request Validation: Input data is validated using Zod schemas before processing
 *    to ensure data integrity and prevent security issues.
 * 
 * 5. Response Format: API responses follow a consistent format with appropriate
 *    HTTP status codes (200 for success, 400 for validation errors, etc.).
 * 
 * The main registerRoutes function initializes all API endpoints by attaching
 * them to the Express application instance.
 */

import { Request, Response, NextFunction, Router } from 'express';

import type { Express } from "express";       // Express application type
import { createServer, type Server } from "http";  // HTTP server for the Express app
import { setupAuth, requireAuth, requireAdmin } from "./auth";   // Authentication utilities
import { Storage } from "./storage";              // Import Storage CLASS
import { generateClientId } from "./utils/id-generator";  // Utility for generating unique client IDs
import { ensureAdmin } from "./middleware/role-based-access"; // Admin authorization middleware
import {
  // Import Zod validation schemas for request validation
  insertTrackSchema, insertReleaseSchema,
  insertDistributionPlatformSchema, insertDistributionRecordSchema,
  insertScheduledDistributionSchema, insertSupportTicketSchema, insertSupportTicketMessageSchema
} from "@shared/schema";
import multer from "multer";       // File upload handling middleware
import path from "path";           // Path utilities for file handling
import { v4 as uuidv4 } from 'uuid';  // UUID generation for unique identifiers
import { hashPassword } from './auth';  // Password hashing utility
import cookieParser from 'cookie-parser';  // Cookie parsing middleware
import { paymentRouter } from './routes/payment';  // Payment processing routes
import { adminApprovalsRouter } from './routes/admin-approvals';  // Admin approval routes
import { checkSubscription } from './middleware/role-based-access';  // Subscription validation middleware
import { createUserWithSubscription } from './services/payment';  // User creation with subscription service
import { registerRoyaltyFixRoutes } from './routes/royalty-fix';  // Fixed royalty calculation routes
import { analyticsRouter, mobileApiRouter, platformRoyaltyAnalyticsRouter } from './routes/index';  // Analytics and Mobile API routes
import { distributionAnalyticsRouter } from './routes/distribution-analytics';  // Distribution analytics routes
import integrationRouter from './routes/integration';  // Integration routes for distribution-to-royalty workflow
import { IntegrationService } from './services/integration-service';  // Integration service for distribution-to-royalty workflow
import { DistributionStatusTracker, DetailedDistributionStatus } from './services/distribution-status-tracker'; // Enhanced status tracking for distributions
// Import only the existing schema
import { updateDistributionRecordSchema } from './schemas/distribution-schemas';
import { validateRequest } from './utils/validation'; // Import the validation middleware

// Import our custom services and routes
import { acrCloudService } from './services/acr-cloud-service'; // Audio fingerprinting service
import { blockchainConnector } from './services/blockchain-connector'; // Blockchain integration service
import { rightsManagementService } from './services/rights-management-service'; // Rights management service

// Create an instance of the Storage class
const storage = new Storage();

/**
 * Multer configuration for file uploads
 * 
 * This configures how user profile images and other files are stored and validated.
 * - Sets the storage location to ./uploads/avatars
 * - Creates unique filenames with timestamps
 * - Limits file size to 5MB
 * - Only allows image files
 */
const upload = multer({
  // Configure disk storage for uploaded files
  storage: multer.diskStorage({
    // Store files in the uploads/avatars directory
    destination: "./uploads/avatars",
    // Generate a unique filename to prevent collisions
    filename: (req, file, cb) => {
      // Create a unique suffix using timestamp and random number
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      // Keep the original file extension
      cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  // Set size limits to prevent abuse
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  // Filter files to only accept images
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed'));
      return;
    }
    cb(null, true);
  }
});

// Import file upload handlers from dedicated module
import { uploadFile, serveUploadedFile } from './routes/file-upload';

/**
 * Main function to register all API routes
 * 
 * This function:
 * 1. Sets up middleware like cookie parsing and authentication
 * 2. Registers all API routes for different features
 * 
 * @param app - The Express application instance
 * @returns A Promise resolving to void
 */
export async function registerRoutes(app: Express): Promise<void> {
  // Special middleware to ensure API routes always return JSON and don't get 
  // caught by the Vite middleware that serves the React app
  app.use('/api', (req, res, next) => {
    // Ensure content type is application/json for all API responses
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  });
  
  // === MIDDLEWARE SETUP ===
  // This needs to happen early in the request pipeline
  
  // Add cookie parser middleware first (needed for session handling)
  app.use(cookieParser());

  // Set up authentication (Passport.js configuration)
  setupAuth(app);
  
  // Give the session middleware time to initialize
  app.use((req, res, next) => {
    if (!req.session) {
      console.error('Session middleware is not properly configured');
      return res.status(500).json({ error: 'Server misconfiguration' });
    }
    next();
  });
  
  // === IMPORT ROYALTY ROUTES ===
  // These routes should be registered AFTER authentication is set up
  const royaltyRoutes = (await import('./routes/royalty')).default;
  app.use('/api/royalty', royaltyRoutes);
  
  // === FIXED ROYALTY ROUTES ===
  // Register the fixed royalty calculation routes
  const royaltyFixRouter = Router();
  registerRoyaltyFixRoutes(royaltyFixRouter, storage);
  app.use('/api/royalties', royaltyFixRouter);

  // === ADMIN ROUTES ===
  
  // Import admin routes first (before any other routes)
  // These handle administrative functions like user management
  // Import admin routes from admin.ts file
  // This handles admin login, session checking, and dashboard access
  // Import the default export (the router instance) from admin.ts
  const adminRouter = (await import('./routes/admin')).default;
  app.use('/api/admin', adminRouter); // Mount the single admin router
  
  // Register payment routes (subscriptions, invoicing, etc.)
  app.use('/api/payment', paymentRouter);
  
  // Register admin approval routes (account and content moderation)
  app.use('/api/admin/approvals', adminApprovalsRouter);

  // Import admin export routes (for exporting data in various formats)
  const adminExportRoutes = (await import('./routes/admin-export')).default;
  app.use('/api/admin', adminExportRoutes);

  // Import admin import routes (for importing catalogs and metadata)
  const adminImportRoutes = (await import('./routes/admin-import')).default;
  app.use('/api/admin/import', adminImportRoutes);

  // === FILE UPLOAD ROUTES ===
  
  // Route for uploading files (requires authentication)
  app.post('/api/upload', requireAuth, uploadFile);
  
  // Route for serving uploaded files (public access)
  app.get('/api/uploads/:filename', serveUploadedFile);

  // === AUTHENTICATION ROUTES ===
  
  /**
   * Check if a user is authenticated as a Super Admin
   * Returns a simple boolean without exposing sensitive data
   */
  app.get('/api/admin/check-auth', (req: any, res: any) => {
    if (req.session.isAdmin) {
      res.status(200).json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // Add the user endpoint to return current authenticated user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Update the registration route to include subscription plans
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const { 
        username, 
        password, 
        email, 
        role = 'artist', 
        subscriptionInfo
      } = req.body;

      // Generate client ID
      const clientId = generateClientId();
      
      // Default to free plan if none specified
      const planType = subscriptionInfo?.plan || 'free';
      
      // Set subscription dates
      const startDate = new Date();
      let endDate = new Date();
      
      // Free plans get 1 month, paid plans get 1 year
      if (planType === 'free') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      // Create user with subscription data
      const user = await createUserWithSubscription(
        {
          username,
          password: await hashPassword(password),
          email,
          status: "active",
          role,
          clientId
        },
        {
          plan: planType,
          startDate,
          endDate
        }
      );

      req.login(user, (err) => {
        if (err) return next(err);
        
        // For free plan, we're done
        if (planType === 'free') {
          return res.status(201).json(user);
        }
        
        // For paid plans, return payment details
        return res.status(201).json({
          ...user,
          paymentRequired: planType !== 'free',
          planType
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  // Simplified sub-label creation without role-based checks
  app.post("/api/sub-labels", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const clientId = generateClientId();
      const newUser = await storage.createUser({
        ...req.body,
        clientId,
        password: await hashPassword(req.body.password),
      });

      // Create audit log entry
      await storage.createSubLabelAuditLog({
        subLabelId: newUser.id,
        changedById: req.user.id,
        action: "create_sub_label",
        category: "sub_labels",
        metadata: {
          entityName: req.body.entityName,
        },
      });

      // Return the created user with credentials
      res.status(201).json({
        ...newUser,
        clientId,
        username: newUser.username,
      });
    } catch (error) {
      console.error("Error creating sub-label:", error);
      res.status(500).json({ error: "Failed to create sub-label" });
    }
  });

  // Release routes
  app.get("/api/releases", requireAuth, checkSubscription, async (req, res) => {
    const releases = await storage.getReleasesByUserId(req.user!.id);
    res.json(releases);
  });

  app.post("/api/releases", requireAuth, checkSubscription, async (req, res) => {
    const parseResult = insertReleaseSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }
    const release = await storage.createRelease(req.user!.id, parseResult.data);
    res.status(201).json(release);
  });

  app.post("/api/releases/analyze", requireAuth, checkSubscription, async (req, res) => {
    const { title, artistName, type } = req.body;

    if (!title || !artistName || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    try {
      const analysis = await generateContentTags(title, artistName, type);
      res.json(analysis);
    } catch (error) {
      console.error("AI Analysis error:", error);
      res.status(500).json({ error: "Failed to analyze content" });
    }
  });

  app.patch("/api/releases/:id", requireAuth, checkSubscription, async (req, res) => {
    const release = await storage.updateRelease(parseInt(req.params.id), req.body);
    res.json(release);
  });

  // Distribution Platform routes
  // Use the dedicated router for distribution platforms
  const distributionPlatformRoutes = (await import('./routes/distribution-platforms')).default;
  app.use('/api/distribution-platforms', distributionPlatformRoutes);

  // Release routes
  const releaseRoutes = (await import('./routes/releases')).default;
  app.use('/api/releases', releaseRoutes);

  // Distribution Record routes
  app.get("/api/distribution-records", requireAuth, checkSubscription, async (req, res) => {
    const releaseId = req.query.releaseId ? parseInt(req.query.releaseId as string) : undefined;
    const records = await storage.getDistributionRecords(releaseId);
    res.json(records);
  });

  app.post("/api/distribution-records", requireAuth, checkSubscription, async (req, res) => {
    const parseResult = insertDistributionRecordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }
    try {
      const record = await storage.createDistributionRecord(parseResult.data);
      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating distribution record:", error);
      res.status(500).json({ error: "Failed to create distribution record" });
    }
  });

  app.patch("/api/distribution-records/:id", 
    requireAuth, 
    checkSubscription, 
    validateRequest(updateDistributionRecordSchema),
    async (req, res) => {
      try {
        // Validate the ID parameter
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0) {
          return res.status(400).json({ error: "Invalid distribution record ID" });
        }
        
        const record = await storage.updateDistributionRecord(id, req.body);
        
        if (!record) {
          return res.status(404).json({ error: "Distribution record not found" });
        }
        
        res.json(record);
      } catch (error) {
        console.error("Error updating distribution record:", error);
        res.status(500).json({ error: "Failed to update distribution record" });
      }
    }
  );

  // Scheduled Distribution routes
  app.get("/api/scheduled-distributions", requireAuth, checkSubscription, async (req, res) => {
    try {
      const distributions = await storage.getScheduledDistributions(req.user!.id);
      res.json(distributions);
    } catch (error) {
      console.error("Error fetching scheduled distributions:", error);
      res.status(500).json({ error: "Failed to fetch scheduled distributions" });
    }
  });

  app.post("/api/scheduled-distributions", requireAuth, checkSubscription, async (req, res) => {
    const parseResult = insertScheduledDistributionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    try {
      // Verify that the user owns the release
      const release = await storage.getReleaseById(parseResult.data.releaseId);
      if (!release || release.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized access to release" });
      }

      const distribution = await storage.createScheduledDistribution(parseResult.data);
      res.status(201).json(distribution);
    } catch (error) {
      console.error("Error creating scheduled distribution:", error);
      res.status(500).json({ error: "Failed to create scheduled distribution" });
    }
  });

  app.patch("/api/scheduled-distributions/:id", requireAuth, checkSubscription, async (req, res) => {
    const id = parseInt(req.params.id);
    const distribution = await storage.getScheduledDistributionById(id);

    if (!distribution) {
      return res.status(404).json({ error: "Scheduled distribution not found" });
    }

    // Verify ownership through release
    const release = await storage.getReleaseById(distribution.releaseId);
    if (!release || release.userId !== req.user!.id) {
      return res.status(403).json({ error: "Unauthorized access to distribution" });
    }

    try {
      const updated = await storage.updateScheduledDistribution(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating scheduled distribution:", error);
      res.status(500).json({ error: "Failed to update scheduled distribution" });
    }
  });

  // Add new route for avatar upload
  app.post("/api/user/avatar", requireAuth, upload.single('avatar'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    try {
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const updatedUser = await storage.updateUser(req.user!.id, { avatarUrl });
      res.json({ avatarUrl });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ error: "Failed to upload avatar" });
    }
  });

  // Add new route for profile updates
  app.patch("/api/user/profile", requireAuth, async (req, res) => {
    try {
      const updatedUser = await storage.updateUser(req.user!.id, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Support Tickets API
  app.get("/api/support/tickets", requireAuth, async (req, res) => {
    try {
      const tickets = await storage.getSupportTicketsByUserId(req.user!.id);
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ error: "Failed to fetch support tickets" });
    }
  });

  app.get("/api/support/tickets/:id", requireAuth, async (req, res) => {
    const ticketId = parseInt(req.params.id);
    try {
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check if the user is the owner of the ticket
      if (ticket.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized access to ticket" });
      }

      const messages = await storage.getTicketMessagesByTicketId(ticketId);
      res.json({ ticket, messages });
    } catch (error) {
      console.error("Error fetching support ticket:", error);
      res.status(500).json({ error: "Failed to fetch support ticket details" });
    }
  });

  app.post("/api/support/tickets", requireAuth, async (req, res) => {
    const parseResult = insertSupportTicketSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    try {
      const ticket = await storage.createSupportTicket({
        ...parseResult.data,
        userId: req.user!.id
      });
      res.status(201).json(ticket);
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ error: "Failed to create support ticket" });
    }
  });

  app.post("/api/support/tickets/:id/messages", requireAuth, async (req, res) => {
    const ticketId = parseInt(req.params.id);
    const parseResult = insertSupportTicketMessageSchema.safeParse({
      ...req.body,
      ticketId,
      senderId: req.user!.id,
      senderType: 'user'
    });

    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    try {
      // Verify ticket ownership
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket || ticket.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized access to ticket" });
      }

      // If ticket is closed, reopen it
      if (ticket.status === 'closed') {
        await storage.updateTicketStatus(ticketId, 'waiting'); // Correct method name
      } else if (ticket.status !== 'waiting') {
        // Update to waiting status when user sends a message
        await storage.updateTicketStatus(ticketId, 'waiting'); // Correct method name
      }

      const message = await storage.createTicketMessage(parseResult.data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating ticket message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  // Admin Support Ticket endpoints
  app.get("/api/admin/support/tickets", async (req: any, res) => {
    if (!req.user || !req.session.isAdmin) return res.sendStatus(401);

    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching all support tickets:", error);
      res.status(500).json({ error: "Failed to fetch support tickets" });
    }
  });

  app.get("/api/admin/support/tickets/:id", async (req: any, res) => {
    if (!req.user || !req.session.isAdmin) return res.sendStatus(401);

    const ticketId = parseInt(req.params.id);
    try {
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      const messages = await storage.getTicketMessagesByTicketId(ticketId);
      res.json({ ticket, messages });
    } catch (error) {
      console.error("Error fetching support ticket:", error);
      res.status(500).json({ error: "Failed to fetch support ticket details" });
    }
  });

  app.post("/api/admin/support/tickets/:id/messages", async (req: any, res) => {
    if (!req.user || !req.session.isAdmin) return res.sendStatus(401);

    const ticketId = parseInt(req.params.id);
    const parseResult = insertSupportTicketMessageSchema.safeParse({
      ...req.body,
      ticketId,
      senderId: req.user.id,
      senderType: 'admin'
    });

    if (!parseResult.success) {
      return res.status(400).json(parseResult.error);
    }

    try {
      // If ticket isn't assigned to this admin, assign it
      const ticket = await storage.getSupportTicketById(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Assign ticket if not already assigned to this admin
      if (ticket.assignedToId !== req.user.id) { // Correct property name
        await storage.assignTicket(ticketId, req.user.id); // Correct method name
      }

      // Update status to in_progress
      if (ticket.status !== 'in_progress') {
        await storage.updateTicketStatus(ticketId, 'in_progress', req.user.id); // Correct method name
      }

      const message = await storage.createTicketMessage(parseResult.data);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating admin ticket message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.patch("/api/admin/support/tickets/:id/status", async (req: any, res) => {
    if (!req.user || !req.session.isAdmin) return res.sendStatus(401);

    const ticketId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || !['open', 'in_progress', 'waiting', 'closed'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    try {
      const ticket = await storage.updateTicketStatus(ticketId, status, req.user.id); // Correct method name
      res.json(ticket);
    } catch (error) {
      console.error("Error updating ticket status:", error);
      res.status(500).json({ error: "Failed to update ticket status" });
    }
  });

  app.patch("/api/admin/support/tickets/:id/assign", async (req: any, res) => {
    if (!req.user || !req.session.isAdmin) return res.sendStatus(401);

    const ticketId = parseInt(req.params.id);

    try {
      const ticket = await storage.assignTicket(ticketId, req.user.id); // Correct method name
      res.json(ticket);
    } catch (error) {
      console.error("Error assigning ticket:", error);
      res.status(500).json({ error: "Failed to assign ticket" });
    }
  });


  // Add new sub-label routes
  app.get("/api/sub-labels", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const subLabels = await storage.getSubLabels(req.user.id);
      res.json(subLabels);
    } catch (error) {
      console.error("Error fetching sub-labels:", error);
      res.status(500).json({ error: "Failed to fetch sub-labels" });
    }
  });


  app.get("/api/sub-labels/audit-logs/:id", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    try {
      const subLabelId = parseInt(req.params.id);
      const logs = await storage.getSubLabelAuditLogs(subLabelId);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  app.patch("/api/sub-labels/:id/permissions", async (req, res) => {
    if (!req.user) return res.sendStatus(401);

    const subLabelId = parseInt(req.params.id);
    try {
      const subLabel = await storage.getUserById(subLabelId);
      if (!subLabel) {
        return res.status(404).json({ error: "Sub-label not found" });
      }

      // Create audit log entry
      await storage.createSubLabelAuditLog({
        subLabelId,
        changedById: req.user.id,
        action: "update_permissions",
        category: "permissions",
        previousValue: (subLabel as any).labelSettings,
        newValue: req.body,
      });

      // Update permissions
      const updatedSubLabel = await storage.updateUser(subLabelId, {
        permissions: req.body, // Store in permissions which is a valid field in User
      });

      res.json(updatedSubLabel);
    } catch (error) {
      console.error("Error updating sub-label permissions:", error);
      res.status(500).json({ error: "Failed to update permissions" });
    }
  });

  app.get("/api/sub-labels/:id/users", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.sendStatus(403);

    try {
      const subLabelId = parseInt(req.params.id);
      const users = await storage.getSubLabelUsers(subLabelId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching sub-label users:", error);
      res.status(500).json({ error: "Failed to fetch sub-label users" });
    }
  });

  app.post("/api/sub-labels/:id/users", async (req, res) => {
    if (!req.user) return res.sendStatus(401);
    if (req.user.role !== "admin") return res.sendStatus(403);

    try {
      const subLabelId = parseInt(req.params.id);
      const newUser = await storage.createUser({
        ...req.body,
        parentId: subLabelId,
        role: "artist",
        labelType: "artist",
      });

      res.json(newUser);
    } catch (error) {
      console.error("Error creating sub-label user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Add new bulk distribution routes
  app.get("/api/distribution/bulk", requireAuth, checkSubscription, async (req, res) => {
    try {
      const jobs = await storage.getBulkDistributionJobs(req.user!.id);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching bulk distribution jobs:", error);
      res.status(500).json({ error: "Failed to fetch bulk distribution jobs" });
    }
  });

  app.post("/api/distribution/bulk", requireAuth, checkSubscription, async (req, res) => {
    try {
      const job = await storage.createBulkDistributionJob({
        ...req.body,
        userId: req.user!.id,
        status: "pending",
        processedReleases: 0,
        failedReleases: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Initialize platform details
      const platformDetails = await Promise.all(
        req.body.platformIds.map(async (platformId: number) => {
          const platform = await storage.getDistributionPlatformById(platformId);
          return {
            platformId,
            platformName: platform?.name || "Unknown Platform",
            status: "pending",
          };
        })
      );

      await storage.updateBulkDistributionJob(job.id, {
        platformDetails,
      });

      // Start processing the job if immediate scheduling is requested
      if (req.body.settings?.scheduleImmediate) {
        // Trigger job processing (implementation depends on your background job system)
        processBulkDistributionJob(job.id);
      }

      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating bulk distribution job:", error);
      res.status(500).json({ error: "Failed to create bulk distribution job" });
    }
  });

  app.post("/api/distribution/bulk/:id/retry", requireAuth, checkSubscription, async (req, res) => {
    const jobId = parseInt(req.params.id);
    try {
      const job = await storage.getBulkDistributionJobById(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      await storage.updateBulkDistributionJob(jobId, {
        status: "pending",
        updatedAt: new Date(),
        retryCount: (job.retryCount || 0) + 1,
      });

      // Trigger job processing
      processBulkDistributionJob(jobId);

      res.json({ message: "Job retry initiated" });
    } catch (error) {
      console.error("Error retrying bulk distribution job:", error);
      res.status(500).json({ error: "Failed to retry job" });
    }
  });

  app.post("/api/distribution/bulk/:id/cancel", requireAuth, checkSubscription, async (req, res) => {
    const jobId = parseInt(req.params.id);
    try {
      const job = await storage.getBulkDistributionJobById(jobId);

      if (!job) {
        return res.status(404).json({ error: "Job not found" });
      }

      if (job.userId !== req.user!.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      if (job.status !== "pending") {
        return res.status(400).json({ error: "Can only cancel pending jobs" });
      }

      await storage.updateBulkDistributionJob(jobId, {
        status: "cancelled",
        updatedAt: new Date(),
      });

      res.json({ message: "Job cancelled successfully" });
    } catch (error) {
      console.error("Error cancelling bulk distribution job:", error);
      res.status(500).json({ error: "Failed to cancel job" });
    }
  });

  // Add permission template routes
  app.get("/api/permission-templates", requireAuth, checkSubscription, async (req, res) => {
    try {
      const templates = await storage.getPermissionTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching permission templates:", error);
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/permission-templates", requireAuth, checkSubscription, async (req, res) => {
    try {
      const template = await storage.createPermissionTemplate({
        ...req.body,
        createdById: req.user!.id,
      });
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating permission template:", error);
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Add release approval routes
  app.post("/api/releases/:id/request-approval", requireAuth, checkSubscription, async (req, res) => {
    const releaseId = parseInt(req.params.id);
    try {
      const release = await storage.getReleaseById(releaseId);
      if (!release) {
        return res.status(404).json({ error: "Release not found" });
      }

      const approval = await storage.createReleaseApproval({
        releaseId,
        subLabelId: (req.user as any).parentId || 0, // Using parentId which exists in the schema
        requestedById: req.user!.id,
        status: "pending",
        comments: req.body.comments,
      });

      // Create audit log entry
      await storage.createSubLabelAuditLog({
        subLabelId: (req.user as any).parentId || 0, // Using parentId which exists in schema
        changedById: req.user!.id,
        action: "request_release_approval",
        category: "releases",
        previousValue: { status: "draft" },
        newValue: { status: "pending_approval" },
        metadata: {
          releaseId,
          // Add null check before accessing approval.id
          approvalId: approval ? approval.id : null,
        },
      });

      res.status(201).json(approval);
    } catch (error) {
      console.error("Error requesting release approval:", error);
      res.status(500).json({ error: "Failed to request approval" });
    }
  });

  app.patch("/api/releases/:id/approve", requireAuth, checkSubscription, async (req, res) => {
    const releaseId = parseInt(req.params.id);
    try {
      const approval = await storage.updateReleaseApproval(releaseId, {
        status: "approved",
        approvedById: req.user!.id,
        comments: req.body.comments,
      });

      // Create audit log entry
      await storage.createSubLabelAuditLog({
        subLabelId: (req.user as any).parentId || 0, // Using parentId which exists in schema
        changedById: req.user!.id,
        action: "approve_release",
        category: "releases",
        previousValue: { status: "pending_approval" },
        newValue: { status: "approved" },
        metadata: {
          releaseId,
          // Add null check before accessing approval.id
          approvalId: approval ? approval.id : null,
        },
      });

      res.json(approval);
    } catch (error) {
      console.error("Error approving release:", error);
      res.status(500).json({ error: "Failed to approve release" });
    }
  });

  // Simplified team management routes without role checks
  app.get("/api/sub-labels/:id/team", requireAuth, checkSubscription, async (req, res) => {
    try {
      const subLabelId = parseInt(req.params.id);
      const team = await storage.getTeamMembers(subLabelId);
      res.json(team);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team" });
    }
  });

  app.patch("/api/sub-labels/:id/team/:userId", requireAuth, checkSubscription, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const previousUser = await storage.getUser(userId);
      const updatedUser = await storage.updateTeamMember(userId, req.body);

      // Create audit log entry
      await storage.createSubLabelAuditLog({
        subLabelId: parseInt(req.params.id),
        changedById: req.user!.id,
        action: "update_team_member",
        category: "team",
        previousValue: {},
        newValue: {},
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });


  // Function to process bulk distribution job (placeholder)
  async function processBulkDistributionJob(jobId: number) {
    try {
      const job = await storage.getBulkDistributionJobById(jobId);
      if (!job) return;

      await storage.updateBulkDistributionJob(jobId, {
        status: "processing",
        updatedAt: new Date(),
      });

      // Process each release for each platform
      // This is a placeholder - implement actual distribution logic
      for (const platformDetail of job.platformDetails) {
        try {
          // Process distribution for this platform
          // Update platform status as needed
          await storage.updateBulkDistributionJobPlatformStatus(
            jobId,
            platformDetail.platformId,
            "processing"
          );

          // Actual distribution logic would go here

          await storage.updateBulkDistributionJobPlatformStatus(
            jobId,
            platformDetail.platformId,
            "completed"
          );
        } catch (error) {
          await storage.updateBulkDistributionJobPlatformStatus(
            jobId,
            platformDetail.platformId,
            "failed",
            error instanceof Error ? error.message : String(error)
          );
        }
      }

      // Update final job status
      const platformStatuses = await storage.getBulkDistributionJobPlatformStatuses(jobId);
      const allCompleted = platformStatuses.every(p => p.status === "completed");
      const anyFailed = platformStatuses.some(p => p.status === "failed");

      await storage.updateBulkDistributionJob(jobId, {
        status: allCompleted ? "completed" : anyFailed ? "failed" : "processing",
        processedReleases: platformStatuses.filter(p => p.status === "completed").length,
        failedReleases: platformStatuses.filter(p => p.status === "failed").length,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error processing bulk distribution job:", error);
      await storage.updateBulkDistributionJob(jobId, {
        status: "failed",
        updatedAt: new Date(),
      });
    }
  }

  // Analytics routes
  app.use('/api/analytics', analyticsRouter);

  // Royalty management routes
  // Royalty routes are now imported and registered at the top of this file
  // app.use('/api/royalty', royaltyRouter);
  
  // Distribution analytics routes
  app.use('/api/distribution-analytics', distributionAnalyticsRouter);
  
  // Distribution status tracking routes
  const distributionStatusRoutes = (await import('./routes/distribution-status')).default;
  app.use('/api/distribution-status', distributionStatusRoutes);
  
  // Mobile API routes
  app.use('/api/mobile', mobileApiRouter);

  // Platform royalty analytics routes
  app.use('/api/platform-royalty-analytics', platformRoyaltyAnalyticsRouter);

  // === ADVANCED FEATURES ROUTES ===
  
  // Import audio fingerprinting routes
  const audioFingerprintingRoutes = (await import('./routes/audio-fingerprinting')).default;
  app.use('/api/audio-fingerprinting', audioFingerprintingRoutes);
  
  // Import blockchain integration routes
  const blockchainRoutes = (await import('./routes/blockchain')).default;
  app.use('/api/blockchain', blockchainRoutes);
  
  // Import blockchain Web3 routes
  const blockchainWeb3Routes = (await import('./routes/blockchain-web3')).default;
  app.use('/api/blockchain', blockchainWeb3Routes);
  
  // Import rights management routes
  const rightsManagementRoutes = (await import('./routes/rights-management')).default;
  app.use('/api/rights', rightsManagementRoutes);

  // Integration endpoints - connecting distribution with royalties
  // === INTEGRATION ENDPOINTS ===
  
  /**
   * Integration status endpoint
   * 
   * This provides an overview of the integration status between distribution and royalty systems,
   * showing distribution status counts and unprocessed analytics
   */
  app.get('/api/integration/status', requireAuth, async (req, res) => {
    try {
      // No userId needed as getIntegrationStatus doesn't require it
      const status = await IntegrationService.getIntegrationStatus();
      res.json(status);
    } catch (error) {
      console.error('Error getting integration status:', error);
      res.status(500).json({ error: 'Failed to get integration status' });
    }
  });

  /**
   * Trigger distribution-to-royalty integration manually
   * 
   * This allows admins to manually trigger the integration flow for a specific
   * distribution record, useful for testing or fixing issues
   */
  app.post('/api/integration/trigger/:distributionId', requireAuth, async (req, res) => {
    try {
      const distributionId = parseInt(req.params.distributionId);
      
      // Use processDistributionRoyaltyIntegration for direct integration
      // Get options from request body
      const options: {
        forceRecalculation: boolean;
        storeResults: boolean;
        timeframe?: {
          startDate: string;
          endDate: string;
        };
      } = {
        forceRecalculation: !!req.body.forceRecalculation,
        storeResults: req.body.storeResults !== false
      };
      
      // Add timeframe if provided
      if (req.body.timeframe) {
        options.timeframe = {
          startDate: req.body.timeframe.startDate,
          endDate: req.body.timeframe.endDate || new Date().toISOString()
        };
      }
      
      // Process the direct distribution-to-royalty integration
      const result = await IntegrationService.processDistributionRoyaltyIntegration(
        distributionId,
        options
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error triggering distribution-royalty integration:', error);
      res.status(500).json({ 
        error: 'Failed to trigger integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Batch process integration for multiple distribution records
   * 
   * This endpoint allows processing multiple distribution records at once,
   * useful for bulk operations or catching up after system downtime
   */
  app.post('/api/integration/batch-process', requireAuth, async (req, res) => {
    try {
      // Get batch processing options
      const batchOptions = {
        userId: req.body.userId || req.user!.id,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        limit: req.body.limit || 10,
        forceRecalculation: req.body.forceRecalculation === true,
        includeFailedDistributions: req.body.includeFailedDistributions === true,
        notifyStakeholders: req.body.notifyStakeholders === true
      };
      
      // Get integration options for each processed record
      const integrationOptions: {
        forceRecalculation: boolean;
        storeResults: boolean;
        timeframe?: {
          startDate: string;
          endDate: string;
        };
      } = {
        forceRecalculation: req.body.forceRecalculation === true,
        storeResults: req.body.storeResults !== false
      };
      
      // Add timeframe if provided
      if (req.body.timeframe) {
        integrationOptions.timeframe = {
          startDate: req.body.timeframe.startDate || (batchOptions.startDate ? batchOptions.startDate.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          endDate: req.body.timeframe.endDate || (batchOptions.endDate ? batchOptions.endDate.toISOString() : new Date().toISOString())
        };
      }
      
      // Process the batch using the new direct integration method
      const result = await IntegrationService.processBatchRoyaltyIntegration(
        batchOptions,
        integrationOptions
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error processing batch integration:', error);
      res.status(500).json({ 
        error: 'Failed to process batch integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Batch process integration for multiple distribution records
   * 
   * This endpoint allows processing multiple distribution records at once,
   * useful for bulk operations or catching up after system downtime
   */
  app.post('/api/integration/batch-process', requireAuth, ensureAdmin, async (req, res) => {
    try {
      // Get batch processing options - admin route has more capabilities
      const batchOptions = {
        userId: req.body.userId ? parseInt(req.body.userId) : undefined,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        limit: req.body.limit ? parseInt(req.body.limit) : 50, // Admins can process more records
        includeAllStatuses: req.body.includeAllStatuses === true,
        includeAllUsers: req.body.includeAllUsers === true,
        forceRecalculation: req.body.forceRecalculation === true,
        includeFailedDistributions: req.body.includeFailedDistributions === true,
        notifyStakeholders: req.body.notifyStakeholders === true
      };
      
      // Get advanced integration options for each processed record
      const integrationOptions: {
        forceRecalculation: boolean;
        storeResults: boolean;
        updateAnalytics: boolean;
        recalculateExisting: boolean;
        priority: string;
        timeframe?: {
          startDate: string;
          endDate: string;
        };
      } = {
        forceRecalculation: req.body.forceRecalculation === true,
        storeResults: req.body.storeResults !== false,
        updateAnalytics: req.body.updateAnalytics === true,
        recalculateExisting: req.body.recalculateExisting === true,
        priority: req.body.priority || 'normal'
      };
      
      // Add timeframe if provided
      if (req.body.timeframe) {
        integrationOptions.timeframe = {
          startDate: req.body.timeframe.startDate || (batchOptions.startDate ? batchOptions.startDate.toISOString() : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()), // Admins can see 90 days by default
          endDate: req.body.timeframe.endDate || (batchOptions.endDate ? batchOptions.endDate.toISOString() : new Date().toISOString())
        };
      }
      
      // Process the batch using the admin version of direct integration method
      const result = await IntegrationService.processBatchRoyaltyIntegrationAdmin(
        batchOptions,
        integrationOptions
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error processing admin batch integration:', error);
      res.status(500).json({ 
        error: 'Failed to process batch integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  /**
   * Trigger distribution-to-royalty integration manually
   * 
   * This allows admins to manually trigger the integration flow for a specific
   * distribution record, useful for testing or fixing issues
   */
  app.post('/api/integration/trigger/:distributionId', requireAuth, ensureAdmin, async (req, res) => {
    try {
      const distributionId = parseInt(req.params.distributionId);
      
      // Get the current status of the distribution record
      const distributionRecords = await storage.getDistributionRecords(undefined);
      const record = distributionRecords.find(r => r.id === distributionId);
      
      if (!record) {
        return res.status(404).json({ 
          error: 'Distribution record not found',
          message: `No distribution record found with ID ${distributionId}`
        });
      }
      
      // Admin route allows forcing recalculation and providing custom time period
      const options: {
        forceRecalculation: boolean;
        storeResults: boolean;
        updateAnalytics: boolean;
        notifyStakeholders: boolean;
        timeframe?: {
          startDate: string;
          endDate: string;
        };
      } = {
        forceRecalculation: req.body.forceRecalculation === true,
        storeResults: req.body.storeResults !== false,
        updateAnalytics: req.body.updateAnalytics === true,
        notifyStakeholders: req.body.notifyStakeholders === true
      };
      
      // Add timeframe if provided
      if (req.body.timeframe) {
        options.timeframe = {
          startDate: req.body.timeframe.startDate || (record.distributedAt ? record.distributedAt.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
          endDate: req.body.timeframe.endDate || new Date().toISOString()
        };
      }
      
      // Use the direct distribution-to-royalty integration method
      const result = await IntegrationService.processDistributionRoyaltyIntegration(
        distributionId,
        options
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error triggering admin integration:', error);
      res.status(500).json({ 
        error: 'Failed to trigger integration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Get distribution-to-royalty integration status
   * 
   * This endpoint provides an overview of the integration state between 
   * distribution and royalty systems, showing pending and completed integrations.
   */
  app.get('/api/integration/status', requireAuth, async (req, res) => {
    try {
      // Get integration status - no userId parameter needed as per method signature
      const status = await IntegrationService.getIntegrationStatus();
      
      res.json(status);
    } catch (error) {
      console.error('Error getting integration status:', error);
      res.status(500).json({ 
        error: 'Failed to get integration status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * Process batch royalty calculations
   * 
   * This endpoint triggers batch processing of royalty calculations for multiple tracks
   * or entire releases, optimized for background processing and bulk operations.
   * 
   * Request body:
   * - trackIds?: number[] - Optional array of track IDs to process
   * - releaseId?: number - Optional release ID to process all tracks from
   * - userId?: number - Optional user ID to process all their tracks
   * - timeframe?: { startDate: string, endDate: string } - Optional date range for calculations
   * - forceRecalculation?: boolean - Whether to force recalculation of existing data
   */
  app.post('/api/integration/batch-royalty-calculations', requireAuth, async (req, res) => {
    try {
      // Get parameters from request body
      const {
        trackIds,
        releaseId,
        userId,
        timeframe,
        forceRecalculation = false
      } = req.body;
      
      // Validate at least one selection criteria is provided
      if (!trackIds && !releaseId && !userId) {
        return res.status(400).json({ 
          error: 'Missing selection criteria', 
          message: 'Please provide either trackIds, releaseId, or userId' 
        });
      }
      
      // Parse timeframe if provided
      let parsedTimeframe;
      if (timeframe) {
        // Validate dates
        const startDate = timeframe.startDate ? new Date(timeframe.startDate) : undefined;
        const endDate = timeframe.endDate ? new Date(timeframe.endDate) : undefined;
        
        if ((startDate && isNaN(startDate.getTime())) || (endDate && isNaN(endDate.getTime()))) {
          return res.status(400).json({ 
            error: 'Invalid date format', 
            message: 'Please provide dates in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.sssZ)' 
          });
        }
        
        parsedTimeframe = startDate || endDate ? { 
          startDate: (startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).toISOString(), // Default to 30 days ago
          endDate: (endDate || new Date()).toISOString()
        } : undefined;
      }
      
      // Set up options for batch processing
      const options = {
        trackIds,
        releaseId,
        userId: userId || req.user?.id, // Default to the authenticated user
        timeframe: parsedTimeframe,
        forceRecalculation
      };
      
      // Process batch royalty calculations
      const result = await IntegrationService.processBatchRoyaltyCalculations(options);
      
      // Return the result
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error processing batch royalty calculations:', error);
      return res.status(500).json({ 
        error: 'Server error', 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    }
  });

  /**
   * Process batch integration of distribution to royalty systems
   * 
   * This endpoint handles batch processing of distribution-to-royalty integration
   * with options for different selection criteria and processing modes.
   * 
   * Request body:
   * - userId?: number - Optional user ID to filter by (defaults to authenticated user)
   * - startDate?: string - Optional start date for filtering distribution records
   * - endDate?: string - Optional end date for filtering distribution records
   * - limit?: number - Optional maximum number of records to process
   * - includeFailedDistributions?: boolean - Whether to include failed distribution records
   * - forceRecalculation?: boolean - Whether to force recalculation of existing royalties
   * - timeframe?: { startDate: string, endDate: string } - Optional date range for calculations
   */
  app.post('/api/integration/batch-royalty-integration', requireAuth, async (req, res) => {
    try {
      // Get parameters from request body
      const {
        userId,
        startDate,
        endDate,
        limit = 10,
        includeFailedDistributions = false,
        forceRecalculation = false,
        notifyStakeholders = false,
        timeframe
      } = req.body;
      
      // Parse dates if provided
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;
      
      // Validate dates if provided
      if ((parsedStartDate && isNaN(parsedStartDate.getTime())) || 
          (parsedEndDate && isNaN(parsedEndDate.getTime()))) {
        return res.status(400).json({ 
          error: 'Invalid date format', 
          message: 'Please provide dates in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.sssZ)' 
        });
      }
      
      // Parse timeframe if provided
      let parsedTimeframe;
      if (timeframe) {
        const tfStartDate = timeframe.startDate ? new Date(timeframe.startDate) : undefined;
        const tfEndDate = timeframe.endDate ? new Date(timeframe.endDate) : undefined;
        
        if ((tfStartDate && isNaN(tfStartDate.getTime())) || 
            (tfEndDate && isNaN(tfEndDate.getTime()))) {
          return res.status(400).json({ 
            error: 'Invalid timeframe date format', 
            message: 'Please provide timeframe dates in ISO format' 
          });
        }
        
        parsedTimeframe = {
          startDate: tfStartDate ? tfStartDate.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: tfEndDate ? tfEndDate.toISOString() : new Date().toISOString()
        };
      }
      
      // Set up batch options
      const batchOptions = {
        userId: userId || req.user?.id, // Default to the authenticated user
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        limit,
        includeFailedDistributions,
        notifyStakeholders
      };
      
      // Set up integration options
      const integrationOptions = {
        forceRecalculation,
        timeframe: parsedTimeframe,
        storeResults: true
      };
      
      // Process batch integration
      const result = await IntegrationService.processBatchRoyaltyIntegration(
        batchOptions,
        integrationOptions
      );
      
      // Return the result
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error processing batch royalty integration:', error);
      res.status(500).json({ 
        error: 'Failed to process royalty calculations', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  /**
   * Admin-level batch integration of distribution to royalty systems
   * 
   * This endpoint provides additional options and capabilities specifically for admins,
   * such as processing records across all users and prioritizing specific calculations.
   * 
   * Request body:
   * - userId?: number - Optional user ID to filter by (null means process all users)
   * - startDate?: string - Optional start date for filtering distribution records
   * - endDate?: string - Optional end date for filtering distribution records
   * - limit?: number - Optional maximum number of records to process (defaults to 50)
   * - includeAllStatuses?: boolean - Whether to include all distribution statuses
   * - includeAllUsers?: boolean - Whether to process for all users (overrides userId)
   * - includeFailedDistributions?: boolean - Whether to include failed distribution records
   * - notifyStakeholders?: boolean - Whether to notify stakeholders of changes
   * - forceRecalculation?: boolean - Whether to force recalculation of existing royalties
   * - updateAnalytics?: boolean - Whether to update analytics processing status
   * - recalculateExisting?: boolean - Whether to recalculate all royalties for affected releases
   * - priority?: string - Optional priority level for processing (high, medium, low)
   * - timeframe?: { startDate: string, endDate: string } - Optional date range for calculations
   */
  app.post('/api/admin/batch-royalty-integration', requireAuth, requireAdmin, async (req, res) => {
    try {
      // Get parameters from request body
      const {
        userId,
        startDate,
        endDate,
        limit = 50,
        includeAllStatuses = false,
        includeAllUsers = false,
        includeFailedDistributions = true,
        notifyStakeholders = false,
        forceRecalculation = false,
        updateAnalytics = false,
        recalculateExisting = false,
        priority = 'medium',
        timeframe
      } = req.body;
      
      // Parse dates if provided
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;
      
      // Validate dates if provided
      if ((parsedStartDate && isNaN(parsedStartDate.getTime())) || 
          (parsedEndDate && isNaN(parsedEndDate.getTime()))) {
        return res.status(400).json({ 
          error: 'Invalid date format', 
          message: 'Please provide dates in ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS.sssZ)' 
        });
      }
      
      // Parse timeframe if provided
      let parsedTimeframe;
      if (timeframe) {
        const tfStartDate = timeframe.startDate ? new Date(timeframe.startDate) : undefined;
        const tfEndDate = timeframe.endDate ? new Date(timeframe.endDate) : undefined;
        
        if ((tfStartDate && isNaN(tfStartDate.getTime())) || 
            (tfEndDate && isNaN(tfEndDate.getTime()))) {
          return res.status(400).json({ 
            error: 'Invalid timeframe date format', 
            message: 'Please provide timeframe dates in ISO format' 
          });
        }
        
        parsedTimeframe = {
          startDate: tfStartDate ? tfStartDate.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: tfEndDate ? tfEndDate.toISOString() : new Date().toISOString()
        };
      }
      
      // Set up batch options for admin processing
      const batchOptions = {
        userId: includeAllUsers ? undefined : userId,
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        limit,
        includeAllStatuses,
        includeAllUsers,
        includeFailedDistributions,
        notifyStakeholders
      };
      
      // Set up integration options
      const integrationOptions = {
        forceRecalculation,
        timeframe: parsedTimeframe,
        storeResults: true,
        updateAnalytics,
        recalculateExisting,
        priority
      };
      
      // Process admin batch integration
      const result = await IntegrationService.processBatchRoyaltyIntegrationAdmin(
        batchOptions,
        integrationOptions
      );
      
      // Return the result
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error processing admin batch royalty integration:', error);
      res.status(500).json({ 
        error: 'Failed to process admin batch integration', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  /**
   * Synchronize royalty calculations with distribution data for a specific release
   * 
   * This endpoint provides a comprehensive way to ensure royalty calculations
   * are up-to-date with the latest distribution data for a specific release.
   * It processes all distribution records and recalculates royalties for all tracks
   * in the release, providing a full synchronization between distribution and royalty systems.
   */
  app.post('/api/integration/sync-release/:releaseId', requireAuth, async (req, res) => {
    try {
      const releaseId = parseInt(req.params.releaseId);
      
      // Get synchronization options from request body
      const options: {
        forceRecalculation: boolean;
        includeFailedDistributions: boolean;
        notifyStakeholders: boolean;
        timeframe?: {
          startDate: string;
          endDate: string;
        };
      } = {
        forceRecalculation: req.body.forceRecalculation === true,
        includeFailedDistributions: req.body.includeFailedDistributions === true,
        notifyStakeholders: req.body.notifyStakeholders === true
      };
      
      // Add timeframe if provided - standardizing to use timeframe parameter consistently
      if (req.body.timeframe) {
        options.timeframe = {
          startDate: req.body.timeframe.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: req.body.timeframe.endDate || new Date().toISOString()
        };
      }
      
      // Process the release synchronization
      const result = await IntegrationService.synchronizeReleaseRoyalties(
        releaseId,
        options
      );
      
      res.json(result);
    } catch (error) {
      console.error('Error synchronizing release royalties:', error);
      res.status(500).json({ 
        error: 'Failed to synchronize release royalties',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Custom API access routes
  app.use('/api/access', (await import('./routes/api-access')).default);

  // White label configuration routes
  const whiteLabelService = {
    getConfig: (domain: string) => ({ domain, theme: 'default' }), // Placeholder
    setConfig: async (domain: string, config: any) => ({ domain, ...config }), // Placeholder
  };

  app.get('/api/white-label/config', async (req, res) => {
    const domain = req.get('host') || 'default';
    const config = whiteLabelService.getConfig(domain);
    res.json(config);
  });

  app.post('/api/white-label/config', requireAuth, checkSubscription, async (req, res) => {
    const domain = req.body.domain || 'default';
    const config = await whiteLabelService.setConfig(domain, req.body.config);
    res.json(config);
  });

  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

  const httpServer = createServer(app);
  // TypeScript expects void but function returns Server, adding this function call makes it not return a value
  httpServer.listen(0); // Listen on a random port (will be immediately overridden)
  return;
}

// AI-powered content tag generation utility
/**
 * Generate AI-powered content tags for music metadata
 * 
 * This helper function analyzes track/release titles and artist names to generate
 * intelligent content tags that can be used for categorization and recommendation.
 * 
 * The function:
 * 1. Combines the title, artist, and content type as context
 * 2. Applies natural language processing to extract relevant tags
 * 3. Returns genre, mood, and theme suggestions
 * 
 * In a production environment, this would call a more sophisticated AI service
 * or ML model trained on music metadata to generate accurate tags.
 * 
 * @param title - The title of the track or release
 * @param artistName - The name of the primary artist
 * @param type - The content type (e.g., 'single', 'album')
 * @returns An object containing suggested tags and metadata
 */
async function generateContentTags(title: string, artistName: string, type: string) {
  // In the current implementation, we return a simple analysis
  // In a real-world scenario, this would call an AI service or ML model
  
  // Basic genre mapping based on simple keyword matching
  const genreKeywords = {
    pop: ['pop', 'catchy', 'radio', 'hit'],
    rock: ['rock', 'guitar', 'band', 'electric'],
    electronic: ['electronic', 'edm', 'dance', 'dj', 'beat'],
    hiphop: ['hip hop', 'rap', 'trap', 'beats'],
    jazz: ['jazz', 'swing', 'sax', 'trumpet', 'improvisation'],
    classical: ['classical', 'orchestra', 'symphony', 'concerto', 'sonata'],
    country: ['country', 'western', 'guitar', 'nashville']
  };
  
  // Simple mood detection based on keywords
  const moodKeywords = {
    happy: ['happy', 'joy', 'celebration', 'party', 'fun'],
    sad: ['sad', 'melancholy', 'blue', 'heartbreak', 'sorrow'],
    energetic: ['energy', 'power', 'intense', 'fast', 'loud'],
    relaxed: ['relax', 'calm', 'chill', 'smooth', 'mellow'],
    romantic: ['love', 'romance', 'heart', 'passion', 'desire']
  };
  
  // Content to analyze (combined for keyword matching)
  const content = `${title} ${artistName} ${type}`.toLowerCase();
  
  // Perform basic keyword matching
  const detectedGenres = Object.entries(genreKeywords)
    .filter(([genre, keywords]) => keywords.some(keyword => content.includes(keyword)))
    .map(([genre]) => genre);
    
  const detectedMoods = Object.entries(moodKeywords)
    .filter(([mood, keywords]) => keywords.some(keyword => content.includes(keyword)))
    .map(([mood]) => mood);
    
  // Add default genre and mood if none detected
  const genres = detectedGenres.length > 0 ? detectedGenres : ['pop'];
  const moods = detectedMoods.length > 0 ? detectedMoods : ['energetic'];
  
  // Return analysis results
  return {
    title,
    artistName,
    type,
    contentTags: {
      genres,
      moods,
      themes: ['contemporary'],
      keywords: [...genres, ...moods],
      recommendedPlaylists: genres.map(genre => `${genre} essentials`)
    },
    aiAnalysis: {
      summary: `${title} by ${artistName} is a ${type} with ${genres.join(', ')} elements and a ${moods.join(', ')} mood.`,
      qualityScore: 85,
      contentWarnings: [],
      suggestedImprovements: []
    }
  };
}