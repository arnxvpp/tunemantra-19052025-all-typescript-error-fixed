import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Filter, Check } from "lucide-react";

interface FilterButtonProps {
  filterType: 'labels' | 'artists' | 'composers' | 'releaseType' | 'status';
  onApply: (selectedValues: string[]) => void;
  idPrefix: string;
}

export function FilterButton({ filterType, onApply, idPrefix }: FilterButtonProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  
  // Mock filter options data (would come from API in a real app)
  const getFilterOptions = () => {
    switch (filterType) {
      case 'labels':
        return [
          "Universal Music",
          "Indie Records",
          "Digital Records",
          "Sony Music",
          "Warner Records"
        ];
      case 'artists':
        return [
          "Various Artists", 
          "John Smith", 
          "Digital Wave", 
          "Orchestra", 
          "Rock Band"
        ];
      case 'composers':
        return [
          "J. Williams",
          "John Smith",
          "Digital Wave",
          "Beethoven",
          "Rock Band",
          "Modern Composer",
          "Jazz Musician"
        ];
      case 'releaseType':
        return ["Album", "Single", "EP", "Compilation"];
      case 'status':
        return ["Published", "Pending", "Scheduled", "Draft"];
      default:
        return [];
    }
  };

  const options = getFilterOptions();
  
  // Filter options based on search query
  const filteredOptions = searchQuery
    ? options.filter(option => 
        option.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;
  
  // Handle dialog confirmation
  const handleApply = () => {
    onApply(selectedValues);
    setOpen(false);
  };
  
  // Handle checkbox changes
  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      setSelectedValues(selectedValues.filter(v => v !== value));
    } else {
      setSelectedValues([...selectedValues, value]);
    }
  };
  
  // Get title based on filter type
  const getTitle = () => {
    switch (filterType) {
      case 'labels': return 'Filter by Label';
      case 'artists': return 'Filter by Artist';
      case 'composers': return 'Filter by Composer';
      case 'releaseType': return 'Filter by Release Type';
      case 'status': return 'Filter by Status';
      default: return 'Filter';
    }
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        onClick={() => setOpen(true)}
        size="sm"
        className={selectedValues.length > 0 ? "bg-muted" : ""}
      >
        <Filter className="h-4 w-4 mr-2" />
        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
        {selectedValues.length > 0 && (
          <span className="ml-1 rounded-full bg-primary text-primary-foreground w-5 h-5 text-xs flex items-center justify-center">
            {selectedValues.length}
          </span>
        )}
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{getTitle()}</DialogTitle>
          </DialogHeader>
          
          <div className="py-2">
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4"
            />
            
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredOptions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No {filterType} found</p>
              ) : (
                filteredOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`${idPrefix}-${option.replace(/\s+/g, '-').toLowerCase()}`}
                      checked={selectedValues.includes(option)}
                      onCheckedChange={() => handleToggle(option)}
                    />
                    <Label 
                      htmlFor={`${idPrefix}-${option.replace(/\s+/g, '-').toLowerCase()}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <DialogFooter className="sm:justify-between">
            <Button 
              type="button" 
              variant="ghost"
              onClick={() => setSelectedValues([])}
            >
              Clear All
            </Button>
            <Button 
              type="button"
              onClick={handleApply}
            >
              <Check className="h-4 w-4 mr-2" />
              Apply {selectedValues.length > 0 ? `(${selectedValues.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}