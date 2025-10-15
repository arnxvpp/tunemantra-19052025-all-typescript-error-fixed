/**
 * Database Schema Definition
 * 
 * This file defines the structure of our PostgreSQL database using Drizzle ORM.
 * The schema defines tables, columns, relationships, and types for our database.
 * 
 * Key concepts:
 * - pgTable: Creates a new database table
 * - pgEnum: Creates a PostgreSQL enum type (a list of allowed values)
 * - Relations: Defines how tables are connected to each other
 * - Zod schemas: Provides validation for data insertion
 */

// Import Drizzle ORM relations to define connections between tables
import { relations, sql, eq, and, or, desc, asc, count, SQL, Column, ilike, inArray } from "drizzle-orm"; // Added ilike, inArray
// Import PgColumn specifically if needed, otherwise Column might suffice
import { PgColumn } from "drizzle-orm/pg-core";


// Import PostgreSQL-specific column types from Drizzle ORM
import { pgTable, serial, text, timestamp, integer, boolean, json, pgEnum, numeric, date, varchar } from "drizzle-orm/pg-core";

// Import zod for validation schemas
import { z } from "zod";
import { format } from 'date-fns'; // Import date-fns format function

// Import utility to create insert validation schemas based on database tables
import { createInsertSchema } from "drizzle-zod";

import { db } from './db'; // Assuming db instance is exported from db.ts
// Import table definitions and types directly from the shared schema file
import {
  users, releases, tracks, analytics, supportTickets, ticketReplies, // Added ticketReplies
  distributionPlatforms, distributionRecords, scheduledDistributions, // Added distribution tables
  subLabelAuditLogs, permissionTemplates, releaseApprovals, // Added admin/sub-label tables
  paymentMethods, withdrawals, // Added payment tables
  apiKeys, // Added apiKeys
  nftTokens, rightsRecords, rightsVerifications, blockchainTransactions, rightsDisputes, // Added blockchain/rights tables
  accountApprovals, // Added accountApprovals
  whiteLabelSettings, // Added whiteLabelSettings
  assetBundles, assetVersions, bundleAnalytics, importBatches, // Added asset bundle tables
  type User, type Release, type Track, type Analytics, type SupportTicket, type TicketReply, // Added TicketReply type
  type DistributionPlatform, type DistributionRecord, type ScheduledDistribution, // Added distribution types
  type SubLabelAuditLog, type PermissionTemplate, type ReleaseApproval, // Added admin/sub-label types
  type PaymentMethod, type Withdrawal, // Added payment types
  type ApiKey, // Added ApiKey type
  type NftToken, type RightsRecord, type RightsVerification, type BlockchainTransaction, type RightsDispute, // Added blockchain/rights types
  type AccountApproval, // Added AccountApproval type
  type WhiteLabelSetting, // Added WhiteLabelSetting type
  type AssetBundle, type AssetVersion, type BundleAnalytics, type ImportBatch, // Added asset bundle types
  type InsertUser, type InsertRelease, type InsertTrack, type InsertAnalytics, type InsertSupportTicket, type InsertTicketReply, // Added InsertTicketReply
  type InsertDistributionPlatform, type InsertDistributionRecord, type InsertScheduledDistribution, // Added distribution insert types
  type InsertSubLabelAuditLog, type InsertPermissionTemplate, type InsertReleaseApproval, // Added admin/sub-label insert types
  type InsertPaymentMethod, type InsertWithdrawal, // Added payment insert types
  type InsertApiKey, // Added InsertApiKey type
  type InsertNftToken, type InsertRightsRecord, type InsertRightsVerification, type InsertBlockchainTransaction, type InsertRightsDispute, // Added blockchain/rights insert types
  type InsertAccountApproval, // Added InsertAccountApproval type
  type InsertWhiteLabelSetting, // Added InsertWhiteLabelSetting type
  type InsertAssetBundle, type InsertAssetVersion, type InsertBundleAnalytics, type InsertImportBatch // Added asset bundle insert types
} from '@shared/schema';

// Helper function to create SQL filter conditions
function createSqlFilter(filters: SQL[]): SQL | undefined {
  if (filters.length === 0) return undefined;
  return and(...filters);
}


/**
 * User Role Enumeration
 * 
 * This creates a PostgreSQL enum type that restricts the 'role' column 
 * to only these specific values. Each role has different permissions
 * and pricing tiers in the platform.
 */
export const userRoleEnum = pgEnum('user_role', [
  'admin',             // Complete system access (platform owner)
  'label',             // Manage label settings, create sub-labels (6000 INR/year)
  'artist_manager',    // Manage multiple artists (2499 INR/year)
  'artist',            // Upload content, track performance (999 INR/year)
  'team_member'        // Employee of label/artist with limited permissions (role assigned by admins)
]);

