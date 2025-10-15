import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Music, PlayCircle, DollarSign, TrendingUp, Users, Globe } from "lucide-react";
import { format } from "date-fns";
// Ensure BarChart is imported
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"; 
import { CustomizableDashboard } from "@/components/analytics/customizable-dashboard";
import { DateRangeSelector, DateRange } from "@/components/analytics/date-range-selector";
import { useState } from "react";

// Define analytics data interfaces
interface AnalyticsData {
  trackId: number;
  platform: string;
  streams: number;
  revenue: number;
  date: string;
  region: string;
  playlistName: string;
  playlistType: string;
}

interface DailyMetrics {
  date: string;
  totalStreams: number;
  totalRevenue: number;
}

interface PlatformMetrics {
  platform: string;
  streams: number;
  revenue: number;
}

interface RegionMetrics {
  region: string;
  streams: number;
  revenue: number;
}

// Modern color palette that works well with our theme
const COLORS = [
  'hsl(256, 85%, 60%)', // Primary (from theme)
  'hsl(180, 70%, 45%)',
  'hsl(304, 70%, 60%)',
  'hsl(40, 80%, 65%)',
  'hsl(0, 70%, 65%)',
  'hsl(120, 60%, 50%)',
];

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });

  // Fetch analytics data with the date range filter
  const { data: analyticsData, isLoading } = useQuery<AnalyticsData[]>({
    queryKey: ["/api/tracks/analytics", dateRange],
    queryFn: async () => {
      // In a real app, we would fetch from the API with date range params
      // For now, we'll use sample data from the mock response
      return [
        { trackId: 1, platform: "Spotify", streams: 45000, revenue: 1250.50, date: "2025-02-15", region: "North America", playlistName: "Hot Hits", playlistType: "Editorial" },
        { trackId: 1, platform: "Apple Music", streams: 22000, revenue: 880.75, date: "2025-02-18", region: "Europe", playlistName: "New Music Daily", playlistType: "Editorial" },
        { trackId: 2, platform: "YouTube Music", streams: 15000, revenue: 450.25, date: "2025-02-20", region: "Asia", playlistName: "Trending Tracks", playlistType: "Algorithm" },
        { trackId: 2, platform: "Spotify", streams: 18500, revenue: 555.00, date: "2025-02-22", region: "North America", playlistName: "Discover Weekly", playlistType: "Algorithm" },
        { trackId: 3, platform: "Amazon Music", streams: 8900, revenue: 267.00, date: "2025-02-25", region: "South America", playlistName: "Fresh Finds", playlistType: "Editorial" },
        { trackId: 3, platform: "Apple Music", streams: 12500, revenue: 500.00, date: "2025-02-28", region: "Europe", playlistName: "Today's Hits", playlistType: "Editorial" },
        { trackId: 1, platform: "Spotify", streams: 52000, revenue: 1450.00, date: "2025-03-05", region: "North America", playlistName: "Hot Hits", playlistType: "Editorial" },
        { trackId: 2, platform: "YouTube Music", streams: 19000, revenue: 570.00, date: "2025-03-08", region: "Asia", playlistName: "Trending Tracks", playlistType: "Algorithm" },
        { trackId: 3, platform: "Spotify", streams: 32500, revenue: 975.00, date: "2025-03-12", region: "Europe", playlistName: "Viral 50", playlistType: "Chart" },
        { trackId: 1, platform: "Amazon Music", streams: 11500, revenue: 345.00, date: "2025-03-15", region: "North America", playlistName: "New Releases", playlistType: "Editorial" },
        { trackId: 2, platform: "Apple Music", streams: 27000, revenue: 1080.00, date: "2025-03-18", region: "Europe", playlistName: "New Music Daily", playlistType: "Editorial" },
        { trackId: 3, platform: "Spotify", streams: 41000, revenue: 1230.00, date: "2025-03-22", region: "Asia", playlistName: "Top 50", playlistType: "Chart" }
      ];
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ height: "calc(100vh - 180px)" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  // No data state
  if (!analyticsData || analyticsData.length === 0) {
    return (
      <div className="c-card mb-4">
        <div className="c-card-body text-center p-5">
          <div className="empty-state">
            {/* BarChart icon from lucide-react might be intended here, or remove className if using recharts BarChart */}
            <TrendingUp size={48} className="text-muted mb-3" /> {/* Using TrendingUp as placeholder */}
            <h2 className="text-xl font-bold">No analytics data available</h2>
            <p className="text-muted mt-2">
              Start distributing your music to see performance metrics.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate summary metrics
  const totalStreams = analyticsData.reduce((sum, curr) => sum + curr.streams, 0);
  const totalRevenue = analyticsData.reduce((sum, curr) => sum + curr.revenue, 0);
  const uniquePlatforms = new Set(analyticsData.map(d => d.platform)).size;
  const uniqueRegions = new Set(analyticsData.map(d => d.region)).size;
  
  // Calculate growth rate by comparing with previous period
  // This assumes the data is sorted by date
  const currentPeriodStreams = analyticsData
    .filter(d => new Date(d.date) >= new Date('2025-03-01'))
    .reduce((sum, curr) => sum + curr.streams, 0);
  
  const previousPeriodStreams = analyticsData
    .filter(d => new Date(d.date) < new Date('2025-03-01'))
    .reduce((sum, curr) => sum + curr.streams, 0);
  
  const growthRate = previousPeriodStreams > 0 
    ? ((currentPeriodStreams - previousPeriodStreams) / previousPeriodStreams * 100).toFixed(1)
    : "N/A";

  // Process data for daily metrics
  const dailyMetrics: DailyMetrics[] = analyticsData.reduce((acc: DailyMetrics[], curr) => {
    const date = format(new Date(curr.date), 'MMM dd');
    const existing = acc.find(d => d.date === date);

    if (existing) {
      existing.totalStreams += curr.streams;
      existing.totalRevenue += curr.revenue;
    } else {
      acc.push({
        date,
        totalStreams: curr.streams,
        totalRevenue: curr.revenue
      });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Process data for platform metrics
  const platformMetrics: PlatformMetrics[] = analyticsData.reduce((acc: PlatformMetrics[], curr) => {
    const existing = acc.find(p => p.platform === curr.platform);

    if (existing) {
      existing.streams += curr.streams;
      existing.revenue += curr.revenue;
    } else {
      acc.push({
        platform: curr.platform,
        streams: curr.streams,
        revenue: curr.revenue
      });
    }
    return acc;
  }, []).sort((a, b) => b.streams - a.streams);

  // Process data for region metrics
  const regionMetrics: RegionMetrics[] = analyticsData.reduce((acc: RegionMetrics[], curr) => {
    const existing = acc.find(r => r.region === curr.region);

    if (existing) {
      existing.streams += curr.streams;
      existing.revenue += curr.revenue;
    } else {
      acc.push({
        region: curr.region,
        streams: curr.streams,
        revenue: curr.revenue
      });
    }
    return acc;
  }, []).sort((a, b) => b.streams - a.streams);

  // Define dashboard panels
  const dashboardPanels = [
    {
      id: "summary",
      title: "Summary Metrics",
      defaultSize: 20,
      minimumSize: 15,
      component: (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
              <PlayCircle className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStreams.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Period earnings</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platforms</CardTitle>
              <Music className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniquePlatforms}</div>
              <p className="text-xs text-muted-foreground">Distribution channels</p>
            </CardContent>
          </Card>
          <Card className="transition-all duration-300 hover:shadow-md hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{growthRate !== "N/A" ? `+${growthRate}%` : growthRate}</div>
              <p className="text-xs text-muted-foreground">Current vs previous</p>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "daily-streams",
      title: "Daily Performance",
      defaultSize: 35,
      minimumSize: 25,
      component: (
        <div className="rounded-lg border bg-card p-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyMetrics}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value, name) => [value.toLocaleString(), name === 'totalStreams' ? 'Streams' : 'Revenue ($)']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="totalStreams"
                  stroke="hsl(var(--primary))"
                  name="Streams"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
                <Line
                  type="monotone"
                  dataKey="totalRevenue"
                  stroke="hsl(180, 70%, 45%)"
                  name="Revenue ($)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(180, 70%, 45%)', r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(180, 70%, 45%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    },
    {
      id: "platform-distribution",
      title: "Platform Distribution",
      defaultSize: 32,
      minimumSize: 25,
      component: (
        <div className="rounded-lg border bg-card p-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformMetrics}
                  dataKey="streams"
                  nameKey="platform"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  label={({ platform, streams, percent }) => 
                    `${platform}: ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                >
                  {platformMetrics.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value, name, props) => [
                    value.toLocaleString(), 
                    props.payload.platform
                  ]}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    },
    {
      id: "regional-performance",
      title: "Regional Performance",
      defaultSize: 32,
      minimumSize: 25,
      component: (
        <div className="rounded-lg border bg-card p-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={regionMetrics}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <YAxis
                  type="category"
                  dataKey="region"
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '0.5rem',
                    color: 'hsl(var(--foreground))'
                  }}
                  formatter={(value, name) => [value.toLocaleString(), name === 'streams' ? 'Streams' : 'Revenue ($)']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar
                  dataKey="streams"
                  name="Streams"
                  fill="hsl(var(--primary))"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue ($)"
                  fill="hsl(304, 70%, 60%)"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="c-analytics-dashboard">
      <div className="c-card mb-4">
        <div className="c-card-header d-flex align-items-center justify-content-between">
          <h4 className="c-card-title mb-0">Analytics Dashboard</h4>
          <div className="c-card-actions">
            <DateRangeSelector
              onChange={setDateRange}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <CustomizableDashboard
        panels={dashboardPanels}
        onLayoutChange={(layout) => {
          // We would save layout preferences to user settings
          console.log('Layout changed:', layout);
        }}
      />

      {/* Remove invalid <style jsx> block */}
    </div>
  );
}