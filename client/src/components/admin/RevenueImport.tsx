
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, AlertCircle, File, FileSpreadsheet, ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue, 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface RevenueReportRow {
  id?: number;
  reportingMonth: string;
  salesMonth: string;
  platform: string;
  country: string;
  labelName: string;
  artistName: string;
  releaseTitle: string;
  trackTitle: string;
  upc: string;
  isrc: string;
  releaseCatalog: string;
  releaseType: string;
  salesType: string;
  quantity: number;
  currency: string;
  netRevenue: number;
  labelRate: number;
  matched?: boolean;
  trackId?: number;
}

export function RevenueImport() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("upload");
  const [file, setFile] = useState<File | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "validating" | "importing" | "success" | "error">("idle");
  const [parsedData, setParsedData] = useState<RevenueReportRow[]>([]);
  const [mappedData, setMappedData] = useState<RevenueReportRow[]>([]);
  const [summary, setSummary] = useState<{
    totalRows: number;
    totalRevenue: number;
    totalStreams: number;
    matchedTracks: number;
    platforms: string[];
    dateRange: { start: string; end: string };
  }>({
    totalRows: 0,
    totalRevenue: 0,
    totalStreams: 0,
    matchedTracks: 0,
    platforms: [],
    dateRange: { start: "", end: "" }
  });
  const [showAllRows, setShowAllRows] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [delimiter, setDelimiter] = useState(";");
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportStatus("idle");
      setParsedData([]);
      setMappedData([]);
    }
  };
  
  // Parse CSV file
  const parseCSV = async (file: File, delimiter: string = ";") => {
    setImportStatus("parsing");
    setImportProgress(10);
    
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(line => line.trim());
      const headers = lines[0].split(delimiter).map(h => h.replace(/"/g, "").trim());
      
      // Map headers to our data structure
      const headerMap: Record<string, string> = {
        "Reporting month": "reportingMonth",
        "Sales Month": "salesMonth",
        "Platform": "platform",
        "Country / Region": "country",
        "Label Name": "labelName",
        "Artist Name": "artistName",
        "Release title": "releaseTitle",
        "Track title": "trackTitle",
        "UPC": "upc",
        "ISRC": "isrc",
        "Release Catalog nb": "releaseCatalog",
        "Release type": "releaseType",
        "Sales Type": "salesType",
        "Quantity": "quantity",
        "Client Payment Currency": "currency",
        "Net Revenue": "netRevenue",
        "Label rate": "labelRate"
      };
      
      // Parse data rows
      const data: RevenueReportRow[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const rowValues = lines[i].split(delimiter).map(val => val.replace(/"/g, "").trim());
        if (rowValues.length !== headers.length) continue;
        
        const row: any = {};
        headers.forEach((header, index) => {
          const mappedKey = headerMap[header] || header.toLowerCase().replace(/ /g, "");
          let value = rowValues[index];
          
          // Convert number fields
          if (mappedKey === "quantity") {
            row[mappedKey] = parseInt(value) || 0;
          } else if (mappedKey === "netRevenue" || mappedKey === "labelRate") {
            row[mappedKey] = parseFloat(value.replace(",", ".")) || 0;
          } else {
            row[mappedKey] = value;
          }
        });
        
        data.push(row as RevenueReportRow);
      }
      
      setParsedData(data);
      setImportProgress(30);
      setImportStatus("validating");
      
      return data;
    } catch (error) {
      console.error("Error parsing CSV:", error);
      setImportStatus("error");
      setErrorMessage("Failed to parse the CSV file. Please check the format and try again.");
      return [];
    }
  };
  
  // Find matching tracks by ISRC
  const matchTracksWithISRC = useMutation({
    mutationFn: async (data: RevenueReportRow[]) => {
      setImportProgress(50);
      const response = await apiRequest("POST", "/api/admin/match-tracks", {
        isrcs: [...Array.from(new Set(data.map(row => row.isrc).filter(isrc => isrc)))],
      });
      
      if (!response.ok) {
        throw new Error("Failed to match tracks with ISRCs");
      }
      
      return await response.json();
    },
    onSuccess: (matchedTracks, variables) => {
      setImportProgress(70);
      
      // Map the matched tracks to our data
      const mappedRows = parsedData.map(row => {
        const match = matchedTracks.find((track: any) => track.metadata?.isrc === row.isrc);
        return {
          ...row,
          matched: !!match,
          trackId: match?.id || undefined
        };
      });
      
      setMappedData(mappedRows);
      
      // Create summary
      const uniquePlatforms = [...Array.from(new Set(mappedRows.map(row => row.platform)))];
      const dates = mappedRows.map(row => new Date(row.reportingMonth));
      const startDate = new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
      const endDate = new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0];
      
      setSummary({
        totalRows: mappedRows.length,
        totalRevenue: mappedRows.reduce((sum, row) => sum + row.netRevenue, 0),
        totalStreams: mappedRows.reduce((sum, row) => sum + row.quantity, 0),
        matchedTracks: mappedRows.filter(row => row.matched).length,
        platforms: uniquePlatforms,
        dateRange: { start: startDate, end: endDate }
      });
      
      setImportStatus("success");
      setImportProgress(90);
      setActiveTab("review");
    },
    onError: (error) => {
      console.error("Error matching tracks:", error);
      setImportStatus("error");
      setErrorMessage("Failed to match tracks with ISRCs. Please try again.");
    }
  });
  
  // Import the revenue data
  const importRevenueData = useMutation({
    mutationFn: async (data: RevenueReportRow[]) => {
      setImportStatus("importing");
      setImportProgress(80);
      
      const response = await apiRequest("POST", "/api/admin/import-revenue", {
        data: data.filter(row => row.matched),
      });
      
      if (!response.ok) {
        throw new Error("Failed to import revenue data");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      setImportProgress(100);
      setImportStatus("success");
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      
      toast({
        title: "Import Successful",
        description: `Imported ${mappedData.filter(row => row.matched).length} revenue records`,
      });
      
      setActiveTab("summary");
    },
    onError: (error) => {
      console.error("Error importing revenue:", error);
      setImportStatus("error");
      setErrorMessage("Failed to import revenue data. Please try again.");
    }
  });
  
  // Handle the import process
  const handleImport = async () => {
    if (!file) return;
    
    try {
      const data = await parseCSV(file, delimiter);
      await matchTracksWithISRC.mutateAsync(data);
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus("error");
      setErrorMessage("An error occurred during the import process. Please try again.");
    }
  };
  
  // Complete the import by saving data
  const handleConfirmImport = () => {
    importRevenueData.mutate(mappedData);
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="review" disabled={mappedData.length === 0}>Review</TabsTrigger>
          <TabsTrigger value="summary" disabled={importStatus !== "success" || !summary.totalRows}>Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Revenue Report</CardTitle>
              <CardDescription>
                Import revenue, streams, and analytics data from your distribution service reports
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-1/4">
                    <Select value={delimiter} onValueChange={setDelimiter}>
                      <SelectTrigger id="delimiter">
                        <SelectValue placeholder="Delimiter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=";">Semicolon (;)</SelectItem>
                        <SelectItem value=",">Comma (,)</SelectItem>
                        <SelectItem value="\t">Tab</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                {file && (
                  <p className="text-sm text-muted-foreground">
                    Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
              
              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertTitle>File Format Requirements</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                    <li>CSV file with semicolon or comma separation</li>
                    <li>Required columns: ISRC, Platform, Revenue, Quantity (streams)</li>
                    <li>Reports from major distributors (CD Baby, DistroKid, TuneCore) are supported</li>
                    <li>Files must include headers in the first row</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              {importStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              {(importStatus === "parsing" || importStatus === "validating" || importStatus === "importing") && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      {importStatus === "parsing" && "Parsing CSV file..."}
                      {importStatus === "validating" && "Validating and matching tracks..."}
                      {importStatus === "importing" && "Importing revenue data..."}
                    </p>
                    <span className="text-sm font-medium">{importProgress}%</span>
                  </div>
                  <Progress value={importProgress} className="h-2" />
                </div>
              )}
              
              <Button
                onClick={handleImport}
                disabled={!file || importStatus === "parsing" || importStatus === "validating" || importStatus === "importing"}
                className="w-full"
              >
                {importStatus === "parsing" || importStatus === "validating" || importStatus === "importing"
                  ? "Processing..."
                  : "Import Data"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="review" className="space-y-4 py-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Review Imported Data</CardTitle>
                <CardDescription>
                  {mappedData.length} records found, {mappedData.filter(row => row.matched).length} matched with tracks
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={() => setShowAllRows(!showAllRows)} variant="outline" size="sm">
                  {showAllRows ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
                  {showAllRows ? "Show Less" : "Show All"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Track Title</TableHead>
                      <TableHead>ISRC</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Streams</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showAllRows ? mappedData : mappedData.slice(0, 10)).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {row.matched ? (
                            <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                              <Check className="mr-1 h-3 w-3" />
                              Matched
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                              <AlertCircle className="mr-1 h-3 w-3" />
                              Unmatched
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.trackTitle}</TableCell>
                        <TableCell>{row.isrc}</TableCell>
                        <TableCell>{row.platform}</TableCell>
                        <TableCell>{row.country}</TableCell>
                        <TableCell className="text-right">{row.quantity.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{row.currency} {row.netRevenue.toFixed(6)}</TableCell>
                      </TableRow>
                    ))}
                    {!showAllRows && mappedData.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-2">
                          Showing 10 of {mappedData.length} rows. Click "Show All" to see all records.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button variant="outline" onClick={() => setActiveTab("upload")}>
                  Back to Upload
                </Button>
                <Button 
                  onClick={handleConfirmImport}
                  disabled={mappedData.filter(row => row.matched).length === 0}
                >
                  Import {mappedData.filter(row => row.matched).length} Records
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary" className="space-y-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>Import Summary</CardTitle>
              <CardDescription>
                Revenue data has been successfully imported
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <div className="text-xs font-medium text-muted-foreground">Total Records</div>
                  <div className="mt-1 text-xl font-bold">{summary.totalRows}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs font-medium text-muted-foreground">Matched Tracks</div>
                  <div className="mt-1 text-xl font-bold">{summary.matchedTracks}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs font-medium text-muted-foreground">Total Streams</div>
                  <div className="mt-1 text-xl font-bold">{summary.totalStreams.toLocaleString()}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs font-medium text-muted-foreground">Total Revenue</div>
                  <div className="mt-1 text-xl font-bold">€{summary.totalRevenue.toFixed(2)}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs font-medium text-muted-foreground">Platforms</div>
                  <div className="mt-1 text-xl font-bold">{summary.platforms.length}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs font-medium text-muted-foreground">Date Range</div>
                  <div className="mt-1 text-sm font-medium">
                    {summary.dateRange.start} - {summary.dateRange.end}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {summary.platforms.map((platform) => (
                    <div key={platform} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                      {platform}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6">
                <Button onClick={() => setActiveTab("upload")} className="w-full">
                  Import Another Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
