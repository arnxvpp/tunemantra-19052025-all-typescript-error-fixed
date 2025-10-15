
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CustomizableDashboard } from "@/components/analytics/customizable-dashboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, Calendar, RefreshCw } from "lucide-react";

// Mock data for the charts
const monthlySignups = [
  { month: 'Jan', artists: 45, labels: 12 },
  { month: 'Feb', artists: 52, labels: 15 },
  { month: 'Mar', artists: 48, labels: 11 },
  { month: 'Apr', artists: 70, labels: 18 },
  { month: 'May', artists: 92, labels: 24 },
  { month: 'Jun', artists: 110, labels: 30 },
];

const platformRevenue = [
  { month: 'Jan', revenue: 15400 },
  { month: 'Feb', revenue: 17800 },
  { month: 'Mar', revenue: 19200 },
  { month: 'Apr', revenue: 21500 },
  { month: 'May', revenue: 24100 },
  { month: 'Jun', revenue: 27800 },
];

const distributionByPlatform = [
  { platform: 'Spotify', value: 45 },
  { platform: 'Apple Music', value: 30 },
  { platform: 'Amazon Music', value: 15 },
  { platform: 'YouTube Music', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

// Define dashboard panels for customizable dashboard
const dashboardPanels = [
  {
    id: "platform_overview",
    title: "Platform Summary",
    defaultSize: 30,
    minimumSize: 15,
    component: (
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl">2,847</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-500 font-medium">+12.5%</span> from last month
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Releases</CardDescription>
            <CardTitle className="text-2xl">12,433</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-500 font-medium">+8.2%</span> from last month
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Platform Revenue</CardDescription>
            <CardTitle className="text-2xl">$78,542</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-500 font-medium">+15.3%</span> from last month
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Distribution Rate</CardDescription>
            <CardTitle className="text-2xl">98.7%</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              <span className="text-green-500 font-medium">+0.5%</span> from last month
            </div>
          </CardContent>
        </Card>
      </div>
    )
  },
  {
    id: "signup_trends",
    title: "Signup Trends",
    defaultSize: 50,
    minimumSize: 30,
    component: (
      <Card>
        <CardHeader>
          <CardTitle>Monthly User Signups</CardTitle>
          <CardDescription>
            New user registrations by month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlySignups}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="artists" name="Artists" fill="#8884d8" />
                <Bar dataKey="labels" name="Labels" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    )
  },
  {
    id: "platform_revenue",
    title: "Platform Revenue",
    defaultSize: 50,
    minimumSize: 30,
    component: (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Platform Revenue</CardTitle>
          <CardDescription>
            Platform revenue over the past 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={platformRevenue}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    )
  },
  {
    id: "distribution_breakdown",
    title: "Distribution Breakdown",
    defaultSize: 40,
    minimumSize: 30,
    component: (
      <Card>
        <CardHeader>
          <CardTitle>Distribution by Platform</CardTitle>
          <CardDescription>
            Content distribution percentage by platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionByPlatform}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionByPlatform.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    )
  }
];

export default function AdminStatisticsPage() {
  const [period, setPeriod] = useState("monthly");
  
  return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Platform Statistics</h2>
            <p className="text-muted-foreground">
              Comprehensive platform metrics and performance indicators
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Stats</TabsTrigger>
            <TabsTrigger value="content">Content Stats</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <CustomizableDashboard panels={dashboardPanels} />
          </TabsContent>
          
          <TabsContent value="users" className="space-y-4">
            {/* Content for User Stats tab */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {/* User growth chart */}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Demographics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    {/* Demographics chart */}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-60">
                    {/* Engagement chart */}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="space-y-4">
            {/* Content for Content Stats tab */}
          </TabsContent>
          
          <TabsContent value="financial" className="space-y-4">
            {/* Content for Financial tab */}
          </TabsContent>
        </Tabs>
      </div>
  );
}
