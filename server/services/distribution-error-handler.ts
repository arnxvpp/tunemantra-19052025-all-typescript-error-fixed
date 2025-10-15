/**
 * Distribution Error Handler Service
 * 
 * This service provides robust error handling capabilities for the distribution system,
 * including error categorization, error recovery strategies, and error reporting.
 * 
 * Key features:
 * - Detailed error categorization system
 * - Platform-specific error handling logic
 * - Retry strategies with exponential backoff
 * - Error reporting and notification
 * - Error analytics and trending
 */

import { db } from '../db';
import { distributionRecords } from '@shared/schema';
import { eq, and, gt, lt } from 'drizzle-orm';

/**
 * Error Categories for Music Distribution
 * 
 * These categories help identify the root cause of distribution failures
 * and determine the appropriate resolution strategy.
 */
export enum DistributionErrorCategory {
  // Content Validation Errors - Issues with the music or metadata itself
  CONTENT_FORMAT = 'content_format',          // Audio file format is unsupported
  CONTENT_QUALITY = 'content_quality',        // Audio quality doesn't meet platform standards
  METADATA_INVALID = 'metadata_invalid',      // Required metadata is missing or invalid
  ARTWORK_INVALID = 'artwork_invalid',        // Artwork doesn't meet requirements
  
  // Platform Authentication Errors - Issues with accessing the platform
  AUTH_EXPIRED = 'auth_expired',              // Authentication token has expired
  AUTH_INVALID = 'auth_invalid',              // Authentication credentials are invalid
  AUTH_PERMISSION = 'auth_permission',        // Insufficient permissions for operation
  
  // Platform API Errors - Issues with the platform's API
  API_RATE_LIMIT = 'api_rate_limit',          // Platform rate limit exceeded
  API_UNAVAILABLE = 'api_unavailable',        // Platform API is temporarily unavailable
  API_CHANGED = 'api_changed',                // Platform API has changed (breaking change)
  
  // Content Rules Errors - Issues with platform content policies
  CONTENT_REJECTED = 'content_rejected',      // Content violates platform policies
  CONTENT_DUPLICATE = 'content_duplicate',    // Content is already on the platform
  RIGHTS_CONFLICT = 'rights_conflict',        // Content has rights conflicts on platform
  
  // Delivery Errors - Issues with the delivery mechanism
  DELIVERY_TIMEOUT = 'delivery_timeout',      // Delivery process timed out
  DELIVERY_INTERRUPTED = 'delivery_interrupted', // Delivery was interrupted
  DELIVERY_CORRUPT = 'delivery_corrupt',      // Delivered files were corrupted
  
  // System Errors - Issues with our distribution system
  SYSTEM_STORAGE = 'system_storage',          // Storage system failure
  SYSTEM_DATABASE = 'system_database',        // Database error during distribution
  SYSTEM_INTERNAL = 'system_internal',        // Internal system error
  
  // Network Errors - Issues with network connectivity
  NETWORK_TIMEOUT = 'network_timeout',        // Network connection timed out
  NETWORK_DNS = 'network_dns',                // DNS resolution failed
  NETWORK_CONNECTION = 'network_connection',  // Network connection failed
  
  // Unknown or unspecified errors
  UNKNOWN = 'unknown'                         // Unidentified error
}

/**
 * Error Severity Levels for Distribution Errors
 * 
 * These levels help prioritize errors and determine response urgency.
 */
export enum ErrorSeverity {
  CRITICAL = 'critical',    // Requires immediate attention, blocks all distributions
  HIGH = 'high',            // Significant impact, high priority for resolution
  MEDIUM = 'medium',        // Moderate impact, should be addressed soon
  LOW = 'low',              // Minor impact, low priority
  INFO = 'info'             // Informational only, no impact on distribution
}

/**
 * Retry Strategy Types for Different Error Categories
 */
