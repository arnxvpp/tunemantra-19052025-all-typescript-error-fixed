
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export function IncomeDashboard() {
  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [4500, 5200, 4800, 6000, 5700, 7000],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  const platformData = {
    labels: ['Spotify', 'Apple Music', 'Amazon Music', 'YouTube Music', 'Others'],
    datasets: [
      {
        label: 'Platform Revenue',
        data: [3000, 2500, 1500, 1200, 800],
        backgroundColor: [
          'rgba(29, 185, 84, 0.5)',  // Spotify green
          'rgba(252, 83, 83, 0.5)',  // Apple red
          'rgba(66, 133, 244, 0.5)', // Amazon blue
          'rgba(255, 0, 0, 0.5)',    // YouTube red
          'rgba(156, 156, 156, 0.5)' // Gray for others
        ]
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$32,700</div>
            <p className="text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Per Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.004</div>
            <p className="text-muted-foreground">Across all platforms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Spotify</div>
            <p className="text-muted-foreground">45% of total revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={monthlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <Bar data={platformData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
