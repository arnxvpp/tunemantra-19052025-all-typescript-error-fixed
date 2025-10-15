import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';
import type { RegisterRightsParams, VerifyRightsParams, MintParams, TransferParams } from './types'; // Import types

// Define types for the context
export type NetworkType = 'ethereum' | 'polygon' | 'mumbai' | 'optimism' | 'arbitrum' | 'base';

interface Web3ContextType {
  provider: ethers.BrowserProvider | null; // Updated provider type
  signer: ethers.Signer | null;
  network: NetworkType | null;
  address: string | null; // Renamed from account
  isConnected: boolean;
  isLoading: boolean; // Renamed from isConnecting
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void; // Changed return type to void
  switchNetwork: (networkType: NetworkType) => Promise<void>;
  registerRights: (rightsData: RegisterRightsParams) => Promise<{ success: boolean; tokenId?: string; rightsId?: number; message?: string; }>; // Use imported type
  verifyRights: (verificationData: VerifyRightsParams) => Promise<boolean>; // Use imported type, return boolean
  getSupportedNetworks: () => { id: string; name: string; chainId: number }[];
  web3Enabled: boolean;
  // Add missing functions if they are intended to be part of the context
  // mintToken: (params: MintParams) => Promise<string>; 
  // transferRights: (params: TransferParams) => Promise<void>;
}

// Create context with default values
const Web3Context = createContext<Web3ContextType>({
  provider: null,
  signer: null,
  network: null,
  address: null,
  isConnected: false,
  isLoading: false,
  chainId: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchNetwork: async () => {},
  registerRights: async () => ({ success: false, message: 'Not implemented' }), // Provide default implementation
  verifyRights: async () => false, // Provide default implementation
  getSupportedNetworks: () => [],
  web3Enabled: false
  // mintToken: async () => { throw new Error('Mint not implemented'); }, // Add defaults if added to context
  // transferRights: async () => { throw new Error('Transfer not implemented'); },
});

// Network configuration
const NETWORKS = {
  ethereum: { id: 'ethereum', name: 'Ethereum Mainnet', chainId: 1 },
  polygon: { id: 'polygon', name: 'Polygon Mainnet', chainId: 137 },
  mumbai: { id: 'mumbai', name: 'Polygon Mumbai', chainId: 80001 },
  optimism: { id: 'optimism', name: 'Optimism', chainId: 10 },
  arbitrum: { id: 'arbitrum', name: 'Arbitrum One', chainId: 42161 },
  base: { id: 'base', name: 'Base', chainId: 8453 }
};

interface Web3ProviderProps {
  children: ReactNode;
}

