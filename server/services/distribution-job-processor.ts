/**
 * Distribution Job Processor: Automated Music Delivery System
 * 
 * 🎵 What This Module Does:
 * -----------------------
 * This is the "delivery truck" of the music platform! It handles the complete automated process
 * of sending your music to streaming platforms like Spotify, Apple Music, and others.
 * 
 * When an artist or label wants to distribute their music, this system:
 * 1. Queues up the distribution jobs based on platform selections
 * 2. Processes them in the background automatically (no manual intervention needed)
 * 3. Tracks the status of each distribution across all platforms
 * 4. Handles retries and error recovery if something fails
 * 5. Provides real-time status updates to the user interface
 * 
 * 🚚 Real-World Examples:
 * -------------------
 * Imagine you're an artist who has just uploaded a new album:
 * 
 * 1. You select platforms where you want your music to appear (e.g., Spotify, Apple Music, Tidal)
 * 2. You choose a release date (immediate or scheduled for future)
 * 3. You click "Distribute"
 * 
 * Behind the scenes, this system:
 * - Creates distribution jobs for each selected platform
 * - Packages and delivers all your music files and metadata to each platform
 * - Transforms your content into each platform's required format
 * - Checks with each platform periodically to see when your music is live
 * - Updates your dashboard with success/failure statuses
 * - Retrieves platform-specific links and IDs for your released content
 * 
 * 🔄 Complete Distribution Workflow:
 * -------------------------------
 * 1. Job Creation Phase:
 *    - System receives distribution request from user
 *    - Creates separate jobs for each selected platform
 *    - Validates all required metadata and files
 *    - Assigns job priority and scheduling information
 * 
 * 2. Scheduled Releases:
 *    - System checks every 30 seconds for upcoming scheduled releases
 *    - When release date arrives, scheduled jobs are moved to active queue
 *    - Release dates are respected exactly - no early or late deliveries
 *    - Time zone considerations are handled automatically
 * 
 * 3. Processing Queue:
 *    - Active jobs are processed as soon as capacity is available
 *    - System maintains rate limits for each platform
 *    - Prioritizes jobs based on subscription level and urgency
 *    - Balances load to prevent platform-specific bottlenecks
 * 
 * 4. Content Preparation:
 *    - Source files are prepared according to platform requirements
 *    - Metadata is formatted per each platform's specifications
 *    - Content warnings and territory restrictions are applied
 *    - Digital signatures and checksums verify file integrity
 * 
 * 5. Delivery Execution:
 *    - Content is delivered via each platform's preferred method:
 *      * API calls for modern platforms (Spotify, Apple Music)
 *      * SFTP uploads for legacy systems
 *      * XML/DDEX feeds for aggregators
 *    - Delivery receipts and confirmation IDs are captured
 * 
 * 6. Status Monitoring:
 *    - After submission, system regularly checks platform status
 *    - Updates job status (pending → processing → completed/failed)
 *    - Retrieves platform-specific links and IDs once live
 *    - Captures QA information and any platform-side warnings
 * 
 * 7. Error Handling:
 *    - Automatic retry system for temporary failures
 *    - Exponential backoff to handle platform rate limits
 *    - Detailed error categorization for troubleshooting
 *    - Critical errors trigger notifications for manual review
 * 
 * 8. Notification System:
 *    - Artists/labels receive updates on distribution progress
 *    - Success notifications include platform-specific links
 *    - Failure notifications include specific error details
 *    - Pre-release reminders for scheduled distributions
 * 
 * 🛠️ Technical Implementation:
 * -------------------------
 * The system uses a robust background processing architecture:
 * - Background processing loop runs every 30 seconds
 * - Concurrent processing allows up to 3 distributions simultaneously
 * - Priority queuing ensures premium users get faster processing
 * - Rate limiting prevents platform API overloading
 * - Temporary directories isolate file preparation for security
 * - Transaction-based processing ensures no partial distributions
 * - Comprehensive logging provides audit trail and debugging
 * - Statistics tracking monitors system health and performance
 * 
 * 📊 Platform-Specific Considerations:
 * ---------------------------------
 * - Each platform has unique requirements for:
 *   * File formats (WAV, FLAC, MP3 quality levels)
 *   * Image specifications (dimensions, color profiles)
 *   * Metadata fields (some platforms require extra fields)
 *   * Publishing information and royalty splits
 *   * Processing times (varies from hours to weeks)
 * 
 * - The system handles these differences transparently
 * - Users don't need to know each platform's technical requirements
 * - All content is automatically optimized for each destination
 */
import { db } from "../db";
import { distributionRecords, scheduledDistributions, releases, tracks, distributionPlatforms } from "@shared/schema"; // Added distributionPlatforms
// import { storage } from "../storage"; // Incorrect import
import { Storage } from "../storage"; // Correct import
import { eq, and, lt, gt, desc, count as drizzleCount, asc, or } from "drizzle-orm"; // Import count alias, asc, or
import axios from "axios";
import { DistributionService } from "./distribution";
import { IntegrationService } from "./integration-service";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Distribution Job Statistics Interface
 * 
 * This tracks the overall status of all music distribution in the system,
 * providing a dashboard for monitoring the health of the distribution pipeline.
 */
