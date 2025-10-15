import { useState } from 'react';
// Remove incorrect import: import { IPFSMetadata } from '../types';
import { useToast } from '@/hooks/use-toast';

// Define IPFSMetadata type locally based on usage
interface IPFSMetadata {
  name: string;
  description: string;
  image?: string;
  attributes?: { trait_type: string; value: string | number }[];
  properties?: Record<string, any>; // Allow additional properties
  [key: string]: any; // Allow other arbitrary keys
}

/**
 * Hook for interacting with IPFS for NFT metadata storage
 * 
 * This hook provides functionality to:
 * 1. Upload metadata to IPFS (using either Pinata or nft.storage)
 * 2. Retrieve metadata from IPFS
 * 3. Handle errors and loading states
 */
export const useIPFS = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Upload metadata to IPFS
   * 
   * In a production environment, this would use Pinata, IPFS, or NFT.Storage API
   * For this implementation, we'll simulate the upload and return a fake CID
   * 
   * @param metadata - Metadata to upload
   * @returns IPFS CID (Content Identifier)
   */
  const uploadMetadata = async (metadata: IPFSMetadata): Promise<string> => {
    setIsUploading(true);
    setError(null);
    
    try {
      // Normally we would make an API call to IPFS provider
      // For this implementation, we'll simulate the upload
      
      // Validate metadata
      if (!metadata.name || !metadata.description) {
        throw new Error('Metadata must include name and description');
      }
      
      // Log the metadata being "uploaded"
      console.log('Uploading metadata to IPFS:', metadata);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a fake IPFS CID (Content Identifier)
      // In reality, this would be returned from the IPFS provider
      const fakeCid = 'bafybeih' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      toast({
        title: 'Metadata uploaded to IPFS',
        description: `CID: ${fakeCid.substring(0, 10)}...`,
      });
      
      return fakeCid;
    } catch (err) {
      console.error('Error uploading to IPFS:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error uploading to IPFS';
      
      setError(err instanceof Error ? err : new Error(errorMessage));
      
      toast({
        title: 'IPFS Upload Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Fetch metadata from IPFS
   * 
   * @param cid - IPFS CID (Content Identifier)
   * @returns Metadata object
   */
  const fetchMetadata = async (cid: string): Promise<IPFSMetadata> => {
    try {
      // In a real implementation, this would make a request to an IPFS gateway
      // For this demo, we'll return mock data
      
      // Validate CID format
      if (!cid.startsWith('bafy')) {
        throw new Error('Invalid IPFS CID format');
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock metadata
      return {
        name: "Sample Music NFT",
        description: "This is a sample music NFT metadata retrieved from IPFS",
        image: `https://ipfs.io/ipfs/${cid}/image.jpg`,
        attributes: [
          { trait_type: "Artist", value: "Sample Artist" },
          { trait_type: "Genre", value: "Electronic" },
          { trait_type: "Year", value: "2023" }
        ],
        properties: {
          title: "Sample Track",
          artist: "Sample Artist",
          catalogueId: "CAT-123",
          releaseDate: new Date().toISOString() 
        }
      };
    } catch (err) {
      console.error('Error fetching from IPFS:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching from IPFS';
      
      toast({
        title: 'IPFS Fetch Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw err;
    }
  };

  return {
    uploadMetadata,
    fetchMetadata,
    isUploading,
    error
  };
};

export default useIPFS;