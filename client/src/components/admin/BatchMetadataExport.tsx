import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { exportMetadata, type ExportFormat } from "@/lib/metadata-export";
import { DateRangePicker } from "@/components/analytics/date-range-picker";
import { DateRange } from "react-day-picker";
import { Spinner } from "@/components/ui/spinner";
import { Progress } from "@/components/ui/progress";
import { FilePlus, Download, FileText, FileJson, FileDigit, TableProperties } from "lucide-react";

interface Release {
  id: number;
  title: string;
  artist: string;
  upc: string;
  status: string;
  createdAt: string;
}

interface Track {
  id: number;
  trackNumber: string;
  title: string;
  version: string;
  primaryArtist: string;
  isrc: string;
}

interface ExportJob {
  id: string;
  distributorId: string;
  distributorName: string;
  status: "pending" | "uploading" | "completed" | "failed";
  progress: number;
  message?: string;
  timestamp?: Date;
}

interface Distributor {
  id: string;
  name: string;
  logo?: string;
  enabled: boolean;
  supportsDirectDelivery: boolean;
  supportsBulkDelivery: boolean;
  apiIntegration: boolean;
  ftpIntegration: boolean;
  metadataFormats: ExportFormat[];
}

export function BatchMetadataExport() {
  const [selectedReleases, setSelectedReleases] = useState<number[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("excel");
  const [selectedDistributor, setSelectedDistributor] = useState<string | null>(null);
  const [useTemplate, setUseTemplate] = useState<boolean>(true);
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    undefined
  );
  
  // Create mock data for demo purposes since we don't have authentication
  const [releases, setReleases] = useState<Release[]>([
    { id: 1, title: "Summer Vibes EP", artist: "DJ Sunshine", upc: "123456789012", status: "active", createdAt: "2025-01-15" },
    { id: 2, title: "Midnight Dreams", artist: "Luna Moon", upc: "223456789012", status: "pending", createdAt: "2025-02-01" },
    { id: 3, title: "Urban Echoes", artist: "City Soundz", upc: "323456789012", status: "active", createdAt: "2025-01-20" },
    { id: 4, title: "Acoustic Sessions", artist: "Emma Wood", upc: "423456789012", status: "active", createdAt: "2025-02-10" },
    { id: 5, title: "Digital Freedom", artist: "Tech Collective", upc: "523456789012", status: "pending", createdAt: "2025-02-15" }
  ]);
  
  const [distributors, setDistributors] = useState<Distributor[]>([
    { id: "spotify", name: "Spotify", enabled: true, supportsDirectDelivery: true, supportsBulkDelivery: true, apiIntegration: true, ftpIntegration: false, metadataFormats: ["excel", "csv"] },
    { id: "apple", name: "Apple Music", enabled: true, supportsDirectDelivery: true, supportsBulkDelivery: true, apiIntegration: true, ftpIntegration: true, metadataFormats: ["excel", "csv", "json"] },
    { id: "amazon", name: "Amazon Music", enabled: true, supportsDirectDelivery: false, supportsBulkDelivery: true, apiIntegration: false, ftpIntegration: true, metadataFormats: ["excel", "ddex"] },
    { id: "deezer", name: "Deezer", enabled: true, supportsDirectDelivery: true, supportsBulkDelivery: true, apiIntegration: true, ftpIntegration: false, metadataFormats: ["excel", "csv"] }
  ]);
  
  const releasesLoading = false;
  const distributorsLoading = false;
  
  // In real implementation, we would use these queries:
  /*
  const { data: releases = [], isLoading: releasesLoading } = useQuery<Release[]>({
    queryKey: ['/api/admin/releases'],
    retry: false,
  });
  
  const { data: distributors = [], isLoading: distributorsLoading } = useQuery<Distributor[]>({
    queryKey: ['/api/distribution-platforms'],
    retry: false,
  });
  */
  
  const handleSelectRelease = (id: number) => {
    setSelectedReleases(prev => 
      prev.includes(id) 
        ? prev.filter(releaseId => releaseId !== id)
        : [...prev, id]
    );
  };
  
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && releases) {
      setSelectedReleases(releases.map((release: Release) => release.id));
    } else {
      setSelectedReleases([]);
    }
  };
  
  const handleExport = async () => {
    if (selectedReleases.length === 0) {
      toast({
        title: "No releases selected",
        description: "Please select at least one release to export.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // In a real implementation, we would fetch the complete release data for each selected release
      // For now, we'll simulate the process and show a success toast
      
      // Simulate job creation
      const newJobId = `job-${Date.now()}`;
      const newJob: ExportJob = {
        id: newJobId,
        distributorId: selectedDistributor || 'none',
        distributorName: selectedDistributor 
          ? distributors?.find((d: Distributor) => d.id === selectedDistributor)?.name || 'Unknown'
          : 'Generic Export',
        status: "pending",
        progress: 0
      };
      
      setExportJobs(prev => [newJob, ...prev]);
      
      // Simulate job progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setExportJobs(prev => 
          prev.map(job => 
            job.id === newJobId 
              ? { ...job, progress, status: progress < 100 ? "uploading" : "completed" }
              : job
          )
        );
        
        if (progress >= 100) {
          clearInterval(progressInterval);
          
          // Notify completion
          toast({
            title: "Export Completed",
            description: `Successfully exported ${selectedReleases.length} releases to ${exportFormat.toUpperCase()} format.`,
          });
          
          // For demo purposes, trigger a direct download of a sample file
          if (selectedReleases.length === 1 && releases) {
            const release = releases.find((r: Release) => r.id === selectedReleases[0]);
            if (release) {
              // Here we would normally fetch the complete release with tracks
              // For demo, we'll create a basic structure
              // Create a well-typed demo release conforming to the CompleteRelease interface
              const demoRelease = {
                metadata: {
                  releaseTitle: release.title,
                  releaseType: "Album" as "Album" | "Single" | "EP" | "Compilation" | "Remix",
                  primaryArtist: release.artist,
                  label: "Demo Label",
                  productionYear: "2024",
                  pLine: "© 2024 Demo Label",
                  cLine: "℗ 2024 Demo Label",
                  genre: "Electronic",
                  originalReleaseDate: new Date(),
                  digitalReleaseDate: new Date(),
                  parentalAdvisory: false,
                  clearanceConfirmation: true,
                  licensingConfirmation: true,
                  agreementConfirmation: true,
                  upc: release.upc
                },
                tracks: [
                  {
                    trackNumber: "1",
                    trackTitle: "Demo Track 1",
                    primaryArtist: release.artist,
                    isrc: "USXXX2400001",
                    duration: "3:45",
                    explicitLyrics: false
                  },
                  {
                    trackNumber: "2",
                    trackTitle: "Demo Track 2",
                    primaryArtist: release.artist,
                    isrc: "USXXX2400002",
                    duration: "4:12",
                    explicitLyrics: false
                  }
                ]
              };
              
              // Use our export function with the template option
              exportMetadata(demoRelease, exportFormat, selectedDistributor || undefined, useTemplate);
            }
          }
        }
      }, 300);
      
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the selected releases.",
        variant: "destructive"
      });
    }
  };
  
  const getExportIcon = (format: ExportFormat) => {
    switch (format) {
      case "csv": return <FileText className="h-4 w-4 mr-2" />;
      case "json": return <FileJson className="h-4 w-4 mr-2" />;
      case "xml": return <FileDigit className="h-4 w-4 mr-2" />;
      case "ddex": return <TableProperties className="h-4 w-4 mr-2" />;
      case "excel": 
      default: return <FilePlus className="h-4 w-4 mr-2" />;
    }
  };
  
  const getStatusBadge = (status: ExportJob["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "uploading":
        return <Badge variant="secondary">Processing</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  if (releasesLoading || distributorsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Releases Selection */}
        <Card className="md:col-span-2 h-auto">
          <CardHeader>
            <CardTitle>Select Releases to Export</CardTitle>
            <CardDescription>
              Choose releases you want to include in the metadata export
            </CardDescription>
          </CardHeader>
          <CardContent>
            {releases?.length > 0 ? (
              <div className="overflow-auto max-h-96">
                <div className="mb-4 flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2 h-4 w-4 rounded border-gray-300"
                    onChange={handleSelectAll}
                    checked={releases && selectedReleases.length === releases.length}
                  />
                  <Label>Select All</Label>
                  
                  <div className="ml-auto">
                    <DateRangePicker
                      date={dateRange}
                      onDateChange={setDateRange}
                    />
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>UPC</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {releases.map((release: Release) => (
                      <TableRow key={release.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedReleases.includes(release.id)} 
                            onCheckedChange={() => handleSelectRelease(release.id)}
                          />
                        </TableCell>
                        <TableCell>{release.title}</TableCell>
                        <TableCell>{release.artist}</TableCell>
                        <TableCell>{release.upc}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={release.status === "active" ? "outline" : 
                              release.status === "pending" ? "secondary" : "default"}
                          >
                            {release.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center p-10 border border-dashed rounded-lg">
                <p>No releases found</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <div>
              <Badge variant="outline">{selectedReleases.length} releases selected</Badge>
            </div>
            <Button 
              onClick={handleExport}
              disabled={selectedReleases.length === 0}
              variant="default"
            >
              <Download className="h-4 w-4 mr-2" /> Export Selected
            </Button>
          </CardFooter>
        </Card>
        
        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
            <CardDescription>
              Configure your export format and destination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Export Format</h3>
                <RadioGroup 
                  defaultValue="excel" 
                  className="space-y-2"
                  value={exportFormat}
                  onValueChange={(value: ExportFormat) => setExportFormat(value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel" className="flex items-center">
                      <FilePlus className="h-4 w-4 mr-2" /> Excel Spreadsheet
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="flex items-center">
                      <FileText className="h-4 w-4 mr-2" /> CSV File
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="json" id="json" />
                    <Label htmlFor="json" className="flex items-center">
                      <FileJson className="h-4 w-4 mr-2" /> JSON Format
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ddex" id="ddex" />
                    <Label htmlFor="ddex" className="flex items-center">
                      <TableProperties className="h-4 w-4 mr-2" /> DDEX Format
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {exportFormat === "excel" && (
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="useTemplate" 
                    checked={useTemplate}
                    onCheckedChange={(checked) => setUseTemplate(checked as boolean)}
                  />
                  <Label htmlFor="useTemplate">Use metadata template</Label>
                </div>
              )}
              
              <Separator />
              
              <div>
                <h3 className="text-sm font-medium mb-3">Distributor Specific Format</h3>
                <div className="space-y-2">
                  <RadioGroup 
                    defaultValue="none"
                    value={selectedDistributor || "none"}
                    onValueChange={(value) => setSelectedDistributor(value === "none" ? null : value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value="none" 
                        id="no-distributor" 
                      />
                      <Label htmlFor="no-distributor">Generic Format (No Distributor)</Label>
                    </div>
                    
                    {distributors?.map((distributor: Distributor) => (
                      <div key={distributor.id} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={distributor.id} 
                          id={distributor.id}
                        />
                        <Label htmlFor={distributor.id}>{distributor.name}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Export Jobs</CardTitle>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="showCompleted" 
                checked={showCompleted}
                onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
              />
              <Label htmlFor="showCompleted">Show completed</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {exportJobs.length > 0 ? (
            <div className="space-y-4">
              {exportJobs
                .filter(job => showCompleted || job.status !== "completed")
                .map(job => (
                  <div key={job.id} className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getExportIcon(exportFormat)}
                        <span className="font-medium">{job.distributorName}</span>
                        {getStatusBadge(job.status)}
                      </div>
                      <div>
                        {job.timestamp && <span className="text-sm text-gray-500">
                          {new Date(job.timestamp).toLocaleString()}
                        </span>}
                      </div>
                    </div>
                    
                    {job.status === "uploading" && (
                      <Progress value={job.progress} className="h-2" />
                    )}
                    
                    {job.message && <p className="text-sm mt-2">{job.message}</p>}
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center p-10 border border-dashed rounded-lg">
              <p>No export jobs created yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}