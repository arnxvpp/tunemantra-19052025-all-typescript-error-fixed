// @ts-nocheck
import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
// Define a type for the form field props
type FormFieldProps = {
  field: any;
};
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import * as ExcelJS from 'exceljs';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

// Define the schema for ISRC single assignment
const isrcAssignmentSchema = z.object({
  trackId: z.string().min(1, "Track is required"),
  isrc: z.string().regex(/^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/, {
    message: "ISRC must be in format XX-XXX-YY-NNNNN (e.g., US-Z15-23-00001)",
  }),
});

// Define the schema for ISRC bulk upload
const isrcBulkUploadSchema = z.object({
  fileType: z.enum(["excel", "csv", "txt", "manual"]),
  mappingConfig: z.object({
    trackIdentifierColumn: z.string().optional(),
    isrcColumn: z.string().optional(),
  }).optional(),
  manualEntries: z.string().optional(),
});

// Define the track type for our component props
interface Track {
  id: number;
  trackNumber: string;
  trackTitle: string;
  primaryArtist: string;
  isrc?: string;
  isrcStatus?: "pending" | "assigned" | "error";
}

// Define the component props
interface IsrcImportToolProps {
  tracks: Track[];
  onAssignIsrc: (trackId: number, isrc: string) => Promise<void>;
  onBulkAssignIsrc: (assignments: { trackId: number; isrc: string }[]) => Promise<void>;
}

