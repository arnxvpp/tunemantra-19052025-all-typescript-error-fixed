import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useFeatureAccess } from '@/hooks/use-feature-access';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RoleBadge } from '@/components/ui/role-badge';
import { UserPlus, Shield, Info } from 'lucide-react';

// Define the form schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  role: z.string().default('team_member'),
  permissionTemplate: z.string().optional(),
  permissions: z.object({
    canEditMetadata: z.boolean().default(true),
    canViewAnalytics: z.boolean().default(true),
    canDistribute: z.boolean().default(false),
    canManageRoyalties: z.boolean().default(false),
    canCreateReleases: z.boolean().default(false)
  })
});

// Sample permission templates
const PERMISSION_TEMPLATES = [
  {
    id: '1',
    name: 'Metadata Editor',
    description: 'Can edit metadata only',
    permissions: {
      canEditMetadata: true,
      canViewAnalytics: true,
      canDistribute: false,
      canManageRoyalties: false,
      canCreateReleases: false
    }
  },
  {
    id: '2',
    name: 'Release Manager',
    description: 'Can manage releases and distribution',
    permissions: {
      canEditMetadata: true,
      canViewAnalytics: true,
      canDistribute: true,
      canManageRoyalties: false,
      canCreateReleases: true
    }
  },
  {
    id: '3',
    name: 'Financial Manager',
    description: 'Can manage royalties and view analytics',
    permissions: {
      canEditMetadata: false,
      canViewAnalytics: true,
      canDistribute: false,
      canManageRoyalties: true,
      canCreateReleases: false
    }
  }
];

type FormValues = z.infer<typeof formSchema>;

export function AssignTeamMemberForm() {
  const { user } = useAuth();
  // Remove getParentInfo as it's not provided by the hook
  const { getPlanName } = useFeatureAccess();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      fullName: '',
      role: 'team_member',
      permissions: {
        canEditMetadata: true,
        canViewAnalytics: true,
        canDistribute: false,
        canManageRoyalties: false,
        canCreateReleases: false
      }
    }
  });
  
  // Watch for template selection to update permissions
  const selectedTemplate = form.watch('permissionTemplate');
  
  React.useEffect(() => {
    if (selectedTemplate) {
      const template = PERMISSION_TEMPLATES.find(t => t.id === selectedTemplate);
      if (template) {
        form.setValue('permissions', template.permissions);
      }
    }
  }, [selectedTemplate, form]);
  
  // Handle form submission
  const onSubmit = (values: FormValues) => {
    console.log('Form submitted:', values);
    
    // Here you would make an API call to add the team member
    // For now, we'll just show a success message
    toast({
      title: "Team member added",
      description: `${values.fullName} has been added to your team.`,
      variant: "default"
    });
    
    setOpen(false);
    form.reset();
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          <span>Add Team Member</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Add a new team member to work on behalf of your account with limited permissions.
          </DialogDescription>
        </DialogHeader>
        
        {/* Change Alert variant to "default" */}
        <Alert variant="default" className="bg-blue-50 border-blue-200">
          <Shield className="h-4 w-4" />
          <AlertTitle>Subscription Inheritance</AlertTitle>
          <AlertDescription className="text-sm">
            Team members will be subject to the same subscription limitations as your
            {user?.subscriptionInfo?.plan ? 
              <span className="font-medium"> {getPlanName()} plan</span> : 
              ' account'
            }.
          </AlertDescription>
        </Alert>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }: { field: any }) => ( // Add basic type
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="email@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    They will receive an invitation to join your team
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }: { field: any }) => ( // Add basic type
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="role"
              render={({ field }: { field: any }) => ( // Add basic type
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="team_member">
                        <div className="flex items-center gap-2">
                          <RoleBadge role="team_member" showTooltip={false} size="sm" />
                          <span>Team Member</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    This determines their base access level in your account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="permissionTemplate"
              render={({ field }: { field: any }) => ( // Add basic type
                <FormItem>
                  <FormLabel>Permission Template</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template or customize below" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PERMISSION_TEMPLATES.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col">
                            <span>{template.name}</span>
                            <span className="text-xs text-gray-500">{template.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select a predefined template or customize permissions below
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Custom Permissions</h4>
                <Info className="h-4 w-4 text-gray-400" />
              </div>
              
              <FormField
                control={form.control}
                name="permissions.canEditMetadata"
                render={({ field }: { field: any }) => ( // Add basic type
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Edit Metadata</FormLabel>
                      <FormDescription>
                        Can edit track and release metadata
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="permissions.canViewAnalytics"
                render={({ field }: { field: any }) => ( // Add basic type
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>View Analytics</FormLabel>
                      <FormDescription>
                        Can view streaming and revenue analytics
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="permissions.canDistribute"
                render={({ field }: { field: any }) => ( // Add basic type
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Manage Distribution</FormLabel>
                      <FormDescription>
                        Can submit and manage content distribution to platforms
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="permissions.canManageRoyalties"
                render={({ field }: { field: any }) => ( // Add basic type
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Manage Royalties</FormLabel>
                      <FormDescription>
                        Can manage royalty splits and payments
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="permissions.canCreateReleases"
                render={({ field }: { field: any }) => ( // Add basic type
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Create Releases</FormLabel>
                      <FormDescription>
                        Can create new releases and uploads
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} type="button">
                Cancel
              </Button>
              <Button type="submit">Add Team Member</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}