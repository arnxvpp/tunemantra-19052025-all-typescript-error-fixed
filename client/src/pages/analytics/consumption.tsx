import { AnalyticsLayout } from "./layout";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TrackPerformanceTable } from "@/components/dashboard/track-performance-table";
import { useQuery } from "@tanstack/react-query";
import { Track, Analytics } from "@shared/schema";

export default function ConsumptionPage() {
  const { data: tracks } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  const { data: analytics } = useQuery<Analytics[]>({
    queryKey: ["/api/tracks/analytics"],
  });

  const statsData = {
    totalStreams: analytics?.reduce((sum, a) => sum + a.streams, 0) ?? 0,
    totalRevenue: analytics?.reduce((sum, a) => sum + Number(a.revenue), 0) ?? 0,
    totalTracks: tracks?.length ?? 0,
  };

  return (
    <AnalyticsLayout>
      <div className="space-y-8">
        <h2 className="text-2xl font-bold mb-6 text-white">Consumption Analytics</h2>

        {/* Stats Overview */}
        <StatsCards data={statsData} />

        {/* Performance Table */}
        {tracks && analytics && (
          <TrackPerformanceTable 
            tracks={tracks} 
            analytics={analytics} 
          />
        )}
      </div>
    </AnalyticsLayout>
  );
}