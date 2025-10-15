/**
 * Main server entry point for TuneMantra music distribution platform
 * 
 * This file sets up the Express server with all middleware, routes, and error handling.
 * It serves both the API (backend) and the client (frontend) from the same server.
 */

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development' });

// Import required libraries
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import { fileURLToPath } from "url";
import { migrateClientIds } from "./utils/migrate-client-ids";
import cookieParser from 'cookie-parser';
import { createServer as createHttpServer } from 'http';
import { setupSecurityMiddleware } from './middleware/security';

// Convert ESM meta URL to the current file's directory path
// This is needed because Node.js ES modules don't have direct access to __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the Express application instance
const app = express();

// Set up basic middleware
app.use(express.json());                        // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded request bodies
app.use(cookieParser());                        // Parse cookies from request headers

// Set up comprehensive security middleware
setupSecurityMiddleware(app);                   // Apply security protections

/**
 * Middleware: Ensure correct Content-Type headers
 * 
 * This middleware makes sure all JSON responses have the proper Content-Type header.
 * It overrides the default res.json() and res.send() methods to always set the
 * 'application/json' Content-Type header when sending JSON data.
 */
app.use((req, res, next) => {
  // Store the original json method
  const originalJson = res.json;
  
  // Override the json method to ensure Content-Type is set
  res.json = function(body) {
    res.setHeader('Content-Type', 'application/json');
    return originalJson.call(this, body);
  };

  // Also intercept res.send for objects to ensure they have JSON Content-Type
  const originalSend = res.send;
  res.send = function(body) {
    if (body !== null && typeof body === 'object') {
      res.setHeader('Content-Type', 'application/json');
    }
    return originalSend.call(this, body);
  };

  next();
});

/**
 * Middleware: Cache control for static assets
 * 
 * This sets proper cache headers for static files like images, CSS, and JavaScript
 * to improve performance by telling browsers to cache these assets for a long time.
 * The max-age value of 31536000 represents one year in seconds.
 */
app.use((req, res, next) => {
  // Check if the request is for a static file (based on file extension)
  if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|ico)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
  next();
});

/**
 * Serve static files from the uploads directory
 * 
 * This allows direct access to uploaded files through the /uploads URL path.
 * For example, an image at '/uploads/avatars/user123.jpg' on the filesystem
 * will be accessible via 'http://[server-address]/uploads/avatars/user123.jpg'
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * Serve documentation files from docs directory
 * 
 * This allows direct access to all documentation files in the docs folder.
 * For example, docs/index.md will be accessible via 'http://[server-address]/docs/index.md'
 */
app.use('/docs', express.static(path.join(__dirname, '../docs')));

/**
 * Serve static files from root directory
 * 
 * This allows access to files in the root directory.
 */
app.use(express.static(path.join(__dirname, '..')));

/**
 * Middleware: API request logging
 * 
 * This logs information about all API requests including:
 * - HTTP method (GET, POST, etc.)
 * - Path (/api/users, etc.)
 * - Status code (200, 404, 500, etc.)
 * - Response time in milliseconds
 * - Response body (truncated to 80 characters)
 */
app.use((req, res, next) => {
  // Record the start time of the request
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Override the json method to capture the response body
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // When the response is sent, log request details
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      // Truncate log line if it's too long
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Main application initialization
 * 
 * We use an immediately invoked async function to allow for
 * awaiting async operations during server setup.
 */
(async () => {
  // Create HTTP server instance first
  const server = createHttpServer(app);
  
  // Add a route-specific middleware to ensure all API routes return JSON
  app.use('/api', (req, res, next) => {
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
  
  // Swagger API documentation code (currently disabled)
  // app.use('/api/documentation/json', (req, res) => {
  //   res.json(swaggerOptions.swagger);
  // });
  // app.use('/api/documentation', express.static('swagger-ui'));

  // Register all API routes before setting up Vite
  await registerRoutes(app);

  /**
   * Global error handler middleware
   * 
   * This catches any errors thrown or passed to next(error) in any route handler
   * and returns a standardized JSON error response to the client.
   */
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    // Get status code from error or default to 500 (Internal Server Error)
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log the error for server-side debugging with detailed stack trace
    console.error("Error:", err);
    console.error("Stack trace:", err.stack);
    
    if (err.cause) {
      console.error("Caused by:", err.cause);
    }
    
    if (err.data) {
      console.error("Error data:", err.data);
    }
    
    // Send detailed error response to client (in development)
    const errorResponse: any = { 
      error: "Server error",
      message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      code: err.code || 'INTERNAL_ERROR'
    };
    
    // Set appropriate Content-Type header
    res.setHeader('Content-Type', 'application/json');
    // Send error response to client
    res.status(status).json(errorResponse);
  });

  /**
   * Set up Vite for development or serve static files for production
   * 
   * Important: This must be done after registering API routes to ensure
   * the Vite catch-all handler doesn't interfere with API routes.
   */
  if (app.get("env") === "development") {
    // In development, Vite handles serving the frontend with hot module reloading
    await setupVite(app, server);
  } else {
    // In production, serve pre-built static files
    serveStatic(app);
  }

  // Server configuration
  const PORT = 5000;
  
  // Migrate legacy client IDs if needed
  await migrateClientIds(); 
  
  // Start the server on all network interfaces (0.0.0.0)
  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running at http://0.0.0.0:${PORT}`);
  });
})();

/**
 * Admin registration code configuration
 * 
 * This code is required when registering the first admin user.
 * For security reasons, this should be set via environment variable in production.
 */
const registrationCode = process.env.ADMIN_REGISTRATION_CODE || 'admin123';
console.log('Admin registration code is configured (not showing for security)');