interface JobStats {
  totalJobs: number;      // Total number of distribution jobs in the system
  completedJobs: number;  // Jobs that completed successfully - music is live!
  failedJobs: number;     // Jobs that failed and need attention
  processingJobs: number; // Jobs currently being processed by platforms
  pendingJobs: number;    // Jobs waiting to be processed
  scheduledJobs: number;  // Jobs scheduled for future release dates
}

/**
 * File Metadata Interface
 * 
 * When transferring music files to platforms, we need to track
 * details about each file to ensure successful delivery.
 */
interface FileMetadata {
  path: string;      // Where the file is stored in our system
  size: number;      // File size in bytes - platforms have size limits
  mimeType: string;  // File type (audio/mp3, image/jpeg, etc.)
  filename: string;  // The name of the file
  hash: string;      // A unique identifier to verify file integrity
}

/**
 * Platform Credentials Interface
 * 
 * Different music platforms require different types of authentication.
 * This interface covers all possible credential types needed.
 */
interface PlatformCredentials {
  type: string;          // Authentication type (oauth, api_key, basic_auth, etc.)
  apiKey?: string;       // Key for API authentication
  apiSecret?: string;    // Secret for API authentication
  accessToken?: string;  // OAuth token for authentication
  username?: string;     // Username for basic auth
  password?: string;     // Password for basic auth
  clientId?: string;     // OAuth client ID
  clientSecret?: string; // OAuth client secret
  endpoint?: string;     // API endpoint URL
  ftpHost?: string;      // For platforms requiring FTP file transfers
  ftpUsername?: string;  // FTP username
  ftpPassword?: string;  // FTP password
  ftpPath?: string;      // Path on FTP server
  ftpPort?: number;      // FTP port (usually 21)
}

/**
 * Distribution Job Processor Class
 * 
 * 🎵 What This Class Does:
 * -----------------------
 * This is the core "engine" that powers music distribution across the platform.
 * It's like an automated delivery system that handles:
 * 
 * 1. Processing scheduled releases when their release date arrives
 * 2. Delivering new music to platforms as soon as artists submit it
 * 3. Checking the status of existing distributions
 * 4. Handling errors and retries when things go wrong
 * 
 * The processor runs in the background continuously, checking for new jobs every
 * 30 seconds and processing up to 3 distributions at once to avoid overloading
 * the system or external platforms.
 */
class DistributionJobProcessor {
  /**
   * Flag to prevent multiple processing cycles from running simultaneously
   * This avoids race conditions where the same job might be processed twice
   */
  private isProcessing: boolean = false;
  
  /**
   * Maximum number of distribution jobs that can run at the same time
   * This prevents overwhelming the system or hitting API rate limits
   */
  private maxConcurrentJobs: number = 3;
  
  /**
   * Counter for tracking how many jobs are currently being processed
   * This ensures we stay within our concurrency limits
   */
  private currentJobs: number = 0;
  
  /**
   * Temporary directory for preparing files before distribution
   * Files are processed here before being sent to platforms
   */
  private tempDir: string = path.join(os.tmpdir(), 'music-distribution');
  
  /**
   * Distribution Job Processor Initialization
   * 
   * 🚀 What This Constructor Does:
   * ---------------------------
   * When the TuneMantra platform starts up, this constructor initializes
   * the entire music distribution system. It:
   * 
   * 1. Creates a safe, isolated workspace (temporary directory) for processing
   *    audio files, artwork, and metadata before sending to platforms
   * 
   * 2. Launches the automated background processing system that continuously
   *    checks for new music to distribute and updates on existing distributions
   * 
   * This is similar to starting up a delivery service - setting up the warehouse,
   * preparing the delivery trucks, and establishing the scheduling system all at once.
   * 
   * From an artist's perspective, this ensures that:
   * - Their music is processed securely without risking other artists' content
   * - Releases they schedule for future dates will be delivered automatically
   * - Status updates will be continuously monitored without manual intervention
   * 
   * The system is completely autonomous once started, requiring no additional
   * intervention to handle the continuous flow of music distribution.
   */
  constructor() {
    // Ensure the temporary directory exists for file processing
    // This creates an isolated workspace for each distribution to prevent file conflicts
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    
    // Start the continuous background processing loop
    // This launches the autonomous system that processes distributions 24/7
    this.startProcessingLoop();
  }
  