/**
 * User Account Status Enumeration
 * 
 * This enum tracks the current state of a user account.
 * It helps manage the user lifecycle from registration to termination.
 */
export const userStatusEnum = pgEnum('user_status', [
  'active',            // Account is active and can access all features
  'pending',           // Account is waiting for initial setup/verification
  'pending_approval',  // Account is waiting for admin approval after payment
  'suspended',         // Account is temporarily disabled (temporary block)
  'rejected',          // Account was rejected by admin (permanent rejection)
  'inactive'           // Account is not active (e.g., expired subscription)
]);

/**
 * Approval Status Enumeration
 * 
 * This enum is used for tracking approval workflows, particularly
 * for new accounts that require admin review before activation.
 */
export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',           // Waiting for admin review
  'approved',          // Account has been approved
  'rejected'           // Account has been rejected
]);

// Note: SuperAdmin table has been removed in favor of consolidated 'admin' role
// All administrator accounts are now managed through the users table with role='admin'
// This comment is kept for reference to the previous implementation

// Commented out table definitions as they are now imported from @shared/schema
// ... (commented out table definitions) ...

// Storage class definition
export class Storage {
  // --- User Methods ---
  async getUserById(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).limit(1).then(res => res[0]);
  }

  // Method needed for authentication
  async getUserByUsername(username: string): Promise<User | undefined> {
    // IMPORTANT: Select the password field for authentication checks
    return db.select().from(users).where(eq(users.username, username)).limit(1).then(res => res[0]);
  }
  
  // Added getUser method (alias for getUserById)
  async getUser(id: number): Promise<User | undefined> {
     return this.getUserById(id);
  }


  async createUser(userData: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
     const [updatedUser] = await db.update(users).set({...updateData, updatedAt: new Date()}).where(eq(users.id, id)).returning();
     return updatedUser;
  }
  
  async getAllUsers({ 
    status, 
    role, 
    search, 
    page = 1, 
    limit = 20, 
    sortBy = 'createdAt', 
    sortDir = 'desc' 
  }: {
    status?: string;
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDir?: string;
  } = {}): Promise<User[]> {
    const queryFilters: SQL[] = [];
    if (status) queryFilters.push(eq(users.status, status as any)); // Cast status if needed
    if (role) queryFilters.push(eq(users.role, role as any)); // Cast role if needed
    if (search) {
      const searchPattern = `%${search}%`;
      // Ensure fullName is checked if it exists on the users table
      const searchConditions: (SQL | undefined)[] = [ // Allow undefined in array
          ilike(users.username, searchPattern), 
          ilike(users.email, searchPattern)
      ];
      if (users.fullName) {
          searchConditions.push(ilike(users.fullName, searchPattern));
      }
      // Filter out undefined before spreading into or()
      const validSearchConditions = searchConditions.filter((c): c is SQL => c !== undefined); // Use type predicate
      if (validSearchConditions.length > 0) {
          const orCondition = or(...validSearchConditions);
          if (orCondition) { // Explicitly check if orCondition is not undefined
             queryFilters.push(orCondition); 
          }
      }
    }

    const whereCondition = queryFilters.length > 0 ? and(...queryFilters) : undefined;

    let orderByClause: SQL | SQL[] | undefined;
    // Add fullName to valid sort keys if it exists
    const validSortKeys = ['id', 'username', 'email', 'role', 'status', 'createdAt', 'updatedAt'];
    if (users.fullName) validSortKeys.push('fullName'); 

    if (sortBy && sortDir && validSortKeys.includes(sortBy)) {
      const columnKey = sortBy as keyof typeof users.$inferSelect;
      const column = users[columnKey];
      if (column && column._) { // Check if it's a valid column
        orderByClause = sortDir === 'desc' ? desc(column) : asc(column);
      } else {
         console.warn(`Invalid sortBy column specified: ${sortBy}, defaulting to createdAt`);
         orderByClause = desc(users.createdAt);
      }
    } else {
      orderByClause = desc(users.createdAt);
    }

    const offset = (page - 1) * limit;

    return db.select()
             .from(users)
             .where(whereCondition)
             .orderBy(orderByClause)
             .limit(limit)
             .offset(offset);
  }

  async getUserCount({ status, role, search }: { status?: string; role?: string; search?: string; } = {}): Promise<number> {
     const queryFilters: SQL[] = [];
     if (status) queryFilters.push(eq(users.status, status as any));
     if (role) queryFilters.push(eq(users.role, role as any));
     if (search) {
       const searchPattern = `%${search}%`;
        const searchConditions: (SQL | undefined)[] = [ // Allow undefined
            ilike(users.username, searchPattern), 
            ilike(users.email, searchPattern)
        ];
        if (users.fullName) {
            searchConditions.push(ilike(users.fullName, searchPattern));
        }
        // Filter out undefined before spreading into or()
        const validSearchConditions = searchConditions.filter((c): c is SQL => c !== undefined); // Use type predicate
        if (validSearchConditions.length > 0) {
            const orCondition = or(...validSearchConditions);
             if (orCondition) { // Explicitly check if orCondition is not undefined
                queryFilters.push(orCondition);
             }
        }
     }
     const whereCondition = queryFilters.length > 0 ? and(...queryFilters) : undefined;

     const result = await db.select({ count: count() }).from(users).where(whereCondition);
     return result[0]?.count ?? 0;
  }

  async updateUserStatus(id: number, status: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ status: status as any, updatedAt: new Date() }) // Cast status if needed
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // --- Release Methods ---
  async getReleaseById(id: number): Promise<Release | undefined> {
    return db.select().from(releases).where(eq(releases.id, id)).limit(1).then(res => res[0]);
  }

  async getReleasesByUserId(userId: number): Promise<Release[]> {
    return db.select().from(releases).where(eq(releases.userId, userId));
  }
  
  // Added getAllReleases method
  async getAllReleases(): Promise<Release[]> {
     return db.select().from(releases);
  }

  async createRelease(userId: number, releaseData: Omit<InsertRelease, 'userId'>): Promise<Release> {
     const [newRelease] = await db.insert(releases).values({ ...releaseData, userId }).returning();
     return newRelease;
  }

  async updateRelease(id: number, updateData: Partial<InsertRelease>): Promise<Release | undefined> {
     const [updatedRelease] = await db.update(releases).set({...updateData, updatedAt: new Date()}).where(eq(releases.id, id)).returning();
     return updatedRelease;
  }
  
   async countUserReleases(userId: number): Promise<number> {
     const result = await db.select({ count: count() })
       .from(releases)
       .where(eq(releases.userId, userId));
     return result[0]?.count ?? 0;
   }

  // --- Track Methods ---
  async getTracksByUserId(userId: number): Promise<Track[]> {
    // This might need adjustment if tracks should be fetched via releases
    return db.select().from(tracks).where(eq(tracks.userId, userId));
  }
  
  // Added getTracksByReleaseId method
  async getTracksByReleaseId(releaseId: number): Promise<Track[]> {
     return db.select().from(tracks).where(eq(tracks.releaseId, releaseId));
  }
  
   async countReleaseTracks(releaseId: number): Promise<number> {
     const result = await db.select({ count: count() })
       .from(tracks)
       .where(eq(tracks.releaseId, releaseId));
     return result[0]?.count ?? 0;
   }

  // --- Distribution Methods ---
   async getDistributionPlatformById(id: number): Promise<DistributionPlatform | undefined> {
      return db.select().from(distributionPlatforms).where(eq(distributionPlatforms.id, id)).limit(1).then(res => res[0]);
   }

   async getDistributionRecords(releaseId?: number): Promise<DistributionRecord[]> {
      const query = db.select().from(distributionRecords);
      if (releaseId) {
         return query.where(eq(distributionRecords.releaseId, releaseId));
      }
      return query;
   }

   async createDistributionRecord(data: InsertDistributionRecord): Promise<DistributionRecord> {
      const [newRecord] = await db.insert(distributionRecords).values(data).returning();
      return newRecord;
   }

   async updateDistributionRecord(id: number, data: Partial<InsertDistributionRecord>): Promise<DistributionRecord | undefined> {
      const [updatedRecord] = await db.update(distributionRecords).set({...data, updatedAt: new Date()}).where(eq(distributionRecords.id, id)).returning();
      return updatedRecord;
   }

   async getScheduledDistributions(userId: number): Promise<ScheduledDistribution[]> {
      // This might need a join if scheduledDistributions doesn't have userId directly
      // Assuming releaseId links back to a release owned by the user
      const userReleases = await db.select({ id: releases.id }).from(releases).where(eq(releases.userId, userId));
      const releaseIds = userReleases.map(r => r.id);
      if (releaseIds.length === 0) return [];
      // Use Drizzle's inArray operator
      return db.select().from(scheduledDistributions).where(inArray(scheduledDistributions.releaseId, releaseIds)); 
   }
   
   async getScheduledDistributionById(id: number): Promise<ScheduledDistribution | undefined> {
       return db.select().from(scheduledDistributions).where(eq(scheduledDistributions.id, id)).limit(1).then(res => res[0]);
   }


   async createScheduledDistribution(data: InsertScheduledDistribution): Promise<ScheduledDistribution> {
      const [newDistribution] = await db.insert(scheduledDistributions).values(data).returning();
      return newDistribution;
   }

   async updateScheduledDistribution(id: number, data: Partial<InsertScheduledDistribution>): Promise<ScheduledDistribution | undefined> {
      const [updatedDistribution] = await db.update(scheduledDistributions).set({...data, updatedAt: new Date()}).where(eq(scheduledDistributions.id, id)).returning();
      return updatedDistribution;
   }
   
   // --- Bulk Distribution (Placeholder Methods) ---
   async getBulkDistributionJobs(userId: number): Promise<any[]> { 
      console.warn("getBulkDistributionJobs not implemented"); 
      // Example: return db.select().from(bulkJobs).where(eq(bulkJobs.userId, userId));
      return []; 
   }
   async createBulkDistributionJob(data: any): Promise<any> { 
      console.warn("createBulkDistributionJob not implemented"); 
      // Example: const [job] = await db.insert(bulkJobs).values(data).returning(); return job;
      return { id: Date.now(), ...data }; 
   }
   async updateBulkDistributionJob(id: number, data: any): Promise<any> { 
      console.warn("updateBulkDistributionJob not implemented"); 
      // Example: const [job] = await db.update(bulkJobs).set(data).where(eq(bulkJobs.id, id)).returning(); return job;
      return { id, ...data }; 
   }
    async getBulkDistributionJobById(id: number): Promise<any | undefined> {
      console.warn("getBulkDistributionJobById not implemented");
      // Example: return db.select().from(bulkJobs).where(eq(bulkJobs.id, id)).limit(1).then(res => res[0]);
      return undefined;
    }
    async updateBulkDistributionJobPlatformStatus(jobId: number, platformId: number, status: string, errorDetails?: string): Promise<void> {
       console.warn("updateBulkDistributionJobPlatformStatus not implemented");
       // Example: await db.update(bulkJobPlatforms).set({ status, errorDetails }).where(and(eq(bulkJobPlatforms.jobId, jobId), eq(bulkJobPlatforms.platformId, platformId)));
    }
     async getBulkDistributionJobPlatformStatuses(jobId: number): Promise<any[]> {
       console.warn("getBulkDistributionJobPlatformStatuses not implemented");
       // Example: return db.select().from(bulkJobPlatforms).where(eq(bulkJobPlatforms.jobId, jobId));
       return [];
     }


  // --- Support Ticket Methods ---
  async createSupportTicket(ticketData: Omit<InsertSupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<SupportTicket> {
    const [newTicket] = await db.insert(supportTickets).values(ticketData).returning();
    return newTicket;
  }

  async getSupportTicketById(id: number): Promise<SupportTicket | undefined> {
    return db.select().from(supportTickets).where(eq(supportTickets.id, id)).limit(1).then(res => res[0]);
  }
  
   async getSupportTicketsByUserId(userId: number): Promise<SupportTicket[]> {
     return db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.updatedAt));
   }
   
   async getAllSupportTickets(): Promise<SupportTicket[]> {
      return db.select().from(supportTickets).orderBy(desc(supportTickets.updatedAt));
   }

  async updateTicketStatus(id: number, status: string, agentId?: number): Promise<SupportTicket | undefined> { // Added agentId optional param
    const updateData: Partial<InsertSupportTicket> & { updatedAt: Date } = { 
        status: status as any, // Cast status if needed, or use enum
        updatedAt: new Date() 
    };
    if (agentId && status === 'in_progress') { // Assign agent only when moving to in_progress
        updateData.assignedToId = agentId;
    }
    const [updatedTicket] = await db
      .update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, id))
      .returning();

    return updatedTicket;
  }
  
  async assignTicket(id: number, agentId: number): Promise<SupportTicket | undefined> { // Renamed from assignSupportTicket
    const [updatedTicket] = await db
      .update(supportTickets)
      .set({ 
        assignedToId: agentId,
        status: "in_progress" as const, // Ensure status is updated
        updatedAt: new Date() 
      })
      .where(eq(supportTickets.id, id))
      .returning();

    return updatedTicket;
  }
  
   async getTicketMessagesByTicketId(ticketId: number): Promise<TicketReply[]> {
     return db.select().from(ticketReplies).where(eq(ticketReplies.ticketId, ticketId)).orderBy(asc(ticketReplies.createdAt));
   }

   async createTicketMessage(messageData: InsertTicketReply): Promise<TicketReply> {
      // Update the parent ticket's updatedAt timestamp
      await db.update(supportTickets)
          .set({ updatedAt: new Date() })
          .where(eq(supportTickets.id, messageData.ticketId));
          
      const [newMessage] = await db.insert(ticketReplies).values(messageData).returning();
      return newMessage;
   }

  // --- Sub-Label / Admin Methods ---
   async createSubLabelAuditLog(logData: InsertSubLabelAuditLog): Promise<SubLabelAuditLog> {
      const [newLog] = await db.insert(subLabelAuditLogs).values(logData).returning();
      return newLog;
   }
   
   async getSubLabels(parentId: number): Promise<User[]> { // Assuming sub-labels are users with parentId
      return db.select().from(users).where(eq(users.parentId, parentId));
   }
   
   async getSubLabelAuditLogs(subLabelId: number): Promise<SubLabelAuditLog[]> {
       return db.select().from(subLabelAuditLogs).where(eq(subLabelAuditLogs.subLabelId, subLabelId)).orderBy(desc(subLabelAuditLogs.timestamp));
   }
   
   async getPermissionTemplates(): Promise<PermissionTemplate[]> {
       return db.select().from(permissionTemplates);
   }
   
   async createPermissionTemplate(data: Omit<InsertPermissionTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PermissionTemplate> {
       const [newTemplate] = await db.insert(permissionTemplates).values(data).returning();
       return newTemplate;
   }
   
   async createReleaseApproval(data: InsertReleaseApproval): Promise<ReleaseApproval> {
       const [newApproval] = await db.insert(releaseApprovals).values(data).returning();
       return newApproval;
   }
   
   async updateReleaseApproval(releaseId: number, data: Partial<InsertReleaseApproval>): Promise<ReleaseApproval | undefined> {
       const [updatedApproval] = await db.update(releaseApprovals).set({...data, updatedAt: new Date()}).where(eq(releaseApprovals.releaseId, releaseId)).returning();
       return updatedApproval;
   }
   
   async getSubLabelUsers(subLabelId: number): Promise<User[]> { // Alias for getSubLabels for clarity
       return this.getSubLabels(subLabelId);
   }
   
   async updateTeamMember(memberId: number, updateData: Partial<InsertUser>): Promise<User | undefined> { // Alias for updateUser
       return this.updateUser(memberId, updateData);
   }

   async updateTeamMemberPermissions(memberId: number, updaterId: number, permissions: any): Promise<any> {
      // Logic to update permissions, check updater's permissions
      console.log(`User ${updaterId} updating permissions for member ${memberId}:`, permissions);
       const [updatedUser] = await db.update(users)
          .set({ permissions: permissions, updatedAt: new Date() })
          .where(and(eq(users.id, memberId), eq(users.parentId, updaterId))) // Ensure updater is the parent
          .returning();
       if (!updatedUser) {
          throw new Error("Team member not found or permission denied.");
      }
      return { success: true, message: 'Permissions updated' };
   } 
   // Removed duplicate function definition


  // --- Royalty Calculation Logic (Simulated) ---
  
  // Helper to get start date based on timeframe
  private getRoyaltyStartDate(date: Date, timeframe: string, offset = 0): Date {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    switch (timeframe) {
      case 'month':
        return new Date(year, month - 1 - offset, day);
      case 'quarter':
        return new Date(year, month - 3 - offset, day);
      case 'year':
        return new Date(year - 1 - offset, month, day);
      case 'all':
      default:
        return new Date(2020, 0, 1); // Arbitrary start date for 'all time'
    }
  }

  // Helper to get next payment date (e.g., 15th of next month)
  private getNextPaymentDate(): Date {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    // Calculate the 15th of the next month
    const nextPayment = new Date(year, month + 1, 15);
    // If today is already past the 15th of this month, calculate for the month after next
    if (now.getDate() > 15) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
    return nextPayment;
  }

  /**
   * Calculates royalty data for a given user and timeframe.
   * This is a SIMULATED function. In a real application, this would involve
   * complex aggregation of analytics data and application of royalty rules.
   */
  async calculateRoyaltyData(userId: number, timeframe: string = 'month', detailed: boolean = false): Promise<any> {
    try {
      // Fetch user data
      const user = await this.getUserById(userId);
      if (!user) throw new Error("User not found");

      // Fetch relevant releases and tracks for the user
      const releases = await this.getReleasesByUserId(userId);
      const tracks = await this.getTracksByUserId(userId);

      // Determine date range based on timeframe
      const endDate = new Date();
      const startDate = this.getRoyaltyStartDate(endDate, timeframe);
      const previousEndDate = this.getRoyaltyStartDate(endDate, timeframe, 1);
      const previousStartDate = this.getRoyaltyStartDate(endDate, timeframe, 2); // For previous period comparison

      // Filter tracks released within the current period (for summary stats)
      const currentPeriodTracks = tracks.filter(track => 
        new Date(track.releaseDate) >= startDate && new Date(track.releaseDate) <= endDate
      );

      // --- SIMULATION LOGIC ---
      // In a real system, you'd query aggregated analytics data here based on date range
      
      let totalRoyalties = 0; // Accumulator for the entire function scope
      const platformBreakdown: { [key: string]: number } = {
        'Spotify': 0, 'Apple Music': 0, 'Amazon Music': 0, 
        'YouTube Music': 0, 'TikTok': 0, 'Other': 0
      };

      // Calculate per-release royalties
      const releaseRoyalties = releases.map(release => {
        // Generate realistic but simulated royalty amounts based on release properties
        const releaseTracks = tracks.filter(track => track.releaseId === release.id);
        const platformMultipliers = {
          'Spotify': 0.004,      // $0.004 per stream
          'Apple Music': 0.008,  // $0.008 per stream
          'Amazon Music': 0.005, // $0.005 per stream
          'YouTube Music': 0.002,// $0.002 per stream
          'TikTok': 0.0015,      // $0.0015 per stream
          'Other': 0.003         // $0.003 per stream (average)
        };
        
        const platformMetrics: { [key: string]: number } = {};
        let releaseTotalStreams = 0;
        let releaseTotalRoyalties = 0; // Accumulator for this specific release

        Object.keys(platformMultipliers).forEach(platform => {
          let streamCount = 0;
          // TODO: release.metadata does not exist on the 'releases' table schema. 
          // Need to fetch analytics data properly instead of relying on this.
          // Using fallback random calculation for now.
          streamCount = Math.floor(Math.random() * 2000); 
          
          platformMetrics[platform] = streamCount;
          releaseTotalStreams += streamCount;
          
          // Calculate royalty amount for this platform and add to release total
          // Add type assertion for platform key
          const royaltyAmount = streamCount * platformMultipliers[platform as keyof typeof platformMultipliers]; 
          platformBreakdown[platform] += royaltyAmount; // Add to overall breakdown
          releaseTotalRoyalties += royaltyAmount; // Add to this release's total
        });
        
        totalRoyalties += releaseTotalRoyalties; // Add this release's total to the grand total

        // Calculate simulated royalty split data based on this release's royalties
        const royaltySplits = [];
        let primaryArtistPercentage = 75;
        if (release.type === 'compilation') {
          primaryArtistPercentage = 60;
        }
        
        royaltySplits.push({
          recipientType: 'Artist',
          recipientName: release.artistName,
          percentage: primaryArtistPercentage,
          amount: (releaseTotalRoyalties * primaryArtistPercentage) / 100 // Use release total
        });
        
        const labelPercentage = 100 - primaryArtistPercentage;
        royaltySplits.push({
          recipientType: 'Label',
          recipientName: user.entityName || 'Your Label',
          percentage: labelPercentage,
          amount: (releaseTotalRoyalties * labelPercentage) / 100 // Use release total
        });
        
        // If detailed track breakdown was requested, add it
        const trackBreakdown = detailed ? releaseTracks.map(track => {
          // Distribute this release's royalty among its tracks (simple division for simulation)
          const trackRoyalty = releaseTracks.length > 0 ? (releaseTotalRoyalties / releaseTracks.length) : 0; 
          return {
            trackId: track.id,
            trackTitle: track.title,
            royaltyAmount: trackRoyalty,
            streamCount: releaseTracks.length > 0 ? Math.floor(releaseTotalStreams / releaseTracks.length) : 0
          };
        }) : undefined;
        
        return {
          releaseId: release.id,
          releaseTitle: release.title,
          // coverArtUrl removed
          releaseDate: release.releaseDate,
          totalRoyaltyAmount: releaseTotalRoyalties, // Return this release's total
          streamCount: releaseTotalStreams,
          platformBreakdown: Object.entries(platformMetrics).map(([platform, streams]) => ({
            platform,
            streams,
             // Add type assertion for platform key
            royaltyAmount: streams * platformMultipliers[platform as keyof typeof platformMultipliers]
          })),
          royaltySplits,
          trackBreakdown
        };
      });

      // Build the response using the final accumulated totalRoyalties
      return {
        timeRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          timeframe
        },
        summary: {
          totalRoyalties: totalRoyalties, // Use the grand total
          totalReleases: releases.length,
          totalTracks: tracks.length,
          newTracksInPeriod: currentPeriodTracks.length,
          platformBreakdown: Object.entries(platformBreakdown).map(([platform, amount]) => ({
            platform,
            amount,
            // Calculate percentage based on grand total
            percentage: totalRoyalties > 0 ? (amount / totalRoyalties) * 100 : 0 
          })),
          previousPeriod: {
            timeRange: {
              start: previousStartDate.toISOString(),
              end: previousEndDate.toISOString()
            },
            totalRoyalties: totalRoyalties * 0.85, // Simulate based on grand total
            comparison: {
              percentageChange: 15,
              trend: 'up'
            }
          }
        },
        projections: {
          nextPeriod: totalRoyalties * 1.10, // Projected based on grand total
          nextQuarter: totalRoyalties * 3.3,  
          nextYear: totalRoyalties * 13.5,    
          assumptions: [
            'Based on current growth trajectory',
            'Assumes consistent release schedule',
            'Market conditions remain stable'
          ]
        },
        releases: releaseRoyalties, // Array of individual release royalty details
        paymentSchedule: {
          nextPaymentDate: this.getNextPaymentDate().toISOString(),
          paymentMinimum: 50, 
          paymentFrequency: 'monthly',
          paymentMethods: ['Bank Transfer', 'PayPal'],
          pendingAmount: totalRoyalties, // Use grand total
          status: totalRoyalties > 50 ? 'ready' : 'accumulating'
        }
      };
    } catch (error) {
      console.error("Error calculating royalties:", error);
      const err = error as Error; // Type assertion
      return {
        error: "Failed to calculate royalties",
        message: err.message 
      };
    }
  }

  async getRoyaltySplitsByReleaseId(releaseId: number): Promise<any> {
    try {
      // In a real implementation, this would query royalty_splits table
      // Demo implementation that returns simulated royalty split data
      
      // Get the release
      const release = await this.getReleaseById(releaseId);
      if (!release) {
        throw new Error("Release not found");
      }

      // Get tracks for this release (assuming userId is on release object)
      const tracks = await this.getTracksByUserId(release.userId); 
      const releaseTracks = tracks.filter(track => track.releaseId === releaseId);

      // Simulated royalty splits
      const artistPercentage = 70;
      const splits = [
        {
          id: 1,
          recipientType: 'Artist',
          recipientName: release.artistName,
          percentage: artistPercentage,
          isConfirmed: true,
          lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          paymentInformation: {
            paymentMethod: 'Bank Transfer',
            status: 'verified'
          }
        },
        {
          id: 2,
          recipientType: 'Label',
          recipientName: 'Your Label', // Placeholder
          percentage: 20,
          isConfirmed: true,
          lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          paymentInformation: {
            paymentMethod: 'Bank Transfer',
            status: 'verified'
          }
        },
        {
          id: 3,
          recipientType: 'Producer',
          recipientName: 'Producer Name', // Placeholder
          percentage: 10,
          isConfirmed: true,
          lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          paymentInformation: {
            paymentMethod: 'PayPal',
            status: 'verified'
          }
        }
      ];

      // Return the response
      return {
        releaseId,
        releaseTitle: release.title,
        releaseType: release.type,
        // coverArtUrl removed
        releaseDate: release.releaseDate,
        splits // Add the splits array
      }; // Close the return object literal
    } catch (error) {
      console.error("Error getting royalty splits:", error);
      const err = error as Error;
      return {
        error: "Failed to get royalty splits",
        message: err.message
      };
    }
  } // Close the getRoyaltySplitsByReleaseId method

  // --- Analytics Calculation Logic (Simulated) ---

  async getReleaseAnalytics(releaseId: number, timeframe: string = 'month'): Promise<any> {
    try {
      const release = await this.getReleaseById(releaseId);
      if (!release) throw new Error("Release not found");

      // Determine date range
      const endDate = new Date();
      const startDate = this.getRoyaltyStartDate(endDate, timeframe);

      // --- SIMULATION LOGIC ---
      // In a real system, query the 'analytics' table filtered by releaseId and date range

      const platforms = ['Spotify', 'Apple Music', 'Amazon Music', 'YouTube Music', 'TikTok', 'Other'];
      const countries = ['US', 'GB', 'DE', 'CA', 'AU', 'FR', 'BR', 'MX', 'JP', 'KR'];
      const ageGroups = ["18-24", "25-34", "35-44", "45+"];
      const genders = ["male", "female", "other"];

      let totalStreams = 0;
      let totalRevenue = 0;
      const platformStreams: Record<string, number> = {};
      const countryStreams: Record<string, number> = {};
      const cityStreams: Record<string, number> = {}; // Top 5 cities simulation
      const ageDemographics: Record<string, number> = { "18-24": 0, "25-34": 0, "35-44": 0, "45+": 0 };
      const genderDemographics: Record<string, number> = { male: 0, female: 0, other: 0 };
      const timelineData: { date: string, streams: number, revenue: number }[] = [];

      // Simulate data points over the timeframe
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        let dailyStreams = 0;
        let dailyRevenue = 0;

        platforms.forEach(platform => {
          const streams = Math.floor(Math.random() * 500); // Random streams per platform per day
          const revenue = streams * (Math.random() * 0.005 + 0.001); // Random revenue per stream

          platformStreams[platform] = (platformStreams[platform] || 0) + streams;
          dailyStreams += streams;
          dailyRevenue += revenue;

          // Simulate country data
          const country = countries[Math.floor(Math.random() * countries.length)];
          countryStreams[country] = (countryStreams[country] || 0) + Math.floor(streams * (Math.random() * 0.5 + 0.5));

          // Simulate demographics (very basic)
          const ageGroup = ageGroups[Math.floor(Math.random() * ageGroups.length)];
          ageDemographics[ageGroup] += Math.floor(streams * 0.1);
          const gender = genders[Math.floor(Math.random() * genders.length)];
          genderDemographics[gender] += Math.floor(streams * 0.1);
        });

        totalStreams += dailyStreams;
        totalRevenue += dailyRevenue;
        timelineData.push({ date: format(currentDate, 'yyyy-MM-dd'), streams: dailyStreams, revenue: dailyRevenue });

        currentDate.setDate(currentDate.getDate() + 1); // Increment day
      }
      
      // Simulate top cities (just random assignment for demo)
      const topCities = ['New York', 'London', 'Los Angeles', 'Berlin', 'Tokyo'];
      topCities.forEach(city => {
          cityStreams[city] = Math.floor(totalStreams * (Math.random() * 0.05 + 0.02));
      });


      return {
        releaseId: release.id,
        releaseTitle: release.title,
        artistName: release.artistName,
        // coverArtUrl removed
        timeRange: { start: startDate.toISOString(), end: endDate.toISOString(), timeframe },
        summary: {
          totalStreams,
          totalRevenue,
          avgStreamsPerDay: totalStreams / timelineData.length,
          avgRevenuePerDay: totalRevenue / timelineData.length,
        },
        platformBreakdown: Object.entries(platformStreams)
          .sort(([,a],[,b]) => b-a)
          .map(([name, streams]) => ({ name, streams, percentage: totalStreams > 0 ? (streams / totalStreams) * 100 : 0 })),
        geographicBreakdown: {
          countries: Object.entries(countryStreams)
            .sort(([,a],[,b]) => b-a)
            .slice(0, 10) // Top 10 countries
            .map(([name, streams]) => ({ name, streams, percentage: totalStreams > 0 ? (streams / totalStreams) * 100 : 0 })),
          cities: Object.entries(cityStreams)
             .sort(([,a],[,b]) => b-a)
             .slice(0, 5) // Top 5 cities
             .map(([name, streams]) => ({ name, streams, percentage: totalStreams > 0 ? (streams / totalStreams) * 100 : 0 })),
        },
        demographics: {
           age: Object.entries(ageDemographics).map(([group, count]) => ({ group, count, percentage: totalStreams > 0 ? (count / totalStreams) * 10 : 0 })), // Simplified percentage
           gender: Object.entries(genderDemographics).map(([type, count]) => ({ type, count, percentage: totalStreams > 0 ? (count / totalStreams) * 10 : 0 })), // Simplified percentage
        },
        timeline: timelineData,
      };

    } catch (error) {
      console.error(`Error fetching analytics for release ${releaseId}:`, error);
       const err = error as Error;
      return { 
        error: `Failed to fetch analytics for release ${releaseId}`,
        message: err.message 
      };
    }
  }

  // --- Support Ticket Methods ---
  // ... (createSupportTicket, getTicketById, updateTicketStatus, assignTicket - already defined above) ...

  // --- Team Management Methods ---
  // Placeholder - Implement actual logic
  async getTeamMembers(userId: number): Promise<any> { 
    // Fetch users where parentId = userId
    return db.select().from(users).where(eq(users.parentId, userId));
  } 
  
  async inviteTeamMember(inviterId: number, memberEmail: string, role: string, permissions: any): Promise<any> {
     // Logic to create a pending user or send invite
     console.log(`Inviting ${memberEmail} as ${role} by user ${inviterId} with permissions:`, permissions);
     // Example: Create a pending user linked to the inviter
     const [newUser] = await db.insert(users).values({
         username: `pending_${Date.now()}`, // Temporary username
         email: memberEmail,
         password: 'TEMPORARY_PASSWORD_HASH', // Needs secure handling
         role: role as any, // Cast role
         status: 'pending', // Requires acceptance/setup
         parentId: inviterId,
         permissions: permissions,
         createdAt: new Date(),
         updatedAt: new Date()
     }).returning();
     // TODO: Send invitation email with setup link
     return { success: true, message: 'Invitation sent', userId: newUser.id };
  }

  async removeTeamMember(memberId: number, removerId: number): Promise<any> {
     // Logic to remove or deactivate team member, check permissions
     console.log(`User ${removerId} attempting to remove member ${memberId}`);
     // Example: Deactivate user or remove parentId link
     const [updatedUser] = await db.update(users)
         .set({ status: 'inactive', parentId: null, updatedAt: new Date() })
         .where(and(eq(users.id, memberId), eq(users.parentId, removerId))) // Ensure remover is the parent
         .returning();
     if (!updatedUser) {
         throw new Error("Team member not found or permission denied.");
     }
     return { success: true, message: 'Team member removed' };
  }

  // Removed duplicate function definition
  // async updateTeamMemberPermissions(memberId: number, updaterId: number, permissions: any): Promise<any> { ... }

} // Close Storage class