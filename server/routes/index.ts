/**
 * API Routes Index
 * 
 * This file exports all API routes for the application.
 * It serves as a central registry of available routes for importing in server/routes.ts.
 */

// Import route handlers
import { analyticsRouter } from './analytics';
import { mobileApiRouter } from './mobile-api';
import { platformRoyaltyAnalyticsRouter } from './platform-royalty-analytics';

// Export all routes
export { analyticsRouter, mobileApiRouter, platformRoyaltyAnalyticsRouter };