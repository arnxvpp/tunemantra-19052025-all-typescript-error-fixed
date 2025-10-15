import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
// Remove incorrect import: import { ContractInstances } from '../types';
import { useWeb3 } from '../Web3Provider';
import { useToast } from '@/hooks/use-toast';

// ABI imports would normally come from contract artifacts
// For now, we'll use placeholder ABIs
const MUSIC_NFT_ABI = [
  // Basic ERC721 functions
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  
  // Minting function
  "function mint(address to, string memory tokenURI) returns (uint256)",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];

const RIGHTS_REGISTRY_ABI = [
  // Rights registry functions
  "function registerRelease(string memory externalId, string memory title, string memory artist, string memory metadataUri) returns (uint256)",
  "function verifyRelease(uint256 releaseId) returns (bool)",
  "function getReleaseByExternalId(string memory externalId) view returns (tuple(uint256 id, string externalId, string title, string artist, address owner, string metadataUri, uint256 registrationDate, bool isVerified))",
  
  // Events
  "event ReleaseRegistered(uint256 indexed releaseId, string externalId, address indexed registrant)",
  "event ReleaseVerified(uint256 indexed releaseId, address indexed verifier)"
];

const ROYALTY_SPLITTER_ABI = [
  // Royalty splitter functions
  "function createSplitForRelease(uint256 releaseId, address[] memory recipients, uint256[] memory shares) returns (uint256)",
  "function distributeFunds(uint256 splitId) payable returns (bool)",
  "function getSplitInfo(uint256 splitId) view returns (tuple(uint256 id, uint256 releaseId, address[] recipients, uint256[] shares, uint256 totalDistributed))",
  
  // Events
  "event SplitCreated(uint256 indexed splitId, uint256 indexed releaseId, address creator)",
  "event FundsDistributed(uint256 indexed splitId, uint256 amount)"
];

// Contract addresses - would come from deployment config
const CONTRACT_ADDRESSES = {
  // Mumbai testnet addresses (example placeholders)
  80001: {
    musicNFT: '0x0000000000000000000000000000000000000000',
    musicRightsRegistry: '0x0000000000000000000000000000000000000000',
    royaltySplitter: '0x0000000000000000000000000000000000000000'
  },
  // Polygon mainnet addresses
  137: {
    musicNFT: '0x0000000000000000000000000000000000000000',
    musicRightsRegistry: '0x0000000000000000000000000000000000000000',
    royaltySplitter: '0x0000000000000000000000000000000000000000'
  }
};

// Define the ContractInstances type locally
interface ContractInstances {
  musicNFT: ethers.Contract | null;
  musicRightsRegistry: ethers.Contract | null;
  royaltySplitter: ethers.Contract | null;
}

export const useContracts = () => {
  const { provider, chainId, isConnected } = useWeb3();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [contracts, setContracts] = useState<ContractInstances>({
    musicNFT: null,
    musicRightsRegistry: null,
    royaltySplitter: null
  });

  useEffect(() => {
    const initializeContracts = async () => {
      if (!provider || !chainId || !isConnected) {
        setContracts({
          musicNFT: null,
          musicRightsRegistry: null,
          royaltySplitter: null
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const networkAddresses = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
        
        if (!networkAddresses) {
          throw new Error(`No contract addresses available for network ${chainId}`);
        }
        
        // Ensure provider exists before getting signer
        if (!provider) {
           throw new Error("Provider is not available to get signer.");
        }
        const signer = await provider.getSigner(); // Await the signer

        // Initialize contracts with ABIs and addresses
        const musicNFT = new ethers.Contract(
          networkAddresses.musicNFT,
          MUSIC_NFT_ABI,
          signer
        );

        const musicRightsRegistry = new ethers.Contract(
          networkAddresses.musicRightsRegistry,
          RIGHTS_REGISTRY_ABI,
          signer
        );

        const royaltySplitter = new ethers.Contract(
          networkAddresses.royaltySplitter,
          ROYALTY_SPLITTER_ABI,
          signer
        );

        setContracts({
          musicNFT,
          musicRightsRegistry,
          royaltySplitter
        });
      } catch (error) {
        console.error('Error initializing contracts:', error);
        toast({
          title: 'Contract Initialization Error',
          description: error instanceof Error ? error.message : 'Failed to initialize blockchain contracts',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    initializeContracts();
  }, [provider, chainId, isConnected, toast]);

  return {
    ...contracts,
    isLoading
  };
};

export default useContracts;