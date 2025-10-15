
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// Revert to original icon names with suffix
import { InfoCircledIcon, CheckCircledIcon, CrossCircledIcon } from "@radix-ui/react-icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AssetBundleImporterProps {
  onImportComplete?: (result: any) => void;
}

export default function AssetBundleImporter({ onImportComplete }: AssetBundleImporterProps) {
  const [activeTab, setActiveTab] = useState('upload');
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [artworkFiles, setArtworkFiles] = useState<File[]>([]);
  const [metadataFile, setMetadataFile] = useState<File | null>(null);
  const [analyticsFile, setAnalyticsFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Handle file selection for audio
  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAudioFiles(Array.from(e.target.files));
    }
  };
  
  // Handle file selection for artwork
  const handleArtworkSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setArtworkFiles(Array.from(e.target.files));
    }
  };
  
  // Handle metadata file selection
  const handleMetadataSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMetadataFile(e.target.files[0]);
    }
  };
  
  // Handle analytics file selection
  const handleAnalyticsSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAnalyticsFile(e.target.files[0]);
    }
  };
  
  // Validate files before upload
  const validateFiles = () => {
    setActiveTab('validate');
    const results = [];
    
    // Check if metadata file exists
    if (!metadataFile) {
      setError("Metadata file is required");
      return;
    }
    
    // Validate audio files
    for (const file of audioFiles) {
      // Simple extension validation
      const isValidAudio = file.name.endsWith('.wav') || file.name.endsWith('.mp3');
      results.push({
        name: file.name,
        type: 'audio',
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        valid: isValidAudio,
        issues: isValidAudio ? [] : ['Invalid audio format']
      });
    }
    
    // Validate artwork files
    for (const file of artworkFiles) {
      const isValidArtwork = file.name.endsWith('.jpg') || file.name.endsWith('.png');
      results.push({
        name: file.name,
        type: 'artwork',
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        valid: isValidArtwork,
        issues: isValidArtwork ? [] : ['Invalid image format']
      });
    }
    
    // Validate metadata file
    const isValidMetadata = metadataFile.name.endsWith('.xlsx') || metadataFile.name.endsWith('.csv');
    results.push({
      name: metadataFile.name,
      type: 'metadata',
      size: (metadataFile.size / (1024 * 1024)).toFixed(2) + ' MB',
      valid: isValidMetadata,
      issues: isValidMetadata ? [] : ['Invalid metadata format']
    });
    
    // Validate analytics file if provided
    if (analyticsFile) {
      const isValidAnalytics = analyticsFile.name.endsWith('.csv') || analyticsFile.name.endsWith('.xlsx');
      results.push({
        name: analyticsFile.name,
        type: 'analytics',
        size: (analyticsFile.size / (1024 * 1024)).toFixed(2) + ' MB',
        valid: isValidAnalytics,
        issues: isValidAnalytics ? [] : ['Invalid analytics format']
      });
    }
    
    setValidationResults(results);
  };
  
  // Handle the upload process
  const handleUpload = async () => {
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Create FormData for upload
      const formData = new FormData();
      
      // Add metadata file
      formData.append('metadata', metadataFile as File);
      
      // Add audio files
      audioFiles.forEach((file, index) => {
        formData.append(`audio_${index}`, file);
      });
      
      // Add artwork files
      artworkFiles.forEach((file, index) => {
        formData.append(`artwork_${index}`, file);
      });
      
      // Add analytics file if available
      if (analyticsFile) {
        formData.append('analytics', analyticsFile);
      }
      
      // Simulate progress (in a real implementation, you'd use XHR or fetch with progress events)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 300);
      
      // In a real implementation, you'd make an API call here
      // const response = await fetch('/api/admin/import/asset-bundles', {
      //   method: 'POST',
      //   body: formData,
      // });
      
      // if (!response.ok) throw new Error('Upload failed');
      // const result = await response.json();
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Simulate successful response
      const result = {
        status: 'success',
        message: 'Asset bundles imported successfully',
        imported: audioFiles.length,
        metadata: {
          parsed: true,
          tracks: audioFiles.length
        },
        analytics: analyticsFile ? {
          parsed: true,
          records: 150
        } : null
      };
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Call the onImportComplete callback with the result
      if (onImportComplete) {
        onImportComplete(result);
      }
      
      // Move to the results tab
      setActiveTab('results');
      
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Asset Bundle Import</CardTitle>
        <CardDescription>
          Import audio, artwork, metadata and analytics together as unified asset bundles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload Files</TabsTrigger>
            <TabsTrigger value="validate">Validate</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="metadata">Metadata File (Required)</Label>
                <Input
                  id="metadata"
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleMetadataSelect}
                />
                <p className="text-sm text-muted-foreground">
                  Upload an Excel or CSV file with track metadata (must include ISRC codes)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audio">Audio Files</Label>
                <Input
                  id="audio"
                  type="file"
                  accept=".wav,.mp3"
                  multiple
                  onChange={handleAudioSelect}
                />
                <p className="text-sm text-muted-foreground">
                  Select WAV or MP3 files - filenames should match identifiers in metadata
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="artwork">Artwork Files</Label>
                <Input
                  id="artwork"
                  type="file"
                  accept=".jpg,.png"
                  multiple
                  onChange={handleArtworkSelect}
                />
                <p className="text-sm text-muted-foreground">
                  Select JPG or PNG files - filenames should match identifiers in metadata
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="analytics">Analytics Data (Optional)</Label>
                <Input
                  id="analytics"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleAnalyticsSelect}
                />
                <p className="text-sm text-muted-foreground">
                  Upload analytics/revenue data with ISRC codes to match with tracks
                </p>
              </div>
              
              <Button onClick={validateFiles} disabled={!metadataFile}>
                Continue to Validation
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="validate">
            <div className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>{result.name}</TableCell>
                      <TableCell>{result.type}</TableCell>
                      <TableCell>{result.size}</TableCell>
                      <TableCell>
                        {result.valid ? (
                          <CheckCircledIcon className="h-5 w-5 text-green-500" /> // Revert to original name
                        ) : (
                          <div className="flex items-center">
                            <CrossCircledIcon className="h-5 w-5 text-red-500 mr-1" /> // Revert to original name
                            <span className="text-xs text-red-500">{result.issues.join(', ')}</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('upload')}>
                  Back to Upload
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={validationResults.some(r => !r.valid) || uploading}
                >
                  {uploading ? 'Uploading...' : 'Import Asset Bundles'}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            <div className="space-y-6">
              {uploading ? (
                <div className="space-y-4">
                  <p>Uploading and processing files...</p>
                  <Progress value={progress} />
                </div>
              ) : progress === 100 ? (
                <Alert>
                  <CheckCircledIcon className="h-5 w-5" /> {/* Revert to original name */}
                  <AlertTitle>Import Completed Successfully</AlertTitle>
                  <AlertDescription>
                    Asset bundles have been created and linked to the appropriate releases.
                  </AlertDescription>
                </Alert>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertTitle>Import Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              
              <div>
                <Button variant="outline" onClick={() => {
                  setActiveTab('upload');
                  setAudioFiles([]);
                  setArtworkFiles([]);
                  setMetadataFile(null);
                  setAnalyticsFile(null);
                  setProgress(0);
                  setValidationResults([]);
                  setError(null);
                }}>
                  Import More Files
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
