import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/main-layout';
import { AlertTriangle, BarChart3, PieChart, Calendar } from 'lucide-react';

import DistributionStatusDashboard from '@/components/distribution/DistributionStatusDashboard';
import { useFeatureAccess } from '@/hooks/use-feature-access';

// Fetch all of user's releases for the dropdown
const fetchUserReleases = async () => {
  // This would be a real API call in production
  // For now, return simulated data
  return [
    { id: 101, title: 'Summer Vibes EP', artistName: 'DJ Sunshine', releaseDate: '2023-06-15', status: 'completed' },
    { id: 102, title: 'Midnight Grooves', artistName: 'Luna Beats', releaseDate: '2023-07-21', status: 'processing' },
    { id: 103, title: 'Urban Echoes', artistName: 'City Soundscape', releaseDate: '2023-08-05', status: 'scheduled' },
    { id: 104, title: 'Sunset Dreams', artistName: 'Ocean Wave', releaseDate: '2023-09-11', status: 'completed' },
    { id: 105, title: 'Mountain High', artistName: 'Nature Tones', releaseDate: '2023-10-30', status: 'pending' },
  ];
};

// Distribution analytics by platform
const fetchPlatformAnalytics = async () => {
  // This would be a real API call in production
  // For now, return simulated data
  return [
    { 
      platform: 'Spotify', 
      totalDistributions: 134,
      successRate: 94.8,
      averageProcessingTime: '1.2h',
      recentDistributions: [
        { date: '2023-12-01', count: 12 },
        { date: '2023-12-02', count: 8 },
        { date: '2023-12-03', count: 15 },
        { date: '2023-12-04', count: 10 },
        { date: '2023-12-05', count: 7 },
      ]
    },
    { 
      platform: 'Apple Music', 
      totalDistributions: 121,
      successRate: 91.2,
      averageProcessingTime: '1.8h',
      recentDistributions: [
        { date: '2023-12-01', count: 10 },
        { date: '2023-12-02', count: 6 },
        { date: '2023-12-03', count: 12 },
        { date: '2023-12-04', count: 8 },
        { date: '2023-12-05', count: 5 },
      ]
    },
    { 
      platform: 'Amazon Music', 
      totalDistributions: 98,
      successRate: 88.5,
      averageProcessingTime: '2.1h',
      recentDistributions: [
        { date: '2023-12-01', count: 8 },
        { date: '2023-12-02', count: 5 },
        { date: '2023-12-03', count: 10 },
        { date: '2023-12-04', count: 7 },
        { date: '2023-12-05', count: 4 },
      ]
    },
  ];
};

export default function DistributionAnalyticsPage() {
  const { canAccess } = useFeatureAccess();
  const hasAccess = canAccess('distribution');
  
  const { data: releases, isLoading: isReleasesLoading } = useQuery({
    queryKey: ['/api/releases'],
    queryFn: fetchUserReleases,
    enabled: hasAccess
  });
  
  const { data: platformAnalytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['/api/distribution/analytics/platforms'],
    queryFn: fetchPlatformAnalytics,
    enabled: hasAccess
  });
  
  // If user doesn't have access to this feature
  if (!hasAccess) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Distribution Analytics</h1>
            <p className="text-muted-foreground">
              Track and analyze your music distribution across platforms
            </p>
          </div>
          
          {/* Change Alert variant to "default" or "destructive" */}
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Feature Not Available</AlertTitle>
            <AlertDescription>
              Distribution analytics are available on premium plans.
              Upgrade your subscription to access detailed distribution insights.
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Upgrade to Access</CardTitle>
              <CardDescription>
                Unlock powerful distribution analytics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <BarChart3 className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Comprehensive Reports</h3>
                    <p className="text-sm text-muted-foreground">Monitor distribution statuses across all platforms</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <PieChart className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Success Rate Analysis</h3>
                    <p className="text-sm text-muted-foreground">Identify issues and optimize distribution workflows</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium">Scheduling Insights</h3>
                    <p className="text-sm text-muted-foreground">Plan and optimize release scheduling</p>
                  </div>
                </div>
                
                <Button className="w-full mt-4">Upgrade Plan</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Distribution Analytics</h1>
          <p className="text-muted-foreground">
            Track and analyze your music distribution across platforms
          </p>
        </div>
        
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dashboard">Distribution Dashboard</TabsTrigger>
            <TabsTrigger value="releases">Release Distribution</TabsTrigger>
            <TabsTrigger value="platforms">Platform Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <DistributionStatusDashboard />
          </TabsContent>
          
          <TabsContent value="releases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Release Distribution Status</CardTitle>
                <CardDescription>
                  Track distribution status for specific releases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Release</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      defaultValue=""
                    >
                      <option value="" disabled>Choose a release</option>
                      {releases?.map(release => (
                        <option key={release.id} value={release.id}>
                          {release.title} - {release.artistName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>No Release Selected</AlertTitle>
                    <AlertDescription>
                      Please select a release to view its distribution status
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="platforms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution Analytics</CardTitle>
                <CardDescription>
                  Performance metrics and insights by distribution platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {platformAnalytics?.map(platform => (
                    <div key={platform.platform} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">{platform.platform}</h3>
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="text-xs text-muted-foreground">Success Rate</span>
                            <div className="text-lg font-semibold">{platform.successRate}%</div>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Total Distributions</span>
                            <div className="text-lg font-semibold">{platform.totalDistributions}</div>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Avg. Processing</span>
                            <div className="text-lg font-semibold">{platform.averageProcessingTime}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-12 mt-2 relative">
                        <div className="flex justify-between absolute inset-0">
                          {platform.recentDistributions.map((data, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <div 
                                className="bg-blue-500 rounded-t-sm"
                                style={{ 
                                  height: `${(data.count / 15) * 100}%`, 
                                  width: '20px' 
                                }}
                              ></div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {data.date.split('-')[2]}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}