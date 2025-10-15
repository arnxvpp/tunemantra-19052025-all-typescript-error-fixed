import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  CheckCircle,
  FileAudio,
  Fingerprint,
  AlertCircle,
  UploadCloud,
  Settings,
  List,
  Grid,
  Music,
  Edit,
  MoreHorizontal,
  AlertTriangle,
  Shield,
  Layers
} from 'lucide-react';

// Sample tracks data for demo purposes
const sampleTracks = [
  {
    id: 1,
    title: 'Summer Vibes',
    artist: 'John Doe',
    album: 'Summer EP',
    duration: '3:42',
    status: 'ready',
    fingerprintStatus: 'verified',
    fingerprintConfidence: 0.95,
    matchTitle: 'Summer Vibes',
    matchArtist: 'John Doe',
    issues: null
  },
  {
    id: 2,
    title: 'Midnight Drive',
    artist: 'Ellie Smith',
    album: 'Night Sounds',
    duration: '4:15',
    status: 'ready',
    fingerprintStatus: 'verified',
    fingerprintConfidence: 0.89,
    matchTitle: 'Midnight Drive',
    matchArtist: 'Ellie Smith',
    issues: null
  },
  {
    id: 3,
    title: 'Ocean Waves',
    artist: 'Maria Gonzalez',
    album: 'Coastal Moods',
    duration: '5:30',
    status: 'ready',
    fingerprintStatus: 'warning',
    fingerprintConfidence: 0.72,
    matchTitle: 'Ocean Waves (Original Mix)',
    matchArtist: 'Maria Gonzalez',
    issues: 'Title mismatch'
  },
  {
    id: 4,
    title: 'Dancing in the Rain',
    artist: 'Alex Johnson',
    album: 'Weather Patterns',
    duration: '3:15',
    status: 'pending',
    fingerprintStatus: 'pending',
    fingerprintConfidence: null,
    matchTitle: null,
    matchArtist: null,
    issues: null
  },
  {
    id: 5,
    title: 'Electric Dreams',
    artist: 'Techno Collective',
    album: 'Future Sounds',
    duration: '6:48',
    status: 'ready',
    fingerprintStatus: 'alert',
    fingerprintConfidence: 0.89,
    matchTitle: 'Digital Dreams',
    matchArtist: 'Synth Masters',
    issues: 'Potential copyright conflict'
  }
];

