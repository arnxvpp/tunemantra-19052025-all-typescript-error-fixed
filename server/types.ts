/**
 * Server-Side Type Definitions
 * 
 * This file contains type definitions used specifically on the server-side,
 * particularly for interfaces related to storage, services, and API responses.
 */

import session from "express-session";
import { 
  User, Release, Track, Analytics, SupportTicket, TicketReply, 
  DistributionPlatform, DistributionRecord, ScheduledDistribution,
  SubLabelAuditLog, PermissionTemplate, ReleaseApproval,
  PaymentMethod, Withdrawal, ApiKey, NftToken, RightsRecord, 
  RightsVerification, BlockchainTransaction, RightsDispute, AccountApproval,
  WhiteLabelSetting, AssetBundle, AssetVersion, BundleAnalytics, ImportBatch,
  InsertUser, InsertRelease, InsertTrack, InsertAnalytics, InsertSupportTicket, InsertTicketReply,
  InsertDistributionPlatform, InsertDistributionRecord, InsertScheduledDistribution,
  InsertSubLabelAuditLog, InsertPermissionTemplate, InsertReleaseApproval,
  InsertPaymentMethod, InsertWithdrawal, InsertApiKey, InsertNftToken, InsertRightsRecord,
  InsertRightsVerification, InsertBlockchainTransaction, InsertRightsDispute, InsertAccountApproval,
  InsertWhiteLabelSetting, InsertAssetBundle, InsertAssetVersion, InsertBundleAnalytics, InsertImportBatch
} from "@shared/schema";

// Interface for the Storage class, defining its public methods
export interface IStorage {
  // User Methods
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(options?: { status?: string; role?: string; search?: string; page?: number; limit?: number; sortBy?: string; sortDir?: string; }): Promise<User[]>;
  getUserCount(options?: { status?: string; role?: string; search?: string; }): Promise<number>;
  updateUserStatus(id: number, status: string): Promise<User | undefined>;

  // Release Methods
  getReleaseById(id: number): Promise<Release | undefined>;
  getReleasesByUserId(userId: number): Promise<Release[]>;
  createRelease(userId: number, releaseData: Omit<InsertRelease, 'userId'>): Promise<Release>;
  updateRelease(id: number, updateData: Partial<InsertRelease>): Promise<Release | undefined>;
  countUserReleases(userId: number): Promise<number>;

  // Track Methods
  getTracksByUserId(userId: number): Promise<Track[]>;
  countReleaseTracks(releaseId: number): Promise<number>;

  // Distribution Methods
  getDistributionPlatformById(id: number): Promise<DistributionPlatform | undefined>;
  getDistributionRecords(releaseId?: number): Promise<DistributionRecord[]>;
  createDistributionRecord(data: InsertDistributionRecord): Promise<DistributionRecord>;
  updateDistributionRecord(id: number, data: Partial<InsertDistributionRecord>): Promise<DistributionRecord | undefined>;
  getScheduledDistributions(userId: number): Promise<ScheduledDistribution[]>;
  getScheduledDistributionById(id: number): Promise<ScheduledDistribution | undefined>;
  createScheduledDistribution(data: InsertScheduledDistribution): Promise<ScheduledDistribution>;
  updateScheduledDistribution(id: number, data: Partial<InsertScheduledDistribution>): Promise<ScheduledDistribution | undefined>;

  // Bulk Distribution Methods (Placeholders)
  getBulkDistributionJobs(userId: number): Promise<any[]>;
  createBulkDistributionJob(data: any): Promise<any>;
  updateBulkDistributionJob(id: number, data: any): Promise<any>;
  getBulkDistributionJobById(id: number): Promise<any | undefined>;
  updateBulkDistributionJobPlatformStatus(jobId: number, platformId: number, status: string, errorDetails?: string): Promise<void>;
  getBulkDistributionJobPlatformStatuses(jobId: number): Promise<any[]>;

