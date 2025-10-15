import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IsrcImportTool } from "./IsrcImportTool";
import { 
  CheckCircle, FileSpreadsheet, UploadCloud, Download, Tag, AlertCircle 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

// Define track type for proper typing
interface Track {
  id: number;
  trackNumber: string;
  trackTitle: string;
  primaryArtist: string;
  isrc?: string;
  isrcStatus?: "pending" | "assigned" | "error";
}

// Mock data for tracks
const mockTracks: Track[] = [
  { id: 1, trackNumber: "1", trackTitle: "Lost in the Echoes", primaryArtist: "Luna Eclipse", isrc: "USRC17842391", isrcStatus: "assigned" },
  { id: 2, trackNumber: "2", trackTitle: "Midnight Reverie", primaryArtist: "Luna Eclipse", isrc: "USRC17842392", isrcStatus: "assigned" },
  { id: 3, trackNumber: "3", trackTitle: "Stellar Journey", primaryArtist: "Luna Eclipse", isrc: "", isrcStatus: "pending" },
  { id: 4, trackNumber: "4", trackTitle: "Cosmic Whispers", primaryArtist: "Luna Eclipse ft. Orion", isrc: "", isrcStatus: "pending" },
  { id: 5, trackNumber: "5", trackTitle: "Nebula Dreams", primaryArtist: "Luna Eclipse", isrc: "USRC17842395", isrcStatus: "assigned" },
  { id: 6, trackNumber: "1", trackTitle: "Urban Melodies", primaryArtist: "Metro Sound", isrc: "", isrcStatus: "pending" },
  { id: 7, trackNumber: "2", trackTitle: "City Lights", primaryArtist: "Metro Sound", isrc: "", isrcStatus: "pending" },
  { id: 8, trackNumber: "3", trackTitle: "Concrete Jungle", primaryArtist: "Metro Sound", isrc: "USRC18651173", isrcStatus: "assigned" },
];

// Mock data for recent imports
const recentImports = [
  { id: 1, fileName: "spotify_isrc_codes.xlsx", date: "2023-05-10", tracks: 125, success: true },
  { id: 2, fileName: "apple_music_metadata.csv", date: "2023-05-05", tracks: 87, success: true },
  { id: 3, fileName: "tidal_codes_batch5.xlsx", date: "2023-04-28", tracks: 53, success: false, error: "Invalid format in row 34" },
  { id: 4, fileName: "deezer_isrc_update.csv", date: "2023-04-15", tracks: 42, success: true },
];

export function IsrcManagerAdmin() {
  const [activeTab, setActiveTab] = useState("assign");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const filteredTracks = mockTracks.filter(track => 
    track.trackTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.primaryArtist.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (track.isrc && track.isrc.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Simulate ISRC assignment
  const handleAssignIsrc = async (trackId: number, isrc: string) => {
    // Here we would make an API call to assign the ISRC
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Assigned ISRC ${isrc} to track ${trackId}`);
        resolve();
      }, 500);
    });
  };

  // Simulate bulk ISRC assignment
  const handleBulkAssignIsrc = async (assignments: { trackId: number; isrc: string }[]) => {
    // Here we would make an API call for bulk assignment
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log(`Bulk assigned ${assignments.length} ISRCs:`, assignments);
        resolve();
      }, 1000);
    });
  };

  const handleFileUpload = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          setUploadResult({
            success: true,
            message: `Successfully imported ${selectedFile.name} with ISRC codes`
          });
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assign">Assign ISRCs</TabsTrigger>
          <TabsTrigger value="import">Import from File</TabsTrigger>
          <TabsTrigger value="history">Import History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="assign" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Input
                type="search"
                placeholder="Search tracks by title, artist, or ISRC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export ISRCs
            </Button>
          </div>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Track ISRC Management</CardTitle>
            </CardHeader>
            <CardContent>
              <IsrcImportTool 
                tracks={filteredTracks}
                onAssignIsrc={handleAssignIsrc}
                onBulkAssignIsrc={handleBulkAssignIsrc}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Import ISRCs from File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <div className="flex gap-2">
                  <Input 
                    id="file-upload"
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={(e) => e.target.files && setSelectedFile(e.target.files[0])}
                  />
                  <Button onClick={handleFileUpload} disabled={!selectedFile || isUploading}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {uploadResult && (
                <Alert variant={uploadResult.success ? "default" : "destructive"}>
                  {uploadResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {uploadResult.success ? "Success" : "Error"}
                  </AlertTitle>
                  <AlertDescription>
                    {uploadResult.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Format Requirements</Label>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Upload Excel or CSV file with 'Track ID' and 'ISRC' columns</li>
                  <li>Ensure track IDs match the system's internal IDs</li>
                  <li>Alternative identifier columns: 'Title', 'Artist', 'Album', 'Track Number'</li>
                  <li>For new tracks, ISRCs will be assigned if they don't already exist</li>
                </ul>
              </div>

              <div className="pt-4">
                <h3 className="font-semibold mb-2">Download Templates</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto py-2 justify-start">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Excel Template</div>
                      <div className="text-xs text-muted-foreground">With column headers and examples</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-auto py-2 justify-start">
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">CSV Template</div>
                      <div className="text-xs text-muted-foreground">Simple format for all systems</div>
                    </div>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>ISRC Import History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Tracks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentImports.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                          <span>{item.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.tracks} tracks</TableCell>
                      <TableCell>
                        {item.success ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">Successful</Badge>
                        ) : (
                          <Badge variant="destructive">Failed</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          {item.success ? 'Download' : 'View Errors'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}