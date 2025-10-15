import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ContentAnalysis {
  tags: {
    genres: string[];
    moods: string[];
    themes: string[];
    explicit: boolean;
    languages: string[];
  };
  analysis: {
    summary: string;
    qualityScore: number;
    contentWarnings: string[];
    suggestedImprovements: string[];
  };
}

interface ContentAnalyzerProps {
  title: string;
  artistName: string;
  type: "audio" | "video";
  onAnalysisComplete: (analysis: ContentAnalysis) => void;
}

export function ContentAnalyzer({ 
  title, 
  artistName, 
  type, 
  onAnalysisComplete 
}: ContentAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/releases/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          artistName,
          type,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const analysis = await response.json();
      onAnalysisComplete(analysis);

      toast({
        title: "Analysis Complete",
        description: "AI content analysis has been completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze content",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          AI Content Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          Let AI analyze your content to generate tags, detect themes, and provide suggestions.
        </p>
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !title || !artistName}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all duration-300"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Content"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
