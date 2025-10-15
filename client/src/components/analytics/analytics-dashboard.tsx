import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Line } from "react-chartjs-2";
import { subMonths, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

// Define the expected shape of a single analytics item
interface AnalyticsItem {
  date: string | Date; // Assuming date can be string or Date object
  streams: number;
  revenue: string | number; // Assuming revenue might be string or number
  playlistAdds?: number; // Optional playlist adds
}

// Define the shape of the monthly accumulator
interface MonthlyAccumulator {
  [month: string]: {
    streams: number;
    revenue: number;
    playlistAdds: number;
  };
}

export function AnalyticsDashboard() {
  // Provide the type to useQuery
  const { data: analyticsData, isLoading } = useQuery<AnalyticsItem[]>({
    queryKey: ["/api/tracks/analytics"],
    // queryFn: fetchAnalyticsData, // Assuming a fetch function exists or is handled by a provider
  });

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  // Process data with proper types
  const monthlyData = analyticsData?.reduce((acc: MonthlyAccumulator, item: AnalyticsItem) => {
    const month = format(new Date(item.date), 'MMM');
    if (!acc[month]) {
      acc[month] = { streams: 0, revenue: 0, playlistAdds: 0 };
    }
    acc[month].streams += item.streams;
    // Ensure revenue is treated as a number
    acc[month].revenue += typeof item.revenue === 'string' ? parseFloat(item.revenue) : item.revenue;
    acc[month].playlistAdds += item.playlistAdds || 0;
    return acc;
  }, {} as MonthlyAccumulator); // Initialize with typed empty object

  const months = Object.keys(monthlyData || {});
  const chartData = {
    labels: months,
    datasets: [
      {
        label: 'Streams',
        data: months.map(month => monthlyData?.[month]?.streams ?? 0), // Added safe access
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  const revenueData = {
    labels: months,
    datasets: [
      {
        label: 'Revenue',
        data: months.map(month => monthlyData?.[month]?.revenue ?? 0), // Added safe access
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.4,
        fill: false
      }
    ]
  };

  // Calculate totals with proper types
  const safeMonthlyDataValues = Object.values(monthlyData || {});
  const totalStreams: number = safeMonthlyDataValues.reduce((acc, val) => acc + val.streams, 0);
  const totalRevenue: number = safeMonthlyDataValues.reduce((acc, val) => acc + val.revenue, 0);
  const totalPlaylistAdds: number = safeMonthlyDataValues.reduce((acc, val) => acc + val.playlistAdds, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Streams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStreams.toLocaleString()}</div>
            <p className="text-muted-foreground">
              Last {months.length} months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-muted-foreground">
              Last {months.length} months
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Playlist Adds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlaylistAdds.toLocaleString()}</div>
            <p className="text-muted-foreground">Total playlist inclusions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Streams</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar 
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
              height={300}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <Line 
              data={revenueData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
              height={300}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[100px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[120px]" />
              <Skeleton className="h-4 w-[100px] mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-[140px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}