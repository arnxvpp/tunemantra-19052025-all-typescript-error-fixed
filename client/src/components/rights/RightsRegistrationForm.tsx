import React, { useState, useEffect } from 'react'; // Added useEffect
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle, CheckCircle, Loader2, Upload, CalendarIcon, X as XIcon } from 'lucide-react'; // Added CalendarIcon, XIcon
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge'; // Added Badge import
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
// import { DatePicker } from '@/components/ui/date-picker'; // DatePicker might not be a separate component
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import type { RegisterRightsParams } from '@/web3/types'; // Import the correct type

// Define schema for registration form
const formSchema = z.object({
  assetId: z.string().min(1, { message: 'Asset ID is required' }),
  // Align assetType with RegisterRightsParams
  assetType: z.enum(['track', 'album', 'release']), 
  title: z.string().min(1, { message: 'Title is required' }),
  artist: z.string().min(1, { message: 'Artist name is required' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }).max(1000),
  releaseDate: z.date().optional(),
  expiryDate: z.date().optional(),
  royaltyPercentage: z.number().min(0).max(100).default(10),
  territorial: z.boolean().default(false),
  territories: z.array(z.string()).optional(),
  exclusive: z.boolean().default(true),
  additionalMetadata: z.record(z.string(), z.string()).optional(),
  networkId: z.string().optional(),
  advancedOptions: z.boolean().default(false),
  license: z.enum(['CC0', 'CC-BY', 'CC-BY-SA', 'CC-BY-NC', 'CC-BY-ND', 'CC-BY-NC-SA', 'CC-BY-NC-ND', 'All-Rights-Reserved']).default('All-Rights-Reserved'),
  // Add missing fields required by RegisterRightsParams
  rightsType: z.string().min(1, "Rights type is required").default("master"), // Add default or make optional if appropriate
  ownerType: z.string().min(1, "Owner type is required").default("artist"), // Add default or make optional if appropriate
  startDate: z.date({ required_error: "Start date is required." }), // Make start date required
});

type FormValues = z.infer<typeof formSchema>;

