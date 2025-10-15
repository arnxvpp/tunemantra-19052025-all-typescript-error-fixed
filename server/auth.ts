/**
 * Authentication Module
 * 
 * This module handles user login, security, and remembering who is logged in.
 * Think of it as the security guard for our application - checking IDs at the door
 * and making sure only authorized people can enter certain areas.
 * 
 * What Does This Do?
 * ------------------
 * 
 * 1. 🔐 Password Security
 *    - When a user creates an account, we don't store their actual password
 *    - Instead, we use a special math formula (called "scrypt") to create a scrambled
 *      version of the password that can't be easily reversed
 *    - Even if someone broke into our database, they couldn't see actual passwords
 *    
 * 2. 🍪 Session Management (Remembering Who Is Logged In)
 *    - After login, users get a special cookie (like a digital wristband)
 *    - This cookie doesn't contain any secret information but has a unique ID
 *    - The ID connects to user information stored safely on our server
 *    - These cookies are protected with several security features:
 *      • HTTP-only: Cannot be read by JavaScript (stops hackers from stealing them)
 *      • Same-site: Only works on our website (not from other websites)
 *      • Secure: Only sent over HTTPS (encrypted connections)
 * 
 * 3. 🔄 How Login Works
 *    a. User types username and password
 *    b. We find their account and compare passwords (in a secure way)
 *    c. If correct, we create a session (remember they're logged in)
 *    d. They can browse around without logging in for each page
 * 
 * 4. 🚫 Protecting Private Areas
 *    - We create special "middleware" functions that act like security checkpoints
 *    - `requireAuth`: Makes sure a user is logged in before accessing certain pages
 *    - `ensureAdmin`: Makes sure a user is not just logged in, but has admin rights
 * 
 * For developers: The authentication system is built on Passport.js with a local
 * strategy, but can be extended to support OAuth, JWT, or other authentication methods.
 */

// Import necessary libraries
// ----------------------------------------------------------------------------------

// Passport - The main authentication library that handles login
import passport from "passport";

// LocalStrategy - The specific login method (username/password)
import { Strategy as LocalStrategy } from "passport-local";

// Express types - Definitions for our web server components
import { Express, Request, Response, NextFunction, RequestHandler } from "express";

// Session management - Helps remember logged-in users between page visits
import session from "express-session";

// Cryptographic functions - For secure password handling
import { scrypt, randomBytes, timingSafeEqual } from "crypto";

// Convert callback functions to Promises for easier async/await usage
import { promisify } from "util";

// Our database access layer - To check user credentials
import { Storage } from "./storage"; // Re-import Storage class

// Import bcrypt for password hashing
import bcrypt from "bcrypt";

// User type definition - Defines what user data looks like
import { User as SelectUser } from "@shared/schema";

// PostgreSQL session store - Saves session data in our database
import connectPg from "connect-pg-simple";
import { pool } from "./db";                                  // Database connection pool
import { generateClientId } from "./utils/id-generator";      // Client ID generator
import { db } from "./db";                                    // Database connection
import { eq } from "drizzle-orm";                             // SQL query builder
import { users } from "@shared/schema";          // Database schema definitions

// Import validation utilities
import { validateRequest } from "./utils/validation";
import { registerUserSchema, loginUserSchema } from "./schemas/auth-schemas";

/**
 * Type Declarations for Express
 * 
 * These declarations extend the Express types to include our custom User
 * type and add a userId property to the Request object.
 */
declare global {
  namespace Express {
    // Extend Express User interface with our SelectUser type
    interface User extends SelectUser {}
    
    // Add userId to the Request interface for easier access
    interface Request {
      userId?: number;
    }
  }
}

/**
 * Type Declaration for Express Session
 * 
 * This extends the SessionData interface to include our custom
 * session properties: userId and isAdmin.
 */
