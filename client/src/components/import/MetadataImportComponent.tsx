
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  FileText, 
  FileSpreadsheet, 
  FileJson, 
  Upload, 
  AlertCircle, 
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from 'axios';

interface ImportResult {
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string[];
  affectedItems?: number;
  totalItems?: number;
}

export interface MetadataImportComponentProps {
  onImportComplete?: (result: ImportResult) => void;
  supportedFormats?: string[];
  showTemplateDownload?: boolean;
}

export function MetadataImportComponent({
  onImportComplete,
  supportedFormats = ['excel', 'csv', 'json', 'xml'],
  showTemplateDownload = true,
}: MetadataImportComponentProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>('releases');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [validationMode, setValidationMode] = useState<'strict' | 'lenient'>('strict');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type based on supported formats
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (
        (fileExtension === 'xlsx' && supportedFormats.includes('excel')) ||
        (fileExtension === 'csv' && supportedFormats.includes('csv')) ||
        (fileExtension === 'json' && supportedFormats.includes('json')) ||
        (fileExtension === 'xml' && supportedFormats.includes('xml'))
      ) {
        setSelectedFile(file);
        setImportResult(null);
      } else {
        toast({
          title: "Unsupported file format",
          description: `Please upload a file in one of these formats: ${supportedFormats.join(', ')}`,
          variant: "destructive",
        });
        e.target.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('importType', importType);
    formData.append('validationMode', validationMode);

    try {
      // Simulate progress for better UX (replace with actual upload progress in production)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // Replace with actual API endpoint
      const response = await axios.post('/api/admin/import/metadata', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const result: ImportResult = response.data;
      setImportResult(result);
      
      if (onImportComplete) {
        onImportComplete(result);
      }

      if (result.status === 'success') {
        toast({
          title: "Import Successful",
          description: result.message,
        });
      } else if (result.status === 'warning') {
        toast({ // Remove unsupported 'warning' variant for toast
          title: "Import Completed with Warnings",
          description: result.message,
          // variant: "warning", // Assuming toast doesn't support 'warning'
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      
      setImportResult({
        status: 'error',
        message: "Import failed. Please check your file and try again.",
      });
      
      toast({
        title: "Import Failed",
        description: "There was an error processing your import. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = (format: string) => {
    // Replace with actual template download endpoints
    let endpoint = '';
    
    switch (format) {
      case 'excel':
        endpoint = '/api/admin/templates/releases-template.xlsx';
        break;
      case 'csv':
        endpoint = '/api/admin/templates/releases-template.csv';
        break;
      case 'json':
        endpoint = '/api/admin/templates/releases-template.json';
        break;
      case 'xml':
        endpoint = '/api/admin/templates/releases-template.xml';
        break;
    }
    
    window.open(endpoint, '_blank');
  };

  const getFileIcon = () => {
    if (!selectedFile) return null;
    
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'xlsx':
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
      case 'csv':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'json':
        return <FileJson className="h-8 w-8 text-amber-500" />;
      case 'xml':
        return <FileText className="h-8 w-8 text-purple-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle>Metadata Import Tool</CardTitle>
          <CardDescription>
            Import metadata for releases, tracks, and artists from Excel, CSV, JSON, or XML files.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="importType">Import Data Type</Label>
            <Select value={importType} onValueChange={setImportType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="releases">Releases</SelectItem>
                <SelectItem value="tracks">Tracks</SelectItem>
                <SelectItem value="artists">Artists</SelectItem>
                <SelectItem value="labels">Labels</SelectItem>
                <SelectItem value="isrc">ISRC Codes</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="validationMode">Validation Mode</Label>
            <Select value={validationMode} onValueChange={(value: 'strict' | 'lenient') => setValidationMode(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select validation mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strict">Strict (Abort on any error)</SelectItem>
                <SelectItem value="lenient">Lenient (Skip invalid entries)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-4">
            <Label htmlFor="fileUpload">Upload File</Label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Input
                  id="fileUpload"
                  type="file"
                  accept=".xlsx,.csv,.json,.xml"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
              {getFileIcon()}
            </div>
            
            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </div>
            )}
          </div>
          
          {showTemplateDownload && (
            <div className="space-y-4">
              <Label>Download Template</Label>
              <div className="flex flex-wrap gap-2">
                {supportedFormats.includes('excel') && (
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate('excel')}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                  </Button>
                )}
                {supportedFormats.includes('csv') && (
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate('csv')}>
                    <FileText className="mr-2 h-4 w-4" /> CSV
                  </Button>
                )}
                {supportedFormats.includes('json') && (
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate('json')}>
                    <FileJson className="mr-2 h-4 w-4" /> JSON
                  </Button>
                )}
                {supportedFormats.includes('xml') && (
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate('xml')}>
                    <FileText className="mr-2 h-4 w-4" /> XML
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
          
          {importResult && (
            // Map status to valid Alert variants ('default' or 'destructive')
            <Alert variant={importResult.status === 'error' ? 'destructive' : 'default'}>
              {importResult.status === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : importResult.status === 'warning' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {importResult.status === 'success'
                  ? 'Import Successful'
                  : importResult.status === 'warning'
                  ? 'Import Completed with Warnings'
                  : 'Import Failed'}
              </AlertTitle>
              <AlertDescription>
                <div>{importResult.message}</div>
                {importResult.details && importResult.details.length > 0 && (
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {importResult.details.slice(0, 5).map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                    {importResult.details.length > 5 && (
                      <li>...and {importResult.details.length - 5} more issues</li>
                    )}
                  </ul>
                )}
                {importResult.affectedItems !== undefined && importResult.totalItems !== undefined && (
                  <div className="mt-2 text-sm">
                    Processed {importResult.affectedItems} of {importResult.totalItems} items
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => {
            setSelectedFile(null);
            setImportResult(null);
            const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          }}>
            Reset
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
            ) : (
              <><Upload className="mr-2 h-4 w-4" /> Import {importType}</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
