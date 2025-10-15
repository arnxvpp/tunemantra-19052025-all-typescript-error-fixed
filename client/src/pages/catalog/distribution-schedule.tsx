import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2, AlertCircle, Check, X, RefreshCcw, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type {
  Release,
  DistributionPlatform,
  ScheduledDistribution,
  InsertScheduledDistribution,
} from "@shared/schema";
import { insertScheduledDistributionSchema } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

export default function DistributionSchedulePage() {
  const { toast } = useToast();

  // Fetch releases, platforms, and scheduled distributions
  const { data: releases, isLoading: loadingReleases } = useQuery<Release[]>({
    queryKey: ['/api/releases'],
  });

  const { data: platforms, isLoading: loadingPlatforms } = useQuery<DistributionPlatform[]>({
    queryKey: ['/api/distribution-platforms'],
  });

  const { data: schedules, isLoading: loadingSchedules } = useQuery<ScheduledDistribution[]>({
    queryKey: ['/api/scheduled-distributions'],
  });

  // Form for creating new scheduled distributions
  const form = useForm<InsertScheduledDistribution>({
    resolver: zodResolver(insertScheduledDistributionSchema),
    defaultValues: {
      scheduledDate: new Date(),
    },
  });

  const onSubmit = async (data: InsertScheduledDistribution) => {
    try {
      const response = await fetch('/api/scheduled-distributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule distribution');
      }

      toast({
        title: "Success",
        description: "Distribution has been scheduled successfully",
      });

      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-distributions'] });
    } catch (error) {
      console.error('Failed to create scheduled distribution:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to schedule distribution. Please try again.",
      });
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const response = await fetch(`/api/scheduled-distributions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update distribution status');
      }

      toast({
        title: "Success",
        description: "Distribution status updated successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['/api/scheduled-distributions'] });
    } catch (error) {
      console.error('Failed to update distribution status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update status. Please try again.",
      });
    }
  };

  if (loadingReleases || loadingPlatforms || loadingSchedules) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Distribution Schedule</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule New Distribution</CardTitle>
          <CardDescription>
            Create a new scheduled distribution for your release
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="releaseId"
                render={({ field }: { field: any }) => ( // Add basic type
                  <FormItem>
                    <FormLabel>Release</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a release" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {releases?.map((release) => (
                          <SelectItem key={release.id} value={release.id.toString()}>
                            {release.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platformId"
                render={({ field }: { field: any }) => ( // Add basic type
                  <FormItem>
                    <FormLabel>Platform</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a platform" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {platforms?.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id.toString()}>
                            {platform.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }: { field: any }) => ( // Add basic type
                  <FormItem className="flex flex-col">
                    <FormLabel>Distribution Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Schedule Distribution</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schedules?.map((schedule) => {
          const release = releases?.find((r) => r.id === schedule.releaseId);
          const platform = platforms?.find((p) => p.id === schedule.platformId);

          return (
            <Card key={schedule.id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{release?.title}</h3>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs",
                      getStatusColor(schedule.status)
                    )}>
                      {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {schedule.status === 'scheduled' && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(schedule.id, 'processing')}>
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              Start Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(schedule.id, 'cancelled')}>
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                        {schedule.status === 'processing' && (
                          <>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(schedule.id, 'completed')}>
                              <Check className="mr-2 h-4 w-4" />
                              Mark as Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(schedule.id, 'failed')}>
                              <X className="mr-2 h-4 w-4" />
                              Mark as Failed
                            </DropdownMenuItem>
                          </>
                        )}
                        {schedule.status === 'failed' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(schedule.id, 'scheduled')}>
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            Retry
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Platform: {platform?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Scheduled: {format(new Date(schedule.scheduledDate), "PPP")}
                </p>
                {/* Check if retryCount is not null before comparing */}
                {schedule.status === "failed" && schedule.retryCount != null && schedule.retryCount > 0 && (
                  <p className="text-xs text-red-600">
                    Retry attempts: {schedule.retryCount}
                  </p>
                )}
              </div>
            </Card>
          )}
        )}
      </div>
    </div>
  );
}