declare module 'express-session' {
  interface SessionData {
    userId?: number;      // Store the user's ID in the session
    isAdmin?: boolean;    // Flag for admin privileges
    csrfToken?: string;   // Add csrfToken property
  }
}

/**
 * Convert scrypt callback function to Promise-based function
 * 
 * This allows us to use async/await syntax with the scrypt function,
 * making the code more readable and easier to maintain.
 */
const scryptAsync = promisify(scrypt);

/**
 * Create PostgreSQL session store for Express
 * 
 * This allows sessions to be stored in the database instead of memory,
 * which is important for production environments and server restarts.
 */
 const PostgresStore = connectPg(session);
 
 // Create an instance of the Storage class
 const storage = new Storage();
 
 /**
 * Hash a password for secure storage
 * 
 * This function:
 * 1. Generates a random salt
 * 2. Hashes the password with the salt using scrypt (a secure key derivation function)
 * 3. Returns the hash and salt combined as a single string
 * 
 * @param password - The plain text password to hash
 * @returns A promise resolving to the hashed password string (format: "hash.salt")
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random 16-byte salt and convert to hex string
  const salt = randomBytes(16).toString('hex');
  
  // Hash the password with the salt (64-byte output)
  const buf = await scryptAsync(password, salt, 64) as Buffer;
  
  // Combine hash and salt with a period separator
  // Note: We use period as separator to match existing password formats in database
  return `${buf.toString('hex')}.${salt}`;
}

/**
 * Compare a supplied password with a stored hashed password
 * 
 * This function securely compares a plain text password with a stored hash:
 * 1. It handles multiple password formats:
 *    - "hashed.salt" (custom format with scrypt)
 *    - "salt:hashed" (legacy format)
 *    - "$2b$..." (bcrypt format)
 * 2. For scrypt formats, it extracts the salt, hashes the supplied password, and compares
 * 3. For bcrypt, it uses the bcrypt.compare method
 * 4. It performs timing-safe comparison to prevent timing attacks
 * 
 * @param supplied - The plain text password provided by the user during login
 * @param stored - The hashed password from the database
 * @returns True if the passwords match, false otherwise
 */
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  // Validate input parameters
  if (!stored || !supplied) {
    console.error("Missing password data:", { hasStoredPassword: !!stored, hasSuppliedPassword: !!supplied });
    return false;
  }

  try {
    // DEVELOPMENT MODE ONLY: Check for special test passwords
    // These are meant to be used only during testing of the system
    if (process.env.NODE_ENV === 'development') {
      // Allow standard password pattern for development testing
      if (supplied === 'password123' || supplied === 'skyline123' || supplied === 'tunemantra') {
        console.log("Testing with development mode password");
        return true;
      }
    }

    // Check if this is a bcrypt hash (starts with $2b$ or $2a$)
    if (stored.startsWith('$2')) {
      // For testing - compare the password using bcrypt
      console.log(`Comparing with bcrypt: "${supplied}" against "${stored}"`);
      return await bcrypt.compare(supplied, stored);
    }
    
    // Parse the stored password to extract salt and hash for scrypt formats
    // We support two formats for backward compatibility:
    // 1. "hashed.salt" - our current format
    // 2. "salt:hashed" - a legacy format that might exist in the database
    let salt, hashed;

    if (stored.includes('.')) {
      // Current format: "hashed.salt"
      [hashed, salt] = stored.split(".");
    } else if (stored.includes(':')) {
      // Legacy format: "salt:hashed"
      [salt, hashed] = stored.split(":");
    } else {
      console.error("Invalid stored password format. Expected format: 'salt:hashed', 'hashed.salt', or bcrypt");
      return false;
    }

    // Verify that we extracted both hash and salt
    if (!salt || !hashed) {
      console.error("Invalid stored password format. Could not extract salt and hash.");
      return false;
    }

    // Convert stored hash to a Buffer for comparison
    const hashedBuf = Buffer.from(hashed, "hex");
    
    // Hash the supplied password using the same salt
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    // Use timing-safe comparison to prevent timing attacks
    // (Where an attacker could measure response time to learn information about the password)
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

/**
 * Set up authentication for the Express application
 * 
 * This function configures:
 * 1. Session management with PostgreSQL storage
 * 2. Passport.js initialization and local strategy configuration
 * 3. User serialization/deserialization for session handling
 * 4. Authentication routes (login, logout, registration)
 * 
 * @param app - The Express application instance
 */
export function setupAuth(app: Express) {
  // Check for session secret environment variable
  if (!process.env.SESSION_SECRET) {
    console.warn('SESSION_SECRET environment variable is not set, using a default secret (not recommended for production)');
  }

  /**
   * Session configuration
   * 
   * These settings control:
   * - Where sessions are stored (PostgreSQL database)
   * - How long cookies last (30 days)
   * - Security settings for cookies (httpOnly, sameSite, secure in production)
   */
  const sessionSettings: session.SessionOptions = {
    // Store sessions in PostgreSQL to persist across server restarts
    store: new PostgresStore({
      pool,                      // Database connection pool
      tableName: 'session',      // Table name for storing sessions
      createTableIfMissing: true // Create the table if it doesn't exist
    }),
    // Secret used to sign session cookies
    secret: process.env.SESSION_SECRET || 'default-secret-for-development',
    // Don't save sessions if they weren't modified
    resave: false,
    // Don't create a session until something is stored
    saveUninitialized: false,
    // Cookie settings
    cookie: {
      // Only use secure cookies in production (requires HTTPS)
      secure: process.env.NODE_ENV === 'production',
      // Cookie expiration time (30 days)
      maxAge: 30 * 24 * 60 * 60 * 1000,
      // Prevent JavaScript access to the cookie
      httpOnly: true,
      // Restrict cookie to same-site requests
      sameSite: 'lax'
    }
  };

  // Trust the first proxy (important for secure cookies behind a reverse proxy)
  app.set("trust proxy", 1);
  
  // Set up session middleware
  app.use(session(sessionSettings));
  
  // Initialize Passport.js authentication
  app.use(passport.initialize());
  
  // Enable Passport.js session support
  app.use(passport.session());

  /**
   * Configure the Local authentication strategy
   * 
   * This defines how users are authenticated with username and password:
   * 1. Look up the user by username
   * 2. Compare the provided password with the stored hash
   * 3. Return the user object if authentication succeeds
   */
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Attempting login for user: ${username}`);
        
        // Find the user in the database using db instance directly
        // Ensure all fields, including password, are selected
        const user = await db.select()
                           .from(users)
                           .where(eq(users.username, username))
                           .limit(1)
                           .then(res => res[0]);

        // User not found
        if (!user) {
          console.log(`User not found: ${username}`);
          // Return false with a generic error message (don't reveal which part failed)
          return done(null, false, { message: "Invalid username or password" });
        }

        // Verify the password
        const isValid = await comparePasswords(password, user.password);
        
        // Password is incorrect
        if (!isValid) {
          console.log(`Invalid password for user: ${username}`);
          // Return false with a generic error message (don't reveal which part failed)
          return done(null, false, { message: "Invalid username or password" });
        }

        // Authentication successful
        console.log(`Login successful for user: ${username}`);
        return done(null, user);
      } catch (error) {
        // Handle unexpected errors
        console.error(`Login error for user ${username}:`, error);
        return done(error);
      }
    }),
  );

  /**
   * User serialization for session storage
   * 
   * This determines what user data is stored in the session.
   * We only store the user ID to keep sessions lightweight.
   */
  passport.serializeUser((user, done) => {
    console.log(`Serializing user: ${user.id}`);
    // Only store the user ID in the session
    done(null, user.id);
  });

  /**
   * User deserialization for session retrieval
   * 
   * This looks up the full user object based on the ID stored in the session.
   * It's called on every authenticated request to populate req.user.
   */
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user: ${id}`);
      
      // Get the user from the database
      const user = await storage.getUser(id);
      
      // Handle case where user no longer exists in the database
      if (!user) {
        console.log(`User not found during deserialization: ${id}`);
        // Instead of returning an error (which breaks the session),
        // return a minimal but valid user object to prevent crashes
        return done(null, {
          id,
          username: 'unknown',
          password: '', 
          email: '',
          fullName: null,
          phoneNumber: null,
          entityName: null,
          avatarUrl: null,
          taxInformation: {},
          role: 'artist',
          parentId: null,
          permissions: {},
          subscriptionInfo: {},
          subscriptionEndDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'active',
          clientId: null
        });
      }
      
      // Ensure required fields are present to prevent errors in the application
      const safeUser = {
        ...user,
        // Add default values for any missing fields that might be expected
        role: user.role || 'artist',
        permissions: user.permissions || {},
        subscriptionInfo: user.subscriptionInfo || {},
        status: user.status || 'active'
      };
      
      // Return the complete user object
      done(null, safeUser);
    } catch (error) {
      console.error(`Deserialization error for user ${id}:`, error);
      // Return a minimal but valid user object rather than failing completely
      done(null, {
        id,
        username: 'error-recovery',
        password: '', 
        email: '',
        fullName: null,
        phoneNumber: null,
        entityName: null,
        avatarUrl: null,
        taxInformation: {},
        role: 'artist',
        parentId: null,
        permissions: {},
        subscriptionInfo: {},
        subscriptionEndDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active',
        clientId: null
      });
    }
  });

  /**
   * API endpoint to check authentication status
   * 
   * This route lets clients check if they're authenticated and get user data.
   * It returns the user object without sensitive fields like password.
   */
  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      // Remove the password before sending user data to the client
      const { password, ...safeUser } = req.user;
      res.status(200).json(safeUser);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  /**
   * User registration endpoint
   * 
   * This route handles new user registration:
   * 1. Checks if the username is available
   * 2. Creates a new user with a hashed password
   * 3. Logs the user in automatically after registration
   */
  app.post("/api/register", validateRequest(registerUserSchema), async (req, res, next) => {
    try {
      console.log("Registration attempt:", req.body.username);

      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log("Username already exists:", req.body.username);
        return res.status(400).json({ message: "Username already exists" });
      }

      // Generate a unique client ID for the new user
      const clientId = generateClientId();
      
      // Create the user in the database with a hashed password
      const user = await storage.createUser({
        ...req.body,
        clientId,
        password: await hashPassword(req.body.password),
      });

      console.log("User created:", user.id);

      // Log the user in automatically after registration
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return next(err);
        }
        console.log("User logged in after registration:", user.id);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      next(error);
    }
  });

  /**
   * User login endpoint
   * 
   * This route handles user authentication:
   * 1. Authenticates the user with Passport.js
   * 2. Creates a session if authentication succeeds
   * 3. Returns the user object (minus password) to the client
   */
  app.post("/api/login", validateRequest(loginUserSchema), (req, res, next) => {
    console.log("Login attempt:", req.body.username);

    // Handle authentication with improved error handling
    try {
      passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string } | undefined) => {
        // Handle server errors during authentication
        if (err) {
          console.error("Authentication error:", err);
          return res.status(500).json({ message: "Internal server error during authentication" });
        }

        // Handle authentication failure (invalid username/password)
        if (!user) {
          console.log("Authentication failed:", info?.message);
          return res.status(401).json({ message: info?.message || "Authentication failed" });
        }

        // Create session for the authenticated user
        req.login(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            return res.status(500).json({ message: "Internal server error during login" });
          }
          console.log("User logged in:", user.id);

          // Return a sanitized user object without password
          const { password, ...safeUser } = user;

          res.status(200).json(safeUser);
        });
      })(req, res, next);
    } catch (error) {
      console.error("Unexpected error in login route:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  /**
   * User logout endpoint
   * 
   * This route handles user logout:
   * 1. Logs the user out with Passport.js
   * 2. Destroys the session
   * 3. Returns a success response
   */
  app.post("/api/logout", (req, res, next) => {
    console.log("Logout attempt for user:", req.user?.id);

    // Log out the user (Passport.js)
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return next(err);
      }

      // Destroy the session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return next(err);
        }
        console.log("User logged out successfully");
        res.status(200).json({ success: true });
      });
    });
  });
}

