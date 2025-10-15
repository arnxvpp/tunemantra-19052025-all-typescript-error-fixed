import React, { useState, useEffect } from 'react';
import { FilterButton } from './FilterButton';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from 'react-day-picker';
import { DateRangePicker } from "../analytics/date-range-picker";
import { cn } from '@/lib/utils';

export interface FilterOptions {
  dateRange?: DateRange;
  artists: string[];
  labels: string[];
  composers: string[];
  releaseType: string;
  statusFilters: {
    published: boolean;
    pending: boolean;
    scheduled: boolean;
    draft: boolean;
  };
  autoDistribute: boolean;
}

interface ReleaseFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  initialFilters?: Partial<FilterOptions>;
  batchMode?: boolean;
}

export function ReleaseFilters({ 
  onFilterChange, 
  initialFilters,
  batchMode = false
}: ReleaseFiltersProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialFilters?.dateRange);
  const [artists, setArtists] = useState<string[]>(initialFilters?.artists || []);
  const [labels, setLabels] = useState<string[]>(initialFilters?.labels || []);
  const [composers, setComposers] = useState<string[]>(initialFilters?.composers || []);
  const [releaseType, setReleaseType] = useState<string>(initialFilters?.releaseType || 'all');
  const [statusFilters, setStatusFilters] = useState<FilterOptions['statusFilters']>(
    initialFilters?.statusFilters || {
      published: true,
      pending: true,
      scheduled: true,
      draft: false
    }
  );
  const [autoDistribute, setAutoDistribute] = useState<boolean>(initialFilters?.autoDistribute || false);

  // Combine all filter values and propagate changes up
  useEffect(() => {
    const filters: FilterOptions = {
      dateRange,
      artists,
      labels,
      composers,
      releaseType,
      statusFilters,
      autoDistribute
    };
    
    onFilterChange(filters);
  }, [dateRange, artists, labels, composers, releaseType, statusFilters, autoDistribute, onFilterChange]);

  // Handler for status filter toggles
  const handleStatusToggle = (status: keyof FilterOptions['statusFilters']) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Handle release type selection
  const handleReleaseTypeSelect = (type: string) => {
    setReleaseType(type);
  };

  // Mock artist, label, composer lists (would be fetched from API in a real app)
  const availableArtists = [
    "Various Artists", 
    "John Smith", 
    "Digital Wave", 
    "Orchestra", 
    "Rock Band"
  ];
  
  const availableLabels = [
    "Universal Music",
    "Indie Records",
    "Digital Records",
    "Sony Music",
    "Warner Records"
  ];
  
  const availableComposers = [
    "J. Williams",
    "John Smith",
    "Digital Wave",
    "Beethoven",
    "Rock Band",
    "Modern Composer",
    "Jazz Musician"
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Filters</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setDateRange(undefined);
            setArtists([]);
            setLabels([]);
            setComposers([]);
            setReleaseType('all');
            setStatusFilters({
              published: true,
              pending: true,
              scheduled: true,
              draft: false
            });
            setAutoDistribute(false);
          }}
        >
          Reset All
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Range Filter */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <DateRangePicker 
            date={dateRange} 
            onDateChange={setDateRange} 
            className="w-full" 
          />
        </div>
        
        {/* Artists Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Artists</Label>
            {artists.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={() => setArtists([])}
              >
                Clear
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <FilterButton 
              filterType="artists" 
              onApply={(selected) => setArtists(selected)}
              idPrefix="artists"
            />
            
            {artists.map(artist => (
              <Badge 
                key={artist} 
                variant="secondary"
                className="flex items-center gap-1"
              >
                {artist}
                <button 
                  className="ml-1 rounded-full hover:bg-muted" 
                  onClick={() => setArtists(artists.filter(a => a !== artist))}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Labels Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Labels</Label>
            {labels.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={() => setLabels([])}
              >
                Clear
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <FilterButton 
              filterType="labels" 
              onApply={(selected) => setLabels(selected)}
              idPrefix="labels"
            />
            
            {labels.map(label => (
              <Badge 
                key={label} 
                variant="secondary"
                className="flex items-center gap-1"
              >
                {label}
                <button 
                  className="ml-1 rounded-full hover:bg-muted" 
                  onClick={() => setLabels(labels.filter(l => l !== label))}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Composers Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Composers</Label>
            {composers.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={() => setComposers([])}
              >
                Clear
              </Button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <FilterButton 
              filterType="composers" 
              onApply={(selected) => setComposers(selected)}
              idPrefix="composers"
            />
            
            {composers.map(composer => (
              <Badge 
                key={composer} 
                variant="secondary"
                className="flex items-center gap-1"
              >
                {composer}
                <button 
                  className="ml-1 rounded-full hover:bg-muted" 
                  onClick={() => setComposers(composers.filter(c => c !== composer))}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
      
      {/* Release Type Selector */}
      <div className="space-y-2">
        <Label>Release Type</Label>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={releaseType === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleReleaseTypeSelect('all')}
          >
            All
          </Button>
          <Button 
            variant={releaseType === 'album' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleReleaseTypeSelect('album')}
          >
            Albums
          </Button>
          <Button 
            variant={releaseType === 'single' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleReleaseTypeSelect('single')}
          >
            Singles
          </Button>
          <Button 
            variant={releaseType === 'ep' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleReleaseTypeSelect('ep')}
          >
            EPs
          </Button>
        </div>
      </div>
      
      {/* Status Filters */}
      <div className="space-y-2">
        <Label>Status</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <Switch 
              id="filter-published" 
              checked={statusFilters.published}
              onCheckedChange={() => handleStatusToggle('published')}
            />
            <Label htmlFor="filter-published">Published</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="filter-pending" 
              checked={statusFilters.pending}
              onCheckedChange={() => handleStatusToggle('pending')}
            />
            <Label htmlFor="filter-pending">Pending</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="filter-scheduled" 
              checked={statusFilters.scheduled}
              onCheckedChange={() => handleStatusToggle('scheduled')}
            />
            <Label htmlFor="filter-scheduled">Scheduled</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="filter-draft" 
              checked={statusFilters.draft}
              onCheckedChange={() => handleStatusToggle('draft')}
            />
            <Label htmlFor="filter-draft">Draft</Label>
          </div>
        </div>
      </div>
      
      {/* Auto-distribute option (only for batch mode) */}
      {batchMode && (
        <div className="pt-2 border-t">
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-distribute" 
              checked={autoDistribute}
              onCheckedChange={setAutoDistribute}
            />
            <Label htmlFor="auto-distribute">
              Auto-distribute to selected platform after export
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}