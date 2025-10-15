import { useCallback, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileWithPreview extends File {
  preview?: string;
}

interface BulkUploadZoneProps {
  onFilesSelected: (files: FileWithPreview[]) => void;
  accept?: string;
  maxFiles?: number;
  className?: string;
}

export function BulkUploadZone({
  onFilesSelected,
  accept = "audio/*,video/*",
  maxFiles = 50,
  className
}: BulkUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    setIsProcessing(true);
    try {
      const newFiles = Array.from(fileList).slice(0, maxFiles);
      
      // Validate file types
      const invalidFiles = newFiles.filter(file => !file.type.match(/(audio|video).*/));
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid file type",
          description: "Please upload only audio or video files",
          variant: "destructive"
        });
        return;
      }

      // Add preview URLs for supported files
      const filesWithPreviews = await Promise.all(
        newFiles.map(async (file) => {
          const preview = URL.createObjectURL(file);
          return Object.assign(file, { preview });
        })
      );

      setFiles(prev => [...prev, ...filesWithPreviews]);
      onFilesSelected(filesWithPreviews);
    } catch (error) {
      toast({
        title: "Error processing files",
        description: "An error occurred while processing your files",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [maxFiles, onFilesSelected, toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removeFile = useCallback((fileToRemove: FileWithPreview) => {
    setFiles(prev => prev.filter(f => f !== fileToRemove));
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  }, []);

  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 text-center",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          className
        )}
      >
        <input
          type="file"
          accept={accept}
          multiple
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="space-y-4">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <p className="text-lg font-medium">
              Drag and drop your files here
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse (max {maxFiles} files)
            </p>
          </div>
        </div>

        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="font-medium">Selected Files ({files.length})</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-muted"
              >
                <span className="text-sm truncate max-w-[80%]">
                  {file.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
