
import React from "react";
import AdminProtectedRoute from "@/lib/admin-protected-route";
import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";
import { MetadataImportComponent } from "@/components/import/MetadataImportComponent";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

// Wrap the component to match the required props pattern for AdminProtectedRoute
const MetadataImportContent = () => {
  return (
    <AdminDashboardLayout>
        <div className="space-y-4 p-4 md:p-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/metadata-import">Metadata Import</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Metadata Import</h1>
          </div>
          
          <p className="text-muted-foreground">
            Import music metadata from spreadsheets and other file formats.
          </p>
          
          <Tabs defaultValue="releases" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="releases">Releases</TabsTrigger>
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
              <TabsTrigger value="artists">Artists</TabsTrigger>
              <TabsTrigger value="isrc">ISRC Codes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="releases">
              <Card>
                <CardContent className="pt-6">
                  <MetadataImportComponent 
                    supportedFormats={['excel', 'csv', 'json']}
                    showTemplateDownload={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tracks">
              <Card>
                <CardContent className="pt-6">
                  <MetadataImportComponent 
                    supportedFormats={['excel', 'csv', 'json']}
                    showTemplateDownload={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="artists">
              <Card>
                <CardContent className="pt-6">
                  <MetadataImportComponent 
                    supportedFormats={['excel', 'csv', 'json']}
                    showTemplateDownload={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="isrc">
              <Card>
                <CardContent className="pt-6">
                  <MetadataImportComponent 
                    supportedFormats={['excel', 'csv']}
                    showTemplateDownload={true}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminDashboardLayout>
  );
};

// Export the default component with AdminProtectedRoute
export default function MetadataImportPage() {
  return <AdminProtectedRoute 
    path="/admin/metadata-import" 
    component={MetadataImportContent} 
  />;
}
