import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  AlertCircle, 
  Check, 
  Clock, 
  RefreshCw, 
  XCircle, 
  ArrowUpRight,
  Calendar,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

// Status statistics interface
interface DistributionStats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  processingJobs: number;
  pendingJobs: number;
  scheduledJobs: number;
}

// Distribution job interface
interface DistributionJob {
  id: number;
  releaseId: number;
  platformId: number;
  status: string;
  lastAttempt: string;
  lastSuccess: string | null;
  distributionDate: string | null;
  errorDetails: string | null;
  platformReleaseId: string | null;
  platformUrl: string | null;
  platformName: string;
  releaseName: string;
  artistName: string;
}

// Platform metrics interface
interface PlatformStats {
  platformId: number;
  platformName: string;
  totalDistributions: number;
  successfulDistributions: number;
  failedDistributions: number;
  pendingDistributions: number;
  successRate: number;
}

// Simulated API functions
const fetchDistributionStats = async (): Promise<DistributionStats> => {
  // This would be a real API call in production
  // For now, return simulated data
  return {
    totalJobs: 243,
    completedJobs: 187,
    failedJobs: 14,
    processingJobs: 8,
    pendingJobs: 22,
    scheduledJobs: 12
  };
};

const fetchRecentDistributions = async (): Promise<DistributionJob[]> => {
  // This would be a real API call in production
  // For now, return simulated data
  const statuses = ['completed', 'failed', 'processing', 'pending'];
  const platforms = ['Spotify', 'Apple Music', 'Amazon Music', 'Tidal', 'Deezer', 'YouTube Music'];
  const releases = [
    { name: 'Summer Vibes EP', artist: 'DJ Sunshine' },
    { name: 'Midnight Grooves', artist: 'Luna Beats' },
    { name: 'Urban Echoes', artist: 'City Soundscape' },
    { name: 'Sunset Dreams', artist: 'Ocean Wave' },
    { name: 'Mountain High', artist: 'Nature Tones' }
  ];
  
  const jobs: DistributionJob[] = [];
  
  for (let i = 0; i < 25; i++) {
    const status = statuses[Math.floor(Math.random() * (i === 0 ? 3 : statuses.length))];
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const release = releases[Math.floor(Math.random() * releases.length)];
    const date = new Date();
    date.setHours(date.getHours() - Math.floor(Math.random() * 72));
    
    jobs.push({
      id: 1000 + i,
      releaseId: 100 + Math.floor(Math.random() * 10),
      platformId: 10 + Math.floor(Math.random() * 6),
      status,
      lastAttempt: date.toISOString(),
      lastSuccess: status === 'completed' ? date.toISOString() : null,
      distributionDate: status === 'completed' ? date.toISOString() : null,
      errorDetails: status === 'failed' ? 'Platform rejected the metadata format' : null,
      platformReleaseId: status === 'completed' ? `${platform.substring(0, 3).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}` : null,
      platformUrl: status === 'completed' ? `https://${platform.toLowerCase().replace(/\s+/g, '')}.com/release/${Math.random().toString(36).substring(2, 8)}` : null,
      platformName: platform,
      releaseName: release.name,
      artistName: release.artist
    });
  }
  
  return jobs.sort((a, b) => new Date(b.lastAttempt).getTime() - new Date(a.lastAttempt).getTime());
};

const fetchPlatformStats = async (): Promise<PlatformStats[]> => {
  // This would be a real API call in production
  // For now, return simulated data
  const platforms = ['Spotify', 'Apple Music', 'Amazon Music', 'Tidal', 'Deezer', 'YouTube Music'];
  
  return platforms.map((platform, index) => {
    const total = 40 + Math.floor(Math.random() * 60);
    const success = Math.floor(total * (0.7 + Math.random() * 0.25));
    const failed = Math.floor((total - success) * (0.3 + Math.random() * 0.7));
    const pending = total - success - failed;
    
    return {
      platformId: 10 + index,
      platformName: platform,
      totalDistributions: total,
      successfulDistributions: success,
      failedDistributions: failed,
      pendingDistributions: pending,
      successRate: (success / total) * 100
    };
  }).sort((a, b) => b.totalDistributions - a.totalDistributions);
};

// Simulated retry function
const retryFailedDistribution = async (jobId: number): Promise<boolean> => {
  // This would be a real API call in production
  console.log(`Retrying failed distribution ${jobId}`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
};

// Function to get a color based on status
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'bg-green-500';
    case 'processing':
      return 'bg-blue-500';
    case 'pending':
      return 'bg-yellow-500';
    case 'failed':
      return 'bg-red-500';
    case 'scheduled':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
};

