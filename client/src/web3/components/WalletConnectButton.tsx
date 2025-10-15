import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWeb3, NetworkType } from '../Web3Provider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wallet, Check, ChevronDown, ExternalLink, Copy, LogOut } from 'lucide-react';

// Network chain IDs
const POLYGON_MAINNET = 137;
const POLYGON_MUMBAI = 80001;

// UI helper to format addresses
const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const WalletConnectButton: React.FC = () => {
  const { toast } = useToast();
  const { 
    address: account, 
    chainId, 
    isConnected, 
    isLoading: isConnecting, 
    connectWallet: connect, 
    disconnectWallet: disconnect, 
    switchNetwork, 
    web3Enabled 
  } = useWeb3();
  
  // Local state for dropdown
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Handle connect button click
  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  // Handle disconnect button click
  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
  };

  // Copy address to clipboard
  const copyAddressToClipboard = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard',
      });
    }
  };

  // View account on block explorer
  const viewOnExplorer = () => {
    if (!account || !chainId) return;
    
    let explorerUrl = '';
    
    if (chainId === POLYGON_MAINNET) {
      explorerUrl = `https://polygonscan.com/address/${account}`;
    } else if (chainId === POLYGON_MUMBAI) {
      explorerUrl = `https://mumbai.polygonscan.com/address/${account}`;
    } else {
      explorerUrl = `https://etherscan.io/address/${account}`;
    }
    
    window.open(explorerUrl, '_blank');
  };

  // Switch network handler
  const handleSwitchNetwork = async (targetChainId: number) => {
    try {
      // Convert chainId to NetworkType
      let networkType: NetworkType | undefined;
      
      if (targetChainId === POLYGON_MAINNET) {
        networkType = 'polygon';
      } else if (targetChainId === POLYGON_MUMBAI) {
        networkType = 'mumbai';
      }
      
      if (networkType) {
        await switchNetwork(networkType);
        setIsDropdownOpen(false);
      }
    } catch (err) {
      console.error('Network switch error:', err);
    }
  };

  // If not connected, show connect button
  if (!isConnected) {
    return (
      <Button
        variant="outline"
        onClick={handleConnect}
        disabled={isConnecting}
        className="gap-2"
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        )}
      </Button>
    );
  }

  // If connected, show dropdown with account info and actions
  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          {formatAddress(account || '')}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Wallet Connected</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Account address */}
        <DropdownMenuItem className="justify-between cursor-default">
          <span className="text-sm text-gray-500">Address</span>
          <span className="text-sm font-mono">{formatAddress(account || '')}</span>
        </DropdownMenuItem>
        
        {/* Network info */}
        <DropdownMenuItem className="justify-between cursor-default">
          <span className="text-sm text-gray-500">Network</span>
          <span className="flex items-center">
            {chainId === POLYGON_MAINNET && "Polygon"}
            {chainId === POLYGON_MUMBAI && "Mumbai Testnet"}
            {chainId !== POLYGON_MAINNET && chainId !== POLYGON_MUMBAI && "Unsupported"}
            
            {(chainId === POLYGON_MAINNET || chainId === POLYGON_MUMBAI) && (
              <Check className="ml-2 h-4 w-4 text-green-500" />
            )}
          </span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Actions */}
        <DropdownMenuItem onClick={copyAddressToClipboard}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Address
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={viewOnExplorer}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View on Explorer
        </DropdownMenuItem>
        
        {/* Network switching options */}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Switch Network</DropdownMenuLabel>
        
        <DropdownMenuItem 
          onClick={() => handleSwitchNetwork(POLYGON_MAINNET)}
          disabled={chainId === POLYGON_MAINNET}
        >
          Polygon Mainnet
          {chainId === POLYGON_MAINNET && <Check className="ml-2 h-4 w-4" />}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleSwitchNetwork(POLYGON_MUMBAI)}
          disabled={chainId === POLYGON_MUMBAI}
        >
          Mumbai Testnet
          {chainId === POLYGON_MUMBAI && <Check className="ml-2 h-4 w-4" />}
        </DropdownMenuItem>
        
        {/* Disconnect option */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WalletConnectButton;