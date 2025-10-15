import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, FileText, Upload, RefreshCw } from "lucide-react";
import { ftpService } from "@/services/ftp-service";
import { exportMetadata, ExportFormat } from "@/lib/metadata-export";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Release type for demo purposes
interface Release {
  id: number;
  title: string;
  artist: string;
  upc: string;
  status: string;
  createdAt: string;
}

// Track type for demo purposes
interface Track {
  id: number;
  trackNumber: string;
  title: string;
  version: string;
  primaryArtist: string;
  isrc: string;
}

// Export job status
interface ExportJob {
  id: string;
  distributorId: string;
  distributorName: string;
  status: "pending" | "uploading" | "completed" | "failed";
  progress: number;
  message?: string;
  timestamp?: Date;
}

export default function BulkDistributionExportPage() {
  const { toast } = useToast();
  const [selectedReleases, setSelectedReleases] = useState<number[]>([]);
  const [selectedDistributors, setSelectedDistributors] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  
  // Fetch releases (in a real app, this would come from the API)
  const { data: releases = [], isLoading: isLoadingReleases } = useQuery({
    queryKey: ["/api/releases"],
    queryFn: () => {
      // Mock data for demo purposes
      const mockReleases: Release[] = [
        { id: 1, title: "Summer Vibes EP", artist: "DJ Sunshine", upc: "123456789012", status: "Ready", createdAt: "2024-02-15" },
        { id: 2, title: "Midnight Grooves", artist: "Luna Beats", upc: "234567890123", status: "Ready", createdAt: "2024-02-18" },
        { id: 3, title: "Rainy Days", artist: "Mellow Mood", upc: "345678901234", status: "Ready", createdAt: "2024-02-21" },
        { id: 4, title: "Urban Echoes", artist: "City Soundscape", upc: "456789012345", status: "Ready", createdAt: "2024-02-23" },
        { id: 5, title: "Mountain High", artist: "Nature Tones", upc: "567890123456", status: "Ready", createdAt: "2024-02-25" },
      ];
      return mockReleases;
    }
  });
  
  // Get distributors from FTP service
  const distributors = ftpService.getDistributors();
  
  // Toggle release selection
  const toggleReleaseSelection = (releaseId: number) => {
    setSelectedReleases(prev => 
      prev.includes(releaseId) 
        ? prev.filter(id => id !== releaseId)
        : [...prev, releaseId]
    );
  };
  
  // Toggle all releases selection
  const toggleAllReleases = () => {
    if (selectedReleases.length === releases.length) {
      setSelectedReleases([]);
    } else {
      setSelectedReleases(releases.map(release => release.id));
    }
  };
  
  // Toggle distributor selection
  const toggleDistributorSelection = (distributorId: string) => {
    setSelectedDistributors(prev => 
      prev.includes(distributorId)
        ? prev.filter(id => id !== distributorId)
        : [...prev, distributorId]
    );
  };
  
  // Select all distributors
  const selectAllDistributors = () => {
    if (selectedDistributors.length === distributors.length) {
      setSelectedDistributors([]);
    } else {
      setSelectedDistributors(distributors.map(d => d.id));
    }
  };
  
  // Handle export format change
  const handleFormatChange = (format: ExportFormat) => {
    setExportFormat(format);
  };
  
  // Start export process
  const startExport = async () => {
    if (selectedReleases.length === 0) {
      toast({
        title: "No releases selected",
        description: "Please select at least one release to export",
        variant: "destructive"
      });
      return;
    }
    
    if (selectedDistributors.length === 0) {
      toast({
        title: "No distributors selected",
        description: "Please select at least one distributor for export",
        variant: "destructive"
      });
      return;
    }
    
    setIsExporting(true);
    
    // Initialize export jobs
    const initialJobs: ExportJob[] = selectedDistributors.map(distributorId => {
      const distributor = ftpService.getDistributor(distributorId);
      return {
        id: `${distributorId}-${Date.now()}`,
        distributorId,
        distributorName: distributor?.name || distributorId,
        status: "pending",
        progress: 0
      };
    });
    
    setExportJobs(initialJobs);
    
    try {
      // In a real app, we would fetch the complete metadata for each release
      // For demo purposes, we'll create mock data
      const mockMetadata = {
        releaseTitle: "Sample Release",
        primaryArtist: "Sample Artist",
        label: "Sample Label",
        releaseType: "Album",
        productionYear: "2024",
        pLine: "℗ 2024 Sample Label",
        cLine: "© 2024 Sample Label",
        genre: "Pop",
        territories: "Worldwide",
        digitalReleaseDate: new Date(),
        originalReleaseDate: new Date("2024-01-01")
      };
      
      const mockTracks = [
        {
          trackNumber: "1",
          trackTitle: "Sample Track 1",
          primaryArtist: "Sample Artist",
          duration: "3:45",
          explicitLyrics: false,
          instrumentalOnly: false,
          availableSeparately: true,
          preOrderOnly: false,
          streamingOnly: false
        },
        {
          trackNumber: "2",
          trackTitle: "Sample Track 2",
          primaryArtist: "Sample Artist",
          duration: "4:12",
          explicitLyrics: false,
          instrumentalOnly: false,
          availableSeparately: true,
          preOrderOnly: false,
          streamingOnly: false
        }
      ];
      
      // Create mock release data for export
      const releaseData = {
        metadata: {
          ...mockMetadata,
          releaseType: "Album" as "Album" | "Single" | "EP" | "Compilation",
          parentalAdvisory: false,
          clearanceConfirmation: true,
          licensingConfirmation: true,
          agreementConfirmation: true
        },
        tracks: mockTracks
      };
      
      // Export to selected format
      // In a real app, this would generate actual metadata files
      const blob = new Blob(["Mocked metadata export content"], { type: "text/plain" });
      
      // Process each distributor
      for (const distributorId of selectedDistributors) {
        // Update job status to uploading
        setExportJobs(prev => prev.map(job => 
          job.distributorId === distributorId 
            ? { ...job, status: "uploading" }
            : job
        ));
        
        // Get distributor info
        const distributor = ftpService.getDistributor(distributorId);
        
        if (!distributor) {
          setExportJobs(prev => prev.map(job => 
            job.distributorId === distributorId 
              ? { ...job, status: "failed", message: "Distributor not found" }
              : job
          ));
          continue;
        }
        
        try {
          // Simulate FTP upload with progress tracking
          const result = await ftpService.uploadToDistributor(
            distributorId,
            blob,
            `release_${selectedReleases[0]}_${exportFormat}.${exportFormat}`,
            (progress) => {
              // Update progress in the job
              setExportJobs(prev => prev.map(job => 
                job.distributorId === distributorId 
                  ? { ...job, progress }
                  : job
              ));
            }
          );
          
          // Update job status based on result
          setExportJobs(prev => prev.map(job => 
            job.distributorId === distributorId 
              ? { 
                  ...job, 
                  status: result.success ? "completed" : "failed",
                  progress: result.success ? 100 : job.progress,
                  message: result.message,
                  timestamp: result.timestamp
                }
              : job
          ));
        } catch (error) {
          // Handle upload error
          setExportJobs(prev => prev.map(job => 
            job.distributorId === distributorId 
              ? { 
                  ...job, 
                  status: "failed", 
                  message: error instanceof Error ? error.message : "Unknown error occurred"
                }
              : job
          ));
        }
      }
      
      // Show success toast when all uploads are done
      toast({
        title: "Exports completed",
        description: `Exported metadata for ${selectedReleases.length} release(s) to ${selectedDistributors.length} distributor(s)`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Download a local export file
  const downloadLocalExport = () => {
    if (selectedReleases.length === 0) {
      toast({
        title: "No releases selected",
        description: "Please select at least one release to export",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, we would fetch the complete metadata for each release
    // For demo purposes, we'll create mock data
    const mockMetadata = {
      releaseTitle: "Sample Release",
      primaryArtist: "Sample Artist",
      label: "Sample Label",
      releaseType: "Album",
      productionYear: "2024",
      pLine: "℗ 2024 Sample Label",
      cLine: "© 2024 Sample Label",
      genre: "Pop",
      territories: "Worldwide",
      digitalReleaseDate: new Date(),
      originalReleaseDate: new Date("2024-01-01")
    };
    
    const mockTracks = [
      {
        trackNumber: "1",
        trackTitle: "Sample Track 1",
        primaryArtist: "Sample Artist",
        duration: "3:45",
        explicitLyrics: false,
        instrumentalOnly: false,
        availableSeparately: true,
        preOrderOnly: false,
        streamingOnly: false
      },
      {
        trackNumber: "2",
        trackTitle: "Sample Track 2",
        primaryArtist: "Sample Artist",
        duration: "4:12",
        explicitLyrics: false,
        instrumentalOnly: false,
        availableSeparately: true,
        preOrderOnly: false,
        streamingOnly: false
      }
    ];
    
    // Create mock release data for export
    const releaseData = {
      metadata: {
        ...mockMetadata,
        releaseType: "Album" as "Album" | "Single" | "EP" | "Compilation",
        parentalAdvisory: false,
        clearanceConfirmation: true,
        licensingConfirmation: true,
        agreementConfirmation: true
      },
      tracks: mockTracks
    };
    
    try {
      // Use the exportMetadata function to generate and download the file
      exportMetadata(releaseData, exportFormat);
      
      toast({
        title: "Export downloaded",
        description: `Metadata export file has been downloaded in ${exportFormat.toUpperCase()} format`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Bulk Distribution Export</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Releases</CardTitle>
            <CardDescription>
              Choose the releases you want to export metadata for
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingReleases ? (
              <div className="flex items-center justify-center p-4">
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading releases...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="select-all-releases" 
                    checked={selectedReleases.length === releases.length && releases.length > 0}
                    onCheckedChange={toggleAllReleases}
                  />
                  <Label htmlFor="select-all-releases">Select All</Label>
                </div>
                
                <div className="border rounded-md">
                  {releases.map(release => (
                    <div 
                      key={release.id} 
                      className="flex items-center justify-between p-3 border-b last:border-0"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`release-${release.id}`}
                          checked={selectedReleases.includes(release.id)}
                          onCheckedChange={() => toggleReleaseSelection(release.id)}
                        />
                        <div>
                          <p className="font-medium">{release.title}</p>
                          <p className="text-sm text-muted-foreground">{release.artist}</p>
                        </div>
                      </div>
                      <Badge variant="outline">UPC: {release.upc}</Badge>
                    </div>
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedReleases.length} of {releases.length} releases selected
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
            <CardDescription>
              Configure your export settings and destination platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label className="mb-2 block">Export Format</Label>
                <Tabs defaultValue="csv" className="w-full" onValueChange={(value) => handleFormatChange(value as ExportFormat)}>
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="csv">CSV</TabsTrigger>
                    <TabsTrigger value="json">JSON</TabsTrigger>
                    <TabsTrigger value="xml">XML</TabsTrigger>
                    <TabsTrigger value="ddex">DDEX</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Distribution Platforms</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={selectAllDistributors}
                  >
                    {selectedDistributors.length === distributors.length 
                      ? "Deselect All" 
                      : "Select All"}
                  </Button>
                </div>
                
                <div className="border rounded-md space-y-0">
                  {distributors.map(distributor => (
                    <div 
                      key={distributor.id} 
                      className="flex items-center justify-between p-3 border-b last:border-0"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id={`distributor-${distributor.id}`}
                          checked={selectedDistributors.includes(distributor.id)}
                          onCheckedChange={() => toggleDistributorSelection(distributor.id)}
                        />
                        <Label htmlFor={`distributor-${distributor.id}`}>{distributor.name}</Label>
                      </div>
                      <Badge variant="outline">{distributor.metadataFormat.toUpperCase()}</Badge>
                    </div>
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedDistributors.length} of {distributors.length} platforms selected
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={downloadLocalExport}
              disabled={selectedReleases.length === 0 || isExporting}
            >
              <FileText className="mr-2 h-4 w-4" />
              Download {exportFormat.toUpperCase()}
            </Button>
            <Button 
              onClick={startExport}
              disabled={
                selectedReleases.length === 0 || 
                selectedDistributors.length === 0 || 
                isExporting
              }
            >
              <Upload className="mr-2 h-4 w-4" />
              Start Export
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {exportJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Export Status</CardTitle>
            <CardDescription>
              Track the status of your metadata exports to each platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exportJobs.map(job => (
                <div key={job.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {job.status === "pending" && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                      {job.status === "uploading" && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                      {job.status === "completed" && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                      {job.status === "failed" && <AlertCircle className="mr-2 h-4 w-4 text-red-500" />}
                      <span>{job.distributorName}</span>
                    </div>
                    <Badge
                      variant={
                        job.status === "completed" 
                          ? "success" 
                          : job.status === "failed" 
                            ? "destructive" 
                            : "secondary"
                      }
                    >
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <Progress value={job.progress} className="h-2" />
                  
                  {job.message && (
                    <p className="text-sm text-muted-foreground">
                      {job.message}
                    </p>
                  )}
                  
                  {job.timestamp && (
                    <p className="text-xs text-muted-foreground">
                      {job.timestamp.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}