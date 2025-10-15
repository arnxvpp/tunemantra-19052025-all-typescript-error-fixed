
import { WhiteLabelConfig } from '../types';
import { defaultWhiteLabel } from '../config/mobile-api';

class WhiteLabelService {
  private configs: Map<string, WhiteLabelConfig> = new Map();
  private customDomains: Map<string, string> = new Map();

  constructor() {
    this.configs.set('default', defaultWhiteLabel);
  }

  getConfig(domain: string): WhiteLabelConfig {
    const mappedDomain = this.customDomains.get(domain) || domain;
    return this.configs.get(mappedDomain) || defaultWhiteLabel;
  }

  async setConfig(domain: string, config: Partial<WhiteLabelConfig>): Promise<WhiteLabelConfig> {
    const existingConfig = this.configs.get(domain) || { ...defaultWhiteLabel };
    const newConfig = { ...existingConfig, ...config };
    this.configs.set(domain, newConfig);
    return newConfig;
  }

  async setCustomDomain(originalDomain: string, customDomain: string): Promise<void> {
    this.customDomains.set(customDomain, originalDomain);
  }

  async getThemeConfig(domain: string): Promise<any> {
    const config = this.getConfig(domain);
    return {
      colors: {
        primary: config.primaryColor,
        secondary: config.secondaryColor,
        accent: config.accentColor,
        background: config.backgroundColor,
        text: config.textColor,
      },
      logo: config.logoUrl,
      brandName: config.brandName,
      customStyles: config.customStyles,
      fonts: config.fonts,
      layout: config.layout,
      menuStyle: config.menuStyle,
      headerStyle: config.headerStyle,
    };
  }

  async validateDomain(domain: string): Promise<boolean> {
    // Add domain validation logic
    return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(domain);
  }

  async backupConfig(domain: string): Promise<void> {
    const config = this.getConfig(domain);
    // Add backup logic
    await storage.saveConfigBackup(domain, config);
  }

  async restoreConfig(domain: string, version: string): Promise<WhiteLabelConfig> {
    const backup = await storage.getConfigBackup(domain, version);
    if (backup) {
      await this.setConfig(domain, backup);
      return backup;
    }
    throw new Error('Backup not found');
  }
}

export const whiteLabelService = new WhiteLabelService();
