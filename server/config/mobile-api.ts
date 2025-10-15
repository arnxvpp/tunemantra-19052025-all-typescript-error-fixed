
import { WhiteLabelConfig } from '../types';

export const mobileApiConfig = {
  version: '1.0',
  endpoints: {
    auth: '/api/mobile/auth',
    catalog: '/api/mobile/catalog',
    analytics: '/api/mobile/analytics',
    distribution: '/api/mobile/distribution'
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  }
};

export const defaultWhiteLabel: WhiteLabelConfig = {
  enabled: false,
  brandName: 'Music Distribution',
  logoUrl: '/logo.png',
  primaryColor: '#4CAF50',
  secondaryColor: '#2196F3',
  customStyles: {}
};
