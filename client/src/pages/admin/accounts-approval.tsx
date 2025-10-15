import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, XCircle, RefreshCw, AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PaymentApprovalCard } from "@/components/subscription/PaymentApprovalCard";
import axios from "axios";

// User interface matching the API schema
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  entityName: string | null;
  status: string;
  createdAt: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  role?: string;
  subscriptionInfo?: {
    plan: 'free' | 'artist' | 'artist_manager' | 'label_admin';
    status: 'active' | 'pending' | 'pending_approval' | 'canceled' | 'expired' | 'inactive' | 'rejected';
    startDate: Date;
    endDate: Date;
    paymentId?: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function AccountApprovalPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    active: 0,
    suspended: 0,
    rejected: 0
  });
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Fetch users data with filters
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/admin/users', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
          page: pagination.page,
          limit: pagination.limit
        }
      });

      setUsers(response.data.users);
      setPagination(response.data.pagination);
      
      // Update stats
      updateStatistics();
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update statistics with separate calls
  const updateStatistics = async () => {
    try {
      const countAll = await axios.get('/api/admin/users', { params: { limit: 1 } });
      const countPending = await axios.get('/api/admin/users', { params: { status: 'pending', limit: 1 } });
      const countActive = await axios.get('/api/admin/users', { params: { status: 'active', limit: 1 } });
      const countSuspended = await axios.get('/api/admin/users', { params: { status: 'suspended', limit: 1 } });
      const countRejected = await axios.get('/api/admin/users', { params: { status: 'rejected', limit: 1 } });
      
      setStatistics({
        total: countAll.data.pagination.total,
        pending: countPending.data.pagination.total,
        active: countActive.data.pagination.total,
        suspended: countSuspended.data.pagination.total,
        rejected: countRejected.data.pagination.total
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  // Fetch data on initial load and when filters change
  useEffect(() => {
    fetchUsers();
  }, [statusFilter, pagination.page, pagination.limit]);

  // Handle search with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchUsers();
      } else {
        // Reset to page 1 when searching
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleStatusChange = async (userId: number, newStatus: string) => {
    if (!reviewNotes && (newStatus === "rejected" || newStatus === "suspended")) {
      toast({
        title: "Review notes required",
        description: "Please add review notes before rejecting or suspending an account.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      
      // For paid accounts that require approval, use the dedicated approvals API
      if (statusFilter === 'pending_approval') {
        const action = newStatus === 'active' ? 'approve' : 'reject';
        const response = await axios.post(`/api/admin/approvals/${userId}/${action}`, {
          notes: reviewNotes
        });
        
        toast({
          title: `Account ${action === 'approve' ? 'approved' : 'rejected'}`,
          description: response.data.message,
          variant: action === 'approve' ? "default" : "destructive",
        });
      } else {
        // For regular status changes, use the existing user status API
        const response = await axios.post(`/api/admin/users/${userId}/status`, {
          status: newStatus,
          note: reviewNotes
        });

        // Update the user in the local state
        setUsers(prev => 
          prev.map(user => user.id === userId ? response.data.user : user)
        );

        toast({
          title: `Account ${newStatus}`,
          description: `The account has been ${newStatus}.`,
          variant: newStatus === "active" ? "default" : "destructive",
        });
      }

      setReviewNotes("");
      setSelectedUser(null);
      setIsDetailDialogOpen(false);

      // Refresh user list and update statistics
      fetchUsers();
      updateStatistics();
    } catch (error) {
      console.error(`Error updating user status:`, error);
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select users to approve.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const response = await axios.post('/api/admin/users/batch-approve', {
        userIds: selectedUsers,
        note: "Batch approved by admin"
      });

      toast({
        title: "Batch processing complete",
        description: `Approved ${response.data.approvedCount} users successfully.`,
      });

      // Clear selections and refresh data
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error in batch approval:', error);
      toast({
        title: "Error",
        description: "Failed to process batch approval. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleUserSelection = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const selectAllVisible = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const openUserDetails = (userId: number) => {
    setSelectedUser(userId);
    setIsDetailDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
      pending_approval: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      suspended: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    };

    // Format display text for better readability
    const displayText = status === 'pending_approval' ? 'Payment Pending' : 
                        status.charAt(0).toUpperCase() + status.slice(1);

    return (
      <Badge className={statusColors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}>
        {displayText}
      </Badge>
    );
  };

  const selectedUserData = selectedUser !== null 
    ? users.find(user => user.id === selectedUser) 
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Account Approvals</h2>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleBatchApprove}
            disabled={isProcessing || selectedUsers.length === 0}
            className="flex items-center gap-1"
          >
            {isProcessing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Approve Selected ({selectedUsers.length})
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-muted/20">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground mb-1">Total</p>
            <p className="text-2xl font-bold">{statistics.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{statistics.pending}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{statistics.active}</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground mb-1">Suspended</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{statistics.suspended}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <p className="text-sm text-muted-foreground mb-1">Rejected</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{statistics.rejected}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Input
          placeholder="Search accounts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="md:w-[250px]"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="pending">Pending Registration</SelectItem>
            <SelectItem value="pending_approval">Pending Payment Approval</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* User Table */}
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={selectAllVisible}
                  />
                </th>
                <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">ID</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Contact</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Entity</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Created</th>
                <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center">No users found</td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 align-middle">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                      />
                    </td>
                    <td className="p-2 align-middle font-medium">{user.id}</td>
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          {user.avatarUrl ? (
                            <img 
                              src={user.avatarUrl} 
                              alt={user.username} 
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xs">{user.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          {user.fullName && (
                            <div className="text-xs text-muted-foreground">{user.fullName}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="text-sm">{user.email}</div>
                      {user.phoneNumber && (
                        <div className="text-xs text-muted-foreground">{user.phoneNumber}</div>
                      )}
                    </td>
                    <td className="p-4 align-middle">{user.entityName || "-"}</td>
                    <td className="p-4 align-middle">{getStatusBadge(user.status)}</td>
                    <td className="p-4 align-middle">
                      <div className="text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openUserDetails(user.id)}
                        >
                          Details
                        </Button>
                        {user.status === "pending" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, "active")}
                            disabled={isProcessing}
                          >
                            Approve
                          </Button>
                        )}
                        {user.status === "pending_approval" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleStatusChange(user.id, "active")}
                            disabled={isProcessing}
                          >
                            Approve Payment
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1 || loading}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pagination.page === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                  disabled={loading}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* User Details Dialog */}
      {selectedUser && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Review user information and manage account status.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  {selectedUserData?.avatarUrl ? (
                    <img 
                      src={selectedUserData.avatarUrl || ""} 
                      alt={selectedUserData.username} 
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">{selectedUserData?.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium">{selectedUserData?.username}</h3>
                  {selectedUserData?.fullName && (
                    <p className="text-sm text-muted-foreground">{selectedUserData.fullName}</p>
                  )}
                  <p className="text-sm">{selectedUserData?.email}</p>
                  {selectedUserData?.phoneNumber && (
                    <p className="text-sm">{selectedUserData.phoneNumber}</p>
                  )}
                  <div className="mt-2">
                    {selectedUserData?.status && getStatusBadge(selectedUserData.status)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Entity Information</h4>
                <p className="text-sm">{selectedUserData?.entityName || "No entity information"}</p>
              </div>
              
              {/* Payment Approval Card for users with pending_approval status */}
              {selectedUserData?.status === "pending_approval" && (
                <PaymentApprovalCard 
                  user={{
                    ...selectedUserData,
                    subscriptionInfo: selectedUserData.subscriptionInfo as {
                      plan: 'free' | 'artist' | 'artist_manager' | 'label_admin';
                      status: 'pending_approval' | 'approved' | 'rejected';
                      startDate: Date;
                      endDate: Date;
                      paymentId?: string;
                    }
                  }}
                  onStatusChange={() => {
                    // Refresh the user list to show updated status
                    fetchUsers();
                    // Close the detail dialog
                    setIsDetailDialogOpen(false);
                    // Show success message
                    toast({
                      title: "User status updated",
                      description: "The user's account status has been updated successfully."
                    });
                  }}
                />
              )}

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Review Notes</h4>
                <Textarea
                  placeholder="Add notes about this account review..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row space-y-2 space-y-reverse sm:space-y-0 gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDetailDialogOpen(false)}
              >
                Cancel
              </Button>
              
              <div className="flex flex-1 justify-end space-x-2">
                {selectedUserData && selectedUserData.status === "pending" && (
                  <>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleStatusChange(selectedUserData.id, "rejected")}
                      disabled={isProcessing}
                    >
                      Reject
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={() => handleStatusChange(selectedUserData.id, "active")}
                      disabled={isProcessing}
                    >
                      Approve
                    </Button>
                  </>
                )}
                {/* Removed redundant buttons for pending_approval since they're in the PaymentApprovalCard */}
                {selectedUserData && selectedUserData.status === "active" && (
                  <Button 
                    variant="destructive" 
                    onClick={() => handleStatusChange(selectedUserData.id, "suspended")}
                    disabled={isProcessing}
                  >
                    Suspend
                  </Button>
                )}
                {selectedUserData && selectedUserData.status === "suspended" && (
                  <Button 
                    variant="default" 
                    onClick={() => handleStatusChange(selectedUserData.id, "active")}
                    disabled={isProcessing}
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}