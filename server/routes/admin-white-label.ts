import { Router, Request, Response } from 'express';
import { ensureAdmin } from '../auth';
import { whiteLabelService } from '../services/white-label';

export const adminWhiteLabelRouter = Router();

// Get the current white label configuration
adminWhiteLabelRouter.get('/config', async (req: Request, res: Response) => {
  try {
    const domain = req.get('host') || 'default';
    const config = whiteLabelService.getConfig(domain);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get white label configuration' });
  }
});

// Update white label configuration - super admin only
adminWhiteLabelRouter.post('/config', ensureAdmin, async (req: Request, res: Response) => {
  try {
    const domain = req.get('host') || 'default';
    const config = await whiteLabelService.setConfig(domain, req.body);
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update white label configuration' });
  }
});

// Set a custom domain for white labeling
adminWhiteLabelRouter.post('/domain', ensureAdmin, async (req: Request, res: Response) => {
  try {
    const { originalDomain, customDomain } = req.body;
    
    if (!originalDomain || !customDomain) {
      return res.status(400).json({ error: 'Both originalDomain and customDomain are required' });
    }
    
    await whiteLabelService.setCustomDomain(originalDomain, customDomain);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to set custom domain' });
  }
});

// Get theme configuration
adminWhiteLabelRouter.get('/theme', ensureAdmin, async (req: Request, res: Response) => {
  try {
    const domain = req.get('host') || 'default';
    const theme = await whiteLabelService.getThemeConfig(domain);
    res.json(theme);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get theme configuration' });
  }
});

// Backup current configuration
adminWhiteLabelRouter.post('/backup', ensureAdmin, async (req: Request, res: Response) => {
  try {
    const domain = req.get('host') || 'default';
    await whiteLabelService.backupConfig(domain);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to backup configuration' });
  }
});

// Restore configuration from backup
adminWhiteLabelRouter.post('/restore/:version', ensureAdmin, async (req: Request, res: Response) => {
  try {
    const domain = req.get('host') || 'default';
    const { version } = req.params;
    
    const restoredConfig = await whiteLabelService.restoreConfig(domain, version);
    res.json(restoredConfig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore configuration' });
  }
});

export default adminWhiteLabelRouter;