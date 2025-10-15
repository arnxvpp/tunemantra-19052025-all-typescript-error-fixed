import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DateRange } from 'react-day-picker';

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

interface FilteredReleaseListProps {
  releases: Release[];
  mode: 'single' | 'batch';
  filters: FilterOptions;
  selectedReleaseId?: number | null;
  selectedReleases?: number[];
  onReleaseSelect: (id: number) => void;
  onReleaseToggle: (id: number) => void;
  onSelectAll: () => void;
  batchSelectAll: boolean;
}

interface FilterOptions {
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

export function FilteredReleaseList({
  releases,
  mode,
  filters,
  selectedReleaseId,
  selectedReleases = [],
  onReleaseSelect,
  onReleaseToggle,
  onSelectAll,
  batchSelectAll
}: FilteredReleaseListProps) {
  const [filteredReleases, setFilteredReleases] = useState<Release[]>(releases);
  
  // Apply filters whenever releases or filters change
  useEffect(() => {
    let filtered = [...releases];
    
    // Date range filter
    if (filters.dateRange && filters.dateRange.from && filters.dateRange.to) {
      const fromDate = new Date(filters.dateRange.from);
      const toDate = new Date(filters.dateRange.to);
      filtered = filtered.filter(release => {
        const releaseDate = new Date(release.releaseDate || release.createdAt);
        return releaseDate >= fromDate && releaseDate <= toDate;
      });
    }
    
    // Artist filter
    if (filters.artists.length > 0) {
      filtered = filtered.filter(release => 
        filters.artists.includes(release.artist) || 
        (release.primaryArtist && filters.artists.includes(release.primaryArtist))
      );
    }
    
    // Label filter
    if (filters.labels.length > 0) {
      filtered = filtered.filter(release => 
        release.label && filters.labels.includes(release.label)
      );
    }
    
    // Composer filter
    if (filters.composers.length > 0) {
      filtered = filtered.filter(release => 
        release.composers && release.composers.some(composer => 
          filters.composers.includes(composer)
        )
      );
    }
    
    // Release type filter
    if (filters.releaseType !== "all") {
      filtered = filtered.filter(release => {
        // This is a simplification - in a real app, you'd have a release type field
        if (filters.releaseType === "album") return release.tracks && release.tracks > 7;
        if (filters.releaseType === "single") return release.tracks && release.tracks <= 3;
        if (filters.releaseType === "ep") return release.tracks && release.tracks > 3 && release.tracks <= 7;
        return true;
      });
    }
    
    // Status filter
    filtered = filtered.filter(release => {
      if (release.status === "published" && !filters.statusFilters.published) return false;
      if (release.status === "pending" && !filters.statusFilters.pending) return false;
      if (release.status === "scheduled" && !filters.statusFilters.scheduled) return false;
      if (release.status === "draft" && !filters.statusFilters.draft) return false;
      return true;
    });
    
    setFilteredReleases(filtered);
  }, [releases, filters]);
  
  return (
    <div>
      {mode === 'single' ? (
        <div className="space-y-4">
          <Select
            value={selectedReleaseId?.toString() || ""}
            onValueChange={(value) => onReleaseSelect(parseInt(value))}
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
                onCheckedChange={onSelectAll} 
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
                onClick={() => onReleaseToggle(release.id)}
              >
                <Checkbox 
                  checked={selectedReleases.includes(release.id)} 
                  onCheckedChange={() => onReleaseToggle(release.id)}
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
  );
}