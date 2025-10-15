import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Music, Image, Film, Upload, Download, Disc,
  FileMusic, FileImage, Play, Pause, Info, BarChart3, RefreshCw, Loader2, Zap, 
  FileAudio, ArrowUpDown, Calendar, Filter
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Define validation requirement constants
const FILE_VALIDATION_REQUIREMENTS = {
  audio: {
    allowedFormats: ['wav'],
    minSampleRate: 44100, // Hz
    minBitDepth: 16, // bit
    maxFileSize: 100 // MB
  },
  image: {
    allowedFormats: ['png', 'jpg', 'tiff'],
    minDimensions: 3000, // px (width and height)
    minResolution: 300, // dpi
    maxFileSize: 20 // MB
  }
};

// Define type for content items
type ContentStatus = "pending" | "approved" | "rejected";
type ContentType = "album" | "single" | "ep";

interface Track {
  title: string;
  duration: string;
  explicit: boolean;
  audioFile?: {
    format: string;
    sampleRate?: number;
    bitDepth?: number;
    size?: number;
    validated: boolean;
    issues?: string[];
  };
}

interface ContentItem {
  id: number;
  title: string;
  artist: string;
  label: string;
  type: ContentType;
  artwork: string;
  date: string;
  status: ContentStatus;
  tracks: Track[];
  issues: string[];
  artworkDetails?: {
    format: string;
    dimensions: string;
    size: number;
    resolution?: number;
    validated: boolean;
    issues?: string[];
  };
}

