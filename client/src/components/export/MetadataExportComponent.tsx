import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportFormat, exportMetadata, CompleteRelease } from '@/lib/metadata-export';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DateRangePicker } from '@/components/analytics/date-range-picker';
import { DateRange } from 'react-day-picker';
import { DateRange as SelectorDateRange } from '@/components/analytics/date-range-selector';
import { 
  FileUp, 
  FileText, 
  Download, 
  Database, 
  Music, 
  Share2, 
  Filter, 
  Calendar,
  FilePlus,
  FileJson,
  FileDigit,
  TableProperties,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Standard interfaces for component
export interface Release {
  id: number;
  title: string;
  artist: string;
  upc?: string;
  status: string;
  createdAt: string;
  label?: string;
  primaryArtist?: string;
  releaseDate?: string;
  tracks?: number;
  composers?: string[];
}

export interface Track {
  id: number;
  trackNumber: string;
  title: string;
  primaryArtist: string;
  version?: string;
  isrc?: string;
  duration?: string;
  releaseId?: number;
}

export interface Distributor {
  id: string;
  name: string;
  logo?: string;
  enabled: boolean;
  supportsDirectDelivery?: boolean;
  supportsBulkDelivery?: boolean;
  apiIntegration?: boolean;
  ftpIntegration?: boolean;
  metadataFormat?: ExportFormat | ExportFormat[];
  metadataFormats?: ExportFormat[];
}

export interface ExportJob {
  id: string;
  distributorId: string;
  distributorName: string;
  status: "pending" | "uploading" | "completed" | "failed";
  progress: number;
  message?: string;
  timestamp?: Date;
}

export interface ExportDateRange {
  from?: Date;
  to?: Date;
}

export interface MetadataExportComponentProps {
  mode?: 'batch' | 'single'; // 'batch' for multiple releases, 'single' for individual release
  preselectedReleases?: number[]; // Optional preselected release IDs
  defaultExportFormat?: ExportFormat;
  showDateFilter?: boolean;
  showDistributorFilter?: boolean;
  onExportComplete?: (jobs: ExportJob[]) => void;
  hideHeader?: boolean;
}

export function MetadataExportComponent({
  mode = 'batch',
  preselectedReleases = [],
  defaultExportFormat = 'excel',
  showDateFilter = true,
  showDistributorFilter = true,
  onExportComplete,
  hideHeader = false,
}: MetadataExportComponentProps) {
  const { toast } = useToast();
  const [selectedReleases, setSelectedReleases] = useState<number[]>(preselectedReleases);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(defaultExportFormat);
  const [selectedDistributor, setSelectedDistributor] = useState<string>('none');
  const [useTemplate, setUseTemplate] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter options
  const [consolidateExport, setConsolidateExport] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [labelFilter, setLabelFilter] = useState<string>('all');
  const [artistFilter, setArtistFilter] = useState<string>('all');
  
  // Mock data for demonstration
  const [releases, setReleases] = useState<Release[]>([
    { id: 1, title: "Summer Vibes EP", artist: "DJ Sunshine", upc: "123456789012", status: "active", createdAt: "2025-01-15" },
    { id: 2, title: "Midnight Dreams", artist: "Luna Moon", upc: "223456789012", status: "pending", createdAt: "2025-02-01" },
    { id: 3, title: "Urban Echoes", artist: "City Soundz", upc: "323456789012", status: "active", createdAt: "2025-01-20" },
    { id: 4, title: "Acoustic Sessions", artist: "Emma Wood", upc: "423456789012", status: "active", createdAt: "2025-02-10" },
    { id: 5, title: "Digital Freedom", artist: "Tech Collective", upc: "523456789012", status: "pending", createdAt: "2025-02-15" }
  ]);

  const [distributors, setDistributors] = useState<Distributor[]>([
    { 
      id: "spotify", 
      name: "Spotify", 
      enabled: true, 
      supportsDirectDelivery: true,
      metadataFormats: ["json", "csv", "excel"]
    },
    { 
      id: "apple_music", 
      name: "Apple Music", 
      enabled: true,
      supportsDirectDelivery: true,
      metadataFormats: ["excel", "xml"]
    },
    { 
      id: "amazon_music", 
      name: "Amazon Music", 
      enabled: true,
      supportsDirectDelivery: true,
      metadataFormats: ["excel", "csv"]
    },
    { 
      id: "youtube_music", 
      name: "YouTube Music", 
      enabled: true,
      supportsDirectDelivery: true,
      metadataFormats: ["json", "csv"]
    },
    { 
      id: "deezer", 
      name: "Deezer", 
      enabled: true,
      supportsDirectDelivery: true,
      metadataFormats: ["xml", "excel", "csv"]
    }
  ]);

  // Fetch data in a real implementation
  useEffect(() => {
    // In a real implementation, this would fetch releases from the API
    // For now, we're using mock data defined above
  }, [activeTab, dateRange]);

  // Handle selecting/deselecting all releases
  const handleSelectAllReleases = (checked: boolean) => {
    if (checked) {
      const filteredReleases = getFilteredReleases();
      setSelectedReleases(filteredReleases.map(release => release.id));
    } else {
      setSelectedReleases([]);
    }
  };

  // Handle selecting/deselecting a single release
  const handleSelectRelease = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedReleases(prev => [...prev, id]);
    } else {
      setSelectedReleases(prev => prev.filter(releaseId => releaseId !== id));
    }
  };

  // Apply filters to releases
  const getFilteredReleases = () => {
    let filtered = [...releases];
    
    // Filter by status (tab)
    if (activeTab !== 'all') {
      filtered = filtered.filter(release => release.status === activeTab);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        release => 
          release.title.toLowerCase().includes(query) || 
          release.artist.toLowerCase().includes(query) ||
          (release.upc && release.upc.includes(query))
      );
    }
    
    // Filter by date range
    if (dateRange && dateRange.from && dateRange.to) {
      filtered = filtered.filter(release => {
        const releaseDate = new Date(release.createdAt);
        return releaseDate >= dateRange.from! && releaseDate <= dateRange.to!;
      });
    }
    
    return filtered;
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

    try {
      setIsLoading(true);
      
      // Create new export jobs
      const newJobs: ExportJob[] = [];
      
      if (selectedDistributor && selectedDistributor !== 'none') {
        // Export to a specific distributor
        const distributor = distributors.find(d => d.id === selectedDistributor);
        if (distributor) {
          const job: ExportJob = {
            id: Math.random().toString(36).substring(2, 9),
            distributorId: distributor.id,
            distributorName: distributor.name,
            status: "pending",
            progress: 0,
            timestamp: new Date()
          };
          
          newJobs.push(job);
          setExportJobs(prev => [...prev, job]);
        }
      } else if (consolidateExport) {
        // Export to all distributors in a consolidated manner
        distributors.forEach(distributor => {
          const job: ExportJob = {
            id: Math.random().toString(36).substring(2, 9),
            distributorId: distributor.id,
            distributorName: distributor.name,
            status: "pending",
            progress: 0,
            timestamp: new Date()
          };
          
          newJobs.push(job);
        });
        
        setExportJobs(prev => [...prev, ...newJobs]);
      }
      
      // Process each job (simulated)
      for (let job of newJobs) {
        // Update job status to uploading
        job.status = "uploading";
        job.progress = 10;
        setExportJobs(prev => prev.map(j => j.id === job.id ? job : j));
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        job.progress = 50;
        setExportJobs(prev => prev.map(j => j.id === job.id ? job : j));
        
        // Simulate more processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        job.progress = 100;
        job.status = "completed";
        setExportJobs(prev => prev.map(j => j.id === job.id ? job : j));
        
        // For each selected release, create a demo release object
        for (const releaseId of selectedReleases) {
          const release = releases.find(r => r.id === releaseId);
          if (release) {
            // In a real implementation, we would fetch complete metadata
            // For demo purposes, we're creating a mock release
            const demoRelease: CompleteRelease = {
              metadata: {
                releaseTitle: release.title,
                releaseType: "Album",
                primaryArtist: release.artist,
                label: "Sample Label",
                productionYear: "2025",
                pLine: "℗ 2025 Sample Label",
                cLine: "© 2025 Sample Label",
                genre: "Electronic",
                originalReleaseDate: new Date("2025-01-01"),
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
            
            // In a real implementation, this would upload to the distributor
            // For demo, we're just exporting locally if it's a local export
            if (job.distributorId === 'local_export') {
              exportMetadata(demoRelease, exportFormat, undefined, useTemplate);
            }
          }
        }
      }
      
      // Notify on completion
      if (onExportComplete) {
        onExportComplete(newJobs);
      }
      
      toast({
        title: "Export completed",
        description: `Successfully exported ${selectedReleases.length} release(s)`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download local export for selected releases
  const downloadLocalExport = () => {
    if (selectedReleases.length === 0) {
      toast({
        title: "No releases selected",
        description: "Please select at least one release to export",
        variant: "destructive"
      });
      return;
    }

    try {
      // In a real implementation, we would fetch complete metadata
      // For demo purposes, we're creating a mock release for the first selected release
      const release = releases.find(r => r.id === selectedReleases[0]);
      if (release) {
        const mockMetadata = {
          releaseTitle: release.title,
          releaseType: "Album" as const,
          primaryArtist: release.artist,
          label: "Sample Label",
          productionYear: "2025",
          pLine: "℗ 2025 Sample Label",
          cLine: "© 2025 Sample Label",
          genre: "Electronic",
          originalReleaseDate: new Date("2025-01-01"),
          digitalReleaseDate: new Date(),
          parentalAdvisory: false,
          clearanceConfirmation: true,
          licensingConfirmation: true,
          agreementConfirmation: true,
          upc: release.upc
        };
        
        const mockTracks = [
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
        ];
        
        const releaseData: CompleteRelease = {
          metadata: mockMetadata,
          tracks: mockTracks
        };
        
        // Export the release
        exportMetadata(releaseData, exportFormat, undefined, useTemplate);
        
        toast({
          title: "Export downloaded",
          description: `Metadata exported in ${exportFormat.toUpperCase()} format`,
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  // Helper function to get export format icon
  const getExportFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case "csv": return <FileText className="h-4 w-4 mr-2" />;
      case "json": return <FileJson className="h-4 w-4 mr-2" />;
      case "xml": return <FileDigit className="h-4 w-4 mr-2" />;
      case "ddex": return <TableProperties className="h-4 w-4 mr-2" />;
      case "excel": return <FilePlus className="h-4 w-4 mr-2" />;
      default: return <FilePlus className="h-4 w-4 mr-2" />;
    }
  };

  // Get status badge component for job status
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

  // Get filtered releases list
  const filteredReleases = getFilteredReleases();

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Metadata Export</h2>
          <div className="flex items-center space-x-2">
            {showDateFilter && (
              <DateRangePicker
                date={dateRange}
                onDateChange={(date) => setDateRange(date)}
              />
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Releases Selection */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Releases</CardTitle>
                <CardDescription>
                  Choose the releases you want to export metadata for
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Search releases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[200px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Releases</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
              </TabsList>
              
              <div className="mb-4 flex items-center">
                <Checkbox 
                  id="select-all"
                  checked={filteredReleases.length > 0 && selectedReleases.length === filteredReleases.length}
                  onCheckedChange={handleSelectAllReleases}
                />
                <Label htmlFor="select-all" className="ml-2">
                  Select All ({filteredReleases.length})
                </Label>
              </div>
              
              <div className="overflow-auto max-h-96 space-y-2">
                {filteredReleases.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No releases found matching your criteria</p>
                ) : (
                  filteredReleases.map((release) => (
                    <div 
                      key={release.id} 
                      className="flex items-center justify-between border-b border-border pb-2"
                    >
                      <div className="flex items-center">
                        <Checkbox 
                          id={`release-${release.id}`} 
                          checked={selectedReleases.includes(release.id)}
                          onCheckedChange={(checked) => handleSelectRelease(release.id, checked === true)}
                        />
                        <div className="ml-3">
                          <p className="font-medium">{release.title}</p>
                          <p className="text-sm text-muted-foreground">{release.artist}</p>
                        </div>
                      </div>
                      <Badge variant={release.status === 'active' ? 'success' : 'secondary'}>
                        {release.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
            <CardDescription>
              Configure your export settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Format</Label>
              <Select 
                value={exportFormat} 
                onValueChange={(value: ExportFormat) => setExportFormat(value)}
              >
                <SelectTrigger id="export-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center">
                      {getExportFormatIcon('excel')}
                      Excel (.xlsx)
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center">
                      {getExportFormatIcon('csv')}
                      CSV (.csv)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center">
                      {getExportFormatIcon('json')}
                      JSON (.json)
                    </div>
                  </SelectItem>
                  <SelectItem value="xml">
                    <div className="flex items-center">
                      {getExportFormatIcon('xml')}
                      XML (.xml)
                    </div>
                  </SelectItem>
                  <SelectItem value="ddex">
                    <div className="flex items-center">
                      {getExportFormatIcon('ddex')}
                      DDEX (.xml)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showDistributorFilter && (
              <div className="space-y-2">
                <Label htmlFor="distributor">Distributor</Label>
                <Select 
                  value={selectedDistributor} 
                  onValueChange={setSelectedDistributor}
                >
                  <SelectTrigger id="distributor">
                    <SelectValue placeholder="Select distributor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-2" />
                        Local Export Only
                      </div>
                    </SelectItem>
                    {distributors.map(distributor => (
                      <SelectItem key={distributor.id} value={distributor.id}>
                        <div className="flex items-center">
                          <Share2 className="h-4 w-4 mr-2" />
                          {distributor.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="use-template" 
                checked={useTemplate}
                onCheckedChange={(checked) => setUseTemplate(checked === true)}
              />
              <Label htmlFor="use-template">Use distributor template</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="consolidate-export" 
                checked={consolidateExport}
                onCheckedChange={(checked) => setConsolidateExport(checked === true)}
              />
              <Label htmlFor="consolidate-export">Consolidate export</Label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={downloadLocalExport}
              disabled={selectedReleases.length === 0 || isLoading}
            >
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button
              onClick={startExport}
              disabled={selectedReleases.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Start Export
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Export Jobs Status */}
      {exportJobs.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Export Status</CardTitle>
              <CardDescription>
                Track the status of your metadata exports
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="show-completed" 
                checked={showCompleted}
                onCheckedChange={(checked) => setShowCompleted(checked === true)}
              />
              <Label htmlFor="show-completed" className="text-sm">Show completed</Label>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exportJobs
                .filter(job => showCompleted || job.status !== "completed")
                .map(job => (
                  <div key={job.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {job.status === "pending" && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        {job.status === "uploading" && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        {job.status === "completed" && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                        {job.status === "failed" && <AlertCircle className="mr-2 h-4 w-4 text-red-500" />}
                        <span>{job.distributorName}</span>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                    
                    <Progress value={job.progress} className="h-2" />
                    
                    {job.message && (
                      <p className="text-sm text-muted-foreground">{job.message}</p>
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