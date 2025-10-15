import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";

export function AIMetadata() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    // Simulated analysis progress
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    setIsAnalyzing(false);
    setProgress(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          AI Metadata Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Automatically analyze and extract metadata from your audio files including genre classification, BPM detection, and key identification.
        </p>

        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full mb-4"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze Track'
          )}
        </Button>

        {isAnalyzing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">
              Analyzing audio characteristics...
            </p>
          </div>
        )}

        {!isAnalyzing && progress > 0 && (
          <div className="space-y-4 mt-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Genre Detection</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Electronic</Badge>
                <Badge variant="secondary">House</Badge>
                <Badge variant="secondary">Dance</Badge>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Audio Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>BPM</span>
                  <span>128</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Key</span>
                  <span>C Minor</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Duration</span>
                  <span>3:45</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}