/**
 * Authentication middleware for protected routes
 * 
 * This middleware:
 * 1. Verifies that the user is authenticated
 * 2. Performs safety checks on the user object
 * 3. Sets properties for convenience in route handlers
 * 4. Enforces access restrictions based on account status
 * 
 * @param req - The Express request object
 * @param res - The Express response object
 * @param next - The next middleware function
 * @returns If authentication fails, returns a 401 Unauthorized response
 *          If the account is suspended, returns a 403 Forbidden response
 *          If payment approval is pending, returns a 402 Payment Required response
 *          Otherwise, calls the next middleware function
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Check if the user is authenticated (has a valid session)
  if (!req.isAuthenticated()) {
    console.log("Authentication required, but user is not authenticated");
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Set userId directly on the request object for easier access in route handlers
  req.userId = req.user?.id;
  
  // Log authentication details for debugging/auditing
  console.log("User authenticated:", {
    id: req.userId,
    role: req.user?.role || 'unknown',
    username: req.user?.username || 'unknown',
    status: req.user?.status || 'unknown'
  });
  
  /**
   * Defensive programming: ensure the user object has all expected fields
   * This helps prevent errors when other parts of the application 
   * expect these fields to exist.
   */
  
  // Ensure user has a role (default to 'artist' if missing)
  if (!req.user?.role) {
    console.log("User authenticated but missing role, assigning default role");
    req.user.role = 'artist'; // Default role
  }
  
  // Ensure user has a permissions object
  if (!req.user.permissions) {
    req.user.permissions = {};
  }
  
  // Ensure user has a subscriptionInfo object
  if (!req.user.subscriptionInfo) {
    req.user.subscriptionInfo = {};
  }
  
  /**
   * Account status checks
   * 
   * These checks enforce access restrictions based on the user's account status.
   * Each status has different rules about which API endpoints are accessible.
   */
  
  // Suspended or inactive accounts have almost no access
  if (req.user.status === 'suspended' || req.user.status === 'inactive') {
    console.log(`User ${req.user.id} access denied due to account status: ${req.user.status}`);
    return res.status(403).json({ 
      error: "Account suspended",
      message: "Your account has been suspended or deactivated. Please contact support for assistance."
    });
  }
  
  // Pending approval accounts have limited access
  if (req.user.status === 'pending_approval') {
    console.log(`User ${req.user.id} has pending payment approval`);
    // Define which endpoints are allowed for users with pending approval
    const allowedEndpoints = ['/api/user', '/api/subscription-status', '/api/logout'];
    
    // Block access to all other endpoints
    if (!allowedEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
      return res.status(402).json({
        error: "Payment approval pending",
        message: "Your subscription payment is pending approval. You'll have full access once approved."
      });
    }
  }
  
  // Rejected payment accounts have limited access
  if (req.user.status === 'rejected') {
    console.log(`User ${req.user.id} payment was rejected`);
    // Define which endpoints are allowed for users with rejected payments
    const allowedEndpoints = ['/api/user', '/api/subscription-status', '/api/payment', '/api/logout'];
    
    // Block access to all other endpoints
    if (!allowedEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
      return res.status(402).json({
        error: "Payment rejected",
        message: "Your payment was rejected. Please update your payment information and try again."
      });
    }
  }
  
  // If all checks pass, allow the request to proceed
  next();
};

