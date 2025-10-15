import { CatalogLayout } from "./layout";
import { BulkUploadZone } from "@/components/upload/BulkUploadZone";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { validateAudioFile } from "@/lib/mediaValidation";

export default function BulkUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const validateFiles = async (files: File[]): Promise<boolean> => {
    for (const file of files) {
      const result = await validateAudioFile(file);
      if (!result.isValid) {
        toast({
          title: `Validation Error: ${file.name}`,
          description: result.error,
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const handleFilesSelected = async (files: File[]) => {
    if (await validateFiles(files)) {
      setSelectedFiles(files);
    } else {
      setSelectedFiles([]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    // Validate files again before upload
    if (!(await validateFiles(selectedFiles))) {
      return;
    }

    setIsUploading(true);
    const formData = new FormData();

    try {
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/bulk-upload', {
        method: 'POST',
        body: formData,
        // TODO: Implement upload progress tracking using XMLHttpRequest or a library like Axios
        // onUploadProgress: (progressEvent) => { ... }, // Removed invalid fetch option
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      toast({
        title: "Success",
        description: `Successfully uploaded ${selectedFiles.length} files`,
      });

      setSelectedFiles([]);
      setUploadProgress(0);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <CatalogLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Bulk Upload</h1>
            <p className="text-sm text-muted-foreground">
              Upload multiple audio tracks at once. Supported formats: WAV (44.1kHz/48kHz, 16/24-bit)
            </p>
          </div>
          {selectedFiles.length > 0 && (
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              Upload {selectedFiles.length} Files
            </Button>
          )}
        </div>

        <div className="border rounded-lg p-4 bg-card">
          <BulkUploadZone
            onFilesSelected={handleFilesSelected}
            accept=".wav"
            maxFiles={50}
          />

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Selected Files</h3>
              <ul className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              Uploading files... {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
      </div>
    </CatalogLayout>
  );
}