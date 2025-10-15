import React, { useState, useEffect } from 'react'; // Import useEffect
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Palette, 
  Globe, 
  Building, 
  Mail, 
  Phone, 
  MapPin,
  ToggleRight,
  Users,
  Copy
} from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';

interface WhiteLabelConfig {
  enabled: boolean;
  brandName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  customDomain?: string;
  customLoginUrl?: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    companyName: string;
    supportEmail: string;
  };
  featureFlags: {
    [key: string]: boolean;
  };
  userLimits: {
    maxUsers: number;
    maxArtistsPerUser: number;
    maxReleasesPerMonth: number;
  };
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const featureFlags: FeatureFlag[] = [
  {
    id: 'bulkUpload',
    name: 'Bulk Upload',
    description: 'Allow users to upload multiple releases at once',
    enabled: true
  },
  {
    id: 'advancedAnalytics',
    name: 'Advanced Analytics',
    description: 'Provide detailed analytics and reporting features',
    enabled: true
  },
  {
    id: 'teamManagement',
    name: 'Team Management',
    description: 'Allow users to create and manage team members',
    enabled: true
  },
  {
    id: 'royaltySplitting',
    name: 'Royalty Splitting',
    description: 'Enable advanced royalty splitting functionality',
    enabled: true
  },
  {
    id: 'aiMetadataGeneration',
    name: 'AI Metadata Generation',
    description: 'Use AI to generate and enhance metadata',
    enabled: true
  },
  {
    id: 'advancedDistribution',
    name: 'Advanced Distribution',
    description: 'Enable advanced distribution options and platforms',
    enabled: true
  },
  {
    id: 'rightsManagement',
    name: 'Rights Management',
    description: 'Enable rights management and licensing features',
    enabled: true
  },
  {
    id: 'customExport',
    name: 'Custom Export',
    description: 'Allow exporting data in various formats',
    enabled: true
  }
];

