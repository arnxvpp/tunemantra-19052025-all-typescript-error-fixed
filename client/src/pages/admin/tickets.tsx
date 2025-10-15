import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, MessageSquare, Clock, AlertTriangle, 
  Filter, UserPlus, ArrowUpDown, Calendar, RefreshCw,
  Mail, FileText, BarChart3, Download, Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";

// Define more specific typings for tickets
type TicketStatus = "open" | "in_progress" | "closed" | "waiting";
type TicketPriority = "low" | "medium" | "high" | "critical";
type TicketCategory = "technical" | "billing" | "content" | "distribution" | "other";

interface TicketMessage {
  id: number;
  sender: string;
  senderRole?: "user" | "admin" | "system";
  content: string;
  timestamp: string;
  attachments?: { name: string, url: string }[];
}

interface Ticket {
  id: number; 
  subject: string;
  message: string;
  from: string;
  email: string;
  date: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assignedTo?: string;
  messages: TicketMessage[];
  updatedAt: string;
  waitingForResponse?: boolean;
}

// Enhanced mock data with more realistic tickets and categories
const MOCK_TICKETS: Ticket[] = [
  { 
    id: 1, 
    subject: "Payment processing issue", 
    message: "I've been trying to add my payment method but I keep getting an error. Can you help?", 
    from: "Ryan Carter", 
    email: "ryan@gmail.com", 
    date: "2023-06-15T14:30:00", 
    status: "open", 
    priority: "high",
    category: "billing",
    updatedAt: "2023-06-15T14:30:00",
    waitingForResponse: true,
    messages: [
      { id: 1, sender: "Ryan Carter", senderRole: "user", content: "I've been trying to add my payment method but I keep getting an error. Can you help?", timestamp: "2023-06-15T14:30:00" }
    ]
  },
  { 
    id: 2, 
    subject: "Release delayed", 
    message: "My release was supposed to go live yesterday but it's still not appearing on streaming platforms.", 
    from: "Emma Thompson", 
    email: "emma@outlook.com", 
    date: "2023-06-15T10:15:00", 
    status: "in_progress", 
    priority: "high",
    category: "distribution",
    assignedTo: "Support Team Lead",
    updatedAt: "2023-06-15T14:22:00",
    messages: [
      { id: 1, sender: "Emma Thompson", senderRole: "user", content: "My release was supposed to go live yesterday but it's still not appearing on streaming platforms.", timestamp: "2023-06-15T10:15:00" },
      { id: 2, sender: "Support Team Lead", senderRole: "admin", content: "I'm checking with our distribution team. We'll need to verify with the platforms. I'll update you shortly.", timestamp: "2023-06-15T14:22:00" }
    ]
  },
  { 
    id: 3, 
    subject: "Account access problem", 
    message: "I'm unable to access certain features that should be available with my account type.", 
    from: "David Wilson", 
    email: "david@yahoo.com", 
    date: "2023-06-14T16:45:00", 
    status: "open", 
    priority: "medium",
    category: "technical",
    updatedAt: "2023-06-14T16:45:00",
    waitingForResponse: true,
    messages: [
      { id: 1, sender: "David Wilson", senderRole: "user", content: "I'm unable to access certain features that should be available with my account type.", timestamp: "2023-06-14T16:45:00" }
    ]
  },
  { 
    id: 4, 
    subject: "Missing royalties in report", 
    message: "The latest royalty report doesn't include earnings from Spotify for the last month.", 
    from: "Sophie Martinez", 
    email: "sophie@hotmail.com", 
    date: "2023-06-13T09:20:00", 
    status: "waiting", 
    priority: "high",
    category: "billing",
    updatedAt: "2023-06-14T09:20:00",
    waitingForResponse: false,
    messages: [
      { id: 1, sender: "Sophie Martinez", senderRole: "user", content: "The latest royalty report doesn't include earnings from Spotify for the last month.", timestamp: "2023-06-13T09:20:00" },
      { id: 2, sender: "Support Agent", senderRole: "admin", content: "We need additional information about your Spotify account to investigate. Could you provide your Spotify artist ID?", timestamp: "2023-06-13T11:45:00" },
      { id: 3, sender: "System", senderRole: "system", content: "Waiting for customer response. Reminder sent on 2023-06-14T09:20:00", timestamp: "2023-06-14T09:20:00" }
    ]
  },
  { 
    id: 5, 
    subject: "Issue with artwork upload", 
    message: "I can't upload my cover artwork. The system keeps rejecting the file even though it follows the requirements.", 
    from: "Michael Brown", 
    email: "michael@gmail.com", 
    date: "2023-06-12T13:10:00", 
    status: "closed", 
    priority: "medium",
    category: "content",
    updatedAt: "2023-06-12T15:05:00",
    messages: [
      { id: 1, sender: "Michael Brown", senderRole: "user", content: "I can't upload my cover artwork. The system keeps rejecting the file even though it follows the requirements.", timestamp: "2023-06-12T13:10:00" },
      { id: 2, sender: "Support", senderRole: "admin", content: "Please make sure your artwork is exactly 3000x3000 pixels and less than 10MB. If you're still having issues, please try a different file format like JPG instead of PNG.", timestamp: "2023-06-12T14:22:00" },
      { id: 3, sender: "Michael Brown", senderRole: "user", content: "That worked! Thank you for your help.", timestamp: "2023-06-12T15:05:00" },
      { id: 4, sender: "System", senderRole: "system", content: "Ticket closed automatically after resolution confirmation from user.", timestamp: "2023-06-12T15:05:30" }
    ]
  },
  { 
    id: 6, 
    subject: "WAV file rejected during upload", 
    message: "I tried to upload my WAV file for my new single but it got rejected during quality validation.", 
    from: "Jessica Miller", 
    email: "jessica@artist.com", 
    date: "2023-06-11T17:30:00", 
    status: "open", 
    priority: "medium",
    category: "content",
    updatedAt: "2023-06-11T17:30:00",
    waitingForResponse: true,
    messages: [
      { id: 1, sender: "Jessica Miller", senderRole: "user", content: "I tried to upload my WAV file for my new single but it got rejected during quality validation. The error says something about sample rate, but I exported it at 44.1kHz which should be correct.", timestamp: "2023-06-11T17:30:00" }
    ]
  },
  { 
    id: 7, 
    subject: "Need help with rights management", 
    message: "I'm co-producing a track and need to set up proper royalty splits. How do I add collaborators to my release?", 
    from: "Marcus Johnson", 
    email: "marcus@producer.net", 
    date: "2023-06-10T12:15:00", 
    status: "closed", 
    priority: "low",
    category: "other",
    updatedAt: "2023-06-10T15:22:00",
    messages: [
      { id: 1, sender: "Marcus Johnson", senderRole: "user", content: "I'm co-producing a track and need to set up proper royalty splits. How do I add collaborators to my release?", timestamp: "2023-06-10T12:15:00" },
      { id: 2, sender: "Support Agent", senderRole: "admin", content: "You can add collaborators and set royalty splits in the 'Collaborators' section when creating or editing your release. Go to your releases, select the specific track, then click on 'Manage Collaborators'. From there, you can add email addresses and assign percentage splits. Let me know if you need further assistance!", timestamp: "2023-06-10T13:45:00" },
      { id: 3, sender: "Marcus Johnson", senderRole: "user", content: "Found it, thanks! That was exactly what I needed.", timestamp: "2023-06-10T15:22:00" }
    ]
  }
];

