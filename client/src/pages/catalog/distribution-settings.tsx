import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/main-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import type { DistributionPlatform } from "@shared/schema";
import { platformRequirements, type PlatformName } from "@/lib/platform-configs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DistributionSettingsPage() {
  // Provide default empty array for platforms
  const { data: platforms = [], isLoading } = useQuery<DistributionPlatform[]>({
    queryKey: ["distribution-platforms"],
    queryFn: async () => {
      const response = await fetch('/api/distribution-platforms');
      if (!response.ok) {
        throw new Error('Failed to fetch distribution platforms');
      }
      return response.json();
    }
  });

  const [selectedPriority, setSelectedPriority] = useState("standard");
  const [selectedFormats, setSelectedFormats] = useState<Record<string, string[]>>({});
  const hasPlatformsAvailable = platforms?.length > 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Distribution Settings</h1>
          <p className="text-muted-foreground">
            Configure your distribution preferences and platform settings
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General Settings</TabsTrigger>
            <TabsTrigger value="platforms">Platform Configuration</TabsTrigger>
            <TabsTrigger value="quality">Quality Requirements</TabsTrigger>
            <TabsTrigger value="metadata">Metadata Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribution Priority</CardTitle>
                <CardDescription>Set your default distribution speed and processing preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup defaultValue="standard" onValueChange={setSelectedPriority}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="standard" id="standard" />
                    <Label htmlFor="standard">Standard (2-5 business days)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="priority" id="priority" />
                    <Label htmlFor="priority">Priority (24-48 hours)</Label>
                  </div>
                </RadioGroup>

                <div className="flex items-center space-x-2 pt-4">
                  <Switch id="auto-distribution" />
                  <Label htmlFor="auto-distribution">Enable automatic distribution</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Release Management</CardTitle>
                <CardDescription>Configure how releases are processed and managed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch id="auto-takedown" />
                  <Label htmlFor="auto-takedown">Enable automatic takedown requests</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="notify-takedown" />
                  <Label htmlFor="notify-takedown">Notify me before processing takedown requests</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="batch-releases" />
                  <Label htmlFor="batch-releases">Enable batch release processing</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="platforms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Configuration</CardTitle>
                <CardDescription>
                  Select which platforms you want to distribute your music to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!hasPlatformsAvailable && !isLoading && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No platforms available</AlertTitle>
                    <AlertDescription>
                      No distribution platforms are currently available. Please contact your administrator
                      to configure platform integrations.
                    </AlertDescription>
                  </Alert>
                )}
                <ScrollArea className="h-[600px] pr-4">
                  {Object.entries(platformRequirements).map(([platform, config]) => (
                    <Card key={platform} className="mb-4">
                      <CardHeader>
                        <CardTitle>{config.name}</CardTitle>
                        <CardDescription>Configure distribution settings for {config.name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-2">
                            <Switch id={`enable-${platform}`} />
                            <Label htmlFor={`enable-${platform}`}>Enable distribution</Label>
                          </div>

                          <div className="space-y-2">
                            <Label>Default Audio Format</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select format" />
                              </SelectTrigger>
                              <SelectContent>
                                {config.audioFormats.map(format => (
                                  <SelectItem key={format} value={format}>
                                    {format}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Territory Availability</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select territories" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="worldwide">Worldwide</SelectItem>
                                <SelectItem value="custom">Custom Selection</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>API Configuration</Label>
                            <Input 
                              type="password" 
                              placeholder={`${config.name} API Key`}
                              className="max-w-md"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Custom Fields</Label>
                            {config.metadataFields.map(field => (
                              <div key={field.name} className="flex items-center space-x-2">
                                <Checkbox id={`${platform}-${field.name}`} />
                                <label htmlFor={`${platform}-${field.name}`}>
                                  {field.name} {field.required && <span className="text-red-500">*</span>}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audio Quality Requirements</CardTitle>
                <CardDescription>Configure minimum quality standards for each platform</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.entries(platformRequirements).map(([platform, config]) => (
                  <div key={platform} className="mb-6 space-y-4">
                    <h3 className="font-medium text-lg">{config.name}</h3>
                    <div className="ml-6 space-y-2">
                      {config.audioFormats.map(format => (
                        <div key={format} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`${platform}-${format}`}
                            onCheckedChange={(checked) => {
                              setSelectedFormats(prev => ({
                                ...prev,
                                [platform]: checked 
                                  ? [...(prev[platform] || []), format]
                                  : (prev[platform] || []).filter(f => f !== format)
                              }));
                            }}
                          />
                          <label htmlFor={`${platform}-${format}`}>{format}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Metadata Templates</CardTitle>
                <CardDescription>Configure default metadata templates for each platform</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.entries(platformRequirements).map(([platform, config]) => (
                  <div key={platform} className="mb-6 space-y-4">
                    <h3 className="font-medium text-lg">{config.name}</h3>
                    <div className="ml-6 space-y-4">
                      {config.metadataFields.map(field => (
                        <div key={field.name} className="space-y-2">
                          <Label>
                            {field.name} {field.required && <span className="text-red-500">*</span>}
                          </Label>
                          <Input 
                            placeholder={`Default ${field.name}`}
                            className="max-w-md"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}