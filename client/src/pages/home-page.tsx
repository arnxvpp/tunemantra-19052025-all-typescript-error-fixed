import { useQuery } from "@tanstack/react-query";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Mail, Disc, Loader2, Plus, TrendingUp, Music, Users, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { Track, Analytics } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, DoughnutChart } from "@/components/ui/chart";
import { useAuth } from "@/hooks/use-auth";
// Import the specific SubscriptionInfo type used by the banner
import { SubscriptionStatusBanner, type SubscriptionInfo } from "@/components/subscription/SubscriptionStatusBanner";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { ProtectedFeature } from "@/components/subscription/ProtectedFeature";
import ManagedArtistsSummary from "@/components/artists/ManagedArtistsSummary";
import { Suspense, lazy } from 'react';
import { LoginDebugHelper } from '@/components/debug/LoginDebugHelper';


type AccountData = {
  balance: number;
  lastStatement: number;
  lastTransaction: number;
};

export default function HomePage() {
  const { user, refreshUser } = useAuth();
  const { canAccess } = useFeatureAccess();
  
  // Check if user has subscription info to display banner
  const showSubscriptionBanner = user?.subscriptionInfo && 
    user.subscriptionInfo.plan !== 'free';
  
  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="max-w-7xl mx-auto p-4 space-y-6">
      
        {/* Debug Login Helper - Only show if not authenticated */}
        {!user && (
          <Suspense fallback={<div>Loading login helper...</div>}>
            <LoginDebugHelper />
          </Suspense>
        )}
        {/* Subscription Status Banner - Conditionally render and map plan type */}
        {user && user.subscriptionInfo && (() => {
          // Map 'label' to 'label_admin' if necessary
          const bannerSubInfo = {
            ...user.subscriptionInfo,
            plan: user.subscriptionInfo.plan === 'label' ? 'label_admin' : user.subscriptionInfo.plan
          } as SubscriptionInfo; // Assert using the imported type

          return (
            <SubscriptionStatusBanner
              subscriptionInfo={bannerSubInfo}
              onRefresh={refreshUser}
            />
          );
        })()}
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <ProtectedFeature feature="release_creation" showLockedCard={false}>
            <Button asChild>
              <Link href="/releases/new">
                <Plus className="h-4 w-4 mr-2" />
                New Release
              </Link>
            </Button>
          </ProtectedFeature>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Streams</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.1M</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$12,450</div>
              <p className="text-xs text-muted-foreground">+12.5% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Releases</CardTitle>
              <Music className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">+2 new this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audience Growth</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+18.2%</div>
              <p className="text-xs text-muted-foreground">Compared to last quarter</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <LineChart data={[]} /> {/* Placeholder data */}
            </CardContent>
          </Card>

          <div className="md:col-span-2 lg:col-span-3 grid gap-4">
            {/* ManagedArtistsSummary is now a self-contained component with its own card wrapper */}
            <ManagedArtistsSummary />
            
            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <DoughnutChart data={[]} /> {/* Placeholder data */}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}