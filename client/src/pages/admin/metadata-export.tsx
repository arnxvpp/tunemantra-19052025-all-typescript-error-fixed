import React from "react";
import { MetadataExportComponent } from "@/components/export/MetadataExportComponent";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";

export default function MetadataExportPage() {
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
              <BreadcrumbLink href="/admin/metadata-export">Metadata Export</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Metadata Export</h1>
        </div>
        
        <p className="text-muted-foreground">
          Export release metadata for distribution partners in various formats.
        </p>
        
        <MetadataExportComponent 
          mode="batch"
          defaultExportFormat="excel"
          showDateFilter={true}
          showDistributorFilter={true}
          hideHeader={true}
        />
      </div>
    </AdminDashboardLayout>
  );
}