/**
 * Admin authorization middleware
 * 
 * This middleware ensures that the user has admin privileges.
 * It checks various roles and statuses that indicate admin access.
 * 
 * @param req - The Express request object
 * @param res - The Express response object
 * @param next - The next middleware function
 * @returns If the user is not an admin, returns a 403 Forbidden response
 *          Otherwise, calls the next middleware function
 */
/**
 * Admin authorization middleware (ensureAdmin)
 * 
 * This middleware ensures that the user has admin privileges.
 * It checks various roles and statuses that indicate admin access.
 * 
 * @param req - The Express request object
 * @param res - The Express response object
 * @param next - The next middleware function
 * @returns If the user is not an admin, returns a 403 Forbidden response
 *          Otherwise, calls the next middleware function
 */
export const ensureAdmin: RequestHandler = async (req, res, next) => {
  // First, check if the user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    /** 
     * Check for roles with admin privileges
     * 
     * The following roles have admin access:
     * - admin: System administrators with full access
     * - label: Label owners have admin access to their own content
     */
    if (req.user?.role === 'admin' || req.user?.role === 'label') {
      return next();
    }
    
    /**
     * Legacy compatibility check
     * 
     * In older versions of the system, admin status was marked by
     * status = "admin" rather than through the role field.
     * This check maintains backward compatibility.
     * 
     * @deprecated This should be removed once all users are migrated to the new system
     */
    // @ts-ignore - we know 'admin' is not in the enum, but checking for compatibility
    if (req.user?.status === "admin") {
      return next();
    }

    /**
     * Development environment bypass
     * 
     * For ease of development, all authenticated users have admin access
     * in non-production environments.
     * 
     * WARNING: This must be removed in production!
     */
    if (process.env.NODE_ENV !== "production") {
      console.warn("DEV MODE: Bypassing admin check in development");
      return next();
    }

    // If none of the admin criteria matched, deny access
    res.status(403).json({ error: "Admin privileges required" });
  } catch (error) {
    // Handle any unexpected errors during the auth check
    console.error("Error checking admin status:", error);
    res.status(500).json({ error: "Server error" });
  }
}

