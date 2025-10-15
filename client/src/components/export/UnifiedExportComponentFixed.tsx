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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { 
  FileUp, 
  FileText, 
  Download, 
  Database, 
  Music, 
  Share2, 
  Filter as FilterIcon,
  Calendar,
  FilePlus,
  FileJson,
  FileDigit,
  TableProperties,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Search,
  UserRound,
  Music2,
  Tag,
  PenTool,
  Filter,
  X,
  SlidersHorizontal,
  Clock
} from 'lucide-react';

// Standard interfaces
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

export interface UnifiedExportComponentProps {
  defaultExportFormat?: ExportFormat;
  showDistributorFilter?: boolean;
  onExportComplete?: (jobs: ExportJob[]) => void;
}

export function UnifiedExportComponentFixed({
  defaultExportFormat = "excel",
  showDistributorFilter = true,
  onExportComplete
}: UnifiedExportComponentProps) {
  // States
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [exportFormat, setExportFormat] = useState<ExportFormat>(defaultExportFormat);
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [selectedReleases, setSelectedReleases] = useState<number[]>([]);
  const [selectedDistributor, setSelectedDistributor] = useState<string>("");
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [allReleases, setAllReleases] = useState<Release[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [batchSelectAll, setBatchSelectAll] = useState(false);
  const [filterText, setFilterText] = useState("");
  const { toast } = useToast();
  
  // Advanced filter states
  const [dateRangeType, setDateRangeType] = useState<string>("all");
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedComposers, setSelectedComposers] = useState<string[]>([]);
  const [releaseType, setReleaseType] = useState<string>("all");
  const [statusFilters, setStatusFilters] = useState<{
    published: boolean;
    pending: boolean;
    scheduled: boolean;
    draft: boolean;
  }>({
    published: true,
    pending: true,
    scheduled: true,
    draft: false
  });
  const [autoDistribute, setAutoDistribute] = useState<boolean>(false);

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
        tracks: 12
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
        tracks: 8
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
        tracks: 10
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

  // Apply all filters to releases
  const applyFilters = () => {
    let filtered = [...allReleases];
    
    // Text search filter
    if (filterText) {
      const searchText = filterText.toLowerCase();
      filtered = filtered.filter(release => 
        release.title.toLowerCase().includes(searchText) ||
        release.artist.toLowerCase().includes(searchText) ||
        (release.upc && release.upc.includes(searchText))
      );
    }
    
    // Date range filter
    if (dateRange && dateRange.from && dateRange.to) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      filtered = filtered.filter(release => {
        const releaseDate = new Date(release.releaseDate || release.createdAt);
        return releaseDate >= fromDate && releaseDate <= toDate;
      });
    }
    
    // Artist filter
    if (selectedArtists.length > 0) {
      filtered = filtered.filter(release => 
        selectedArtists.includes(release.artist) || 
        selectedArtists.includes(release.primaryArtist || "")
      );
    }
    
    // Label filter
    if (selectedLabels.length > 0) {
      filtered = filtered.filter(release => 
        release.label && selectedLabels.includes(release.label)
      );
    }
    
    // Release type filter
    if (releaseType !== "all") {
      filtered = filtered.filter(release => {
        // This is a simplification - in a real app, you'd have a release type field
        if (releaseType === "album") return release.tracks && release.tracks > 7;
        if (releaseType === "single") return release.tracks && release.tracks <= 3;
        if (releaseType === "ep") return release.tracks && release.tracks > 3 && release.tracks <= 7;
        return true;
      });
    }
    
    // Status filter
    filtered = filtered.filter(release => {
      if (release.status === "published" && !statusFilters.published) return false;
      if (release.status === "pending" && !statusFilters.pending) return false;
      if (release.status === "scheduled" && !statusFilters.scheduled) return false;
      if (release.status === "draft" && !statusFilters.draft) return false;
      return true;
    });
    
    return filtered;
  };
  
  // Apply filters to get filtered releases
  const filteredReleases = applyFilters();

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
      setSelectedReleases(filteredReleases.map(release => release.id));
    }
    setBatchSelectAll(!batchSelectAll);
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
          composer: "Composer Name",
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

  // Handle label filter apply
  const handleLabelFilterApply = () => {
    const checkboxes = document.querySelectorAll('input[id^="label-"]:checked');
    const selected = Array.from(checkboxes).map(cb => 
      (cb as HTMLInputElement).id.replace('label-', '')
    );
    setSelectedLabels(selected);
    toast({
      title: "Filters applied",
      description: `Applied ${selected.length} label filters.`
    });
  };

  // Handle composer filter apply
  const handleComposerFilterApply = () => {
    const checkboxes = document.querySelectorAll('input[id^="composer-"]:checked');
    const selected = Array.from(checkboxes).map(cb => 
      (cb as HTMLInputElement).id.replace('composer-', '')
    );
    setSelectedComposers(selected);
    toast({
      title: "Filters applied",
      description: `Applied ${selected.length} composer filters.`
    });
  };

  // Handle status filters apply
  const handleStatusChange = (status: "published" | "pending" | "scheduled" | "draft", checked: boolean) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: checked
    }));
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
          <div className="relative">
            <Input
              type="search"
              placeholder="Search releases..."
              className="pl-8 w-64"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {mode === 'single' ? (
          <div className="space-y-4">
            <Select
              value={selectedReleaseId?.toString() || ""}
              onValueChange={(value) => setSelectedReleaseId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a release" />
              </SelectTrigger>
              <SelectContent>
                {filteredReleases.map(release => (
                  <SelectItem key={release.id} value={release.id.toString()}>
                    {release.title} - {release.artist}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="select-all" 
                  checked={batchSelectAll}
                  onCheckedChange={handleToggleSelectAll} 
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All
                </label>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedReleases.length} of {filteredReleases.length} selected
              </span>
            </div>
            
            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
              {filteredReleases.length === 0 && (
                <div className="py-4 text-center text-muted-foreground">
                  No releases found matching your criteria
                </div>
              )}
              
              {filteredReleases.map(release => (
                <div 
                  key={release.id} 
                  className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => handleReleaseToggle(release.id)}
                >
                  <Checkbox 
                    checked={selectedReleases.includes(release.id)} 
                    onCheckedChange={() => handleReleaseToggle(release.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{release.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {release.artist} • {release.label || 'Independent'} • {release.createdAt}
                    </div>
                  </div>
                  <Badge variant={
                    release.status === "published" ? "default" :
                    release.status === "pending" ? "secondary" :
                    release.status === "scheduled" ? "outline" : "destructive"
                  }>
                    {release.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="border rounded-md p-4">
        <h3 className="text-lg font-medium mb-4">Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Filter */}
          <div className="space-y-3">
            <Label className="font-medium">Date Range</Label>
            <div className="space-y-2">
              <RadioGroup value={dateRangeType} onValueChange={setDateRangeType}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="date-all" />
                    <Label htmlFor="date-all" className="text-sm cursor-pointer">All Time</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="today" id="date-today" />
                    <Label htmlFor="date-today" className="text-sm cursor-pointer">Today</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yesterday" id="date-yesterday" />
                    <Label htmlFor="date-yesterday" className="text-sm cursor-pointer">Yesterday</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="week" id="date-week" />
                    <Label htmlFor="date-week" className="text-sm cursor-pointer">This Week</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lastweek" id="date-lastweek" />
                    <Label htmlFor="date-lastweek" className="text-sm cursor-pointer">Last Week</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="month" id="date-month" />
                    <Label htmlFor="date-month" className="text-sm cursor-pointer">This Month</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="lastmonth" id="date-lastmonth" />
                    <Label htmlFor="date-lastmonth" className="text-sm cursor-pointer">Last Month</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="date-custom" />
                    <Label htmlFor="date-custom" className="text-sm cursor-pointer">Custom</Label>
                  </div>
                </div>
              </RadioGroup>
              
              {dateRangeType === 'custom' && (
                <div className="pt-2">
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={setDateRange}
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Filters */}
          <div className="space-y-3">
            <Label className="font-medium">Filter By</Label>
            <div className="grid grid-cols-1 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <div className="flex items-center gap-2">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                      <span>Select Artists</span>
                    </div>
                    <SlidersHorizontal className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <div className="p-2">
                    <Input placeholder="Search artists..." className="h-8" />
                  </div>
                  <Separator />
                  <ScrollArea className="h-52">
                    <div className="p-2">
                      {['Various Artists', 'John Smith', 'Digital Wave', 'Rock Band', 'Pop Star'].map((artist) => (
                        <div key={artist} className="flex items-center space-x-2 p-1">
                          <Checkbox id={`artist-${artist}`} />
                          <label htmlFor={`artist-${artist}`} className="text-sm w-full cursor-pointer">
                            {artist}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Separator />
                  <div className="p-2 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const checkboxes = document.querySelectorAll('input[id^="artist-"]:checked');
                        const selected = Array.from(checkboxes).map(cb => 
                          (cb as HTMLInputElement).id.replace('artist-', '')
                        );
                        setSelectedArtists(selected);
                        toast({
                          title: "Filters applied",
                          description: `Applied ${selected.length} artist filters.`
                        });
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-muted-foreground" />
                      <span>Select Labels</span>
                    </div>
                    <SlidersHorizontal className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <div className="p-2">
                    <Input placeholder="Search labels..." className="h-8" />
                  </div>
                  <Separator />
                  <ScrollArea className="h-52">
                    <div className="p-2">
                      {['Universal Music', 'Indie Records', 'Digital Records', 'Sony Music', 'Warner Records'].map((label) => (
                        <div key={label} className="flex items-center space-x-2 p-1">
                          <Checkbox id={`label-${label}`} />
                          <label htmlFor={`label-${label}`} className="text-sm w-full cursor-pointer">
                            {label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Separator />
                  <div className="p-2 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleLabelFilterApply}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Additional filters */}
          <div className="space-y-3">
            <Label className="font-medium">Additional Filters</Label>
            <div className="grid grid-cols-1 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <div className="flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-muted-foreground" />
                      <span>Select Composers</span>
                    </div>
                    <SlidersHorizontal className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <div className="p-2">
                    <Input placeholder="Search composers..." className="h-8" />
                  </div>
                  <Separator />
                  <ScrollArea className="h-52">
                    <div className="p-2">
                      {['J. Williams', 'Hans Zimmer', 'Beethoven', 'Modern Composer', 'Jazz Musician'].map((composer) => (
                        <div key={composer} className="flex items-center space-x-2 p-1">
                          <Checkbox id={`composer-${composer}`} />
                          <label htmlFor={`composer-${composer}`} className="text-sm w-full cursor-pointer">
                            {composer}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <Separator />
                  <div className="p-2 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleComposerFilterApply}
                    >
                      Apply
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <div className="flex items-center gap-2">
                      <Music2 className="h-4 w-4 text-muted-foreground" />
                      <span>Release Type</span>
                    </div>
                    <SlidersHorizontal className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <div className="p-2">
                    <RadioGroup defaultValue="all" onValueChange={setReleaseType}>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="all" id="release-all" />
                          <Label htmlFor="release-all" className="text-sm cursor-pointer">All Types</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="album" id="release-album" />
                          <Label htmlFor="release-album" className="text-sm cursor-pointer">Albums</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="single" id="release-single" />
                          <Label htmlFor="release-single" className="text-sm cursor-pointer">Singles</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ep" id="release-ep" />
                          <Label htmlFor="release-ep" className="text-sm cursor-pointer">EPs</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="compilation" id="release-compilation" />
                          <Label htmlFor="release-compilation" className="text-sm cursor-pointer">Compilations</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Status</span>
                    </div>
                    <SlidersHorizontal className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-0" align="start">
                  <div className="p-2">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="status-published" 
                          checked={statusFilters.published}
                          onCheckedChange={(checked) => handleStatusChange("published", !!checked)}
                        />
                        <label htmlFor="status-published" className="text-sm cursor-pointer">Published</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="status-pending" 
                          checked={statusFilters.pending}
                          onCheckedChange={(checked) => handleStatusChange("pending", !!checked)}
                        />
                        <label htmlFor="status-pending" className="text-sm cursor-pointer">Pending</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="status-scheduled" 
                          checked={statusFilters.scheduled}
                          onCheckedChange={(checked) => handleStatusChange("scheduled", !!checked)}
                        />
                        <label htmlFor="status-scheduled" className="text-sm cursor-pointer">Scheduled</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="status-draft" 
                          checked={statusFilters.draft}
                          onCheckedChange={(checked) => handleStatusChange("draft", !!checked)}
                        />
                        <label htmlFor="status-draft" className="text-sm cursor-pointer">Draft</label>
                      </div>
                      {mode === 'batch' && (
                        <div className="pt-2 mt-2 border-t">
                          <div className="flex items-center space-x-2">
                            <Switch 
                              id="auto-distribute" 
                              checked={autoDistribute}
                              onCheckedChange={setAutoDistribute}
                            />
                            <label htmlFor="auto-distribute" className="text-sm cursor-pointer">
                              Automatically distribute after export
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
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