const MOCK_CONTENT: ContentItem[] = [
  { 
    id: 1, 
    title: "Summer Vibes", 
    artist: "John Smith", 
    label: "Indie Records", 
    type: "album", 
    artwork: "https://placehold.co/400x400/5272F2/FFFFFF.png?text=Album+Cover", 
    date: "2023-06-15", 
    status: "pending",
    tracks: [
      { 
        title: "Sunny Days", 
        duration: "3:25", 
        explicit: false,
        audioFile: {
          format: "wav",
          sampleRate: 44100,
          bitDepth: 24,
          size: 34.2,
          validated: true,
          issues: []
        }
      },
      { 
        title: "Ocean Breeze", 
        duration: "4:10", 
        explicit: false,
        audioFile: {
          format: "wav",
          sampleRate: 44100,
          bitDepth: 16,
          size: 28.5,
          validated: true,
          issues: []
        }
      },
      { 
        title: "Night Out", 
        duration: "3:45", 
        explicit: true,
        audioFile: {
          format: "wav",
          sampleRate: 48000,
          bitDepth: 24,
          size: 42.1,
          validated: true,
          issues: []
        }
      }
    ],
    issues: [],
    artworkDetails: {
      format: "png",
      dimensions: "3000x3000",
      size: 4.8,
      resolution: 300,
      validated: true,
      issues: []
    }
  },
  { 
    id: 2, 
    title: "Street Dreams", 
    artist: "MC Flow", 
    label: "Urban Beats", 
    type: "single", 
    artwork: "https://placehold.co/400x400/F25757/FFFFFF.png?text=Single+Cover", 
    date: "2023-06-14", 
    status: "pending",
    tracks: [
      { 
        title: "Street Dreams", 
        duration: "4:35", 
        explicit: true,
        audioFile: {
          format: "wav",
          sampleRate: 44100,
          bitDepth: 16,
          size: 32.7,
          validated: true,
          issues: []
        }
      }
    ],
    issues: ["Explicit content requires labeling", "Low quality artwork"],
    artworkDetails: {
      format: "jpg",
      dimensions: "2000x2000",
      size: 1.8,
      resolution: 150,
      validated: false,
      issues: ["Resolution too low (min 300dpi required)", "Dimensions too small (min 3000x3000px required)"]
    }
  },
  { 
    id: 3, 
    title: "Midnight Walk", 
    artist: "Elena James", 
    label: "Moonlight Records", 
    type: "ep", 
    artwork: "https://placehold.co/400x400/57F2E5/FFFFFF.png?text=EP+Cover", 
    date: "2023-06-13", 
    status: "approved",
    tracks: [
      { 
        title: "Midnight", 
        duration: "3:55", 
        explicit: false,
        audioFile: {
          format: "wav",
          sampleRate: 44100,
          bitDepth: 24,
          size: 38.4,
          validated: true,
          issues: []
        }
      },
      { 
        title: "Starlight", 
        duration: "4:20", 
        explicit: false,
        audioFile: {
          format: "wav",
          sampleRate: 48000,
          bitDepth: 24,
          size: 40.2,
          validated: true,
          issues: []
        }
      },
      { 
        title: "Dawn", 
        duration: "3:15", 
        explicit: false,
        audioFile: {
          format: "wav",
          sampleRate: 44100,
          bitDepth: 16,
          size: 24.8,
          validated: true,
          issues: []
        }
      }
    ],
    issues: [],
    artworkDetails: {
      format: "png",
      dimensions: "4000x4000",
      size: 6.2,
      resolution: 350,
      validated: true,
      issues: []
    }
  },
  { 
    id: 4, 
    title: "Revolution", 
    artist: "The Rebels", 
    label: "Freedom Sounds", 
    type: "album", 
    artwork: "https://placehold.co/400x400/F2A057/FFFFFF.png?text=Album+Cover", 
    date: "2023-06-12", 
    status: "rejected",
    tracks: [
      { 
        title: "Rise Up", 
        duration: "4:05", 
        explicit: true,
        audioFile: {
          format: "mp3",
          sampleRate: 44100,
          bitDepth: 16,
          size: 8.2,
          validated: false,
          issues: ["Invalid format: mp3 (wav required)"]
        }
      },
      { 
        title: "Freedom Call", 
        duration: "3:50", 
        explicit: true,
        audioFile: {
          format: "mp3",
          sampleRate: 44100,
          bitDepth: 16,
          size: 7.8,
          validated: false,
          issues: ["Invalid format: mp3 (wav required)"]
        }
      },
      { 
        title: "New World", 
        duration: "5:10", 
        explicit: true,
        audioFile: {
          format: "mp3",
          sampleRate: 44100,
          bitDepth: 16,
          size: 9.6,
          validated: false,
          issues: ["Invalid format: mp3 (wav required)"]
        }
      }
    ],
    issues: ["Copyright issues detected", "Content violates platform guidelines", "Missing metadata", "Invalid audio format: mp3 files not accepted"],
    artworkDetails: {
      format: "jpg",
      dimensions: "3000x3000",
      size: 3.2,
      resolution: 300,
      validated: true,
      issues: []
    }
  },
  { 
    id: 5, 
    title: "Acoustic Sessions", 
    artist: "Sarah Miller", 
    label: "Pure Sound", 
    type: "album", 
    artwork: "https://placehold.co/400x400/9057F2/FFFFFF.png?text=Album+Cover", 
    date: "2023-06-11", 
    status: "pending",
    tracks: [
      { 
        title: "Whispers", 
        duration: "3:30", 
        explicit: false,
        audioFile: {
          format: "wav",
          sampleRate: 44100,
          bitDepth: 24,
          size: 35.6,
          validated: true,
          issues: []
        }
      },
      { 
        title: "Memories", 
        duration: "4:15", 
        explicit: false,
        audioFile: {
          format: "wav",
          sampleRate: 44100,
          bitDepth: 24,
          size: 41.2,
          validated: true,
          issues: []
        }
      },
      { 
        title: "Lost in Time", 
        duration: "4:55", 
        explicit: false,
        audioFile: {
          format: "wav",
          sampleRate: 44100,
          bitDepth: 24,
          size: 48.3,
          validated: true,
          issues: []
        }
      }
    ],
    issues: [],
    artworkDetails: {
      format: "tiff",
      dimensions: "4000x4000",
      size: 12.8,
      resolution: 350,
      validated: true,
      issues: []
    }
  }
];

