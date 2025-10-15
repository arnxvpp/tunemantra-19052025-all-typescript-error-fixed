import { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { BulkUploadZone } from "@/components/upload/BulkUploadZone";
import { ReleaseMetadataForm } from "@/components/upload/ReleaseMetadataForm";
import { InsertRelease } from "@shared/schema";

export default function NewReleasePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth(); // Use logout function directly

  const onClose = () => {
    setLocation("/catalog/releases");
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleMetadataSubmit = async (data: Partial<InsertRelease>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to create releases",
        variant: "destructive",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      // Add metadata
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/releases', true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(progress);
        }
      };

      const response = await new Promise((resolve, reject) => {
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error('Upload failed'));
        xhr.send(formData);
      });

      if (xhr.status !== 200) {
        throw new Error('Failed to create release');
      }

      toast({
        title: "Success",
        description: "Release created successfully",
      });

      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create release",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleLogout = async () => {
    try {
      await logout(); // Call logout directly
      setLocation("/auth");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Drawer open={true} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[90vh] overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl">
          <DrawerHeader className="sticky top-0 z-50 bg-background border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <DrawerTitle>Create New Release</DrawerTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  aria-label="Logout"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Logout
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  aria-label="Close dialog"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DrawerHeader>

          <div className="px-6 py-8 space-y-8">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Upload Files</h2>
              <p className="text-sm text-muted-foreground">
                Upload your audio or video files. We support WAV for audio and MP4/MOV for video.
              </p>
              <div className="mt-4">
                <BulkUploadZone
                  onFilesSelected={handleFilesSelected}
                  accept="audio/*,video/*"
                  maxFiles={50}
                />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold mb-2">Release Details</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Fill in the metadata for your release. This information will be used for distribution and tracking.
              </p>
              <ReleaseMetadataForm
                onSubmit={handleMetadataSubmit}
                isSubmitting={isUploading}
              />
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
        </div>
      </DrawerContent>
    </Drawer>
  );
}