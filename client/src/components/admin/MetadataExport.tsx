import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportFormat, exportMetadata } from '@/lib/metadata-export';
import { Spinner } from '../ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { 
  FileUp, 
  FileText, 
  Download, 
  Database, 
  Music, 
  Share2, 
  Filter, 
  Calendar
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { DateRangePicker } from '../analytics/date-range-picker';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

interface Release {
  id: number;
  title: string;
  primaryArtist: string;
  releaseDate: string;
  status: string;
  tracks: number;
  upc?: string;
  label?: string;
  composers?: string[];
}

interface Track {
  id: number;
  title: string;
  primaryArtist: string;
  isrc?: string;
  duration: string;
  releaseId: number;
}

interface ExportDateRange {
  from?: Date;
  to?: Date;
}

interface ExportOption {
  label: string;
  value: ExportFormat;
  icon: React.ReactNode;
  description: string;
}

export function MetadataExport() {
  const { toast } = useToast();
  const [selectedReleases, setSelectedReleases] = useState<number[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [distributorId, setDistributorId] = useState<string>('none');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [releases, setReleases] = useState<Release[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Added state for consolidated export and filtering options
  const [consolidateExport, setConsolidateExport] = useState(true);
  const [dateRange, setDateRange] = useState<ExportDateRange | undefined>(undefined);
  const [dateFilterType, setDateFilterType] = useState<'none' | 'day' | 'week' | 'month' | 'year' | 'custom'>('none');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [labelFilter, setLabelFilter] = useState<string>('all');
  const [artistFilter, setArtistFilter] = useState<string>('all');
  const [composerFilter, setComposerFilter] = useState<string>('all');

  // Simulated loading for demo purposes
  React.useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setReleases([
        { 
          id: 1, 
          title: 'Summer Vibes', 
          primaryArtist: 'DJ Sunshine', 
          releaseDate: '2024-06-15', 
          status: 'active',
          tracks: 8,
          upc: '123456789012'
        },
        { 
          id: 2, 
          title: 'Midnight Tales', 
          primaryArtist: 'Luna & The Stars', 
          releaseDate: '2024-07-01', 
          status: 'pending',
          tracks: 12,
          upc: '234567890123'
        },
        { 
          id: 3, 
          title: 'Urban Dreams', 
          primaryArtist: 'City Folks', 
          releaseDate: '2024-05-20', 
          status: 'active',
          tracks: 10,
          upc: '345678901234'
        },
        { 
          id: 4, 
          title: 'The Rainy Season', 
          primaryArtist: 'Cloud Nine', 
          releaseDate: '2024-08-15', 
          status: 'scheduled',
          tracks: 6,
          upc: '456789012345'
        },
        { 
          id: 5, 
          title: 'Bollywood Fusion', 
          primaryArtist: 'Desi Beats', 
          releaseDate: '2024-07-30', 
          status: 'active',
          tracks: 14,
          upc: '567890123456'
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const exportOptions: ExportOption[] = [
    { 
      label: 'Excel', 
      value: 'excel', 
      icon: <FileText className="mr-2 h-4 w-4" />,
      description: 'Export as Excel spreadsheet with multiple sheets for release and track data'
    },
    { 
      label: 'CSV', 
      value: 'csv', 
      icon: <FileText className="mr-2 h-4 w-4" />,
      description: 'Export as CSV file format for compatibility with most spreadsheet programs'
    },
    { 
      label: 'JSON', 
      value: 'json', 
      icon: <Database className="mr-2 h-4 w-4" />,
      description: 'Export as JSON format for developers and API integration'
    },
    { 
      label: 'XML', 
      value: 'xml', 
      icon: <FileUp className="mr-2 h-4 w-4" />,
      description: 'Export as XML format for system integration'
    },
    { 
      label: 'DDEX', 
      value: 'ddex', 
      icon: <Share2 className="mr-2 h-4 w-4" />,
      description: 'Export in DDEX standard format for digital music supply chain'
    }
  ];

  const distributors = [
    { id: 'spotify', name: 'Spotify' },
    { id: 'apple_music', name: 'Apple Music' },
    { id: 'amazon', name: 'Amazon Music' },
    { id: 'youtube_music', name: 'YouTube Music' },
    { id: 'gaana', name: 'Gaana' },
    { id: 'jiosaavn', name: 'JioSaavn' },
    { id: 'wynk', name: 'Wynk Music' },
  ];

  // Add effect to apply date filter based on selected type
  useEffect(() => {
    if (dateFilterType === "day") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);
      setDateRange({
        from: today,
        to: endOfDay
      });
    } else if (dateFilterType === "week") {
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 is Sunday, 6 is Saturday
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      setDateRange({
        from: startOfWeek,
        to: endOfWeek
      });
    } else if (dateFilterType === "month") {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      setDateRange({
        from: startOfMonth,
        to: endOfMonth
      });
    } else if (dateFilterType === "year") {
      const today = new Date();
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      const endOfYear = new Date(today.getFullYear(), 11, 31);
      endOfYear.setHours(23, 59, 59, 999);
      setDateRange({
        from: startOfYear,
        to: endOfYear
      });
    } else if (dateFilterType === "none") {
      setDateRange(undefined);
    }
    // "custom" type doesn't change the dateRange, it's set by the DateRangePicker
  }, [dateFilterType]);

  const filteredReleases = releases.filter(release => {
    // Status filter
    if (activeTab !== 'all' && release.status !== activeTab) {
      return false;
    }
    
    // Search filter
    if (searchQuery !== '' && 
      !release.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !release.primaryArtist.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !(release.upc && release.upc.includes(searchQuery))) {
      return false;
    }
    
    // Date filter
    if (dateRange && dateRange.from) {
      const releaseDate = new Date(release.releaseDate);
      if (dateRange.from && releaseDate < dateRange.from) return false;
      if (dateRange.to && releaseDate > dateRange.to) return false;
    }
    
    // Label filter
    if (labelFilter !== 'all' && release.label !== labelFilter) {
      return false;
    }
    
    // Artist filter
    if (artistFilter !== 'all' && release.primaryArtist !== artistFilter) {
      return false;
    }
    
    // Composer filter
    if (composerFilter !== 'all' && 
        (!release.composers || !release.composers.includes(composerFilter))) {
      return false;
    }
    
    return true;
  });

  const handleSelectRelease = (id: number) => {
    setSelectedReleases(prev => {
      if (prev.includes(id)) {
        return prev.filter(releaseId => releaseId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedReleases.length === filteredReleases.length) {
      setSelectedReleases([]);
    } else {
      setSelectedReleases(filteredReleases.map(r => r.id));
    }
  };

  // Helper function to generate a UPC if one is not provided
  // Note: In a production environment, this would call the server-side generateUPC function
  // from server/utils/id-generator.ts to ensure consistency
  function generateUPC(): string {
    // Format: 13-digit number starting with 0
    const prefix = '0';
    const numericPart = Math.floor(100000000000 + Math.random() * 900000000000).toString().substring(0, 11);
    const checkDigit = '0'; // In production, this would be calculated
    
    return `${prefix}${numericPart}${checkDigit}`;
  }
  
  // Helper function to generate a client ID if one is not provided
  // Note: In a production environment, this would call the server-side generateClientId function
  // from server/utils/id-generator.ts to ensure consistency and proper sequence
  function generateClientId(): string {
    // Format: USR-XXX-YYYY (where XXX is a random alphanumeric part and YYYY is a sequential number)
    const prefix = "USR";
    
    // Generate 3 random alphanumeric characters (matching the server's algorithm)
    const randomChars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let randomPart = '';
    for (let i = 0; i < 3; i++) {
      randomPart += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    
    // Start counter from 1000 as in server implementation
    const counter = 1000 + Math.floor(Math.random() * 9000);
    
    return `${prefix}-${randomPart}-${counter}`;
  }

  const handleExport = async () => {
    if (selectedReleases.length === 0) {
      toast({
        title: "No releases selected",
        description: "Please select at least one release to export",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // In a real application, this would fetch complete release data from the API
      // For this demo, we'll simulate the data structure
      const mockCompletedReleases = selectedReleases.map(id => {
        const release = releases.find(r => r.id === id);
        
        // Auto-generate UPC if not present
        const upc = release?.upc || generateUPC();
        
        // Auto-generate client ID (normally this would be associated with the user account)
        const clientId = generateClientId();
        
        return {
          metadata: {
            releaseTitle: release?.title || '',
            releaseType: "Album" as "Album" | "Single" | "EP" | "Compilation" | "Remix",
            primaryArtist: release?.primaryArtist || '',
            label: release?.label || 'Demo Label',
            productionYear: '2024',
            pLine: `℗ 2024 ${release?.label || 'Demo Label'}`,
            cLine: `© 2024 ${release?.label || 'Demo Label'}`,
            genre: 'Pop',
            originalReleaseDate: new Date('2024-01-01'),
            digitalReleaseDate: new Date(release?.releaseDate || '2024-01-01'),
            parentalAdvisory: false,
            clearanceConfirmation: true,
            licensingConfirmation: true,
            agreementConfirmation: true,
            upc: upc, // Use the auto-generated UPC if needed
            clientId: clientId, // Include client ID in metadata
            composers: release?.composers || []
          },
          tracks: Array.from({ length: release?.tracks || 5 }, (_, i) => ({
            trackNumber: `${i + 1}`,
            trackTitle: `Track ${i + 1} - ${release?.title}`,
            primaryArtist: release?.primaryArtist || '',
            // ISRC is managed by admin using the ISRC importer tool
            // This would normally contain ISRC data imported by admins
            isrc: 'PENDING-ADMIN-ASSIGNMENT',
            duration: `${Math.floor(Math.random() * 4) + 2}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            composer: release?.composers ? release.composers[Math.floor(Math.random() * (release.composers.length || 1)) % (release.composers.length || 1)] : `Composer ${i + 1}`,
            lyricist: release?.composers ? release.composers[Math.floor(Math.random() * (release.composers.length || 1)) % (release.composers.length || 1)] : `Lyricist ${i + 1}`,
            publisher: release?.label || 'Demo Publishing',
            explicitLyrics: Math.random() > 0.8,
          }))
        };
      });

      const distributorSpecificId = distributorId !== 'none' ? distributorId : undefined;
      
      if (consolidateExport && selectedReleases.length > 1) {
        // Create a consolidated release with all tracks from all releases
        const consolidatedRelease = {
          metadata: {
            releaseTitle: `Consolidated Export (${selectedReleases.length} Releases)`,
            releaseType: 'Compilation' as 'Album' | 'Single' | 'EP' | 'Compilation' | 'Remix',
            primaryArtist: 'Various Artists',
            label: 'Multiple Labels',
            productionYear: '2024',
            pLine: '℗ 2024 Music Distribution Platform',
            cLine: '© 2024 Music Distribution Platform',
            genre: 'Various',
            originalReleaseDate: new Date(),
            digitalReleaseDate: new Date(),
            parentalAdvisory: false,
            clearanceConfirmation: true,
            licensingConfirmation: true,
            agreementConfirmation: true,
            upc: generateUPC(),  // Generate a valid UPC for the consolidated release
            clientId: generateClientId(), // Generate a client ID for the consolidated release
            // Add export metadata
            exportDate: new Date().toISOString(),
            exportType: 'Consolidated',
            totalReleases: selectedReleases.length,
            totalTracks: mockCompletedReleases.reduce((acc, release) => acc + release.tracks.length, 0),
            uniqueArtists: Array.from(new Set(mockCompletedReleases.map(r => r.metadata.primaryArtist))),
            uniqueLabels: Array.from(new Set(mockCompletedReleases.map(r => r.metadata.label))),
            dateRange: dateRange ? {
              from: dateRange.from?.toISOString(),
              to: dateRange.to?.toISOString(),
              type: dateFilterType
            } : undefined,
            filters: {
              label: labelFilter !== 'all' ? labelFilter : 'All Labels',
              artist: artistFilter !== 'all' ? artistFilter : 'All Artists',
              composer: composerFilter !== 'all' ? composerFilter : 'All Composers',
              status: activeTab !== 'all' ? activeTab : 'All Statuses'
            }
          },
          // Combine all tracks from all releases, adding release info
          tracks: mockCompletedReleases.flatMap((release, releaseIndex) => 
            release.tracks.map((track, trackIndex) => ({
              ...track,
              releaseTitle: release.metadata.releaseTitle,
              releaseUPC: release.metadata.upc,
              releaseArtist: release.metadata.primaryArtist,
              releaseLabel: release.metadata.label,
              releaseDate: release.metadata.digitalReleaseDate.toISOString(),
              sortOrder: `${releaseIndex + 1}.${trackIndex + 1}`
            }))
          )
        };
        
        // Export the consolidated file
        exportMetadata(consolidatedRelease, exportFormat, distributorSpecificId);
      } else {
        // Export each release separately
        mockCompletedReleases.forEach(release => {
          exportMetadata(release, exportFormat, distributorSpecificId);
        });
      }

      const selectedDistributor = distributorId !== 'none' ? 
        distributors.find(d => d.id === distributorId)?.name || 'selected distributor' : 
        '';

      const distributorInfo = selectedDistributor ? 
        ` optimized for ${selectedDistributor}` : 
        '';
        
      const filenameSuffix = selectedDistributor ? 
        ` Files are saved with "_${distributorId}" suffix for easier identification.` : 
        '';
        
      const consolidationInfo = consolidateExport && selectedReleases.length > 1 ? 
        ' All selected releases have been consolidated into a single file.' : 
        selectedReleases.length > 1 ? ' Each release has been exported as a separate file.' : '';

      toast({
        title: "Export successful",
        description: `Successfully exported ${selectedReleases.length} releases in ${exportFormat.toUpperCase()} format${distributorInfo}.${consolidationInfo}${filenameSuffix}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the selected releases",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormatChange = (value: string) => {
    setExportFormat(value as ExportFormat);
  };

  const handleDistributorChange = (value: string) => {
    setDistributorId(value);
    // If a specific distributor is selected, we could potentially customize the export format here
    // For now, we'll just update the state
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
          <CardDescription>
            Configure export format and destination
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select value={exportFormat} onValueChange={handleFormatChange}>
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {exportOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        {option.icon}
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {exportOptions.find(o => o.value === exportFormat)?.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {exportOptions.find(o => o.value === exportFormat)?.description}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="distributor">Target Distributor (Optional)</Label>
              <Select value={distributorId} onValueChange={handleDistributorChange}>
                <SelectTrigger id="distributor">
                  <SelectValue placeholder="Select distributor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific distributor</SelectItem>
                  {distributors.map(distributor => (
                    <SelectItem key={distributor.id} value={distributor.id}>
                      {distributor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Selecting a distributor will customize the export format with platform-specific metadata fields, 
                proper formatting requirements, and add a distributor ID to filenames for easy identification.
              </p>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="consolidate" className="text-base font-medium">Consolidation Options</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="consolidate"
                  checked={consolidateExport}
                  onCheckedChange={setConsolidateExport}
                />
                <Label htmlFor="consolidate">Consolidate exports into one file</Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {consolidateExport 
                ? "All selected releases will be consolidated into a single export file with all tracks listed together."
                : "Each selected release will be exported as a separate file."}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Filter Releases</CardTitle>
            <CardDescription>
              Filter by date, labels, artists, and more
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            {showAdvancedFilters && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setDateFilterType('none');
                  setDateRange(undefined);
                  setLabelFilter('all');
                  setArtistFilter('all');
                  setComposerFilter('all');
                  setSearchQuery('');
                  setActiveTab('all');
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardHeader>
        
        {showAdvancedFilters && (
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dateFilter" className="mb-2 block">Date Range</Label>
                  <RadioGroup 
                    value={dateFilterType}
                    onValueChange={(value) => setDateFilterType(value as any)}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="none" id="date-none" />
                      <Label htmlFor="date-none">No date filter</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="day" id="date-day" />
                      <Label htmlFor="date-day">Today</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="week" id="date-week" />
                      <Label htmlFor="date-week">This week</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="month" id="date-month" />
                      <Label htmlFor="date-month">This month</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="year" id="date-year" />
                      <Label htmlFor="date-year">This year</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="date-custom" />
                      <Label htmlFor="date-custom">Custom range</Label>
                    </div>
                  </RadioGroup>
                  
                  {dateFilterType === "custom" && (
                    <div className="mt-2">
                      <DateRangePicker 
                        date={dateRange as any} 
                        onDateChange={(date) => setDateRange(date as ExportDateRange)} 
                      />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="labelFilter" className="mb-2 block">Label</Label>
                  <Select value={labelFilter} onValueChange={setLabelFilter}>
                    <SelectTrigger id="labelFilter">
                      <SelectValue placeholder="Filter by label" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Labels</SelectItem>
                      {Array.from(new Set(releases.map(r => r.label))).filter(Boolean).map(label => (
                        <SelectItem key={label} value={label || ''}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="artistFilter" className="mb-2 block">Artist</Label>
                  <Select value={artistFilter} onValueChange={setArtistFilter}>
                    <SelectTrigger id="artistFilter">
                      <SelectValue placeholder="Filter by artist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Artists</SelectItem>
                      {Array.from(new Set(releases.map(r => r.primaryArtist))).filter(Boolean).map(artist => (
                        <SelectItem key={artist} value={artist}>
                          {artist}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="composerFilter" className="mb-2 block">Composer</Label>
                  <Select value={composerFilter} onValueChange={setComposerFilter}>
                    <SelectTrigger id="composerFilter">
                      <SelectValue placeholder="Filter by composer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Composers</SelectItem>
                      {Array.from(new Set(releases.flatMap(r => r.composers || []))).filter(Boolean).map(composer => (
                        <SelectItem key={composer} value={composer}>
                          {composer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Select Releases</CardTitle>
            <CardDescription>
              Choose the releases to include in your export
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedReleases.length === filteredReleases.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="search"
                    placeholder="Search by title, artist or UPC..."
                    className="w-full pl-3 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="absolute right-3 top-2.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </span>
                </div>
              </div>
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="border rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 w-12 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <span className="sr-only">Select</span>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Artist
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UPC
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tracks
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Release Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReleases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                          No releases found that match your search criteria
                        </td>
                      </tr>
                    ) : (
                      filteredReleases.map((release) => (
                        <tr 
                          key={release.id} 
                          className={selectedReleases.includes(release.id) ? "bg-blue-50" : ""}
                          onClick={() => handleSelectRelease(release.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Checkbox 
                              checked={selectedReleases.includes(release.id)}
                              onCheckedChange={() => handleSelectRelease(release.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <Music className="h-4 w-4 mr-2 text-gray-400" />
                              {release.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {release.primaryArtist}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {release.upc || 'Pending'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={
                              release.status === 'active' ? 'default' :
                              release.status === 'pending' ? 'outline' :
                              'secondary'
                            }>
                              {release.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {release.tracks}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {release.releaseDate}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {selectedReleases.length} releases selected
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedReleases([])}>
              Clear Selection
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={selectedReleases.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export {selectedReleases.length} Releases
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}