// Function to get an icon based on status
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <Check className="h-4 w-4" />;
    case 'processing':
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    case 'pending':
      return <Clock className="h-4 w-4" />;
    case 'failed':
      return <XCircle className="h-4 w-4" />;
    case 'scheduled':
      return <Calendar className="h-4 w-4" />;
    default:
      return null;
  }
};

// Distribution Status Dashboard Component
export default function DistributionStatusDashboard() {
  const [selectedJob, setSelectedJob] = useState<DistributionJob | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  const { toast } = useToast();

  // Use React Query to fetch data with auto-refresh
  const { 
    data: stats, 
    isLoading: isStatsLoading,
    error: statsError,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['distribution-stats'],
    queryFn: fetchDistributionStats,
    refetchInterval: refreshInterval * 1000
  });

  const { 
    data: recentJobs, 
    isLoading: isJobsLoading,
    error: jobsError,
    refetch: refetchJobs
  } = useQuery({
    queryKey: ['recent-distributions'],
    queryFn: fetchRecentDistributions,
    refetchInterval: refreshInterval * 1000
  });

  const { 
    data: platformStats, 
    isLoading: isPlatformStatsLoading,
    error: platformStatsError,
    refetch: refetchPlatformStats
  } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: fetchPlatformStats,
    refetchInterval: refreshInterval * 60000 // Refresh platform stats less frequently
  });

  const isLoading = isStatsLoading || isJobsLoading || isPlatformStatsLoading;
  const hasError = statsError || jobsError || platformStatsError;

  // Function to trigger manual refresh of all data
  const refreshAllData = () => {
    refetchStats();
    refetchJobs();
    refetchPlatformStats();
    
    toast({
      title: "Refreshing data",
      description: "The distribution data is being refreshed."
    });
  };

  // Function to show job details
  const showJobDetails = (job: DistributionJob) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  // Function to retry a failed distribution
  const handleRetry = async (jobId: number) => {
    try {
      const success = await retryFailedDistribution(jobId);
      
      if (success) {
        toast({
          title: "Distribution retry initiated",
          description: "The failed distribution has been queued for retry."
        });
        
        // Close the dialog and refresh data
        setIsDialogOpen(false);
        refreshAllData();
      } else {
        toast({
          title: "Retry failed",
          description: "Unable to retry the distribution at this time.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Retry error",
        description: error instanceof Error ? error.message : "An error occurred during retry.",
        variant: "destructive"
      });
    }
  };

  // Prepare data for pie chart
  const statusPieData = stats ? [
    { name: 'Completed', value: stats.completedJobs, color: '#22c55e' },
    { name: 'Failed', value: stats.failedJobs, color: '#ef4444' },
    { name: 'Processing', value: stats.processingJobs, color: '#3b82f6' },
    { name: 'Pending', value: stats.pendingJobs, color: '#eab308' },
    { name: 'Scheduled', value: stats.scheduledJobs, color: '#a855f7' }
  ] : [];

  // Prepare data for platform success rate chart
  const platformChartData = platformStats?.map(platform => ({
    name: platform.platformName,
    successRate: Math.round(platform.successRate),
    successful: platform.successfulDistributions,
    failed: platform.failedDistributions,
    pending: platform.pendingDistributions,
    total: platform.totalDistributions
  }));

  // Calculate completion percentage
  const completionPercentage = stats ? 
    Math.round((stats.completedJobs / (stats.totalJobs - stats.scheduledJobs)) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load distribution dashboard data.
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={refreshAllData}
          >
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Distribution Dashboard</h2>
        <div className="flex space-x-2">
          <div className="text-sm text-muted-foreground flex items-center mr-2">
            Auto-refresh: {refreshInterval}s
            <select 
              className="ml-2 text-sm rounded-md border"
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value={0}>Off</option>
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={300}>5m</option>
            </select>
          </div>
          <Button onClick={refreshAllData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Distribution Progress</CardTitle>
            <CardDescription>Overall completion rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-2xl font-bold">{completionPercentage}%</span>
              {/* Provide default values for subtraction */}
              <span className="text-muted-foreground">{stats?.completedJobs ?? 0} of {(stats?.totalJobs ?? 0) - (stats?.scheduledJobs ?? 0)}</span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm">Completed: {stats?.completedJobs}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm">Failed: {stats?.failedJobs}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm">Processing: {stats?.processingJobs}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm">Pending: {stats?.pendingJobs}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Distribution Status</CardTitle>
            <CardDescription>Current job status breakdown</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-center" style={{ height: 200 }}>
              <PieChart width={200} height={200}>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [`${value} jobs`, name]}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Scheduled Distributions</CardTitle>
            <CardDescription>Upcoming scheduled releases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Calendar className="h-12 w-12 mx-auto text-purple-500 mb-2" />
              <p className="text-3xl font-bold">{stats?.scheduledJobs}</p>
              <p className="text-muted-foreground">Scheduled Distributions</p>
            </div>
            <div className="mt-2 text-center">
              <Button variant="outline" size="sm">View Schedule</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent">Recent Distributions</TabsTrigger>
          <TabsTrigger value="platforms">Platform Performance</TabsTrigger>
        </TabsList>
        
        {/* Recent Distributions Tab */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Distribution Activities</CardTitle>
              <CardDescription>
                View and manage recent distribution jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Release</TableHead>
                      <TableHead>Artist</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentJobs?.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Badge className={`${getStatusColor(job.status)} flex items-center gap-1`}>
                            {getStatusIcon(job.status)}
                            <span className="capitalize">{job.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{job.releaseName}</TableCell>
                        <TableCell>{job.artistName}</TableCell>
                        <TableCell>{job.platformName}</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(job.lastAttempt), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => showJobDetails(job)}
                          >
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div>
                <span className="text-sm text-muted-foreground">
                  Showing {recentJobs?.length} of {stats?.totalJobs} total jobs
                </span>
              </div>
              <Button variant="outline">View All</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Platform Performance Tab */}
        <TabsContent value="platforms">
          <Card>
            <CardHeader>
              <CardTitle>Platform Distribution Performance</CardTitle>
              <CardDescription>
                Success rates and distribution metrics by platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Success Rates by Platform</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={platformChartData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                      <Tooltip 
                        formatter={(value, name) => [name === 'successRate' ? `${value}%` : value, name === 'successRate' ? 'Success Rate' : name]}
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                        itemStyle={{ color: '#f8fafc' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="successRate" 
                        stroke="#22c55e" 
                        activeDot={{ r: 8 }}
                        name="Success Rate"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Successful</TableHead>
                      <TableHead className="text-right">Failed</TableHead>
                      <TableHead className="text-right">Success Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {platformStats?.map((platform) => (
                      <TableRow key={platform.platformId}>
                        <TableCell className="font-medium">{platform.platformName}</TableCell>
                        <TableCell className="text-right">{platform.totalDistributions}</TableCell>
                        <TableCell className="text-right text-green-500">{platform.successfulDistributions}</TableCell>
                        <TableCell className="text-right text-red-500">{platform.failedDistributions}</TableCell>
                        <TableCell className="text-right">
                          <Badge className={
                            platform.successRate > 90 ? "bg-green-500" : 
                            platform.successRate > 70 ? "bg-yellow-500" : 
                            "bg-red-500"
                          }>
                            {platform.successRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Job Details Dialog */}
      {selectedJob && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Distribution Details</DialogTitle>
              <DialogDescription>
                Detailed information about this distribution job
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{selectedJob.releaseName}</h3>
                  <p className="text-muted-foreground">{selectedJob.artistName}</p>
                </div>
                <Badge className={`${getStatusColor(selectedJob.status)} flex items-center gap-1`}>
                  {getStatusIcon(selectedJob.status)}
                  <span className="capitalize">{selectedJob.status}</span>
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium">Platform</h4>
                  <p>{selectedJob.platformName}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Job ID</h4>
                  <p>{selectedJob.id}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Last Attempt</h4>
                  <p>{selectedJob.lastAttempt ? format(new Date(selectedJob.lastAttempt), 'PPpp') : 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Last Success</h4>
                  <p>{selectedJob.lastSuccess ? format(new Date(selectedJob.lastSuccess), 'PPpp') : 'N/A'}</p>
                </div>
              </div>
              
              {selectedJob.platformReleaseId && (
                <div>
                  <h4 className="text-sm font-medium">Platform Release ID</h4>
                  <p>{selectedJob.platformReleaseId}</p>
                </div>
              )}
              
              {selectedJob.platformUrl && (
                <div>
                  <h4 className="text-sm font-medium">Platform URL</h4>
                  <a 
                    href={selectedJob.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center"
                  >
                    {selectedJob.platformUrl}
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
              
              {selectedJob.errorDetails && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error Details</AlertTitle>
                  <AlertDescription>
                    {selectedJob.errorDetails}
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <DialogFooter>
              {selectedJob.status === 'failed' && (
                <Button 
                  onClick={() => handleRetry(selectedJob.id)}
                  className="mr-auto"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Distribution
                </Button>
              )}
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}