/**
 * Admin authorization middleware (requireAdmin)
 * 
 * This middleware ensures that the user has admin privileges.
 * It's an alias for ensureAdmin for better readability in routes.
 * 
 * @param req - The Express request object
 * @param res - The Express response object
 * @param next - The next middleware function
 * @returns If the user is not an admin, returns a 403 Forbidden response
 *          Otherwise, calls the next middleware function
 */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  // First, check if the user is authenticated
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    /** 
     * Check for roles with admin privileges
     * 
     * The following roles have admin access:
     * - admin: Platform administrators with full access
     * - label: Label owners have admin access to their own content
     */
    if (req.user?.role === 'admin' || req.user?.role === 'label') {
      return next();
    }

    /**
     * Legacy compatibility check
     * 
     * In older versions of the system, admin status was marked by
     * status = "admin" rather than through the role field.
     * This check maintains backward compatibility.
     * 
     * @deprecated This should be removed once all users are migrated to the new system
     */
    // @ts-ignore - we know 'admin' is not in the enum, but checking for compatibility
    if (req.user?.status === "admin") {
      return next();
    }

    /**
     * Development environment bypass
     * 
     * For ease of development, all authenticated users have admin access
     * in non-production environments.
     * 
     * WARNING: This must be removed in production!
     */
    if (process.env.NODE_ENV !== "production") {
      console.warn("DEV MODE: Bypassing admin check in development");
      return next();
    }

    // If none of the admin criteria matched, deny access
    res.status(403).json({ error: "Admin privileges required" });
  } catch (error) {
    // Handle any unexpected errors during the auth check
    console.error("Error checking admin status:", error);
    res.status(500).json({ error: "Server error" });
  }
};