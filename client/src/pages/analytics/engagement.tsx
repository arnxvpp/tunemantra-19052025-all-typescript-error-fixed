import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitySquare, TrendingUp, ArrowUpRight, Users, Clock } from "lucide-react";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Sample data for engagement charts
const weeklyData = [
  { day: 'Monday', listeners: 4000, completionRate: 80 },
  { day: 'Tuesday', listeners: 3000, completionRate: 75 },
  { day: 'Wednesday', listeners: 5000, completionRate: 85 },
  { day: 'Thursday', listeners: 2780, completionRate: 78 },
  { day: 'Friday', listeners: 1890, completionRate: 70 },
  { day: 'Saturday', listeners: 2390, completionRate: 68 },
  { day: 'Sunday', listeners: 3490, completionRate: 72 },
];

const demographicData = [
  { name: '18-24', value: 35 },
  { name: '25-34', value: 30 },
  { name: '35-44', value: 15 },
  { name: '45-54', value: 10 },
  { name: '55+', value: 10 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function EngagementPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listeners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold">235,478</div>
              <div className="flex items-center text-sm text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>+8.2%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Monthly unique listeners</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <ActivitySquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold">76.5%</div>
              <div className="flex items-center text-sm text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>+3.8%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average track completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Listen Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2:45</div>
            <p className="text-xs text-muted-foreground mt-1">Per session</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82/100</div>
            <p className="text-xs text-muted-foreground mt-1">Platform average: 75/100</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Listener Activity</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="listeners" stroke="#8884d8" fill="#8884d8" name="Listeners" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Listener Demographics</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={demographicData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {demographicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Track Completion Rates</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="completionRate" fill="#82ca9d" name="Completion Rate (%)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">Playlist Adds</span>
                <span className="font-medium">8,450</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">Shares</span>
                <span className="font-medium">3,782</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">Repeat Listens</span>
                <span className="font-medium">18,953</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '78%' }}></div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">Artist Page Visits</span>
                <span className="font-medium">5,234</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">External Link Clicks</span>
                <span className="font-medium">1,287</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '32%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}