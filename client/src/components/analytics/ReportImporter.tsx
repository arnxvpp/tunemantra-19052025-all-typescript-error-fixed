import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronDown, 
  Database, 
  FileSpreadsheet, 
  FileText, 
  UploadCloud, 
  X,
  Info,
  Check
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Import type definitions
type ReportType = 'analytics' | 'revenue' | 'isrc' | 'custom';

interface ColumnMapping {
  [key: string]: string;
}

interface ReportImporterProps {
  onImportComplete?: (data: any[], mappedData: any[], reportType: ReportType) => void;
}

export function ReportImporter({ onImportComplete }: ReportImporterProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [delimiter, setDelimiter] = useState<string>(';');
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [isPreviewReady, setIsPreviewReady] = useState<boolean>(false);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [showMappingDialog, setShowMappingDialog] = useState<boolean>(false);
  const [importedData, setImportedData] = useState<any[]>([]);
  const [isImported, setIsImported] = useState<boolean>(false);

  // Standard mappings for different report types
  const standardMappings: { [key in ReportType]: { [key: string]: string } } = {
    revenue: {
      'Platform': 'platform',
      'Country / Region': 'region',
      'Label Name': 'label',
      'Artist Name': 'artist',
      'Release title': 'releaseTitle',
      'Track title': 'trackTitle',
      'UPC': 'upc',
      'ISRC': 'isrc',
      'Sales Type': 'salesType',
      'Quantity': 'quantity',
      'Net Revenue': 'revenue',
      'Reporting month': 'reportingMonth',
      'Sales Month': 'salesMonth'
    },
    analytics: {
      'Platform': 'platform',
      'Country': 'region',
      'Label': 'label',
      'Artist': 'artist',
      'Release': 'releaseTitle',
      'Track': 'trackTitle',
      'UPC': 'upc',
      'ISRC': 'isrc',
      'Type': 'type',
      'Streams': 'streams',
      'Date': 'date'
    },
    isrc: {
      'Track': 'trackTitle',
      'ISRC': 'isrc',
      'Artist': 'artist',
      'Release': 'releaseTitle',
      'UPC': 'upc'
    },
    custom: {}
  };

  // Required fields for each report type
  const requiredFields: { [key in ReportType]: string[] } = {
    revenue: ['platform', 'artist', 'trackTitle', 'isrc', 'revenue', 'reportingMonth'],
    analytics: ['platform', 'artist', 'trackTitle', 'isrc', 'streams', 'date'],
    isrc: ['trackTitle', 'isrc', 'artist'],
    custom: []
  };

  const handleReportTypeChange = (value: ReportType) => {
    setReportType(value);
    
    // Reset column mapping when report type changes
    if (headers.length > 0) {
      const newMapping: ColumnMapping = {};
      headers.forEach((header) => {
        const standardMapping = standardMappings[value][header];
        if (standardMapping) {
          newMapping[header] = standardMapping;
        }
      });
      setColumnMapping(newMapping);
    }
  };

  const handleDelimiterChange = (value: string) => {
    setDelimiter(value);
    if (file) {
      parseFile(file, value);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      setFile(selectedFile);
      parseFile(selectedFile, delimiter);
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const parseFile = (file: File, delimiter: string) => {
    setIsProcessing(true);
    setProcessProgress(0);
    setIsPreviewReady(false);
    setIsImported(false);

    Papa.parse(file, {
      delimiter,
      header: true,
      preview: 10, // Parse just a few rows for preview
      skipEmptyLines: true,
      encoding: "UTF-8",
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headerRow = results.meta.fields || [];
          setHeaders(headerRow);
          setPreviewData(results.data);
          
          // Auto-map columns based on standard mappings
          const newMapping: ColumnMapping = {};
          headerRow.forEach((header) => {
            const standardMapping = standardMappings[reportType][header];
            if (standardMapping) {
              newMapping[header] = standardMapping;
            }
          });
          setColumnMapping(newMapping);
          
          setIsPreviewReady(true);
          setProcessProgress(100);
        } else {
          toast({
            title: "Import Error",
            description: "Failed to parse the file. Please check the format and try again.",
            variant: "destructive"
          });
        }
        setIsProcessing(false);
      },
      error: (error) => {
        console.error("Parsing error:", error);
        toast({
          title: "Parsing Error",
          description: error.message,
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    });
  };

  const importFile = () => {
    if (!file) return;
    
    setIsProcessing(true);
    setProcessProgress(0);
    
    Papa.parse(file, {
      delimiter,
      header: true,
      skipEmptyLines: true,
      encoding: "UTF-8",
      step: (results, parser) => {
        // Update progress for large files
        const progress = Math.round((results.meta.cursor / file.size) * 100);
        setProcessProgress(progress);
      },
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          setImportedData(results.data);
          
          // Map the data according to the column mapping
          const mappedData = results.data.map((row: any) => {
            const mappedRow: any = {};
            Object.keys(columnMapping).forEach((originalColumn) => {
              const mappedColumn = columnMapping[originalColumn];
              if (mappedColumn) {
                mappedRow[mappedColumn] = row[originalColumn];
              }
            });
            return mappedRow;
          });
          
          setIsImported(true);
          setProcessProgress(100);
          
          if (onImportComplete) {
            onImportComplete(results.data, mappedData, reportType);
          }
          
          toast({
            title: "Import Successful",
            description: `Imported ${results.data.length} records.`,
          });
        } else {
          toast({
            title: "Import Error",
            description: "Failed to parse the file. Please check the format and try again.",
            variant: "destructive"
          });
        }
        setIsProcessing(false);
      },
      error: (error) => {
        console.error("Import error:", error);
        toast({
          title: "Import Error",
          description: error.message,
          variant: "destructive"
        });
        setIsProcessing(false);
      }
    });
  };

  const resetImport = () => {
    setFile(null);
    setHeaders([]);
    setPreviewData([]);
    setIsPreviewReady(false);
    setProcessProgress(0);
    setImportedData([]);
    setIsImported(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateMapping = (): boolean => {
    const mappedFields = Object.values(columnMapping);
    const required = requiredFields[reportType];
    const missingRequired = required.filter(field => !mappedFields.includes(field));
    
    if (missingRequired.length > 0) {
      toast({
        title: "Validation Error",
        description: `Missing required fields: ${missingRequired.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleColumnMappingChange = (originalColumn: string, mappedColumn: string) => {
    setColumnMapping(prev => ({
      ...prev,
      [originalColumn]: mappedColumn
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="mr-2 h-5 w-5" />
          Report Importer
        </CardTitle>
        <CardDescription>
          Import analytics, revenue reports, ISRC data, and other statistics from CSV files.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Report Type & Delimiter Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Report Type</Label>
            <Select 
              value={reportType} 
              onValueChange={(value) => handleReportTypeChange(value as ReportType)}
            >
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue Report</SelectItem>
                <SelectItem value="analytics">Analytics Report</SelectItem>
                <SelectItem value="isrc">ISRC Data</SelectItem>
                <SelectItem value="custom">Custom Format</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delimiter">CSV Delimiter</Label>
            <Select 
              value={delimiter} 
              onValueChange={handleDelimiterChange}
            >
              <SelectTrigger id="delimiter">
                <SelectValue placeholder="Select delimiter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=";">Semicolon (;)</SelectItem>
                <SelectItem value=",">Comma (,)</SelectItem>
                <SelectItem value="\t">Tab</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* File Upload Area */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv,.txt"
          className="hidden"
        />
        
        {!file ? (
          <div 
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={openFileSelector}
          >
            <div className="flex flex-col items-center justify-center space-y-3">
              <UploadCloud className="h-12 w-12 text-primary/70" />
              <p className="font-medium">
                Drag and drop your file here or click to browse
              </p>
              <p className="text-sm text-muted-foreground">
                Supported formats: CSV files with headers
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium truncate max-w-[200px] md:max-w-[300px]">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={resetImport}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Processing...</span>
                  <span className="text-sm">{processProgress}%</span>
                </div>
                <Progress value={processProgress} />
              </div>
            )}
          </div>
        )}
        
        {/* Preview Area */}
        {isPreviewReady && previewData.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMappingDialog(true)}
              >
                <Database className="mr-2 h-4 w-4" />
                Configure Column Mapping
              </Button>
            </div>
            
            {/* Data preview table */}
            <div className="border rounded-md">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header, index) => (
                        <TableHead key={index} className="whitespace-nowrap">
                          <div className="flex items-center space-x-1">
                            <span>{header}</span>
                            {columnMapping[header] && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="ml-1">
                                      {columnMapping[header]}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Mapped to: {columnMapping[header]}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {headers.map((header, colIndex) => (
                          <TableCell key={colIndex} className="whitespace-nowrap">
                            {row[header]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {/* Report Type Specific Guidance */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>About {reportType === 'revenue' ? 'Revenue Reports' : reportType === 'analytics' ? 'Analytics Reports' : reportType === 'isrc' ? 'ISRC Data' : 'Custom Format'}</AlertTitle>
              <AlertDescription>
                {reportType === 'revenue' && (
                  <p>Revenue reports should contain platform, sales data, and financial information. Required fields include platform, artist, track title, ISRC, revenue amount, and reporting period.</p>
                )}
                {reportType === 'analytics' && (
                  <p>Analytics reports should contain streaming data, user engagement metrics, and geographical information. Required fields include platform, artist, track title, ISRC, streams, and date.</p>
                )}
                {reportType === 'isrc' && (
                  <p>ISRC data should contain track information and their assigned International Standard Recording Codes. Required fields include track title, ISRC code, and artist name.</p>
                )}
                {reportType === 'custom' && (
                  <p>Custom format allows you to map any CSV file to your desired fields. Use the column mapping tool to define the relationships between your file headers and the internal data structure.</p>
                )}
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        {/* Import Summary */}
        {isImported && (
          <div className="space-y-4">
            <Alert className="bg-primary/10 border-primary">
              <Check className="h-4 w-4 text-primary" />
              <AlertTitle>Import Successful</AlertTitle>
              <AlertDescription>
                Successfully imported {importedData.length} records.
              </AlertDescription>
            </Alert>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Import Summary</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <p><strong>File:</strong> {file?.name}</p>
                    <p><strong>Report Type:</strong> {reportType}</p>
                    <p><strong>Records Imported:</strong> {importedData.length}</p>
                    <p><strong>Fields Mapped:</strong> {Object.keys(columnMapping).length}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={resetImport} disabled={isProcessing || !file}>
          Reset
        </Button>
        <Button 
          onClick={importFile} 
          disabled={isProcessing || !isPreviewReady || isImported}
        >
          {isProcessing ? (
            <>Processing...</>
          ) : isImported ? (
            <>Imported</>
          ) : (
            <>Import</>
          )}
        </Button>
      </CardFooter>
      
      {/* Column Mapping Dialog */}
      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Column Mapping</DialogTitle>
            <DialogDescription>
              Map your CSV headers to the internal data structure. Required fields for {reportType} reports are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[400px] overflow-y-auto space-y-4">
            {headers.map((header, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 items-center">
                <div className="font-medium">{header}</div>
                <div>
                  <Select
                    value={columnMapping[header] || ""}
                    onValueChange={(value) => handleColumnMappingChange(header, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Not mapped" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not mapped</SelectItem>
                      <SelectItem value="platform">Platform</SelectItem>
                      <SelectItem value="region">Region/Country</SelectItem>
                      <SelectItem value="label">Label</SelectItem>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="releaseTitle">Release Title</SelectItem>
                      <SelectItem value="trackTitle">Track Title</SelectItem>
                      <SelectItem value="upc">UPC</SelectItem>
                      <SelectItem value="isrc">ISRC</SelectItem>
                      <SelectItem value="salesType">Sales Type</SelectItem>
                      <SelectItem value="quantity">Quantity</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="reportingMonth">Reporting Month</SelectItem>
                      <SelectItem value="salesMonth">Sales Month</SelectItem>
                      <SelectItem value="streams">Streams</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="currency">Currency</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {requiredFields[reportType].includes(columnMapping[header]) && (
                    <p className="text-xs text-primary mt-1">* Required field</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <Alert variant="destructive" className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Required Fields</AlertTitle>
            <AlertDescription>
              <p>These fields are required for {reportType} reports:</p>
              <ul className="list-disc pl-5 mt-1">
                {requiredFields[reportType].map((field, idx) => (
                  <li key={idx}>{field}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMappingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              if (validateMapping()) {
                setShowMappingDialog(false);
              }
            }}>
              Apply Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}