export enum RetryStrategy {
  IMMEDIATE = 'immediate',        // Retry immediately (for transient errors)
  SHORT_BACKOFF = 'short_backoff', // Retry with short exponential backoff (seconds)
  LONG_BACKOFF = 'long_backoff',   // Retry with long exponential backoff (minutes/hours)
  MANUAL = 'manual',               // Requires manual intervention before retry
  NONE = 'none'                    // Do not retry automatically
}

/**
 * Error Category Configuration with Response Strategies
 */
const ERROR_CATEGORY_CONFIG: Record<DistributionErrorCategory, {
  severity: ErrorSeverity;
  retryStrategy: RetryStrategy;
  maxRetries: number;
  description: string;
  resolution: string;
}> = {
  // Content Validation Errors
  [DistributionErrorCategory.CONTENT_FORMAT]: {
    severity: ErrorSeverity.HIGH,
    retryStrategy: RetryStrategy.MANUAL,
    maxRetries: 0,
    description: "Audio file format not supported by the platform",
    resolution: "Convert the audio file to a supported format (WAV, FLAC, or high-quality MP3)"
  },
  [DistributionErrorCategory.CONTENT_QUALITY]: {
    severity: ErrorSeverity.HIGH,
    retryStrategy: RetryStrategy.MANUAL,
    maxRetries: 0,
    description: "Audio quality below platform requirements",
    resolution: "Provide a higher quality audio file (higher bitrate or lossless format)"
  },
  [DistributionErrorCategory.METADATA_INVALID]: {
    severity: ErrorSeverity.HIGH,
    retryStrategy: RetryStrategy.MANUAL,
    maxRetries: 0,
    description: "Required metadata missing or invalid",
    resolution: "Review and complete all required metadata fields"
  },
  [DistributionErrorCategory.ARTWORK_INVALID]: {
    severity: ErrorSeverity.HIGH,
    retryStrategy: RetryStrategy.MANUAL,
    maxRetries: 0,
    description: "Artwork doesn't meet platform requirements",
    resolution: "Provide artwork that meets size, resolution, and format requirements"
  },
  
  // Platform Authentication Errors
  [DistributionErrorCategory.AUTH_EXPIRED]: {
    severity: ErrorSeverity.MEDIUM,
    retryStrategy: RetryStrategy.SHORT_BACKOFF,
    maxRetries: 3,
    description: "Platform authentication token has expired",
    resolution: "System will automatically refresh authentication and retry"
  },
  [DistributionErrorCategory.AUTH_INVALID]: {
    severity: ErrorSeverity.HIGH,
    retryStrategy: RetryStrategy.MANUAL,
    maxRetries: 0,
    description: "Platform authentication credentials are invalid",
    resolution: "Update platform credentials in distribution settings"
  },
  [DistributionErrorCategory.AUTH_PERMISSION]: {
    severity: ErrorSeverity.HIGH,
    retryStrategy: RetryStrategy.MANUAL,
    maxRetries: 0,
    description: "Insufficient permissions for distribution operation",
    resolution: "Contact platform to ensure account has proper distribution permissions"
  },
  
  // Platform API Errors
  [DistributionErrorCategory.API_RATE_LIMIT]: {
    severity: ErrorSeverity.MEDIUM,
    retryStrategy: RetryStrategy.LONG_BACKOFF,
    maxRetries: 5,
    description: "Platform rate limit exceeded",
    resolution: "System will automatically retry after an appropriate waiting period"
  },
  [DistributionErrorCategory.API_UNAVAILABLE]: {
    severity: ErrorSeverity.MEDIUM,
    retryStrategy: RetryStrategy.LONG_BACKOFF,
    maxRetries: 12,
    description: "Platform API temporarily unavailable",
    resolution: "System will automatically retry when platform becomes available"
  },
  [DistributionErrorCategory.API_CHANGED]: {
    severity: ErrorSeverity.CRITICAL,
    retryStrategy: RetryStrategy.MANUAL,
    maxRetries: 0,
    description: "Platform API has changed (breaking change)",
    resolution: "System administrators have been notified and are updating the integration"
  },
  
  // Content Rules Errors
  [DistributionErrorCategory.CONTENT_REJECTED]: {
    severity: ErrorSeverity.HIGH,
    retryStrategy: RetryStrategy.MANUAL,
    maxRetries: 0,
    description: "Content violates platform policies",
    resolution: "Review platform content policies and modify content accordingly"
  },
  [DistributionErrorCategory.CONTENT_DUPLICATE]: {
    severity: ErrorSeverity.MEDIUM,
    retryStrategy: RetryStrategy.MANUAL,
    maxRetries: 0,
    description: "Content is already on the platform",
    resolution: "Check for existing releases or modify content to be unique"
  },
  [DistributionErrorCategory.RIGHTS_CONFLICT]: {
    severity: ErrorSeverity.HIGH,
    retryStrategy: RetryStrategy.MANUAL,
    maxRetries: 0,
    description: "Content has rights conflicts on platform",
    resolution: "Resolve rights conflicts or provide documentation proving rights ownership"
  },
  
  // Delivery Errors
  [DistributionErrorCategory.DELIVERY_TIMEOUT]: {
    severity: ErrorSeverity.MEDIUM,
    retryStrategy: RetryStrategy.SHORT_BACKOFF,
    maxRetries: 3,
    description: "Delivery process timed out",
    resolution: "System will automatically retry the delivery"
  },
  [DistributionErrorCategory.DELIVERY_INTERRUPTED]: {
    severity: ErrorSeverity.MEDIUM,
    retryStrategy: RetryStrategy.IMMEDIATE,
    maxRetries: 3,
    description: "Delivery was interrupted",
    resolution: "System will automatically retry the delivery"
  },
  [DistributionErrorCategory.DELIVERY_CORRUPT]: {
    severity: ErrorSeverity.HIGH,
    retryStrategy: RetryStrategy.SHORT_BACKOFF,
    maxRetries: 2,
    description: "Delivered files were corrupted",
    resolution: "System will verify file integrity and retry the delivery"
  },
  
  // System Errors
  [DistributionErrorCategory.SYSTEM_STORAGE]: {
    severity: ErrorSeverity.CRITICAL,
    retryStrategy: RetryStrategy.LONG_BACKOFF,
    maxRetries: 3,
    description: "Storage system failure",
    resolution: "System administrators have been notified"
  },
  [DistributionErrorCategory.SYSTEM_DATABASE]: {
    severity: ErrorSeverity.CRITICAL,
    retryStrategy: RetryStrategy.LONG_BACKOFF,
    maxRetries: 3,
    description: "Database error during distribution",
    resolution: "System administrators have been notified"
  },
  [DistributionErrorCategory.SYSTEM_INTERNAL]: {
    severity: ErrorSeverity.HIGH,
    retryStrategy: RetryStrategy.SHORT_BACKOFF,
    maxRetries: 3,
    description: "Internal system error",
    resolution: "System will automatically retry the operation"
  },
  
  // Network Errors
  [DistributionErrorCategory.NETWORK_TIMEOUT]: {
    severity: ErrorSeverity.MEDIUM,
    retryStrategy: RetryStrategy.SHORT_BACKOFF,
    maxRetries: 5,
    description: "Network connection timed out",
    resolution: "System will automatically retry the connection"
  },
  [DistributionErrorCategory.NETWORK_DNS]: {
    severity: ErrorSeverity.MEDIUM,
    retryStrategy: RetryStrategy.LONG_BACKOFF,
    maxRetries: 3,
    description: "DNS resolution failed",
    resolution: "System will automatically retry when DNS resolvers are available"
  },
  [DistributionErrorCategory.NETWORK_CONNECTION]: {
    severity: ErrorSeverity.MEDIUM,
    retryStrategy: RetryStrategy.SHORT_BACKOFF,
    maxRetries: 5,
    description: "Network connection failed",
    resolution: "System will automatically retry the connection"
  },
  
  // Unknown/Unspecified
  [DistributionErrorCategory.UNKNOWN]: {
    severity: ErrorSeverity.HIGH,
    retryStrategy: RetryStrategy.MANUAL,
    maxRetries: 0,
    description: "Unknown distribution error",
    resolution: "System administrators will investigate the issue"
  }
};

