import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';

interface ApplyFilterButtonProps {
  filterType: 'labels' | 'artists' | 'composers' | 'status' | 'releaseType';
  idPrefix: string;
  onApply: (selected: string[]) => void;
}

export function ApplyFilterButton({ filterType, idPrefix, onApply }: ApplyFilterButtonProps) {
  const { toast } = useToast();
  
  const handleApply = () => {
    // Get all checked checkboxes with the specific prefix
    const checkboxes = document.querySelectorAll(`input[id^="${idPrefix}"]:checked`);
    const selected = Array.from(checkboxes).map(cb => {
      const element = cb as HTMLInputElement;
      return element.id.replace(`${idPrefix}`, '');
    });
    
    // Apply the filters
    onApply(selected);
    
    // Show toast notification
    toast({
      title: "Filters applied",
      description: `Applied ${selected.length} ${filterType} filters.`
    });
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={handleApply}
    >
      Apply
    </Button>
  );
}