
import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../auth';
import { DistributionService } from '../services/distribution';
import { validateRequest } from '../utils/validation';
import {
  getPlatformsQuerySchema,
  releaseIdParamSchema,
  platformSettingsSchema,
  createPlatformSchema,
  updatePlatformSchema,
  platformIdParamSchema
} from '../schemas/distribution-schemas';

const router = Router();

// Get all distribution platforms (public info only)
router.get('/', requireAuth, validateRequest(getPlatformsQuerySchema, 'query'), async (req, res) => {
  try {
    // Get platform list (sensitive API credentials are filtered out)
    const platforms = await storage.getDistributionPlatforms();

    // Map platforms to include availability flag
    const mappedPlatforms = await Promise.all(platforms.map(async (platform) => {
      const hasCredentials = await DistributionService.hasPlatformCredentials(platform.id);
      return {
        ...platform,
        apiCredentials: undefined, // Remove sensitive data
        isAvailable: platform.status === 'active' && hasCredentials
      };
    }));

    res.json(mappedPlatforms);
  } catch (error) {
    console.error('Error fetching distribution platforms:', error);
    res.status(500).json({ error: 'Failed to fetch distribution platforms' });
  }
});

// Admin-only: Save platform settings
router.post('/admin/settings', requireAuth, validateRequest(platformSettingsSchema), async (req, res) => {
  try {
    // Check if user is admin
    if (!req.session?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { platforms } = req.body;

    if (!Array.isArray(platforms)) {
      return res.status(400).json({ error: 'Invalid platform data' });
    }

    // Process each platform update
    const results = await Promise.all(platforms.map(async (platform) => {
      const { name, status, apiCredentials } = platform;

      // Look for existing platform by name
      const existingPlatform = await DistributionService.getPlatformByName(name);

      if (existingPlatform) {
        // Update existing platform
        return await storage.updateDistributionPlatform(existingPlatform.id, {
          status,
          apiCredentials
        });
      } else {
        // Create new platform
        return await storage.createDistributionPlatform({
          name,
          status,
          apiCredentials,
          type: platform.type || 'streaming'
        });
      }
    }));

    res.status(200).json({ success: true, platforms: results });
  } catch (error) {
    console.error('Error saving platform settings:', error);
    res.status(500).json({ error: 'Failed to save platform settings' });
  }
});

// Get platform availability for a specific release
router.get('/availability/:releaseId', requireAuth, validateRequest(releaseIdParamSchema, 'params'), async (req, res) => {
  try {
    const releaseId = parseInt(req.params.releaseId);

    // Get all active platforms
    const platforms = await DistributionService.getActivePlatforms();

    // Get existing distribution records for this release
    const distributionRecords = await storage.getDistributionRecords(releaseId);

    // Map platforms with distribution status
    const availablePlatforms = await Promise.all(platforms.map(async (platform) => {
      const hasCredentials = await DistributionService.hasPlatformCredentials(platform.id);
      const existingDistribution = distributionRecords.find(
        record => record.platformId === platform.id
      );

      return {
        id: platform.id,
        name: platform.name,
        type: platform.type,
        isAvailable: hasCredentials,
        distributionStatus: existingDistribution ? existingDistribution.status : null,
        distributionId: existingDistribution ? existingDistribution.id : null
      };
    }));

    res.json(availablePlatforms);
  } catch (error) {
    console.error('Error fetching platform availability:', error);
    res.status(500).json({ error: 'Failed to fetch platform availability' });
  }
});

export default router;