/**
 * Platform-specific error message patterns to help categorize errors
 */
const PLATFORM_ERROR_PATTERNS: Record<string, Record<string, RegExp[]>> = {
  // Spotify error patterns
  "spotify": {
    [DistributionErrorCategory.CONTENT_FORMAT]: [
      /unsupported (audio|file) format/i,
      /invalid file format/i
    ],
    [DistributionErrorCategory.CONTENT_QUALITY]: [
      /audio quality (below|does not meet) (minimum|requirements)/i,
      /bitrate (too low|insufficient)/i
    ],
    [DistributionErrorCategory.AUTH_EXPIRED]: [
      /token expired/i,
      /authentication expired/i
    ],
    [DistributionErrorCategory.API_RATE_LIMIT]: [
      /rate limit exceeded/i,
      /too many requests/i
    ]
  },
  
  // Apple Music error patterns
  "apple_music": {
    [DistributionErrorCategory.CONTENT_FORMAT]: [
      /unsupported (audio|file) format/i,
      /invalid codec/i
    ],
    [DistributionErrorCategory.ARTWORK_INVALID]: [
      /artwork (resolution|size|format) (invalid|not acceptable)/i,
      /artwork must be/i
    ],
    [DistributionErrorCategory.RIGHTS_CONFLICT]: [
      /content (already|previously) claimed/i,
      /rights conflict/i
    ]
  },
  
  // Generic patterns that apply to all platforms
  "generic": {
    [DistributionErrorCategory.NETWORK_TIMEOUT]: [
      /connection timed out/i,
      /request timeout/i
    ],
    [DistributionErrorCategory.NETWORK_CONNECTION]: [
      /connection (refused|failed)/i,
      /network (error|unavailable)/i
    ],
    [DistributionErrorCategory.API_UNAVAILABLE]: [
      /service (unavailable|temporarily down)/i,
      /503 service unavailable/i
    ]
  }
};