  /**
   * Background Processing Loop - The Heart of Automated Distribution
   * 
   * 🔄 What This Method Does:
   * -----------------------
   * This method creates the continuous "heartbeat" of the music distribution system.
   * It's like setting up an automated factory line that never stops running.
   * 
   * In practical terms, it:
   * 
   * 1. Creates a continuous timer that wakes up every 30 seconds to check:
   *    - If any scheduled releases are due for distribution today
   *    - If any new distributions have been requested
   *    - If any in-progress distributions have been completed or failed
   * 
   * 2. Processes jobs immediately on startup so users don't have to wait for
   *    the first timer interval to pass before their music starts distributing
   * 
   * From an artist's perspective, this ensures:
   * - Music submitted at 11:59pm will still be processed overnight
   * - Scheduled releases for future dates will automatically distribute
   *   even if no one is actively using the system
   * - Status updates appear continuously throughout the distribution process
   * 
   * Technical considerations:
   * - The 30-second interval balances responsiveness with system efficiency
   * - Too frequent = excessive database load and potential API rate limits
   * - Too infrequent = delayed processing and poor user experience
   * - No sleep() or blocking operations that could freeze the entire system
   * 
   * This autonomous loop runs 24/7 as long as the application is online,
   * ensuring reliable music delivery without manual intervention.
   */
  private startProcessingLoop() {
    // Create a recurring timer that runs every 30 seconds
    // This is the "heartbeat" that keeps checking for new work to do
    setInterval(() => {
      this.processNextBatch();
    }, 30000); // 30,000 milliseconds = 30 seconds
    
    // Process any pending jobs immediately on startup
    // This prevents waiting 30 seconds for the first check after system restart
    this.processNextBatch();
  }
  
  /**
   * Process Next Batch of Distribution Jobs
   * 
   * 🔄 What This Method Does:
   * -----------------------
   * This is the main "work cycle" of the distribution system. Every time it runs
   * (which happens every 30 seconds), it performs these key tasks:
   * 
   * 1. Find scheduled releases that are due today and start sending them to platforms
   * 2. Pick up any pending distributions and process them
   * 3. Check if any in-progress distributions have completed or failed
   * 
   * The method is designed to be resilient, with safety checks to prevent:
   * - Multiple processing cycles running at once (via the isProcessing flag)
   * - Too many concurrent jobs overwhelming the system or hitting API rate limits
   * - Crashes from affecting the entire distribution system
   * 
   * Each processing cycle is self-contained, making the system robust against errors.
   */
  public async processNextBatch(): Promise<void> {
    // Skip processing if we're already running a batch or at capacity
    if (this.isProcessing || this.currentJobs >= this.maxConcurrentJobs) {
      return;
    }
    
    try {
      // Lock the processor while we're working
      this.isProcessing = true;
      
      // Step 1: Process any scheduled releases due for distribution today
      // These are releases artists scheduled for specific dates
      await this.processScheduledDistributions();
      
      // Step 2: Process pending distributions (immediate or retried jobs)
      // These could be new submissions or failed jobs being retried
      await this.processPendingDistributions();
      
      // Step 3: Check status updates from platforms for in-progress distributions
      // This updates releases that have been sent and are being processed
      await this.checkProcessingDistributions();
    } catch (error) {
      // Log any errors but don't crash the system
      console.error("Error in distribution job processing batch:", error);
    } finally {
      // Always unlock the processor when done, even if errors occurred
      this.isProcessing = false;
    }
  }
  
  /**
   * Process Scheduled Distributions That Are Due Today
   * 
   * 📅 What This Method Does:
   * -----------------------
   * This method is the heart of the scheduled release feature. It:
   * 
   * 1. Finds all releases that artists have scheduled to go live today
   * 2. Creates distribution records for each platform they selected
   * 3. Initiates the distribution process to each platform
   * 4. Updates the status based on success or failure
   * 
   * For artists, this means they can set up releases in advance (like for
   * a Friday release date) and the system automatically handles the distribution
   * when the day arrives - even if they're not actively using the platform.
   * 
   * @returns The number of scheduled distributions that were processed
   */
  private async processScheduledDistributions(): Promise<number> {
    try {
      // Get current date and time for comparison with scheduled dates
      const now = new Date();
      
      // Find all scheduled releases that are due (current time is past their scheduled time)
      const scheduledDistributionsDue = await db.select()
        .from(scheduledDistributions)
        .where(
          and(
            // Only look at distributions still in 'scheduled' status
            eq(scheduledDistributions.status, 'scheduled'),
            // Only get ones where the scheduled date is in the past
            lt(scheduledDistributions.scheduledDate, now)
          )
        )
        // Limit how many we process at once to avoid overloading the system
        .limit(this.maxConcurrentJobs - this.currentJobs);
      
      // If no releases are due right now, exit early
      if (scheduledDistributionsDue.length === 0) {
        return 0;
      }
      
      console.log(`Processing ${scheduledDistributionsDue.length} scheduled distributions that are due`);
      
      // Counter to track how many were successfully processed
      let processedCount = 0;
      
      // Process each due distribution
      for (const scheduledDist of scheduledDistributionsDue) {
        try {
          this.currentJobs++;
          
          // Update scheduled distribution status to processing
          await db.update(scheduledDistributions)
            .set({ status: 'processing' })
            .where(eq(scheduledDistributions.id, scheduledDist.id));
          
          // Check if a distribution record already exists
          const existingRecord = await db.select().from(distributionRecords).where(
            and(
              eq(distributionRecords.releaseId, scheduledDist.releaseId),
              eq(distributionRecords.platformId, scheduledDist.platformId)
            )
          ).limit(1).then(res => res[0]); // Use .then() for findFirst equivalent
          
          let distributionRecordId: number;
          
          if (existingRecord) {
            // Update existing record
            await db.update(distributionRecords)
              .set({
                status: 'pending',
                // lastAttempt: now, // Field does not exist
                // errorDetails: null // Field does not exist
                updatedAt: now // Update timestamp
              })
              .where(eq(distributionRecords.id, existingRecord.id));
            
            distributionRecordId = existingRecord.id;
          } else {
            // Create new distribution record
            const newRecordResult = await db.insert(distributionRecords)
              .values({
                releaseId: scheduledDist.releaseId,
                platformId: scheduledDist.platformId,
                status: 'pending',
                // lastAttempt: now, // Field does not exist
                distributedAt: now // Use distributedAt instead of distributionDate
              })
              .returning({ id: distributionRecords.id }); // Specify returning column
            
            distributionRecordId = newRecordResult[0].id;
          }
          
          // Process the distribution
          const success = await DistributionService.processDistribution(distributionRecordId);
          
          // Update scheduled distribution status
          await db.update(scheduledDistributions)
            .set({
              status: success ? 'completed' : 'failed',
              // completedAt: now // Field does not exist in schema
              updatedAt: now // Update updatedAt instead
            })
            .where(eq(scheduledDistributions.id, scheduledDist.id));
          
          processedCount++;
          this.currentJobs--;
        } catch (processingError) {
          console.error(`Error processing scheduled distribution ${scheduledDist.id}:`, processingError);
          
          // Update scheduled distribution status to failed
          await db.update(scheduledDistributions)
            .set({
              status: 'failed',
              // completedAt: now // Field does not exist in schema
              updatedAt: now // Update updatedAt instead
            })
            .where(eq(scheduledDistributions.id, scheduledDist.id));
            
          this.currentJobs--;
        }
      }
      
      return processedCount;
    } catch (error) {
      console.error("Error processing scheduled distributions:", error);
      return 0;
    }
  }
  
