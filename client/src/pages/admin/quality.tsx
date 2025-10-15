import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, XCircle, BarChart3, Download, Music, Image as ImageIcon, 
  Film, FileAudio2, AlertTriangle, Upload, Maximize, Disc, RefreshCw, Play, Pause
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Define more specific typings for content items
type MediaType = "audio" | "video" | "image";
type Status = "pending" | "approved" | "rejected";

interface QualityScore {
  overall: number;
  // Audio specific
  bitrate?: number;
  format?: number;
  metadata?: number;
  sampleRate?: number;
  channels?: number;
  duration?: number;

  // Image specific
  dimensions?: number;
  colorProfile?: number;
  
  // Shared between image and video
  resolution?: number;

  // Video specific
  framerate?: number;
  audio?: number;
}

interface ContentItem {
  id: number;
  title: string;
  artist: string;
  type: MediaType;
  date: string;
  status: Status;
  thumbnailUrl: string;
  qualityScores: QualityScore;
  issues?: string[];
  fileSize?: number;
  fileDetails?: {
    format?: string;
    sampleRate?: number;
    bitDepth?: number;
    channels?: number;
    dimensions?: string;
    duration?: number;
  };
}

// Updated to include proper WAV file and image validation details
const MOCK_CONTENT: ContentItem[] = [
  { 
    id: 1, 
    title: "Summer Vibes", 
    artist: "John Smith", 
    type: "audio",
    date: "2023-06-15",
    status: "pending",
    thumbnailUrl: "https://placehold.co/400x400/5272F2/FFFFFF.png?text=Audio",
    fileSize: 45.8, // MB
    fileDetails: {
      format: "WAV",
      sampleRate: 44100, // Hz
      bitDepth: 16, // bit
      channels: 2,
      duration: 215 // seconds
    },
    qualityScores: {
      bitrate: 92,
      format: 100,
      metadata: 85,
      sampleRate: 100,
      channels: 100,
      duration: 95,
      overall: 92
    }
  },
  { 
    id: 2, 
    title: "Product Promo", 
    artist: "Maria Garcia", 
    type: "video",
    date: "2023-06-14",
    status: "approved",
    thumbnailUrl: "https://placehold.co/400x225/F25757/FFFFFF.png?text=Video",
    fileSize: 128.5, // MB
    fileDetails: {
      format: "MP4",
      dimensions: "1920x1080",
      duration: 120 // seconds
    },
    qualityScores: {
      resolution: 100,
      framerate: 95,
      bitrate: 90,
      audio: 98,
      metadata: 100,
      overall: 97
    }
  },
  { 
    id: 3, 
    title: "Album Cover Art", 
    artist: "Elena James", 
    type: "image",
    date: "2023-06-13",
    status: "rejected",
    thumbnailUrl: "https://placehold.co/400x400/57F2E5/FFFFFF.png?text=Image",
    fileSize: 2.8, // MB
    fileDetails: {
      format: "JPG",
      dimensions: "1500x1500"
    },
    qualityScores: {
      dimensions: 60,
      format: 100,
      resolution: 65,
      colorProfile: 100,
      metadata: 90,
      overall: 60
    },
    issues: ["Resolution too low (1500x1500px, minimum 3000x3000px required)", "Image quality compression artifacts detected"]
  },
  { 
    id: 4, 
    title: "Deep House Mix", 
    artist: "DJ Pulse", 
    type: "audio",
    date: "2023-06-12",
    status: "pending",
    thumbnailUrl: "https://placehold.co/400x400/F2A057/FFFFFF.png?text=Audio",
    fileSize: 84.3, // MB
    fileDetails: {
      format: "WAV",
      sampleRate: 48000, // Hz
      bitDepth: 24, // bit
      channels: 2,
      duration: 358 // seconds
    },
    qualityScores: {
      bitrate: 100,
      format: 100,
      metadata: 70,
      sampleRate: 100,
      channels: 100,
      duration: 100,
      overall: 95
    }
  },
  { 
    id: 5, 
    title: "New Album Cover", 
    artist: "Sarah Miller", 
    type: "image",
    date: "2023-06-11",
    status: "pending",
    thumbnailUrl: "https://placehold.co/400x400/9057F2/FFFFFF.png?text=Image",
    fileSize: 5.2, // MB
    fileDetails: {
      format: "PNG",
      dimensions: "3000x3000"
    },
    qualityScores: {
      dimensions: 100,
      format: 100,
      resolution: 95,
      colorProfile: 90,
      metadata: 85,
      overall: 95
    }
  },
  { 
    id: 6, 
    title: "Acoustic Sessions (Lo-Fi)", 
    artist: "The Ambients", 
    type: "audio",
    date: "2023-06-08",
    status: "rejected",
    thumbnailUrl: "https://placehold.co/400x400/FF5733/FFFFFF.png?text=Audio",
    fileSize: 32.1, // MB
    fileDetails: {
      format: "MP3",
      sampleRate: 44100, // Hz
      bitDepth: 16, // bit
      channels: 2,
      duration: 185 // seconds
    },
    qualityScores: {
      bitrate: 55,
      format: 0, // Rejected because it's MP3, not WAV
      metadata: 80,
      sampleRate: 100,
      channels: 100,
      duration: 95,
      overall: 40
    },
    issues: ["Invalid format: MP3 (WAV required)", "Low bitrate: 192kbps (minimum 320kbps required)"]
  }
];