  // Support Ticket Methods
  createSupportTicket(ticketData: Omit<InsertSupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<SupportTicket>;
  getSupportTicketById(id: number): Promise<SupportTicket | undefined>;
  getSupportTicketsByUserId(userId: number): Promise<SupportTicket[]>;
  getAllSupportTickets(): Promise<SupportTicket[]>;
  updateTicketStatus(id: number, status: string, agentId?: number): Promise<SupportTicket | undefined>;
  assignTicket(id: number, agentId: number): Promise<SupportTicket | undefined>;
  getTicketMessagesByTicketId(ticketId: number): Promise<TicketReply[]>;
  createTicketMessage(messageData: InsertTicketReply): Promise<TicketReply>;

  // Sub-Label / Admin Methods
  createSubLabelAuditLog(logData: InsertSubLabelAuditLog): Promise<SubLabelAuditLog>;
  getSubLabels(parentId: number): Promise<User[]>;
  getSubLabelAuditLogs(subLabelId: number): Promise<SubLabelAuditLog[]>;
  getPermissionTemplates(): Promise<PermissionTemplate[]>;
  createPermissionTemplate(data: Omit<InsertPermissionTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PermissionTemplate>;
  createReleaseApproval(data: InsertReleaseApproval): Promise<ReleaseApproval>;
  updateReleaseApproval(releaseId: number, data: Partial<InsertReleaseApproval>): Promise<ReleaseApproval | undefined>;
  getSubLabelUsers(subLabelId: number): Promise<User[]>;
  updateTeamMember(memberId: number, updateData: Partial<InsertUser>): Promise<User | undefined>;
  updateTeamMemberPermissions(memberId: number, updaterId: number, permissions: any): Promise<any>;

  // Royalty & Analytics Methods (Placeholders/Simulated)
  calculateRoyaltyData(userId: number, timeframe?: string, detailed?: boolean): Promise<any>;
  getRoyaltySplitsByReleaseId(releaseId: number): Promise<any>;
  getReleaseAnalytics(releaseId: number, timeframe?: string): Promise<any>;
  getTeamMembers(userId: number): Promise<any>; // Placeholder from Storage class
  inviteTeamMember(inviterId: number, memberEmail: string, role: string, permissions: any): Promise<any>; // Placeholder
  removeTeamMember(memberId: number, removerId: number): Promise<any>; // Placeholder
  
  // Add sessionStore property (assuming it's needed, though not in Storage class)
  sessionStore?: session.Store; 
}

// Define other server-specific types if needed
export interface AuthenticatedRequest extends Request {
  user?: User; // Add user property from Passport
}

// Type for royalty calculation results (example)
export interface RoyaltyCalculationResult {
  releaseId: number;
  totalRevenue: number;
  splits: { userId: number; amount: number }[];
}

// Type for distribution status updates (example)
export interface DistributionUpdatePayload {
  distributionRecordId: number;
  status: 'completed' | 'failed';
  platformReferenceId?: string;
  errorDetails?: string;
}

// Added WhiteLabelConfig based on usage in white-label.ts
export interface WhiteLabelConfig {
    enabled: boolean;
    brandName: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string; // Added based on usage
    backgroundColor?: string; // Added based on usage
    textColor?: string; // Added based on usage
    fonts?: any; // Added based on usage, consider defining more specific type
    layout?: any; // Added based on usage, consider defining more specific type
    menuStyle?: any; // Added based on usage, consider defining more specific type
    headerStyle?: any; // Added based on usage, consider defining more specific type
    contactInfo?: {
        email?: string;
        phone?: string;
        address?: string;
        companyName?: string;
        supportEmail?: string;
    };
    featureFlags?: Record<string, boolean>;
    userLimits?: {
        maxUsers?: number;
        maxArtistsPerUser?: number;
        maxReleasesPerMonth?: number;
    };
    customDomain?: string;
    customLoginUrl?: string;
}