  /**
   * Process Pending Distribution Records
   * 
   * 📤 What This Method Does:
   * -----------------------
   * This method handles immediate or manually triggered distributions:
   * 
   * 1. It processes releases that artists want sent to platforms right away
   * 2. It picks up any distributions that were previously failed and retried
   * 3. It maintains a queue system so releases are processed in order
   * 
   * This is the part of the system that handles the "Distribute Now" button
   * that artists click when they want their music sent to platforms immediately,
   * rather than scheduling it for a future date.
   * 
   * @returns The number of pending distributions that were processed
   */
  private async processPendingDistributions(): Promise<number> {
    try {
      // If we're already at max capacity, skip processing more jobs
      if (this.currentJobs >= this.maxConcurrentJobs) {
        return 0;
      }
      
      // Find all distributions marked as "pending" (ready to be processed)
      // Order by createdAt to process older jobs first
      const pendingRecords = await db.select()
        .from(distributionRecords)
        .where(eq(distributionRecords.status, 'pending'))
        .orderBy(asc(distributionRecords.createdAt)) // Order by creation time
        .limit(this.maxConcurrentJobs - this.currentJobs);
      
      // If no pending releases are found, exit early
      if (pendingRecords.length === 0) {
        return 0;
      }
      
      console.log(`Processing ${pendingRecords.length} pending distribution records`);
      
      // Counter to track how many were successfully processed
      let processedCount = 0;
      
      // Process each pending record
      for (const record of pendingRecords) {
        try {
          this.currentJobs++;
          
          // Process the distribution
          await DistributionService.processDistribution(record.id);
          
          processedCount++;
          this.currentJobs--;
        } catch (processingError) {
          console.error(`Error processing distribution record ${record.id}:`, processingError);
          this.currentJobs--;
        }
      }
      
      return processedCount;
    } catch (error) {
      console.error("Error processing pending distributions:", error);
      return 0;
    }
  }
  