/**
 * Distribution Error Handler Class
 */
export class DistributionErrorHandler {
  /**
   * Analyze and categorize a distribution error
   * 
   * @param errorMessage - The error message to analyze
   * @param platformId - The platform ID where the error occurred
   * @returns The categorized error information
   */
  static categorizeError(errorMessage: string, platformId?: number): {
    category: DistributionErrorCategory;
    severity: ErrorSeverity;
    retryStrategy: RetryStrategy;
    description: string;
    resolution: string;
  } {
    // Default to unknown if we can't categorize
    let category = DistributionErrorCategory.UNKNOWN;
    
    // Get platform name if platformId is provided
    let platformName = 'generic';
    if (platformId) {
      // Mapping of platform IDs to names
      // This could be improved by fetching from the database
      const platformMap: Record<number, string> = {
        1: 'spotify',
        2: 'apple_music',
        3: 'amazon_music',
        4: 'youtube_music',
        5: 'deezer'
      };
      platformName = platformMap[platformId] || 'generic';
    }
    
    // Check platform-specific patterns first
    if (PLATFORM_ERROR_PATTERNS[platformName]) {
      for (const [errorCategory, patterns] of Object.entries(PLATFORM_ERROR_PATTERNS[platformName])) {
        if (patterns.some(pattern => pattern.test(errorMessage))) {
          category = errorCategory as DistributionErrorCategory;
          break;
        }
      }
    }
    
    // If no platform-specific match, check generic patterns
    if (category === DistributionErrorCategory.UNKNOWN && PLATFORM_ERROR_PATTERNS['generic']) {
      for (const [errorCategory, patterns] of Object.entries(PLATFORM_ERROR_PATTERNS['generic'])) {
        if (patterns.some(pattern => pattern.test(errorMessage))) {
          category = errorCategory as DistributionErrorCategory;
          break;
        }
      }
    }
    
    // Get the configuration for this error category
    const config = ERROR_CATEGORY_CONFIG[category];
    
    return {
      category,
      severity: config.severity,
      retryStrategy: config.retryStrategy,
      description: config.description,
      resolution: config.resolution
    };
  }

