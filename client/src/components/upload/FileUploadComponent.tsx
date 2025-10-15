import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { 
  FileAudio, 
  FileImage, 
  Upload, 
  CheckCircle, 
  X, 
  AlertCircle,
  HelpCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from "axios";

interface FileUploadComponentProps {
  allowedTypes: string[];
  maxSize: number; // in MB
  uploadUrl: string;
  onUploadComplete: (fileUrl: string, fileId?: string) => void;
  label: string;
  description?: string;
  uploadType: "audio" | "image" | "document";
  fileId?: string; // For updates or relation to a specific entity
}

export function FileUploadComponent({
  allowedTypes,
  maxSize,
  uploadUrl,
  onUploadComplete,
  label,
  description,
  uploadType,
  fileId
}: FileUploadComponentProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate file type description for UI
  const fileTypeDescription = allowedTypes.map(type => 
    type.replace("audio/", "").replace("image/", "").replace("application/", "").toUpperCase()
  ).join(", ");

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      
      // Validate file type
      if (!allowedTypes.includes(selectedFile.type)) {
        setUploadError(`Invalid file type. Allowed types: ${fileTypeDescription}`);
        toast({
          title: "Invalid file type",
          description: `Please select a ${fileTypeDescription} file.`,
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size
      if (selectedFile.size > maxSize * 1024 * 1024) {
        setUploadError(`File size exceeds ${maxSize}MB limit.`);
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSize}MB.`,
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  // Trigger file input click
  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file upload
  const uploadFile = useCallback(async () => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("file", file);
      if (fileId) {
        formData.append("fileId", fileId);
      }
      
      // Upload with progress tracking
      const response = await axios.post(uploadUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setUploadProgress(percentCompleted);
        },
      });
      
      setUploadSuccess(true);
      onUploadComplete(response.data.fileUrl, response.data.fileId);
      
      toast({
        title: "Upload successful",
        description: "Your file has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(error.response?.data?.message || "Error uploading file. Please try again.");
      
      toast({
        title: "Upload failed",
        description: error.response?.data?.message || "Error uploading file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [file, fileId, onUploadComplete, toast, uploadUrl]);

  // Reset the component
  const resetUpload = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadSuccess(false);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Render icon based on upload type
  const renderIcon = () => {
    switch (uploadType) {
      case "audio":
        return <FileAudio className="h-12 w-12 text-primary/70" />;
      case "image":
        return <FileImage className="h-12 w-12 text-primary/70" />;
      default:
        return <Upload className="h-12 w-12 text-primary/70" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={allowedTypes.join(",")}
          className="hidden"
        />
        
        <div className="space-y-4">
          {description && <p className="text-muted-foreground text-sm">{description}</p>}
          
          {!file && !uploadSuccess && (
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={openFileSelector}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                {renderIcon()}
                <p className="font-medium">
                  Drag and drop your file here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  {uploadType === "audio" ? "Supported formats" : "Allowed types"}: {fileTypeDescription}
                </p>
                <p className="text-sm text-muted-foreground">
                  Max size: {maxSize}MB
                </p>
              </div>
            </div>
          )}
          
          {file && !uploadSuccess && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {renderIcon()}
                  <div>
                    <p className="font-medium truncate max-w-[200px] md:max-w-[300px]">
                      {file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / (1024 * 1024)).toFixed(2)}MB
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={resetUpload}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-sm">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
              
              {uploadError && (
                <div className="flex items-center space-x-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm">{uploadError}</span>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={resetUpload} disabled={isUploading}>
                  Cancel
                </Button>
                <Button onClick={uploadFile} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {uploadSuccess && (
            <div className="flex flex-col items-center justify-center space-y-3 p-4 border rounded-lg bg-primary/5">
              <CheckCircle className="h-8 w-8 text-primary" />
              <p className="font-medium">Upload Complete</p>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                {uploadType === "audio" && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="destructive" onClick={resetUpload}>
                          <X className="mr-2 h-4 w-4" />
                          Discard & Upload New WAV
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[250px] p-3">
                        <div className="space-y-1">
                          <p className="font-medium">Why replace your WAV file?</p>
                          <ul className="text-xs list-disc pl-4 space-y-1">
                            <li>Quality issues in the current file</li>
                            <li>Wrong version or mastering</li>
                            <li>Upload a higher sample rate version</li>
                            <li>Replace with better dynamic range</li>
                          </ul>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Button variant="outline" onClick={resetUpload}>
                  Upload Another File
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}