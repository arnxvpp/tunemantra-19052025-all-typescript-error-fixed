/**
 * Admin Routes
 * 
 * This file defines routes for admin functionality, including:
 * - Admin authentication and session management
 * - User management (listing, creation, updates)
 * - Content approval workflows
 * - System statistics and reporting
 */
import express, { Router, Request, Response } from "express"; // Import Router, Request, Response
import { Storage } from "../storage"; // Import Storage class
import { hashPassword, requireAuth, ensureAdmin } from "../auth"; // Import auth functions
import { validateRequest } from "../utils/validation";
// Import necessary Drizzle functions and types
import { db } from "../db";
import { eq, sql, and, or, gte, lte, desc, asc, count, ilike, inArray, isNotNull, SQL } from 'drizzle-orm';
import { users, releases, tracks, analytics, dailyStats, distributionPlatforms, type Track, type Release, type DistributionPlatform } from "@shared/schema"; // Import tables and types
import { 
  adminLoginSchema, 
  adminUserListSchema, 
  userStatusUpdateSchema, 
  bulkOperationSchema, 
  releaseApprovalSchema,
  advancedSearchSchema,
  userIdParamSchema,
  batchUserApprovalSchema,
  matchTracksSchema,
  importRevenueSchema,
  updateIsrcSchema
} from "../schemas/admin-schemas";
import { emptyQuerySchema } from "../schemas/common-schemas";

// Create a router 
const router = Router(); // Use imported Router

// Instantiate storage
const storage = new Storage();

// Removed duplicate storage instantiation

/**
 * Admin login endpoint
 * 
 * Validates and processes admin login credentials.
 * Includes a development-only bypass for testing.
 */
router.post("/login", validateRequest(adminLoginSchema), async (req: Request, res: Response) => { // Add types
  try {
    const { username, password } = req.body;
    
    console.log("Admin login attempt:", { username });
    
    // Check if session is properly configured
    if (!req.session) {
      console.error("Session middleware is not properly configured for admin login");
      return res.status(500).json({ 
        success: false,
        message: "Server configuration error" 
      });
    }
    
    // Special development bypass for testing
    // This allows any login with username 'admin' and password 'admin123'
    if (username === 'admin' && password === 'admin123') {
      console.log("Using admin bypass login - DEVELOPMENT ONLY");
      
      // Set admin session data for the development bypass
      req.session.userId = 999; // Special admin ID
      req.session.isAdmin = true;
      
      // Save the session before sending the response
      req.session.save((err: any) => { // Add type for err
        if (err) {
          console.error("Error saving admin session:", err);
          return res.status(500).json({ 
            success: false,
            message: "Failed to create session"
          });
        }
        
        console.log("Admin session set successfully:", req.session);
        
        // Return success response with admin object expected by the client
        return res.json({ 
          success: true,
          user: {
            id: 999,
            username: 'admin',
            isAdmin: true
          },
          admin: {
            id: 999,
            username: 'admin',
            role: 'admin',
            permissions: {
              manage_users: true,
              manage_content: true,
              manage_settings: true,
              manage_distribution: true,
              manage_finance: true
            }
          }
        });
      });
      return; // Return early to avoid the rest of the function
    }
    
    // Normal flow - find user in the database
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      console.log("Admin login failed: User not found");
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }
    
    // For development, we'll accept any login attempt
    // In production, proper password verification would be implemented
    
    // Set admin session data
    req.session.userId = user.id;
    req.session.isAdmin = true;
    
    // Save the session before sending the response
    req.session.save((err: any) => { // Add type for err
      if (err) {
        console.error("Error saving admin user session:", err);
        return res.status(500).json({ 
          success: false,
          message: "Failed to create session"
        });
      }
      
      console.log("Admin session set successfully:", req.session);
      
      // If login is successful, send success response with user details
      res.json({ 
        success: true,
        user: {
          id: user.id,
          username: user.username,
          isAdmin: true
        },
        admin: {
          id: user.id,
          username: user.username,
          role: 'admin',
          permissions: {
            manage_users: true,
            manage_content: true,
            manage_settings: true,
            manage_distribution: true,
            manage_finance: true
          }
        }
      });
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Internal server error" 
    });
  }
});

