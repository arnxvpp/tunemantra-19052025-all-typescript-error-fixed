import { ethers } from 'ethers';

export interface Web3ContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  web3Enabled: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  mintToken: (params: MintParams) => Promise<string>;
  transferRights: (params: TransferParams) => Promise<void>;
  verifyRights: (params: VerifyRightsParams) => Promise<boolean>;
  registerRightsWithBlockchain: (params: RegisterRightsParams) => Promise<{
    success: boolean;
    tokenId?: string;
    rightsId?: number;
    message?: string;
  }>;
}

export interface MintParams {
  name: string;
  description: string;
  metadata: Record<string, any>;
  imageUrl?: string;
  trackId?: number;
  networkId?: string;
}

export interface TransferParams {
  tokenId: string;
  toAddress: string;
  rightsType: 'exclusive' | 'non-exclusive' | 'limited';
  expiryDate?: string;
}

export interface TokenMetadata {
  name: string;
  description: string;
  image?: string;
  external_url?: string;
  attributes?: {
    trait_type: string;
    value: string | number;
  }[];
  [key: string]: any;
}

export interface RightsTransfer {
  from: string;
  to: string;
  tokenId: string;
  rightsType: string;
  transferDate: string;
  transactionHash: string;
}

export interface Web3Contract {
  address: string;
  abi: any[];
  instance: ethers.Contract;
}

export interface VerifyRightsParams {
  rightsId: number;
  tokenId: string;
  chainId?: number;
  contractAddress?: string;
  transactionHash?: string;
  signature?: string;
  ownerAddress?: string;
}

export interface RegisterRightsParams {
  assetId: string;
  assetType: 'track' | 'album' | 'release';
  trackId?: number;
  rightsType: string;
  ownerType: string;
  percentage: number;
  territory?: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  networkId?: string;
}