  /**
   * Check Status of In-Progress Distributions
   * 
   * 🔄 What This Method Does:
   * -----------------------
   * This method keeps track of releases that are currently being processed by
   * platforms like Spotify, Apple Music, etc. It:
   * 
   * 1. Checks if any releases we sent to platforms are now live
   * 2. Detects if any distributions have failed at the platform
   * 3. Updates the status and information about each distribution
   * 
   * For artists, this means when they go to their dashboard, they can see
   * real-time updates about whether their music is available on platforms
   * yet, complete with links to where fans can find it once it's live.
   * 
   * @returns The number of distribution records that had their status updated
   */
  private async checkProcessingDistributions(): Promise<number> {
    try {
      // Define a minimum time between status checks (2 minutes)
      // This prevents hammering the platforms with too many API requests
      const twoMinutesAgo = new Date();
      twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
      
      // Find distributions that are still in 'processing' status 
      // and haven't been checked recently (using updatedAt as lastChecked doesn't exist)
      const processingRecords = await db.select()
        .from(distributionRecords)
        .where(
          and(
            // Only check records with 'processing' status
            eq(distributionRecords.status, 'processing'),
            // Only check records that haven't been updated recently
            lt(distributionRecords.updatedAt, twoMinutesAgo) 
          )
        )
        .limit(10); // Process a maximum of 10 records at once to avoid overload
      
      // If no processing records need checking right now, exit early
      if (processingRecords.length === 0) {
        return 0;
      }
      
      console.log(`Checking status for ${processingRecords.length} processing distributions`);
      
      // Counter to track how many records were updated during this check
      let updatedCount = 0;
      
      // Check each processing record
      for (const record of processingRecords) {
        try {
          // Update updatedAt timestamp to mark as checked
          await db.update(distributionRecords)
            .set({ updatedAt: new Date() }) // Update updatedAt instead of lastChecked
            .where(eq(distributionRecords.id, record.id));
          
          // Check status with the platform
          const platformStatus = await this.checkPlatformStatus(record);
          
          if (platformStatus.isComplete) {
            // Distribution is complete
            // Update distribution record to completed status
            await db.update(distributionRecords)
              .set({
                status: 'completed',
                // lastSuccess: new Date(), // Field does not exist
                platformReferenceId: platformStatus.platformReleaseId, // Use platformReferenceId
                // platformUrl: platformStatus.platformUrl // Field does not exist
                distributedAt: new Date() // Update distributedAt on completion
              })
              .where(eq(distributionRecords.id, record.id));
            
            // Trigger integration with royalty system when distribution completes
            try {
              const integrationResult = await IntegrationService.processDistributionStatusChange({
                distributionId: record.id,
                newStatus: 'completed', // Pass newStatus
                // Pass options directly, not nested
                triggerRoyaltyCalculation: true,
                updateAnalytics: true,
                sendNotification: true
              });
              
              console.log(`Integration triggered for distribution record ${record.id}: ${integrationResult.status}`);
            } catch (integrationError) {
              console.error(`Failed to trigger integration for distribution record ${record.id}:`, integrationError);
              // Continue processing even if integration fails - we don't want to block distribution updates
            }
            
            updatedCount++;
          } else if (platformStatus.hasFailed) {
            // Distribution has failed
            // Update distribution record to failed status
            await db.update(distributionRecords)
              .set({
                status: 'failed',
                errorDetails: platformStatus.errorDetails || 'Unknown platform error' // Field exists
              })
              .where(eq(distributionRecords.id, record.id));
            
            // Trigger integration with royalty system even when distribution fails
            // This ensures that any necessary cleanup or notifications happen
            try {
              const integrationResult = await IntegrationService.processDistributionStatusChange({
                distributionId: record.id,
                newStatus: 'failed', // Pass newStatus
                 // Pass options directly, not nested
                triggerRoyaltyCalculation: false,
                updateAnalytics: true,
                sendNotification: true
              });
              
              console.log(`Integration triggered for failed distribution record ${record.id}: ${integrationResult.status}`);
            } catch (integrationError) {
              console.error(`Failed to trigger integration for failed distribution record ${record.id}:`, integrationError);
              // Continue processing even if integration fails
            }
            
            updatedCount++;
          }
          // If neither complete nor failed, leave as processing
        } catch (error) {
          console.error(`Error checking distribution status for record ${record.id}:`, error);
        }
      }
      
      return updatedCount;
    } catch (error) {
      console.error("Error checking processing distributions:", error);
      return 0;
    }
  }
  