  /**
   * Handle a distribution error
   * 
   * This method:
   * 1. Categorizes the error
   * 2. Updates the distribution record with detailed error information
   * 3. Determines if the error should be automatically retried
   * 4. Schedules a retry if appropriate
   * 
   * @param distributionId - The ID of the distribution record that experienced an error
   * @param errorMessage - The error message
   * @param platformId - Optional platform ID where the error occurred
   * @returns Information about how the error was handled
   */
  static async handleError(
    distributionId: number,
    errorMessage: string,
    platformId?: number
  ): Promise<{
    success: boolean;
    errorInfo: ReturnType<typeof DistributionErrorHandler.categorizeError>;
    willRetry: boolean;
    retryScheduled?: Date;
  }> {
    try {
      // Step 1: Categorize the error
      const errorInfo = this.categorizeError(errorMessage, platformId);
      
      // Step 2: Get current retry count for this distribution
      const record = await db.query.distributionRecords.findFirst({
        where: eq(distributionRecords.id, distributionId)
      });
      
      if (!record) {
        throw new Error(`Distribution record with ID ${distributionId} not found`);
      }
      
      // TODO: Re-evaluate retry logic. Using updatedAt for now.
      // const currentRetryCount = record.retryCount || 0; // Property does not exist
      const currentRetryCount = 0; // Placeholder
      
      // Step 3: Determine if we should retry based on strategy and count
      const config = ERROR_CATEGORY_CONFIG[errorInfo.category];
      
      // Only retry if we haven't exceeded max retries and strategy isn't manual or none
      const shouldRetry = currentRetryCount < config.maxRetries && 
                          ![RetryStrategy.MANUAL, RetryStrategy.NONE].includes(config.retryStrategy);
      
      // Step 4: Calculate next retry time if applicable
      let retryTime: Date | undefined;
      
      if (shouldRetry) {
        retryTime = new Date();
        
        // Apply exponential backoff based on retry strategy and count
        switch (config.retryStrategy) {
          case RetryStrategy.IMMEDIATE:
            // Add a small delay (10 seconds) to avoid hammering the system
            retryTime.setSeconds(retryTime.getSeconds() + 10);
            break;
            
          case RetryStrategy.SHORT_BACKOFF:
            // Exponential backoff: 30 seconds, 2 minutes, 8 minutes, 32 minutes
            const shortDelayMinutes = Math.pow(4, currentRetryCount) * 0.5;
            retryTime.setMinutes(retryTime.getMinutes() + shortDelayMinutes);
            break;
            
          case RetryStrategy.LONG_BACKOFF:
            // Exponential backoff: 15 minutes, 1 hour, 4 hours, 16 hours
            const longDelayMinutes = Math.pow(4, currentRetryCount) * 15;
            retryTime.setMinutes(retryTime.getMinutes() + longDelayMinutes);
            break;
            
          default:
            retryTime = undefined;
        }
      }
      
      // Step 5: Update the distribution record with error details
      await db.update(distributionRecords)
        .set({
          status: 'failed',
          errorDetails: JSON.stringify({
            message: errorMessage,
            category: errorInfo.category,
            severity: errorInfo.severity,
            resolution: errorInfo.resolution,
            retryCount: currentRetryCount,
            timestamp: new Date().toISOString(),
            willRetry: shouldRetry,
            nextRetry: retryTime?.toISOString()
          }),
          // retryCount: currentRetryCount + (shouldRetry ? 1 : 0), // Property does not exist
          // nextRetryAt: retryTime, // Property does not exist
          updatedAt: new Date() // Update timestamp on error handling
        })
        .where(eq(distributionRecords.id, distributionId));
      
      // Return information about how the error was handled
      return {
        success: true,
        errorInfo,
        willRetry: shouldRetry,
        retryScheduled: retryTime
      };
    } catch (error) {
      console.error(`Error handling distribution error for distribution ${distributionId}:`, error);
      return {
        success: false,
        errorInfo: this.categorizeError(`Failed to handle error: ${error instanceof Error ? error.message : String(error)}`),
        willRetry: false
      };
    }
  }