export default function SupportTicketsPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sortField, setSortField] = useState<"date" | "priority" | "status">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  const [statistics, setStatistics] = useState({
    total: MOCK_TICKETS.length,
    open: MOCK_TICKETS.filter(t => t.status === "open").length,
    inProgress: MOCK_TICKETS.filter(t => t.status === "in_progress").length,
    waiting: MOCK_TICKETS.filter(t => t.status === "waiting").length,
    closed: MOCK_TICKETS.filter(t => t.status === "closed").length,
    highPriority: MOCK_TICKETS.filter(t => t.priority === "high" || t.priority === "critical").length
  });

  // Compute ticket statistics on tickets change
  useEffect(() => {
    setStatistics({
      total: tickets.length,
      open: tickets.filter(t => t.status === "open").length,
      inProgress: tickets.filter(t => t.status === "in_progress").length,
      waiting: tickets.filter(t => t.status === "waiting").length,
      closed: tickets.filter(t => t.status === "closed").length,
      highPriority: tickets.filter(t => t.priority === "high" || t.priority === "critical").length
    });
  }, [tickets]);

  // Enhanced filtering with multiple criteria
  const filteredTickets = tickets.filter(ticket => {
    // Filter by status
    if (statusFilter !== "all" && ticket.status !== statusFilter) {
      return false;
    }

    // Filter by priority
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) {
      return false;
    }

    // Filter by category
    if (categoryFilter !== "all" && ticket.category !== categoryFilter) {
      return false;
    }

    // Filter by assignment
    if (assignedToFilter === "assigned" && !ticket.assignedTo) {
      return false;
    } else if (assignedToFilter === "unassigned" && ticket.assignedTo) {
      return false;
    }

    // Filter by search query
    if (searchQuery && !ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !ticket.from.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !ticket.email.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  // Sorting logic
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    let comparison = 0;

    if (sortField === "date") {
      comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    } else if (sortField === "priority") {
      const priorityValues = { critical: 3, high: 2, medium: 1, low: 0 };
      comparison = priorityValues[b.priority] - priorityValues[a.priority];
    } else if (sortField === "status") {
      const statusValues = { open: 3, in_progress: 2, waiting: 1, closed: 0 };
      comparison = statusValues[b.status] - statusValues[a.status];
    }

    return sortDirection === "asc" ? -comparison : comparison;
  });

  const handleSort = (field: "date" | "priority" | "status") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleStatusChange = (id: number, newStatus: TicketStatus) => {
    setTickets(tickets.map(ticket => 
      ticket.id === id ? {
        ...ticket,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        messages: [
          ...ticket.messages,
          {
            id: Math.max(...ticket.messages.map(m => m.id)) + 1,
            sender: "System",
            senderRole: "system",
            content: `Ticket status changed to ${newStatus.replace('_', ' ')}.`,
            timestamp: new Date().toISOString()
          }
        ]
      } : ticket
    ));

    toast({
      title: `Status updated to ${newStatus.replace('_', ' ')}`,
      description: `Ticket #${id} has been updated.`,
    });
  };

  const handlePriorityChange = (id: number, newPriority: TicketPriority) => {
    setTickets(tickets.map(ticket => 
      ticket.id === id ? {
        ...ticket,
        priority: newPriority,
        updatedAt: new Date().toISOString(),
        messages: [
          ...ticket.messages,
          {
            id: Math.max(...ticket.messages.map(m => m.id)) + 1,
            sender: "System",
            senderRole: "system",
            content: `Ticket priority changed to ${newPriority}.`,
            timestamp: new Date().toISOString()
          }
        ]
      } : ticket
    ));

    toast({
      title: `Priority updated to ${newPriority}`,
      description: `Ticket #${id} has been updated.`,
    });
  };

  const handleAssign = (id: number, assignee: string) => {
    setTickets(tickets.map(ticket => 
      ticket.id === id ? {
        ...ticket,
        assignedTo: assignee,
        status: ticket.status === "open" ? "in_progress" : ticket.status,
        updatedAt: new Date().toISOString(),
        messages: [
          ...ticket.messages,
          {
            id: Math.max(...ticket.messages.map(m => m.id)) + 1,
            sender: "System",
            senderRole: "system",
            content: `Ticket assigned to ${assignee}.`,
            timestamp: new Date().toISOString()
          }
        ]
      } : ticket
    ));

    toast({
      title: `Ticket assigned`,
      description: `Ticket #${id} has been assigned to ${assignee}.`,
    });
  };

  const handleReply = () => {
    if (!selectedTicket || !replyMessage.trim()) return;

    setTickets(tickets.map(ticket => 
      ticket.id === selectedTicket ? {
        ...ticket,
        status: ticket.status === "open" || ticket.status === "waiting" ? "in_progress" : ticket.status,
        waitingForResponse: true,
        updatedAt: new Date().toISOString(),
        messages: [
          ...ticket.messages,
          { 
            id: Math.max(...ticket.messages.map(m => m.id)) + 1,
            sender: "Support", 
            senderRole: "admin",
            content: replyMessage, 
            timestamp: new Date().toISOString() 
          }
        ]
      } : ticket
    ));

    setReplyMessage("");

    toast({
      title: `Reply sent`,
      description: `Your response to ticket #${selectedTicket} has been sent.`,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getPriorityBadgeStyles = (priority: TicketPriority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getStatusBadgeStyles = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'waiting':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return AlertTriangle;
      case 'in_progress':
        return Clock;
      case 'waiting':
        return Clock;
      case 'closed':
        return CheckCircle;
    }
  };

  const getCategoryIcon = (category: TicketCategory) => {
    switch (category) {
      case 'technical':
        return FileText;
      case 'billing':
        return BarChart3;
      case 'content':
        return FileText;
      case 'distribution':
        return Mail;
      default:
        return MessageSquare;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold">Support Tickets</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-[250px]"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="waiting">Waiting</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Priority</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${priorityFilter === 'all' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={() => setPriorityFilter('all')}
                    >
                      All
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${priorityFilter === 'critical' ? 'bg-red-100 border-red-500 text-red-800' : ''}`}
                      onClick={() => setPriorityFilter('critical')}
                    >
                      Critical
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${priorityFilter === 'high' ? 'bg-orange-100 border-orange-500 text-orange-800' : ''}`}
                      onClick={() => setPriorityFilter('high')}
                    >
                      High
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${priorityFilter === 'medium' ? 'bg-yellow-100 border-yellow-500 text-yellow-800' : ''}`}
                      onClick={() => setPriorityFilter('medium')}
                    >
                      Medium
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${priorityFilter === 'low' ? 'bg-blue-100 border-blue-500 text-blue-800' : ''}`}
                      onClick={() => setPriorityFilter('low')}
                    >
                      Low
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Category</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${categoryFilter === 'all' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={() => setCategoryFilter('all')}
                    >
                      All
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${categoryFilter === 'technical' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={() => setCategoryFilter('technical')}
                    >
                      Technical
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${categoryFilter === 'billing' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={() => setCategoryFilter('billing')}
                    >
                      Billing
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${categoryFilter === 'content' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={() => setCategoryFilter('content')}
                    >
                      Content
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${categoryFilter === 'distribution' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={() => setCategoryFilter('distribution')}
                    >
                      Distribution
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${categoryFilter === 'other' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={() => setCategoryFilter('other')}
                    >
                      Other
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Assigned</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${assignedToFilter === 'all' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={() => setAssignedToFilter('all')}
                    >
                      All
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${assignedToFilter === 'assigned' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={() => setAssignedToFilter('assigned')}
                    >
                      Assigned
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`cursor-pointer ${assignedToFilter === 'unassigned' ? 'bg-primary/10 border-primary text-primary' : ''}`}
                      onClick={() => setAssignedToFilter('unassigned')}
                    >
                      Unassigned
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle>Tickets</CardTitle>
            </CardHeader>
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {sortedTickets.length === 0 ? (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  No tickets found with the current filters.
                </div>
              ) : (
                sortedTickets.map(ticket => (
                  <div 
                    key={ticket.id} 
                    className={`px-4 py-3 cursor-pointer transition hover:bg-muted/50 ${selectedTicket === ticket.id ? 'bg-muted' : ''}`}
                    onClick={() => setSelectedTicket(ticket.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {React.createElement(getStatusIcon(ticket.status), { className: "h-4 w-4 text-muted-foreground" })}
                          <h4 className="text-sm font-medium line-clamp-1">{ticket.subject}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">{ticket.from}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge className={`${getStatusBadgeStyles(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(ticket.updatedAt)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className={`${getPriorityBadgeStyles(ticket.priority)}`}>
                        {ticket.priority}
                      </Badge>
                      <Badge variant="outline" className="bg-muted">
                        {ticket.category}
                      </Badge>
                      {ticket.waitingForResponse && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300">
                          Waiting
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="md:col-span-8 lg:col-span-9">
          {selectedTicket ? (
            <Card className="h-full flex flex-col overflow-hidden">
              {(() => {
                const ticket = tickets.find(t => t.id === selectedTicket);
                if (!ticket) return null;

                return (
                  <>
                    <CardHeader className="border-b">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{ticket.subject}</CardTitle>
                          <div className="text-sm text-muted-foreground mt-1">
                            From: {ticket.from} ({ticket.email})
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={ticket.status} 
                            onValueChange={(value: TicketStatus) => handleStatusChange(ticket.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="waiting">Waiting</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select 
                            value={ticket.priority} 
                            onValueChange={(value: TicketPriority) => handlePriorityChange(ticket.id, value)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <div className="flex items-center">
                          {React.createElement(getCategoryIcon(ticket.category), { className: "h-4 w-4 mr-1 text-muted-foreground" })}
                          <span className="text-sm text-muted-foreground capitalize">{ticket.category}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{formatDate(ticket.date)}</span>
                        </div>
                        {ticket.assignedTo ? (
                          <div className="flex items-center">
                            <UserPlus className="h-4 w-4 mr-1 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Assigned to: {ticket.assignedTo}</span>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs"
                            onClick={() => handleAssign(ticket.id, "Support Agent")}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Assign to me
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                      <Tabs defaultValue="conversation" className="h-full flex flex-col">
                        <div className="border-b px-6">
                          <TabsList className="justify-start -mb-px">
                            <TabsTrigger value="conversation" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary pb-2">
                              Conversation
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-primary pb-2">
                              Activity Log
                            </TabsTrigger>
                          </TabsList>
                        </div>
                        <TabsContent value="conversation" className="flex-1 overflow-hidden flex flex-col p-0">
                          <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {ticket.messages.map(message => (
                              <div 
                                key={message.id}
                                className={`flex ${message.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div 
                                  className={`max-w-[75%] rounded-lg p-4 ${
                                    message.senderRole === 'admin' 
                                      ? 'bg-primary text-primary-foreground' 
                                      : message.senderRole === 'system'
                                        ? 'bg-muted/50 text-muted-foreground text-sm italic'
                                        : 'bg-muted border'
                                  }`}
                                >
                                  {message.senderRole !== 'system' && (
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-sm">{message.sender}</span>
                                      <span className="text-xs opacity-80">{formatDate(message.timestamp)}</span>
                                    </div>
                                  )}
                                  <p className={`${message.senderRole === 'system' ? 'text-sm' : ''}`}>{message.content}</p>
                                  {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {message.attachments.map((attachment, index) => (
                                        <div key={index} className="flex items-center gap-2 p-2 bg-background/10 rounded">
                                          <FileText className="h-4 w-4" />
                                          <span className="text-sm flex-1 truncate">{attachment.name}</span>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                                            <a href={attachment.url} download>
                                              <Download className="h-4 w-4" />
                                            </a>
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="p-4 border-t">
                            <div className="flex gap-2">
                              <Textarea
                                placeholder="Type your reply..."
                                className="min-h-[80px]"
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                              />
                              <div className="flex flex-col gap-2">
                                <Button
                                  className="flex-1"
                                  disabled={!replyMessage.trim()}
                                  onClick={handleReply}
                                >
                                  Send
                                </Button>
                                <Button
                                  variant="outline"
                                  className="flex-1"
                                  disabled={ticket.status === "closed"}
                                >
                                  <span className="sr-only">Attach file</span>
                                  <Upload className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="activity" className="flex-1 overflow-auto p-6">
                          <div className="space-y-1">
                            {ticket.messages.map((message, index) => (
                              <div key={index} className="flex gap-3 items-start p-2 border-b border-border/30">
                                <div className="bg-muted-foreground/10 rounded-full p-1">
                                  {message.senderRole === 'user' ? (
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                  ) : message.senderRole === 'admin' ? (
                                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm">
                                    {message.senderRole === 'user' 
                                      ? `${message.sender} sent a message` 
                                      : message.senderRole === 'admin'
                                        ? `${message.sender} replied to the ticket`
                                        : message.content
                                    }
                                  </p>
                                  <p className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</p>
                                </div>
                              </div>
                            ))}
                            {/* Add more activity logs */}
                            <div className="flex gap-3 items-start p-2 border-b border-border/30">
                              <div className="bg-muted-foreground/10 rounded-full p-1">
                                <UserPlus className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm">Ticket created</p>
                                <p className="text-xs text-muted-foreground">{formatDate(ticket.date)}</p>
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </>
                );
              })()}
            </Card>
          ) : (
            <div className="flex items-center justify-center h-[400px] bg-muted/20 border border-border/50 rounded-lg">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <h3 className="text-lg font-medium">Select a ticket</h3>
                <p>Choose a support ticket from the list to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}