export default function WhiteLabelPage() {
  const { toast } = useToast();
  const [config, setConfig] = useState<WhiteLabelConfig>({
    enabled: true,
    brandName: 'Music Distribution Pro',
    logoUrl: '/logo.png',
    primaryColor: '#4f46e5',
    secondaryColor: '#2563eb',
    accentColor: '#f59e0b',
    customDomain: 'app.musicdistributionpro.com',
    customLoginUrl: 'login.musicdistributionpro.com',
    contactInfo: {
      email: 'info@musicdistributionpro.com',
      phone: '+1 (555) 123-4567',
      address: '123 Music Street, Nashville, TN 37203',
      companyName: 'Music Distribution Inc.',
      supportEmail: 'support@musicdistributionpro.com'
    },
    featureFlags: featureFlags.reduce((acc, flag) => {
      acc[flag.id] = flag.enabled;
      return acc;
    }, {} as Record<string, boolean>),
    userLimits: {
      maxUsers: 50,
      maxArtistsPerUser: 25,
      maxReleasesPerMonth: 100
    }
  });

  // Mock API calls
  const { data: fetchedConfig, isLoading } = useQuery({ // Rename data to avoid conflict
    queryKey: ['white-label-config'],
    // Add explicit return type for queryFn
    queryFn: async (): Promise<WhiteLabelConfig> => {
      // In a real app, this would fetch from the API
      // For mock, return a default or potentially fetched config
      // Returning local state 'config' here might cause infinite loops if not handled carefully
      // Let's assume an API call would happen here in a real app
      console.log("Fetching white-label config (mock)...");
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      // Return the current state as mock data for now
      return config;
    },
    // Remove onSuccess callback
  });

  // Update local state when fetchedConfig changes
  useEffect(() => {
    if (fetchedConfig) {
      setConfig(fetchedConfig);
    }
  }, [fetchedConfig]); // Add fetchedConfig as dependency

  const saveConfigMutation = useMutation({
    mutationFn: async (newConfig: WhiteLabelConfig) => {
      // In a real app, this would send to the API
      console.log('Saving config:', newConfig);
      return newConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['white-label-config'] });
      toast({
        title: "Configuration saved",
        description: "White label configuration has been updated successfully.",
      });
    }
  });

  const handleSave = () => {
    saveConfigMutation.mutate(config);
  };

  const handleToggleFeature = (featureId: string) => {
    setConfig(prev => ({
      ...prev,
      featureFlags: {
        ...prev.featureFlags,
        [featureId]: !prev.featureFlags[featureId]
      }
    }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading configuration...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">White Label Configuration</h1>
          <p className="text-muted-foreground">
            Customize the platform appearance, branding, and features
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveConfigMutation.isPending}>
          {saveConfigMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="branding">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="domain">Domain & Login</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="contact">Contact Information</TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>
                Configure your brand identity including name, logo and colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input 
                    id="brandName" 
                    value={config.brandName}
                    onChange={(e) => setConfig({...config, brandName: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logoUpload">Logo</Label>
                  <div className="flex items-center gap-2">
                    <div className="h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center overflow-hidden">
                      {config.logoUrl ? (
                        <img src={config.logoUrl} alt="Brand logo" className="h-full w-full object-contain" />
                      ) : (
                        <Upload className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Logo
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Color Scheme</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2 items-center">
                      <div 
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: config.primaryColor }}
                      />
                      <Input 
                        value={config.primaryColor}
                        onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2 items-center">
                      <div 
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: config.secondaryColor }}
                      />
                      <Input 
                        value={config.secondaryColor}
                        onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex gap-2 items-center">
                      <div 
                        className="h-10 w-10 rounded-md border"
                        style={{ backgroundColor: config.accentColor }}
                      />
                      <Input 
                        value={config.accentColor}
                        onChange={(e) => setConfig({...config, accentColor: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Reset to default colors
                    setConfig({
                      ...config, 
                      primaryColor: '#4f46e5',
                      secondaryColor: '#2563eb',
                      accentColor: '#f59e0b'
                    });
                  }}
                >
                  Reset to Default Colors
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Preview how your branding will look throughout the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-8 w-8 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      <span className="text-white font-bold text-sm">
                        {config.brandName.substring(0, 1)}
                      </span>
                    </div>
                    <span className="font-semibold">{config.brandName}</span>
                  </div>
                  <div className="flex gap-2">
                    <div 
                      className="h-8 w-20 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: config.primaryColor }}
                    >
                      <span className="text-white text-xs">Button</span>
                    </div>
                    <div 
                      className="h-8 w-20 rounded-md flex items-center justify-center border"
                      style={{ color: config.secondaryColor, borderColor: config.secondaryColor }}
                    >
                      <span className="text-xs">Button</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div 
                    className="h-2 w-full rounded-full mt-2"
                    style={{ backgroundColor: config.secondaryColor }}
                  ></div>
                </div>
                <div className="flex gap-2">
                  <div 
                    className="px-3 py-1 rounded-full text-xs"
                    style={{ backgroundColor: config.accentColor, color: 'white' }}
                  >
                    Tag
                  </div>
                  <div 
                    className="px-3 py-1 rounded-full text-xs"
                    style={{ backgroundColor: config.accentColor, color: 'white' }}
                  >
                    Another tag
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Domain & Login Tab */}
        <TabsContent value="domain" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Domain Configuration</CardTitle>
              <CardDescription>
                Set up custom domains for your white-labeled application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="customDomain">Custom Domain</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="customDomain" 
                    value={config.customDomain || ''}
                    onChange={(e) => setConfig({...config, customDomain: e.target.value})}
                    placeholder="app.yourcompany.com"
                  />
                  <Button variant="outline" size="icon">
                    <Globe className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your custom domain. You'll need to configure DNS settings to point to our servers.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customLoginUrl">Custom Login URL</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="customLoginUrl" 
                    value={config.customLoginUrl || ''}
                    onChange={(e) => setConfig({...config, customLoginUrl: e.target.value})}
                    placeholder="login.yourcompany.com"
                  />
                  <Button variant="outline" size="icon">
                    <Globe className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Optionally set a dedicated login URL for your application.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-lg font-medium">DNS Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Configure these DNS records with your domain provider:
                </p>

                <div className="border rounded-md overflow-hidden">
                  <div className="bg-muted p-3 text-sm font-medium">
                    Required DNS Records
                  </div>
                  <div className="p-3 divide-y">
                    <div className="py-2 flex justify-between items-center">
                      <div>
                        <p className="font-medium">CNAME Record</p>
                        <p className="text-sm text-muted-foreground">
                          {config.customDomain} → cdn.musicdistributionpro.com
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <div className="py-2 flex justify-between items-center">
                      <div>
                        <p className="font-medium">TXT Record</p>
                        <p className="text-sm text-muted-foreground truncate max-w-md">
                          _musicdistribution → verification=abc123def456
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-sm">
                    Domain verification: <span className="font-medium">Verified</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SSL Certificate</CardTitle>
              <CardDescription>
                Manage SSL certificates for your custom domains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <p className="font-medium">
                      {config.customDomain}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Certificate is active and valid through Dec 31, 2025
                  </p>
                </div>
                <Button variant="outline">Renew Certificate</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Management</CardTitle>
              <CardDescription>
                Enable or disable features for your white-labeled application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">White Label Feature</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize branding and application behavior
                    </p>
                  </div>
                  <Switch 
                    checked={config.enabled}
                    onCheckedChange={(checked) => setConfig({...config, enabled: checked})}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  {featureFlags.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{feature.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                      <Switch 
                        checked={config.featureFlags[feature.id]}
                        onCheckedChange={() => handleToggleFeature(feature.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Limits</CardTitle>
              <CardDescription>
                Configure user and content limits for your application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="maxUsers">Maximum Users</Label>
                  <Input 
                    id="maxUsers" 
                    type="number"
                    value={config.userLimits.maxUsers}
                    onChange={(e) => setConfig({
                      ...config, 
                      userLimits: {
                        ...config.userLimits,
                        maxUsers: parseInt(e.target.value)
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of users allowed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxArtistsPerUser">Max Artists Per User</Label>
                  <Input 
                    id="maxArtistsPerUser" 
                    type="number"
                    value={config.userLimits.maxArtistsPerUser}
                    onChange={(e) => setConfig({
                      ...config, 
                      userLimits: {
                        ...config.userLimits,
                        maxArtistsPerUser: parseInt(e.target.value)
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of artists each user can manage
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxReleasesPerMonth">Max Releases Per Month</Label>
                  <Input 
                    id="maxReleasesPerMonth" 
                    type="number"
                    value={config.userLimits.maxReleasesPerMonth}
                    onChange={(e) => setConfig({
                      ...config, 
                      userLimits: {
                        ...config.userLimits,
                        maxReleasesPerMonth: parseInt(e.target.value)
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of releases per month per user
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Information Tab */}
        <TabsContent value="contact" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Configure company and support contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="companyName" 
                      value={config.contactInfo.companyName}
                      onChange={(e) => setConfig({
                        ...config, 
                        contactInfo: {
                          ...config.contactInfo,
                          companyName: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email"
                      value={config.contactInfo.email}
                      onChange={(e) => setConfig({
                        ...config, 
                        contactInfo: {
                          ...config.contactInfo,
                          email: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      value={config.contactInfo.phone}
                      onChange={(e) => setConfig({
                        ...config, 
                        contactInfo: {
                          ...config.contactInfo,
                          phone: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="supportEmail" 
                      type="email"
                      value={config.contactInfo.supportEmail}
                      onChange={(e) => setConfig({
                        ...config, 
                        contactInfo: {
                          ...config.contactInfo,
                          supportEmail: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="address" 
                    value={config.contactInfo.address}
                    onChange={(e) => setConfig({
                      ...config, 
                      contactInfo: {
                        ...config.contactInfo,
                        address: e.target.value
                      }
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Footer Configuration</CardTitle>
              <CardDescription>
                Configure the footer content displayed to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Switch 
                    id="showFooter"
                    checked={true}
                  />
                  <Label htmlFor="showFooter">Show footer on all pages</Label>
                </div>

                <div className="border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-medium mb-2">Footer Preview</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{config.brandName}</p>
                        <p className="text-xs text-muted-foreground">© 2025 {config.contactInfo.companyName}</p>
                      </div>
                      <div className="space-y-1 text-right">
                        <p className="text-xs">{config.contactInfo.email}</p>
                        <p className="text-xs">{config.contactInfo.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}