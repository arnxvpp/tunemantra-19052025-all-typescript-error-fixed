import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, Database, Shield, Globe, Bell, Key, 
  Save, RotateCcw, Lock, Server, Mail
} from "lucide-react";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorRequired: false,
    strongPasswordPolicy: true,
    passwordExpiryDays: "90",
    sessionTimeoutMinutes: "30",
    loginAttempts: "5"
  });

  const [emailSettings, setEmailSettings] = useState({
    notificationEmail: "admin@soundwave.com",
    emailFromName: "SoundWave Distribution",
    supportEmail: "support@soundwave.com",
    smtpServer: "smtp.example.com",
    smtpPort: "587",
    smtpUsername: "notifications@soundwave.com"
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    debugMode: false,
    analyticsTracking: true,
    cacheDuration: "60",
    maxUploadSize: "500"
  });

  const [distributionSettings, setDistributionSettings] = useState({
    vevo: {
      enabled: true,
      apiKey: "••••••••••••••••",
      partnerId: "SOUNDWAVE2025",
      videoQualityCheck: true,
      autoDistribute: false,
      description: "Global music video network with high visibility on YouTube and connected platforms"
    },
    spotify: {
      enabled: true,
      clientId: "••••••••••••••••",
      clientSecret: "••••••••••••••••",
      redirectUri: "https://app.soundwave.com/callback/spotify",
      description: "Over 70 million tracks with strong international and Indian music catalog"
    },
    youtubeMusic: {
      enabled: true,
      apiKey: "••••••••••••••••",
      channelId: "UC-music-distribution",
      contentOwnerId: "SW12345",
      description: "Access to official songs, music videos, and user-generated content"
    },
    amazonMusic: {
      enabled: false,
      accessKey: "",
      secretKey: "",
      region: "us-east-1",
      description: "Millions of tracks across genres and languages with Prime integration"
    },
    jioSaavn: {
      enabled: false,
      apiKey: "",
      partnerId: "",
      description: "Combined extensive Bollywood and international music libraries with premium tier"
    },
    appleMusic: {
      enabled: true,
      keyId: "••••••••••••••••",
      teamId: "••••••••••••••••",
      privateKeyPath: "/secure/keys/apple_music.p8",
      description: "Over 75 million songs with a mix of global and regional tracks"
    },
    deezer: {
      enabled: false,
      appId: "",
      secretKey: "",
      description: "Global streaming service with 73 million tracks and exclusive content"
    },
    tidal: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      description: "Hi-fi music streaming with superior audio quality and exclusive releases"
    },
    pandora: {
      enabled: false,
      apiKey: "",
      partnerId: "",
      description: "Personalized radio service with extensive reach in the US market"
    },
    iHeartRadio: {
      enabled: false,
      apiKey: "",
      partnerId: "",
      description: "Leading US radio and streaming platform with broad audience reach"
    },
    anghami: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      region: "mena",
      description: "Leading music platform in the Middle East and North Africa region"
    },
    boomplay: {
      enabled: false,
      apiKey: "",
      partnerId: "",
      description: "Africa's fastest growing music service with over 60 million users"
    },
    kkbox: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      description: "Leading music streaming service in East and Southeast Asia"
    },
    netease: {
      enabled: false,
      apiKey: "",
      secretKey: "",
      description: "Major music streaming platform in the Chinese market"
    },
    audiomack: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      description: "Platform popular with independent artists and hip-hop community"
    },
    soundcloud: {
      enabled: true,
      clientId: "••••••••••••••••",
      clientSecret: "••••••••••••••••",
      redirectUri: "https://app.soundwave.com/callback/soundcloud",
      description: "Unique mix of independent and mainstream music with creator community"
    },
    gaana: {
      enabled: false,
      partnerId: "",
      apiKey: "",
      description: "Extensive catalog with a strong focus on Bollywood and regional Indian music"
    },
    qobuz: {
      enabled: false,
      appId: "",
      secretKey: "",
      description: "Premium hi-res audio streaming service for audiophiles"
    },
    wynk: {
      enabled: false,
      apiKey: "",
      partnerId: "",
      description: "Wide range of genres with especially strong catalog in Indian music"
    },
    napster: {
      enabled: false,
      apiKey: "",
      secretKey: "",
      description: "Established service with extensive curated playlists and global catalog"
    },
    bandcamp: {
      enabled: false,
      apiKey: "",
      username: "",
      description: "Artist-focused platform with direct fan relationship and merchandising"
    },
    triller: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      description: "Short-form video app with music integration and growing user base"
    },
    hungama: {
      enabled: false,
      apiKey: "",
      partnerId: "",
      description: "Comprehensive collection of Bollywood and regional Indian music"
    },
    resso: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      description: "Growing social music platform from ByteDance (TikTok parent company)"
    }
  });

  const handleSaveSettings = async (section: string) => {
    try {
      if (section === 'Distribution') {
        // Convert the UI state to database format
        const platformUpdates = Object.entries(distributionSettings).map(([key, platform]) => {
          const { enabled, description, ...credentials } = platform;
          return {
            name: key.charAt(0).toUpperCase() + key.slice(1),
            status: enabled ? "active" : "inactive",
            apiCredentials: credentials,
            type: key === 'vevo' || key === 'youtubeMusic' ? 'video' : 'streaming'
          };
        });

        // Save platform settings via admin API
        const response = await fetch('/api/distribution-platforms/admin/settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ platforms: platformUpdates }),
        });

        if (!response.ok) {
          throw new Error('Failed to save platform settings');
        }

        toast({
          title: "Settings saved",
          description: "Distribution platform settings have been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: "There was a problem updating your settings.",
        variant: "destructive"
      });
    }
  };

  const handleResetSettings = (settingType: string) => {
    toast({
      title: "Settings Reset",
      description: `${settingType} settings have been reset to defaults.`
    });
  };

  return (
    <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admin Settings</h2>
          <p className="text-muted-foreground">
            Configure system-wide settings for the music distribution platform
          </p>
        </div>

        <Tabs defaultValue="security" className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="system">
              <Server className="h-4 w-4 mr-2" />
              System
            </TabsTrigger>
            <TabsTrigger value="distribution">
              <Globe className="h-4 w-4 mr-2" />
              Distribution
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Configure account security and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Require Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Force all admin accounts to use 2FA
                      </p>
                    </div>
                    <Switch 
                      checked={securitySettings.twoFactorRequired} 
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorRequired: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Strong Password Policy</Label>
                      <p className="text-sm text-muted-foreground">
                        Enforce complex password requirements
                      </p>
                    </div>
                    <Switch 
                      checked={securitySettings.strongPasswordPolicy} 
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, strongPasswordPolicy: checked})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
                    <Input 
                      id="passwordExpiry" 
                      value={securitySettings.passwordExpiryDays} 
                      onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiryDays: e.target.value})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input 
                      id="sessionTimeout" 
                      value={securitySettings.sessionTimeoutMinutes} 
                      onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeoutMinutes: e.target.value})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="loginAttempts">Max Failed Login Attempts</Label>
                    <Input 
                      id="loginAttempts" 
                      value={securitySettings.loginAttempts} 
                      onChange={(e) => setSecuritySettings({...securitySettings, loginAttempts: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleResetSettings('Security')}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button onClick={() => handleSaveSettings('Security')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure system email settings and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="notificationEmail">System Notification Email</Label>
                    <Input 
                      id="notificationEmail" 
                      value={emailSettings.notificationEmail} 
                      onChange={(e) => setEmailSettings({...emailSettings, notificationEmail: e.target.value})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="emailFromName">Email From Name</Label>
                    <Input 
                      id="emailFromName" 
                      value={emailSettings.emailFromName} 
                      onChange={(e) => setEmailSettings({...emailSettings, emailFromName: e.target.value})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input 
                      id="supportEmail" 
                      value={emailSettings.supportEmail} 
                      onChange={(e) => setEmailSettings({...emailSettings, supportEmail: e.target.value})}
                    />
                  </div>

                  <Separator />
                  <h3 className="text-lg font-medium">SMTP Settings</h3>

                  <div className="grid gap-2">
                    <Label htmlFor="smtpServer">SMTP Server</Label>
                    <Input 
                      id="smtpServer" 
                      value={emailSettings.smtpServer} 
                      onChange={(e) => setEmailSettings({...emailSettings, smtpServer: e.target.value})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input 
                      id="smtpPort" 
                      value={emailSettings.smtpPort} 
                      onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="smtpUsername">SMTP Username</Label>
                    <Input 
                      id="smtpUsername" 
                      value={emailSettings.smtpUsername} 
                      onChange={(e) => setEmailSettings({...emailSettings, smtpUsername: e.target.value})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input 
                      id="smtpPassword" 
                      type="password" 
                      value="••••••••••••" 
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleResetSettings('Email')}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button onClick={() => handleSaveSettings('Email')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Server className="h-5 w-5 mr-2" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Configure core system settings and performance options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Put the site in maintenance mode
                      </p>
                    </div>
                    <Switch 
                      checked={systemSettings.maintenanceMode} 
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, maintenanceMode: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Debug Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable detailed error logging
                      </p>
                    </div>
                    <Switch 
                      checked={systemSettings.debugMode} 
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, debugMode: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Analytics Tracking</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable system usage analytics
                      </p>
                    </div>
                    <Switch 
                      checked={systemSettings.analyticsTracking} 
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, analyticsTracking: checked})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="cacheDuration">Cache Duration (minutes)</Label>
                    <Input 
                      id="cacheDuration" 
                      value={systemSettings.cacheDuration} 
                      onChange={(e) => setSystemSettings({...systemSettings, cacheDuration: e.target.value})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
                    <Input 
                      id="maxUploadSize" 
                      value={systemSettings.maxUploadSize} 
                      onChange={(e) => setSystemSettings({...systemSettings, maxUploadSize: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => handleResetSettings('System')}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button onClick={() => handleSaveSettings('System')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Distribution Platform Settings
                </CardTitle>
                <CardDescription>
                  Configure music and video distribution platform integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Distribution Platform Selection</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure API credentials for 20+ streaming platforms through our unified distribution system
                  </p>
                </div>
                <Tabs defaultValue="spotify" className="space-y-4">
                  {/* Platform Distribution Information */}
                  <div className="bg-white border rounded-lg shadow-sm p-4 mb-6">
                    <div className="flex items-center mb-3">
                      <div className="h-8 w-8 bg-primary/10 flex items-center justify-center rounded-full mr-3">
                        <Globe className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Distribution Network</h3>
                        <p className="text-xs text-muted-foreground">Configure platform credentials for global music distribution</p>
                      </div>
                      <div className="ml-auto">
                        <span className="text-xs font-medium px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                          8 Platforms Active
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="col-span-1 flex flex-col items-center justify-center p-2 bg-teal-50 rounded-md border border-teal-100">
                        <span className="text-lg font-semibold text-teal-700">10</span>
                        <span className="text-xs text-teal-600">Global</span>
                      </div>
                      <div className="col-span-1 flex flex-col items-center justify-center p-2 bg-amber-50 rounded-md border border-amber-100">
                        <span className="text-lg font-semibold text-amber-700">5</span>
                        <span className="text-xs text-amber-600">Indian</span>
                      </div>
                      <div className="col-span-1 flex flex-col items-center justify-center p-2 bg-indigo-50 rounded-md border border-indigo-100">
                        <span className="text-lg font-semibold text-indigo-700">7</span>
                        <span className="text-xs text-indigo-600">Regional</span>
                      </div>
                      <div className="col-span-1 flex flex-col items-center justify-center p-2 bg-rose-50 rounded-md border border-rose-100">
                        <span className="text-lg font-semibold text-rose-700">3</span>
                        <span className="text-xs text-rose-600">Video</span>
                      </div>
                    </div>

                    <div className="flex items-center text-xs text-muted-foreground mb-1">
                      <div className="flex items-center gap-1.5 mr-4">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span>Enabled</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-gray-300"></div>
                        <span>Available</span>
                      </div>
                      <span className="ml-auto text-xs">Last updated: Today</span>
                    </div>
                  </div>

                  {/* Platform Selection Tabs */}
                  <div className="flex mb-4 overflow-x-auto pb-2 hide-scrollbar">
                    <div className="flex flex-col items-start mr-6">
                      <span className="text-xs font-medium text-muted-foreground mb-2 px-1">Categories</span>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-teal-50 border border-teal-200">
                          <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                          <span className="text-xs font-medium text-teal-700 whitespace-nowrap">Global</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200">
                          <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                          <span className="text-xs font-medium text-amber-700 whitespace-nowrap">Indian</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-200">
                          <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                          <span className="text-xs font-medium text-indigo-700 whitespace-nowrap">Regional</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-rose-50 border border-rose-200">
                          <div className="h-2 w-2 rounded-full bg-rose-500"></div>
                          <span className="text-xs font-medium text-rose-700 whitespace-nowrap">Video</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <TabsList className="h-auto bg-transparent flex flex-col space-y-1 overflow-visible">
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          <span className="text-xs font-medium text-muted-foreground px-1">Global Platforms</span>
                          <div className="flex flex-wrap gap-1">
                            <TabsTrigger value="spotify" className="px-2.5 py-1 text-xs bg-teal-500/10 h-auto rounded-md">Spotify</TabsTrigger>
                            <TabsTrigger value="apple" className="px-2.5 py-1 text-xs bg-teal-500/10 h-auto rounded-md">Apple</TabsTrigger>
                            <TabsTrigger value="youtube" className="px-2.5 py-1 text-xs bg-teal-500/10 h-auto rounded-md">YouTube</TabsTrigger>
                            <TabsTrigger value="amazon" className="px-2.5 py-1 text-xs bg-teal-500/10 h-auto rounded-md">Amazon</TabsTrigger>
                            <TabsTrigger value="deezer" className="px-2.5 py-1 text-xs bg-teal-500/10 h-auto rounded-md">Deezer</TabsTrigger>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-1">
                          <span className="text-xs font-medium text-muted-foreground px-1">Indian Platforms</span>
                          <div className="flex flex-wrap gap-1">
                            <TabsTrigger value="jio" className="px-2.5 py-1 text-xs bg-amber-500/10 h-auto rounded-md">JioSaavn</TabsTrigger>
                            <TabsTrigger value="gaana" className="px-2.5 py-1 text-xs bg-amber-500/10 h-auto rounded-md">Gaana</TabsTrigger>
                            <TabsTrigger value="wynk" className="px-2.5 py-1 text-xs bg-amber-500/10 h-auto rounded-md">Wynk</TabsTrigger>
                            <TabsTrigger value="hungama" className="px-2.5 py-1 text-xs bg-amber-500/10 h-auto rounded-md">Hungama</TabsTrigger>
                            <TabsTrigger value="resso" className="px-2.5 py-1 text-xs bg-amber-500/10 h-auto rounded-md">Resso</TabsTrigger>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs font-medium text-muted-foreground px-1">Video Platforms</span>
                          <div className="flex flex-wrap gap-1">
                            <TabsTrigger value="vevo" className="px-2.5 py-1 text-xs bg-rose-500/10 h-auto rounded-md">VEVO</TabsTrigger>
                            <TabsTrigger value="triller" className="px-2.5 py-1 text-xs bg-rose-500/10 h-auto rounded-md">Triller</TabsTrigger>
                            <TabsTrigger value="audiomack" className="px-2.5 py-1 text-xs bg-rose-500/10 h-auto rounded-md">Audiomack</TabsTrigger>
                          </div>
                        </div>
                      </TabsList>
                    </div>
                  </div>

                  {/* VEVO Integration */}
                  <TabsContent value="vevo" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>VEVO API Integration</Label>
                          <p className="text-sm text-muted-foreground">
                            {distributionSettings.vevo.description}
                          </p>
                        </div>
                        <Switch 
                          checked={distributionSettings.vevo.enabled} 
                          onCheckedChange={(checked) => setDistributionSettings({
                            ...distributionSettings, 
                            vevo: {...distributionSettings.vevo, enabled: checked}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="vevoApiKey">VEVO API Key</Label>
                        <Input 
                          id="vevoApiKey" 
                          type="password"
                          value={distributionSettings.vevo.apiKey} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            vevo: {...distributionSettings.vevo, apiKey: e.target.value}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="vevoPartnerId">VEVO Partner ID</Label>
                        <Input 
                          id="vevoPartnerId" 
                          value={distributionSettings.vevo.partnerId} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            vevo: {...distributionSettings.vevo, partnerId: e.target.value}
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Video Quality Check</Label>
                          <p className="text-sm text-muted-foreground">
                            Validate videos against VEVO requirements
                          </p>
                        </div>
                        <Switch 
                          checked={distributionSettings.vevo.videoQualityCheck} 
                          onCheckedChange={(checked) => setDistributionSettings({
                            ...distributionSettings, 
                            vevo: {...distributionSettings.vevo, videoQualityCheck: checked}
                          })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Auto-Distribute</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically distribute approved videos
                          </p>
                        </div>
                        <Switch 
                          checked={distributionSettings.vevo.autoDistribute} 
                          onCheckedChange={(checked) => setDistributionSettings({
                            ...distributionSettings, 
                            vevo: {...distributionSettings.vevo, autoDistribute: checked}
                          })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Spotify Integration */}
                  <TabsContent value="spotify" className="space-y-4">
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      {/* Header with status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-teal-50 rounded-full flex items-center justify-center mr-3">
                            <svg viewBox="0 0 24 24" className="h-5 w-5 text-teal-700" fill="currentColor">
                              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">Spotify Integration</h3>
                            <p className="text-xs text-muted-foreground">Premium music streaming platform</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${distributionSettings.spotify.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-xs">{distributionSettings.spotify.enabled ? 'Enabled' : 'Disabled'}</span>
                          <Switch 
                            checked={distributionSettings.spotify.enabled} 
                            onCheckedChange={(checked) => setDistributionSettings({
                              ...distributionSettings, 
                              spotify: {...distributionSettings.spotify, enabled: checked}
                            })}
                          />
                        </div>
                      </div>

                      {/* Platform info card */}
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-md mb-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-700" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-2">
                            <h4 className="text-sm font-medium text-teal-800 mb-1">Primary Distribution Platform</h4>
                            <p className="text-xs text-teal-700">
                              Spotify is our primary global distribution platform with extensive reach and premium user base.
                              We recommend enabling distribution for all releases.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quick stats */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-muted/30 p-2 rounded-md text-center">
                          <div className="text-lg font-semibold text-primary">456M</div>
                          <div className="text-xs text-muted-foreground">Monthly Users</div>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-md text-center">
                          <div className="text-lg font-semibold text-primary">183</div>
                          <div className="text-xs text-muted-foreground">Countries</div>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-md text-center">
                          <div className="text-lg font-semibold text-primary">$0.004</div>
                          <div className="text-xs text-muted-foreground">Per Stream</div>
                        </div>
                      </div>

                      {/* Form fields */}
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="spotifyClientId" className="text-xs font-medium">Client ID</Label>
                            <span className="text-xs text-muted-foreground">Required</span>
                          </div>
                          <Input 
                            id="spotifyClientId" 
                            type="password"
                            value={distributionSettings.spotify.clientId} 
                            onChange={(e) => setDistributionSettings({
                              ...distributionSettings, 
                              spotify: {...distributionSettings.spotify, clientId: e.target.value}
                            })}
                            className="h-8 text-sm"
                            placeholder="Enter Spotify client ID"
                          />
                        </div>

                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="spotifyClientSecret" className="text-xs font-medium">Client Secret</Label>
                            <span className="text-xs text-muted-foreground">Required</span>
                          </div>
                          <Input 
                            id="spotifyClientSecret" 
                            type="password"
                            value={distributionSettings.spotify.clientSecret} 
                            onChange={(e) => setDistributionSettings({
                              ...distributionSettings, 
                              spotify: {...distributionSettings.spotify, clientSecret: e.target.value}
                            })}
                            className="h-8 text-sm"
                            placeholder="Enter Spotify client secret"
                          />
                        </div>

                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="spotifyRedirectUri" className="text-xs font-medium">Redirect URI</Label>
                            <span className="text-xs text-muted-foreground">Required</span>
                          </div>
                          <Input 
                            id="spotifyRedirectUri" 
                            value={distributionSettings.spotify.redirectUri} 
                            onChange={(e) => setDistributionSettings({
                              ...distributionSettings, 
                              spotify: {...distributionSettings.spotify, redirectUri: e.target.value}
                            })}
                            className="h-8 text-sm"
                            placeholder="https://your-app.com/callback"
                          />
                          <p className="text-xs text-muted-foreground">
                            This URI must match exactly what you've registered in your Spotify Developer Dashboard.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button size="sm" variant="default" className="h-8 text-xs">
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                          Save Configuration
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* YouTube Music Integration */}
                  <TabsContent value="youtube" className="space-y-4">
                    <div className="bg-white border rounded-lg shadow-sm p-4">
                      {/* Header with status */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-rose-50 rounded-full flex items-center justify-center mr-3">
                            <svg viewBox="0 0 24 24" className="h-5 w-5 text-rose-700" fill="currentColor">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium">YouTube Music Integration</h3>
                            <p className="text-xs text-muted-foreground">Video & audio streaming platform</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${distributionSettings.youtubeMusic.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <span className="text-xs">{distributionSettings.youtubeMusic.enabled ? 'Enabled' : 'Disabled'}</span>
                          <Switch 
                            checked={distributionSettings.youtubeMusic.enabled} 
                            onCheckedChange={(checked) => setDistributionSettings({
                              ...distributionSettings, 
                              youtubeMusic: {...distributionSettings.youtubeMusic, enabled: checked}
                            })}
                          />
                        </div>
                      </div>

                      {/* Platform info card */}
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-md mb-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-700" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          </div>
                          <div className="ml-2">
                            <h4 className="text-sm font-medium text-rose-800 mb-1">Video & Audio Platform</h4>
                            <p className="text-xs text-rose-700">
                              YouTube Music offers both audio streaming and video content, making it ideal for artists with visual content.
                              It provides high visibility and monetization through Google's advertising network.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quick stats */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="bg-muted/30 p-2 rounded-md text-center">
                          <div className="text-lg font-semibold text-primary">2B+</div>
                          <div className="text-xs text-muted-foreground">Monthly Users</div>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-md text-center">
                          <div className="text-lg font-semibold text-primary">80M+</div>
                          <div className="text-xs text-muted-foreground">Premium Users</div>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-md text-center">
                          <div className="text-lg font-semibold text-primary">$0.002</div>
                          <div className="text-xs text-muted-foreground">Per View</div>
                        </div>
                      </div>

                      {/* Form fields */}
                      <div className="grid gap-4">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="youtubeApiKey" className="text-xs font-medium">API Key</Label>
                            <span className="text-xs text-muted-foreground">Required</span>
                          </div>
                          <Input 
                            id="youtubeApiKey" 
                            type="password"
                            value={distributionSettings.youtubeMusic.apiKey} 
                            onChange={(e) => setDistributionSettings({
                              ...distributionSettings, 
                              youtubeMusic: {...distributionSettings.youtubeMusic, apiKey: e.target.value}
                            })}
                            className="h-8 text-sm"
                            placeholder="Enter YouTube API key"
                          />
                        </div>

                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="youtubeChannelId" className="text-xs font-medium">Channel ID</Label>
                            <span className="text-xs text-muted-foreground">Required</span>
                          </div>
                          <Input 
                            id="youtubeChannelId" 
                            value={distributionSettings.youtubeMusic.channelId} 
                            onChange={(e) => setDistributionSettings({
                              ...distributionSettings, 
                              youtubeMusic: {...distributionSettings.youtubeMusic, channelId: e.target.value}
                            })}
                            className="h-8 text-sm"
                            placeholder="Enter YouTube channel ID"
                          />
                        </div>

                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="youtubeContentOwnerId" className="text-xs font-medium">Content Owner ID</Label>
                            <span className="text-xs text-muted-foreground">Required</span>
                          </div>
                          <Input 
                            id="youtubeContentOwnerId" 
                            value={distributionSettings.youtubeMusic.contentOwnerId} 
                            onChange={(e) => setDistributionSettings({
                              ...distributionSettings, 
                              youtubeMusic: {...distributionSettings.youtubeMusic, contentOwnerId: e.target.value}
                            })}
                            className="h-8 text-sm"
                            placeholder="Enter YouTube content owner ID"
                          />
                          <p className="text-xs text-muted-foreground">
                            Content Owner ID is required for content management and monetization on YouTube.
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button size="sm" variant="default" className="h-8 text-xs">
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                          Save Configuration
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Amazon Music Integration */}
                  <TabsContent value="amazon" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Amazon Music Integration</Label>
                          <p className="text-sm text-muted-foreground">
                            {distributionSettings.amazonMusic.description || "Enable Amazon Music distribution"}
                          </p>
                        </div>
                        <Switch 
                          checked={distributionSettings.amazonMusic.enabled} 
                          onCheckedChange={(checked) => setDistributionSettings({
                            ...distributionSettings, 
                            amazonMusic: {...distributionSettings.amazonMusic, enabled: checked}
                          })}
                        />
                      </div>

                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-md">
                        <h4 className="text-sm font-medium text-teal-800 mb-1 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Global Platform with Premium Audience
                        </h4>
                        <p className="text-xs text-teal-700">
                          Amazon Music provides access to over 90 million songs and is integrated with Amazon Prime and Echo devices.
                          This platform offers high royalty rates and integration with Amazon's broader ecosystem.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="amazonAccessKey">Access Key</Label>
                        <Input 
                          id="amazonAccessKey" 
                          type="password"
                          value={distributionSettings.amazonMusic.accessKey} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            amazonMusic: {...distributionSettings.amazonMusic, accessKey: e.target.value}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="amazonSecretKey">Secret Key</Label>
                        <Input 
                          id="amazonSecretKey" 
                          type="password"
                          value={distributionSettings.amazonMusic.secretKey} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            amazonMusic: {...distributionSettings.amazonMusic, secretKey: e.target.value}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="amazonRegion">Region</Label>
                        <Select
                          defaultValue={distributionSettings.amazonMusic.region}
                          onValueChange={(value) => setDistributionSettings({
                            ...distributionSettings, 
                            amazonMusic: {...distributionSettings.amazonMusic, region: value}
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                            <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                            <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                            <SelectItem value="ap-northeast-1">Asia Pacific (Tokyo)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Apple Music Integration */}
                  <TabsContent value="apple" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Apple Music Integration</Label>
                          <p className="text-sm text-muted-foreground">
                            {distributionSettings.appleMusic.description || "Configure Apple Music API credentials"}
                          </p>
                        </div>
                        <Switch 
                          checked={distributionSettings.appleMusic.enabled} 
                          onCheckedChange={(checked) => setDistributionSettings({
                            ...distributionSettings, 
                            appleMusic: {...distributionSettings.appleMusic, enabled: checked}
                          })}
                        />
                      </div>

                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-md">
                        <h4 className="text-sm font-medium text-teal-800 mb-1 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                          </svg>
                          High-Value Platform
                        </h4>
                        <p className="text-xs text-teal-700">
                          Apple Music is a premium streaming service with over 90 million active subscribers worldwide.
                          It offers higher royalty rates than most platforms and exclusive promotional opportunities through Apple's ecosystem.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="appleKeyId">Key ID</Label>
                        <Input 
                          id="appleKeyId" 
                          type="password"
                          value={distributionSettings.appleMusic.keyId} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            appleMusic: {...distributionSettings.appleMusic, keyId: e.target.value}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="appleTeamId">Team ID</Label>
                        <Input 
                          id="appleTeamId" 
                          value={distributionSettings.appleMusic.teamId} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            appleMusic: {...distributionSettings.appleMusic, teamId: e.target.value}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="appleKeyPath">Private Key Path</Label>
                        <Input 
                          id="appleKeyPath" 
                          value={distributionSettings.appleMusic.privateKeyPath} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            appleMusic: {...distributionSettings.appleMusic, privateKeyPath: e.target.value}
                          })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* JioSaavn Integration */}
                  <TabsContent value="jio" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>JioSaavn Integration</Label>
                          <p className="text-sm text-muted-foreground">
                            {distributionSettings.jioSaavn.description}
                          </p>
                        </div>
                        <Switch 
                          checked={distributionSettings.jioSaavn.enabled} 
                          onCheckedChange={(checked) => setDistributionSettings({
                            ...distributionSettings, 
                            jioSaavn: {...distributionSettings.jioSaavn, enabled: checked}
                          })}
                        />
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <h4 className="text-sm font-medium text-amber-800 mb-1 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                          Primary Indian Platform
                        </h4>
                        <p className="text-xs text-amber-700">
                          JioSaavn is one of India's largest music streaming platforms with over 100 million users.
                          It offers both free and premium tiers with strong focus on regional content across multiple Indian languages.
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="jioApiKey">API Key</Label>
                        <Input 
                          id="jioApiKey" 
                          type="password"
                          value={distributionSettings.jioSaavn.apiKey} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            jioSaavn: {...distributionSettings.jioSaavn, apiKey: e.target.value}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="jioPartnerId">Partner ID</Label>
                        <Input 
                          id="jioPartnerId" 
                          value={distributionSettings.jioSaavn.partnerId} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            jioSaavn: {...distributionSettings.jioSaavn, partnerId: e.target.value}
                          })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Deezer Integration */}
                  <TabsContent value="deezer" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Deezer Integration</Label>
                          <p className="text-sm text-muted-foreground">
                            Enable Deezer distribution
                          </p>
                        </div>
                        <Switch 
                          checked={distributionSettings.deezer.enabled} 
                          onCheckedChange={(checked) => setDistributionSettings({
                            ...distributionSettings, 
                            deezer: {...distributionSettings.deezer, enabled: checked}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="deezerAppId">App ID</Label>
                        <Input 
                          id="deezerAppId" 
                          value={distributionSettings.deezer.appId} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            deezer: {...distributionSettings.deezer, appId: e.target.value}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="deezerSecretKey">Secret Key</Label>
                        <Input 
                          id="deezerSecretKey" 
                          type="password"
                          value={distributionSettings.deezer.secretKey} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            deezer: {...distributionSettings.deezer, secretKey: e.target.value}
                          })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tidal Integration */}
                  <TabsContent value="tidal" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Tidal Integration</Label>
                          <p className="text-sm text-muted-foreground">
                            {distributionSettings.tidal.description}
                          </p>
                        </div>
                        <Switch 
                          checked={distributionSettings.tidal.enabled} 
                          onCheckedChange={(checked) => setDistributionSettings({
                            ...distributionSettings, 
                            tidal: {...distributionSettings.tidal, enabled: checked}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="tidalClientId">Client ID</Label>
                        <Input 
                          id="tidalClientId" 
                          value={distributionSettings.tidal.clientId} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            tidal: {...distributionSettings.tidal, clientId: e.target.value}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="tidalClientSecret">Client Secret</Label>
                        <Input 
                          id="tidalClientSecret" 
                          type="password"
                          value={distributionSettings.tidal.clientSecret} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            tidal: {...distributionSettings.tidal, clientSecret: e.target.value}
                          })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Hungama Integration */}
                  <TabsContent value="hungama" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Hungama Music Integration</Label>
                          <p className="text-sm text-muted-foreground">
                            {distributionSettings.hungama.description}
                          </p>
                        </div>
                        <Switch 
                          checked={distributionSettings.hungama.enabled} 
                          onCheckedChange={(checked) => setDistributionSettings({
                            ...distributionSettings, 
                            hungama: {...distributionSettings.hungama, enabled: checked}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="hungamaApiKey">API Key</Label>
                        <Input 
                          id="hungamaApiKey" 
                          type="password"
                          value={distributionSettings.hungama.apiKey} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            hungama: {...distributionSettings.hungama, apiKey: e.target.value}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="hungamaPartnerId">Partner ID</Label>
                        <Input 
                          id="hungamaPartnerId" 
                          value={distributionSettings.hungama.partnerId} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            hungama: {...distributionSettings.hungama, partnerId: e.target.value}
                          })}
                        />
                      </div>

                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <h4 className="text-sm font-medium text-amber-800 mb-1">Indian Market Focus</h4>
                        <p className="text-xs text-amber-700">
                          Hungama Music has extensive Bollywood, Tamil, Telugu, and other regional Indian music libraries.
                          Prioritize for artists targeting the Indian audience.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Resso Integration */}
                  <TabsContent value="resso" className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Resso Integration</Label>
                          <p className="text-sm text-muted-foreground">
                            {distributionSettings.resso.description}
                          </p>
                        </div>
                        <Switch 
                          checked={distributionSettings.resso.enabled} 
                          onCheckedChange={(checked) => setDistributionSettings({
                            ...distributionSettings, 
                            resso: {...distributionSettings.resso, enabled: checked}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="ressoClientId">Client ID</Label>
                        <Input 
                          id="ressoClientId" 
                          value={distributionSettings.resso.clientId} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            resso: {...distributionSettings.resso, clientId: e.target.value}
                          })}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="ressoClientSecret">Client Secret</Label>
                        <Input 
                          id="ressoClientSecret" 
                          type="password"
                          value={distributionSettings.resso.clientSecret} 
                          onChange={(e) => setDistributionSettings({
                            ...distributionSettings, 
                            resso: {...distributionSettings.resso, clientSecret: e.target.value}
                          })}
                        />
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <h4 className="text-sm font-medium text-blue-800 mb-1">Social Integration</h4>
                        <p className="text-xs text-blue-700">
                          Resso focuses on social music discovery and sharing, making it ideal for emerging artists
                          looking to build a following through ByteDance's ecosystem (including TikTok).
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button variant="outline" onClick={() => handleResetSettings('Distribution')}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                  <Button onClick={() => handleSaveSettings('Distribution')}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}