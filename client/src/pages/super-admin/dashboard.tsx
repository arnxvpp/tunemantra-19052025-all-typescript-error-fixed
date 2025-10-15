import React, { useState, useEffect } from 'react'; // Added useEffect
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Added useQueryClient
import { useThemeConfig, WhiteLabelConfig, ThemeConfig } from '@/hooks/use-theme-config'; // Import types
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form'; // Assuming this is the correct form import
import { 
  Input,
  // InputOTP, // Assuming these are needed and exist
  // InputOTPGroup,
  // InputOTPSlot,
} from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Switch 
} from '@/components/ui/switch';
import { 
  Badge 
} from '@/components/ui/badge';
import { 
  Button 
} from '@/components/ui/button';
import {
  BarChart3,
  Settings,
  Users,
  Shield,
  FileCheck,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  HelpCircle,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Sliders,
  BarChart,
  PieChart,
  Wallet,
  Cloud,
  GanttChart,
  Loader2, // Added Loader2
  Copy, // Added Copy
  Palette, // Added Palette
  Globe, // Added Globe
  Building, // Added Building
  Mail, // Added Mail
  Phone, // Added Phone
  MapPin, // Added MapPin
  Upload // Added Upload
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast'; // Corrected path
import { cn } from '@/lib/utils';
import { ColorPicker } from '@/components/ui/color-picker'; // Assuming this exists
import { Spinner } from '@/components/ui/spinner'; // Assuming this exists
import { apiRequest } from '@/lib/queryClient'; // Assuming this exists
import { Progress } from '@/components/ui/progress'; // Added Progress import
import { Label } from '@/components/ui/label'; // Added Label import
import { Textarea } from '@/components/ui/textarea'; // Added Textarea import

// Type definitions
type SiteStatsType = {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  totalReleases: number;
  distributedReleases: number;
  totalRevenue: number;
  platformPerformance: {
    platform: string;
    successRate: number;
    failureRate: number;
    releases: number;
  }[];
  serverStatus: {
    cpu: number;
    memory: number;
    disk: number;
    status: 'healthy' | 'warning' | 'critical';
  };
};

// Sample data for demonstration
const DEMO_STATS: SiteStatsType = {
  totalUsers: 2458,
  activeUsers: 1892,
  pendingApprovals: 37,
  totalReleases: 12834,
  distributedReleases: 11502,
  totalRevenue: 485620,
  platformPerformance: [
    { platform: 'Spotify', successRate: 98.3, failureRate: 1.7, releases: 12045 },
    { platform: 'Apple Music', successRate: 97.8, failureRate: 2.2, releases: 11876 },
    { platform: 'Amazon Music', successRate: 96.5, failureRate: 3.5, releases: 10245 },
    { platform: 'YouTube Music', successRate: 99.1, failureRate: 0.9, releases: 11987 },
    { platform: 'Deezer', successRate: 95.7, failureRate: 4.3, releases: 9865 },
    { platform: 'TIDAL', successRate: 94.2, failureRate: 5.8, releases: 8743 },
  ],
  serverStatus: {
    cpu: 42,
    memory: 68,
    disk: 58, 
    status: 'healthy'
  }
};

// Define FeatureFlag type based on usage
interface FeatureFlag {
  id: string;
  name: string;
  description: string;
}

// Define feature flags based on usage in the component
const featureFlagsConfig: FeatureFlag[] = [
   { id: 'analyticsEnabled', name: 'Analytics Dashboard', description: 'Enable detailed analytics view for users.' },
   { id: 'bulkDistributionEnabled', name: 'Bulk Distribution', description: 'Allow users to distribute multiple releases at once.' },
   { id: 'aiMetadataEnabled', name: 'AI Metadata Assistance', description: 'Enable AI suggestions for metadata generation.' },
   { id: 'multiLabelEnabled', name: 'Multi-Label Support', description: 'Allow users to manage multiple labels under one account.' },
   // Add other potential flags if needed based on config structure
];


export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState('analytics');
  // Destructure both config and whiteLabelConfig, provide defaults
  const { 
    config = { appearance: 'system', radius: 0.5 } as ThemeConfig, // Provide default for ThemeConfig
    whiteLabelConfig = {} as WhiteLabelConfig, 
    saveWhiteLabelConfig, 
    isSaving,
    updateTheme // Assuming updateTheme exists for theme settings
  } = useThemeConfig(); 
  const { toast } = useToast();
  const queryClient = useQueryClient(); // Get queryClient instance
  
  // Local state for form inputs, initialize safely using ?? from the correct config object
  const [brandName, setBrandName] = useState(whiteLabelConfig.brandName ?? '');
  const [customDomain, setCustomDomain] = useState(whiteLabelConfig.customDomain ?? '');
  const [primaryColor, setPrimaryColor] = useState(whiteLabelConfig.primaryColor ?? '#4f46e5');
  const [secondaryColor, setSecondaryColor] = useState(whiteLabelConfig.secondaryColor ?? '#2563eb');
  const [accentColor, setAccentColor] = useState(whiteLabelConfig.accentColor ?? '#f59e0b');
  const [contactEmail, setContactEmail] = useState(whiteLabelConfig.contactInfo?.email ?? '');
  const [supportEmail, setSupportEmail] = useState(whiteLabelConfig.contactInfo?.supportEmail ?? '');
  const [companyName, setCompanyName] = useState(whiteLabelConfig.contactInfo?.companyName ?? '');
  const [phone, setPhone] = useState(whiteLabelConfig.contactInfo?.phone ?? '');
  const [address, setAddress] = useState(whiteLabelConfig.contactInfo?.address ?? '');
  const [maxUsers, setMaxUsers] = useState(whiteLabelConfig.userLimits?.maxUsers ?? 50);
  const [maxArtists, setMaxArtists] = useState(whiteLabelConfig.userLimits?.maxArtistsPerUser ?? 25);
  const [maxReleases, setMaxReleases] = useState(whiteLabelConfig.userLimits?.maxReleasesPerMonth ?? 100);
  const [theme, setThemeState] = useState(config.appearance ?? 'system'); // Use config.appearance for theme
  // const [density, setDensity] = useState(whiteLabelConfig.layoutDensity ?? 'comfortable'); // Remove density state
  const [radius, setRadius] = useState(config.radius ?? 0.5); // Use config.radius
  const [featureFlags, setFeatureFlags] = useState(whiteLabelConfig.featureFlags ?? {});
  const [whiteLabelEnabled, setWhiteLabelEnabled] = useState(whiteLabelConfig.enabled ?? true);


   // Effect to update local state when config from hook changes
   useEffect(() => {
    setBrandName(whiteLabelConfig.brandName ?? '');
    setCustomDomain(whiteLabelConfig.customDomain ?? '');
    setPrimaryColor(whiteLabelConfig.primaryColor ?? '#4f46e5');
    setSecondaryColor(whiteLabelConfig.secondaryColor ?? '#2563eb');
    setAccentColor(whiteLabelConfig.accentColor ?? '#f59e0b');
    setContactEmail(whiteLabelConfig.contactInfo?.email ?? '');
    setSupportEmail(whiteLabelConfig.contactInfo?.supportEmail ?? '');
    setCompanyName(whiteLabelConfig.contactInfo?.companyName ?? '');
    setPhone(whiteLabelConfig.contactInfo?.phone ?? '');
    setAddress(whiteLabelConfig.contactInfo?.address ?? '');
    setMaxUsers(whiteLabelConfig.userLimits?.maxUsers ?? 50);
    setMaxArtists(whiteLabelConfig.userLimits?.maxArtistsPerUser ?? 25);
    setMaxReleases(whiteLabelConfig.userLimits?.maxReleasesPerMonth ?? 100);
    setThemeState(config.appearance ?? 'system'); // Use config.appearance
    // setDensity(whiteLabelConfig.layoutDensity ?? 'comfortable'); // Remove density update
    setRadius(config.radius ?? 0.5); // Use config.radius
    setFeatureFlags(whiteLabelConfig.featureFlags ?? {});
    setWhiteLabelEnabled(whiteLabelConfig.enabled ?? true);
  }, [config, whiteLabelConfig]); // Depend on both config objects

  
  // Stat metrics query
  const { data: statsData, isLoading, error, refetch } = useQuery<SiteStatsType>({ // Add type
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<SiteStatsType> => { // Add return type
      try {
        // In a real implementation, this would fetch from the API
        // const response = await apiRequest<SiteStatsType>('/api/admin/stats');
        // return response; 
        
        // For demo purposes, return mock data with a slight delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return DEMO_STATS;
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
  });
  
  // Generic save handler for WhiteLabelConfig using the hook
  const handleWhiteLabelSave = (updateData: Partial<WhiteLabelConfig>) => {
     const currentConfigData = whiteLabelConfig || {}; 
     const saveData = { ...currentConfigData, ...updateData } as WhiteLabelConfig; 
     
     // Ensure required fields have default values if missing after merge
     const finalSaveData: WhiteLabelConfig = {
        enabled: saveData.enabled ?? false,
        brandName: saveData.brandName ?? '',
        logoUrl: saveData.logoUrl ?? '',
        primaryColor: saveData.primaryColor ?? '#000000',
        secondaryColor: saveData.secondaryColor ?? '#000000',
        accentColor: saveData.accentColor ?? '#000000',
        contactInfo: saveData.contactInfo ?? { email: '', phone: '', address: '', companyName: '', supportEmail: '' },
        featureFlags: saveData.featureFlags ?? {},
        userLimits: saveData.userLimits ?? { maxUsers: 0, maxArtistsPerUser: 0, maxReleasesPerMonth: 0 },
        customDomain: saveData.customDomain,
        customLoginUrl: saveData.customLoginUrl,
        // Remove layoutDensity if it's not part of WhiteLabelConfig
        // layoutDensity: saveData.layoutDensity ?? 'comfortable', 
     };

     saveWhiteLabelConfig(finalSaveData); 
     toast({
       title: "Settings Updated",
       description: "Your changes are being saved.",
       duration: 2000
     });
  };

   // Generic save handler for ThemeConfig using the hook
   const handleThemeSave = (updateData: Partial<ThemeConfig>) => {
      if (updateTheme) { // Check if updateTheme function exists
         updateTheme(updateData);
         toast({
           title: "Theme Updated",
           description: "Your theme changes are being applied.",
           duration: 2000
         });
      } else {
         console.warn("updateTheme function not available from useThemeConfig");
         toast({ title: "Error", description: "Could not save theme settings.", variant: "destructive" });
      }
   };


  // Toggle white labeling
  const toggleWhiteLabeling = (enabled: boolean) => {
    setWhiteLabelEnabled(enabled); // Update local state first
    handleWhiteLabelSave({ enabled }); // Then save via hook
  };
  
  // Toggle feature flags
  const toggleFeatureFlag = (flagId: string, value: boolean) => {
     const updatedFlags = { ...featureFlags, [flagId]: value };
     setFeatureFlags(updatedFlags); // Update local state
     handleWhiteLabelSave({ featureFlags: updatedFlags }); // Save via hook
  };
  
  // Update user limits
  const updateUserLimit = (limit: 'maxUsers' | 'maxArtistsPerUser' | 'maxReleasesPerMonth', value: number | string) => {
     const numericValue = typeof value === 'string' ? parseInt(value) || 0 : value; // Ensure number
     // Use local state as the base for current limits, provide default structure
     const currentLimits = whiteLabelConfig.userLimits || { maxUsers: 0, maxArtistsPerUser: 0, maxReleasesPerMonth: 0 }; // Use whiteLabelConfig
     const updatedLimits = { ...currentLimits, [limit]: numericValue };
     
     // Update local state based on which limit changed
     if (limit === 'maxUsers') setMaxUsers(numericValue);
     else if (limit === 'maxArtistsPerUser') setMaxArtists(numericValue);
     else if (limit === 'maxReleasesPerMonth') setMaxReleases(numericValue);

     handleWhiteLabelSave({ userLimits: updatedLimits }); // Save via hook
  };
  
  // Set theme
  const setTheme = (themeValue: 'light' | 'dark' | 'system') => {
    setThemeState(themeValue); // Update local state
    handleThemeSave({ appearance: themeValue }); // Use handleThemeSave
  };
  
  // Remove setLayoutDensity function
  // const setLayoutDensity = (densityValue: 'compact' | 'comfortable' | 'spacious') => { ... };
  
  // Set border radius (Assuming this is part of ThemeConfig)
  const setBorderRadius = (radiusValue: number | string) => {
     const numericValue = typeof radiusValue === 'string' ? parseFloat(radiusValue) || 0 : radiusValue; // Ensure number
     setRadius(numericValue); // Update local state
     handleThemeSave({ radius: numericValue }); // Use handleThemeSave
  };
  
  // Get status badge color
  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Set contact info - simplified to save all at once if needed, or handle individually
   const handleContactSave = () => {
      // Construct the contactInfo object from local state
      const contactInfoData = {
         email: contactEmail,
         phone: phone,
         address: address,
         companyName: companyName,
         supportEmail: supportEmail,
      };
      handleWhiteLabelSave({ contactInfo: contactInfoData });
   };

  
  return (
    <div className="space-y-6 p-4 md:p-6"> {/* Added padding */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage white label settings and system configuration</p>
        </div>
        
        <Button onClick={() => refetch()} className="flex items-center gap-2" variant="outline" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>Refresh Data</span>
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics" className="flex items-center justify-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="white-label" className="flex items-center justify-center gap-2">
            <Sliders className="h-4 w-4" />
            <span>White Label</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center justify-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Features</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center justify-center gap-2">
            <Users className="h-4 w-4" />
            <span>User Management</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Users */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData?.totalUsers?.toLocaleString() ?? '--'}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-green-500">{statsData?.activeUsers?.toLocaleString() ?? '--'}</span> active
                </div>
              </CardContent>
            </Card>
            
            {/* Pending Approvals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData?.pendingApprovals?.toLocaleString() ?? '--'}</div>
                <div className="text-xs text-muted-foreground">
                  Requiring admin review
                </div>
              </CardContent>
            </Card>
            
            {/* Total Releases */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Releases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData?.totalReleases?.toLocaleString() ?? '--'}</div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-green-500">{statsData?.distributedReleases?.toLocaleString() ?? '--'}</span> distributed
                </div>
              </CardContent>
            </Card>
            
            {/* Total Revenue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${statsData?.totalRevenue?.toLocaleString() ?? '--'}</div>
                <div className="text-xs text-muted-foreground">
                  Lifetime value
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Platform Performance */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>Distribution success rates by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead className="text-right">Success Rate</TableHead>
                    <TableHead className="text-right">Failure Rate</TableHead>
                    <TableHead className="text-right">Total Releases</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsData?.platformPerformance?.map((platform) => (
                    <TableRow key={platform.platform}>
                      <TableCell>{platform.platform}</TableCell>
                      <TableCell className="text-right text-green-600">{platform.successRate}%</TableCell>
                      <TableCell className="text-right text-red-600">{platform.failureRate}%</TableCell>
                      <TableCell className="text-right">{platform.releases.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

           {/* Server Status */}
           <Card>
             <CardHeader>
               <CardTitle>Server Status</CardTitle>
               <CardDescription>Current server load and health</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-sm font-medium">Overall Status</span>
                   <Badge className={cn("capitalize", getStatusColor(statsData?.serverStatus?.status ?? 'warning'))}>
                      {statsData?.serverStatus?.status ?? 'Unknown'}
                   </Badge>
                </div>
                <div>
                   <Label className="text-xs text-muted-foreground">CPU Usage</Label>
                   <Progress value={statsData?.serverStatus?.cpu ?? 0} className="h-2 mt-1" />
                </div>
                 <div>
                   <Label className="text-xs text-muted-foreground">Memory Usage</Label>
                   <Progress value={statsData?.serverStatus?.memory ?? 0} className="h-2 mt-1" />
                </div>
                 <div>
                   <Label className="text-xs text-muted-foreground">Disk Usage</Label>
                   <Progress value={statsData?.serverStatus?.disk ?? 0} className="h-2 mt-1" />
                </div>
             </CardContent>
           </Card>

        </TabsContent>
        
        {/* White Label Tab */}
        <TabsContent value="white-label" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>White Label Settings</CardTitle>
               <div className="flex items-center justify-between">
                  <CardDescription>Enable or disable white labeling for the platform.</CardDescription>
                  <Switch 
                     checked={whiteLabelEnabled} 
                     onCheckedChange={toggleWhiteLabeling} 
                     aria-label="Toggle white labeling"
                  />
               </div>
            </CardHeader>
             {whiteLabelEnabled && (
                <CardContent className="space-y-6 pt-4">
                   {/* Branding Section */}
                   <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Branding</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label htmlFor="brandName">Brand Name</Label>
                            <Input 
                               id="brandName" 
                               value={brandName}
                               onChange={(e) => setBrandName(e.target.value)}
                               onBlur={() => handleWhiteLabelSave({ brandName })} // Save on blur
                            />
                         </div>
                         {/* Logo Upload Placeholder */}
                         <div className="space-y-2">
                            <Label htmlFor="logoUpload">Logo</Label>
                            <div className="flex items-center gap-2">
                               <div className="h-12 w-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                                  {whiteLabelConfig.logoUrl ? ( // Use whiteLabelConfig
                                     <img src={whiteLabelConfig.logoUrl} alt="Brand logo" className="h-full w-full object-contain" />
                                  ) : (
                                     <Palette className="h-6 w-6 text-muted-foreground" />
                                  )}
                               </div>
                               <Button variant="outline" size="sm" disabled> {/* Disabled for now */}
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload Logo
                               </Button>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Color Scheme Section */}
                   <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Color Scheme</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="space-y-2">
                            <Label>Primary Color</Label>
                            <ColorPicker value={primaryColor} onChange={(c) => { setPrimaryColor(c); handleWhiteLabelSave({ primaryColor: c }); }} />
                         </div>
                         <div className="space-y-2">
                            <Label>Secondary Color</Label>
                            <ColorPicker value={secondaryColor} onChange={(c) => { setSecondaryColor(c); handleWhiteLabelSave({ secondaryColor: c }); }} />
                         </div>
                         <div className="space-y-2">
                            <Label>Accent Color</Label>
                            <ColorPicker value={accentColor} onChange={(c) => { setAccentColor(c); handleWhiteLabelSave({ accentColor: c }); }} />
                         </div>
                      </div>
                   </div>

                   {/* Domain Section */}
                   <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Domain</h3>
                       <div className="space-y-2">
                         <Label htmlFor="customDomain">Custom Domain</Label>
                         <div className="flex items-center gap-2">
                           <Input 
                             id="customDomain" 
                             value={customDomain}
                             onChange={(e) => setCustomDomain(e.target.value)}
                             onBlur={() => handleWhiteLabelSave({ customDomain })}
                             placeholder="app.yourcompany.com"
                           />
                           <Button variant="outline" size="icon" disabled>
                             <Globe className="h-4 w-4" />
                           </Button>
                         </div>
                         <p className="text-sm text-muted-foreground">
                           Configure DNS CNAME record to point to platform domain.
                         </p>
                       </div>
                   </div>
                   
                   {/* Appearance Section (Uses ThemeConfig) */}
                   <div className="space-y-4">
                      <h3 className="text-lg font-medium border-b pb-2">Appearance</h3>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                             <Label>Theme</Label>
                             <Select value={theme} onValueChange={(v) => setTheme(v as any)}>
                                <SelectTrigger>
                                   <SelectValue placeholder="Select theme" />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="light">Light</SelectItem>
                                   <SelectItem value="dark">Dark</SelectItem>
                                   <SelectItem value="system">System</SelectItem>
                                </SelectContent>
                             </Select>
                          </div>
                           {/* Remove Layout Density Select */}
                           {/* <div className="space-y-2">
                             <Label>Layout Density</Label>
                             <Select value={density} onValueChange={(v) => setLayoutDensity(v as any)}>
                                <SelectTrigger>
                                   <SelectValue placeholder="Select density" />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="compact">Compact</SelectItem>
                                   <SelectItem value="comfortable">Comfortable</SelectItem>
                                   <SelectItem value="spacious">Spacious</SelectItem>
                                </SelectContent>
                             </Select>
                          </div> */}
                           <div className="space-y-2">
                             <Label htmlFor="borderRadius">Border Radius (0-1)</Label>
                             <div className="flex items-center gap-2">
                                <Input 
                                   id="borderRadius" 
                                   type="number" 
                                   step="0.1" 
                                   min="0" 
                                   max="1" 
                                   value={radius} 
                                   onChange={(e) => setRadius(parseFloat(e.target.value))}
                                   onBlur={() => handleThemeSave({ radius: radius })} // Use handleThemeSave
                                />
                                <span>rem</span>
                             </div>
                          </div>
                       </div>
                   </div>

                </CardContent>
             )}
             <CardFooter className="border-t pt-6 flex justify-end">
                 <Button onClick={() => handleWhiteLabelSave({ 
                     enabled: whiteLabelEnabled,
                     brandName, 
                     customDomain, 
                     primaryColor, 
                     secondaryColor, 
                     accentColor, 
                     // Remove layoutDensity
                  })} 
                  disabled={isSaving}
                 >
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save White Label Settings
                 </Button>
             </CardFooter>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle>Feature Flags</CardTitle>
               <CardDescription>Enable or disable specific platform features for all users.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                {featureFlagsConfig.map((feature) => (
                   <div key={feature.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                         <Label htmlFor={feature.id} className="font-medium">{feature.name}</Label>
                         <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <Switch
                         id={feature.id}
                         checked={featureFlags[feature.id] ?? false} // Use local state
                         onCheckedChange={(checked) => toggleFeatureFlag(feature.id, checked)}
                      />
                   </div>
                ))}
             </CardContent>
           </Card>
            <Card>
             <CardHeader>
               <CardTitle>User Limits</CardTitle>
               <CardDescription>Set usage limits based on subscription plans.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                      <Label htmlFor="maxUsers">Max Users</Label>
                      <Input 
                         id="maxUsers" 
                         type="number" 
                         value={maxUsers} 
                         onChange={(e) => setMaxUsers(parseInt(e.target.value))}
                         onBlur={() => updateUserLimit('maxUsers', maxUsers)}
                      />
                   </div>
                    <div>
                      <Label htmlFor="maxArtistsPerUser">Max Artists per User</Label>
                      <Input 
                         id="maxArtistsPerUser" 
                         type="number" 
                         value={maxArtists} 
                         onChange={(e) => setMaxArtists(parseInt(e.target.value))}
                         onBlur={() => updateUserLimit('maxArtistsPerUser', maxArtists)}
                      />
                   </div>
                    <div>
                      <Label htmlFor="maxReleasesPerMonth">Max Releases per Month</Label>
                      <Input 
                         id="maxReleasesPerMonth" 
                         type="number" 
                         value={maxReleases} 
                         onChange={(e) => setMaxReleases(parseInt(e.target.value))}
                         onBlur={() => updateUserLimit('maxReleasesPerMonth', maxReleases)}
                      />
                   </div>
                </div>
             </CardContent>
              <CardFooter className="border-t pt-6 flex justify-end">
                 <Button onClick={() => handleWhiteLabelSave({ userLimits: { maxUsers, maxArtistsPerUser: maxArtists, maxReleasesPerMonth: maxReleases } })} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save User Limits
                 </Button>
             </CardFooter>
           </Card>
        </TabsContent>

        {/* Contact Info Tab */}
         <TabsContent value="contact" className="space-y-4">
           <Card>
             <CardHeader>
               <CardTitle>Contact Information</CardTitle>
               <CardDescription>Set the contact details displayed to users.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} onBlur={handleContactSave} />
                   </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} onBlur={handleContactSave} />
                   </div>
                    <div className="space-y-2">
                      <Label htmlFor="supportEmail">Support Email</Label>
                      <Input id="supportEmail" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} onBlur={handleContactSave} />
                   </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onBlur={handleContactSave} />
                   </div>
                </div>
                 <div className="space-y-2">
                   <Label htmlFor="address">Address</Label>
                   <Textarea id="address" value={address} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAddress(e.target.value)} onBlur={handleContactSave} />
                </div>
             </CardContent>
              <CardFooter className="border-t pt-6 flex justify-end">
                 <Button onClick={handleContactSave} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save Contact Info
                 </Button>
             </CardFooter>
           </Card>
         </TabsContent>

         {/* User Management Tab Placeholder */}
         <TabsContent value="users" className="space-y-4">
            <Card>
               <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage user accounts.</CardDescription>
               </CardHeader>
               <CardContent>
                  <p className="text-muted-foreground">User management interface coming soon.</p>
                  {/* Placeholder for user table or management components */}
               </CardContent>
            </Card>
         </TabsContent>

      </Tabs>
    </div>
  );
}