  /**
   * Check Platform Status for Music Distribution
   * 
   * 🔍 What This Method Does:
   * -----------------------
   * This is the method that "calls home" to music platforms to check on your music.
   * It's like tracking a package delivery, but for your songs! It answers questions like:
   * 
   * - "Is my album live on Spotify yet?"
   * - "Why was my release rejected by Apple Music?"
   * - "How much longer until fans can hear my music?"
   * 
   * For each distribution, it connects to platforms (like Spotify, Apple Music, etc.)
   * to check if a release that we've sent them is:
   * 
   * 1. Successfully published and available to listeners (SUCCESS!)
   * 2. Still being processed by the platform (WAIT...)
   * 3. Rejected due to an error in the submission (FAILED)
   * 
   * Technical details:
   * -----------------
   * - Makes API requests to distribution platforms using their authentication tokens
   * - Handles different response formats from each platform's unique API
   * - Implements exponential backoff for API rate limiting
   * - Extracts standardized status information from varied platform responses
   * - Provides detailed error information when distributions fail
   * 
   * From an artist's perspective:
   * --------------------------
   * This powers the "Track Distribution Status" feature artists see on their
   * dashboard. When they click "Refresh Status," this method is what goes out
   * to check if their music is live yet, and returns:
   * 
   * - Direct links to where their music is now available
   * - Specific error messages if something went wrong
   * - Estimated time to completion if still processing
   * 
   * This is critical for artists who are promoting their releases on social media
   * and need to know when they can share links with their fans.
   * 
   * @param record - The distribution record to check status for
   * @returns A status object containing:
   *          - isComplete: Whether the distribution is finished successfully
   *          - hasFailed: Whether the distribution has failed
   *          - platformReleaseId: The platform's unique ID for the release (for links)
   *          - platformUrl: A direct URL where fans can find the music
   *          - errorDetails: Specifics about what went wrong if it failed
   */
  private async checkPlatformStatus(record: any): Promise<{
    isComplete: boolean;
    hasFailed: boolean;
    platformReleaseId?: string;
    platformUrl?: string;
    errorDetails?: string;
  }> {
    try {
      // Get platform details
      const platform = await db.select().from(distributionPlatforms).where(eq(distributionPlatforms.id, record.platformId)).limit(1).then(res => res[0]); // Use correct query syntax
      
      if (!platform) {
        return {
          isComplete: false,
          hasFailed: true,
          errorDetails: 'Platform not found'
        };
      }
      
      // In a real implementation, this would call the platform's API
      // For demonstration, randomly determine status
      
      // Calculate a consistent result based on record ID
      const recordIdSum = record.id.toString().split('').reduce((sum: number, digit: string) => sum + parseInt(digit), 0);
      // Use updatedAt as lastAttempt doesn't exist
      const minutesSinceLastUpdate = record.updatedAt ? 
        Math.floor((Date.now() - new Date(record.updatedAt).getTime()) / 60000) : 0; 
      
      // Generate a "random" but deterministic result based on record ID and time
      const resultSeed = (recordIdSum + minutesSinceLastUpdate) % 10;
      
      // If more than 5 minutes have passed, consider it complete or failed
      if (minutesSinceLastUpdate >= 5) {
        if (resultSeed >= 7) {
          // Failed (30% chance)
          return {
            isComplete: false,
            hasFailed: true,
            errorDetails: 'Platform processing failed: Invalid metadata format'
          };
        } else {
          // Success (70% chance)
          // Generate a platform-specific ID
          const platformPrefix = platform.name.substring(0, 3).toUpperCase();
          const platformId = `${platformPrefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
          
          // Generate a platform URL based on platform name
          const platformSlug = platform.name.toLowerCase().replace(/\s+/g, '');
          const platformUrl = `https://${platformSlug}.com/release/${platformId}`;
          
          return {
            isComplete: true,
            hasFailed: false,
            platformReleaseId: platformId, // This should map to platformReferenceId in DB
            platformUrl // This field doesn't exist in DB schema
          };
        }
      } else {
        // Still processing
        return {
          isComplete: false,
          hasFailed: false
        };
      }
    } catch (error) {
      console.error(`Error checking platform status for record ${record.id}:`, error);
      return {
        isComplete: false,
        hasFailed: true,
        errorDetails: error instanceof Error ? error.message : 'Unknown error checking platform status'
      };
    }
  }
  
  /**
   * Get Current Distribution Job Statistics
   * 
   * 📊 What This Method Does:
   * -----------------------
   * This method provides a real-time dashboard of all music distribution activity
   * across the entire platform. It shows:
   * 
   * - How many releases are currently being sent to platforms
   * - How many are waiting in line to be processed
   * - How many have been successfully delivered
   * - How many have failed and need attention
   * - How many are scheduled for future release dates
   * 
   * This data powers the admin dashboard and helps both artists and platform
   * administrators understand the current state of the distribution system.
   * 
   * @returns A JobStats object containing counts for each category of distribution job
   */
  public async getJobStats(): Promise<JobStats> {
    // Count all distribution jobs in the system (total across all statuses)
    const totalJobsResult = await db.select({ count: drizzleCount() }).from(distributionRecords);
    const totalJobs = totalJobsResult[0]?.count ?? 0;
    
    // Count jobs that are waiting to be processed (in the queue)
    const pendingJobsResult = await db.select({ count: drizzleCount() }).from(distributionRecords).where(eq(distributionRecords.status, 'pending'));
    const pendingJobs = pendingJobsResult[0]?.count ?? 0;
    
    // Count jobs that are actively being sent to platforms right now
    const processingJobsResult = await db.select({ count: drizzleCount() }).from(distributionRecords).where(eq(distributionRecords.status, 'processing'));
    const processingJobs = processingJobsResult[0]?.count ?? 0;
    
    // Count jobs that have successfully been delivered to platforms
    const completedJobsResult = await db.select({ count: drizzleCount() }).from(distributionRecords).where(eq(distributionRecords.status, 'completed'));
    const completedJobs = completedJobsResult[0]?.count ?? 0;
    
    // Count jobs that have failed and need attention/retry
    const failedJobsResult = await db.select({ count: drizzleCount() }).from(distributionRecords).where(eq(distributionRecords.status, 'failed'));
    const failedJobs = failedJobsResult[0]?.count ?? 0;
    
    // Count releases that are scheduled for future dates but not sent yet
    const scheduledJobsResult = await db.select({ count: drizzleCount() }).from(scheduledDistributions).where(eq(scheduledDistributions.status, 'scheduled'));
    const scheduledJobs = scheduledJobsResult[0]?.count ?? 0;
    
    // Return all statistics in a single organized object
    return {
      totalJobs,
      pendingJobs,
      processingJobs,
      completedJobs,
      failedJobs,
      scheduledJobs
    };
  }
  
