import { Router, Request, Response } from 'express';
import { db } from '../db';
import { accountApprovals, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { Storage } from '../storage'; // Import class
import { updateAccountApprovalStatus } from '../services/payment';
import { ensureAdmin } from '../auth'; // Assuming ensureAdmin is correctly defined in auth
import { validateRequest } from '../utils/validation';
import { 
  userIdParamSchema, 
  approvalActionSchema, 
  approvalNotesSchema
} from '../schemas/admin-schemas';

export const adminApprovalsRouter = Router();

// Instantiate storage
const storage = new Storage(); // Create instance

// Get all users pending approval
adminApprovalsRouter.get('/pending', ensureAdmin, async (req: Request, res: Response) => {
  try {
    // Find all users with pending_approval status
    const pendingUsers = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.status, 'pending_approval'),
      with: {
        // Include approval details if they exist
        approvals: true // Assuming 'approvals' is the relation name in usersRelations
      }
    });

    return res.status(200).json({
      success: true,
      users: pendingUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        entityName: user.entityName,
        role: user.role,
        createdAt: user.createdAt,
        subscriptionInfo: user.subscriptionInfo,
        approvalDetails: (user as any).approvals // Access relation data (adjust type if needed)
      }))
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals'
    });
  }
});

/**
 * Approve or reject a user account
 * 
 * Validates the userId and action parameters, then performs the approval/rejection.
 * This endpoint is secured against SQL injection and other security vulnerabilities.
 */
adminApprovalsRouter.post(
  '/:userId/:action', 
  ensureAdmin,
  validateRequest(approvalActionSchema, 'params'),
  validateRequest(approvalNotesSchema),
  async (req: Request, res: Response) => {
    try {
      const { userId, action } = req.params;
      const { notes } = req.body;
      
      // Convert userId to integer (validation already confirmed it's a valid number)
      const userIdInt = parseInt(userId);
      
      // Get admin user ID from the request (assuming it's attached by auth middleware)
      const adminUserId = (req.user as any)?.id; // Adjust based on how user is attached
      if (!adminUserId) {
        return res.status(401).json({
          success: false,
          message: 'Admin user ID not found in request' // More specific error
        });
      }
      
      // Validate admin permissions (second layer of security)
      // This is in addition to the ensureAdmin middleware
      const admin = await storage.getUserById(adminUserId); // Use getUserById
      if (!admin || !['admin'].includes(admin.role || '')) { // Check for 'admin' role
        console.error(`Unauthorized approval attempt by user ${adminUserId} for user ${userId}`);
        return res.status(403).json({
          success: false,
          message: 'Administrator privileges required'
        });
      }

      // Update the user's approval status
      const result = await updateAccountApprovalStatus(
        userIdInt,
        action as 'approved' | 'rejected', // Type has been validated by the schema
        adminUserId,
        notes || 'Approved by admin'
      );

      // Log the approval action for audit purposes
      console.log(`Admin ${adminUserId} ${action} user ${userId} with notes: ${notes || 'No notes provided'}`);

      return res.status(200).json({
        success: true,
        message: `User account has been ${action}`,
        user: result.user // Assuming updateAccountApprovalStatus returns { user: ... }
      });
    } catch (error: any) {
      console.error(`Error ${req.params.action} user:`, error);
      return res.status(500).json({
        success: false,
        message: error.message || `Failed to process user account ${req.params.action} request`
      });
    }
  }
);

/**
 * Get approval details for a specific user
 * 
 * Route validates the userId parameter, then fetches and returns approval 
 * details for the specified user. Secured against SQL injection and other
 * security vulnerabilities.
 */
adminApprovalsRouter.get(
  '/:userId', 
  ensureAdmin,
  validateRequest(userIdParamSchema, 'params'),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      
      // Get user details - since userId is validated, parsing is safe
      const userIdInt = parseInt(userId);
      const user = await storage.getUserById(userIdInt); // Use getUserById
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get approval details
      const approvalDetails = await db.query.accountApprovals.findFirst({
        where: (approvals, { eq }) => eq(approvals.userId, userIdInt)
      });

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          entityName: user.entityName,
          role: user.role,
          status: user.status,
          subscriptionInfo: user.subscriptionInfo
        },
        approvalDetails
      });
    } catch (error) {
      console.error('Error fetching approval details:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch approval details'
      });
    }
  }
);