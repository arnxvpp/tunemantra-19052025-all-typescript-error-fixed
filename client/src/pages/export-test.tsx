import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetadataExportComponent } from "@/components/export/MetadataExportComponent";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * This page serves as a test environment for the consolidated MetadataExportComponent.
 * It allows testing different modes and configurations of the component.
 */
export default function ExportTestPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Export Component Test Page</h1>
      <p className="text-muted-foreground mb-4">
        This page is used to test our consolidated metadata export functionality
        across different configurations.
      </p>
      
      <Tabs defaultValue="batch" className="w-full mb-6">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="batch">Batch Mode</TabsTrigger>
          <TabsTrigger value="single">Single Mode</TabsTrigger>
        </TabsList>

        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Batch Export Mode</CardTitle>
              <CardDescription>
                Export multiple releases at once with various options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MetadataExportComponent 
                mode="batch"
                defaultExportFormat="excel"
                showDateFilter={true}
                showDistributorFilter={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Single Release Export Mode</CardTitle>
              <CardDescription>
                Export a single release with focused options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MetadataExportComponent 
                mode="single"
                defaultExportFormat="json"
                showDateFilter={false}
                showDistributorFilter={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Date Range Filter Test</CardTitle>
          <CardDescription>
            Testing the date range picker functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MetadataExportComponent 
            mode="batch"
            defaultExportFormat="csv"
            showDateFilter={true}
            showDistributorFilter={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>No Filters Test</CardTitle>
          <CardDescription>
            Testing the component with minimal configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MetadataExportComponent 
            mode="batch"
            defaultExportFormat="ddex"
            showDateFilter={false}
            showDistributorFilter={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}