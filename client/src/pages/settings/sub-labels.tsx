import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger, // Added DialogTrigger
  DialogFooter // Added DialogFooter
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Edit, 
  Users, 
  Trash2, 
  History, 
  Shield,
  CheckCircle,
  XCircle,
  Copy,
  Plus, // Added Plus
  Loader2, // Added Loader2
  Info // Added Info
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner"; // Assuming Spinner exists
import { Badge } from "@/components/ui/badge"; // Added Badge import
import { Separator } from "@/components/ui/separator"; // Added Separator import
import { Label } from "@/components/ui/label"; // Added Label import
import { Textarea } from "@/components/ui/textarea"; // Added Textarea import
import { apiRequest } from "@/lib/queryClient"; // Assuming apiRequest exists

// Define types based on usage and schema
type PermissionSettings = {
  canCreateReleases: boolean;
  canManageArtists: boolean;
  canViewAnalytics: boolean;
  canManageDistribution: boolean;
  maxArtists: number;
  maxReleasesPerMonth: number;
  canManageRoyalties: boolean;
  canEditMetadata: boolean;
  canAccessFinancials: boolean;
  canInviteUsers: boolean;
  territoryRestrictions: string[];
  reportingAccess: "none" | "basic" | "advanced" | "full";
  // Add potentially missing fields based on form
  requireApprovalForReleases?: boolean; 
  canOverrideApprovals?: boolean;
};

type PermissionTemplate = {
  id: number;
  name: string;
  description: string;
  settings: PermissionSettings;
  isDefault: boolean;
};

type SubLabel = {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  entityName: string;
  status: string; // e.g., 'active', 'pending'
  permissionLevel: string; // e.g., 'standard', 'manager', 'admin'
  settings: PermissionSettings; // Use the defined type
  clientId?: string; // Add clientId if it exists
};

type AuditLog = {
  id: number;
  timestamp: string;
  action: string;
  changedBy: string; // Assuming changedBy is a string username/email
  details: string; // Simplified details for now
};


const subLabelSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  entityName: z.string().min(2, "Entity name must be at least 2 characters"),
  permissionLevel: z.enum(["admin", "manager", "standard"]),
  // Use the defined PermissionSettings type structure
  labelSettings: z.object({
    canCreateReleases: z.boolean(),
    canManageArtists: z.boolean(),
    canViewAnalytics: z.boolean(),
    canManageDistribution: z.boolean(),
    maxArtists: z.number().min(1),
    maxReleasesPerMonth: z.number().min(1),
    canManageRoyalties: z.boolean(),
    canEditMetadata: z.boolean(),
    canAccessFinancials: z.boolean(),
    canInviteUsers: z.boolean(),
    territoryRestrictions: z.array(z.string()), // Keep as array
    reportingAccess: z.enum(["none", "basic", "advanced", "full"]),
    // Add missing fields if they should be part of the form schema
    requireApprovalForReleases: z.boolean().optional(), 
    canOverrideApprovals: z.boolean().optional(),
  }),
  // Add isDefault if it's part of the creation form
  isDefault: z.boolean().optional(), 
});

type SubLabelFormValues = z.infer<typeof subLabelSchema>;

// Helper function to safely split comma-separated strings into arrays
const splitContributors = (value: string | undefined | null): string[] => {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
};


