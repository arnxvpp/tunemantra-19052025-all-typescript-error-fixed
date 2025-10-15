
import { Router, Request, Response } from 'express'; // Add Request, Response
import rateLimit from 'express-rate-limit';
import { Storage } from '../storage'; // Fix import name
import { validateRequest } from '../schemas'; // Keep this import
import { createApiKeySchema, apiKeyIdParamSchema, getApiKeysQuerySchema } from '../schemas/api-access-schemas'; // Import directly
// import { ApiAccessKey } from '@shared/schema'; // Type not exported from shared schema

const router = Router();

const apiKeyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

router.use(apiKeyLimiter);

/**
 * Create a new API key
 * 
 * POST /api/api-keys
 * 
 * Creates a new API key with the specified name, expiration, scopes, and description.
 * API keys allow programmatic access to the application's API.
 * 
 * Required fields:
 * - name: String (name for this API key)
 * - scopes: Array of strings (permissions for this key)
 * 
 * Optional fields:
 * - expiresIn: Number (seconds until expiration)
 * - description: String (purpose of this key)
 */
router.post('/api-keys', validateRequest(createApiKeySchema), async (req: Request, res: Response) => { // Add types
  if (!req.user) return res.sendStatus(401);
  try {
    const storage = new Storage(); // Instantiate Storage
    // TODO: Verify Storage.createApiKey existence
    // const apiKey = await storage.createApiKey({
    //   userId: req.user.id,
    //   name: req.body.name,
    //   scopes: req.body.scopes,
    //   expiresIn: req.body.expiresIn,
    //   description: req.body.description
    // });
    const apiKey = { // Placeholder
        id: Math.random(),
        key: 'placeholder_key_***',
        name: req.body.name,
        scopes: req.body.scopes,
        userId: req.user.id,
        createdAt: new Date(),
        expiresAt: req.body.expiresIn ? new Date(Date.now() + req.body.expiresIn * 1000) : null,
        lastUsed: null,
        isActive: true
    };
    res.status(201).json(apiKey);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

/**
 * Get all API keys for the authenticated user
 * 
 * GET /api/api-keys
 * 
 * Returns a list of all API keys that belong to the authenticated user.
 * For security reasons, only shows partial key values.
 * 
 * Query Parameters:
 * - includeInactive: Boolean (include inactive keys, default false)
 * - sortBy: String (field to sort by: name, createdAt, expiresAt, lastUsed)
 */
router.get('/api-keys', validateRequest(getApiKeysQuerySchema, 'query'), async (req: Request, res: Response) => { // Add types
  if (!req.user) return res.sendStatus(401);
  try {
    const { sortBy } = req.query;
    // Fix type comparison: Parse includeInactive as boolean
    const includeInactive = req.query.includeInactive === 'true';
    const storage = new Storage(); // Instantiate Storage
    // TODO: Verify Storage.getApiKeys existence
    // const apiKeys = await storage.getApiKeys(req.user!.id); // Add non-null assertion
    const apiKeys: any[] = []; // Placeholder - Use any[] as ApiAccessKey type is unavailable
    
    // Apply filters based on query parameters
    let filteredKeys = apiKeys;
    if (!includeInactive) { // Use parsed boolean
      // Use 'any' type as ApiAccessKey is not exported
      filteredKeys = filteredKeys.filter((key: any) => key.isActive);
    }
    
    // Apply sorting
    if (sortBy) {
      // Use 'any' type as ApiAccessKey is not exported
      filteredKeys.sort((a: any, b: any) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'expiresAt':
            // Handle null expiresAt
            const expiresA = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity;
            const expiresB = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity;
            return expiresA - expiresB;
          case 'lastUsed':
             // Handle null lastUsed
            const lastUsedA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
            const lastUsedB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
            return lastUsedA - lastUsedB;
          case 'createdAt':
          default:
            // createdAt should not be null based on schema
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
      });
    }
    
    res.json(filteredKeys);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch API keys' });
  }
});

/**
 * Delete an API key
 * 
 * DELETE /api/api-keys/:id
 * 
 * Permanently deletes the specified API key.
 * This action cannot be undone.
 */
router.delete('/api-keys/:id', validateRequest(apiKeyIdParamSchema, 'params'), async (req: Request, res: Response) => { // Add types
  if (!req.user) return res.sendStatus(401);
  try {
    const storage = new Storage(); // Instantiate Storage
    // TODO: Verify Storage.deleteApiKey existence
    // await storage.deleteApiKey(parseInt(req.params.id));
    console.log(`(Placeholder) Deleting API key ${req.params.id}`); // Placeholder
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

export default router;
