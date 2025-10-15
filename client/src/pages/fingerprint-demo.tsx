import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  FileAudio,
  Fingerprint,
  Music,
  Upload,
  X,
  AlertTriangle,
  BarChart4
} from 'lucide-react';

// FingerPrintResult interface to type our response data
interface FingerprintResult {
  success: boolean;
  results?: {
    acrid?: string;
    title?: string;
    artists?: { name: string }[];
    album?: { name: string };
    external_ids?: {
      isrc?: string;
      upc?: string;
    };
    confidence?: number;
    duration_ms?: number;
  }[];
  metadata?: any;
  message?: string;
}

// ServiceStatus interface to type the service status response
interface ServiceStatus {
  success: boolean;
  status: string;
  message?: string;
}

export default function FingerprintDemoPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    title: '',
    artist: '',
    album: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store the result after identification
  const [identificationResult, setIdentificationResult] = useState<FingerprintResult | null>(null);

  // Mutation for uploading and identifying audio
  const identifyMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error('No file selected');
      }

      setIsUploading(true);
      setUploadProgress(0);

      // Create form data
      const formData = new FormData();
      formData.append('audioFile', file);
      
      // Add metadata if provided
      if (metadata.title) formData.append('title', metadata.title);
      if (metadata.artist) formData.append('artist', metadata.artist);
      if (metadata.album) formData.append('album', metadata.album);

      // Simulated progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + (100 - prev) * 0.1;
          return next > 95 ? 95 : next;
        });
      }, 300);

      try {
        // Make the API request
        const response = await apiRequest<FingerprintResult>('/api/audio-fingerprinting/identify', {
          method: 'POST',
          data: formData, // Use 'data' instead of 'body' for apiRequest
        });

        clearInterval(progressInterval);
        setUploadProgress(100);
        
        return response;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    onSuccess: (data) => {
      setIdentificationResult(data);
      toast({
        title: 'Audio Identified',
        description: 'Your audio file has been successfully analyzed',
        variant: 'default',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Identification Failed',
        description: error.message || 'There was a problem identifying your audio',
        variant: 'destructive',
      });
    }
  });

  // Query to check if the service is ready
  const { data: serviceStatus, isLoading: checkingService } = useQuery<ServiceStatus>({
    queryKey: ['/api/audio-fingerprinting/status'],
    enabled: true,
  });

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    
    // Reset previous results when new file is selected
    if (selectedFile) {
      setIdentificationResult(null);
    }
  };

  // Handle metadata input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file drag over
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      // Check if it's an audio file
      if (droppedFile.type.startsWith('audio/')) {
        setFile(droppedFile);
        setIdentificationResult(null);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload an audio file (MP3, WAV, etc.)',
          variant: 'destructive',
        });
      }
    }
  };

  // Handle submit for identification
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select an audio file to identify',
        variant: 'destructive',
      });
      return;
    }
    
    identifyMutation.mutate();
  };

  // Clear file selection
  const clearFile = () => {
    setFile(null);
    setIdentificationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Calculate confidence visualization
  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence > 0.8) return 'text-green-500';
    if (confidence > 0.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceWidth = (confidence?: number) => {
    if (!confidence) return '0%';
    return `${Math.round(confidence * 100)}%`;
  };

  // Render file preview/info
  const renderFileInfo = () => {
    if (!file) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center">
              <FileAudio className="h-5 w-5 mr-2 text-primary" />
              Selected Audio File
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={clearFile}
              aria-label="Clear file selection"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <div className="font-medium">{file.name}</div>
            <div className="text-muted-foreground">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render service status
  const renderServiceStatus = () => {
    if (checkingService) {
      return (
        <Alert className="mb-6">
          <Skeleton className="h-5 w-5 mr-2" />
          <AlertTitle>
            <Skeleton className="h-4 w-40" />
          </AlertTitle>
          <AlertDescription>
            <Skeleton className="h-3 w-60 mt-2" />
          </AlertDescription>
        </Alert>
      );
    }

    if (!serviceStatus?.success || serviceStatus?.status !== 'ready') {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-5 w-5 mr-2" />
          <AlertTitle>Service Unavailable</AlertTitle>
          <AlertDescription>
            The audio fingerprinting service is currently unavailable or not properly configured.
            Please try again later or contact support.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert variant="default" className="mb-6 border-green-200 bg-green-50">
        <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
        <AlertTitle className="text-green-800">Service Ready</AlertTitle>
        <AlertDescription className="text-green-700">
          The audio fingerprinting service is available and ready to process your uploads.
        </AlertDescription>
      </Alert>
    );
  };

  // Render identification results
  const renderResults = () => {
    if (!identificationResult) return null;

    // No matches found
    if (!identificationResult.results || identificationResult.results.length === 0) {
      return (
        <Card className="mt-8 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              No Matches Found
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Your audio couldn't be identified in our database. This could mean your track is original or it simply hasn't been indexed yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white rounded-md p-4 text-sm">
              <p className="font-medium mb-2">What this means:</p>
              <ul className="space-y-1 list-disc pl-5 text-muted-foreground">
                <li>Your track may be completely original</li>
                <li>If you're using samples, they might be cleared or unrecognizable</li>
                <li>The track might be too new or obscure to be in our database</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-yellow-50/50 pt-4">
            <p className="text-sm text-yellow-700">
              If you're concerned about potential copyright issues, consider running additional verification checks.
            </p>
          </CardFooter>
        </Card>
      );
    }

    // Match found
    const match = identificationResult.results[0];
    const artistName = match.artists && match.artists.length > 0 ? match.artists[0].name : 'Unknown Artist';
    const albumName = match.album?.name || 'Unknown Album';
    const confidence = match.confidence || 0;
    const confidenceColor = getConfidenceColor(confidence);
    
    return (
      <Card className="mt-8">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center">
                <Music className="h-5 w-5 mr-2 text-primary" />
                Match Found
              </CardTitle>
              <CardDescription>
                Your audio has been identified with {(confidence * 100).toFixed(0)}% confidence
              </CardDescription>
            </div>
            <Badge 
              variant={confidence > 0.8 ? "default" : confidence > 0.5 ? "outline" : "destructive"}
              className={confidence > 0.8 ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
            >
              {confidence > 0.8 ? "High Match" : confidence > 0.5 ? "Possible Match" : "Low Confidence"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="match" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="match">Match Details</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="confidence">Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="match" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Track Title</Label>
                  <div className="font-medium">{match.title || 'Unknown Title'}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Artist</Label>
                  <div className="font-medium">{artistName}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Album</Label>
                  <div className="font-medium">{albumName}</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">ISRC</Label>
                  <div className="font-medium">
                    {match.external_ids?.isrc || 'Not available'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">UPC</Label>
                  <div className="font-medium">
                    {match.external_ids?.upc || 'Not available'}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Duration</Label>
                  <div className="font-medium">
                    {match.duration_ms 
                      ? `${Math.floor(match.duration_ms / 60000)}:${(Math.floor(match.duration_ms / 1000) % 60).toString().padStart(2, '0')}`
                      : 'Unknown'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">ACR ID</Label>
                  <div className="font-medium text-xs overflow-hidden text-ellipsis">
                    {match.acrid || 'Not available'}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="metadata" className="space-y-6 mt-4">
              <div className="space-y-1">
                <h3 className="font-medium">Metadata Comparison</h3>
                <p className="text-sm text-muted-foreground">
                  Compare your metadata with what was detected in the audio
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="text-xs font-medium text-muted-foreground">Field</div>
                <div className="text-xs font-medium text-muted-foreground">Your Data</div>
                <div className="text-xs font-medium text-muted-foreground">Detected</div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm py-2 font-medium">Title</div>
                <div className="text-sm py-2 bg-muted/20 px-2 rounded">
                  {metadata.title || <span className="text-muted-foreground italic">Not provided</span>}
                </div>
                <div className={`text-sm py-2 bg-muted/20 px-2 rounded ${
                  metadata.title && match.title && metadata.title.toLowerCase() !== match.title.toLowerCase() 
                    ? 'text-amber-600 bg-amber-50' 
                    : ''
                }`}>
                  {match.title || <span className="text-muted-foreground italic">Not detected</span>}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm py-2 font-medium">Artist</div>
                <div className="text-sm py-2 bg-muted/20 px-2 rounded">
                  {metadata.artist || <span className="text-muted-foreground italic">Not provided</span>}
                </div>
                <div className={`text-sm py-2 bg-muted/20 px-2 rounded ${
                  metadata.artist && artistName && metadata.artist.toLowerCase() !== artistName.toLowerCase() 
                    ? 'text-amber-600 bg-amber-50' 
                    : ''
                }`}>
                  {artistName || <span className="text-muted-foreground italic">Not detected</span>}
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm py-2 font-medium">Album</div>
                <div className="text-sm py-2 bg-muted/20 px-2 rounded">
                  {metadata.album || <span className="text-muted-foreground italic">Not provided</span>}
                </div>
                <div className={`text-sm py-2 bg-muted/20 px-2 rounded ${
                  metadata.album && albumName && metadata.album.toLowerCase() !== albumName.toLowerCase() 
                    ? 'text-amber-600 bg-amber-50' 
                    : ''
                }`}>
                  {albumName || <span className="text-muted-foreground italic">Not detected</span>}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="confidence" className="space-y-6 mt-4">
              <div className="space-y-1">
                <h3 className="font-medium">Match Confidence</h3>
                <p className="text-sm text-muted-foreground">
                  Analysis of how confident the fingerprinting system is in this match
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Match Confidence</span>
                    <span className={confidenceColor}>{(confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${confidence > 0.8 ? 'bg-green-500' : confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: getConfidenceWidth(confidence) }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low Confidence</span>
                    <span>High Confidence</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-md border border-muted bg-muted/10">
                  <h4 className="text-sm font-medium mb-2">What This Means</h4>
                  {confidence > 0.8 ? (
                    <p className="text-sm text-green-700">
                      <strong>High Confidence Match:</strong> The fingerprinting system is very confident that the identified track matches your audio. 
                      This usually indicates a clear match with the original recording.
                    </p>
                  ) : confidence > 0.5 ? (
                    <p className="text-sm text-yellow-700">
                      <strong>Possible Match:</strong> The system found similarities between your audio and the identified track, 
                      but there might be differences in quality, mixing, or some modifications. Manual verification is recommended.
                    </p>
                  ) : (
                    <p className="text-sm text-red-700">
                      <strong>Low Confidence Match:</strong> The system detected some similarities, but this could be a false positive.
                      The audio might contain samples from the identified track or have passing similarities. Take this result with caution.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <Button variant="ghost" size="sm" onClick={() => setIdentificationResult(null)}>
            Check Another File
          </Button>
          {match.external_ids?.isrc && (
            <Button variant="outline" size="sm">
              View Full Rights Info
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-8">
        <Link href="/audio-fingerprinting" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Audio Fingerprinting
        </Link>
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Fingerprint className="h-8 w-8 mr-2 text-primary" />
          Audio Fingerprint Demo
        </h1>
        <p className="text-muted-foreground">
          Upload an audio file to identify it, check for copyright conflicts, and validate metadata
        </p>
      </div>

      {renderServiceStatus()}

      <Card>
        <CardHeader>
          <CardTitle>Upload Audio File</CardTitle>
          <CardDescription>
            MP3, WAV, M4A, OGG, or FLAC audio files up to 10MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Drag and drop area */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  file ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="audio-input"
                />
                
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <FileAudio className="h-10 w-10 text-muted-foreground/70" />
                  </div>
                  <h3 className="text-base font-medium">
                    {file ? 'File selected' : 'Drag and drop your audio file here'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {file ? file.name : 'or click the button below to browse'}
                  </p>
                </div>
                
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4"
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {file ? 'Change File' : 'Select File'}
                </Button>
              </div>
              
              {/* File info display */}
              {renderFileInfo()}
              
              {/* Optional metadata */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Optional Metadata</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    Add information about your track to compare with detection results
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Track Title</Label>
                    <Input 
                      id="title"
                      name="title"
                      placeholder="Enter track title"
                      value={metadata.title}
                      onChange={handleInputChange}
                      disabled={isUploading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="artist">Artist</Label>
                    <Input 
                      id="artist"
                      name="artist"
                      placeholder="Enter artist name"
                      value={metadata.artist}
                      onChange={handleInputChange}
                      disabled={isUploading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="album">Album</Label>
                  <Input 
                    id="album"
                    name="album"
                    placeholder="Enter album name (optional)"
                    value={metadata.album}
                    onChange={handleInputChange}
                    disabled={isUploading}
                  />
                </div>
              </div>
              
              {/* Submit button */}
              <div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={!file || isUploading || !serviceStatus?.success}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-4 w-4 mr-2" />
                      Identify Audio
                    </>
                  )}
                </Button>
                
                {isUploading && (
                  <div className="mt-4 space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {uploadProgress < 100 ? 'Analyzing audio fingerprint...' : 'Finalizing results...'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Results section */}
      {renderResults()}
    </div>
  );
}