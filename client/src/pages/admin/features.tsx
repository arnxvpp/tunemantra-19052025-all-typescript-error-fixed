
import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Check, Info, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock feature configuration
const initialFeatures = {
  global: [
    { 
      id: "auto_distribution", 
      name: "Automatic Distribution", 
      description: "Automatically distribute new releases to platforms without manual approval", 
      enabled: true,
      restricted: false
    },
    { 
      id: "analytics_dashboard", 
      name: "Analytics Dashboard", 
      description: "Enable real-time streaming and revenue analytics for all users", 
      enabled: true,
      restricted: false
    },
    { 
      id: "royalty_splitting", 
      name: "Royalty Splitting", 
      description: "Allow users to configure automatic royalty splitting between collaborators", 
      enabled: true,
      restricted: false
    },
    { 
      id: "bulk_upload", 
      name: "Bulk Upload Tool", 
      description: "Enable the bulk upload tool for releases with multiple tracks", 
      enabled: true,
      restricted: false
    },
  ],
  premium: [
    { 
      id: "advanced_analytics", 
      name: "Advanced Analytics", 
      description: "Audience demographics and advanced performance metrics", 
      enabled: true,
      restricted: true
    },
    { 
      id: "priority_distribution", 
      name: "Priority Distribution", 
      description: "Expedited distribution to platforms for premium users", 
      enabled: true,
      restricted: true
    },
    { 
      id: "custom_release_date", 
      name: "Custom Release Date", 
      description: "Schedule releases for specific future dates", 
      enabled: true,
      restricted: true
    },
  ],
  beta: [
    { 
      id: "ai_mastering", 
      name: "AI Audio Mastering", 
      description: "Automatic audio mastering using machine learning algorithms", 
      enabled: false,
      restricted: true
    },
    { 
      id: "direct_to_social", 
      name: "Direct to Social", 
      description: "Automatically publish releases to social media platforms", 
      enabled: false,
      restricted: true
    },
  ]
};

export default function AdminFeaturesPage() {
  const { toast } = useToast();
  const [features, setFeatures] = useState(initialFeatures);
  const [saving, setSaving] = useState(false);

  const toggleFeature = (category: keyof typeof features, id: string) => {
    setFeatures(prev => {
      const updatedCategory = prev[category].map(feature => 
        feature.id === id ? { ...feature, enabled: !feature.enabled } : feature
      );
      
      return {
        ...prev,
        [category]: updatedCategory
      };
    });
  };

  const toggleRestriction = (category: keyof typeof features, id: string) => {
    setFeatures(prev => {
      const updatedCategory = prev[category].map(feature => 
        feature.id === id ? { ...feature, restricted: !feature.restricted } : feature
      );
      
      return {
        ...prev,
        [category]: updatedCategory
      };
    });
  };

  const handleSave = () => {
    setSaving(true);
    
    // Simulate API call to save feature configuration
    setTimeout(() => {
      setSaving(false);
      toast({
        title: "Features Updated",
        description: "All feature changes have been saved successfully",
        variant: "default"
      });
    }, 1000);
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Feature Management</h2>
            <p className="text-muted-foreground">
              Control platform features and configure access levels
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 p-4 rounded-md">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-300">Important Note</h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Disabling a feature will immediately remove access for all users across the platform. 
                Active sessions may require a refresh to see these changes.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="global" className="space-y-4">
          <TabsList>
            <TabsTrigger value="global">Global Features</TabsTrigger>
            <TabsTrigger value="premium">Premium Features</TabsTrigger>
            <TabsTrigger value="beta">Beta Features</TabsTrigger>
          </TabsList>
          
          <TabsContent value="global" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {features.global.map(feature => (
                <FeatureCard 
                  key={feature.id}
                  feature={feature}
                  onToggle={() => toggleFeature('global', feature.id)}
                  onToggleRestriction={() => toggleRestriction('global', feature.id)}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="premium" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {features.premium.map(feature => (
                <FeatureCard 
                  key={feature.id}
                  feature={feature}
                  onToggle={() => toggleFeature('premium', feature.id)}
                  onToggleRestriction={() => toggleRestriction('premium', feature.id)}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="beta" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {features.beta.map(feature => (
                <FeatureCard 
                  key={feature.id}
                  feature={feature}
                  onToggle={() => toggleFeature('beta', feature.id)}
                  onToggleRestriction={() => toggleRestriction('beta', feature.id)}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
}

interface FeatureCardProps {
  feature: {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    restricted: boolean;
  };
  onToggle: () => void;
  onToggleRestriction: () => void;
}

function FeatureCard({ feature, onToggle, onToggleRestriction }: FeatureCardProps) {
  return (
    <Card className={feature.enabled ? "border-green-200 dark:border-green-800" : "border-gray-200 dark:border-gray-800"}>
      <CardHeader className="pb-2">
        <CardTitle className="flex justify-between">
          <span>{feature.name}</span>
          <Switch 
            checked={feature.enabled} 
            onCheckedChange={onToggle}
            className={feature.enabled ? "data-[state=checked]:bg-green-500" : ""}
          />
        </CardTitle>
        <CardDescription>{feature.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Feature ID: {feature.id}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor={`restrict-${feature.id}`} className="text-sm">
            Restrict to premium users
          </Label>
          <Switch 
            id={`restrict-${feature.id}`}
            checked={feature.restricted} 
            onCheckedChange={onToggleRestriction}
          />
        </div>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Configure
        </Button>
      </CardFooter>
    </Card>
  );
}