export default function EnhancedTrackManagerDemo() {
  const { toast } = useToast();
  const [tracks] = useState(sampleTracks);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedTrack, setSelectedTrack] = useState<typeof sampleTracks[0] | null>(null);

  // Handle fingerprint analysis button click
  const handleAnalyze = (track: typeof sampleTracks[0]) => {
    setSelectedTrack(track);
    if (track.fingerprintStatus === 'pending') {
      toast({
        title: 'Starting Analysis',
        description: `Analyzing "${track.title}" - please wait a moment...`,
      });
      
      // In a real implementation, this would call the API
      // For now, we'll just leave it as is
    }
  };

  // Handle viewing fingerprint results
  const handleViewResults = (track: typeof sampleTracks[0]) => {
    setSelectedTrack(track);
  };

  // Get badge variant based on fingerprint status
  const getFingerprintBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Verified</Badge>;
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200">Warning</Badge>;
      case 'alert':
        return <Badge variant="destructive">Alert</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  // Get icon for fingerprint status
  const getFingerprintIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
      default:
        return <Fingerprint className="h-4 w-4 text-gray-400" />;
    }
  };

  // Render list view of tracks
  const renderListView = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Album</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Fingerprint</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tracks.map((track) => (
            <TableRow key={track.id}>
              <TableCell className="font-medium">{track.title}</TableCell>
              <TableCell>{track.artist}</TableCell>
              <TableCell>{track.album}</TableCell>
              <TableCell>{track.duration}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  {getFingerprintIcon(track.fingerprintStatus)}
                  <span className="ml-2">{getFingerprintBadge(track.fingerprintStatus)}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleViewResults(track)} disabled={track.fingerprintStatus === 'pending'}>
                    <FileAudio className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Render grid view of tracks
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tracks.map((track) => (
          <Card key={track.id} className="overflow-hidden">
            <CardHeader className="pb-4 pt-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base mb-1">{track.title}</CardTitle>
                  <CardDescription className="text-sm">{track.artist}</CardDescription>
                </div>
                {getFingerprintBadge(track.fingerprintStatus)}
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="text-sm text-muted-foreground mb-4">
                <div>Album: {track.album}</div>
                <div>Duration: {track.duration}</div>
              </div>
              
              {track.issues && (
                <Alert variant="destructive" className="py-2 text-sm mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-xs font-medium">Issue Detected</AlertTitle>
                  <AlertDescription className="text-xs">{track.issues}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="pt-0 flex gap-2 justify-end border-t px-4 py-3 bg-muted/10">
              <Button variant="outline" size="sm" onClick={() => handleViewResults(track)} disabled={track.fingerprintStatus === 'pending'}>
                <FileAudio className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Results</span>
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Edit</span>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  // Render track details panel
  const renderTrackDetails = () => {
    if (!selectedTrack) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Track Details</CardTitle>
              <CardDescription>
                Fingerprint analysis results for {selectedTrack.title}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedTrack(null)}>
              <AlertCircle className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedTrack.fingerprintStatus === 'pending' ? (
            <div className="text-center py-8">
              <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Fingerprint Analysis Pending</h3>
              <p className="text-muted-foreground mb-4">
                This track hasn't been analyzed yet. Run fingerprint analysis to identify potential issues.
              </p>
              <Button>
                <Fingerprint className="h-4 w-4 mr-2" />
                Start Fingerprint Analysis
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="results">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="results">Analysis Results</TabsTrigger>
                <TabsTrigger value="metadata">Metadata Match</TabsTrigger>
                <TabsTrigger value="issues">{selectedTrack.issues ? 'Issues' : 'No Issues'}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="results" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Confidence Score</Label>
                    <div className="font-medium text-lg">
                      {selectedTrack.fingerprintConfidence 
                        ? `${(selectedTrack.fingerprintConfidence * 100).toFixed(0)}%` 
                        : 'N/A'}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Status</Label>
                    <div className="font-medium">{getFingerprintBadge(selectedTrack.fingerprintStatus)}</div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Match Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Matched Title</Label>
                      <div className="text-sm font-medium">{selectedTrack.matchTitle || 'No match found'}</div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-muted-foreground text-xs">Matched Artist</Label>
                      <div className="text-sm font-medium">{selectedTrack.matchArtist || 'No match found'}</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="metadata" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium mb-2">Metadata Comparison</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-xs font-medium text-muted-foreground">Field</div>
                    <div className="text-xs font-medium text-muted-foreground">Your Track</div>
                    <div className="text-xs font-medium text-muted-foreground">Detected</div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm py-2 font-medium">Title</div>
                    <div className="text-sm py-2 bg-muted/20 px-2 rounded">
                      {selectedTrack.title}
                    </div>
                    <div className={`text-sm py-2 bg-muted/20 px-2 rounded ${
                      selectedTrack.matchTitle && selectedTrack.title !== selectedTrack.matchTitle 
                        ? 'text-amber-600 bg-amber-50' 
                        : ''
                    }`}>
                      {selectedTrack.matchTitle || 'Not detected'}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-sm py-2 font-medium">Artist</div>
                    <div className="text-sm py-2 bg-muted/20 px-2 rounded">
                      {selectedTrack.artist}
                    </div>
                    <div className={`text-sm py-2 bg-muted/20 px-2 rounded ${
                      selectedTrack.matchArtist && selectedTrack.artist !== selectedTrack.matchArtist 
                        ? 'text-amber-600 bg-amber-50' 
                        : ''
                    }`}>
                      {selectedTrack.matchArtist || 'Not detected'}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="issues" className="mt-4">
                {selectedTrack.issues ? (
                  <Alert variant="destructive" className="mb-4 bg-yellow-50 border-yellow-200 text-yellow-800">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle>Issue Detected</AlertTitle>
                    <AlertDescription>{selectedTrack.issues}</AlertDescription>
                  </Alert>
                ) : (
                  <Alert className="mb-4 bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">No Issues Detected</AlertTitle>
                    <AlertDescription className="text-green-700">
                      This track passed all fingerprint validation checks
                    </AlertDescription>
                  </Alert>
                )}
                
                {selectedTrack.fingerprintStatus === 'alert' && (
                  <div className="mt-4 border rounded-md p-4 space-y-4">
                    <h3 className="font-medium">Recommended Actions</h3>
                    <ul className="list-disc space-y-2 pl-5 text-sm">
                      <li className="text-muted-foreground">Verify that you have proper rights to all samples used</li>
                      <li className="text-muted-foreground">Check if this is an original work or a derivative</li>
                      <li className="text-muted-foreground">Contact copyright holder for clearance if needed</li>
                    </ul>
                    <div className="pt-2">
                      <Button variant="outline" className="w-full">
                        <Shield className="h-4 w-4 mr-2" />
                        Request Rights Verification
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="border-t flex justify-between">
          <Button variant="ghost">Close Details</Button>
          {selectedTrack.fingerprintStatus !== 'pending' && (
            <Button variant="outline">
              <Fingerprint className="h-4 w-4 mr-2" />
              Re-analyze
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="container py-8 max-w-6xl">
      <div className="mb-8">
        <Link href="/audio-fingerprinting" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Audio Fingerprinting
        </Link>
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <Layers className="h-8 w-8 mr-2 text-primary" />
          Enhanced Track Manager
        </h1>
        <p className="text-muted-foreground">
          Manage your tracks with integrated fingerprinting and validation
        </p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button variant="outline">
            <UploadCloud className="h-4 w-4 mr-2" />
            Upload Tracks
          </Button>
          <Button variant="outline">
            <Fingerprint className="h-4 w-4 mr-2" />
            Analyze All
          </Button>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="text-sm text-muted-foreground mr-2">View:</div>
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('list')}
            className="h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'default' : 'outline'} 
            size="icon"
            onClick={() => setViewMode('grid')}
            className="h-8 w-8"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Tracks</CardTitle>
              <CardDescription>
                Manage and validate your music catalog
              </CardDescription>
            </div>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {viewMode === 'list' ? renderListView() : renderGridView()}
          </div>
        </CardContent>
        <CardFooter className="border-t flex justify-between py-4">
          <div className="text-sm text-muted-foreground">
            Showing {tracks.length} tracks
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </CardFooter>
      </Card>

      {renderTrackDetails()}
    </div>
  );
}