import { useState } from "react";
import { useForm } from "react-hook-form"; // Remove incorrect import
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

// --- Define simple interfaces for fetched data ---
interface Release {
  id: number;
  title: string;
}

interface Platform {
  id: number;
  name: string;
}
// --- End Interface Definitions ---

// Enhanced form schema with platform-specific settings
const formSchema = z.object({
  name: z.string().min(1, "Job name is required"),
  releaseIds: z.array(z.number()).min(1, "Select at least one release"),
  platformIds: z.array(z.number()).min(1, "Select at least one platform"),
  description: z.string().optional(),
  settings: z.object({
    priorityDistribution: z.boolean().default(false),
    scheduleImmediate: z.boolean().default(true),
    retryOnFailure: z.boolean().default(true),
    maxRetries: z.number().min(0).max(5).default(3),
    notifyOnCompletion: z.boolean().default(true),
    platformSpecific: z.record(z.object({
      pricing: z.string().optional(),
      territories: z.array(z.string()).optional(),
      exclusive: z.boolean().default(false),
      customMetadata: z.record(z.string()).optional(),
    })).optional(),
  }).default({}),
});

type FormValues = z.infer<typeof formSchema>;

interface NewBulkDistributionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewBulkDistributionModal({ open, onOpenChange }: NewBulkDistributionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      releaseIds: [],
      platformIds: [],
      settings: {
        priorityDistribution: false,
        scheduleImmediate: true,
        retryOnFailure: true,
        maxRetries: 3,
        notifyOnCompletion: true,
      },
    },
  });

  // Apply type to useQuery for releases
  const { data: releases, isLoading: releasesLoading } = useQuery<Release[]>({
    queryKey: ["/api/releases"],
    queryFn: async (): Promise<Release[]> => { // Add return type
      const response = await fetch("/api/releases");
      if (!response.ok) throw new Error("Failed to fetch releases");
      return response.json();
    },
  });

  // Apply type to useQuery for platforms
  const { data: platforms, isLoading: platformsLoading } = useQuery<Platform[]>({
    queryKey: ["/api/distribution-platforms"],
    queryFn: async (): Promise<Platform[]> => { // Add return type
      const response = await fetch("/api/distribution-platforms");
      if (!response.ok) throw new Error("Failed to fetch platforms");
      return response.json();
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/distribution/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Failed to create bulk distribution job");

      toast({
        title: "Success",
        description: "Bulk distribution job created successfully",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/distribution/bulk"] });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create job",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Bulk Distribution Job</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: any }) => ( // Add basic type for field
                <FormItem>
                  <FormLabel>Job Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter job name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => ( // Add basic type for field
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter job description (optional)" 
                      className="h-20"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="releaseIds"
              render={({ field }: { field: any }) => ( // Add basic type for field
                <FormItem>
                  <FormLabel>Select Releases</FormLabel>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                    {releasesLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      releases?.map((release: Release) => ( // Use defined interface
                        <FormField
                          key={release.id}
                          control={form.control}
                          name="releaseIds"
                          render={({ field }: { field: any }) => ( // Add basic type for field
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(release.id)}
                                  onCheckedChange={(checked) => {
                                    const value = field.value || [];
                                    return checked
                                      ? field.onChange([...value, release.id])
                                      : field.onChange(value.filter((id: number) => id !== release.id)); // Type id
                                  }}
                                />
                              </FormControl>
                              <span className="text-sm">{release.title}</span>
                            </FormItem>
                          )}
                        />
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="platformIds"
              render={({ field }: { field: any }) => ( // Add basic type for field
                <FormItem>
                  <FormLabel>Select Platforms</FormLabel>
                  <div className="space-y-2 border rounded-md p-2">
                    {platformsLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      platforms?.map((platform: Platform) => ( // Use defined interface
                        <FormField
                          key={platform.id}
                          control={form.control}
                          name="platformIds"
                          render={({ field }: { field: any }) => ( // Add basic type for field
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(platform.id)}
                                  onCheckedChange={(checked) => {
                                    const value = field.value || [];
                                    const newValue = checked
                                      ? [...value, platform.id]
                                      : value.filter((id: number) => id !== platform.id); // Type id
                                    field.onChange(newValue);
                                    setSelectedPlatforms(newValue);
                                  }}
                                />
                              </FormControl>
                              <span className="text-sm">{platform.name}</span>
                            </FormItem>
                          )}
                        />
                      ))
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 border rounded-md p-4">
              <h3 className="font-medium">Distribution Settings</h3>

              <FormField
                control={form.control}
                name="settings.priorityDistribution"
                render={({ field }: { field: any }) => ( // Add basic type for field
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Priority Distribution</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Process this job with higher priority
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.scheduleImmediate"
                render={({ field }: { field: any }) => ( // Add basic type for field
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Schedule Immediately</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Start distribution as soon as possible
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.retryOnFailure"
                render={({ field }: { field: any }) => ( // Add basic type for field
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Retry on Failure</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automatically retry failed distributions
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="settings.notifyOnCompletion"
                render={({ field }: { field: any }) => ( // Add basic type for field
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Notify on Completion</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about job status
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Distribution Job
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}