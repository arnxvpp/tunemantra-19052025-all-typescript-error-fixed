import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Analytics } from "@shared/schema";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { useMemo } from 'react';

type DailyData = {
  date: string;
  streams: number;
  revenue: number;
};

function prepareDailyData(analytics: Analytics[]): DailyData[] {
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  return useMemo(() => last30Days.map(date => {
    const dayAnalytics = analytics.filter(a => 
      format(new Date(a.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );

    return {
      date: format(date, 'MMM d'),
      streams: dayAnalytics.reduce((sum, a) => sum + a.streams, 0),
      // Ensure revenue is treated as a number during summation
      revenue: dayAnalytics.reduce((sum, a) => sum + parseFloat(a.revenue || '0'), 0) / 100, // Convert cents to dollars
    };
  }), [analytics]);
}

export function TrackTrends({ data }: { data: Analytics[] }) {
  const dailyData = prepareDailyData(data);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Performance Trends (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyData}>
            <XAxis 
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="streams"
              stroke="hsl(var(--primary))"
              name="Streams"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-2))"
              name="Revenue ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}