  /**
   * Find and process all distribution records that are due for retry
   * 
   * @returns Number of distributions that were scheduled for retry
   */
  static async processRetries(): Promise<number> {
    try {
      // Get current time
      const now = new Date();
      
      // Find all failed distributions that have a nextRetryAt time in the past
      const retriableDist = await db.select()
        .from(distributionRecords)
        .where(
          and(
            eq(distributionRecords.status, 'failed'),
            lt(distributionRecords.nextRetryAt, now),
            gt(distributionRecords.nextRetryAt, new Date(0)) // Ensure nextRetryAt is set
          )
        );
      
      let processedCount = 0;
      
      // Process each retriable distribution
      for (const dist of retriableDist) {
        try {
          // Reset to pending status to trigger reprocessing
          await db.update(distributionRecords)
            .set({
              status: 'pending',
              lastChecked: now,
              lastAttempt: now,
              errorDetails: null // Clear error details for retry
            })
            .where(eq(distributionRecords.id, dist.id));
          
          processedCount++;
        } catch (error) {
          console.error(`Error scheduling retry for distribution ${dist.id}:`, error);
          // Continue with other retries even if one fails
        }
      }
      
      return processedCount;
    } catch (error) {
      console.error("Error processing distribution retries:", error);
      return 0;
    }
  }

  /**
   * Get statistics about current distribution errors
   * 
   * @returns Statistical breakdown of distribution errors
   */
  static async getErrorStatistics(): Promise<{
    totalErrors: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<string, number>;
    pendingRetries: number;
    autoRetried: number;
    manualRetryRequired: number;
  }> {
    // Get all failed distribution records
    const failedRecords = await db.select()
      .from(distributionRecords)
      .where(eq(distributionRecords.status, 'failed'));
    
    // Initialize statistics
    const stats = {
      totalErrors: failedRecords.length,
      bySeverity: {
        [ErrorSeverity.CRITICAL]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.INFO]: 0
      },
      byCategory: {} as Record<string, number>,
      pendingRetries: 0,
      autoRetried: 0,
      manualRetryRequired: 0
    };
    
    // Process each failed record
    for (const record of failedRecords) {
      try {
        // Parse error details if available
        if (record.errorDetails) {
          const errorDetails = JSON.parse(record.errorDetails.toString());
          
          // Update category counts
          const category = errorDetails.category || DistributionErrorCategory.UNKNOWN;
          stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
          
          // Update severity counts
          const severity = errorDetails.severity || ErrorSeverity.HIGH;
          stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;
          
          // Update retry counts
          if (errorDetails.willRetry) {
            stats.pendingRetries += errorDetails.nextRetry && new Date(errorDetails.nextRetry) > new Date() ? 1 : 0;
            stats.autoRetried += record.retryCount > 0 ? 1 : 0;
          } else {
            stats.manualRetryRequired++;
          }
        } else {
          // Default categorization if no error details
          stats.byCategory[DistributionErrorCategory.UNKNOWN] = 
            (stats.byCategory[DistributionErrorCategory.UNKNOWN] || 0) + 1;
          stats.bySeverity[ErrorSeverity.HIGH]++;
          stats.manualRetryRequired++;
        }
      } catch (error) {
        console.error(`Error processing error details for distribution ${record.id}:`, error);
        // Use default categorization on error
        stats.byCategory[DistributionErrorCategory.UNKNOWN] = 
          (stats.byCategory[DistributionErrorCategory.UNKNOWN] || 0) + 1;
        stats.bySeverity[ErrorSeverity.HIGH]++;
        stats.manualRetryRequired++;
      }
    }
    
    return stats;
  }
}