import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, Clock, Globe, RefreshCcw, TrendingUp, Music, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { format, subMonths } from 'date-fns';

// Types for Analytics Data
interface AnalyticsSummary {
  totalStreams: number;
  totalRevenue: number;
  topPlatforms: { platform: string; streams: number }[];
  topTracks: { 
    trackId: number;
    title: string;
    streams: number;
    revenue: number;
  }[];
  revenueByPlatform: Record<string, number>;
  streamsByDay: Record<string, number>;
  geographicDistribution: Record<string, number>;
}

// Color palette for charts
const CHART_COLORS = [
  '#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED',
  '#DB2777', '#2DD4BF', '#F97316', '#8B5CF6', '#EC4899'
];

const StatCard = ({ title, value, icon, description }: { 
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

const AnalyticsDashboard = () => {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    startDate: subMonths(new Date(), 1),
    endDate: new Date()
  });
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch analytics summary data
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/analytics/summary'],
    queryFn: () => apiRequest<{ data: AnalyticsSummary }>('/api/analytics/summary')
  });

  // Handle refresh analytics
  const handleRefreshAnalytics = async () => {
    try {
      const response = await apiRequest('/api/analytics/refresh', {
        method: 'POST'
      });
      
      toast({
        title: 'Analytics Refresh',
        description: response.message || 'Analytics data refresh initiated successfully.',
      });
      
      // Refetch the analytics data after refresh
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh analytics data.',
        variant: 'destructive'
      });
    }
  };

  // Format data for charts
  const platformChartData = data?.data.topPlatforms.map((platform, index) => ({
    name: platform.platform,
    value: platform.streams,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  })) || [];

  const streamsByDayData = Object.entries(data?.data.streamsByDay || {}).map(([date, streams]) => ({
    date,
    streams
  })).sort((a, b) => a.date.localeCompare(b.date));

  const geographicData = Object.entries(data?.data.geographicDistribution || {}).map(([country, streams]) => ({
    country,
    streams
  })).sort((a, b) => b.streams - a.streams).slice(0, 10);

  const topTracksData = data?.data.topTracks.map((track, index) => ({
    ...track,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  })) || [];

  // Loading states
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-40 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There was a problem loading your analytics data. Please try again later.</p>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCcw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data || !data.data || data.data.totalStreams === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Analytics Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No analytics data is available for your catalog yet. This could be because:</p>
          <ul className="list-disc pl-6 mt-2">
            <li>Your music was recently distributed and hasn't reported data yet</li>
            <li>You haven't distributed any music yet</li>
            <li>There's a delay in collecting data from platforms</li>
          </ul>
          <Button onClick={handleRefreshAnalytics} className="mt-4">
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Analytics
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render dashboard
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h2>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshAnalytics}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Data
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Total Streams" 
          value={data.data.totalStreams.toLocaleString()} 
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          description={`Across all platforms`}
        />
        <StatCard 
          title="Total Revenue" 
          value={`$${data.data.totalRevenue.toFixed(2)}`} 
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          description="Generated from streams"
        />
        <StatCard 
          title="Top Platform" 
          value={data.data.topPlatforms[0]?.platform || 'None'} 
          icon={<Globe className="h-4 w-4 text-muted-foreground" />}
          description={data.data.topPlatforms[0] ? `${data.data.topPlatforms[0].streams.toLocaleString()} streams` : ''}
        />
        <StatCard 
          title="Top Track" 
          value={data.data.topTracks[0]?.title || 'None'} 
          icon={<Music className="h-4 w-4 text-muted-foreground" />}
          description={data.data.topTracks[0] ? `${data.data.topTracks[0].streams.toLocaleString()} streams` : ''}
        />
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platforms">Platforms</TabsTrigger>
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Streams Over Time</CardTitle>
                <CardDescription>Daily stream count across all platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={streamsByDayData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="streams" 
                        stroke="#2563EB" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
                <CardDescription>Streams by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={platformChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="platforms">
          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>Streams by platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Streams" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Data last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="tracks">
          <Card>
            <CardHeader>
              <CardTitle>Top Tracks</CardTitle>
              <CardDescription>Your best performing tracks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topTracksData}
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="title" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="streams" name="Streams" fill="#2563EB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Data last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="geography">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Top countries by streams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={geographicData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="country" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="streams" name="Streams" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-muted-foreground">
                Data last updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;