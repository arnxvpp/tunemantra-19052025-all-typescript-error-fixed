import { CatalogLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { NewBulkDistributionModal } from "@/components/distribution/new-bulk-distribution-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type BulkDistributionJob = {
  id: number;
  name: string;
  description?: string;
  status: "pending" | "processing" | "completed" | "failed";
  totalReleases: number;
  processedReleases: number;
  failedReleases: number;
  createdAt: string;
  settings: {
    priorityDistribution: boolean;
    scheduleImmediate: boolean;
    retryOnFailure: boolean;
    maxRetries: number;
    notifyOnCompletion: boolean;
  };
  platformDetails: {
    platformId: number;
    platformName: string;
    status: string;
    lastAttempt?: string;
    error?: string;
  }[];
};

export default function BulkDistributionPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const { toast } = useToast();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["/api/distribution/bulk"],
    queryFn: async () => {
      const response = await fetch("/api/distribution/bulk");
      if (!response.ok) {
        throw new Error("Failed to fetch bulk distribution jobs");
      }
      return response.json() as Promise<BulkDistributionJob[]>;
    }
  });

  const getJobProgress = (job: BulkDistributionJob) => {
    return Math.round((job.processedReleases / job.totalReleases) * 100) || 0;
  };

  const getStatusIcon = (status: BulkDistributionJob["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "processing":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const filteredJobs = jobs?.filter(job => 
    selectedStatus === "all" || job.status === selectedStatus
  );

  const handleRetryJob = async (jobId: number) => {
    try {
      const response = await fetch(`/api/distribution/bulk/${jobId}/retry`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to retry job");

      toast({
        title: "Success",
        description: "Job retry initiated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to retry job",
        variant: "destructive",
      });
    }
  };

  const handleCancelJob = async (jobId: number) => {
    try {
      const response = await fetch(`/api/distribution/bulk/${jobId}/cancel`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to cancel job");

      toast({
        title: "Success",
        description: "Job cancelled successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel job",
        variant: "destructive",
      });
    }
  };

  return (
    <CatalogLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Bulk Distribution Management</h1>
            <p className="text-sm text-muted-foreground">
              Manage and monitor your bulk distribution jobs
            </p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)} 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Distribution Job
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" onClick={() => setSelectedStatus("all")}>
              All Jobs
            </TabsTrigger>
            <TabsTrigger value="pending" onClick={() => setSelectedStatus("pending")}>
              Pending
            </TabsTrigger>
            <TabsTrigger value="processing" onClick={() => setSelectedStatus("processing")}>
              Processing
            </TabsTrigger>
            <TabsTrigger value="completed" onClick={() => setSelectedStatus("completed")}>
              Completed
            </TabsTrigger>
            <TabsTrigger value="failed" onClick={() => setSelectedStatus("failed")}>
              Failed
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedStatus}>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredJobs?.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No Distribution Jobs</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedStatus === "all" 
                      ? "Create a new distribution job to get started"
                      : `No jobs with status "${selectedStatus}"`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredJobs?.map((job) => (
                  <Card key={job.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(job.status)}
                          <div>
                            <CardTitle className="text-lg">{job.name}</CardTitle>
                            {job.description && (
                              <p className="text-sm text-muted-foreground">
                                {job.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Created {new Date(job.createdAt).toLocaleDateString()}
                          </span>
                          {job.status === "pending" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelJob(job.id)}
                            >
                              Cancel
                            </Button>
                          )}
                          {job.status === "failed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRetryJob(job.id)}
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{getJobProgress(job)}%</span>
                        </div>
                        <Progress value={getJobProgress(job)} className="h-2" />
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <div>Total: {job.totalReleases}</div>
                          <div>Processed: {job.processedReleases}</div>
                          <div>Failed: {job.failedReleases}</div>
                        </div>

                        {/* Platform Details */}
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Platform Status</h4>
                          <div className="grid gap-2">
                            {job.platformDetails.map((platform) => (
                              <div
                                key={platform.platformId}
                                className="flex items-center justify-between text-sm p-2 bg-muted rounded-md"
                              >
                                <span>{platform.platformName}</span>
                                <div className="flex items-center gap-2">
                                  <span className={
                                    platform.status === "completed" ? "text-green-500" :
                                    platform.status === "failed" ? "text-red-500" :
                                    "text-yellow-500"
                                  }>
                                    {platform.status}
                                  </span>
                                  {platform.error && (
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <NewBulkDistributionModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
      />
    </CatalogLayout>
  );
}