import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Track, Analytics } from "@shared/schema";
import { Music2, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

type TrackPerformanceTableProps = {
  tracks: Track[];
  analytics: Analytics[];
};

export function TrackPerformanceTable({ tracks, analytics }: TrackPerformanceTableProps) {
  // Calculate performance metrics for each track
  const trackPerformance = tracks.map(track => {
    const trackAnalytics = analytics.filter(a => a.trackId === track.id);
    const totalStreams = trackAnalytics.reduce((sum, a) => sum + a.streams, 0);
    const totalRevenue = trackAnalytics.reduce((sum, a) => sum + Number(a.revenue), 0);
    
    // Calculate trend (simplified - comparing latest to previous period)
    const sortedAnalytics = trackAnalytics.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latestStreams = sortedAnalytics[0]?.streams ?? 0;
    const previousStreams = sortedAnalytics[1]?.streams ?? 0;
    const trend = latestStreams > previousStreams ? "up" : latestStreams < previousStreams ? "down" : "neutral";

    return {
      ...track,
      totalStreams,
      totalRevenue,
      trend,
    };
  }).sort((a, b) => b.totalStreams - a.totalStreams); // Sort by total streams

  return (
    <div className="relative overflow-hidden rounded-md border border-primary/20 backdrop-blur-sm bg-background/95">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-primary/5 transition-colors">
            <TableHead>Track</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Release Date</TableHead>
            <TableHead>Total Streams</TableHead>
            <TableHead>Revenue</TableHead>
            <TableHead>Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trackPerformance.map((track) => (
            <TableRow 
              key={track.id} 
              className="group hover:bg-primary/5 transition-colors"
            >
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-primary/20 opacity-0 group-hover:opacity-100 blur-lg rounded-full transition-opacity" />
                    <Music2 className="h-4 w-4 text-muted-foreground group-hover:text-primary relative transition-colors" />
                  </div>
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    {track.title}
                  </span>
                </div>
              </TableCell>
              <TableCell>{track.artist}</TableCell>
              <TableCell>{format(new Date(track.releaseDate), "MMM d, yyyy")}</TableCell>
              <TableCell>
                <span className="font-semibold">{track.totalStreams.toLocaleString()}</span>
              </TableCell>
              <TableCell>
                <span className="font-semibold">${(track.totalRevenue / 100).toFixed(2)}</span>
              </TableCell>
              <TableCell>
                {track.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : track.trend === "down" ? (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ) : (
                  <div className="h-4 w-4 rounded-full bg-muted" />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