export default function SubLabelsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<SubLabel | null>(null); // Store full SubLabel object
  const [isViewingHistory, setIsViewingHistory] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    password: string;
    clientId: string;
  } | null>(null);
  const queryClient = useQueryClient(); // Get queryClient instance from hook

  const form = useForm<SubLabelFormValues>({
    resolver: zodResolver(subLabelSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      fullName: "",
      entityName: "",
      permissionLevel: "standard",
      labelSettings: {
        canCreateReleases: true,
        canManageArtists: false,
        canViewAnalytics: true,
        canManageDistribution: false,
        maxArtists: 5,
        maxReleasesPerMonth: 10,
        canManageRoyalties: false,
        canEditMetadata: true,
        canAccessFinancials: false,
        canInviteUsers: false,
        territoryRestrictions: [],
        reportingAccess: "basic",
        requireApprovalForReleases: false, // Add default
        canOverrideApprovals: false, // Add default
      },
      isDefault: false, // Add default
    },
  });

  const { data: subLabels = [], isLoading } = useQuery<SubLabel[]>({ // Default to empty array
    queryKey: ["/api/sub-labels"],
     queryFn: async (): Promise<SubLabel[]> => { // Add queryFn
      const response = await fetch('/api/sub-labels');
      if (!response.ok) throw new Error('Failed to fetch sub-labels');
      return response.json();
    },
  });

  const { data: auditLogs = [] } = useQuery<AuditLog[]>({ // Default to empty array
    queryKey: ["/api/sub-labels/audit-logs", selectedLabel?.id],
     queryFn: async (): Promise<AuditLog[]> => { // Add queryFn
       if (!selectedLabel?.id) return [];
       const response = await fetch(`/api/sub-labels/audit-logs/${selectedLabel.id}`);
       if (!response.ok) throw new Error('Failed to fetch audit logs');
       return response.json();
     },
    enabled: !!selectedLabel?.id,
  });

  const createSubLabelMutation = useMutation({
    mutationFn: async (data: SubLabelFormValues) => {
      const response = await fetch("/api/sub-labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          // Map form data to API structure if needed
          // Example: Map permissionLevel to role if API expects 'role'
          role: data.permissionLevel, 
          settings: data.labelSettings, // Pass settings object directly if API expects it
        }),
      });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({})); // Try to parse error
         throw new Error(errorData.message || "Failed to create sub-label");
      }
      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: "Sub-label created successfully",
      });
      setCreatedCredentials({
        username: response.username,
        password: form.getValues().password, // Get password from form state
        clientId: response.clientId,
      });
      form.reset(); // Reset form after successful submission
      setIsCreating(false); // Close the creation form/dialog
      queryClient.invalidateQueries({ queryKey: ["/api/sub-labels"] }); // Use the instance
    },
    onError: (error: Error) => { // Type error
      toast({
        title: "Error",
        description: error.message || "Failed to create sub-label",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({ // Assuming this deletes sub-labels, rename if needed
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sub-labels/${id}`, { // Use sub-labels endpoint
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete sub-label");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sub-labels"] }); // Use the instance
      toast({
        title: "Success",
        description: "Sub-label deleted successfully",
      });
    },
     onError: (error: Error) => { // Type error
      toast({
        title: "Error",
        description: error.message || "Failed to delete sub-label",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string | undefined | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const onSubmit = (data: SubLabelFormValues) => {
    // Convert string array fields if necessary before mutation
    const apiData = {
        ...data,
        labelSettings: {
            ...data.labelSettings,
            // Ensure territoryRestrictions is an array if needed by API
            territoryRestrictions: Array.isArray(data.labelSettings.territoryRestrictions) 
                ? data.labelSettings.territoryRestrictions 
                : splitContributors(data.labelSettings.territoryRestrictions as any), // Use defined helper
        }
    };
    createSubLabelMutation.mutate(apiData);
  };

  if (!user) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold">Unauthorized Access</h2>
        <p className="text-muted-foreground mt-2">
          You need to be logged in to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sub-Label Management</CardTitle>
              <CardDescription>
                Create and manage sub-labels for your organization
              </CardDescription>
            </div>
            <Button onClick={() => { setIsCreating(true); setSelectedLabel(null); form.reset(); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Sub-Label
            </Button>
          </div>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <div className="flex items-center justify-center h-40">
               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
           ) : !subLabels || subLabels.length === 0 ? (
              <div className="text-center py-10">
                 <p className="text-muted-foreground">No sub-labels found.</p>
              </div>
           ) : (
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Name</TableHead>
                   <TableHead>Email</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Permission Level</TableHead>
                   <TableHead>Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {subLabels.map((label) => (
                   <TableRow key={label.id}>
                     <TableCell>
                       <div className="font-medium">{label.entityName}</div>
                       <div className="text-sm text-muted-foreground">{label.fullName}</div>
                     </TableCell>
                     <TableCell>{label.email}</TableCell>
                     <TableCell>
                       <Badge variant={label.status === 'active' ? 'default' : 'secondary'}>
                         {label.status}
                       </Badge>
                     </TableCell>
                     <TableCell>{label.permissionLevel}</TableCell>
                     <TableCell>
                       <div className="flex gap-2">
                         <Button variant="ghost" size="sm" onClick={() => { setSelectedLabel(label); setIsCreating(true); form.reset(label as any); }}>
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => { setSelectedLabel(label); setIsViewingHistory(true); }}>
                           <History className="h-4 w-4" />
                         </Button>
                         <Button variant="ghost" size="sm" onClick={() => deleteTemplateMutation.mutate(label.id)} disabled={deleteTemplateMutation.isPending}>
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreating} onOpenChange={(open) => { if (!open) setSelectedLabel(null); setIsCreating(open); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedLabel ? "Edit Sub-Label" : "Create Sub-Label"} 
            </DialogTitle>
            <DialogDescription>
              {selectedLabel ? "Update permissions and settings." : "Define permissions and settings for the new sub-label"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-4">
              {/* Basic Information Fields */}
               <h3 className="font-medium text-lg border-b pb-2">Basic Information</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }: { field: any }) => ( 
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }: { field: any }) => ( 
                      <FormItem>
                        <FormLabel>{selectedLabel ? "New Password (Optional)" : "Password"}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} placeholder={selectedLabel ? "Leave blank to keep current" : ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }: { field: any }) => ( 
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }: { field: any }) => ( 
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="entityName"
                    render={({ field }: { field: any }) => ( 
                      <FormItem>
                        <FormLabel>Entity Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissionLevel"
                    render={({ field }: { field: any }) => ( 
                      <FormItem>
                        <FormLabel>Permission Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value} // Use value for controlled component
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select permission level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="standard">Standard</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
               </div>

              {/* Enhanced Permission Settings */}
              <div className="space-y-6 border rounded-md p-4 mt-6">
                 <h3 className="font-medium text-lg border-b pb-2">Label Settings & Permissions</h3>

                {/* Content Management */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Content Management</h4>
                  <FormField
                    control={form.control}
                    name="labelSettings.canCreateReleases"
                    render={({ field }: { field: any }) => ( 
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Can Create Releases</FormLabel>
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
                    name="labelSettings.canEditMetadata"
                    render={({ field }: { field: any }) => ( 
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Can Edit Metadata</FormLabel>
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
                      name="labelSettings.maxReleasesPerMonth"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Maximum Releases per Month</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} // Ensure number
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

                {/* Artist Management */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Artist Management</h4>
                  <FormField
                    control={form.control}
                    name="labelSettings.canManageArtists"
                    render={({ field }: { field: any }) => ( 
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Can Manage Artists</FormLabel>
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
                    name="labelSettings.maxArtists"
                    render={({ field }: { field: any }) => ( 
                      <FormItem>
                        <FormLabel>Maximum Artists</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} // Ensure number
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Financial Access */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Financial Access</h4>
                  <FormField
                    control={form.control}
                    name="labelSettings.canAccessFinancials"
                    render={({ field }: { field: any }) => ( 
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Can Access Financials</FormLabel>
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
                    name="labelSettings.canManageRoyalties"
                    render={({ field }: { field: any }) => ( 
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Can Manage Royalties</FormLabel>
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

                {/* User Management */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">User Management</h4>
                  <FormField
                    control={form.control}
                    name="labelSettings.canInviteUsers"
                    render={({ field }: { field: any }) => ( 
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Can Invite Users</FormLabel>
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

                {/* Analytics & Reporting */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Analytics & Reporting</h4>
                  <FormField
                    control={form.control}
                    name="labelSettings.canViewAnalytics"
                    render={({ field }: { field: any }) => ( 
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Can View Analytics</FormLabel>
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
                    name="labelSettings.reportingAccess"
                    render={({ field }: { field: any }) => ( 
                      <FormItem>
                        <FormLabel>Reporting Access Level</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value} // Use value
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select reporting access level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Access</SelectItem>
                            <SelectItem value="basic">Basic Reports</SelectItem>
                            <SelectItem value="advanced">Advanced Analytics</SelectItem>
                            <SelectItem value="full">Full Access</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 {/* Add other settings fields if needed */}
              </div>

              <DialogFooter className="border-t pt-4 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setSelectedLabel(null);
                    form.reset(); // Reset form on cancel
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createSubLabelMutation.isPending}>
                  {createSubLabelMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedLabel ? "Update Sub-Label" : "Create Sub-Label"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
       <Dialog open={!!createdCredentials} onOpenChange={() => setCreatedCredentials(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Sub-Label Created Successfully</DialogTitle>
             <DialogDescription>
               Please securely share these credentials with the sub-label administrator.
               The password cannot be recovered after closing this dialog.
             </DialogDescription>
           </DialogHeader>
           <div className="space-y-4 py-4">
             <div className="flex items-center gap-2">
               <Label htmlFor="cred-username" className="w-20">Username</Label>
               <Input id="cred-username" value={createdCredentials?.username} readOnly />
               <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdCredentials?.username)}>
                 <Copy className="h-4 w-4" />
               </Button>
             </div>
             <div className="flex items-center gap-2">
               <Label htmlFor="cred-password" className="w-20">Password</Label>
               <Input id="cred-password" value={createdCredentials?.password} readOnly type="text" />
               <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdCredentials?.password)}>
                 <Copy className="h-4 w-4" />
               </Button>
             </div>
             <div className="flex items-center gap-2">
               <Label htmlFor="cred-clientid" className="w-20">Client ID</Label>
               <Input id="cred-clientid" value={createdCredentials?.clientId} readOnly />
               <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdCredentials?.clientId)}>
                 <Copy className="h-4 w-4" />
               </Button>
             </div>
           </div>
           <DialogFooter>
             <Button onClick={() => setCreatedCredentials(null)}>Close</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={isViewingHistory} onOpenChange={setIsViewingHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log for {selectedLabel?.entityName}</DialogTitle>
            <DialogDescription>
              History of changes made to this sub-label
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4 p-1">
              {auditLogs?.map((log: any) => (
                <div key={log.id} className="text-sm border-b pb-2">
                  <p><strong>Action:</strong> {log.action}</p>
                  <p><strong>Changed By:</strong> {log.changedBy}</p>
                  <p><strong>Timestamp:</strong> {new Date(log.timestamp).toLocaleString()}</p>
                  {log.details && <p><strong>Details:</strong> {log.details}</p>}
                </div>
              ))}
              {auditLogs?.length === 0 && <p>No audit history found.</p>}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}