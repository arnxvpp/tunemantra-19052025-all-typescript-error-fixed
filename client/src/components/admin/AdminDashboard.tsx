
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RevenueImport } from "./RevenueImport";
import { IsrcImportTool } from "../upload/IsrcImportTool";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface Track {
  id: number;
  trackNumber?: string;
  trackTitle: string;
  primaryArtist: string;
  isrc?: string;
  isrcStatus?: "pending" | "assigned" | "error";
  title: string;
  artist: string;
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("revenue");
  
  // Fetch tracks for ISRC management
  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ["/api/admin/isrc-tracks"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/isrc-tracks");
      if (!response.ok) {
        throw new Error("Failed to fetch tracks");
      }
      return response.json();
    }
  });
  
  // Mutation for updating ISRCs
  const updateIsrcMutation = useMutation({
    mutationFn: async ({ trackId, isrc }: { trackId: number, isrc: string }) => {
      const response = await apiRequest("POST", "/api/admin/update-isrc", {
        updates: [{ trackId, isrc }]
      });
      
      if (!response.ok) {
        throw new Error("Failed to update ISRC");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/isrc-tracks"] });
    }
  });
  
  // Handler for assigning ISRCs
  const handleAssignIsrc = async (trackId: number, isrc: string) => {
    await updateIsrcMutation.mutateAsync({ trackId, isrc });
  };
  
  // Handler for bulk assigning ISRCs
  const handleBulkAssignIsrc = async (assignments: { trackId: number; isrc: string }[]) => {
    const response = await apiRequest("POST", "/api/admin/update-isrc", {
      updates: assignments
    });
    
    if (!response.ok) {
      throw new Error("Failed to update ISRCs");
    }
    
    queryClient.invalidateQueries({ queryKey: ["/api/admin/isrc-tracks"] });
    return response.json();
  };
  
  // Format tracks for the ISRC tool
  const formattedTracks = tracks?.map(track => ({
    id: track.id,
    trackNumber: track.trackNumber || String(track.id),
    trackTitle: track.title,
    primaryArtist: track.artist,
    isrc: track.isrc,
    isrcStatus: track.isrcStatus as "pending" | "assigned" | "error"
  })) || [];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage imports, analytics, and system settings
          </p>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revenue">Revenue Import</TabsTrigger>
          <TabsTrigger value="isrc">ISRC Management</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revenue" className="space-y-4">
          <RevenueImport />
        </TabsContent>
        
        <TabsContent value="isrc" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ISRC Management</CardTitle>
              <CardDescription>
                Assign and manage International Standard Recording Codes (ISRCs) for your tracks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <IsrcImportTool 
                  tracks={formattedTracks} 
                  onAssignIsrc={handleAssignIsrc}
                  onBulkAssignIsrc={handleBulkAssignIsrc}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure platform-wide settings and defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Default Payment Settings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Minimum withdrawal amount:</span>
                        <span className="text-sm font-medium">€50.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Payment processing fee:</span>
                        <span className="text-sm font-medium">€5.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Payment schedule:</span>
                        <span className="text-sm font-medium">Monthly</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4">
                      Edit Payment Settings
                    </Button>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h3 className="font-medium mb-2">Distribution Settings</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Default territory:</span>
                        <span className="text-sm font-medium">Worldwide</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Pre-save enabled:</span>
                        <span className="text-sm font-medium">Yes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Auto-distribution:</span>
                        <span className="text-sm font-medium">No</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4">
                      Edit Distribution Settings
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Platform Integrations</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Spotify API</h4>
                        <p className="text-xs text-muted-foreground">Connected</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">Apple Music API</h4>
                        <p className="text-xs text-muted-foreground">Connected</p>
                      </div>
                      <Button variant="outline" size="sm">Configure</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">YouTube Content ID</h4>
                        <p className="text-xs text-muted-foreground">Not connected</p>
                      </div>
                      <Button variant="outline" size="sm">Connect</Button>
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