export default function ContentApprovalPage() {
  const { toast } = useToast();
  const [content, setContent] = useState<ContentItem[]>(MOCK_CONTENT);
  const [filter, setFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContent, setSelectedContent] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [issuesList, setIssuesList] = useState<string[]>([]);
  const [newIssue, setNewIssue] = useState("");

  // Enhanced features for file validation
  const [showAudioUploadDialog, setShowAudioUploadDialog] = useState(false);
  const [showArtworkUploadDialog, setShowArtworkUploadDialog] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    isValid: boolean;
    issues: string[];
    details?: any;
  } | null>(null);
  const [sortField, setSortField] = useState<"date" | "title" | "type">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Refs for file inputs
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const artworkFileInputRef = useRef<HTMLInputElement>(null);

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

  // Sorting logic
  const sortedContent = [...filteredContent].sort((a, b) => {
    let comparison = 0;

    if (sortField === "date") {
      comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortField === "title") {
      comparison = a.title.localeCompare(b.title);
    } else if (sortField === "type") {
      comparison = a.type.localeCompare(b.type);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const handleSort = (field: "date" | "title" | "type") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleStatusChange = (id: number, newStatus: ContentStatus) => {
    // If rejected, add feedback to issues
    if (newStatus === "rejected" && feedbackMessage) {
      setContent(content.map(item => 
        item.id === id ? { 
          ...item, 
          status: newStatus,
          issues: [...item.issues, feedbackMessage, ...issuesList]
        } : item
      ));
    } else {
      setContent(content.map(item => 
        item.id === id ? { ...item, status: newStatus } : item
      ));
    }

    setSelectedContent(null);
    setFeedbackMessage("");
    setIssuesList([]);
    setNewIssue("");

    toast({
      title: `Content ${newStatus}`,
      description: `The ${content.find(item => item.id === id)?.type || 'content'} has been ${newStatus}.`,
      variant: newStatus === "approved" ? "default" : "destructive",
    });
  };

  const addIssue = () => {
    if (newIssue.trim()) {
      setIssuesList([...issuesList, newIssue]);
      setNewIssue("");
    }
  };

  // Audio file validation logic
  const validateAudioFile = (file: File) => {
    setIsValidating(true);

    // In a real application, this would be an API call to analyze the audio file
    // For this example, we'll simulate file validation based on the filename

    setTimeout(() => {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileSize = file.size / (1024 * 1024); // Convert to MB

      const issues: string[] = [];

      // Check file format
      if (!FILE_VALIDATION_REQUIREMENTS.audio.allowedFormats.includes(fileExt)) {
        issues.push(`Invalid format: ${fileExt} (allowed formats: ${FILE_VALIDATION_REQUIREMENTS.audio.allowedFormats.join(', ')})`);
      }

      // Check file size
      if (fileSize > FILE_VALIDATION_REQUIREMENTS.audio.maxFileSize) {
        issues.push(`File too large: ${fileSize.toFixed(1)}MB (max ${FILE_VALIDATION_REQUIREMENTS.audio.maxFileSize}MB)`);
      }

      // In a real application, we would analyze the audio file to get sample rate, bit depth, etc.
      // Here we're simulating with random values for demonstration
      const isValidFormat = FILE_VALIDATION_REQUIREMENTS.audio.allowedFormats.includes(fileExt);
      const sampleRate = isValidFormat ? 
        (Math.random() > 0.2 ? FILE_VALIDATION_REQUIREMENTS.audio.minSampleRate : FILE_VALIDATION_REQUIREMENTS.audio.minSampleRate / 2) : 
        22050;

      const bitDepth = isValidFormat ? 
        (Math.random() > 0.3 ? 24 : 16) : 
        8;

      // Check sample rate
      if (sampleRate < FILE_VALIDATION_REQUIREMENTS.audio.minSampleRate) {
        issues.push(`Sample rate too low: ${sampleRate}Hz (min ${FILE_VALIDATION_REQUIREMENTS.audio.minSampleRate}Hz)`);
      }

      // Check bit depth
      if (bitDepth < FILE_VALIDATION_REQUIREMENTS.audio.minBitDepth) {
        issues.push(`Bit depth too low: ${bitDepth}-bit (min ${FILE_VALIDATION_REQUIREMENTS.audio.minBitDepth}-bit)`);
      }

      setValidationResults({
        isValid: issues.length === 0,
        issues,
        details: {
          format: fileExt,
          sampleRate,
          bitDepth,
          size: fileSize,
          filename: file.name,
        }
      });

      setIsValidating(false);
    }, 1500); // Simulate processing time
  };

  // Artwork validation logic
  const validateArtwork = (file: File) => {
    setIsValidating(true);

    // In a real application, this would be an API call to analyze the image file
    // For this example, we'll simulate file validation based on the filename

    setTimeout(() => {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      const fileSize = file.size / (1024 * 1024); // Convert to MB

      const issues: string[] = [];

      // Check file format
      if (!FILE_VALIDATION_REQUIREMENTS.image.allowedFormats.includes(fileExt)) {
        issues.push(`Invalid format: ${fileExt} (allowed formats: ${FILE_VALIDATION_REQUIREMENTS.image.allowedFormats.join(', ')})`);
      }

      // Check file size
      if (fileSize > FILE_VALIDATION_REQUIREMENTS.image.maxFileSize) {
        issues.push(`File too large: ${fileSize.toFixed(1)}MB (max ${FILE_VALIDATION_REQUIREMENTS.image.maxFileSize}MB)`);
      }

      // In a real application, we would analyze the image file to get dimensions, resolution, etc.
      // Here we're simulating with random values for demonstration
      const dimensions = Math.random() > 0.3 ? 
        FILE_VALIDATION_REQUIREMENTS.image.minDimensions : 
        FILE_VALIDATION_REQUIREMENTS.image.minDimensions / 2;

      const resolution = Math.random() > 0.3 ? 
        FILE_VALIDATION_REQUIREMENTS.image.minResolution : 
        FILE_VALIDATION_REQUIREMENTS.image.minResolution / 2;

      // Check dimensions
      if (dimensions < FILE_VALIDATION_REQUIREMENTS.image.minDimensions) {
        issues.push(`Dimensions too small: ${dimensions}x${dimensions}px (min ${FILE_VALIDATION_REQUIREMENTS.image.minDimensions}x${FILE_VALIDATION_REQUIREMENTS.image.minDimensions}px)`);
      }

      // Check resolution
      if (resolution < FILE_VALIDATION_REQUIREMENTS.image.minResolution) {
        issues.push(`Resolution too low: ${resolution}dpi (min ${FILE_VALIDATION_REQUIREMENTS.image.minResolution}dpi)`);
      }

      setValidationResults({
        isValid: issues.length === 0,
        issues,
        details: {
          format: fileExt,
          dimensions: `${dimensions}x${dimensions}`,
          resolution,
          size: fileSize,
          filename: file.name,
        }
      });

      setIsValidating(false);
    }, 1500); // Simulate processing time
  };

  const applyValidationResults = (type: 'audio' | 'image') => {
    if (!validationResults) return;

    toast({
      title: `${type === 'audio' ? 'Audio' : 'Artwork'} file validated`,
      description: validationResults.isValid ? 
        `The file is valid and meets all requirements.` : 
        `The file has been accepted with ${validationResults.issues.length} issue(s).`,
      variant: validationResults.isValid ? "default" : "destructive",
    });

    if (type === 'audio') {
      setShowAudioUploadDialog(false);
    } else {
      setShowArtworkUploadDialog(false);
    }

    setValidationResults(null);
  };

  const batchValidateWavFiles = () => {
    setIsValidating(true);
    
    // Simulate batch validation process
    setTimeout(() => {
      setIsValidating(false);
      
      // Update all pending items with wav validation
      const updatedContent = content.map(item => {
        if (item.status === "pending") {
          const allTracksValid = item.tracks.every(track => 
            track.audioFile && track.audioFile.format === "wav" && 
            (track.audioFile.sampleRate || 0) >= FILE_VALIDATION_REQUIREMENTS.audio.minSampleRate &&
            (track.audioFile.bitDepth || 0) >= FILE_VALIDATION_REQUIREMENTS.audio.minBitDepth
          );
          
          const artworkValid = item.artworkDetails && 
            FILE_VALIDATION_REQUIREMENTS.image.allowedFormats.includes(item.artworkDetails.format) &&
            (item.artworkDetails.resolution || 0) >= FILE_VALIDATION_REQUIREMENTS.image.minResolution;
          
          return {
            ...item,
            status: (allTracksValid && artworkValid) ? "approved" as ContentStatus : "rejected" as ContentStatus,
            issues: !allTracksValid || !artworkValid ? 
              [...item.issues, "Automated validation failed: Files do not meet minimum requirements"] : 
              item.issues
          };
        }
        return item;
      });
      
      setContent(updatedContent);
      
      toast({
        title: "Batch validation complete",
        description: "All pending content has been validated and status updated.",
      });
    }, 2000); // Simulate processing time
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Content Approval</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={batchValidateWavFiles}
            disabled={isValidating}
            className="flex items-center gap-1"
          >
            {isValidating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Batch Validate WAV Files
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle>Content Submission Queue</CardTitle>
              <CardDescription>
                Review and approve or reject content submissions from creators
              </CardDescription>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex items-center space-x-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[130px]">
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
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="album">Albums</SelectItem>
                    <SelectItem value="single">Singles</SelectItem>
                    <SelectItem value="ep">EPs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search..."
                  className="pl-8 w-full md:w-[200px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleSort("title")}
                          className="inline-flex items-center"
                        >
                          Title
                          {sortField === "title" && (
                            <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                          )}
                        </button>
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Artist</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleSort("type")}
                          className="inline-flex items-center"
                        >
                          Type
                          {sortField === "type" && (
                            <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                          )}
                        </button>
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleSort("date")}
                          className="inline-flex items-center"
                        >
                          Date
                          {sortField === "date" && (
                            <ArrowUpDown className={`ml-2 h-4 w-4 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
                          )}
                        </button>
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Tracks</th>
                    <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {sortedContent.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.artwork}
                            alt={`${item.title} cover`}
                            className="h-10 w-10 rounded-md object-cover"
                          />
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">{item.artist}</td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline" className="capitalize">
                          {item.type === "ep" ? "EP" : item.type}
                        </Badge>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {item.status === "pending" && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            Pending
                          </Badge>
                        )}
                        {item.status === "approved" && (
                          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                            Approved
                          </Badge>
                        )}
                        {item.status === "rejected" && (
                          <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                            Rejected
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center">
                          <Music className="mr-2 h-4 w-4 text-muted-foreground" />
                          {item.tracks.length}
                        </div>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end space-x-2">
                          {item.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                                onClick={() => handleStatusChange(item.id, "approved")}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => setSelectedContent(item.id)}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {item.status === "rejected" && item.issues.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => setSelectedContent(item.id)}
                            >
                              <Info className="mr-1 h-4 w-4" />
                              View Issues
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Rejection Dialog */}
      <Dialog open={selectedContent !== null} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {content.find(item => item.id === selectedContent)?.status === "rejected"
                ? "Content Issues"
                : "Reject Content"}
            </DialogTitle>
          </DialogHeader>
          
          {content.find(item => item.id === selectedContent)?.status === "rejected" ? (
            <div className="space-y-4">
              <h3 className="font-medium">Issues:</h3>
              <ul className="space-y-2 list-disc pl-5">
                {content.find(item => item.id === selectedContent)?.issues.map((issue, index) => (
                  <li key={index} className="text-sm">{issue}</li>
                ))}
              </ul>
              
              {content.find(item => item.id === selectedContent)?.artworkDetails?.issues?.length ? (
                <div>
                  <h3 className="font-medium">Artwork Issues:</h3>
                  <ul className="space-y-2 list-disc pl-5">
                    {content.find(item => item.id === selectedContent)?.artworkDetails?.issues?.map((issue, index) => (
                      <li key={index} className="text-sm">{issue}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              
              {content.find(item => item.id === selectedContent)?.tracks.some(track => 
                track.audioFile?.issues && track.audioFile.issues.length > 0
              ) ? (
                <div>
                  <h3 className="font-medium">Audio Issues:</h3>
                  <ul className="space-y-2 list-disc pl-5">
                    {content.find(item => item.id === selectedContent)?.tracks
                      .flatMap(track => track.audioFile?.issues || [])
                      .map((issue, index) => (
                        <li key={index} className="text-sm">{issue}</li>
                      ))}
                  </ul>
                </div>
              ) : null}
              
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => setSelectedContent(null)}
              >
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="feedback" className="text-sm font-medium">
                  Rejection Reason:
                </label>
                <Textarea
                  id="feedback"
                  placeholder="Provide feedback on why this content is being rejected..."
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="resize-none"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Issues List:</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Add specific issue..."
                      value={newIssue}
                      onChange={(e) => setNewIssue(e.target.value)}
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addIssue();
                        }
                      }}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={addIssue}
                      disabled={!newIssue.trim()}
                    >
                      Add
                    </Button>
                  </div>
                </div>
                
                {issuesList.length > 0 && (
                  <div className="mt-2 p-2 border rounded-md bg-muted/50 max-h-28 overflow-y-auto">
                    <ul className="space-y-1">
                      {issuesList.map((issue, index) => (
                        <li key={index} className="text-sm flex items-center justify-between">
                          <span>• {issue}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              const newList = [...issuesList];
                              newList.splice(index, 1);
                              setIssuesList(newList);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedContent(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    if (selectedContent !== null) {
                      handleStatusChange(selectedContent, "rejected");
                    }
                  }}
                  disabled={!feedbackMessage && issuesList.length === 0}
                >
                  Reject Content
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Audio File Upload Dialog */}
      <Dialog open={showAudioUploadDialog} onOpenChange={setShowAudioUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Validate Audio File</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Select Audio File:</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  ref={audioFileInputRef}
                  accept=".wav,.mp3,.flac,.aiff"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      validateAudioFile(e.target.files[0]);
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isValidating}
                  onClick={() => {
                    if (audioFileInputRef.current) {
                      audioFileInputRef.current.click();
                    }
                  }}
                >
                  {isValidating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Accepted formats: WAV (Recommended), FLAC, AIFF
              </p>
            </div>
            
            {isValidating && (
              <div className="space-y-2 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Validating file...</span>
                  <span className="text-sm font-medium">
                    <RefreshCw className="h-4 w-4 inline-block animate-spin mr-1" />
                  </span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            )}
            
            {validationResults && (
              <div className="border rounded-md p-3 bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium">
                      {validationResults.details.filename}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {validationResults.details.format.toUpperCase()}, {validationResults.details.sampleRate}Hz, {validationResults.details.bitDepth}-bit, {validationResults.details.size.toFixed(2)}MB
                    </p>
                  </div>
                  {validationResults.isValid ? (
                    <Badge className="bg-green-100 text-green-800">Valid</Badge>
                  ) : (
                    <Badge variant="destructive">Has Issues</Badge>
                  )}
                </div>
                
                {!validationResults.isValid && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-red-700">Issues Found:</h5>
                    <ul className="mt-1 text-sm text-red-700 space-y-1 pl-5 list-disc">
                      {validationResults.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAudioUploadDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => applyValidationResults('audio')}
              disabled={!validationResults || isValidating}
              variant={validationResults?.isValid ? "default" : "destructive"}
            >
              {validationResults?.isValid ? 'Apply Valid Audio' : 'Apply with Issues'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Artwork Upload Dialog */}
      <Dialog open={showArtworkUploadDialog} onOpenChange={setShowArtworkUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Validate Artwork</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <label className="text-sm font-medium">Select Artwork File:</label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  ref={artworkFileInputRef}
                  accept=".jpg,.jpeg,.png,.tiff"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      validateArtwork(e.target.files[0]);
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isValidating}
                  onClick={() => {
                    if (artworkFileInputRef.current) {
                      artworkFileInputRef.current.click();
                    }
                  }}
                >
                  {isValidating ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Accepted formats: JPG, PNG, TIFF. Minimum 3000x3000px, 300dpi
              </p>
            </div>
            
            {isValidating && (
              <div className="space-y-2 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Validating artwork...</span>
                  <span className="text-sm font-medium">
                    <RefreshCw className="h-4 w-4 inline-block animate-spin mr-1" />
                  </span>
                </div>
                <Progress value={65} className="h-2" />
              </div>
            )}
            
            {validationResults && (
              <div className="border rounded-md p-3 bg-muted/30">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium">
                      {validationResults.details.filename}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {validationResults.details.format.toUpperCase()}, {validationResults.details.dimensions}, {validationResults.details.resolution}dpi, {validationResults.details.size.toFixed(2)}MB
                    </p>
                  </div>
                  {validationResults.isValid ? (
                    <Badge className="bg-green-100 text-green-800">Valid</Badge>
                  ) : (
                    <Badge variant="destructive">Has Issues</Badge>
                  )}
                </div>
                
                {!validationResults.isValid && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-red-700">Issues Found:</h5>
                    <ul className="mt-1 text-sm text-red-700 space-y-1 pl-5 list-disc">
                      {validationResults.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArtworkUploadDialog(false)}>Cancel</Button>
            <Button 
              onClick={() => applyValidationResults('image')}
              disabled={!validationResults || isValidating}
              variant={validationResults?.isValid ? "default" : "destructive"}
            >
              {validationResults?.isValid ? 'Apply Valid Artwork' : 'Apply with Issues'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  </div>
  );
}

function Search(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}