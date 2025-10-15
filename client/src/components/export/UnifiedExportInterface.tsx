import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { ExportFormat, exportMetadata, CompleteRelease } from '@/lib/metadata-export';
import { ReleaseFilters, FilterOptions } from './ReleaseFilters';
import { FilteredReleaseList, Release } from './FilteredReleaseList';
import { 
  FileText, 
  FileJson, 
  FilePlus, 
  FileDigit, 
  TableProperties,
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Music,
  Share2
} from 'lucide-react';

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

export interface UnifiedExportInterfaceProps {
  defaultExportFormat?: ExportFormat;
  showDistributorFilter?: boolean;
  onExportComplete?: (jobs: ExportJob[]) => void;
}

export function UnifiedExportInterface({
  defaultExportFormat = "excel",
  showDistributorFilter = true,
  onExportComplete
}: UnifiedExportInterfaceProps) {
  // States
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [exportFormat, setExportFormat] = useState<ExportFormat>(defaultExportFormat);
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [selectedReleases, setSelectedReleases] = useState<number[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<string>("");
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [allReleases, setAllReleases] = useState<Release[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [batchSelectAll, setBatchSelectAll] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    artists: [],
    labels: [],
    composers: [],
    releaseType: "all",
    statusFilters: {
      published: true,
      pending: true,
      scheduled: true,
      draft: false
    },
    autoDistribute: false
  });
  const { toast } = useToast();

  // Mock data
  useEffect(() => {
    // Mock releases
    const mockReleases: Release[] = [
      {
        id: 1,
        title: "Summer Hits",
        artist: "Various Artists",
        upc: "123456789012",
        status: "published",
        createdAt: "2024-10-01",
        label: "Universal Music",
        primaryArtist: "Various Artists",
        releaseDate: "2025-01-15",
        tracks: 12,
        composers: ["J. Williams", "Modern Composer"]
      },
      {
        id: 2,
        title: "Acoustic Sessions",
        artist: "John Smith",
        upc: "123456789013",
        status: "published",
        createdAt: "2024-09-15",
        label: "Indie Records",
        primaryArtist: "John Smith",
        releaseDate: "2024-12-01",
        tracks: 8,
        composers: ["John Smith", "Jazz Musician"]
      },
      {
        id: 3,
        title: "Electronic Dreams",
        artist: "Digital Wave",
        upc: "123456789014",
        status: "pending",
        createdAt: "2024-11-05",
        label: "Digital Records",
        primaryArtist: "Digital Wave",
        releaseDate: "2025-02-10",
        tracks: 10,
        composers: ["Digital Wave", "Modern Composer"]
      },
      {
        id: 4,
        title: "Classical Collection",
        artist: "Orchestra",
        upc: "123456789015",
        status: "scheduled",
        createdAt: "2024-10-15",
        label: "Sony Music",
        primaryArtist: "Orchestra",
        releaseDate: "2025-03-01",
        tracks: 15,
        composers: ["Beethoven", "J. Williams"]
      },
      {
        id: 5,
        title: "Rock Anthology",
        artist: "Rock Band",
        upc: "123456789016",
        status: "draft",
        createdAt: "2024-11-20",
        label: "Warner Records",
        primaryArtist: "Rock Band",
        releaseDate: "2025-01-30",
        tracks: 6,
        composers: ["Rock Band"]
      }
    ];

    // Mock distributors
    const mockDistributors: Distributor[] = [
      {
        id: "spotify",
        name: "Spotify",
        logo: "/distributors/spotify.png",
        enabled: true,
        supportsDirectDelivery: true,
        supportsBulkDelivery: true,
        apiIntegration: true,
        metadataFormats: ["excel", "csv", "json"]
      },
      {
        id: "apple",
        name: "Apple Music",
        logo: "/distributors/apple.png",
        enabled: true,
        supportsDirectDelivery: true,
        supportsBulkDelivery: true,
        apiIntegration: true,
        metadataFormats: ["excel", "xml", "ddex"]
      },
      {
        id: "amazon",
        name: "Amazon Music",
        logo: "/distributors/amazon.png",
        enabled: true,
        supportsDirectDelivery: false,
        supportsBulkDelivery: true,
        ftpIntegration: true,
        metadataFormats: ["csv", "json"]
      },
      {
        id: "all",
        name: "All Platforms",
        enabled: true,
        supportsBulkDelivery: true,
        metadataFormats: ["excel", "csv", "json", "xml", "ddex"]
      }
    ];

    setAllReleases(mockReleases);
    setDistributors(mockDistributors);

    // Set default values
    if (mockReleases.length > 0) {
      setSelectedReleaseId(mockReleases[0].id);
    }
    
    if (mockDistributors.length > 0) {
      setSelectedDistributor(mockDistributors[0].id);
    }
  }, []);

  // Handle toggling checkboxes in batch mode
  const handleReleaseToggle = (releaseId: number) => {
    setSelectedReleases(prev => 
      prev.includes(releaseId) 
        ? prev.filter(id => id !== releaseId)
        : [...prev, releaseId]
    );
  };

  // Toggle select all in batch mode
  const handleToggleSelectAll = () => {
    if (batchSelectAll) {
      setSelectedReleases([]);
    } else {
      // Only select filtered releases
      const filteredIds = getFilteredReleases().map(release => release.id);
      setSelectedReleases(filteredIds);
    }
    setBatchSelectAll(!batchSelectAll);
  };
  
  // Get filtered releases based on current filters
  const getFilteredReleases = () => {
    let filtered = [...allReleases];
    
    // Date range filter
    if (filters.dateRange && filters.dateRange.from && filters.dateRange.to) {
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);
      filtered = filtered.filter(release => {
        const releaseDate = new Date(release.releaseDate || release.createdAt);
        return releaseDate >= fromDate && releaseDate <= toDate;
      });
    }
    
    // Artist filter - actively show filtering by displaying counts
    if (filters.artists.length > 0) {
      console.log(`Filtering by ${filters.artists.length} artists:`, filters.artists);
      filtered = filtered.filter(release => 
        filters.artists.includes(release.artist) || 
        (release.primaryArtist && filters.artists.includes(release.primaryArtist))
      );
      console.log(`After artist filter: ${filtered.length} releases remain`);
    }
    
    // Label filter - actively show filtering by displaying counts
    if (filters.labels.length > 0) {
      console.log(`Filtering by ${filters.labels.length} labels:`, filters.labels);
      filtered = filtered.filter(release => 
        release.label && filters.labels.includes(release.label)
      );
      console.log(`After label filter: ${filtered.length} releases remain`);
    }
    
    // Composer filter - actively show filtering by displaying counts
    if (filters.composers.length > 0) {
      console.log(`Filtering by ${filters.composers.length} composers:`, filters.composers);
      filtered = filtered.filter(release => 
        release.composers && release.composers.some(composer => 
          filters.composers.includes(composer)
        )
      );
      console.log(`After composer filter: ${filtered.length} releases remain`);
    }
    
    // Release type filter
    if (filters.releaseType !== "all") {
      console.log(`Filtering by release type: ${filters.releaseType}`);
      filtered = filtered.filter(release => {
        // This is a simplification - in a real app, you'd have a release type field
        if (filters.releaseType === "album") return release.tracks && release.tracks > 7;
        if (filters.releaseType === "single") return release.tracks && release.tracks <= 3;
        if (filters.releaseType === "ep") return release.tracks && release.tracks > 3 && release.tracks <= 7;
        return true;
      });
      console.log(`After release type filter: ${filtered.length} releases remain`);
    }
    
    // Status filter
    const activeStatuses = [];
    if (filters.statusFilters.published) activeStatuses.push('published');
    if (filters.statusFilters.pending) activeStatuses.push('pending');
    if (filters.statusFilters.scheduled) activeStatuses.push('scheduled');
    if (filters.statusFilters.draft) activeStatuses.push('draft');
    
    console.log(`Filtering by statuses: ${activeStatuses.join(', ')}`);
    filtered = filtered.filter(release => {
      if (release.status === "published" && !filters.statusFilters.published) return false;
      if (release.status === "pending" && !filters.statusFilters.pending) return false;
      if (release.status === "scheduled" && !filters.statusFilters.scheduled) return false;
      if (release.status === "draft" && !filters.statusFilters.draft) return false;
      return true;
    });
    console.log(`After status filter: ${filtered.length} releases remain`);
    
    // Display a toast with filter summary
    if (filtered.length !== allReleases.length) {
      toast({
        title: "Filters applied",
        description: `Showing ${filtered.length} of ${allReleases.length} releases based on current filters.`
      });
    }
    
    return filtered;
  };

  // Handle single release export
  const handleSingleExport = async () => {
    if (!selectedReleaseId) {
      toast({
        title: "No release selected",
        description: "Please select a release to export",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      // Simulate API call to get selected release details
      const release = allReleases.find(r => r.id === selectedReleaseId);
      if (!release) throw new Error("Release not found");

      const distributorName = selectedDistributor 
        ? distributors.find(d => d.id === selectedDistributor)?.name || 'Unknown'
        : 'All Platforms';

      // Generate a mock export job
      const newJob: ExportJob = {
        id: Math.random().toString(36).substring(2, 9),
        distributorId: selectedDistributor || 'all',
        distributorName,
        status: "pending",
        progress: 0,
        timestamp: new Date()
      };

      setExportJobs([newJob, ...exportJobs]);

      // Mock release data for export
      const releaseData: CompleteRelease = {
        metadata: {
          releaseTitle: release.title,
          releaseType: "Album",
          primaryArtist: release.artist,
          label: release.label || "Independent",
          productionYear: new Date(release.releaseDate || "").getFullYear().toString(),
          pLine: `℗ ${new Date(release.releaseDate || "").getFullYear()} ${release.label || "Independent"}`,
          cLine: `© ${new Date(release.releaseDate || "").getFullYear()} ${release.label || "Independent"}`,
          genre: "Pop",
          originalReleaseDate: new Date(release.releaseDate || ""),
          digitalReleaseDate: new Date(release.releaseDate || ""),
          parentalAdvisory: false,
          clearanceConfirmation: true,
          licensingConfirmation: true,
          agreementConfirmation: true,
          upc: release.upc
        },
        tracks: Array(release.tracks || 1).fill(0).map((_, index) => ({
          trackNumber: (index + 1).toString(),
          trackTitle: `Track ${index + 1}`,
          primaryArtist: release.artist,
          isrc: `USGF1${Math.floor(10000 + Math.random() * 90000)}`,
          duration: "3:30",
          composer: release.composers ? release.composers.join(", ") : "Unknown",
          lyricist: "Lyricist Name",
          publisher: release.label || "Independent",
          explicitLyrics: false
        }))
      };

      // Simulate export process
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress > 100) {
          clearInterval(interval);
          setExportJobs(prev => 
            prev.map(job => 
              job.id === newJob.id 
                ? { ...job, status: "completed", progress: 100 }
                : job
            )
          );
          
          // Try to download the file
          if (exportFormat && release) {
            try {
              exportMetadata(releaseData, exportFormat, selectedDistributor);
            } catch (err) {
              console.error("Error exporting metadata:", err);
            }
          }
          
          setIsExporting(false);
          
          toast({
            title: "Export completed",
            description: `${release.title} has been exported successfully.`,
            variant: "default"
          });
          
          if (onExportComplete) {
            onExportComplete([{ 
              ...newJob, 
              status: "completed", 
              progress: 100 
            }]);
          }
        } else {
          setExportJobs(prev => 
            prev.map(job => 
              job.id === newJob.id 
                ? { ...job, status: "uploading", progress }
                : job
            )
          );
        }
      }, 400);

    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
      toast({
        title: "Export failed",
        description: "There was an error exporting the metadata.",
        variant: "destructive"
      });
    }
  };

  // Handle batch export
  const handleBatchExport = async () => {
    if (selectedReleases.length === 0) {
      toast({
        title: "No releases selected",
        description: "Please select at least one release to export",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);

    try {
      const distributorName = selectedDistributor 
        ? distributors.find(d => d.id === selectedDistributor)?.name || 'Unknown'
        : 'All Platforms';

      // Generate a mock export job for batch
      const newJob: ExportJob = {
        id: Math.random().toString(36).substring(2, 9),
        distributorId: selectedDistributor || 'all',
        distributorName,
        status: "pending",
        progress: 0,
        timestamp: new Date()
      };

      setExportJobs([newJob, ...exportJobs]);

      // Simulate batch export process
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress > 100) {
          clearInterval(interval);
          setExportJobs(prev => 
            prev.map(job => 
              job.id === newJob.id 
                ? { ...job, status: "completed", progress: 100 }
                : job
            )
          );
          
          setIsExporting(false);
          
          toast({
            title: "Batch export completed",
            description: `${selectedReleases.length} releases have been exported successfully.`,
            variant: "default"
          });
          
          if (onExportComplete) {
            onExportComplete([{ 
              ...newJob, 
              status: "completed", 
              progress: 100 
            }]);
          }
          
          // If autoDistribute is enabled, show a notification about distribution
          if (filters.autoDistribute) {
            toast({
              title: "Distribution started",
              description: `Distribution of ${selectedReleases.length} releases has been queued.`,
              variant: "default"
            });
          }
        } else {
          setExportJobs(prev => 
            prev.map(job => 
              job.id === newJob.id 
                ? { ...job, status: "uploading", progress }
                : job
            )
          );
        }
      }, 200);

      // For demo, create a mock multi-release export file
      const demoRelease: CompleteRelease = {
        metadata: {
          releaseTitle: "Multi-Release Export",
          releaseType: "Compilation",
          primaryArtist: "Various Artists",
          label: "Demo Records",
          productionYear: new Date().getFullYear().toString(),
          pLine: `℗ ${new Date().getFullYear()} Demo Records`,
          cLine: `© ${new Date().getFullYear()} Demo Records`,
          genre: "Various",
          originalReleaseDate: new Date(),
          digitalReleaseDate: new Date(),
          parentalAdvisory: false,
          clearanceConfirmation: true,
          licensingConfirmation: true,
          agreementConfirmation: true
        },
        tracks: [
          {
            trackNumber: "1",
            trackTitle: "Demo Track 1",
            primaryArtist: "Artist 1",
            isrc: "USGF198765432",
            duration: "3:45"
          },
          {
            trackNumber: "2",
            trackTitle: "Demo Track 2",
            primaryArtist: "Artist 2",
            isrc: "USGF198765433",
            duration: "4:12"
          }
        ]
      };

      // Try to download a sample file for demo purposes
      if (exportFormat) {
        try {
          setTimeout(() => {
            exportMetadata(demoRelease, exportFormat, selectedDistributor);
          }, 1000);
        } catch (err) {
          console.error("Error exporting metadata:", err);
        }
      }

    } catch (error) {
      console.error("Batch export error:", error);
      setIsExporting(false);
      toast({
        title: "Batch export failed",
        description: "There was an error exporting the releases.",
        variant: "destructive"
      });
    }
  };

  // Get appropriate icon for export format
  const getExportFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'csv':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'json':
        return <FileJson className="h-4 w-4 mr-2" />;
      case 'excel':
        return <TableProperties className="h-4 w-4 mr-2" />;
      case 'xml':
        return <FileDigit className="h-4 w-4 mr-2" />;
      case 'ddex':
        return <FilePlus className="h-4 w-4 mr-2" />;
      default:
        return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Switcher */}
      <div className="flex items-center gap-4">
        <div className="space-y-1 flex-1">
          <Label htmlFor="export-mode">Export Mode</Label>
          <Select
            value={mode}
            onValueChange={(value) => setMode(value as 'single' | 'batch')}
          >
            <SelectTrigger id="export-mode">
              <SelectValue placeholder="Select export mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">
                <div className="flex items-center">
                  <Music className="h-4 w-4 mr-2" />
                  Single Release
                </div>
              </SelectItem>
              <SelectItem value="batch">
                <div className="flex items-center">
                  <Share2 className="h-4 w-4 mr-2" />
                  Batch Export
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 flex-1">
          <Label htmlFor="format">Export Format</Label>
          <Select 
            value={exportFormat}
            onValueChange={(value) => setExportFormat(value as ExportFormat)}
          >
            <SelectTrigger id="format">
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
          <div className="space-y-1 flex-1">
            <Label htmlFor="distributor">Distributor</Label>
            <Select 
              value={selectedDistributor}
              onValueChange={setSelectedDistributor}
            >
              <SelectTrigger id="distributor">
                <SelectValue placeholder="Select distributor" />
              </SelectTrigger>
              <SelectContent>
                {distributors.map(distributor => (
                  <SelectItem key={distributor.id} value={distributor.id}>
                    {distributor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Release Selection Section */}
      <div className="border rounded-md p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">
            {mode === 'single' ? 'Select Release' : 'Select Releases'}
          </h3>
        </div>
        
        <FilteredReleaseList
          releases={allReleases}
          mode={mode}
          filters={filters}
          selectedReleaseId={selectedReleaseId}
          selectedReleases={selectedReleases}
          onReleaseSelect={(id) => setSelectedReleaseId(id)}
          onReleaseToggle={handleReleaseToggle}
          onSelectAll={handleToggleSelectAll}
          batchSelectAll={batchSelectAll}
        />
      </div>

      {/* Filters Section */}
      <div className="border rounded-md p-4">
        <ReleaseFilters 
          onFilterChange={setFilters}
          initialFilters={filters}
          batchMode={mode === 'batch'}
        />
      </div>

      {/* Export Jobs Section */}
      {exportJobs.length > 0 && (
        <div className="border rounded-md p-4">
          <h3 className="text-lg font-medium mb-4">Recent Export Jobs</h3>
          <div className="space-y-4">
            {exportJobs.slice(0, 3).map(job => (
              <div key={job.id} className="border rounded-md p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{job.distributorName} Export</h4>
                    <p className="text-sm text-muted-foreground">
                      {job.timestamp?.toLocaleString()}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      job.status === "completed" ? "success" : 
                      job.status === "failed" ? "destructive" : 
                      "secondary"
                    }
                    className={job.status === "completed" ? "bg-green-600" : ""}
                  >
                    {job.status === "completed" && <CheckCircle className="mr-1 h-3 w-3" />}
                    {job.status === "failed" && <AlertCircle className="mr-1 h-3 w-3" />}
                    {job.status === "uploading" && <RefreshCw className="mr-1 h-3 w-3 animate-spin" />}
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
                {(job.status === "uploading" || job.status === "pending") && (
                  <div className="mt-2">
                    <Progress value={job.progress} className="h-2" />
                    <p className="text-xs text-right mt-1 text-muted-foreground">
                      {job.progress}%
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Button */}
      <div className="flex justify-end">
        <Button 
          disabled={isExporting || (mode === 'single' ? !selectedReleaseId : selectedReleases.length === 0)}
          onClick={mode === 'single' ? handleSingleExport : handleBatchExport}
          className="min-w-[150px]"
        >
          {isExporting ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {mode === 'single' ? 'Export Release' : 'Export Selected'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}