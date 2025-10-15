import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RoleBadge } from '@/components/ui/role-badge';
import { MoreHorizontal, UserPlus, Users, Shield, UserCog } from 'lucide-react';

interface TeamMember {
  id: number;
  username: string;
  fullName: string | null;
  email: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  joinedAt: string;
  permissions: Record<string, boolean>;
}

interface PermissionTemplate {
  id: number;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
}

export function TeamMembersList() {
  const { user } = useAuth();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  
  // Fetch team members with explicit type
  const { data: teamMembers, isLoading, error } = useQuery<TeamMember[]>({
    queryKey: ['/api/team-members'],
    // Assuming the API returns TeamMember[]
    queryFn: async (): Promise<TeamMember[]> => {
      // Replace with actual API call using apiRequest or fetch
      const response = await fetch('/api/team-members');
      if (!response.ok) throw new Error('Failed to fetch team members');
      return response.json();
    },
    enabled: !!user
  });
  
  // Fetch permission templates
  const { data: templates } = useQuery({
    queryKey: ['/api/permission-templates'],
    enabled: !!user
  });
  
  if (isLoading) {
    return <div className="py-4 text-center">Loading team members...</div>;
  }
  
  if (error) {
    return <div className="py-4 text-center text-red-500">Error loading team members</div>;
  }
  
  // Sample data for demonstration
  const mockTeamMembers: TeamMember[] = [
    {
      id: 1,
      username: 'janesmith',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      avatarUrl: null,
      role: 'team_member',
      status: 'active',
      joinedAt: '2023-01-15',
      permissions: {
        canEditMetadata: true,
        canDistribute: false,
        canViewAnalytics: true,
        canCreateReleases: false
      }
    },
    {
      id: 2,
      username: 'markjones',
      fullName: 'Mark Jones',
      email: 'mark@example.com',
      avatarUrl: null,
      role: 'team_member',
      status: 'active',
      joinedAt: '2023-02-10',
      permissions: {
        canEditMetadata: true,
        canDistribute: true,
        canViewAnalytics: true,
        canCreateReleases: false
      }
    }
  ];
  
  const handleRemoveMember = (member: TeamMember) => {
    setSelectedMember(member);
    setRemoveDialogOpen(true);
  };
  
  const confirmRemove = () => {
    // Logic to remove team member
    console.log(`Removing team member: ${selectedMember?.username}`);
    setRemoveDialogOpen(false);
  };
  
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">Team Members</CardTitle>
            <CardDescription>
              Manage team members working on behalf of your primary artist account
            </CardDescription>
          </div>
          <Button className="flex items-center gap-2" size="sm">
            <UserPlus className="h-4 w-4" />
            <span>Add Team Member</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-sm mb-4 px-2 flex items-center gap-2 text-blue-600">
          <Shield className="h-4 w-4" />
          <span>Team members work on behalf of your account and inherit subscription limitations from you as the primary artist.</span>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Remove fallback to mock data, rely on isLoading/error states */}
            {teamMembers?.map((member: TeamMember) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{member.fullName || member.username}</span>
                    <span className="text-sm text-gray-500">{member.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={member.role} />
                </TableCell>
                <TableCell>
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(member.permissions)
                      .filter(([_, value]) => value)
                      .map(([key]) => (
                        <Badge key={key} variant="outline" className="bg-gray-50">
                          {key.replace('can', '')}
                        </Badge>
                      ))
                    }
                  </div>
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  {new Date(member.joinedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <UserCog className="h-4 w-4" />
                        <span>Edit Permissions</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600 flex items-center gap-2"
                        onClick={() => handleRemoveMember(member)}
                      >
                        <Users className="h-4 w-4" />
                        <span>Remove from Team</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="border-t px-6 py-4 bg-gray-50 flex justify-between">
        <div className="text-sm text-gray-500">
          {/* Use optional chaining and default to 0 */}
          {teamMembers?.length ?? 0} team members
        </div>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span>Manage Permission Templates</span>
        </Button>
      </CardFooter>
      
      {/* Remove Team Member Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedMember?.fullName || selectedMember?.username} from your team? 
              They will no longer have access to work on behalf of your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRemove}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}