export function RightsRegistrationForm() {
  const { 
    isConnected, 
    connectWallet, 
    address, 
    network, 
    switchNetwork, 
    registerRights,
    isLoading: web3Loading, // Use a different name to avoid conflict
    getSupportedNetworks,
    web3Enabled
  } = useWeb3();
  const { toast } = useToast(); // Initialize toast
  
  const [territoryInput, setTerritoryInput] = useState<string>('');
  const [territories, setTerritories] = useState<string[]>([]);
  
  const [registration, setRegistration] = useState<{
    isRegistering: boolean;
    isRegistered: boolean | null;
    error: string | null;
    details: any | null; // Consider defining a more specific type for details
  }>({
    isRegistering: false,
    isRegistered: null,
    error: null,
    details: null
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assetId: '',
      assetType: 'track',
      title: '',
      artist: '',
      description: '',
      releaseDate: undefined,
      expiryDate: undefined,
      royaltyPercentage: 10,
      territorial: false,
      territories: [],
      exclusive: true,
      additionalMetadata: {},
      networkId: network || undefined,
      advancedOptions: false,
      license: 'All-Rights-Reserved',
      rightsType: "master", // Add default
      ownerType: "artist", // Add default
      startDate: new Date(), // Add default start date
    }
  });
  
  const watchTerritorial = form.watch('territorial');
  const watchAdvancedOptions = form.watch('advancedOptions');
  
  const addTerritory = () => {
    if (territoryInput.trim() && !territories.includes(territoryInput.trim())) {
      const newTerritories = [...territories, territoryInput.trim()];
      setTerritories(newTerritories);
      form.setValue('territories', newTerritories);
      setTerritoryInput('');
    }
  };
  
  const removeTerritory = (territory: string) => {
    const newTerritories = territories.filter(t => t !== territory);
    setTerritories(newTerritories);
    form.setValue('territories', newTerritories);
  };
  
  // Format dates for display
  const formatDate = (date: Date | undefined): string => {
    return date ? format(date, 'PPP') : '';
  };
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    
    setRegistration({
      isRegistering: true,
      isRegistered: null,
      error: null,
      details: null
    });
    
    try {
      // Format data for rights registration, ensuring all required fields are present
      const registrationData: RegisterRightsParams = {
        assetId: values.assetId,
        assetType: values.assetType,
        rightsType: values.rightsType, // Get from form values
        ownerType: values.ownerType,   // Get from form values
        percentage: values.royaltyPercentage, // Use royaltyPercentage for percentage
        startDate: values.startDate, // Get from form values
        endDate: values.expiryDate, // Use expiryDate for endDate
        territory: values.territorial ? values.territories?.join(',') : 'worldwide', // Handle territory
        // Add other optional fields from values if needed by the API/hook
        // Example: metadata: values.additionalMetadata 
        networkId: values.networkId || network || undefined, // Pass networkId
      };
      
      // Submit registration request
      const result = await registerRights(registrationData);
      
      if (result.success) {
        setRegistration({
          isRegistering: false,
          isRegistered: true,
          error: null,
          // Use specific properties from result, not result.data
          details: { 
             tokenId: result.tokenId, 
             rightsId: result.rightsId, 
             message: result.message 
             // Add other relevant details if returned by the hook
          } 
        });
        
        toast({ // Add success toast
           title: "Rights Registered",
           description: result.message || "Rights registered successfully.",
        });

        // Reset form for new registration only if advanced options are not shown
        if (!watchAdvancedOptions) { 
          form.reset({
            assetId: '',
            assetType: 'track',
            title: '',
            artist: '',
            description: '',
            releaseDate: undefined,
            expiryDate: undefined,
            royaltyPercentage: 10,
            territorial: false,
            territories: [],
            exclusive: true,
            additionalMetadata: {},
            networkId: network || undefined,
            advancedOptions: false,
            license: 'All-Rights-Reserved',
            rightsType: "master", 
            ownerType: "artist", 
            startDate: new Date(), 
          });
          setTerritories([]);
        }
      } else {
        setRegistration({
          isRegistering: false,
          isRegistered: false,
          error: result.message || "Unknown error occurred", // Use result.message
          details: null
        });
         toast({ // Add error toast
           title: "Registration Failed",
           description: result.message || "Failed to register rights.",
           variant: "destructive",
         });
      }
    } catch (error: any) {
      setRegistration({
        isRegistering: false,
        isRegistered: false,
        error: error.message || "Failed to register rights on blockchain",
        details: null
      });
       toast({ // Add error toast for catch block
         title: "Registration Error",
         description: error.message || "An unexpected error occurred.",
         variant: "destructive",
       });
    }
  };
  
  const supportedNetworks = getSupportedNetworks();
  
  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle>Register Blockchain Rights</CardTitle>
        <CardDescription>
          Register and protect your music rights on the blockchain
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
              Please connect your wallet to register rights on the blockchain.
            </AlertDescription>
            <Button 
              onClick={() => connectWallet()} 
              className="mt-2" 
              disabled={web3Loading} // Use web3Loading from hook
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
        
        {/* Registration Result */}
        {registration.isRegistered !== null && (
          <Alert 
            variant={registration.isRegistered ? "default" : "destructive"} 
            className={`mb-6 ${registration.isRegistered ? 'bg-green-50 border-green-200 text-green-800' : ''}`} // Add success styling
          >
            {registration.isRegistered ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <AlertTitle>
              {registration.isRegistered 
                ? "Rights Registered Successfully" 
                : "Rights Registration Failed"}
            </AlertTitle>
            <AlertDescription>
              {registration.isRegistered 
                ? registration.details?.message || "The rights were successfully registered on the blockchain." // Show message from result
                : registration.error || "Failed to register rights. Please try again."}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Registration Details Card */}
        {registration.details && registration.isRegistered && ( // Show only on success
          <div className="mb-6 border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Registration Details</h3>
            <div className="space-y-3">
              {registration.details.transactionHash && (
                 <div className="grid grid-cols-2 gap-2">
                   <div className="font-medium">Transaction Hash</div>
                   <div className="font-mono text-xs break-all">{registration.details.transactionHash}</div>
                 </div>
              )}
               {registration.details.tokenId && (
                 <div className="grid grid-cols-2 gap-2">
                   <div className="font-medium">Token ID</div>
                   <div className="font-mono text-xs">{registration.details.tokenId}</div>
                 </div>
               )}
               {registration.details.rightsId && (
                 <div className="grid grid-cols-2 gap-2">
                   <div className="font-medium">Rights Record ID</div>
                   <div>{registration.details.rightsId}</div>
                 </div>
               )}
               {registration.details.blockNumber && (
                 <div className="grid grid-cols-2 gap-2">
                   <div className="font-medium">Block Number</div>
                   <div>{registration.details.blockNumber}</div>
                 </div>
               )}
               {registration.details.network && (
                 <div className="grid grid-cols-2 gap-2">
                   <div className="font-medium">Network</div>
                   <div>{registration.details.network}</div>
                 </div>
               )}
               {registration.details.metadataUri && (
                 <div className="mt-3">
                   <p className="font-medium">IPFS Metadata</p>
                   <p className="text-xs font-mono break-all">{registration.details.metadataUri}</p>
                 </div>
               )}
            </div>
          </div>
        )}
        
        {/* Registration Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Asset ID *</FormLabel>
                    <FormControl>
                      <Input placeholder="ISRC, UPC or other unique identifier" {...field} />
                    </FormControl>
                    <FormDescription>
                      A unique identifier for the asset
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
                    <FormLabel>Asset Type *</FormLabel>
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
                        {/* Align options with updated schema */}
                        <SelectItem value="track">Music Track</SelectItem>
                        <SelectItem value="album">Album</SelectItem>
                        <SelectItem value="release">Release (Collection)</SelectItem> 
                        {/* <SelectItem value="video">Music Video</SelectItem> */}
                        {/* <SelectItem value="artwork">Artwork</SelectItem> */}
                        {/* <SelectItem value="lyrics">Lyrics</SelectItem> */}
                        {/* <SelectItem value="other">Other</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Type of content you're registering
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the title of the work" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="artist"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Artist *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the artist name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => ( 
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detailed description of the work" 
                      className="resize-none h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Include relevant details that identify this work
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
             {/* Add Start Date Field */}
             <FormField
                control={form.control}
                name="startDate"
                render={({ field }: { field: any }) => ( 
                  <FormItem className="flex flex-col">
                    <FormLabel>Rights Start Date *</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? formatDate(field.value) : "Select start date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                     <FormMessage />
                  </FormItem>
                )}
              />

            {/* Advanced Options Toggle */}
             <FormField
                control={form.control}
                name="advancedOptions"
                render={({ field }: { field: any }) => ( 
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Advanced Options</FormLabel>
                      <FormDescription>
                        Configure detailed rights, royalties, and licensing terms.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

            {/* Advanced Options Section */}
            {watchAdvancedOptions && (
              <div className="space-y-6 border p-4 rounded-md animate-fadeIn">
                 <h3 className="text-lg font-medium">Advanced Rights Configuration</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FormField
                     control={form.control}
                     name="rightsType"
                     render={({ field }: { field: any }) => ( 
                       <FormItem>
                         <FormLabel>Rights Type *</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                             <SelectTrigger>
                               <SelectValue placeholder="Select rights type" />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             <SelectItem value="master">Master Recording</SelectItem>
                             <SelectItem value="publishing">Publishing</SelectItem>
                             <SelectItem value="sync">Synchronization</SelectItem>
                             <SelectItem value="mechanical">Mechanical</SelectItem>
                             <SelectItem value="performance">Performance</SelectItem>
                             <SelectItem value="derivative">Derivative Works</SelectItem>
                           </SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                    <FormField
                     control={form.control}
                     name="ownerType"
                     render={({ field }: { field: any }) => ( 
                       <FormItem>
                         <FormLabel>Owner Type *</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                           <FormControl>
                             <SelectTrigger>
                               <SelectValue placeholder="Select owner type" />
                             </SelectTrigger>
                           </FormControl>
                           <SelectContent>
                             <SelectItem value="artist">Artist</SelectItem>
                             <SelectItem value="songwriter">Songwriter</SelectItem>
                             <SelectItem value="producer">Producer</SelectItem>
                             <SelectItem value="label">Label</SelectItem>
                             <SelectItem value="publisher">Publisher</SelectItem>
                             <SelectItem value="distributor">Distributor</SelectItem>
                           </SelectContent>
                         </Select>
                         <FormMessage />
                       </FormItem>
                     )}
                   />
                 </div>

                 <FormField
                   control={form.control}
                   name="royaltyPercentage"
                   render={({ field }: { field: any }) => ( 
                     <FormItem>
                       <FormLabel>Royalty Percentage ({field.value}%)</FormLabel>
                       <FormControl>
                         <Slider
                           defaultValue={[field.value]}
                           max={100}
                           step={1}
                           onValueChange={(value) => field.onChange(value[0])}
                         />
                       </FormControl>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <FormField
                     control={form.control}
                     name="exclusive"
                     render={({ field }: { field: any }) => ( 
                       <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                         <div className="space-y-0.5">
                           <FormLabel>Exclusive Rights</FormLabel>
                           <FormDescription>
                             Grant exclusive rights for this registration.
                           </FormDescription>
                         </div>
                         <FormControl>
                           <Switch
                             checked={field.value}
                             onCheckedChange={field.onChange}
                           />
                         </FormControl>
                       </FormItem>
                     )}
                   />
                   
                   <FormField
                     control={form.control}
                     name="territorial"
                     render={({ field }: { field: any }) => ( 
                       <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                         <div className="space-y-0.5">
                           <FormLabel>Territorial Rights</FormLabel>
                           <FormDescription>
                             Specify territories where rights apply.
                           </FormDescription>
                         </div>
                         <FormControl>
                           <Switch
                             checked={field.value}
                             onCheckedChange={field.onChange}
                           />
                         </FormControl>
                       </FormItem>
                     )}
                   />
                 </div>

                 {watchTerritorial && (
                   <FormItem>
                     <FormLabel>Applicable Territories</FormLabel>
                     <div className="flex gap-2">
                       <Input 
                         placeholder="Enter territory (e.g., US, CA, GB)" 
                         value={territoryInput}
                         onChange={(e) => setTerritoryInput(e.target.value)}
                         onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTerritory(); } }}
                       />
                       <Button type="button" onClick={addTerritory}>Add</Button>
                     </div>
                     {territories.length > 0 ? (
                       <div className="flex flex-wrap gap-2 mt-2">
                         {territories.map((territory) => (
                           <Badge key={territory} variant="secondary">
                             {territory}
                             <button 
                               type="button" 
                               onClick={() => removeTerritory(territory)} 
                               className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                             >
                               <XIcon className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                             </button>
                           </Badge>
                         ))}
                       </div>
                     ) : (
                       <p className="text-xs text-muted-foreground mt-1">Leave empty for worldwide rights.</p>
                     )}
                     <FormMessage />
                   </FormItem>
                 )}

                 <FormField
                   control={form.control}
                   name="license"
                   render={({ field }: { field: any }) => ( 
                     <FormItem>
                       <FormLabel>Usage License</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value}>
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue placeholder="Select license type" />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           <SelectItem value="All-Rights-Reserved">All Rights Reserved</SelectItem>
                           <SelectItem value="CC0">CC0 (Public Domain)</SelectItem>
                           <SelectItem value="CC-BY">CC BY (Attribution)</SelectItem>
                           <SelectItem value="CC-BY-SA">CC BY-SA (Attribution-ShareAlike)</SelectItem>
                           <SelectItem value="CC-BY-NC">CC BY-NC (Attribution-NonCommercial)</SelectItem>
                           <SelectItem value="CC-BY-ND">CC BY-ND (Attribution-NoDerivs)</SelectItem>
                           <SelectItem value="CC-BY-NC-SA">CC BY-NC-SA</SelectItem>
                           <SelectItem value="CC-BY-NC-ND">CC BY-NC-ND</SelectItem>
                         </SelectContent>
                       </Select>
                       <FormDescription>
                         Choose the usage license for this work.
                       </FormDescription>
                       <FormMessage />
                     </FormItem>
                   )}
                 />

                 <FormField
                   control={form.control}
                   name="networkId"
                   render={({ field }: { field: any }) => ( 
                     <FormItem>
                       <FormLabel>Target Blockchain Network</FormLabel>
                       <Select 
                         onValueChange={field.onChange} 
                         value={field.value || network || ''} // Use connected network as default if available
                       >
                         <FormControl>
                           <SelectTrigger>
                             <SelectValue placeholder="Select network" />
                           </SelectTrigger>
                         </FormControl>
                         <SelectContent>
                           {supportedNetworks.map((net) => (
                             <SelectItem key={net.id} value={net.id}>
                               {net.name}
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                       <FormDescription>
                         The blockchain network to register rights on.
                       </FormDescription>
                       <FormMessage />
                     </FormItem>
                   )}
                 />
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={!isConnected || registration.isRegistering} 
              className="w-full"
            >
              {registration.isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Register Rights on Blockchain'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-4">
         <p className="text-xs text-muted-foreground">
            Blockchain transactions may incur gas fees.
         </p>
      </CardFooter>
    </Card>
  );
}