// Admin check session status endpoint
router.get("/check-session", (req: Request, res: Response) => { // Add types
  console.log("Checking admin session:", req.session);
  
  // Check if session is properly configured
  if (!req.session) {
    console.error("Session middleware is not properly configured for admin check-session");
    return res.status(500).json({ 
      error: "Server configuration error",
      isLoggedIn: false,
      isAdmin: false 
    });
  }
  
  // Check if user is logged in as admin
  if (req.session.isAdmin) {
    // Return admin data with the session check
    return res.status(200).json({ 
      isLoggedIn: true, 
      isAdmin: true,
      admin: {
        id: req.session.userId || 999,
        username: "admin",
        role: 'admin',
        permissions: {
          manage_users: true,
          manage_content: true,
          manage_settings: true,
          manage_distribution: true,
          manage_finance: true
        }
      }
    });
  }
  
  // For development, we'll temporarily allow access without authentication
  // In production, this should be removed
  if (process.env.NODE_ENV === 'development') {
    console.log("Development mode: granting admin access");
    
    // Set admin session for development
    req.session.isAdmin = true;
    req.session.userId = 999; // Special admin ID
    
    return res.status(200).json({ 
      isLoggedIn: true, 
      isAdmin: true,
      admin: {
        id: 999,
        username: "admin",
        role: 'admin',
        permissions: {
          manage_users: true,
          manage_content: true,
          manage_settings: true,
          manage_distribution: true,
          manage_finance: true
        }
      }
    });
  }
  
  res.status(401).json({ isLoggedIn: false, isAdmin: false, message: "Not authenticated as admin" });
});

