import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Download, Upload } from "lucide-react";

// Sample data for imported reports
const importedReports = [
  { 
    id: 1, 
    name: "Spotify Q1 2024", 
    source: "Spotify", 
    importDate: "2024-04-02", 
    status: "processed", 
    tracks: 48, 
    totalStreams: 852340, 
    revenue: 4218.75 
  },
  { 
    id: 2, 
    name: "Apple Music March 2024", 
    source: "Apple Music", 
    importDate: "2024-04-01", 
    status: "processed", 
    tracks: 32, 
    totalStreams: 426120, 
    revenue: 2563.25 
  },
  { 
    id: 3, 
    name: "YouTube Music Q1 2024", 
    source: "YouTube Music", 
    importDate: "2024-03-28", 
    status: "processing", 
    tracks: 52, 
    totalStreams: null, 
    revenue: null 
  },
  { 
    id: 4, 
    name: "Amazon Music March 2024", 
    source: "Amazon Music", 
    importDate: "2024-03-25", 
    status: "processed", 
    tracks: 29, 
    totalStreams: 246780, 
    revenue: 1358.42 
  },
  { 
    id: 5, 
    name: "Tidal Q1 2024", 
    source: "Tidal", 
    importDate: "2024-03-22", 
    status: "error", 
    tracks: null, 
    totalStreams: null, 
    revenue: null 
  }
];

export default function ImportReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Filter reports based on search query and status filter
  const filteredReports = importedReports.filter(report => {
    const matchesSearch = 
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.source.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || 
      report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="imports" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="imports">Imported Reports</TabsTrigger>
          <TabsTrigger value="upload">Upload New Report</TabsTrigger>
        </TabsList>
        
        <TabsContent value="imports" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export List
            </Button>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Imported Reports</CardTitle>
              <CardDescription>
                Manage and view analytics reports imported from various platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Import Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Tracks</TableHead>
                    <TableHead className="text-right">Total Streams</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>{report.source}</TableCell>
                      <TableCell>{report.importDate}</TableCell>
                      <TableCell>
                        {report.status === "processed" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Processed
                          </Badge>
                        )}
                        {report.status === "processing" && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing
                          </Badge>
                        )}
                        {report.status === "error" && (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            <AlertCircle className="w-3.5 h-3.5 mr-1" /> Error
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{report.tracks || "-"}</TableCell>
                      <TableCell className="text-right">{report.totalStreams ? report.totalStreams.toLocaleString() : "-"}</TableCell>
                      <TableCell className="text-right">{report.revenue ? `$${report.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredReports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        No reports found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredReports.length} of {importedReports.length} reports
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload New Report</CardTitle>
              <CardDescription>
                Import analytics reports from streaming platforms and distributors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input id="report-name" placeholder="Enter a descriptive name for this report" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="report-source">Source Platform</Label>
                <Select>
                  <SelectTrigger id="report-source">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spotify">Spotify</SelectItem>
                    <SelectItem value="apple">Apple Music</SelectItem>
                    <SelectItem value="youtube">YouTube Music</SelectItem>
                    <SelectItem value="amazon">Amazon Music</SelectItem>
                    <SelectItem value="tidal">Tidal</SelectItem>
                    <SelectItem value="deezer">Deezer</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="report-date">Report Period</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Input type="date" placeholder="From" />
                  <Input type="date" placeholder="To" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Report File</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">Drag and drop your report file, or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports CSV, Excel, and JSON formats (Max 50MB)
                  </p>
                  <Input type="file" className="hidden" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Upload className="mr-2 h-4 w-4" /> Upload Report
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}