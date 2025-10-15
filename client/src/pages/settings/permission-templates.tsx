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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Copy, Trash } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

type PermissionTemplate = {
  id: number;
  name: string;
  description: string;
  settings: {
    canCreateReleases: boolean;
    canManageArtists: boolean;
    canViewAnalytics: boolean;
    canManageDistribution: boolean;
    canManageRoyalties: boolean;
    canEditMetadata: boolean;
    canAccessFinancials: boolean;
    canInviteUsers: boolean;
    maxArtists: number;
    maxReleasesPerMonth: number;
    requireApprovalForReleases: boolean;
    canOverrideApprovals: boolean;
    reportingAccess: "none" | "basic" | "advanced" | "full";
  };
  isDefault: boolean;
};

export default function PermissionTemplatesPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PermissionTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates, isLoading } = useQuery<PermissionTemplate[]>({ // Add type argument
    queryKey: ["/api/permission-templates"],
    queryFn: async (): Promise<PermissionTemplate[]> => { // Add queryFn
      // Replace with actual API call using apiRequest or fetch
      const response = await fetch('/api/permission-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/permission-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create template");
      return response.json();
    },
    onSuccess: () => {
      setIsCreating(false);
      queryClient.invalidateQueries({ queryKey: ["/api/permission-templates"] });
      toast({
        title: "Success",
        description: "Permission template created successfully",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/permission-templates/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete template");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/permission-templates"] });
      toast({
        title: "Success",
        description: "Permission template deleted successfully",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      description: formData.get("description"),
      settings: {
        canCreateReleases: formData.get("canCreateReleases") === "on",
        canManageArtists: formData.get("canManageArtists") === "on",
        canViewAnalytics: formData.get("canViewAnalytics") === "on",
        canManageDistribution: formData.get("canManageDistribution") === "on",
        canManageRoyalties: formData.get("canManageRoyalties") === "on",
        canEditMetadata: formData.get("canEditMetadata") === "on",
        canAccessFinancials: formData.get("canAccessFinancials") === "on",
        canInviteUsers: formData.get("canInviteUsers") === "on",
        maxArtists: parseInt(formData.get("maxArtists") as string),
        maxReleasesPerMonth: parseInt(formData.get("maxReleasesPerMonth") as string),
        requireApprovalForReleases: formData.get("requireApprovalForReleases") === "on",
        canOverrideApprovals: formData.get("canOverrideApprovals") === "on",
        reportingAccess: formData.get("reportingAccess"),
      },
      isDefault: formData.get("isDefault") === "on",
    };
    createTemplateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permission Templates</CardTitle>
              <CardDescription>
                Create and manage permission templates for team members
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Add optional chaining to safely map templates */}
            {templates?.map((template: PermissionTemplate) => (
              <Card key={template.id} className="relative">
                {template.isDefault && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                    Default
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Permissions:</h4>
                    <ul className="text-sm space-y-1">
                      {Object.entries(template.settings)
                        .filter(([_, value]) => typeof value === "boolean" && value)
                        .map(([key]) => (
                          <li key={key} className="text-muted-foreground">
                            • {key.replace(/([A-Z])/g, " $1").trim()}
                          </li>
                        ))}
                    </ul>
                    <Separator className="my-4" />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Clone template logic
                          setSelectedTemplate(template);
                          setIsCreating(true);
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        disabled={template.isDefault}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? "Clone Template" : "Create Permission Template"}
            </DialogTitle>
            <DialogDescription>
              Define permissions and settings for team members
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={selectedTemplate?.name}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={selectedTemplate?.description}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="font-medium">Content Management</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="canCreateReleases">Can Create Releases</Label>
                  <Switch
                    id="canCreateReleases"
                    name="canCreateReleases"
                    defaultChecked={selectedTemplate?.settings.canCreateReleases}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canEditMetadata">Can Edit Metadata</Label>
                  <Switch
                    id="canEditMetadata"
                    name="canEditMetadata"
                    defaultChecked={selectedTemplate?.settings.canEditMetadata}
                  />
                </div>
              </div>

              <Separator />

              <h4 className="font-medium">Team Management</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="canManageArtists">Can Manage Artists</Label>
                  <Switch
                    id="canManageArtists"
                    name="canManageArtists"
                    defaultChecked={selectedTemplate?.settings.canManageArtists}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canInviteUsers">Can Invite Users</Label>
                  <Switch
                    id="canInviteUsers"
                    name="canInviteUsers"
                    defaultChecked={selectedTemplate?.settings.canInviteUsers}
                  />
                </div>
              </div>

              <Separator />

              <h4 className="font-medium">Financial Access</h4>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="canManageRoyalties">Can Manage Royalties</Label>
                  <Switch
                    id="canManageRoyalties"
                    name="canManageRoyalties"
                    defaultChecked={selectedTemplate?.settings.canManageRoyalties}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="canAccessFinancials">Can Access Financials</Label>
                  <Switch
                    id="canAccessFinancials"
                    name="canAccessFinancials"
                    defaultChecked={selectedTemplate?.settings.canAccessFinancials}
                  />
                </div>
              </div>

              <Separator />

              <h4 className="font-medium">Limits & Thresholds</h4>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maxArtists">Maximum Artists</Label>
                  <Input
                    id="maxArtists"
                    name="maxArtists"
                    type="number"
                    defaultValue={selectedTemplate?.settings.maxArtists || 5}
                    min={1}
                  />
                </div>
                <div>
                  <Label htmlFor="maxReleasesPerMonth">Maximum Releases per Month</Label>
                  <Input
                    id="maxReleasesPerMonth"
                    name="maxReleasesPerMonth"
                    type="number"
                    defaultValue={selectedTemplate?.settings.maxReleasesPerMonth || 10}
                    min={1}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setSelectedTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTemplateMutation.isPending}>
                {createTemplateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {selectedTemplate ? "Clone Template" : "Create Template"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
