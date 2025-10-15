// API client for distribution-related endpoints

/**
 * Get all available distribution platforms
 */
export async function getDistributionPlatforms() {
  const response = await fetch('/api/distribution-platforms');
  if (!response.ok) {
    throw new Error('Failed to fetch distribution platforms');
  }
  return response.json();
}

/**
 * Distribute a release to a platform
 */
export async function distributeRelease(releaseId: number, platformId: number) {
  const response = await fetch(`/api/releases/${releaseId}/distribute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platformId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to distribute release');
  }
  
  return response.json();
}

/**
 * Schedule distribution for a later date
 */
export async function scheduleDistribution(
  releaseId: number, 
  platformId: number, 
  scheduledDate: Date
) {
  const response = await fetch(`/api/releases/${releaseId}/schedule-distribution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      platformId,
      scheduledDate: scheduledDate.toISOString()
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to schedule distribution');
  }
  
  return response.json();
}

/**
 * Get distribution status for a release
 */
export async function getDistributionStatus(releaseId: number) {
  const response = await fetch(`/api/releases/${releaseId}/distribution-status`);
  
  if (!response.ok) {
    throw new Error('Failed to get distribution status');
  }
  
  return response.json();
}

/**
 * Check platform availability for a release
 */
export async function checkPlatformAvailability(releaseId: number) {
  const response = await fetch(`/api/distribution-platforms/availability/${releaseId}`);
  
  if (!response.ok) {
    throw new Error('Failed to check platform availability');
  }
  
  return response.json();
}
/**
 * API helpers for distribution functionality
 */

// Check platform availability for a release
export async function getPlatformAvailability(releaseId: number) {
  const response = await fetch(`/api/distribution-platforms/availability/${releaseId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch platform availability');
  }
  return await response.json();
}

// Distribute a release to a platform
export async function distributeReleaseToPlatform(releaseId: number, platformId: number) {
  const response = await fetch(`/api/releases/${releaseId}/distribute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ platformId }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to distribute release');
  }
  
  return await response.json();
}

// Remove duplicate function definition
// export async function getDistributionStatus(releaseId: number) { ... }