const getTypeIcon = (type: MediaType) => {
  switch (type) {
    case "audio":
      return FileAudio2;
    case "video":
      return Film;
    case "image":
      return ImageIcon;
    default:
      return Music;
  }
};

const getQualityColor = (score: number) => {
  if (score >= 90) return "text-green-500";
  if (score >= 75) return "text-amber-500";
  return "text-red-500";
};

const getQualityProgressColor = (score: number) => {
  if (score >= 90) return "bg-green-500";
  if (score >= 75) return "bg-amber-500";
  return "bg-red-500";
};

const formatFileSize = (sizeInMB: number): string => {
  if (sizeInMB < 1) {
    return `${(sizeInMB * 1000).toFixed(0)} KB`;
  }
  return `${sizeInMB.toFixed(1)} MB`;
};

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function QualityCheckPage() {
  const { toast } = useToast();
  const [content, setContent] = useState<ContentItem[]>(MOCK_CONTENT);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContent, setSelectedContent] = useState<number | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadType, setUploadType] = useState<MediaType>("audio");
  const [isProcessing, setIsProcessing] = useState(false);
  const [thresholds, setThresholds] = useState({
    audio: {
      minSampleRate: 44100, // Hz
      minBitDepth: 16, // bit
      minChannels: 2,
      minBitrate: 320, // kbps (for lossy formats)
      minDuration: 60, // seconds
      requiredFormats: ["WAV"]
    },
    image: {
      minWidth: 3000,
      minHeight: 3000,
      minResolution: 300, // dpi
      requiredFormats: ["PNG", "TIFF"]
    },
    video: {
      minResolution: 1080, // 1080p
      minFramerate: 24, // fps
      minBitrate: 8000, // kbps
      requiredFormats: ["MP4", "MOV"]
    }
  });

  const filteredContent = content.filter(item => {
    // Filter by status
    if (filter !== "all" && item.status !== filter) {
      return false;
    }

    // Filter by type
    if (typeFilter !== "all" && item.type !== typeFilter) {
      return false;
    }

    // Filter by search query
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !item.artist.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Function to handle file upload
  const handleFileUpload = (file: File | null) => {
    if (!file) return;

    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      // This is where we would normally send the file to a backend API for analysis
      // For now, we'll simulate this process

      let validationResult: {
        passed: boolean;
        scores: QualityScore;
        issues?: string[];
        fileDetails?: any;
      };

      // Simulate different validation results based on file type and name
      if (uploadType === "audio") {
        // Check if it's a WAV file
        const isWAV = file.name.toLowerCase().endsWith('.wav');

        validationResult = {
          passed: isWAV,
          scores: {
            overall: isWAV ? 95 : 40,
            bitrate: isWAV ? 100 : 60,
            format: isWAV ? 100 : 0,
            metadata: 90,
            sampleRate: 100,
            channels: 100,
            duration: 95
          },
          fileDetails: {
            format: isWAV ? "WAV" : file.name.split('.').pop()?.toUpperCase(),
            sampleRate: 44100,
            bitDepth: 16,
            channels: 2,
            duration: 240
          }
        };

        if (!isWAV) {
          validationResult.issues = [`Invalid format: ${file.name.split('.').pop()?.toUpperCase()} (WAV required)`];
        }
      } else if (uploadType === "image") {
        // Check if it's a high-resolution image
        const isHighRes = file.size > 1000000; // Simple size-based check

        validationResult = {
          passed: isHighRes,
          scores: {
            overall: isHighRes ? 90 : 65,
            dimensions: isHighRes ? 100 : 60,
            resolution: isHighRes ? 95 : 70,
            colorProfile: 90,
            format: 100,
            metadata: 85
          },
          fileDetails: {
            format: file.name.split('.').pop()?.toUpperCase(),
            dimensions: isHighRes ? "3000x3000" : "1500x1500"
          }
        };

        if (!isHighRes) {
          validationResult.issues = ["Image resolution too low (minimum 3000x3000px required)"];
        }
      } else {
        // Default validation for video
        validationResult = {
          passed: true,
          scores: {
            overall: 95,
            resolution: 100,
            framerate: 95,
            bitrate: 90,
            audio: 98,
            metadata: 92
          },
          fileDetails: {
            format: file.name.split('.').pop()?.toUpperCase(),
            dimensions: "1920x1080",
            duration: 120
          }
        };
      }

      // Add the new content item
      const newItem: ContentItem = {
        id: Math.max(...content.map(item => item.id)) + 1,
        title: file.name.split('.')[0],
        artist: "Test User",
        type: uploadType,
        date: new Date().toISOString().split('T')[0],
        status: validationResult.passed ? "approved" : "rejected",
        thumbnailUrl: `https://placehold.co/400x${uploadType === 'video' ? '225' : '400'}/${Math.random().toString(16).slice(2, 8)}/FFFFFF.png?text=${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)}`,
        qualityScores: validationResult.scores,
        issues: validationResult.issues,
        fileSize: file.size / (1024 * 1024), // Convert bytes to MB
        fileDetails: validationResult.fileDetails
      };

      setContent([newItem, ...content]);
      setSelectedContent(newItem.id);
      setIsProcessing(false);
      setShowUploadDialog(false);

      toast({
        title: validationResult.passed ? "Validation Passed" : "Validation Failed",
        description: validationResult.passed 
          ? "The file meets all quality requirements." 
          : "The file doesn't meet quality requirements. See issues for details.",
        variant: validationResult.passed ? "default" : "destructive",
      });
    }, 2000);
  };

  const handleStatusChange = (id: number, newStatus: Status) => {
    setContent(content.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));

    toast({
      title: `Status updated to ${newStatus}`,
      description: `Content item has been ${newStatus === 'approved' ? 'approved' : newStatus === 'rejected' ? 'rejected' : 'marked as pending'}.`,
      variant: newStatus === 'approved' ? "default" : newStatus === 'rejected' ? "destructive" : "default",
    });
  };

  const handleBatchProcess = () => {
    // Simulate batch processing
    setIsProcessing(true);

    setTimeout(() => {
      // Process all pending items
      const updatedContent = content.map(item => {
        if (item.status !== "pending") return item;

        // Automated quality check
        const passCheck = item.qualityScores.overall >= 80;

        return {
          ...item,
          status: passCheck ? "approved" : "rejected"
        } as ContentItem;
      });

      setContent(updatedContent);
      setIsProcessing(false);

      toast({
        title: "Batch Processing Complete",
        description: `Processed ${updatedContent.filter(item => item.status !== "pending").length} items.`,
      });
    }, 1500);
  };

  // Mock audio spectrum visualization data
  const generateAudioSpectrum = () => {
    const bars = 50;
    return Array.from({ length: bars }, () => Math.floor(Math.random() * 100));
  };

  const resetContent = () => {
    // Reset to original mock data
    setContent(MOCK_CONTENT);
    setSelectedContent(null);

    toast({
      title: "Content Reset",
      description: "All content has been reset to the initial state.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Content Quality Check</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="default" 
            onClick={() => setShowUploadDialog(true)}
            className="flex items-center gap-1"
          >
            <Upload className="h-4 w-4" />
            Upload for Testing
          </Button>
          <Button 
            variant="outline" 
            onClick={handleBatchProcess}
            disabled={isProcessing}
            className="flex items-center gap-1"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <BarChart3 className="h-4 w-4" />
            )}
            Batch Process
          </Button>
          <Button 
            variant="outline" 
            onClick={resetContent}
            className="flex items-center gap-1 md:ml-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Input
          placeholder="Search by title or artist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:w-[250px]"
        />
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[150px]">
            <SelectValue placeholder="Media Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="image">Image</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredContent.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No content found matching your filters.</p>
          </Card>
        ) : (
          filteredContent.map(item => (
            <Card key={item.id} className={selectedContent === item.id ? "border-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full flex items-center justify-center ${
                      item.status === 'approved' ? 'bg-green-100 dark:bg-green-900/40' : 
                      item.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/40' : 
                      'bg-amber-100 dark:bg-amber-900/40'
                    }`}>
                      {React.createElement(getTypeIcon(item.type), { 
                        className: `h-5 w-5 ${
                          item.status === 'approved' ? 'text-green-600 dark:text-green-400' : 
                          item.status === 'rejected' ? 'text-red-600 dark:text-red-400' :
                          'text-amber-600 dark:text-amber-400'
                        }`
                      })}
                    </div>
                    <div>
                      <CardTitle>{item.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{item.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <Badge className={`${
                      item.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 
                      item.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' : 
                      'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                    }`}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                    <div className="text-sm text-muted-foreground">{item.date}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center">
                    <div className="relative w-full max-w-[250px] aspect-square mb-3 rounded-md overflow-hidden">
                      <img 
                        src={item.thumbnailUrl} 
                        alt={`${item.title} by ${item.artist}`}
                        className="w-full h-full object-cover"
                      />
                      {item.type === 'audio' && (
                        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                          <div className="flex justify-between w-full px-3 pb-2 items-center">
                            <Play className="h-6 w-6 text-white cursor-pointer hover:text-primary transition-colors" />
                            <div className="flex-1 px-3">
                              <div className="flex space-x-[2px]">
                                {generateAudioSpectrum().map((height, i) => (
                                  <div
                                    key={i}
                                    className="w-[3px] bg-white opacity-70"
                                    style={{ height: `${Math.max(3, height * 0.12)}px` }}
                                  ></div>
                                ))}
                              </div>
                            </div>
                            <Download className="h-5 w-5 text-white cursor-pointer hover:text-primary transition-colors" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="w-full space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Quality Score</span>
                        <span className={`font-bold ${getQualityColor(item.qualityScores.overall)}`}>
                          {item.qualityScores.overall}%
                        </span>
                      </div>
                      <Progress 
                        value={item.qualityScores.overall} 
                        className="h-2" 
                        indicatorClassName={getQualityProgressColor(item.qualityScores.overall)}
                      />
                      {item.issues && item.issues.length > 0 && (
                        <div className="flex items-start mt-3 space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-red-500 leading-tight">
                            {item.issues[0]}{item.issues.length > 1 ? ` (+${item.issues.length - 1} more)` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="md:col-span-2 space-y-4">
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="mb-3">
                        <TabsTrigger value="details">File Details</TabsTrigger>
                        <TabsTrigger value="quality">Quality Analysis</TabsTrigger>
                        {item.issues && item.issues.length > 0 && (
                          <TabsTrigger value="issues">
                            Issues 
                            <span className="ml-1.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 text-xs rounded-full w-5 h-5 inline-flex items-center justify-center">
                              {item.issues.length}
                            </span>
                          </TabsTrigger>
                        )}
                      </TabsList>
                      
                      <TabsContent value="details" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="p-4 pt-3">
                              <h4 className="text-sm font-medium mb-2">File Info</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Format</span>
                                  <span className="font-medium">{item.fileDetails?.format || "-"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Size</span>
                                  <span className="font-medium">{item.fileSize ? formatFileSize(item.fileSize) : "-"}</span>
                                </div>
                                {item.fileDetails?.duration && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Duration</span>
                                    <span className="font-medium">{formatDuration(item.fileDetails.duration)}</span>
                                  </div>
                                )}
                                {item.fileDetails?.dimensions && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Dimensions</span>
                                    <span className="font-medium">{item.fileDetails.dimensions}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                          
                          {item.type === "audio" && (
                            <Card>
                              <CardContent className="p-4 pt-3">
                                <h4 className="text-sm font-medium mb-2">Audio Properties</h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Sample Rate</span>
                                    <span className="font-medium">{item.fileDetails?.sampleRate ? `${item.fileDetails.sampleRate} Hz` : "-"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Bit Depth</span>
                                    <span className="font-medium">{item.fileDetails?.bitDepth ? `${item.fileDetails.bitDepth}-bit` : "-"}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Channels</span>
                                    <span className="font-medium">{item.fileDetails?.channels || "-"}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                          
                          <div className="col-span-2">
                            <Card>
                              <CardContent className="p-4 pt-3">
                                <h4 className="text-sm font-medium mb-2">Requirements</h4>
                                <div className="space-y-2 text-sm">
                                  {item.type === "audio" && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Format</span>
                                        <span className={`font-medium ${thresholds.audio.requiredFormats.includes(item.fileDetails?.format || "") ? "text-green-600" : "text-red-600"}`}>
                                          {thresholds.audio.requiredFormats.join(" or ")}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Min Sample Rate</span>
                                        <span className={`font-medium ${(item.fileDetails?.sampleRate || 0) >= thresholds.audio.minSampleRate ? "text-green-600" : "text-red-600"}`}>
                                          {thresholds.audio.minSampleRate} Hz
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Min Bit Depth</span>
                                        <span className={`font-medium ${(item.fileDetails?.bitDepth || 0) >= thresholds.audio.minBitDepth ? "text-green-600" : "text-red-600"}`}>
                                          {thresholds.audio.minBitDepth}-bit
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  
                                  {item.type === "image" && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Format</span>
                                        <span className={`font-medium ${thresholds.image.requiredFormats.includes(item.fileDetails?.format || "") ? "text-green-600" : "text-red-600"}`}>
                                          {thresholds.image.requiredFormats.join(" or ")}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Min Dimensions</span>
                                        <span className={`font-medium ${
                                          item.fileDetails?.dimensions && 
                                          parseInt(item.fileDetails.dimensions.split('x')[0]) >= thresholds.image.minWidth && 
                                          parseInt(item.fileDetails.dimensions.split('x')[1]) >= thresholds.image.minHeight 
                                            ? "text-green-600" : "text-red-600"
                                        }`}>
                                          {thresholds.image.minWidth}x{thresholds.image.minHeight}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  
                                  {item.type === "video" && (
                                    <>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Format</span>
                                        <span className="font-medium">
                                          {thresholds.video.requiredFormats.join(" or ")}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">Min Resolution</span>
                                        <span className="font-medium">
                                          {thresholds.video.minResolution}p
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="quality" className="space-y-4">
                        <Card>
                          <CardContent className="p-4 pt-3">
                            <h4 className="text-sm font-medium mb-3">Quality Assessment</h4>
                            <div className="space-y-3">
                              {Object.entries(item.qualityScores)
                                .filter(([key]) => key !== "overall")
                                .sort(([, valueA], [, valueB]) => (valueB as number) - (valueA as number))
                                .map(([key, value]) => (
                                  <div key={key} className="space-y-1">
                                    <div className="flex justify-between">
                                      <span className="text-sm text-muted-foreground capitalize">
                                        {key}
                                      </span>
                                      <span className={`text-sm font-medium ${getQualityColor(value as number)}`}>
                                        {value}%
                                      </span>
                                    </div>
                                    <Progress 
                                      value={value as number} 
                                      className="h-1.5" 
                                      indicatorClassName={getQualityProgressColor(value as number)}
                                    />
                                  </div>
                                ))
                              }
                            </div>
                            
                            <div className="mt-6 pt-4 border-t border-border">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Overall Score</span>
                                <span className={`text-xl font-bold ${getQualityColor(item.qualityScores.overall)}`}>
                                  {item.qualityScores.overall}%
                                </span>
                              </div>
                              <Progress 
                                value={item.qualityScores.overall} 
                                className="h-2.5" 
                                indicatorClassName={getQualityProgressColor(item.qualityScores.overall)}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                      
                      {item.issues && item.issues.length > 0 && (
                        <TabsContent value="issues">
                          <Card>
                            <CardContent className="p-4 pt-3">
                              <h4 className="text-sm font-medium mb-3">Quality Issues</h4>
                              <ul className="space-y-2">
                                {item.issues.map((issue, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{issue}</span>
                                  </li>
                                ))}
                              </ul>
                            </CardContent>
                          </Card>
                        </TabsContent>
                      )}
                    </Tabs>
                    
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedContent(selectedContent === item.id ? null : item.id)}
                      >
                        {selectedContent === item.id ? "Close Details" : "View Details"}
                      </Button>
                      
                      {item.status !== "approved" && (
                        <Button
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange(item.id, "approved")}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                      )}
                      
                      {item.status !== "rejected" && (
                        <Button
                          variant="destructive"
                          onClick={() => handleStatusChange(item.id, "rejected")}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      )}
                      
                      {item.status !== "pending" && (
                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange(item.id, "pending")}
                        >
                          Reset to Pending
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload File for Quality Check</DialogTitle>
            <DialogDescription>
              Upload a file to test our quality verification system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between mb-4">
              <div className="flex space-x-2">
                <Button
                  variant={uploadType === "audio" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadType("audio")}
                  className="flex items-center"
                >
                  <FileAudio2 className="mr-1 h-4 w-4" />
                  Audio
                </Button>
                <Button
                  variant={uploadType === "image" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadType("image")}
                  className="flex items-center"
                >
                  <ImageIcon className="mr-1 h-4 w-4" />
                  Image
                </Button>
                <Button
                  variant={uploadType === "video" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUploadType("video")}
                  className="flex items-center"
                >
                  <Film className="mr-1 h-4 w-4" />
                  Video
                </Button>
              </div>
            </div>
            
            <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept={
                  uploadType === "audio" ? ".wav,.mp3,.flac,.aac" :
                  uploadType === "image" ? ".jpg,.jpeg,.png,.tiff" :
                  ".mp4,.mov"
                }
                onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <div className="p-4 bg-muted rounded-full mb-3">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">
                  Drag and drop your {uploadType} file here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {uploadType === "audio" ? "WAV, MP3, FLAC, AAC" :
                   uploadType === "image" ? "JPG, PNG, TIFF" :
                   "MP4, MOV"} files supported
                </p>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-4"
                >
                  Select File
                </Button>
              </label>
            </div>
            
            {uploadType === "audio" && (
              <div className="mt-4 text-sm">
                <h4 className="font-medium">Audio Requirements:</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-muted-foreground">
                  <li>WAV format required</li>
                  <li>Minimum sample rate: 44.1 kHz</li>
                  <li>Minimum bit depth: 16-bit</li>
                  <li>Stereo (2 channels) preferred</li>
                </ul>
              </div>
            )}
            
            {uploadType === "image" && (
              <div className="mt-4 text-sm">
                <h4 className="font-medium">Image Requirements:</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-muted-foreground">
                  <li>PNG or TIFF format recommended</li>
                  <li>Minimum dimensions: 3000x3000 pixels</li>
                  <li>Minimum resolution: 300 DPI</li>
                </ul>
              </div>
            )}
            
            {uploadType === "video" && (
              <div className="mt-4 text-sm">
                <h4 className="font-medium">Video Requirements:</h4>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-muted-foreground">
                  <li>MP4 or MOV format required</li>
                  <li>Minimum resolution: 1080p</li>
                  <li>Minimum framerate: 24 fps</li>
                  <li>Maximum length: 10 minutes</li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}