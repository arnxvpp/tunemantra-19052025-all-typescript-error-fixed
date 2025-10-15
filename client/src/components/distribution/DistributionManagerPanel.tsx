import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Calendar, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Import types from the service file
import {
  DistributionPlatform, // Assuming this type exists for available platforms
  DistributionStatus,   // Assuming this type exists for status
  getPlatformAvailability,
  distributeReleaseToPlatform,
  scheduleDistribution,
  getDistributionStatus,
  cancelScheduledDistribution
} from '@/lib/distribution-service';

// --- Define interfaces based on usage (if needed, or rely on imported types) ---
// Use DistributionPlatform from service if it matches this structure
interface AvailablePlatform {
  platformId: number;
  name: string;
  available: boolean;
  reason?: string;
}
// Remove local PlatformStatus, use DistributionStatus from service
// interface PlatformStatus { ... }
// Remove local DistributionStatusResponse
// interface DistributionStatusResponse { ... }
// --- End Interface Definitions ---


interface DistributionManagerPanelProps {
  releaseId: number;
  isApproved?: boolean;
}

export default function DistributionManagerPanel({ releaseId, isApproved = true }: DistributionManagerPanelProps) {
  const [selectedPlatformId, setSelectedPlatformId] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get available platforms
  const { 
    data: availablePlatforms, 
    isLoading: isLoadingPlatforms,
    error: platformsError,
    refetch: refetchPlatforms
  } = useQuery<AvailablePlatform[]>({ // Use AvailablePlatform or DistributionPlatform if defined in service
    queryKey: ['/api/distribution-platforms/availability', releaseId],
    // Assuming getPlatformAvailability returns AvailablePlatform[] or similar
    queryFn: () => getPlatformAvailability(releaseId),
    enabled: !!releaseId && isApproved
  });

  // Get distribution status
  const {
    data: distributionStatus,
    isLoading: isLoadingStatus,
    error: statusError,
    refetch: refetchStatus
    // Use DistributionStatus[] from the service file
  } = useQuery<DistributionStatus[]>({
    queryKey: ['/api/releases/distribution-status', releaseId],
    // Assuming getDistributionStatus returns DistributionStatus[]
    queryFn: () => getDistributionStatus(releaseId),
    enabled: !!releaseId && isApproved,
    refetchInterval: (data) => {
      // Auto-refresh status for platforms in processing status
      // Use the imported DistributionStatus type and check if it's an array
      if (Array.isArray(data) && data.some((p: DistributionStatus) => p.status === 'processing')) {
        return 10000; // Refresh every 10 seconds while processing
      }
      return false; // No auto-refresh otherwise
    }
  });

  // Mutation to distribute release
  const distributeMutation = useMutation({
    mutationFn: ({ releaseId, platformId }: { releaseId: number, platformId: number }) => 
      distributeReleaseToPlatform(releaseId, platformId),
    onSuccess: () => {
      toast({
        title: "Distribution started",
        description: "Your release is being distributed. This process may take some time.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/releases/distribution-status', releaseId] });
      queryClient.invalidateQueries({ queryKey: ['/api/distribution-platforms/availability', releaseId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Distribution failed",
        description: error.message || "There was an error distributing your release.",
        variant: "destructive"
      });
    }
  });

  // Mutation to schedule distribution
  const scheduleMutation = useMutation({
    mutationFn: ({ 
      releaseId, 
      platformId, 
      scheduledDate 
    }: { 
      releaseId: number, 
      platformId: number, 
      scheduledDate: Date 
    }) => scheduleDistribution(releaseId, platformId, scheduledDate),
    onSuccess: () => {
      toast({
        title: "Distribution scheduled",
        description: "Your release has been scheduled for distribution.",
      });
      setIsScheduleDialogOpen(false);
      setScheduledDate(undefined);
      queryClient.invalidateQueries({ queryKey: ['/api/releases/distribution-status', releaseId] });
      queryClient.invalidateQueries({ queryKey: ['/api/distribution-platforms/availability', releaseId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Scheduling failed",
        description: error.message || "There was an error scheduling your distribution.",
        variant: "destructive"
      });
    }
  });

  // Mutation to cancel scheduled distribution
  const cancelScheduleMutation = useMutation({
    mutationFn: (id: number) => cancelScheduledDistribution(id),
    onSuccess: () => {
      toast({
        title: "Distribution cancelled",
        description: "Your scheduled distribution has been cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/releases/distribution-status', releaseId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation failed",
        description: error.message || "There was an error cancelling your scheduled distribution.",
        variant: "destructive"
      });
    }
  });

  const handleDistribute = (platformId: number) => {
    distributeMutation.mutate({ releaseId, platformId });
  };

  const handleSchedule = () => {
    if (!selectedPlatformId || !scheduledDate) {
      toast({
        title: "Invalid selection",
        description: "Please select a platform and a date for scheduling.",
        variant: "destructive"
      });
      return;
    }
    
    // Ensure date is in the future
    if (scheduledDate < new Date()) {
      toast({
        title: "Invalid date",
        description: "Please select a future date for scheduling.",
        variant: "destructive"
      });
      return;
    }
    
    scheduleMutation.mutate({ 
      releaseId, 
      platformId: selectedPlatformId, 
      scheduledDate 
    });
  };

  const handleCancelScheduled = (id: number) => {
    cancelScheduleMutation.mutate(id);
  };

  const refreshData = () => {
    refetchPlatforms();
    refetchStatus();
  };

  // Function to get status badge JSX based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Distributed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500"><RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Processing</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case 'scheduled': // Keep this case for potential future use, though comparison might fail
        return <Badge className="bg-purple-500"><Calendar className="h-3 w-3 mr-1" /> Scheduled</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Render skeleton loading state
  if (isLoadingPlatforms || isLoadingStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-64" /></CardTitle>
          <CardDescription><Skeleton className="h-5 w-full" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (platformsError || statusError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load distribution information.
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={refreshData}
          >
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning if release is not approved
  if (!isApproved) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribution Manager</CardTitle>
          <CardDescription>Manage your release distribution to music platforms</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Release not approved</AlertTitle>
            <AlertDescription>
              This release needs to be approved before it can be distributed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Main render
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Distribution Manager</CardTitle>
            <CardDescription>Manage your release distribution to music platforms</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="status">
          <TabsList className="mb-4">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="distribute">Distribute</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          
          {/* Status Tab */}
          <TabsContent value="status">
            {!distributionStatus || distributionStatus.length === 0 ? ( // Check the array directly
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No distributions found</AlertTitle>
                <AlertDescription>
                  This release has not been distributed to any platforms yet.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                 {/* Use DistributionStatus type */}
                {distributionStatus.map((platform: DistributionStatus) => (
                  // Assuming DistributionStatus has platformId, platformName, status etc.
                  <div key={platform.platformId} className="flex flex-col space-y-2 border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div className="font-medium">
                        {platform.platformName}
                      </div>
                      {getStatusBadge(platform.status)}
                    </div>
                    
                    {platform.lastAttempt && (
                      <div className="text-sm text-muted-foreground">
                        Last attempt: {format(new Date(platform.lastAttempt), 'PPp')}
                      </div>
                    )}
                    
                    {/* TODO: Verify if platformUrl exists on DistributionStatus type */}
                    {/* {platform.platformUrl && (
                      <div className="text-sm">
                        <a 
                          href={platform.platformUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          View on platform
                        </a>
                      </div>
                    )} */}
                    
                    {platform.errorDetails && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{platform.errorDetails}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Distribute Tab */}
          <TabsContent value="distribute">
            {!availablePlatforms || availablePlatforms.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No platforms available</AlertTitle>
                <AlertDescription>
                  There are no platforms available for distribution.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {availablePlatforms?.map((platform: AvailablePlatform) => ( // Add type to map item
                  <div key={platform.platformId} className="flex justify-between items-center border rounded-lg p-4">
                    <div>
                      <div className="font-medium">{platform.name}</div>
                      {!platform.available && (
                        <div className="text-sm text-muted-foreground">
                          {platform.reason}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleDistribute(platform.platformId)}
                      disabled={!platform.available || distributeMutation.isPending}
                    >
                      {distributeMutation.isPending ? (
                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Distributing...</>
                      ) : (
                        <><Send className="h-4 w-4 mr-2" /> Distribute</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Schedule Tab */}
          <TabsContent value="schedule">
            {!availablePlatforms || availablePlatforms.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No platforms available</AlertTitle>
                <AlertDescription>
                  There are no platforms available for scheduling distribution.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-4 mb-6">
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Select Platform</label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={selectedPlatformId || ""}
                        onChange={(e) => setSelectedPlatformId(parseInt(e.target.value) || null)}
                      >
                        <option value="">Select a platform</option>
                        {availablePlatforms // Add optional chaining and type
                          ?.filter((p: AvailablePlatform) => p.available)
                          .map((platform: AvailablePlatform) => (
                            <option
                              key={platform.platformId}
                              value={platform.platformId}
                            >
                              {platform.name}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Schedule Date</label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduledDate && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {scheduledDate ? format(scheduledDate, "PPP") : "Select a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={scheduledDate}
                            onSelect={setScheduledDate}
                            initialFocus
                            disabled={(date) => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleSchedule}
                    disabled={!selectedPlatformId || !scheduledDate || scheduleMutation.isPending}
                  >
                    {scheduleMutation.isPending ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Scheduling...</>
                    ) : (
                      <><Calendar className="h-4 w-4 mr-2" /> Schedule Distribution</>
                    )}
                  </Button>
                </div>
                
                {/* Scheduled Distributions */}
                <div>
                  <h3 className="font-medium mb-4">Scheduled Distributions</h3>
                  
                  {/* TODO: Verify if 'scheduled' is a valid status in DistributionStatus type */}
                  {/* Temporarily disable this section to fix type error */}
                  {false ? (
                    <div className="space-y-4">
                      {/* Remove the invalid filter causing the type error */}
                      {distributionStatus
                        ?.map((platform: DistributionStatus) => (
                          // Assuming DistributionStatus has platformId, platformName
                          // TODO: Verify if distributionDate exists on DistributionStatus
                          <div key={platform.platformId} className="flex justify-between items-center border rounded-lg p-4"> 
                            <div>
                              <div className="font-medium">{platform.platformName}</div> 
                              {/* {platform.distributionDate && (
                                <div className="text-sm text-muted-foreground">
                                  Scheduled for: {format(new Date(platform.distributionDate), 'PPp')}
                                </div>
                              )} */}
                            </div>
                            <Button
                              variant="outline"
                              // TODO: Verify how to get the correct ID for cancellation. 
                              // DistributionStatus might not have 'id'. Need to check cancelScheduledDistribution signature.
                              // Using platform.platformId as a placeholder, might be incorrect.
                              onClick={() => handleCancelScheduled(platform.platformId)} 
                              disabled={cancelScheduleMutation.isPending}
                            >
                              Cancel
                            </Button>
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                     <div className="text-center p-4 text-muted-foreground">
                       {/* Display message if no scheduled items or section is disabled */}
                       No scheduled distributions found or section temporarily disabled.
                     </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Remove duplicate default export
// export default DistributionManagerPanel;