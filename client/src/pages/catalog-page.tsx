import { useQuery } from "@tanstack/react-query";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { Release } from "@shared/schema";
import { Loader2, Search, LayoutGrid, LayoutList, Plus, InfoIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { format } from "date-fns";
import { Link } from "wouter";
import { ProtectedFeature } from "@/components/subscription/ProtectedFeature";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ViewMode = "list" | "grid";

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { canAccess, getUsageLimit, isWithinUsageLimit } = useFeatureAccess();

  const { data: releases, isLoading } = useQuery<Release[]>({
    queryKey: ["/api/releases"],
  });

  const filteredReleases = releases?.filter(release => 
    release.title.toLowerCase().includes(search.toLowerCase()) ||
    release.artistName.toLowerCase().includes(search.toLowerCase()) ||
    release.labelName.toLowerCase().includes(search.toLowerCase()) ||
    release.upc.includes(search)
  );

  // Check if user is at release limit
  const maxReleases = getUsageLimit('maxReleases');
  const currentReleaseCount = releases?.length || 0;
  const canCreateNewRelease = isWithinUsageLimit('maxReleases', currentReleaseCount);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <DashboardNav />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="max-w-7xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Releases</h1>
          <p className="text-muted-foreground">
            Manage your releases and distribution
          </p>
        </div>

        {/* Subscription Limits Alert */}
        {!canCreateNewRelease && (
          <Alert className="mb-6">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Release Limit Reached</AlertTitle>
            <AlertDescription>
              You've used {currentReleaseCount} of your {maxReleases === 'unlimited' ? 'unlimited' : maxReleases} releases.
              {maxReleases !== 'unlimited' && (
                <span> To create more releases, please upgrade your subscription plan.</span>
              )}
              {maxReleases !== 'unlimited' && (
                <Button variant="outline" size="sm" className="ml-2" asChild>
                  <Link href="/subscription-plans">Upgrade Plan</Link>
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search releases..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
                className="rounded-r-none"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className="rounded-l-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <ProtectedFeature feature="release_creation" showLockedCard={false}>
                    <Button 
                      asChild
                      disabled={!canCreateNewRelease}
                    >
                      <Link href="/releases/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Create new
                      </Link>
                    </Button>
                  </ProtectedFeature>
                </span>
              </TooltipTrigger>
              {!canCreateNewRelease && (
                <TooltipContent>
                  <p>You've reached your release limit</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>

        {filteredReleases && filteredReleases.length > 0 ? (
          viewMode === "list" ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Release ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Artist Name</TableHead>
                    <TableHead>Label Name</TableHead>
                    <TableHead>UPC</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReleases.map((release) => (
                    <TableRow key={release.id}>
                      <TableCell className="font-mono">#{release.id}</TableCell>
                      <TableCell className="font-medium">{release.title}</TableCell>
                      <TableCell>{release.artistName}</TableCell>
                      <TableCell>{release.labelName}</TableCell>
                      <TableCell className="font-mono">{release.upc}</TableCell>
                      <TableCell>
                        <Badge
                          variant={release.status === "draft" ? "secondary" : "default"}
                        >
                          {release.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredReleases.map((release) => (
                <div
                  key={release.id}
                  className="border rounded-lg p-4 space-y-4 hover:border-primary/50 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-muted-foreground">
                        #{release.id}
                      </span>
                      <Badge
                        variant={release.status === "draft" ? "secondary" : "default"}
                      >
                        {release.status}
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{release.title}</h3>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>{release.artistName}</p>
                    <p>{release.labelName}</p>
                    <p className="font-mono">{release.upc}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {format(new Date(release.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center p-8 text-muted-foreground border rounded-lg">
            No releases found
          </div>
        )}
      </main>
    </div>
  );
}