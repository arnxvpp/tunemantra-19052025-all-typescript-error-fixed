import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter // Added DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Shield, History, Edit, Trash2 } from "lucide-react"; // Added Edit, Trash2
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner"; // Assuming Spinner exists
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

type TeamMember = {
  id: number;
  username: string;
  fullName: string | null; // Allow null
  email: string; // Added email
  teamRole: string; // Use teamRole consistently
  status: string;
  lastActive?: string;
  settings?: PermissionSettings; // Add settings if applicable
};

type PermissionTemplate = {
  id: number;
  name: string;
  description: string;
  settings: PermissionSettings; // Use defined type
};

export default function TeamManagementPage() {
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading: templatesLoading } = useQuery<PermissionTemplate[]>({ // Add type and default
    queryKey: ["/api/permission-templates"],
    queryFn: async (): Promise<PermissionTemplate[]> => { // Add queryFn
       // Replace with actual API call
       console.log("Fetching permission templates...");
       await new Promise(resolve => setTimeout(resolve, 500));
       return [ // Mock data (remove isDefault)
         { id: 1, name: 'Editor', description: 'Can edit metadata', settings: { canEditMetadata: true } as any },
         { id: 2, name: 'Manager', description: 'Can manage releases', settings: { canCreateReleases: true, canManageDistribution: true } as any },
       ];
    },
  });

  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<TeamMember[]>({ // Add type and default
    queryKey: ["/api/sub-labels/:id/team"], // TODO: Replace :id with actual sub-label ID if applicable
     queryFn: async (): Promise<TeamMember[]> => { // Add queryFn
       // Replace with actual API call
       console.log("Fetching team members...");
       await new Promise(resolve => setTimeout(resolve, 500));
       return [ // Mock data
         { id: 101, username: 'jane.doe', fullName: 'Jane Doe', email: 'jane@example.com', teamRole: 'manager', status: 'active', lastActive: '2024-03-15' },
         { id: 102, username: 'john.smith', fullName: 'John Smith', email: 'john@example.com', teamRole: 'member', status: 'pending', lastActive: undefined },
       ];
    },
  });

  const updateTeamMemberMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: number; updates: Partial<TeamMember> & { labelSettings?: Partial<PermissionSettings> } }) => { // Type updates
      // TODO: Replace :id with actual sub-label ID if applicable
      const response = await fetch(`/api/sub-labels/:id/team/${userId}`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error("Failed to update team member");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sub-labels/:id/team"] });
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
    },
     onError: (error: Error) => { // Type error
      toast({
        title: "Error",
        description: error.message || "Failed to update team member",
        variant: "destructive",
      });
    },
  });

  const inviteTeamMemberMutation = useMutation({
    mutationFn: async (data: { email: string; teamRole: string }) => { // Type data
       // TODO: Replace :id with actual sub-label ID if applicable
      const response = await fetch("/api/sub-labels/:id/team", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({}));
         throw new Error(errorData.message || "Failed to invite team member");
      }
      return response.json();
    },
    onSuccess: () => {
      setIsInviting(false);
      queryClient.invalidateQueries({ queryKey: ["/api/sub-labels/:id/team"] });
      toast({
        title: "Success",
        description: "Team member invited successfully",
      });
    },
     onError: (error: Error) => { // Type error
      toast({
        title: "Error",
        description: error.message || "Failed to invite team member",
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = async (userId: number, role: string) => {
    try {
      await updateTeamMemberMutation.mutateAsync({
        userId,
        updates: { teamRole: role }, // Pass teamRole specifically
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update team member role",
        variant: "destructive",
      });
    }
  };

  const handleTemplateApply = async (userId: number, templateId: string) => {
    try {
      // Ensure templates is an array before finding
      const template = Array.isArray(templates) 
        ? templates.find((t: PermissionTemplate) => t.id === parseInt(templateId)) 
        : undefined;
      if (!template) return;

      // Pass settings directly if API expects a 'settings' or 'labelSettings' object
      await updateTeamMemberMutation.mutateAsync({
        userId,
        updates: { labelSettings: template.settings }, 
      });
       toast({ title: "Template Applied", description: `Applied '${template.name}' template.` });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply permission template",
        variant: "destructive",
      });
    }
  };

  if (membersLoading || templatesLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Management</CardTitle>
              <CardDescription>Manage your sub-label team members and their permissions</CardDescription>
            </div>
            <Button onClick={() => setIsInviting(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Permission Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers?.map((member: TeamMember) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{member.fullName}</p>
                      <p className="text-sm text-muted-foreground">{member.username}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={member.teamRole}
                      onValueChange={(value) => handleRoleChange(member.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Add roles based on your system */}
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Select
                      onValueChange={(value) => handleTemplateApply(member.id, value)}
                      // Consider setting a value if the member has a template applied
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Apply template" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Ensure templates is an array before mapping */}
                        {Array.isArray(templates) && templates.map((template: PermissionTemplate) => (
                          <SelectItem key={template.id} value={template.id.toString()}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      member.status === "active" ? "bg-green-100 text-green-700" :
                      member.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {member.status}
                    </span>
                  </TableCell>
                  <TableCell>{member.lastActive || "Never"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMember(member.id)} // Assuming edit opens a modal
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* Show audit logs */}}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                       <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* Handle delete */}} 
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Member Dialog */}
      <Dialog open={isInviting} onOpenChange={setIsInviting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Add a new member to your sub-label team
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const email = formData.get("email") as string;
              const teamRole = formData.get("teamRole") as string;
              if (email && teamRole) {
                 inviteTeamMemberMutation.mutate({ email, teamRole });
              } else {
                 toast({ title: "Missing fields", description: "Please enter email and select a role.", variant: "destructive" });
              }
            }}
            className="space-y-4"
          >
            <Input
              name="email"
              type="email"
              placeholder="Email address"
              required
            />
            <Select name="teamRole" required>
              <SelectTrigger>
                <SelectValue placeholder="Select team role" />
              </SelectTrigger>
              <SelectContent>
                {/* Align roles with your system */}
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviting(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteTeamMemberMutation.isPending}>
                {inviteTeamMemberMutation.isPending ? (
                  <Spinner size="sm" className="mr-2" />
                ) : null}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}