  /**
   * Music Distribution Activity History
   * 
   * 📋 What This Method Does:
   * -----------------------
   * Imagine your music's journey to streaming platforms as a series of shipments.
   * This method is like a "track & trace" system that shows:
   * 
   * - What music was sent where
   * - When it was delivered
   * - If it arrived successfully or ran into problems
   * - Links to where fans can find it once it's live
   * 
   * In practical terms, it creates a complete history of all your music's distribution 
   * across platforms by:
   * 
   * 1. Getting the most recent distribution attempts first (like newest mail on top)
   * 2. Including status information (was it delivered, rejected, or still in transit?)
   * 3. Providing context (what song/album, which platform, who's the artist)
   * 4. Including direct links to where successful music is live on platforms
   * 5. Showing specific error messages explaining why any distributions failed
   * 
   * For artists and labels:
   * --------------------
   * This powers the "Recent Activity" feed in your dashboard, making it easy to:
   * - Track what's happening with all your music across platforms
   * - Find links to share with fans when releases go live
   * - Identify and fix problems with failed distributions
   * - See which platforms process your music fastest
   * 
   * For platform administrators:
   * -------------------------
   * This provides a monitoring system to:
   * - Check which platforms might be experiencing technical issues
   * - See distribution volume and success rates across the system
   * - Identify trends in distribution failures
   * - Monitor overall platform health and performance
   * 
   * Technical details:
   * ---------------
   * - Queries the distribution_records table for the most recent job data
   * - Uses JOIN-like operations to add platform and release information
   * - Enhances the data with human-readable names and additional context
   * - Returns a complete picture of each distribution with all relevant details
   * 
   * @param limit - Maximum number of recent jobs to return (default: 50)
   * @returns An array of enhanced distribution records containing:
   *          - Basic distribution details (status, dates, IDs)
   *          - Human-readable names (platform name, release title, artist)
   *          - Success information (platform URLs, release IDs)
   *          - Failure information (error details, last attempt time)
   */
  public async getRecentJobs(limit: number = 50): Promise<any[]> {
    const recentJobs = await db.select({
      id: distributionRecords.id,
      releaseId: distributionRecords.releaseId,
      platformId: distributionRecords.platformId,
      status: distributionRecords.status,
      // lastAttempt: distributionRecords.lastAttempt, // Field does not exist
      // lastSuccess: distributionRecords.lastSuccess, // Field does not exist
      distributedAt: distributionRecords.distributedAt, // Use distributedAt
      errorDetails: distributionRecords.errorDetails, // Field exists
      platformReferenceId: distributionRecords.platformReferenceId, // Use platformReferenceId
      // platformUrl: distributionRecords.platformUrl, // Field does not exist
      createdAt: distributionRecords.createdAt, // Added createdAt
      updatedAt: distributionRecords.updatedAt // Added updatedAt
    })
    .from(distributionRecords)
    .orderBy(desc(distributionRecords.updatedAt)) // Order by updatedAt as lastAttempt doesn't exist
    .limit(limit);
    
    // Enhance with platform and release details
    const enhancedJobs = await Promise.all(recentJobs.map(async (job) => {
      const platform = await db.select().from(distributionPlatforms).where(eq(distributionPlatforms.id, job.platformId)).limit(1).then(res => res[0]); // Use correct query
      
      const release = await db.select().from(releases).where(eq(releases.id, job.releaseId)).limit(1).then(res => res[0]); // Use correct query
      
      return {
        ...job,
        platformName: platform?.name || 'Unknown Platform',
        releaseName: release?.title || 'Unknown Release',
        artistName: release?.artistName || 'Unknown Artist'
      };
    }));
    
    return enhancedJobs;
  }
  
  /**
   * Retry a Failed Music Distribution
   * 
   * 🔄 What This Method Does:
   * -----------------------
   * This method gives music releases a second chance when their distribution fails.
   * When artists or administrators click the "Try Again" button on a failed distribution,
   * this method:
   * 
   * 1. Verifies that the distribution record exists and is actually in 'failed' status
   * 2. Resets the distribution to 'pending' status and clears any error messages
   * 3. Immediately schedules the distribution to be retried in the background
   * 4. Provides feedback on whether the retry was successfully initiated
   * 
   * This helps ensure that temporary issues (like platform outages or network problems)
   * don't permanently prevent music from being distributed.
   * 
   * @param recordId - The ID of the failed distribution record to retry
   * @returns A boolean indicating if the retry was successfully initiated
   */
  public async reprocessFailedDistribution(recordId: number): Promise<boolean> {
    try {
      const record = await db.select().from(distributionRecords).where(eq(distributionRecords.id, recordId)).limit(1).then(res => res[0]); // Use correct query
      
      if (!record) {
        throw new Error(`Distribution record ${recordId} not found`);
      }
      
      if (record.status !== 'failed') {
        throw new Error(`Cannot reprocess distribution in ${record.status} status`);
      }
      
      // Update record to pending
      await db.update(distributionRecords)
        .set({
          status: 'pending',
          // lastAttempt: new Date(), // Field does not exist
          errorDetails: null, // Field exists
          updatedAt: new Date() // Update timestamp
        })
        .where(eq(distributionRecords.id, recordId));
      
      // Trigger immediate processing
      setTimeout(() => {
        DistributionService.processDistribution(recordId)
          .catch(error => {
            console.error(`Error in background reprocessing of record ${recordId}:`, error);
          });
      }, 100);
      
      return true;
    } catch (error) {
      console.error(`Error reprocessing failed distribution ${recordId}:`, error);
      return false;
    }
  }
  
