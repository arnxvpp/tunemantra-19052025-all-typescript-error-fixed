// This is a simulated FTP service for the frontend
// In a real application, these operations would be handled by the backend

interface FTPCredentials {
  host: string;
  username: string;
  password: string;
  port?: number;
  secure?: boolean;
}

interface FTPUploadOptions {
  remotePath: string;
  fileName: string;
  data: Blob | string;
  onProgress?: (percent: number) => void;
  distributorId?: string;
}

interface FTPUploadResult {
  success: boolean;
  message: string;
  filePath?: string;
  distributorId?: string;
  timestamp: Date;
}

interface FTPDistributor {
  id: string;
  name: string;
  ftpCredentials: FTPCredentials;
  defaultPath: string;
  metadataFormat: string;
  supportsAutoImport: boolean;
}

// Mock list of distributors with FTP credentials (in a real app, this would come from backend)
const DISTRIBUTORS: FTPDistributor[] = [
  {
    id: "spotify",
    name: "Spotify",
    ftpCredentials: {
      host: "ftp.spotify-distribution.com",
      username: "partner_demo",
      password: "********",
      port: 21,
      secure: true
    },
    defaultPath: "/metadata-uploads/",
    metadataFormat: "csv",
    supportsAutoImport: true
  },
  {
    id: "apple",
    name: "Apple Music",
    ftpCredentials: {
      host: "ftp.apple-music-delivery.com",
      username: "partner_demo",
      password: "********",
      port: 21,
      secure: true
    },
    defaultPath: "/content/metadata/",
    metadataFormat: "xml",
    supportsAutoImport: true
  },
  {
    id: "tidal",
    name: "Tidal",
    ftpCredentials: {
      host: "ftp.tidal-delivery.com",
      username: "partner_demo",
      password: "********",
      port: 22,
      secure: true
    },
    defaultPath: "/incoming/",
    metadataFormat: "ddex",
    supportsAutoImport: false
  },
  {
    id: "amazon",
    name: "Amazon Music",
    ftpCredentials: {
      host: "ftp.amazon-music-delivery.com",
      username: "partner_demo",
      password: "********",
      port: 21,
      secure: true
    },
    defaultPath: "/metadata/",
    metadataFormat: "json",
    supportsAutoImport: true
  }
];

/**
 * FTP service class for handling secure file transfers to distributors
 */
class FTPService {
  // Get list of available distributors
  getDistributors(): FTPDistributor[] {
    return DISTRIBUTORS;
  }
  
  // Get a specific distributor by ID
  getDistributor(distributorId: string): FTPDistributor | undefined {
    return DISTRIBUTORS.find(d => d.id === distributorId);
  }
  
  // Simulate an FTP upload to a distributor
  async uploadToDistributor(
    distributorId: string, 
    data: Blob | string, 
    fileName: string,
    onProgress?: (percent: number) => void
  ): Promise<FTPUploadResult> {
    const distributor = this.getDistributor(distributorId);
    
    if (!distributor) {
      return {
        success: false,
        message: `Distributor with ID "${distributorId}" not found`,
        timestamp: new Date()
      };
    }
    
    // In a real app, this would connect to the backend to initiate the actual FTP upload
    // Here we simulate the progress and result
    return new Promise((resolve) => {
      let progress = 0;
      
      // Simulate upload progress
      const interval = setInterval(() => {
        progress += 10;
        if (onProgress) onProgress(progress);
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Simulate a small delay for completion
          setTimeout(() => {
            resolve({
              success: true,
              message: `Successfully uploaded "${fileName}" to ${distributor.name}`,
              filePath: `${distributor.defaultPath}${fileName}`,
              distributorId: distributor.id,
              timestamp: new Date()
            });
          }, 500);
        }
      }, 300);
    });
  }
  
  // Simulate a bulk upload to multiple distributors
  async bulkUpload(
    distributorIds: string[],
    data: Blob | string,
    fileName: string,
    onProgress?: (distributorId: string, percent: number) => void
  ): Promise<FTPUploadResult[]> {
    const results: FTPUploadResult[] = [];
    
    // Process each distributor sequentially
    for (const distributorId of distributorIds) {
      const result = await this.uploadToDistributor(
        distributorId,
        data,
        fileName,
        (percent) => {
          if (onProgress) onProgress(distributorId, percent);
        }
      );
      
      results.push(result);
    }
    
    return results;
  }
  
  // Verify FTP credentials (simulated)
  async verifyCredentials(credentials: FTPCredentials): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate credential verification
      setTimeout(() => {
        // For demo purposes, consider all credentials valid except for specific invalid cases
        const invalidHost = credentials.host.includes("invalid");
        resolve(!invalidHost);
      }, 1000);
    });
  }
}

// Export singleton instance
export const ftpService = new FTPService();