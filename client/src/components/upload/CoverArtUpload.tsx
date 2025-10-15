import React, { useState } from "react";
import { FileUploadComponent } from "./FileUploadComponent";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Image, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CoverArtUploadProps {
  onUploadComplete: (fileUrl: string, fileId?: string) => void;
  releaseId?: string;
  currentArtwork?: string;
}

export function CoverArtUpload({
  onUploadComplete,
  releaseId,
  currentArtwork
}: CoverArtUploadProps) {
  const [artwork, setArtwork] = useState<string | null>(currentArtwork || null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Cover art specific configuration
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 10; // 10MB
  
  const handleUploadComplete = (fileUrl: string, fileId?: string) => {
    setArtwork(fileUrl);
    // Validate image dimensions and quality
    validateArtwork(fileUrl).then(() => {
      onUploadComplete(fileUrl, fileId);
    });
  };
  
  const validateArtwork = async (url: string): Promise<void> => {
    return new Promise((resolve) => {
      // Use document.createElement for better type safety
      const img = document.createElement('img');
      const errors: string[] = [];
      
      img.onload = () => {
        // Check dimensions (minimum 3000x3000 for best quality)
        if (img.width < 3000 || img.height < 3000) {
          errors.push("Image resolution is below 3000x3000px. Higher resolution is recommended for optimal quality.");
        }
        
        // Check aspect ratio (should be square 1:1)
        if (Math.abs(img.width - img.height) > 10) { // Allow small tolerance
          errors.push("Image is not square. A 1:1 aspect ratio is required for most platforms.");
        }
        
        setValidationErrors(errors);
        resolve();
      };
      
      img.onerror = () => {
        errors.push("Failed to load image for validation.");
        setValidationErrors(errors);
        resolve();
      };
      
      img.src = url;
    });
  };
  
  const removeArtwork = () => {
    setArtwork(null);
    setValidationErrors([]);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Release Artwork</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!artwork ? (
          <FileUploadComponent
            allowedTypes={allowedTypes}
            maxSize={maxSize}
            uploadUrl="/api/upload"
            onUploadComplete={handleUploadComplete}
            label="Upload Cover Art"
            description="Upload square artwork (3000x3000px recommended). Supported formats: JPG, PNG, WebP."
            uploadType="image"
            fileId={releaseId}
          />
        ) : (
          <div className="space-y-4">
            <div className="max-w-xs mx-auto">
              <AspectRatio ratio={1/1} className="bg-muted overflow-hidden rounded-md border">
                <img 
                  src={artwork} 
                  alt="Release Cover Art" 
                  className="object-cover w-full h-full"
                />
              </AspectRatio>
            </div>
            
            {validationErrors.length > 0 && (
              // Change variant to "destructive" for issues/warnings
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Artwork Issues</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-4 mt-2 text-sm">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            {validationErrors.length === 0 && (
              <Alert variant="success" className="bg-primary/10 border-primary/20">
                <CheckCircle className="h-4 w-4 text-primary" />
                <AlertTitle>Artwork Validated</AlertTitle>
                <AlertDescription>Your cover art meets the requirements for distribution.</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={removeArtwork}>
                <X className="h-4 w-4 mr-2" />
                Remove Artwork
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}