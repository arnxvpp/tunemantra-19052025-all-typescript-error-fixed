import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useWeb3 } from '@/web3/Web3Provider';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle, CheckCircle, Loader2, Search } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import type { VerifyRightsParams } from '@/web3/types'; // Import type

// Define form schema
const formSchema = z.object({
  assetId: z.string().min(1, { message: 'Asset ID is required' }),
  assetType: z.enum(['track', 'album', 'video', 'artwork', 'lyrics', 'other']),
  networkId: z.string().optional(),
  tokenId: z.string().optional(),
  transactionHash: z.string().optional(),
  rightsId: z.number().int().positive({ message: 'Rights Record ID is required' }), // Add rightsId to schema
});

type FormValues = z.infer<typeof formSchema>;

export function Web3RightsVerification() {
  const { 
    isConnected, 
    connectWallet, 
    address, 
    network, 
    switchNetwork, 
    verifyRights, 
    isLoading: web3Loading, // Renamed to avoid conflict
    getSupportedNetworks,
    web3Enabled
  } = useWeb3();
  
  const [verification, setVerification] = useState<{
    isVerifying: boolean;
    isVerified: boolean | null;
    error: string | null;
    details: any | null; // Consider defining a more specific type for details
  }>({
    isVerifying: false,
    isVerified: null,
    error: null,
    details: null
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetId: '',
      assetType: 'track',
      networkId: network || undefined,
      tokenId: '',
      transactionHash: '',
      rightsId: undefined, // Initialize rightsId
    }
  });
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    
    setVerification({
      isVerifying: true,
      isVerified: null,
      error: null,
      details: null
    });
    
    try {
      // Format data for verification, ensuring rightsId is included
      const verificationData: VerifyRightsParams = {
        rightsId: values.rightsId, // Get rightsId from form values
        tokenId: values.tokenId || '', // Use empty string if undefined
        // Add other necessary fields from values if VerifyRightsParams requires them
        // assetId: values.assetId, // Example if needed
        // assetType: values.assetType, // Example if needed
        chainId: values.networkId ? parseInt(values.networkId) : undefined, // Example if needed
        ownerAddress: address || undefined, // Example if needed
      };
      
      // Submit verification request
      const isVerifiedResult = await verifyRights(verificationData); // Result is boolean
      
      setVerification({
        isVerifying: false,
        isVerified: isVerifiedResult, // Set based on boolean result
        error: isVerifiedResult ? null : "Verification failed on blockchain.", // Set error message if false
        details: isVerifiedResult ? { message: "Rights verified successfully." } : null // Provide simple detail on success
      });

    } catch (error: any) {
      setVerification({
        isVerifying: false,
        isVerified: false,
        error: error.message || "Failed to verify rights on blockchain",
        details: null
      });
    }
  };
  
  const supportedNetworks = getSupportedNetworks();
  
  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Verify Blockchain Rights</CardTitle>
        <CardDescription>
          Validate registered rights claims on the blockchain
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Connection Status Banner */}
        {!web3Enabled && (
          // Use "destructive" variant for errors/warnings
          <Alert variant="destructive" className="mb-6"> 
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Web3 Not Available</AlertTitle>
            <AlertDescription>
              Please install a browser extension like MetaMask to use blockchain features.
            </AlertDescription>
          </Alert>
        )}
        
        {web3Enabled && !isConnected && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Wallet Not Connected</AlertTitle>
            <AlertDescription>
              Please connect your wallet to verify rights on the blockchain.
            </AlertDescription>
            <Button 
              onClick={() => connectWallet()} 
              className="mt-2" 
              disabled={web3Loading} // Use web3Loading
            >
              {web3Loading ? ( // Use web3Loading
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          </Alert>
        )}
        
        {web3Enabled && isConnected && (
          <div className="mb-6 flex items-center justify-between bg-muted p-4 rounded-md">
            <div>
              <p className="font-medium">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
              <p className="text-sm text-muted-foreground">Network: {network || 'Unknown'}</p>
            </div>
            <div className="flex gap-2">
              <Select 
                value={network || ''}
                 // TODO: switchNetwork expects NetworkType, but Select provides string. Need to verify/cast correctly.
                onValueChange={(value: string) => switchNetwork(value as any)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Switch Network" />
                </SelectTrigger>
                <SelectContent>
                  {supportedNetworks.map((net) => (
                    <SelectItem key={net.id} value={net.id}>
                      {net.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {/* Verification Result */}
        {verification.isVerified !== null && (
          <Alert 
            variant={verification.isVerified ? "default" : "destructive"} 
            className={`mb-6 ${verification.isVerified ? 'bg-green-50 border-green-200 text-green-800' : ''}`} // Add success styling
          >
            {verification.isVerified ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {verification.isVerified 
                ? "Rights Verified Successfully" 
                : "Rights Verification Failed"}
            </AlertTitle>
            <AlertDescription>
              {verification.isVerified 
                ? verification.details?.message || "The rights claim was successfully verified on the blockchain." // Show details message
                : verification.error || "Could not verify rights claim. It may not exist or belong to a different account."}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Verification Details Card (Simplified) */}
        {/* {verification.details && verification.isVerified && (
          <div className="mb-6 border rounded-lg p-4">
             <h3 className="text-lg font-medium mb-3">Verification Details</h3>
             <pre className="bg-muted p-3 rounded text-xs overflow-auto">
               {JSON.stringify(verification.details, null, 2)}
             </pre>
           </div>
        )} */}
        
        {/* Verification Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             {/* Add Rights ID Field */}
             <FormField
                control={form.control}
                name="rightsId"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Rights Record ID *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter the numeric ID of the rights record" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormDescription>
                      The unique database ID for the rights registration.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Asset ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the asset identifier (Optional)" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional: ISRC, UPC, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assetType"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Asset Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="track">Music Track</SelectItem>
                        <SelectItem value="album">Album</SelectItem>
                        <SelectItem value="video">Music Video</SelectItem>
                        <SelectItem value="artwork">Artwork</SelectItem>
                        <SelectItem value="lyrics">Lyrics</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optional: Type of content being verified
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
              
              <FormField
                control={form.control}
                name="networkId"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Network (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select network or use current" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Current Network</SelectItem>
                        {supportedNetworks.map((net) => (
                          <SelectItem key={net.id} value={net.id}>
                            {net.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Network where the rights were registered (defaults to current)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tokenId"
                  render={({ field }: { field: any }) => ( 
                    <FormItem>
                      <FormLabel>Token ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="NFT token ID" {...field} />
                      </FormControl>
                      <FormDescription>
                        For NFT-based rights
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="transactionHash"
                  render={({ field }: { field: any }) => ( 
                    <FormItem>
                      <FormLabel>Transaction Hash (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Blockchain transaction hash" {...field} />
                      </FormControl>
                      <FormDescription>
                        Transaction that registered the rights
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={!isConnected || web3Loading || verification.isVerifying} // Use web3Loading
            >
              {verification.isVerifying || web3Loading ? ( // Use web3Loading
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Verify Rights
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          Verification checks rights claims against the immutable blockchain record.
        </p>
      </CardFooter>
    </Card>
  );
}

export default Web3RightsVerification;