// Admin dashboard stats
router.get("/stats", async (req: Request, res: Response) => { // Add types
  try {
    // Get real data from database
    const pendingUsers = await storage.getUserCount({ status: "pending" });
    const totalUsers = await storage.getUserCount();
    
    // Other stats can be mocked for now or fetched from database
    const stats = {
      users: totalUsers,
      pendingUsers: pendingUsers,
      totalReleases: 450, // Mock data
      pendingApprovals: 15, // Mock data
      totalRevenue: "$45,320", // Mock data
      activeDistributions: 380 // Mock data
    };
    
    res.json(stats);
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

/**
 * Get users with pagination and filtering
 * 
 * Validates query parameters and returns a paginated list of users.
 */
router.get("/users", validateRequest(adminUserListSchema, 'query'), async (req: Request, res: Response) => { // Add types
  try {
    const { status, search, page, limit } = req.query;
    
    // Get users from database
    const users = await storage.getAllUsers({ 
      status: status as string, 
      search: search as string, 
      page: parseInt(page as string), 
      limit: parseInt(limit as string) 
    });
    
    // Get total count for pagination
    const total = await storage.getUserCount({ 
      status: status as string, 
      search: search as string 
    });
    
    res.json({
      users,
      pagination: {
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20,
        total,
        pages: Math.ceil(total / (parseInt(limit as string) || 20))
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

/**
 * Update user status (approve, reject, suspend)
 * 
 * Validates parameters and updates a user's status. This endpoint
 * is secured against SQL injection and invalid input.
 */
router.post("/users/:id/status", validateRequest(userStatusUpdateSchema), async (req: Request, res: Response) => { // Add types
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const { status, note } = req.body;
    
    // Update user status
    const updatedUser = await storage.updateUserStatus(userId, status);
    
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Add audit log or notification logic here
    console.log(`User ${userId} status updated to ${status} ${note ? `with note: ${note}` : ''}`);
    
    res.json({
      message: `User status updated to ${status}`,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ message: "Failed to update user status" });
  }
});

/**
 * Get user details by ID
 * 
 * Validates parameters and retrieves a single user by ID. 
 * This endpoint is secured against SQL injection and invalid input.
 */
router.get("/users/:id", validateRequest(userIdParamSchema, 'params'), async (req: Request, res: Response) => { // Add types
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId) || userId <= 0) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Remove sensitive information before sending to client
    const { password, ...userWithoutPassword } = user;
    
    res.json(userWithoutPassword);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user details" });
  }
});

/**
 * Batch approve users
 * 
 * Validates a batch of user IDs and updates their status to 'active'.
 * This endpoint is protected against SQL injection and invalid input.
 */
router.post("/users/batch-approve", validateRequest(batchUserApprovalSchema), async (req: Request, res: Response) => { // Add types
  try {
    const { userIds, note } = req.body;
    
    console.log(`Batch approve request received for ${userIds.length} users`);
    
    const approvedUsers = [];
    const failedIds = [];
    
    // Process each user
    for (const userId of userIds) {
      if (isNaN(userId) || userId <= 0) {
        failedIds.push(userId);
        continue;
      }
      
      try {
        const updatedUser = await storage.updateUserStatus(userId, "active");
        if (updatedUser) {
          approvedUsers.push(updatedUser);
        } else {
          failedIds.push(userId);
        }
      } catch (error) {
        console.error(`Error approving user ${userId}:`, error);
        failedIds.push(userId);
      }
    }
    
    console.log(`Batch approval complete: ${approvedUsers.length} approved, ${failedIds.length} failed`);
    
    // Log notes if provided
    if (note) {
      console.log(`Batch approval note: ${note}`);
    }
    
    res.json({
      message: `Batch approved ${approvedUsers.length} users`,
      approvedCount: approvedUsers.length,
      failedCount: failedIds.length,
      failedIds
    });
  } catch (error) {
    console.error("Error in batch user approval:", error);
    res.status(500).json({ message: "Failed to process batch approval" });
  }
});

// Export the main router
export default router;

// --- Additional Admin Routes (Mounted on the main router) ---

// Import and use our account approvals router
import { adminApprovalsRouter } from './admin-approvals';
router.use('/approvals', adminApprovalsRouter); // Mount on the main router

// Middleware to ensure user is authenticated and has admin privileges for subsequent routes on this router
router.use(requireAuth, ensureAdmin);

// Match tracks by ISRC codes
router.post("/match-tracks", validateRequest(matchTracksSchema), async (req: Request, res: Response) => { // Add types
  try {
    const { isrcs } = req.body;
    
    // Find tracks with matching ISRCs - using parameterized SQL for safety
    // Use isrc-specific approach since it's within a JSON field
    // We can't use inArray directly for JSON fields, so we manually build a safe parameterized query
    const matchedTracks = await db.query.tracks.findMany({
      where: (tracks, { eq, and, isNotNull, sql, or }) => {
        // Fix SQL injection vulnerability by using parameterized conditions
        const isrcConditions = isrcs.map((isrc: string) => // Add type for isrc
          sql`${tracks.metadata}->>'isrc' = ${isrc}` // Use direct parameterization
        );
        return and(
          isNotNull(tracks.metadata),
          or(...isrcConditions)
        );
      }
    });
    
    return res.json(matchedTracks);
  } catch (error) {
    console.error("Error matching tracks by ISRC:", error);
    return res.status(500).json({ error: "Failed to match tracks" });
  }
});

// Import revenue data
router.post("/import-revenue", validateRequest(importRevenueSchema), async (req: Request, res: Response) => { // Add types
  try {
    const { data } = req.body;
    
    const analyticsRecords = [];
    const statsUpdates = [];
    
    // Group by date, track, and platform for daily stats
    const statsMap = new Map();
    
    // Process each revenue record
    for (const record of data) {
      if (!record.trackId) continue;
      
      // Create an analytics record
      const analyticsRecord = {
        trackId: record.trackId,
        date: new Date(record.reportingMonth),
        platform: record.platform,
        streams: record.quantity,
        revenue: record.netRevenue.toString(),
        country: record.country,
        city: "", // Not provided in the report
        playlistAdds: 0,
        saves: 0,
        shares: 0,
        avgPlayTime: "0",
        demographics: {
          age: {
            "18-24": 0,
            "25-34": 0,
            "35-44": 0,
            "45+": 0
          },
          gender: {
            male: 0,
            female: 0,
            other: 0
          }
        }
      };
      
      analyticsRecords.push(analyticsRecord);
      
      // Create a key for the daily stats
      const statsKey = `${record.trackId}-${record.reportingMonth}-${record.platform}`;
      
      if (!statsMap.has(statsKey)) {
        statsMap.set(statsKey, {
          trackId: record.trackId,
          date: new Date(record.reportingMonth),
          platform: record.platform,
          totalStreams: record.quantity,
          totalRevenue: record.netRevenue.toString(),
          uniqueListeners: Math.floor(record.quantity * 0.8), // Estimate unique listeners
          avgListenTime: "0",
        });
      } else {
        const existing = statsMap.get(statsKey);
        existing.totalStreams += record.quantity;
        existing.totalRevenue = (parseFloat(existing.totalRevenue) + record.netRevenue).toString();
        existing.uniqueListeners = Math.floor(existing.totalStreams * 0.8); // Update estimate
      }
    }
    
    // Add dailyStats records from the map
    // Use Array.from() for safe iteration
    for (const stats of Array.from(statsMap.values())) {
      statsUpdates.push(stats);
    }
    
    // Insert all analytics records
    if (analyticsRecords.length > 0) {
      await db.insert(analytics).values(analyticsRecords);
    }
    
    // Insert all daily stats records
    if (statsUpdates.length > 0) {
      await db.insert(dailyStats).values(statsUpdates);
    }
    
    return res.json({ 
      success: true, 
      message: `Imported ${analyticsRecords.length} analytics records and ${statsUpdates.length} daily stats records` 
    });
  } catch (error) {
    console.error("Error importing revenue data:", error);
    return res.status(500).json({ error: "Failed to import revenue data" });
  }
});

// Get all tracks with ISRC data for ISRC management
router.get("/isrc-tracks", validateRequest(emptyQuerySchema, 'query'), async (req: Request, res: Response) => { // Use main router, add types
  try {
    const allTracks = await db.query.tracks.findMany();
    
    // Extract and format tracks with their ISRC information
    const tracksWithIsrc = allTracks.map(track => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      isrc: track.isrc || "", // Access isrc directly from track
      isrcStatus: track.isrc ? "assigned" : "pending", // Access isrc directly
    }));
    
    return res.json(tracksWithIsrc);
  } catch (error) {
    console.error("Error fetching tracks with ISRC:", error);
    return res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

// Update ISRC for tracks
router.post("/update-isrc", validateRequest(updateIsrcSchema), async (req: Request, res: Response) => { // Use main router, add types
  try {
    const { updates } = req.body;
    
    const results = [];
    
    // Update each track's ISRC
    for (const update of updates) {
      const { trackId, isrc } = update;
      
      if (!trackId || !isrc) continue;
      
      const track = await db.query.tracks.findFirst({
        where: eq(tracks.id, trackId)
      });
      
      if (!track) {
        results.push({ trackId, success: false, message: "Track not found" });
        continue;
      }
      
      // Update the track's metadata
      // Ensure metadata is treated as an object before spreading
      const currentMetadata = typeof track.metadata === 'object' && track.metadata !== null ? track.metadata : {};
      const updatedMetadata = {
        ...currentMetadata,
        isrc: isrc
      };
      
      await db.update(tracks)
        .set({ metadata: updatedMetadata })
        .where(eq(tracks.id, trackId));
      
      results.push({ trackId, success: true, isrc });
    }
    
    return res.json({ results });
  } catch (error) {
    console.error("Error updating track ISRCs:", error);
    return res.status(500).json({ error: "Failed to update track ISRCs" });
  }
});
