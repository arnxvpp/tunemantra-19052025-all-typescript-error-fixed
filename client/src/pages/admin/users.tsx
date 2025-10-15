
import { useState, useEffect } from "react";
import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Filter, MoreHorizontal, User, UserCheck, 
  UserMinus, ShieldAlert, Shield, Clock, Ban, Users
} from "lucide-react";

// Mock user data - replace with API call
const mockUsers = [
  { 
    id: 1, 
    username: "artist1", 
    email: "artist1@example.com", 
    status: "active", 
    role: "artist",
    createdAt: "2023-01-15",
    lastLogin: "2023-06-20",
    releases: 12,
    revenue: "$1,245.67"
  },
  { 
    id: 2, 
    username: "label_manager", 
    email: "manager@label.com", 
    status: "active", 
    role: "label",
    createdAt: "2023-02-10",
    lastLogin: "2023-06-22",
    releases: 45,
    revenue: "$8,765.32"
  },
  { 
    id: 3, 
    username: "suspended_user", 
    email: "suspended@example.com", 
    status: "suspended", 
    role: "artist",
    createdAt: "2023-03-05",
    lastLogin: "2023-05-15",
    releases: 3,
    revenue: "$215.44"
  },
  { 
    id: 4, 
    username: "pending_verification", 
    email: "pending@example.com", 
    status: "pending", 
    role: "artist",
    createdAt: "2023-06-18",
    lastLogin: "Never",
    releases: 0,
    revenue: "$0.00"
  },
  { 
    id: 5, 
    username: "premium_label", 
    email: "premium@labelbig.com", 
    status: "active", 
    role: "label",
    createdAt: "2022-12-10",
    lastLogin: "2023-06-21",
    releases: 128,
    revenue: "$24,563.87"
  }
];

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // In a real app, you would fetch users from your API
  useEffect(() => {
    // Replace with actual API call
    // Example: fetchUsers().then(data => setUsers(data));
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    const matchesRole = filterRole === "all" || user.role === filterRole;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const handleStatusChange = (userId: number, newStatus: string) => {
    // Replace with API call to update user status
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ));
    
    toast({
      title: "User Updated",
      description: `User status changed to ${newStatus}`,
      variant: "default"
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      case "pending":
        return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Manage all user accounts across the platform
            </p>
          </div>
          <Button>
            <User className="h-4 w-4 mr-2" />
            Add New User
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <Filter className="h-4 w-4" />
                  Status
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                  <UserCheck className="h-4 w-4 mr-2 text-green-500" />
                  Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("suspended")}>
                  <Ban className="h-4 w-4 mr-2 text-red-500" />
                  Suspended
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
                  <Clock className="h-4 w-4 mr-2 text-amber-500" />
                  Pending
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <Filter className="h-4 w-4" />
                  Role
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterRole("all")}>
                  All Roles
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setFilterRole("artist")}>
                  <User className="h-4 w-4 mr-2" />
                  Artist
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("label")}>
                  <Users className="h-4 w-4 mr-2" />
                  Label
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterRole("admin")}>
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Admin
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-md">
            <TabsTrigger value="all">All Users</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="suspended">Suspended</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>User Accounts</CardTitle>
                <CardDescription>
                  {filteredUsers.length} users found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No users found matching your filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {user.role === 'admin' ? (
                              <div className="flex items-center gap-1">
                                <ShieldAlert className="h-4 w-4 text-amber-500" />
                                Admin
                              </div>
                            ) : user.role === 'label' ? (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                Label
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Artist
                              </div>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell>{user.createdAt}</TableCell>
                          <TableCell>{user.lastLogin}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Edit User</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {user.status === 'active' ? (
                                  <DropdownMenuItem 
                                    className="text-red-500"
                                    onClick={() => handleStatusChange(user.id, 'suspended')}
                                  >
                                    <UserMinus className="h-4 w-4 mr-2" />
                                    Suspend User
                                  </DropdownMenuItem>
                                ) : user.status === 'suspended' ? (
                                  <DropdownMenuItem 
                                    className="text-green-500"
                                    onClick={() => handleStatusChange(user.id, 'active')}
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Reactivate User
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem 
                                    className="text-green-500"
                                    onClick={() => handleStatusChange(user.id, 'active')}
                                  >
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Approve User
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Other tab contents - these would filter by status */}
          <TabsContent value="active" className="space-y-4">
            {/* Similar table but pre-filtered */}
          </TabsContent>
          <TabsContent value="pending" className="space-y-4">
            {/* Similar table but pre-filtered */}
          </TabsContent>
          <TabsContent value="suspended" className="space-y-4">
            {/* Similar table but pre-filtered */}
          </TabsContent>
        </Tabs>
      </div>
    </AdminDashboardLayout>
  );
}
