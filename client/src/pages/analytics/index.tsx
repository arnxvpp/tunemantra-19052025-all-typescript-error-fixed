
import { MainLayout } from "@/components/layout/main-layout";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import { PlaylistMonitoring } from "@/components/analytics/playlist-monitoring";
import { IncomeDashboard } from "@/components/analytics/income-dashboard";
import { CustomReports } from "@/components/analytics/custom-reports"; // Import CustomReports
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AnalyticsPage() {
  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your music performance and earnings
          </p>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="playlists">Playlists</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="reports">Custom Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="playlists">
            <PlaylistMonitoring />
          </TabsContent>

          <TabsContent value="income">
            <IncomeDashboard />
          </TabsContent>

          <TabsContent value="reports">
            <CustomReports />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
