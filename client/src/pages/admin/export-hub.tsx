import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnifiedExportInterface } from '@/components/export/UnifiedExportInterface';
import { ExportJob } from '@/components/export/UnifiedExportInterface';
import { Download, FileText, FileJson, Calendar, Settings, History } from 'lucide-react';

export default function ExportHubPage() {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  
  const handleExportComplete = (jobs: ExportJob[]) => {
    setExportJobs(prev => [...jobs, ...prev]);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Export Hub</h1>
      </div>
      
      <Tabs defaultValue="export">
        <TabsList className="mb-4">
          <TabsTrigger value="export">Export Tool</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
          <TabsTrigger value="settings">Export Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Unified Export Tool</CardTitle>
              <CardDescription>Export metadata in various formats for single or multiple releases</CardDescription>
            </CardHeader>
            <CardContent>
              <UnifiedExportInterface 
                onExportComplete={handleExportComplete} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>View and download recent export jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportJobs.length > 0 ? (
                  exportJobs.map(job => (
                    <div key={job.id} className="border rounded-md p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">{job.distributorName} Export</h3>
                        <p className="text-sm text-muted-foreground">
                          {job.timestamp?.toLocaleString()} • {job.status}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" disabled={job.status !== "completed"}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="border rounded-md p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Multiple Release Export</h3>
                        <p className="text-sm text-muted-foreground">24 Feb 2025, 10:30 AM • 15 releases • CSV</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    
                    <div className="border rounded-md p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Spotify Catalog Export</h3>
                        <p className="text-sm text-muted-foreground">22 Feb 2025, 2:15 PM • 32 releases • Excel</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    
                    <div className="border rounded-md p-4 flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">Apple Music Data Export</h3>
                        <p className="text-sm text-muted-foreground">20 Feb 2025, 11:05 AM • 8 releases • JSON</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileJson className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Export Settings</CardTitle>
              <CardDescription>Configure default export options and destinations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Default Export Format</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    <Button variant="outline" className="justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Excel (.xlsx)
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      CSV (.csv)
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileJson className="h-4 w-4 mr-2" />
                      JSON (.json)
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      XML (.xml)
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      DDEX (.xml)
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Export Delivery</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Auto-upload to platforms</h4>
                      <Button variant="outline" className="w-full justify-start">
                        Configure Platforms
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Schedule exports</h4>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Manage Export Schedule
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Save Export Templates</h3>
                  <p className="text-sm text-muted-foreground mb-4">Save your frequently used export configurations as templates</p>
                  <Button>Save Current Configuration as Template</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}