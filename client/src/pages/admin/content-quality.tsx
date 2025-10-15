import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  Music, 
  Image as ImageIcon, 
  Video, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  BadgeCheck,
  Ban,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';

// Types common to both quality check and content approval
type ContentStatus = "pending" | "approved" | "rejected";
type ContentType = "album" | "single" | "ep" | "video" | "image";
type MediaType = "audio" | "video" | "image";

// Quality Check types
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

// Content Approval types
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

// Combined item type to handle both quality and content
interface ContentItem {
  id: number;
  title: string;
  artist: string;
  type: ContentType;
  mediaType: MediaType;
  date: string;
  status: ContentStatus;
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
  // Content approval specific fields
  label?: string;
  artwork?: string;
  tracks?: Track[];
  artworkDetails?: {
    format: string;
    dimensions: string;
    size: number;
    resolution?: number;
    validated: boolean;
    issues?: string[];
  };
}

// Helper function to get icon for media type
const getTypeIcon = (type: MediaType) => {
  switch (type) {
    case 'audio':
      return <Music className="h-5 w-5" />;
    case 'video':
      return <Video className="h-5 w-5" />;
    case 'image':
      return <ImageIcon className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function ContentQualityPage() {
  // Shared state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortField, setSortField] = useState<'date' | 'title' | 'status' | 'quality'>('date');
  const [selectedMediaTypes, setSelectedMediaTypes] = useState<MediaType[]>(['audio', 'video', 'image']);
  const [selectedStatuses, setSelectedStatuses] = useState<ContentStatus[]>(['pending', 'approved', 'rejected']);
  
  // Mock data for demonstration purposes
  const [contentItems, setContentItems] = useState<ContentItem[]>([
    {
      id: 1,
      title: "Summer Vibes EP",
      artist: "DJ Sunshine",
      type: "ep",
      mediaType: "audio",
      date: "2025-02-10",
      status: "pending",
      thumbnailUrl: "/placeholder.jpg",
      qualityScores: {
        overall: 87,
        bitrate: 92,
        format: 100,
        metadata: 78,
        sampleRate: 96,
        channels: 100,
        duration: 100
      },
      fileSize: 45678912,
      fileDetails: {
        format: "WAV",
        sampleRate: 44100,
        bitDepth: 24,
        channels: 2,
        duration: 15.3
      },
      label: "SunBeam Records",
      tracks: [
        {
          title: "Sunny Day",
          duration: "3:45",
          explicit: false,
          audioFile: {
            format: "WAV",
            sampleRate: 44100,
            bitDepth: 24,
            size: 45678912,
            validated: true
          }
        },
        {
          title: "Ocean Breeze",
          duration: "4:12",
          explicit: false,
          audioFile: {
            format: "WAV",
            sampleRate: 44100,
            bitDepth: 24,
            size: 50123456,
            validated: true
          }
        }
      ],
      artwork: "/placeholder.jpg",
      artworkDetails: {
        format: "JPG",
        dimensions: "3000x3000",
        size: 2456789,
        resolution: 300,
        validated: true
      }
    },
    {
      id: 2,
      title: "Night Drive",
      artist: "Electronic Flow",
      type: "single",
      mediaType: "audio",
      date: "2025-02-15",
      status: "approved",
      thumbnailUrl: "/placeholder.jpg",
      qualityScores: {
        overall: 95,
        bitrate: 98,
        format: 100,
        metadata: 92,
        sampleRate: 96,
        channels: 100,
        duration: 100
      },
      fileSize: 35678912,
      fileDetails: {
        format: "WAV",
        sampleRate: 48000,
        bitDepth: 24,
        channels: 2,
        duration: 3.8
      },
      label: "Neon Records",
      tracks: [
        {
          title: "Night Drive",
          duration: "3:42",
          explicit: false,
          audioFile: {
            format: "WAV",
            sampleRate: 48000,
            bitDepth: 24,
            size: 35678912,
            validated: true
          }
        }
      ],
      artwork: "/placeholder.jpg",
      artworkDetails: {
        format: "PNG",
        dimensions: "3000x3000",
        size: 3456789,
        resolution: 300,
        validated: true
      }
    },
    {
      id: 3,
      title: "Urban Timelapse",
      artist: "City Visuals",
      type: "video",
      mediaType: "video",
      date: "2025-02-18",
      status: "pending",
      thumbnailUrl: "/placeholder.jpg",
      qualityScores: {
        overall: 76,
        resolution: 80,
        framerate: 70,
        audio: 75
      },
      issues: ["Low audio quality in some sections", "Some frames have artifacts"],
      fileSize: 1234567890,
      fileDetails: {
        format: "MP4",
        dimensions: "1920x1080",
        duration: 180
      }
    },
    {
      id: 4,
      title: "Mountain Landscapes",
      artist: "Nature Photos",
      type: "image",
      mediaType: "image",
      date: "2025-02-20",
      status: "rejected",
      thumbnailUrl: "/placeholder.jpg",
      qualityScores: {
        overall: 45,
        resolution: 40,
        dimensions: 50,
        colorProfile: 60
      },
      issues: ["Resolution below minimum requirements", "Color profile not sRGB"],
      fileSize: 12345678,
      fileDetails: {
        format: "JPG",
        dimensions: "1500x1000"
      }
    },
    {
      id: 5,
      title: "Acoustic Sessions",
      artist: "Guitar Maestro",
      type: "album",
      mediaType: "audio",
      date: "2025-02-25",
      status: "pending",
      thumbnailUrl: "/placeholder.jpg",
      qualityScores: {
        overall: 82,
        bitrate: 85,
        format: 100,
        metadata: 75,
        sampleRate: 90,
        channels: 100,
        duration: 100
      },
      fileSize: 145678912,
      fileDetails: {
        format: "WAV",
        sampleRate: 44100,
        bitDepth: 16,
        channels: 2,
        duration: 45.2
      },
      label: "Acoustic Records",
      tracks: [
        {
          title: "Spanish Guitar",
          duration: "4:15",
          explicit: false,
          audioFile: {
            format: "WAV",
            sampleRate: 44100,
            bitDepth: 16,
            size: 25678912,
            validated: true
          }
        },
        {
          title: "Classical Memories",
          duration: "5:32",
          explicit: false,
          audioFile: {
            format: "WAV",
            sampleRate: 44100,
            bitDepth: 16,
            size: 30123456,
            validated: true
          }
        },
        {
          title: "Rainy Day",
          duration: "3:55",
          explicit: false,
          audioFile: {
            format: "WAV",
            sampleRate: 44100,
            bitDepth: 16,
            size: 23456789,
            validated: true,
            issues: ["Some clipping detected"]
          }
        }
      ],
      artwork: "/placeholder.jpg",
      artworkDetails: {
        format: "JPG",
        dimensions: "3000x3000",
        size: 2789456,
        resolution: 300,
        validated: true
      }
    }
  ]);

  // Filter content items based on search query and other filters
  const filteredItems = contentItems.filter(item => {
    // Filter by search query
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.artist.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by selected media types
    const matchesMediaType = selectedMediaTypes.includes(item.mediaType);
    
    // Filter by selected statuses
    const matchesStatus = selectedStatuses.includes(item.status);
    
    return matchesSearch && matchesMediaType && matchesStatus;
  });

  // Sort filtered items
  const sortedItems = [...filteredItems].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    
    switch (sortField) {
      case 'date':
        return direction * (new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'title':
        return direction * a.title.localeCompare(b.title);
      case 'status':
        return direction * a.status.localeCompare(b.status);
      case 'quality':
        return direction * (b.qualityScores.overall - a.qualityScores.overall);
      default:
        return 0;
    }
  });

  // Toggle media type filter
  const toggleMediaType = (type: MediaType) => {
    if (selectedMediaTypes.includes(type)) {
      // Remove if already selected (but prevent empty selection)
      if (selectedMediaTypes.length > 1) {
        setSelectedMediaTypes(selectedMediaTypes.filter(t => t !== type));
      }
    } else {
      // Add if not selected
      setSelectedMediaTypes([...selectedMediaTypes, type]);
    }
  };

  // Toggle status filter
  const toggleStatus = (status: ContentStatus) => {
    if (selectedStatuses.includes(status)) {
      // Remove if already selected (but prevent empty selection)
      if (selectedStatuses.length > 1) {
        setSelectedStatuses(selectedStatuses.filter(s => s !== status));
      }
    } else {
      // Add if not selected
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  // Handle status change
  const handleStatusChange = (id: number, newStatus: ContentStatus) => {
    setContentItems(
      contentItems.map(item => 
        item.id === id 
          ? { ...item, status: newStatus } 
          : item
      )
    );
  };

  return (
    <div className="space-y-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin/content-quality">Content & Quality</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content & Quality Management</h1>
          <p className="text-muted-foreground">
            Review and manage content uploads and quality standards
          </p>
        </div>
        <div className="flex items-center gap-4">
          <RefreshCw className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary" />
          <Button>
            <CheckCircle className="mr-2 h-4 w-4" />
            Batch Approve
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title, artist..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={sortField}
          onValueChange={(value) => setSortField(value as 'date' | 'title' | 'status' | 'quality')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="quality">Quality Score</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
        >
          {sortDirection === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedMediaTypes.includes('audio') ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => toggleMediaType('audio')}
        >
          <Music className="mr-1 h-3 w-3" />
          Audio
        </Badge>
        <Badge
          variant={selectedMediaTypes.includes('video') ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => toggleMediaType('video')}
        >
          <Video className="mr-1 h-3 w-3" />
          Video
        </Badge>
        <Badge
          variant={selectedMediaTypes.includes('image') ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => toggleMediaType('image')}
        >
          <ImageIcon className="mr-1 h-3 w-3" />
          Image
        </Badge>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <Badge
          variant={selectedStatuses.includes('pending') ? 'secondary' : 'outline'}
          className="cursor-pointer"
          onClick={() => toggleStatus('pending')}
        >
          <Clock className="mr-1 h-3 w-3" />
          Pending
        </Badge>
        <Badge
          variant={selectedStatuses.includes('approved') ? 'success' : 'outline'}
          className="cursor-pointer bg-green-600 hover:bg-green-500"
          onClick={() => toggleStatus('approved')}
        >
          <CheckCircle className="mr-1 h-3 w-3" />
          Approved
        </Badge>
        <Badge
          variant={selectedStatuses.includes('rejected') ? 'destructive' : 'outline'}
          className="cursor-pointer"
          onClick={() => toggleStatus('rejected')}
        >
          <XCircle className="mr-1 h-3 w-3" />
          Rejected
        </Badge>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedItems.map(item => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative h-48 bg-muted flex items-center justify-center">
                  {getTypeIcon(item.mediaType)}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge variant={
                      item.status === 'approved' ? 'success' : 
                      item.status === 'rejected' ? 'destructive' : 
                      'secondary'
                    }
                    className={item.status === 'approved' ? 'bg-green-600' : ''}
                    >
                      {item.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {item.status === 'rejected' && <XCircle className="mr-1 h-3 w-3" />}
                      {item.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="outline" className="bg-black/50 text-white border-none">
                      {item.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.artist}</CardDescription>
                    </div>
                    <div className="flex items-center">
                      <span className={`text-sm font-medium rounded-full px-2 py-1 ${
                        item.qualityScores.overall >= 90 ? 'bg-green-100 text-green-800' :
                        item.qualityScores.overall >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {item.qualityScores.overall}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  <div className="text-sm text-muted-foreground">
                    <span>Submitted: {new Date(item.date).toLocaleDateString()}</span>
                    {item.fileDetails?.format && (
                      <div className="mt-1">
                        Format: {item.fileDetails.format}
                        {item.fileDetails.dimensions && ` • ${item.fileDetails.dimensions}`}
                        {item.fileSize && ` • ${formatFileSize(item.fileSize)}`}
                      </div>
                    )}
                  </div>
                  
                  {item.issues && item.issues.length > 0 && (
                    <div className="text-sm text-red-500 flex items-start mt-2">
                      <AlertTriangle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                      <span>
                        {item.issues.length === 1 
                          ? item.issues[0] 
                          : `${item.issues.length} issues detected`}
                      </span>
                    </div>
                  )}
                  
                  <div className="pt-2 flex justify-between gap-2">
                    <Button 
                      size="sm" 
                      variant={item.status === 'approved' ? 'secondary' : 'default'}
                      className={item.status === 'approved' ? '' : 'bg-green-600 hover:bg-green-500'}
                      onClick={() => handleStatusChange(item.id, 'approved')}
                    >
                      <BadgeCheck className="h-4 w-4 mr-1" />
                      {item.status === 'approved' ? 'Approved' : 'Approve'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant={item.status === 'rejected' ? 'secondary' : 'destructive'}
                      onClick={() => handleStatusChange(item.id, 'rejected')}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      {item.status === 'rejected' ? 'Rejected' : 'Reject'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No items found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="list">
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 py-3 px-4 font-medium text-sm">
              <div className="col-span-5">Content</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-1">Score</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Actions</div>
            </div>
            
            {sortedItems.map(item => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 py-4 px-4 border-t items-center"
              >
                <div className="col-span-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      {getTypeIcon(item.mediaType)}
                    </div>
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.artist}</div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <Badge variant="outline">{item.type}</Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="col-span-1">
                  <div className={`text-sm font-medium rounded-full px-2 py-1 inline-flex ${
                    item.qualityScores.overall >= 90 ? 'bg-green-100 text-green-800' :
                    item.qualityScores.overall >= 70 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {item.qualityScores.overall}%
                  </div>
                </div>
                
                <div className="col-span-2">
                  <Badge variant={
                    item.status === 'approved' ? 'success' : 
                    item.status === 'rejected' ? 'destructive' : 
                    'secondary'
                  }
                  className={item.status === 'approved' ? 'bg-green-600' : ''}
                  >
                    {item.status === 'approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                    {item.status === 'rejected' && <XCircle className="mr-1 h-3 w-3" />}
                    {item.status === 'pending' && <Clock className="mr-1 h-3 w-3" />}
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                  
                  {item.issues && item.issues.length > 0 && (
                    <div className="text-xs text-red-500 flex items-center mt-1">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      <span>{item.issues.length} issues</span>
                    </div>
                  )}
                </div>
                
                <div className="col-span-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className={item.status === 'approved' ? 'text-green-600' : ''}
                    onClick={() => handleStatusChange(item.id, 'approved')}
                  >
                    <BadgeCheck className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={item.status === 'rejected' ? 'text-red-600' : ''}
                    onClick={() => handleStatusChange(item.id, 'rejected')}
                  >
                    <Ban className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No items found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}