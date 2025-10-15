import React, { useState } from 'react';
import { useWeb3 } from '../web3/Web3Provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle } from 'lucide-react'; // Add missing icons
import type { RegisterRightsParams, VerifyRightsParams } from '@/web3/types'; // Import types

const BlockchainTestPage: React.FC = () => {
  const { 
    connectWallet, 
    disconnectWallet, 
    isConnected, 
    address, 
    network, 
    switchNetwork,
    getSupportedNetworks,
    isLoading,
    registerRights,
    verifyRights,
    chainId
  } = useWeb3();

  // Form states
  const [registerFormData, setRegisterFormData] = useState({
    assetId: "",
    // Align assetType with RegisterRightsParams
    assetType: "track" as "track" | "album" | "release", 
    rightsType: "master" as "master" | "publishing" | "sync" | "mechanical" | "performance" | "derivative",
    ownerType: "artist" as "artist" | "songwriter" | "producer" | "label" | "publisher" | "distributor",
    percentage: 100,
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    territories: [] as string[] // Keep territories if needed for other logic, but not in RegisterRightsParams
  });

  const [verifyFormData, setVerifyFormData] = useState({
    rightsId: "",
    tokenId: "", // Add tokenId field
    signature: ""
  });

  // Result states
  const [registerResult, setRegisterResult] = useState<any>(null);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Networks
  const networks = getSupportedNetworks();

  // Handle connect/disconnect
  const handleConnectionToggle = async () => {
    try {
      setError(null);
      if (isConnected) {
        disconnectWallet();
      } else {
        await connectWallet();
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    }
  };

  // Handle network switch
  const handleNetworkSwitch = async (value: string) => {
    try {
      setError(null);
      await switchNetwork(value as any); // Cast for now
    } catch (err: any) {
      setError(err.message || "Failed to switch network");
    }
  };

  // Handle register form change
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegisterFormData(prev => ({
      ...prev,
      [name]: name === 'percentage' ? Number(value) : value
    }));
  };

  // Handle register radio change
  const handleRadioChange = (name: string, value: string) => {
    setRegisterFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle register form submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setRegisterResult(null);
      
      // Construct data matching RegisterRightsParams
      const dataToRegister: RegisterRightsParams = {
         assetId: registerFormData.assetId,
         assetType: registerFormData.assetType,
         rightsType: registerFormData.rightsType,
         ownerType: registerFormData.ownerType,
         percentage: registerFormData.percentage,
         startDate: new Date(registerFormData.startDate), // Convert string to Date
         endDate: registerFormData.endDate ? new Date(registerFormData.endDate) : null, // Convert string to Date or null
         // territory: registerFormData.territories.join(','), // Join territories if needed by API
         networkId: network || undefined // Pass current network if needed
      };

      // Call the registerRights function from context
      const result = await registerRights(dataToRegister);
      
      setRegisterResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to register rights");
    }
  };

  // Handle verify form change
  const handleVerifyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVerifyFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle verify form submit
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setVerifyResult(null);
      
      // Construct data matching VerifyRightsParams
      const dataToVerify: VerifyRightsParams = {
        rightsId: Number(verifyFormData.rightsId),
        tokenId: verifyFormData.tokenId, // Pass tokenId
        signature: verifyFormData.signature || undefined // Pass signature if present
        // Add other optional fields like chainId, contractAddress if needed
      };

      // Call the verifyRights function from context
      const result = await verifyRights(dataToVerify);
      
      setVerifyResult(result); // Result is boolean
    } catch (err: any) {
      setError(err.message || "Failed to verify rights");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Blockchain Rights Management Test</h1>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>Connect your wallet to interact with blockchain features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Status</p>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
              
              {isConnected && (
                <div>
                  <p className="text-sm font-medium mb-2">Address</p>
                  <div className="text-sm font-mono bg-muted p-2 rounded truncate">
                    {address}
                  </div>
                </div>
              )}
            </div>
            
            {isConnected && (
              <div>
                <p className="text-sm font-medium mb-2">Network</p>
                <Select value={network || ""} onValueChange={handleNetworkSwitch}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {networks.map((network: { id: string, name: string, chainId: number }) => (
                      <SelectItem key={network.id} value={network.id}>{network.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleConnectionToggle} 
            disabled={isLoading}
            variant={isConnected ? "destructive" : "default"}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isConnected ? 'Disconnect Wallet' : 'Connect Wallet'}
          </Button>
        </CardFooter>
      </Card>
      
      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register">Register Rights</TabsTrigger>
          <TabsTrigger value="verify">Verify Rights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Register Rights</CardTitle>
              <CardDescription>Register music rights on the blockchain</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assetId">Asset ID</Label>
                    <Input 
                      id="assetId"
                      name="assetId"
                      placeholder="Enter asset ID"
                      value={registerFormData.assetId}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="percentage">Percentage</Label>
                    <Input 
                      id="percentage"
                      name="percentage"
                      type="number"
                      min="0.01"
                      max="100"
                      step="0.01"
                      placeholder="Enter percentage"
                      value={registerFormData.percentage}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input 
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={registerFormData.startDate}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Input 
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={registerFormData.endDate}
                      onChange={handleRegisterChange}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="mb-3 block">Asset Type</Label>
                  <RadioGroup value={registerFormData.assetType} onValueChange={(value) => handleRadioChange('assetType', value)} className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="track" id="assetType-track" />
                      <Label htmlFor="assetType-track">Track</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="album" id="assetType-album" />
                      <Label htmlFor="assetType-album">Album</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="release" id="assetType-release" />
                      <Label htmlFor="assetType-release">Release</Label>
                    </div>
                    {/* Removed invalid options */}
                  </RadioGroup>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="mb-3 block">Rights Type</Label>
                  <RadioGroup value={registerFormData.rightsType} onValueChange={(value) => handleRadioChange('rightsType', value)} className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="master" id="rightsType-master" />
                      <Label htmlFor="rightsType-master">Master</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="publishing" id="rightsType-publishing" />
                      <Label htmlFor="rightsType-publishing">Publishing</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sync" id="rightsType-sync" />
                      <Label htmlFor="rightsType-sync">Sync</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mechanical" id="rightsType-mechanical" />
                      <Label htmlFor="rightsType-mechanical">Mechanical</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="performance" id="rightsType-performance" />
                      <Label htmlFor="rightsType-performance">Performance</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="derivative" id="rightsType-derivative" />
                      <Label htmlFor="rightsType-derivative">Derivative</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="mb-3 block">Owner Type</Label>
                  <RadioGroup value={registerFormData.ownerType} onValueChange={(value) => handleRadioChange('ownerType', value)} className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="artist" id="ownerType-artist" />
                      <Label htmlFor="ownerType-artist">Artist</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="songwriter" id="ownerType-songwriter" />
                      <Label htmlFor="ownerType-songwriter">Songwriter</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="producer" id="ownerType-producer" />
                      <Label htmlFor="ownerType-producer">Producer</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="label" id="ownerType-label" />
                      <Label htmlFor="ownerType-label">Label</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="publisher" id="ownerType-publisher" />
                      <Label htmlFor="ownerType-publisher">Publisher</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="distributor" id="ownerType-distributor" />
                      <Label htmlFor="ownerType-distributor">Distributor</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading || !isConnected}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Register Rights
                </Button>
              </form>
            </CardContent>
            
            {registerResult && (
              <CardFooter className="flex flex-col">
                <Separator className="my-4" />
                <div className="w-full">
                  <h3 className="font-semibold mb-2">Registration Result:</h3>
                  <pre className="bg-muted p-4 rounded-md overflow-auto text-xs">
                    {JSON.stringify(registerResult, null, 2)}
                  </pre>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
        
        <TabsContent value="verify">
          <Card>
            <CardHeader>
              <CardTitle>Verify Rights</CardTitle>
              <CardDescription>Verify music rights on the blockchain</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <Label htmlFor="rightsId">Rights ID *</Label>
                  <Input 
                    id="rightsId"
                    name="rightsId"
                    type="number" // Use number type
                    placeholder="Enter rights ID"
                    value={verifyFormData.rightsId}
                    onChange={handleVerifyChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="tokenId">Token ID *</Label>
                  <Input 
                    id="tokenId"
                    name="tokenId"
                    placeholder="Enter NFT token ID"
                    value={verifyFormData.tokenId}
                    onChange={handleVerifyChange}
                    required 
                  />
                </div>

                <div>
                  <Label htmlFor="signature">Signature (Optional)</Label>
                  <Input 
                    id="signature"
                    name="signature"
                    placeholder="Enter signature"
                    value={verifyFormData.signature}
                    onChange={handleVerifyChange}
                  />
                </div>
                
                <Button 
                  type="submit" 
                  disabled={isLoading || !isConnected}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify Rights
                </Button>
              </form>
            </CardContent>
            
            {verifyResult !== null && ( // Check if verifyResult is not null
              <CardFooter className="flex flex-col">
                <Separator className="my-4" />
                <div className="w-full">
                  <h3 className="font-semibold mb-2">Verification Result:</h3>
                   <Alert variant={verifyResult ? "default" : "destructive"} className={verifyResult ? 'bg-green-50 border-green-200 text-green-800' : ''}>
                      {verifyResult ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      <AlertTitle>{verifyResult ? "Verified" : "Not Verified"}</AlertTitle>
                      <AlertDescription>
                         {verifyResult ? "The rights claim was successfully verified." : "Could not verify the rights claim."}
                      </AlertDescription>
                   </Alert>
                </div>
              </CardFooter>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockchainTestPage;