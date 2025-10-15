import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWeb3 } from "@/web3/Web3Provider";
import { AlertCircle, Check, Coins, FileText, Shield, Upload, ArrowRightLeft, Plus, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"; // Added Loader2, CheckCircle2, AlertTriangle
import { Separator } from "@/components/ui/separator";
import { RightsLayout } from "./layout";
import { apiRequest } from "@/lib/queryClient"; // Assuming apiRequest exists
import { Skeleton } from "@/components/ui/skeleton"; // Added Skeleton import

interface Token {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  ownerAddress: string;
  creationDate: string;
  metadata: Record<string, any>;
}

interface RightsRecord {
  id: number;
  assetId: string;
  tokenId: string;
  ownerAddress: string;
  rightsType: string;
  transferable: boolean;
  creationDate: string;
  expiryDate: string | null;
  status: string;
  // Add missing properties if needed based on API response
  retryCount?: number; // Example if retryCount exists
}

// ServiceStatus interface to type the service status response
interface ServiceStatus {
  success: boolean;
  status: string;
  message?: string;
}

export default function Web3Rights() {
  const { toast } = useToast();
  const { 
    address, // Renamed from account
    connectWallet, 
    // mintToken, // Removed - not provided by hook
    // transferRights, // Removed - not provided by hook
    verifyRights, 
    registerRights, // Renamed from registerRightsWithBlockchain
    web3Enabled, 
    isLoading: isConnecting, // Renamed from isLoading
    isConnected // Added isConnected for checks
  } = useWeb3();
  const [selectedTab, setSelectedTab] = useState("tokens");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [mintProgress, setMintProgress] = useState(0);
  const [isMinting, setIsMinting] = useState(false); // Keep local state for UI feedback
  const [isTransferring, setIsTransferring] = useState(false); // Keep local state for UI feedback
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch user's tokens
  const { 
    data: tokens = [],
    isLoading: isLoadingTokens,
    refetch: refetchTokens
  } = useQuery<Token[]>({
    queryKey: ['/api/blockchain/tokens', address], // Add address to queryKey
    queryFn: async (): Promise<Token[]> => { // Add queryFn to fetch data
        if (!address) return []; // Don't fetch if not connected
        // Replace with actual API call using apiRequest
        console.log("Fetching tokens for address:", address);
        // Example using apiRequest (adjust endpoint/params as needed)
        // const response = await apiRequest<{ data: Token[] }>(`/api/blockchain/tokens?address=${address}`);
        // return response.data; 
        
        // Using Mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate fetch
        return [ 
             { id: 'TKN001', name: 'Summer Vibes NFT', description: 'Represents master rights', imageUrl: '', ownerAddress: address || '0x...', creationDate: '2024-01-10', metadata: { title: 'Summer Vibes', artist: 'DJ Sunshine'} },
             { id: 'TKN002', name: 'Midnight Grooves NFT', description: 'Represents publishing rights', imageUrl: '', ownerAddress: address || '0x...', creationDate: '2024-02-15', metadata: { title: 'Midnight Grooves', artist: 'Luna Beats'} },
        ];
    },
    enabled: !!address && web3Enabled,
  });

  // Fetch rights records
  const { 
    data: rightsRecords = [],
    isLoading: isLoadingRights,
    refetch: refetchRights
  } = useQuery<RightsRecord[]>({
    queryKey: ['/api/blockchain/rights', address], // Add address to queryKey
     queryFn: async (): Promise<RightsRecord[]> => { // Add queryFn to fetch data
        if (!address) return [];
        console.log("Fetching rights records for address:", address);
        // Example using apiRequest (adjust endpoint/params as needed)
        // const response = await apiRequest<{ data: RightsRecord[] }>(`/api/blockchain/rights?address=${address}`);
        // return response.data;

        // Using Mock data for now
         await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate fetch
        return [ 
            { id: 1, assetId: 'ISRC001', tokenId: 'TKN001', ownerAddress: address || '0x...', rightsType: 'master', transferable: true, creationDate: '2024-01-10', expiryDate: null, status: 'active' },
            { id: 2, assetId: 'ISRC002', tokenId: 'TKN002', ownerAddress: address || '0x...', rightsType: 'publishing', transferable: false, creationDate: '2024-02-15', expiryDate: '2034-02-15', status: 'active' },
        ];
    },
    enabled: !!address && web3Enabled,
  });

  // Query to check if the service is ready
  const { data: serviceStatus, isLoading: checkingService } = useQuery<ServiceStatus>({
    queryKey: ['/api/audio-fingerprinting/status'], // Assuming this is the correct endpoint
     queryFn: async (): Promise<ServiceStatus> => { // Add queryFn
        // Replace with actual API call
        console.log("Checking service status...");
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, status: 'ready' }; // Mock response
     },
    enabled: true, // Check status regardless of wallet connection
  });


  // Simulate mint progress (keep local simulation for UI)
  useEffect(() => {
    if (isMinting && mintProgress < 100) {
      const timer = setTimeout(() => {
        setMintProgress((prev) => {
          const increment = Math.floor(Math.random() * 10) + 5;
          return Math.min(prev + increment, 100);
        });
      }, 500);
      
      return () => clearTimeout(timer);
    } else if (mintProgress >= 100) {
      setIsMinting(false); // Reset minting state when progress hits 100
      // refetchTokens(); // Refetch might happen via onSuccess of actual mint call
    }
  }, [isMinting, mintProgress]);

  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      // Toast is handled within connectWallet now
    } catch (error) {
      // Error toast is handled within connectWallet
      console.error("Connect wallet error boundary:", error);
    }
  };

  // Mock mint function since it's not in the hook
  const handleMintToken = async () => {
     if (!isConnected) {
        toast({ title: "Connect Wallet", description: "Please connect your wallet to mint.", variant: "destructive" });
        return;
     }
    try {
      setIsMinting(true);
      setMintProgress(0);
      
      console.log("Simulating token mint...");
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      // Simulate reaching 100% progress after delay
      const progressInterval = setInterval(() => {
         setMintProgress(prev => {
           const next = prev + 20; // Faster progress simulation
           if (next >= 100) {
             clearInterval(progressInterval);
             setIsMinting(false); // Stop minting state
             refetchTokens(); // Refetch after simulated success
             toast({
               title: "Token minted (Simulated)",
               description: "Your rights token has been successfully minted.",
             });
             return 100;
           }
           return next;
         });
       }, 300);

    } catch (error) {
      setIsMinting(false);
      setMintProgress(0); // Reset progress on error
      toast({
        variant: "destructive",
        title: "Minting failed",
        description: "Failed to mint token. Please try again.",
      });
    }
  };

  // Mock transfer function
  const handleTransferRights = async (tokenId: string, toAddress: string) => {
     if (!isConnected) {
        toast({ title: "Connect Wallet", description: "Please connect your wallet to transfer.", variant: "destructive" });
        return;
     }
    try {
      setIsTransferring(true);
      console.log(`Simulating transfer of token ${tokenId} to ${toAddress}`);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate delay
      
      toast({
        title: "Rights transferred (Simulated)",
        description: "The rights have been successfully transferred.",
      });
      
      refetchRights(); // Refetch rights after simulated success
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Transfer failed",
        description: "Failed to transfer rights. Please try again.",
      });
    } finally {
       setIsTransferring(false);
    }
  };

  const handleVerifyRights = async (rightsId: number, tokenId: string) => {
     if (!isConnected) {
        toast({ title: "Connect Wallet", description: "Please connect your wallet to verify.", variant: "destructive" });
        return;
     }
    try {
      setIsVerifying(true);
      
      // Use the verifyRights function from the hook
      const result = await verifyRights({ rightsId, tokenId });
      
      // Check the boolean result directly
       if (result) {
         refetchRights(); // Refetch on successful verification
      }

    } catch (error) {
      // Error toast is handled within verifyRights
       console.error("Verify rights error boundary:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegisterRights = async (assetId: string) => {
     if (!isConnected) {
        toast({ title: "Connect Wallet", description: "Please connect your wallet to register.", variant: "destructive" });
        return;
     }
    try {
      setIsRegistering(true);
      
      // Use the registerRights function from the hook
      const result = await registerRights({ 
        assetId,
        assetType: 'track', // Example data
        rightsType: 'master', // Example data
        ownerType: 'artist', // Example data
        percentage: 100, // Example data
        startDate: new Date(), // Example data
        endDate: null, // Example data
      });
      
      // Toast is handled within registerRights now based on result
       if (result?.success) {
         refetchRights();
         refetchTokens();
      }
      
    } catch (error) {
       // Error toast is handled within registerRights
       console.error("Register rights error boundary:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  // Re-add renderServiceStatus function definition
  const renderServiceStatus = () => {
    if (checkingService) {
      return (
        <Alert className="mb-6">
          <Skeleton className="h-5 w-5 mr-2 rounded-full" /> {/* Use rounded skeleton */}
          <AlertTitle>
            <Skeleton className="h-4 w-40" />
          </AlertTitle>
          <AlertDescription>
            <Skeleton className="h-3 w-60 mt-2" />
          </AlertDescription>
        </Alert>
      );
    }

    if (!serviceStatus?.success || serviceStatus?.status !== 'ready') {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5 mr-2" />
          <AlertTitle>Service Unavailable</AlertTitle>
          <AlertDescription>
            The audio fingerprinting service is currently unavailable or not properly configured.
            Please try again later or contact support.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="default" className="mb-6 border-green-200 bg-green-50">
        <CheckCircle2 className="h-5 w-5 mr-2 text-green-600" />
        <AlertTitle className="text-green-800">Service Ready</AlertTitle>
        <AlertDescription className="text-green-700">
          The audio fingerprinting service is available and ready to process your uploads.
        </AlertDescription>
      </Alert>
    );
  };


  const renderConnectWallet = () => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Connect Wallet</CardTitle>
        <CardDescription>
          Connect your wallet to view and manage your blockchain-secured rights.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="mb-6 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            No wallet connected. Connect your wallet to view your tokens and rights.
          </p>
        </div>
        <Button onClick={handleConnectWallet} disabled={isConnecting} size="lg">
          {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      </CardContent>
    </Card>
  );

  const renderTokensTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Your Tokens</h3>
        <Button onClick={handleMintToken} disabled={isMinting || !isConnected}>
          <FileText className="mr-2 h-4 w-4" />
          {isMinting ? "Minting..." : "Mint New Token"}
        </Button>
      </div>
      
      {isMinting && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Minting in progress</CardTitle>
            <CardDescription>Please wait while your token is being minted...</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={mintProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2 text-right">{mintProgress}% complete</p>
          </CardContent>
        </Card>
      )}
      
      {isLoadingTokens ? (
        <div className="text-center py-8">
           <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading tokens...</p>
        </div>
      ) : tokens && tokens.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tokens.map((token: Token) => (
            <Card 
              key={token.id} 
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => setSelectedToken(token)}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{token.name}</CardTitle>
                  <Badge variant="outline" className="ml-2">
                    <Shield className="mr-1 h-3 w-3" />
                    NFT
                  </Badge>
                </div>
                <CardDescription className="truncate">{token.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Coins className="mr-1 h-4 w-4" />
                  <span className="truncate">{token.ownerAddress}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Created: {new Date(token.creationDate).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No tokens found</AlertTitle>
          <AlertDescription>
            You don't have any tokens yet. Mint a new token to get started.
          </AlertDescription>
        </Alert>
      )}
      
      {selectedToken && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Token Details</CardTitle>
            <CardDescription>Detailed information about the selected token</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Token Name</h4>
                <p>{selectedToken.name}</p>
              </div>
              <div>
                <h4 className="font-medium">Description</h4>
                <p>{selectedToken.description}</p>
              </div>
              <div>
                <h4 className="font-medium">Owner</h4>
                <p className="text-sm truncate">{selectedToken.ownerAddress}</p>
              </div>
              <div>
                <h4 className="font-medium">Creation Date</h4>
                <p>{new Date(selectedToken.creationDate).toLocaleDateString()}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">Metadata</h4>
                <div className="bg-muted rounded-md p-3">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(selectedToken.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => setSelectedToken(null)}
            >
              Close
            </Button>
            <Button
              onClick={() => handleTransferRights(selectedToken.id, "0xRecipientAddress")} // Replace with actual recipient
              disabled={isTransferring || !isConnected}
            >
              {isTransferring ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Transfer Rights
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );

  const renderRightsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Rights Records</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleRegisterRights("track-" + Date.now())} // Example asset ID
            disabled={isRegistering || !isConnected}
          >
            {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {isRegistering ? "Registering..." : "Register New Rights"}
          </Button>
        </div>
      </div>
      
      {isLoadingRights ? (
         <div className="text-center py-8">
           <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground mt-2">Loading rights records...</p>
        </div>
      ) : rightsRecords && rightsRecords.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Asset ID</th>
                <th className="text-left py-3 px-4">Token ID</th>
                <th className="text-left py-3 px-4">Rights Type</th>
                <th className="text-left py-3 px-4">Owner</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Transferable</th>
                <th className="text-left py-3 px-4">Created</th>
                <th className="text-left py-3 px-4">Expires</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rightsRecords.map((record: RightsRecord) => (
                <tr key={record.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 truncate">{record.assetId}</td>
                  <td className="py-3 px-4 truncate">{record.tokenId}</td>
                  <td className="py-3 px-4">
                    <Badge variant={record.rightsType === "exclusive" ? "default" : "secondary"}>
                      {record.rightsType}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 truncate">{record.ownerAddress}</td>
                  <td className="py-3 px-4">
                    <Badge variant={record.status === "active" ? "outline" : "secondary"} className="capitalize">
                      {record.status === "active" && <Check className="mr-1 h-3 w-3" />}
                      {record.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">{record.transferable ? "Yes" : "No"}</td>
                  <td className="py-3 px-4">{new Date(record.creationDate).toLocaleDateString()}</td>
                  <td className="py-3 px-4">{record.expiryDate ? new Date(record.expiryDate).toLocaleDateString() : "Never"}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVerifyRights(record.id, record.tokenId)}
                        disabled={isVerifying || !isConnected}
                      >
                        {isVerifying ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Shield className="mr-1 h-3 w-3" />}
                        Verify
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTransferRights(record.tokenId, "0xRecipientAddress")} // Replace with actual recipient
                        disabled={isTransferring || !record.transferable || !isConnected}
                      >
                         {isTransferring ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ArrowRightLeft className="mr-1 h-3 w-3" />}
                        Transfer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No rights records found</AlertTitle>
            <AlertDescription>
              You don't have any blockchain rights records yet.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Register Your First Rights</CardTitle>
              <CardDescription>
                Register your music rights on the blockchain to secure your ownership and enable transparent rights management.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Blockchain-verified rights provide several benefits:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Immutable proof of ownership</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Transparent rights history</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                  <span>Simplified licensing and royalty distribution</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handleRegisterRights("track-" + Date.now())} // Example asset ID
                disabled={isRegistering || !isConnected}
              >
                 {isRegistering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                 {isRegistering ? "Registering..." : "Register Rights for a Track"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );

  return (
    <RightsLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Web3 Rights Management</h1>
            <p className="text-muted-foreground">
              Manage your music rights on the blockchain
            </p>
          </div>
          {!isConnected ? (
            <Button onClick={handleConnectWallet} disabled={isConnecting}>
              {isConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">
              Connected: {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
            </div>
          )}
        </div>

        {!web3Enabled ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Web3 Not Enabled</AlertTitle>
            <AlertDescription>
              Please install a Web3 wallet like MetaMask to use these features.
            </AlertDescription>
          </Alert>
        ) : !isConnected ? (
          renderConnectWallet()
        ) : (
          <>
            {renderServiceStatus()} 
            <Tabs defaultValue="tokens" value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="tokens">My Tokens</TabsTrigger>
                <TabsTrigger value="rights">Rights Records</TabsTrigger>
              </TabsList>
              <TabsContent value="tokens">{renderTokensTab()}</TabsContent>
              <TabsContent value="rights">{renderRightsTab()}</TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </RightsLayout>
  );
}
