
import * as React from "react";
import { useState } from "react";
import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, TabsContent, TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { IsrcImportTool } from "@/components/upload/IsrcImportTool";
import { IsrcManagerAdmin } from "@/components/upload/IsrcManagerAdmin";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  FileSpreadsheet, UploadCloud, CheckCircle, AlertCircle, Download, BarChart, FileX, Info 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

// Mock history data
const importHistory = [
  { id: 1, fileName: "revenue_q1_2023.xlsx", type: "Revenue", status: "success", date: "2023-04-15", records: 1245 },
  { id: 2, fileName: "platform_analytics_march.xlsx", type: "Analytics", status: "success", date: "2023-04-10", records: 789 },
  { id: 3, fileName: "user_engagement_q1.xlsx", type: "Engagement", status: "failed", date: "2023-04-08", errors: "Invalid data format in row 23" },
  { id: 4, fileName: "streaming_stats_feb_2023.xlsx", type: "Streaming", status: "success", date: "2023-03-15", records: 2134 },
  { id: 5, fileName: "revenue_by_country_jan_2023.xlsx", type: "Revenue", status: "processing", date: "2023-02-10", progress: 45 }
];

// Template mapping
const templateOptions = [
  { value: "revenue", label: "Revenue Report" },
  { value: "analytics", label: "Analytics Report" },
  { value: "engagement", label: "User Engagement" },
  { value: "streaming", label: "Streaming Statistics" },
  { value: "demographics", label: "Audience Demographics" },
  { value: "royalties", label: "Royalty Distribution" }
];

export default function DataImportsPage() {
  const [activeTab, setActiveTab] = useState("upload");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{success: boolean; message: string} | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
      setUploadResult(null);
    }
  };

  const handleUpload = () => {
    if (!uploadedFile || !selectedTemplate) {
      setUploadResult({
        success: false,
        message: "Please select both a file and a template type"
      });
      return;
    }

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
            message: `Successfully imported ${uploadedFile.name}`
          });
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const downloadTemplate = (templateType: string) => {
    // In a real app, this would download the actual template
    alert(`Downloading ${templateType} template...`);
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Data Imports</h2>
          <p className="text-muted-foreground mt-2">
            Import Excel sheets for analytics reports, revenue statistics, and other data
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">Upload Data</TabsTrigger>
            <TabsTrigger value="history">Import History</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="isrc">ISRC Management</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Import Data File</CardTitle>
                <CardDescription>
                  Upload Excel files (.xlsx, .xls) or CSV files to import data into the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2 md:col-span-3">
                    <label className="text-sm font-medium">Select File</label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept=".xlsx,.xls,.csv" 
                        onChange={handleFileChange}
                        className="flex-1" 
                      />
                      {uploadedFile && (
                        <Button variant="outline" size="icon" onClick={() => setUploadedFile(null)}>
                          <FileX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {uploadedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)} KB)
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Data Type</label>
                    <select 
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                    >
                      <option value="">Select type...</option>
                      {templateOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
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

                <div className="flex justify-between items-center pt-2">
                  <Button variant="outline" onClick={() => downloadTemplate(selectedTemplate || 'default')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Template
                  </Button>
                  <Button 
                    onClick={handleUpload} 
                    disabled={isUploading || !uploadedFile || !selectedTemplate}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {isUploading ? "Uploading..." : "Import Data"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Format Requirements</AlertTitle>
              <AlertDescription className="mt-2">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Ensure your Excel file has the correct column headers as in the template</li>
                  <li>Maximum file size: 10MB</li>
                  <li>Dates should be in YYYY-MM-DD format</li>
                  <li>Use the Templates tab to download standard import templates</li>
                </ul>
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Import History</CardTitle>
                <CardDescription>
                  View history of all data imports and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                            <span>{item.fileName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          {item.status === "success" && (
                            <Badge variant="success" className="bg-green-100 text-green-800">Successful</Badge>
                          )}
                          {item.status === "failed" && (
                            <Badge variant="destructive">Failed</Badge>
                          )}
                          {item.status === "processing" && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">Processing</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.status === "success" && `${item.records} records`}
                          {item.status === "failed" && (
                            <span className="text-red-600 text-sm">{item.errors}</span>
                          )}
                          {item.status === "processing" && (
                            <Progress value={item.progress} className="h-2 w-24" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <BarChart className="h-4 w-4 mr-2" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Import Templates</CardTitle>
                <CardDescription>
                  Download standardized templates for data imports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {templateOptions.map((template) => (
                    <Card key={template.value} className="overflow-hidden">
                      <CardHeader className="bg-muted/50 py-3">
                        <CardTitle className="text-md flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          {template.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">
                          Standard template for importing {template.label.toLowerCase()} data
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => downloadTemplate(template.value)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="isrc">
            <Card>
              <CardHeader>
                <CardTitle>ISRC Code Management</CardTitle>
                <CardDescription>
                  Bulk assign ISRC codes to tracks or import them from distributor data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Mock data for ISRC management */}
                  <IsrcManagerAdmin />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
}
