import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState } from "react";

const data = [
  { month: 'Jan', streams: 2400, plays: 1800, revenue: 320 },
  { month: 'Feb', streams: 3600, plays: 2400, revenue: 480 },
  { month: 'Mar', streams: 3000, plays: 2100, revenue: 400 },
  { month: 'Apr', streams: 4000, plays: 2800, revenue: 550 },
  { month: 'May', streams: 5200, plays: 3600, revenue: 700 },
  { month: 'Jun', streams: 4800, plays: 3200, revenue: 650 },
  { month: 'Jul', streams: 6000, plays: 4200, revenue: 800 },
  { month: 'Aug', streams: 6700, plays: 4700, revenue: 900 },
  { month: 'Sep', streams: 7500, plays: 5200, revenue: 1000 },
  { month: 'Oct', streams: 8200, plays: 5800, revenue: 1100 },
  { month: 'Nov', streams: 8800, plays: 6200, revenue: 1200 },
  { month: 'Dec', streams: 9500, plays: 6800, revenue: 1300 }
];

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold">+24.5%</div>
              <div className="flex items-center text-sm text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>4.3%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Compared to last quarter</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold">78/100</div>
              <div className="flex items-center text-sm text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>6.2%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on 12 metrics</p>
          </CardContent>
        </Card>
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold">Positive</div>
              <div className="flex items-center text-sm text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>Steady</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on the last 6 months</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Annual Performance Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="streams" stroke="#8884d8" activeDot={{ r: 8 }} name="Streams" />
              <Line yAxisId="left" type="monotone" dataKey="plays" stroke="#82ca9d" name="Plays" />
              <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#ff7300" name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Platform Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="streams" fill="#8884d8" name="Streams" />
              <Bar dataKey="plays" fill="#82ca9d" name="Plays" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}