import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTrackSchema, InsertTrack } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle, 
  CloudUpload, 
  FileWarning, 
  Info, 
  Shield, 
  AlertTriangle 
} from "lucide-react";
import { validateAudioFile, validateVideoFile } from "@/lib/mediaValidation";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { MetadataRequirementForm } from "./MetadataRequirementForm";
import { Progress } from "@/components/ui/progress";
import AudioFingerprintValidator from "@/components/validation/AudioFingerprintValidator";
import { checkServiceStatus } from "@/lib/audioFingerprinting";

export function UploadForm() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("file-upload");
  const [validationStatus, setValidationStatus] = useState<"idle" | "validating" | "success" | "error">("idle");
  const [validationMessage, setValidationMessage] = useState("");
  const [copyrightStatus, setCopyrightStatus] = useState<{
    isValid: boolean;
    hasCopyrightIssues: boolean;
    containsUnclaimedSamples: boolean;
    needsAdditionalReview: boolean;
  } | null>(null);
  const [showCopyrightCheck, setShowCopyrightCheck] = useState(false);
  
  // Check if ACR Cloud service is available
  const acrCloudStatusQuery = useQuery({
    queryKey: ['acrCloudStatus'],
    queryFn: checkServiceStatus,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const form = useForm<InsertTrack>({
    resolver: zodResolver(insertTrackSchema),
    defaultValues: {
      title: "",
      artist: "", // This field seems unused based on schema, keep for now?
      genre: "",
      releaseDate: new Date(), // Use Date object directly
      status: "draft",
      // Store type in metadata
      metadata: { type: "audio" },
    },
  });

  // Validate media files
  const validateMedia = async (file: File, type: 'audio' | 'video') => {
    setValidationStatus("validating");
    const validator = type === 'audio' ? validateAudioFile : validateVideoFile;
    const result = await validator(file);

    if (!result.isValid) {
      setValidationStatus("error");
      setValidationMessage(result.error || "Invalid file format or specifications");
      toast({
        title: "Validation Error",
        description: result.error,
        variant: "destructive",
      });
      return false;
    }
    
    setValidationStatus("success");
    setValidationMessage("File meets the required specifications");
    return true;
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
    
    // Default to audio type if metadata type is not specified
    const metadata = form.getValues('metadata');
    const type = typeof metadata === 'object' && metadata && 'type' in metadata 
      ? (metadata.type as 'audio' | 'video') 
      : 'audio';
    
    // Validate all files
    let allValid = true;
    for (const file of fileArray) {
      if (!(await validateMedia(file, type))) {
        allValid = false;
        break;
      }
    }
    
    if (!allValid) {
      setSelectedFiles([]);
      event.target.value = '';
      return;
    }
    
    // Reset copyright status
    setCopyrightStatus(null);
    setShowCopyrightCheck(true);
    
    // Simulate upload progress
    simulateUploadProgress();
    
    // If all files are valid, we can proceed to the metadata step
    setTimeout(() => {
      setActiveTab("metadata");
    }, 1500);
  };
  
  // Handle fingerprint validation completion
  const handleFingerprintValidationComplete = (result: {
    isValid: boolean;
    hasCopyrightIssues: boolean;
    containsUnclaimedSamples: boolean;
    needsAdditionalReview: boolean;
  }) => {
    setCopyrightStatus(result);
    
    if (result.hasCopyrightIssues) {
      toast({
        title: "Copyright Issues Detected",
        description: "Your upload contains potential copyright conflicts that need to be resolved.",
        variant: "destructive"
      });
    } else if (result.needsAdditionalReview) {
      toast({
        title: "Review Required",
        description: "Your upload requires additional review before distribution.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Copyright Check Passed",
        description: "No copyright issues were detected in your upload.",
      });
    }
  };
  
  // Simulate file upload progress for demo purposes
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          return 100;
        }
        return newProgress;
      });
    }, 150);
  };

  // Handle submission of metadata
  const handleMetadataSubmit = async (metadata: any, tracks: any[]) => {
    // Combine file info with metadata
    const combinedData: InsertTrack = {
      ...form.getValues(),
      title: metadata.releaseTitle,
      // Use primaryArtists array from metadata, ensure it's an array
      primaryArtists: Array.isArray(metadata.primaryArtists) ? metadata.primaryArtists : [metadata.primaryArtist || ''],
      genre: metadata.primaryGenre,
      // Convert Date object to string if API expects string, otherwise keep as Date
      // Assuming API might expect ISO string based on previous code:
      releaseDate: metadata.digitalReleaseDate, //.toISOString(),
      status: "pending",
      metadata: {
        ...metadata,
        tracks,
        fileNames: selectedFiles.map(file => file.name),
      },
    };
    
    // Submit to API
    uploadMutation.mutate(combinedData);
  };

  // API mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: InsertTrack) => {
      // For FTP bulk upload, we'd likely want to extend this to handle the FTP export
      // This would include generating metadata files in the required format
      const res = await apiRequest("POST", "/api/tracks", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast({
        title: "Content submitted successfully",
        description: "Your release has been submitted for distribution.",
      });
      form.reset();
      setSelectedFiles([]);
      setActiveTab("file-upload");
      setValidationStatus("idle");
      setValidationMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file-upload">File Upload</TabsTrigger>
          <TabsTrigger value="metadata" disabled={selectedFiles.length === 0}>Metadata</TabsTrigger>
        </TabsList>
        
        <TabsContent value="file-upload" className="space-y-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Audio Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>File Requirements</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>WAV format required (uncompressed)</li>
                    <li>Sample rate: 44.1kHz or 48kHz</li>
                    <li>Bit depth: 16-bit or 24-bit</li>
                    <li>Maximum file size: 100MB per track</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Form {...form}>
                  <div className="space-y-4">
                    <CloudUpload className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-medium">Drag files here or click to browse</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload WAV files for your release
                    </p>
                    <Input
                      type="file"
                      accept=".wav"
                      multiple
                      className="mx-auto max-w-xs"
                      onChange={handleFileUpload}
                    />
                  </div>
                </Form>
              </div>
              
              {validationStatus === "validating" && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Validating file(s)...</p>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              
              {validationStatus === "success" && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Validation Successful</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {validationMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              {validationStatus === "error" && (
                <Alert variant="destructive">
                  <FileWarning className="h-4 w-4" />
                  <AlertTitle>Validation Failed</AlertTitle>
                  <AlertDescription>
                    {validationMessage}
                  </AlertDescription>
                </Alert>
              )}
              
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-md font-medium">Selected Files</h3>
                  <ul className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="text-sm">
                        {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedFiles.length > 0 && validationStatus === "success" && (
                <Button 
                  className="w-full" 
                  onClick={() => setActiveTab("metadata")}
                >
                  Continue to Metadata
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metadata" className="py-4 space-y-6">
          {/* Copyright fingerprinting card */}
          {selectedFiles.length > 0 && showCopyrightCheck && acrCloudStatusQuery.data?.available && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Copyright Validation
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Validate your content for copyright issues and metadata accuracy
                </p>
              </CardHeader>
              <CardContent>
                <AudioFingerprintValidator 
                  audioFile={selectedFiles[0]}
                  metadata={{
                    title: form.getValues('title') || '',
                    artist: form.getValues('artist') || '',
                  }}
                  onValidationComplete={handleFingerprintValidationComplete}
                />
              </CardContent>
            </Card>
          )}
          
          {/* ACR Cloud service unavailable warning */}
          {acrCloudStatusQuery.isSuccess && !acrCloudStatusQuery.data?.available && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Copyright Validation Unavailable</AlertTitle>
              <AlertDescription>
                The audio fingerprinting service is currently unavailable. You can continue with your upload,
                but copyright validation will be performed at a later time.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Successful validation notice */}
          {copyrightStatus?.isValid && !copyrightStatus.needsAdditionalReview && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Copyright Check Passed</AlertTitle>
              <AlertDescription className="text-green-700">
                No copyright issues were detected in your upload.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Copyright issues warning */}
          {copyrightStatus?.hasCopyrightIssues && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Copyright Issues Detected</AlertTitle>
              <AlertDescription>
                Your upload appears to contain copyrighted material. Please resolve these issues before distribution.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Metadata form card */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Required Metadata</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fill in all required fields for proper distribution
              </p>
            </CardHeader>
            <CardContent>
              <MetadataRequirementForm 
                onSubmit={handleMetadataSubmit}
                existingData={{
                  metadata: {
                    releaseTitle: form.getValues('title'),
                    // Pass as primaryArtists array
                    primaryArtists: [form.getValues('artist') || ''],
                    primaryGenre: form.getValues('genre'),
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}