declare global {
    interface Window {
        ethereum?: any; // Define ethereum property on window
    }
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null); // Updated provider type
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [network, setNetwork] = useState<NetworkType | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [web3Enabled, setWeb3Enabled] = useState<boolean>(false);
  
  const { toast } = useToast();

  // Initialize provider
  useEffect(() => {
    // Check if MetaMask is installed
    if (typeof window !== 'undefined' && window.ethereum) {
      setWeb3Enabled(true);
      
      // Initialize the provider using BrowserProvider
      const ethersProvider = new ethers.BrowserProvider(window.ethereum); 
      setProvider(ethersProvider);
      
      // Check if already connected
      checkConnection(ethersProvider);
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          // Re-fetch signer when account changes
          ethersProvider.getSigner().then(setSigner).catch(console.error); 
        } else {
          disconnectWallet();
        }
      });
      
      // Listen for chain changes
      window.ethereum.on('chainChanged', (_chainId: string) => {
        // Force a page reload when chain changes
        window.location.reload();
      });
    } else {
      setWeb3Enabled(false);
    }
    
    return () => {
      // Cleanup listeners
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount
  
  // Check if wallet is already connected
  const checkConnection = async (ethersProvider: ethers.BrowserProvider) => { // Updated provider type
    try {
      const accounts = await ethersProvider.listAccounts();
      
      if (accounts.length > 0 && accounts[0]) { // Check if account exists
        const userAddress = accounts[0];
        const userSigner = await ethersProvider.getSigner(); // Use await
        const networkInfo = await ethersProvider.getNetwork(); // Use getNetwork()
        const currentChainId = Number(networkInfo.chainId); // Convert BigInt to number
        
        // Determine which network we're on
        const currentNetwork = Object.values(NETWORKS).find(
          n => n.chainId === currentChainId
        );
        
        setAddress(userAddress);
        setSigner(userSigner);
        setIsConnected(true);
        setChainId(currentChainId);
        
        if (currentNetwork) {
          setNetwork(currentNetwork.id as NetworkType);
        } else {
          setNetwork(null);
        }
      } else {
         // No accounts connected
         disconnectWallet(); // Ensure state is reset if no accounts found
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
       disconnectWallet(); // Reset state on error
    }
  };
  
  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to use Web3 features",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts.length > 0 && accounts[0]) { // Check if account exists
        // Get the current provider/signer
        const ethersProvider = new ethers.BrowserProvider(window.ethereum); // Use BrowserProvider
        const userSigner = await ethersProvider.getSigner(); // Use await
        const networkInfo = await ethersProvider.getNetwork(); // Use getNetwork()
        const currentChainId = Number(networkInfo.chainId); // Convert BigInt to number
        
        // Determine which network we're on
        const currentNetwork = Object.values(NETWORKS).find(
          n => n.chainId === currentChainId
        );
        
        setProvider(ethersProvider);
        setSigner(userSigner);
        setAddress(accounts[0]);
        setIsConnected(true);
        setChainId(currentChainId);
        
        if (currentNetwork) {
          setNetwork(currentNetwork.id as NetworkType);
        } else {
          setNetwork(null);
        }
        
        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
        });
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to wallet",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Disconnect wallet function
  const disconnectWallet = () => { // Return void
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
    setNetwork(null);
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected"
    });
  };
  
  // Switch network function
  const switchNetwork = async (networkType: NetworkType) => {
    if (!window.ethereum) {
      toast({
        title: "MetaMask not found",
        description: "Please install MetaMask to switch networks",
        variant: "destructive"
      });
      return;
    }
    
    const targetNetwork = NETWORKS[networkType];
    
    if (!targetNetwork) {
      toast({
        title: "Invalid Network",
        description: `The network ${networkType} is not supported`,
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetNetwork.chainId.toString(16)}` }],
      });
      
      // Network will be updated via the chainChanged event listener
      toast({
        title: "Network Changed",
        description: `Switched to ${targetNetwork.name}`
      });
      
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          // Add the network
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetNetwork.chainId.toString(16)}`,
                chainName: targetNetwork.name,
                // Add appropriate RPC URLs and currency details for each network
                rpcUrls: ['https://rpc-mumbai.maticvigil.com/'], // Example RPC URL for Mumbai
                nativeCurrency: {
                  name: 'MATIC', // Example for Mumbai
                  symbol: 'MATIC', // Example for Mumbai
                  decimals: 18,
                },
                blockExplorerUrls: ['https://mumbai.polygonscan.com/'], // Example for Mumbai
              },
            ],
          });
          
          toast({
            title: "Network Added",
            description: `Added and switched to ${targetNetwork.name}`
          });
          
        } catch (addError) {
          console.error('Error adding network:', addError);
          toast({
            title: "Failed to Add Network",
            description: "Could not add the network to your wallet",
            variant: "destructive"
          });
        }
      } else {
        console.error('Error switching network:', error);
        toast({
          title: "Network Switch Failed",
          description: error.message || "Could not switch networks",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get supported networks
  const getSupportedNetworks = () => {
    return Object.values(NETWORKS);
  };
  
  // Register rights on blockchain
  const registerRights = async (rightsData: RegisterRightsParams) => { // Use imported type
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return { success: false, message: "Wallet not connected" };
    }
    
    try {
      setIsLoading(true);
      
      // Send to backend API
      const response = await fetch('/api/blockchain/register-rights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...rightsData,
          walletAddress: address,
          networkId: network
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to register rights");
      }
      
      toast({
        title: "Rights Registered",
        description: `Successfully registered on ${network} network. Token ID: ${data.tokenId}`,
      });
      
      return { success: true, ...data }; // Return full response data
    } catch (error: any) {
      console.error('Error registering rights:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register rights",
        variant: "destructive"
      });
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verify rights on blockchain
  const verifyRights = async (verificationData: VerifyRightsParams): Promise<boolean> => { // Use imported type and return boolean
    if (!isConnected || !signer) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first",
        variant: "destructive"
      });
      return false; // Return boolean
    }
    
    try {
      setIsLoading(true);
      
      // Send to backend API
      const response = await fetch('/api/blockchain/verify-rights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...verificationData,
          walletAddress: address,
          networkId: network
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to verify rights");
      }
      
      toast({
        title: "Rights Verified",
        description: data.verified 
          ? "Rights verification successful"
          : "Rights could not be verified",
        variant: data.verified ? "default" : "destructive"
      });
      
      return data.verified ?? false; // Return boolean
    } catch (error: any) {
      console.error('Error verifying rights:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify rights",
        variant: "destructive"
      });
      return false; // Return boolean
    } finally {
      setIsLoading(false);
    }
  };
  
  // Context value
  const contextValue: Web3ContextType = {
    provider,
    signer,
    network,
    address,
    isConnected,
    isLoading,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    registerRights,
    verifyRights,
    getSupportedNetworks,
    web3Enabled
    // Add mintToken and transferRights if implemented
  };
  
  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook for using the Web3 context
export const useWeb3 = () => useContext(Web3Context);

// Export default for compatibility if needed elsewhere, though named export is preferred
// export default Web3Provider;