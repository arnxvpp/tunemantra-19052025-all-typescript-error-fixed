import { useState, ReactNode } from 'react';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Maximize, Minimize, X } from 'lucide-react';

export interface DashboardPanel {
  id: string;
  title: string;
  description?: string;
  defaultSize: number;
  minimumSize: number;
  component: ReactNode;
}

interface CustomizableDashboardProps {
  panels: DashboardPanel[];
  onLayoutChange?: (layout: { [key: string]: number }) => void;
}

export function CustomizableDashboard({ panels, onLayoutChange }: CustomizableDashboardProps) {
  const [layout, setLayout] = useState<{ [key: string]: number }>(() => 
    panels.reduce((acc, panel) => ({
      ...acc,
      [panel.id]: panel.defaultSize
    }), {})
  );

  const [visiblePanels, setVisiblePanels] = useState<string[]>(() =>
    panels.map(panel => panel.id)
  );
  
  const [expandedPanels, setExpandedPanels] = useState<string[]>([]);

  // Handle panel size changes
  const handleLayoutChange = (sizes: number[]) => {
    const newLayout = visiblePanels.reduce((acc, panelId, index) => ({
      ...acc,
      [panelId]: sizes[index]
    }), {});

    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  };

  // Toggle panel visibility
  const togglePanelVisibility = (panelId: string) => {
    setVisiblePanels(current => 
      current.includes(panelId)
        ? current.filter(id => id !== panelId)
        : [...current, panelId]
    );
    
    // If we're hiding an expanded panel, remove it from expanded list
    if (expandedPanels.includes(panelId)) {
      setExpandedPanels(current => current.filter(id => id !== panelId));
    }
  };

  // Toggle panel expansion
  const togglePanelExpansion = (panelId: string) => {
    setExpandedPanels(current => 
      current.includes(panelId)
        ? current.filter(id => id !== panelId)
        : [...current, panelId]
    );
  };

  // Get visible panel data
  const visiblePanelData = panels.filter(panel => 
    visiblePanels.includes(panel.id)
  );

  // Calculate the direction for PanelGroup
  const direction = visiblePanelData.length <= 2 ? 'horizontal' : 'vertical';

  // Return an empty state if no panels are visible
  if (visiblePanelData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 border rounded-lg bg-muted/10">
        <p className="text-muted-foreground">No analytics panels are currently visible</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {panels.map(panel => (
            <Button 
              key={panel.id} 
              variant="outline" 
              onClick={() => togglePanelVisibility(panel.id)}
            >
              Show {panel.title}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // If only one panel is expanded, show only that panel
  const expandedPanel = expandedPanels.length === 1 
    ? panels.find(panel => panel.id === expandedPanels[0]) 
    : null;

  if (expandedPanel) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{expandedPanel.title}</h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => togglePanelExpansion(expandedPanel.id)}
            title="Minimize panel"
          >
            <Minimize className="h-4 w-4" />
          </Button>
        </div>
        <div className="border rounded-lg overflow-hidden p-0">
          {expandedPanel.component}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {panels.map(panel => (
          <Button 
            key={panel.id} 
            variant={visiblePanels.includes(panel.id) ? "default" : "outline"}
            size="sm"
            onClick={() => togglePanelVisibility(panel.id)}
            className="h-8"
          >
            {panel.title}
          </Button>
        ))}
      </div>
      
      <PanelGroup 
        direction={direction} 
        onLayout={handleLayoutChange}
      >
        {visiblePanelData.map((panel, index) => (
          <>
            <Panel 
              key={panel.id} 
              id={panel.id}
              defaultSize={panel.defaultSize}
              minSize={panel.minimumSize}
            >
              <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between py-2">
                  <CardTitle className="text-base">{panel.title}</CardTitle>
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => togglePanelExpansion(panel.id)}
                      title="Maximize panel"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => togglePanelVisibility(panel.id)}
                      title="Close panel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0 rounded-b-lg overflow-hidden">
                  {panel.component}
                </CardContent>
              </Card>
            </Panel>
            {index < visiblePanelData.length - 1 && (
              <PanelResizeHandle className="w-1 h-1">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-1 h-6 bg-muted rounded-full hover:bg-primary transition-colors"></div>
                </div>
              </PanelResizeHandle>
            )}
          </>
        ))}
      </PanelGroup>
    </div>
  );
}