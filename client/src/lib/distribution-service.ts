import { toast } from "@/hooks/use-toast";
import { apiRequest } from "./queryClient";
import { ExportFormat, CompleteRelease, exportMetadata } from "./metadata-export";

// Platform type
export interface DistributionPlatform {
  id: number;
  name: string;
  logoUrl?: string;
  status: "active" | "inactive" | "maintenance";
  apiCredentials?: Record<string, any>;
  supportedFormats: ExportFormat[];
  supportedContentTypes: string[];
  deliveryMethods: ("api" | "ftp" | "manual")[];
  availableRegions?: string[];
}

// Distribution status
export interface DistributionStatus {
  platformId: number;
  platformName: string;
  status: "pending" | "processing" | "completed" | "failed";
  lastAttempt?: string;
  lastSuccess?: string;
  errorDetails?: string;
}

// Distribution record
export interface DistributionRecord {
  id: number;
  releaseId: number;
  platformId: number;
  status: "pending" | "processing" | "completed" | "failed";
  lastAttempt: string;
  lastSuccess?: string;
  errorDetails?: string;
}

// Scheduled distribution
export interface ScheduledDistribution {
  id: number;
  releaseId: number;
  platformId: number;
  scheduledDate: string;
  status: "scheduled" | "processing" | "completed" | "failed" | "cancelled";
  createdAt: string;
  completedAt?: string;
}

// Distribution job interface
export interface DistributionJob {
  id: string;
  releaseId: number;
  platformId: number;
  platformName: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  message?: string;
  timestamp: Date;
  error?: string;
}

/**
 * Get all available distribution platforms
 */
export async function getDistributionPlatforms(): Promise<DistributionPlatform[]> {
  return apiRequest<DistributionPlatform[]>('/api/distribution-platforms');
}

/**
 * Distribute a release to a platform
 */
export async function distributeReleaseToPlatform(releaseId: number, platformId: number): Promise<{ success: boolean; message: string }> {
  return apiRequest<{ success: boolean; message: string }>(`/api/releases/${releaseId}/distribute`, 'POST', { platformId });
}

/**
 * Schedule distribution for a later date
 */
export async function scheduleDistribution(
  releaseId: number, 
  platformId: number, 
  scheduledDate: Date
): Promise<ScheduledDistribution> {
  return apiRequest<ScheduledDistribution>(
    `/api/releases/${releaseId}/schedule-distribution`, 
    'POST', 
    { platformId, scheduledDate: scheduledDate.toISOString() }
  );
}

/**
 * Get distribution status for a release
 */
export async function getDistributionStatus(releaseId: number): Promise<DistributionStatus[]> {
  return apiRequest<DistributionStatus[]>(`/api/releases/${releaseId}/distribution-status`);
}

/**
 * Check platform availability for a release
 */
export async function getPlatformAvailability(releaseId: number): Promise<{ 
  platformId: number; 
  name: string; 
  available: boolean; 
  reason?: string;
}[]> {
  return apiRequest<{ platformId: number; name: string; available: boolean; reason?: string }[]>(
    `/api/distribution-platforms/availability/${releaseId}`
  );
}

/**
 * Cancel a scheduled distribution
 */
export async function cancelScheduledDistribution(id: number): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/api/distributions/scheduled/${id}/cancel`, 
    'POST'
  );
}

/**
 * Process bulk distribution for multiple releases
 * This is a client-side simulation since we don't have the actual backend implementation
 */
export async function processBulkDistribution(
  releaseIds: number[], 
  platformIds: number[],
  onProgress?: (jobs: DistributionJob[]) => void
): Promise<DistributionJob[]> {
  // Mock implementation for demo purpose
  const jobs: DistributionJob[] = [];
  
  // Get platform names
  const platforms = await getDistributionPlatforms();
  
  // Create initial jobs
  for (const platformId of platformIds) {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) continue;
    
    for (const releaseId of releaseIds) {
      const job: DistributionJob = {
        id: Math.random().toString(36).substr(2, 9),
        releaseId,
        platformId,
        platformName: platform.name,
        status: "pending",
        progress: 0,
        timestamp: new Date()
      };
      
      jobs.push(job);
    }
  }
  
  // Report initial progress
  if (onProgress) {
    onProgress([...jobs]);
  }
  
  // Process jobs one by one
  for (const job of jobs) {
    try {
      // Update status to processing
      job.status = "processing";
      job.progress = 10;
      if (onProgress) onProgress([...jobs]);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      job.progress = 50;
      if (onProgress) onProgress([...jobs]);
      
      // Simulate more processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Randomly fail some jobs for demonstration
      if (Math.random() < 0.1) {
        throw new Error("Simulated distribution failure");
      }
      
      // Complete the job
      job.progress = 100;
      job.status = "completed";
      if (onProgress) onProgress([...jobs]);
    } catch (error) {
      job.status = "failed";
      job.progress = 0;
      job.error = error instanceof Error ? error.message : "Unknown error";
      if (onProgress) onProgress([...jobs]);
    }
  }
  
  // Return final job statuses
  return jobs;
}

/**
 * Export release metadata and optionally upload to distribution platforms
 */
export async function exportReleaseMetadata(
  release: CompleteRelease,
  format: ExportFormat = "excel",
  distributorId?: string,
  useTemplate: boolean = false
): Promise<void> {
  try {
    // Use the exportMetadata function from metadata-export.ts
    exportMetadata(release, format, distributorId, useTemplate);
    
    toast({
      title: "Export successful",
      description: `Metadata exported as ${format.toUpperCase()} format`
    });
  } catch (error) {
    toast({
      title: "Export failed",
      description: error instanceof Error ? error.message : "An unexpected error occurred",
      variant: "destructive"
    });
    throw error;
  }
}