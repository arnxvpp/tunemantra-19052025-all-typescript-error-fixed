import React from "react";
import { FileUploadComponent } from "./FileUploadComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AudioFileUploadProps {
  onUploadComplete: (fileUrl: string, fileId?: string) => void;
  trackId?: string;
  label?: string;
  description?: string;
}

export function AudioFileUpload({
  onUploadComplete,
  trackId,
  label = "Upload Audio File",
  description = "Upload your audio file for distribution. Supported formats include MP3, WAV, FLAC, AAC, and OGG."
}: AudioFileUploadProps) {
  // Audio-specific configuration
  const allowedTypes = ["audio/mpeg", "audio/wav", "audio/flac", "audio/aac", "audio/ogg"];
  const maxSize = 50; // 50MB
  
  return (
    <FileUploadComponent
      allowedTypes={allowedTypes}
      maxSize={maxSize}
      uploadUrl="/api/upload"
      onUploadComplete={onUploadComplete}
      label={label}
      description={description}
      uploadType="audio"
      fileId={trackId}
    />
  );
}

export function AudioBatchUpload({ 
  onComplete 
}: { 
  onComplete: (files: { fileUrl: string, fileId: string }[]) => void 
}) {
  const [uploadedFiles, setUploadedFiles] = React.useState<{ fileUrl: string, fileId: string }[]>([]);
  
  const handleFileUpload = (fileUrl: string, fileId?: string) => {
    if (fileId) {
      setUploadedFiles(prev => [...prev, { fileUrl, fileId }]);
    }
  };
  
  React.useEffect(() => {
    if (uploadedFiles.length > 0) {
      onComplete(uploadedFiles);
    }
  }, [uploadedFiles, onComplete]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Audio Upload</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground">
          Upload multiple audio files for your release. Each uploaded track will be added to your release.
        </p>
        
        <AudioFileUpload
          onUploadComplete={handleFileUpload}
          label="Upload Tracks"
          description="Add audio tracks one by one. Supported formats: MP3, WAV, FLAC, AAC, OGG."
        />
        
        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Uploaded Files ({uploadedFiles.length})</h3>
            <ul className="space-y-1">
              {uploadedFiles.map((file, index) => (
                <li key={file.fileId} className="text-sm">
                  Track {index + 1}: {file.fileUrl.split('/').pop()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}