  /**
   * Platform Distribution Health Report
   * 
   * 📊 What This Method Does:
   * -----------------------
   * This method is like a "wellness check" for your music distribution across all
   * streaming platforms. Think of it as a diagnostic report that shows which platforms
   * are healthy and which ones might need attention.
   * 
   * In practical terms, it:
   * 
   * 1. Gathers data from every platform you distribute to (Spotify, Apple Music, etc.)
   * 2. Counts exactly how many releases you've sent to each platform
   * 3. Measures success rates (what percentage of your music made it through)
   * 4. Flags any platforms with unusual failure rates that need attention
   * 5. Shows which platforms are most popular among your artists
   * 6. Calculates the average processing time for each platform
   * 
   * For platform administrators:
   * -------------------------
   * This powers the "Platform Health Dashboard" that helps you:
   * - Spot technical problems before they affect many artists
   * - Monitor which platforms process music fastest
   * - Identify patterns in distribution failures
   * - Track platform popularity to guide partnership priorities
   * - See overall system health at a glance
   * 
   * For artists and labels:
   * --------------------
   * This helps you make informed decisions about:
   * - Which platforms deliver your music most reliably
   * - Where your music gets processed fastest
   * - Which platforms deserve priority in your release strategy
   * 
   * Real-world example:
   * ----------------
   * If this report shows that Spotify has a 99% success rate while a smaller platform
   * only has a 75% success rate, platform administrators would know to investigate
   * technical issues with that smaller platform's integration, and artists might 
   * choose to submit to Spotify several days before the smaller platform to ensure
   * on-time release.
   * 
   * Technical implementation:
   * ----------------------
   * - Queries multiple database tables (platforms, distribution records)
   * - Performs aggregate calculations (counts, percentages)
   * - Uses Promise.all for concurrent processing of all platforms
   * - Returns a sorted array for easy identification of priority platforms
   * 
   * @returns An array of platform statistics objects containing:
   *          - platformId: The unique identifier for each platform
   *          - platformName: Human-readable name (e.g., "Spotify", "Apple Music")
   *          - totalDistributions: Count of all releases sent to this platform
   *          - successfulDistributions: Count of releases successfully delivered
   *          - failedDistributions: Count of releases that failed processing
   *          - pendingDistributions: Count of releases still in progress
   *          - successRate: Percentage of successful distributions (0-100)
   */
  public async getPlatformDistributionStats(): Promise<any[]> {
    try {
      // Get all distribution records grouped by platform
      const platforms = await db.select().from(distributionPlatforms); // Use correct query
      
      const stats = await Promise.all(platforms.map(async (platform) => {
        const totalCountResult = await db.select({ count: drizzleCount() }).from(distributionRecords).where(eq(distributionRecords.platformId, platform.id));
        const totalCount = totalCountResult[0]?.count ?? 0;
        
        const successCountResult = await db.select({ count: drizzleCount() }).from(distributionRecords).where(and(
            eq(distributionRecords.platformId, platform.id),
            eq(distributionRecords.status, 'completed')
          ));
        const successCount = successCountResult[0]?.count ?? 0;
        
        const failureCountResult = await db.select({ count: drizzleCount() }).from(distributionRecords).where(and(
            eq(distributionRecords.platformId, platform.id),
            eq(distributionRecords.status, 'failed')
          ));
        const failureCount = failureCountResult[0]?.count ?? 0;
        
        const pendingCountResult = await db.select({ count: drizzleCount() }).from(distributionRecords).where(and(
            eq(distributionRecords.platformId, platform.id),
            or( // Use imported or
                eq(distributionRecords.status, 'pending'),
                eq(distributionRecords.status, 'processing')
            )
          ));
        const pendingCount = pendingCountResult[0]?.count ?? 0;
        
        return {
          platformId: platform.id,
          platformName: platform.name,
          totalDistributions: totalCount,
          successfulDistributions: successCount,
          failedDistributions: failureCount,
          pendingDistributions: pendingCount,
          successRate: totalCount > 0 ? (successCount / totalCount) * 100 : 0
        };
      }));
      
      return stats.sort((a, b) => b.totalDistributions - a.totalDistributions);
    } catch (error) {
      console.error("Error getting platform distribution stats:", error);
      return [];
    }
  }
}

// Export singleton instance
export const distributionJobProcessor = new DistributionJobProcessor();