export function IsrcImportTool({ tracks, onAssignIsrc, onBulkAssignIsrc }: IsrcImportToolProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("import");
  const { toast } = useToast();
  interface ImportedRowData {
    [key: string]: string | number;
  }
  
  interface MappingPreviewData {
    trackIdentifier: string;
    isrc: string;
  }
  
  const [importedData, setImportedData] = useState<ImportedRowData[] | null>(null);
  const [mappingPreview, setMappingPreview] = useState<MappingPreviewData[] | null>(null);
  const [processingBulk, setProcessingBulk] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<string[]>([]);

  // Form for single ISRC assignment
  const singleAssignmentForm = useForm<z.infer<typeof isrcAssignmentSchema>>({
    resolver: zodResolver(isrcAssignmentSchema),
    defaultValues: {
      trackId: "",
      isrc: "",
    },
  });

  // Form for bulk ISRC upload
  const bulkUploadForm = useForm<z.infer<typeof isrcBulkUploadSchema>>({
    resolver: zodResolver(isrcBulkUploadSchema),
    defaultValues: {
      fileType: "excel",
      mappingConfig: {
        trackIdentifierColumn: "",
        isrcColumn: "",
      },
      manualEntries: "",
    },
  });

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = bulkUploadForm.getValues("fileType");
    
    if (fileType === "excel") {
      // Process Excel file using ExcelJS
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(buffer);
          
          // Get the first worksheet
          const worksheet = workbook.getWorksheet(1);
          if (!worksheet) {
            throw new Error("No worksheet found in the Excel file");
          }
          
          // Convert worksheet to JSON
          const jsonData: ImportedRowData[] = [];
          const headers: string[] = [];
          
          // Extract headers from the first row
          worksheet.getRow(1).eachCell((cell, colNumber) => {
            if (cell.value) {
              headers[colNumber - 1] = cell.value.toString();
            }
          });
          
          // Set available columns for mapping
          setAvailableColumns(headers.filter(Boolean));
          
          // Extract data from remaining rows
          worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Skip header row
            
            const rowData: ImportedRowData = {};
            row.eachCell((cell, colNumber) => {
              const header = headers[colNumber - 1];
              if (header) {
                rowData[header] = cell.value?.toString() || '';
              }
            });
            
            // Only add row if it has data
            if (Object.keys(rowData).length > 0) {
              jsonData.push(rowData);
            }
          });
          
          setImportedData(jsonData);
          toast({
            title: "File imported successfully",
            description: `${jsonData.length} entries found in the file.`,
          });
        } catch (error) {
          console.error("Excel import error:", error);
          toast({
            title: "Error importing file",
            description: "Please make sure the file is a valid Excel file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === "csv") {
      // Process CSV file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvData = e.target?.result as string;
          // Basic CSV parsing, in a real app you'd use a more robust CSV parser
          const lines = csvData.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          setAvailableColumns(headers);
          
          const jsonData = [];
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',').map(v => v.trim());
            const entry: Record<string, any> = {};
            headers.forEach((header, index) => {
              entry[header] = values[index] || '';
            });
            jsonData.push(entry);
          }
          
          setImportedData(jsonData);
          toast({
            title: "File imported successfully",
            description: `${jsonData.length} entries found in the file.`,
          });
        } catch (error) {
          toast({
            title: "Error importing file",
            description: "Please make sure the file is a valid CSV file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    } else if (fileType === "txt") {
      // Process TXT file (assuming tab-delimited)
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const txtData = e.target?.result as string;
          const lines = txtData.split('\n');
          const headers = lines[0].split('\t').map(h => h.trim());
          setAvailableColumns(headers);
          
          const jsonData = [];
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split('\t').map(v => v.trim());
            const entry: Record<string, any> = {};
            headers.forEach((header, index) => {
              entry[header] = values[index] || '';
            });
            jsonData.push(entry);
          }
          
          setImportedData(jsonData);
          toast({
            title: "File imported successfully",
            description: `${jsonData.length} entries found in the file.`,
          });
        } catch (error) {
          toast({
            title: "Error importing file",
            description: "Please make sure the file is a valid TXT file.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle manual entries preview
  const handleManualEntriesChange = (value: string) => {
    bulkUploadForm.setValue("manualEntries", value);
    
    if (!value.trim()) {
      setImportedData(null);
      return;
    }
    
    try {
      // Parse manual entries (format: Track ID/Name,ISRC - one per line)
      const lines = value.split('\n');
      const jsonData: ImportedRowData[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const [trackIdentifier, isrc] = line.split(',').map(part => part.trim());
        if (trackIdentifier && isrc) {
          jsonData.push({
            trackIdentifier,
            isrc,
          });
        }
      }
      
      setImportedData(jsonData);
      setAvailableColumns(['trackIdentifier', 'isrc']);
    } catch (error) {
      toast({
        title: "Error parsing manual entries",
        description: "Please make sure the format is correct: Track ID/Name,ISRC (one per line)",
        variant: "destructive",
      });
    }
  };

  // Preview mapping results
  const previewMapping = () => {
    if (!importedData) return;
    
    const mappingConfig = bulkUploadForm.getValues("mappingConfig");
    const fileType = bulkUploadForm.getValues("fileType");
    
    // If manual entry, the format is simplified
    if (fileType === "manual") {
      const preview: MappingPreviewData[] = importedData.map(row => ({
        trackIdentifier: String(row.trackIdentifier || ''),
        isrc: String(row.isrc || '')
      }));
      setMappingPreview(preview);
      return;
    }
    
    if (!mappingConfig?.trackIdentifierColumn || !mappingConfig?.isrcColumn) {
      toast({
        title: "Mapping configuration incomplete",
        description: "Please select both track identifier and ISRC columns.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create a preview of the mapping
      const preview = importedData.map(row => {
        const trackId = String(row[mappingConfig.trackIdentifierColumn!]);
        const isrcCode = String(row[mappingConfig.isrcColumn!]);
        
        return {
          trackIdentifier: trackId,
          isrc: isrcCode
        } as MappingPreviewData;
      });
      
      setMappingPreview(preview);
      
      toast({
        title: "Mapping preview generated",
        description: `${preview.length} entries matched.`,
      });
    } catch (error) {
      toast({
        title: "Error generating mapping preview",
        description: "Please check your column selections.",
        variant: "destructive",
      });
    }
  };

  // Handle column mapping change
  const handleColumnMappingChange = (field: "trackIdentifierColumn" | "isrcColumn", value: string) => {
    bulkUploadForm.setValue(`mappingConfig.${field}`, value);
  };

  // Process bulk assignment
  const processBulkAssignment = async () => {
    if (!mappingPreview) {
      previewMapping();
      return;
    }
    
    setProcessingBulk(true);
    
    try {
      // Find matching tracks and create assignments
      const assignments: { trackId: number; isrc: string }[] = [];
      
      mappingPreview.forEach(item => {
        const matchedTrack = tracks.find(track => {
          // Try to match by various identifiers (ID, title, or track number)
          return (
            track.id.toString() === item.trackIdentifier ||
            track.trackTitle === item.trackIdentifier ||
            track.trackNumber === item.trackIdentifier
          );
        });
        
        if (matchedTrack && item.isrc && isValidIsrc(item.isrc)) {
          assignments.push({
            trackId: matchedTrack.id,
            isrc: item.isrc
          });
        }
      });
      
      if (assignments.length === 0) {
        toast({
          title: "No valid assignments found",
          description: "Could not match any tracks with valid ISRCs.",
          variant: "destructive",
        });
        setProcessingBulk(false);
        return;
      }
      
      // Call the bulk assign function
      await onBulkAssignIsrc(assignments);
      
      toast({
        title: "ISRCs assigned successfully",
        description: `${assignments.length} tracks updated with ISRC codes.`,
      });
      
      // Reset state and close dialog
      setImportedData(null);
      setMappingPreview(null);
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error assigning ISRCs",
        description: "An error occurred while updating tracks.",
        variant: "destructive",
      });
    } finally {
      setProcessingBulk(false);
    }
  };

  // Handle single ISRC assignment
  const handleSingleAssignment = async (data: z.infer<typeof isrcAssignmentSchema>) => {
    try {
      const trackId = parseInt(data.trackId);
      await onAssignIsrc(trackId, data.isrc);
      
      toast({
        title: "ISRC assigned successfully",
        description: "The track has been updated with the new ISRC code.",
      });
      
      singleAssignmentForm.reset();
    } catch (error) {
      toast({
        title: "Error assigning ISRC",
        description: "An error occurred while updating the track.",
        variant: "destructive",
      });
    }
  };

  // Helper function to validate ISRC format
  const isValidIsrc = (isrc: string): boolean => {
    // Format: XX-XXX-YY-NNNNN (where XX is country code, XXX is registrant, YY is year, NNNNN is designation)
    // Strict validation with hyphens required - this is the format distributors provide
    const isrcRegex = /^[A-Z]{2}-[A-Z0-9]{3}-\d{2}-\d{5}$/;
    
    // Alternative validation without hyphens (some systems use format without hyphens)
    // const isrcRegexNoHyphens = /^[A-Z]{2}[A-Z0-9]{3}\d{2}\d{5}$/;
    
    return isrcRegex.test(isrc);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Import/Assign ISRCs</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>ISRC Management</DialogTitle>
          <DialogDescription>
            Assign ISRC codes to tracks manually or import them from official metadata sheets. ISRC codes are exclusively managed by administrators.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="individual" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Individual Assignment</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
          </TabsList>
          
          {/* Individual Assignment Tab */}
          <TabsContent value="individual">
            <Form {...singleAssignmentForm}>
              <form onSubmit={singleAssignmentForm.handleSubmit(handleSingleAssignment)} className="space-y-4">
                <FormField
                  control={singleAssignmentForm.control}
                  name="trackId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Track</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a track" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tracks.map((track) => (
                            <SelectItem key={track.id} value={track.id.toString()}>
                              {track.trackNumber}. {track.trackTitle} - {track.primaryArtist}
                              {track.isrc && <span className="ml-2 text-muted-foreground">({track.isrc})</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the track to assign an ISRC code to.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={singleAssignmentForm.control}
                  name="isrc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ISRC Code</FormLabel>
                      <FormControl>
                        <Input placeholder="XX-XXX-YY-NNNNN" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the ISRC code from the official metadata sheet provided by administrators.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit">Assign ISRC</Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          {/* Bulk Import Tab */}
          <TabsContent value="bulk">
            <Form {...bulkUploadForm}>
              <form className="space-y-4">
                <FormField
                  control={bulkUploadForm.control}
                  name="fileType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Import Method</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        setImportedData(null);
                        setMappingPreview(null);
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select import method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excel">Excel File (.xlsx)</SelectItem>
                          <SelectItem value="csv">CSV File (.csv)</SelectItem>
                          <SelectItem value="txt">Text File (.txt)</SelectItem>
                          <SelectItem value="manual">Manual Entry</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a method to import administrator-provided ISRC codes from official metadata sheets.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {bulkUploadForm.watch("fileType") !== "manual" ? (
                  <div className="space-y-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                      <Label htmlFor="fileUpload">Upload File</Label>
                      <Input
                        id="fileUpload"
                        type="file"
                        accept={bulkUploadForm.watch("fileType") === "excel" 
                          ? ".xlsx,.xls" 
                          : bulkUploadForm.watch("fileType") === "csv" 
                            ? ".csv" 
                            : ".txt"}
                        onChange={handleFileUpload}
                      />
                    </div>
                    
                    {importedData && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormItem>
                            <FormLabel>Track Identifier Column</FormLabel>
                            <Select 
                              onValueChange={(value) => handleColumnMappingChange("trackIdentifierColumn", value)}
                              value={bulkUploadForm.watch("mappingConfig.trackIdentifierColumn")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableColumns.map((column) => (
                                  <SelectItem key={column} value={column}>
                                    {column}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Column containing track ID, number, or title
                            </FormDescription>
                          </FormItem>
                          
                          <FormItem>
                            <FormLabel>ISRC Column</FormLabel>
                            <Select 
                              onValueChange={(value) => handleColumnMappingChange("isrcColumn", value)}
                              value={bulkUploadForm.watch("mappingConfig.isrcColumn")}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select column" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableColumns.map((column) => (
                                  <SelectItem key={column} value={column}>
                                    {column}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Column containing administrator-assigned ISRC codes
                            </FormDescription>
                          </FormItem>
                        </div>
                        
                        <Button type="button" onClick={previewMapping}>
                          Preview Mapping
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <FormField
                    control={bulkUploadForm.control}
                    name="manualEntries"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manual ISRC Entries</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Format: Track ID/Name,ISRC (one per line)
Example:
1,US-Z15-23-00001
My Track Title,IN-AB3-25-00015

Note: Only enter official ISRC codes assigned by administrators."
                            className="min-h-[200px]"
                            {...field}
                            onChange={(e) => handleManualEntriesChange(e.target.value)}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter track identifier and administrator-provided ISRC code pairs, one per line. Only use official ISRC assignments.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {mappingPreview && mappingPreview.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Mapping Preview ({mappingPreview.length} items)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-[300px] overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Track Identifier</TableHead>
                              <TableHead>ISRC</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mappingPreview.map((item, index) => {
                              const matchedTrack = tracks.find(track => 
                                track.id.toString() === item.trackIdentifier ||
                                track.trackTitle === item.trackIdentifier ||
                                track.trackNumber === item.trackIdentifier
                              );
                              
                              const isValid = isValidIsrc(item.isrc);
                              
                              return (
                                <TableRow key={index}>
                                  <TableCell>
                                    {item.trackIdentifier}
                                    {matchedTrack && (
                                      <Badge variant="outline" className="ml-2">
                                        Matched: {matchedTrack.trackTitle}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>{item.isrc}</TableCell>
                                  <TableCell>
                                    {!matchedTrack ? (
                                      <Badge variant="destructive">No Match</Badge>
                                    ) : !isValid ? (
                                      <Badge variant="destructive">Invalid ISRC</Badge>
                                    ) : (
                                      <Badge variant="success">Valid</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <DialogFooter>
                  <Button
                    type="button"
                    onClick={processBulkAssignment}
                    disabled={processingBulk || !mappingPreview}
                  >
                    {processingBulk ? "Processing..." : "Apply ISRC Assignments"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        {/* Information for users */}
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>About ISRC Codes</AlertTitle>
          <AlertDescription>
            International Standard Recording Codes (ISRCs) are unique identifiers for recordings. They must follow the format XX-XXX-YY-NNNNN, where XX is the country code, XXX is the registrant code, YY is the year, and NNNNN is the designation code. ISRCs are assigned by administrators and typically imported from official metadata sheets provided by distributors.
          </AlertDescription>
        </Alert>
      </DialogContent>
    </Dialog>
  );
}

// Custom Label component for file upload
function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    >
      {children}
    </label>
  );
}