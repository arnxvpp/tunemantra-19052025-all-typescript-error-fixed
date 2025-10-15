import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, ArrowUpRight } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Sample data for revenue charts
const monthlyData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
  { name: 'Jul', value: 3490 },
  { name: 'Aug', value: 4200 },
  { name: 'Sep', value: 5100 },
  { name: 'Oct', value: 4500 },
  { name: 'Nov', value: 3800 },
  { name: 'Dec', value: 6000 },
];

const platformData = [
  { name: 'Spotify', value: 4000 },
  { name: 'Apple Music', value: 3000 },
  { name: 'YouTube', value: 2000 },
  { name: 'Amazon Music', value: 1500 },
  { name: 'Tidal', value: 800 },
  { name: 'Others', value: 500 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function RevenuePage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold">$32,845</div>
              <div className="flex items-center text-sm text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>+12.5%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-2xl font-bold">$6,000</div>
              <div className="flex items-center text-sm text-green-500">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                <span>+5.2%</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Compared to last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Per Track</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$425</div>
            <p className="text-xs text-muted-foreground mt-1">Monthly average per track</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+23.4%</div>
            <p className="text-xs text-muted-foreground mt-1">Year over year</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                width={500}
                height={300}
                data={monthlyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Platform</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Revenue Streams Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">Streaming</div>
              <div className="font-medium">$21,450</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-primary h-2.5 rounded-full" style={{ width: '65%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="font-medium">Downloads</div>
              <div className="font-medium">$5,280</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '16%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="font-medium">Sync Licensing</div>
              <div className="font-medium">$3,500</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '11%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="font-medium">Physical Sales</div>
              <div className="font-medium">$1,865</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '6%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="font-medium">Performance Rights</div>
              <div className="font-medium">$750</div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '2%' }}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}