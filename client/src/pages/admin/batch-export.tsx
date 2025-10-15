import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetadataExportComponent } from "@/components/export/MetadataExportComponent";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";

export default function BatchExportPage() {
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
              <BreadcrumbLink href="/admin/batch-export">Batch Export</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Batch Metadata Export</h1>
        </div>
        
        <p className="text-muted-foreground">
          Export multiple releases metadata at once for distribution platforms.
        </p>
        
        <Card>
          <CardContent className="pt-6">
            <MetadataExportComponent 
              mode="batch"
              defaultExportFormat="excel"
              showDateFilter={true}
              showDistributorFilter={true}
              hideHeader={true}
            />
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
}