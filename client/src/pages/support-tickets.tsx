import React, { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"; // Added CardFooter
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, Clock, AlertTriangle, CheckCircle, 
  Plus, PlusCircle, FileText, BarChart3, Mail,
  RefreshCw, Send, Loader2, AlertCircle // Added AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription, // Added FormDescription
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar } from "@/components/ui/avatar"; // Assuming Avatar exists
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; // Added imports
import { apiRequest } from "@/lib/queryClient"; // Assuming apiRequest exists
import { format } from "date-fns"; // Added format import
import { Spinner } from "@/components/ui/spinner"; // Assuming Spinner exists
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert imports
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Added Dialog imports

// Define ticket types
type TicketStatus = "open" | "in_progress" | "closed" | "waiting";
type TicketPriority = "low" | "medium" | "high" | "critical";
type TicketCategory = "technical" | "billing" | "content" | "distribution" | "other";

interface TicketMessage {
  id: number;
  sender: string;
  senderRole?: "user" | "admin" | "system";
  senderType?: "user" | "admin" | "system"; // Keep if API uses it
  content: string;
  timestamp: string; // Keep if API uses it
  createdAt: string; // Keep if API uses it
  attachments?: { name: string, url: string }[];
  senderId?: number; // Keep if API uses it
}

interface Ticket {
  id: number;
  subject: string;
  message: string; // Initial message
  date: string; // Creation date
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  messages: TicketMessage[];
  updatedAt: string;
  waitingForResponse?: boolean;
}

// Form schema for new ticket
const newTicketSchema = z.object({
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  message: z.string().min(20, { message: "Message must be at least 20 characters" }),
  category: z.enum(["technical", "billing", "content", "distribution", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

type NewTicketFormValues = z.infer<typeof newTicketSchema>;

// Mock user data (replace with actual auth context if available)
const USER = {
  name: "Current User", // Placeholder
  email: "user@example.com" // Placeholder
};

// Define types for API responses (align with actual API)
type TicketResponse = {
  id: number;
  subject: string;
  message: string; // Initial message
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  createdAt: string;
  updatedAt: string;
};

type ApiTicketMessage = {
    id: number;
    content: string;
    senderType: "user" | "admin" | "system";
    createdAt: string;
    senderId: number; // Assuming senderId exists
};

type TicketDetailsResponse = {
  ticket: TicketResponse;
  messages: ApiTicketMessage[];
};


export default function UserSupportTicketsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null); // Restore state
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  
  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery<TicketResponse[]>({ // Default to empty array
    queryKey: ['/api/support/tickets'],
     queryFn: async (): Promise<TicketResponse[]> => { // Add queryFn
        // Replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return [ // Mock data
            { id: 1, subject: 'Issue with upload', message: '...', status: 'open', priority: 'high', category: 'technical', createdAt: '2024-03-10T10:00:00Z', updatedAt: '2024-03-10T10:00:00Z' },
            { id: 2, subject: 'Billing question', message: '...', status: 'waiting', priority: 'medium', category: 'billing', createdAt: '2024-03-09T15:30:00Z', updatedAt: '2024-03-11T09:15:00Z' },
            { id: 3, subject: 'Distribution delay', message: '...', status: 'in_progress', priority: 'high', category: 'distribution', createdAt: '2024-03-11T11:00:00Z', updatedAt: '2024-03-11T14:20:00Z' },
            { id: 4, subject: 'Audio quality issue', message: '...', status: 'closed', priority: 'low', category: 'technical', createdAt: '2024-03-13T09:20:00Z', updatedAt: '2024-03-14T11:15:00Z' },
        ];
     },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Fetch active ticket details with messages
  const { data: ticketDetails, isLoading: isLoadingDetails } = useQuery<TicketDetailsResponse>({ // Ensure queryFn returns TicketDetailsResponse
    queryKey: ['/api/support/tickets', selectedTicket], // Use selectedTicket
     queryFn: async (): Promise<TicketDetailsResponse> => { // Return Promise<TicketDetailsResponse>
        if (!selectedTicket) { // Use selectedTicket
           // This should not happen if 'enabled' is working correctly, but handle defensively
           throw new Error("No active ticket selected for fetching details."); 
        }
        // Replace with actual API call
         await new Promise(resolve => setTimeout(resolve, 500));
         // Find the ticket from the list for mock data
         const ticket = tickets.find(t => t.id === selectedTicket); // Use selectedTicket
         if (!ticket) {
            throw new Error(`Ticket with ID ${selectedTicket} not found.`); // Use selectedTicket
         }
         // Simulate messages based on ticket ID
         const messages: ApiTicketMessage[] = [
             { id: 101, content: `Initial message for ticket ${ticket.id}: ${ticket.message}`, senderType: 'user', createdAt: ticket.createdAt, senderId: 1 },
             { id: 102, content: `Support response for ticket ${ticket.id}.`, senderType: 'admin', createdAt: ticket.updatedAt, senderId: 99 },
         ];
         if (ticket.id === 3) { // Add more messages for ticket 3
             messages.push({ id: 103, content: 'User reply for ticket 3.', senderType: 'user', createdAt: new Date(Date.parse(ticket.updatedAt) + 60000).toISOString(), senderId: 1 });
         }
         return { // Mock data - Ensure structure matches TicketDetailsResponse
             ticket: ticket,
             messages: messages
         };
     },
    enabled: selectedTicket !== null, // Use selectedTicket
  });
  
  // Create new ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: NewTicketFormValues) => {
      console.log('Submitting ticket data:', data);
      // Replace with actual API call if apiRequest is available
      // return await apiRequest<TicketResponse, NewTicketFormValues>('/api/support/tickets', 'POST', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      const newId = Math.max(0, ...tickets.map(t => t.id)) + 1;
      const newTicket: TicketResponse = {
          id: newId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'open',
          // message: data.message, // Remove duplicate message property
          ...data
      };
      return newTicket; // Return simulated response
    },
    onSuccess: (data) => {
      console.log('Ticket created successfully:', data);
      toast({
        title: "Ticket created",
        description: "Your support ticket has been submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      form.reset();
      setIsNewTicketModalOpen(false);
      setSelectedTicket(data.id); // Use setSelectedTicket
    },
    onError: (error: any) => {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Add message to ticket mutation
  const addMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number, message: string }) => {
       // Replace with actual API call if apiRequest is available
      // return await apiRequest<any, { content: string }>(`/api/support/tickets/${ticketId}/messages`, 'POST', { content: message });
       await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
       return { success: true }; // Simulate success
    },
    onSuccess: (data) => {
      console.log('Message sent successfully:', data);
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets', selectedTicket] }); // Use selectedTicket
    },
    onError: (error: any) => { // Add type for error
      toast({
        title: "Error",
        description: error?.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // New ticket form
  const form = useForm<NewTicketFormValues>({
    resolver: zodResolver(newTicketSchema),
    defaultValues: {
      subject: "",
      message: "",
      category: "technical",
      priority: "medium"
    }
  });
  
  const onSubmit = (data: NewTicketFormValues) => {
    createTicketMutation.mutate(data);
  };
  
  const submitMessage = () => {
    if (!newMessage.trim() || !selectedTicket) return; // Use selectedTicket
    
    addMessageMutation.mutate({
      ticketId: selectedTicket, // Use selectedTicket
      message: newMessage
    });
  };
  
  // Helper functions for UI
  const getStatusBadgeStyles = (status: TicketStatus) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "in_progress":
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "waiting":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "closed":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };
  
  const getPriorityBadgeStyles = (priority: TicketPriority) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "medium":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "high":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200"; // Changed high to orange
      case "critical":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    }
  };
  
  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4" />;
      case "in_progress":
        return <RefreshCw className="h-4 w-4" />; // Use RefreshCw
      case "waiting":
        return <Clock className="h-4 w-4" />;
      case "closed":
        return <CheckCircle className="h-4 w-4" />; // Use CheckCircle
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  
  const getCategoryIcon = (category: TicketCategory) => {
    switch (category) {
      case "technical":
        return FileText;
      case "billing":
        return BarChart3;
      case "content":
        return FileText; // Changed to FileText
      case "distribution":
        return Mail; // Changed to Mail
      default:
        return MessageSquare;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  // Restore filterTicketsByStatus function
  const filterTicketsByStatus = (status: TicketStatus): TicketResponse[] => {
    return tickets.filter(ticket => ticket.status === status);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-12">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <MainLayout> {/* Wrap content in MainLayout */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <Dialog open={isNewTicketModalOpen} onOpenChange={setIsNewTicketModalOpen}>
            <DialogTrigger asChild>
              <Button className="group relative transition-all duration-300 overflow-hidden bg-primary/90 hover:bg-primary text-primary-foreground">
                <span className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors"></span>
                <PlusCircle className="mr-2 h-4 w-4 animate-pulse-gentle group-hover:scale-110 transition-transform duration-200" />
                <span className="relative z-10">New Ticket</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] animate-slideIn shadow-lg">
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>
                  Describe your issue and we'll get back to you as soon as possible.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }: { field: any }) => ( // Add basic type
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of your issue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }: { field: any }) => ( // Add basic type
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="technical">Technical Issue</SelectItem>
                            <SelectItem value="billing">Billing</SelectItem>
                            <SelectItem value="content">Content</SelectItem>
                            <SelectItem value="distribution">Distribution</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }: { field: any }) => ( // Add basic type
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Please select the appropriate priority for your issue
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }: { field: any }) => ( // Add basic type
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your issue in detail" 
                            className="min-h-[150px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                     <Button
                        type="button" // Add type="button" for cancel
                        variant="outline"
                        onClick={() => setIsNewTicketModalOpen(false)}
                     >
                        Cancel
                     </Button>
                    <Button
                      type="submit"
                      disabled={createTicketMutation.isPending}
                      className={`relative overflow-hidden transition-all duration-300 ${
                        createTicketMutation.isPending ? '' : 'hover:shadow-md hover:translate-y-[-1px]'
                      }`}
                    >
                      {createTicketMutation.isPending ? (
                        <>
                          <div className="absolute inset-0 bg-primary/10 animate-pulse-gentle"></div>
                          <Spinner size="sm" className="mr-2 relative z-10" />
                          <span className="relative z-10">Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors"></span>
                          <Send className="w-4 h-4 mr-2 animate-fadeIn" />
                          <span>Submit Ticket</span>
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Ticket List */}
          <div className="md:col-span-4 space-y-4">
            <Card className="bg-white rounded-lg shadow overflow-hidden">
              <CardHeader className="px-4 py-3 bg-muted/20 border-b">
                <CardTitle className="font-medium text-base">My Tickets</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="all" className="w-full">
                  <div className="px-4 pt-3">
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="open">Open</TabsTrigger>
                      <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                      <TabsTrigger value="closed">Closed</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="all" className="m-0">
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {tickets.map(ticket => (
                        <button
                          key={ticket.id}
                          className={`w-full px-4 py-3 text-left hover:bg-muted/30 ${selectedTicket === ticket.id ? 'bg-muted/30' : ''}`}
                          onClick={() => setSelectedTicket(ticket.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                              ticket.status === 'open' ? 'bg-yellow-500' : 
                              ticket.status === 'in_progress' ? 'bg-blue-500' :
                              ticket.status === 'waiting' ? 'bg-purple-500' :
                              'bg-green-500'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{ticket.subject}</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {ticket.message}
                              </p>
                              <div className="flex justify-between items-center mt-1">
                                <div className="flex items-center text-xs text-muted-foreground">
                                  {getCategoryIcon(ticket.category) && (
                                    <span className="mr-1">
                                      {React.createElement(getCategoryIcon(ticket.category), { className: "h-3 w-3" })}
                                    </span>
                                  )}
                                  <span>{ticket.category}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(ticket.updatedAt)}
                                  </span>
                                  <Badge variant="outline" className={getStatusBadgeStyles(ticket.status)}>
                                    {ticket.status.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="open" className="m-0">
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {filterTicketsByStatus('open').map(ticket => (
                        <button
                          key={ticket.id}
                          className={`w-full px-4 py-3 text-left hover:bg-muted/30 ${selectedTicket === ticket.id ? 'bg-muted/30' : ''}`}
                          onClick={() => setSelectedTicket(ticket.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-yellow-500"></div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{ticket.subject}</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {ticket.message}
                              </p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(ticket.updatedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="in_progress" className="m-0">
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {filterTicketsByStatus('in_progress').map(ticket => (
                        <button
                          key={ticket.id}
                          className={`w-full px-4 py-3 text-left hover:bg-muted/30 ${selectedTicket === ticket.id ? 'bg-muted/30' : ''}`}
                          onClick={() => setSelectedTicket(ticket.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{ticket.subject}</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {ticket.message}
                              </p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(ticket.updatedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="closed" className="m-0">
                    <div className="divide-y max-h-[600px] overflow-y-auto">
                      {filterTicketsByStatus('closed').map(ticket => (
                        <button
                          key={ticket.id}
                          className={`w-full px-4 py-3 text-left hover:bg-muted/30 ${selectedTicket === ticket.id ? 'bg-muted/30' : ''}`}
                          onClick={() => setSelectedTicket(ticket.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{ticket.subject}</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {ticket.message}
                              </p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(ticket.updatedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Details */}
          <div className="md:col-span-8">
            {/* Check selectedTicket first, then isLoadingDetails, then ticketDetails */}
            {!selectedTicket ? ( // Use selectedTicket
               <Card className="h-full flex flex-col justify-center items-center p-12">
                 <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
                 <h3 className="text-lg font-medium text-gray-500">Select a ticket</h3>
                 <p className="text-sm text-gray-400">Choose a ticket from the list to view details</p>
               </Card>
            ) : isLoadingDetails ? (
               <Card className="h-full flex flex-col justify-center items-center p-12">
                  <Spinner size="lg" />
               </Card>
            ) : ticketDetails && ticketDetails.ticket ? (
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <CardTitle className="mr-2">{ticketDetails.ticket.subject}</CardTitle>
                        <Badge className={getPriorityBadgeStyles(ticketDetails.ticket.priority)}>
                          {ticketDetails.ticket.priority}
                        </Badge>
                        <Badge className={getStatusBadgeStyles(ticketDetails.ticket.status)}>
                          {ticketDetails.ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {getCategoryIcon(ticketDetails.ticket.category) && (
                            <span className="mr-1">
                              {React.createElement(getCategoryIcon(ticketDetails.ticket.category), { className: "h-3 w-3" })}
                            </span>
                          )}
                          {ticketDetails.ticket.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ticket #{ticketDetails.ticket.id} • Created on {formatDate(ticketDetails.ticket.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-end">
                      <Button variant="outline" size="sm" className="h-8">
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-grow overflow-auto">
                  <div className="space-y-4 max-h-[500px] overflow-y-auto p-1">
                    {/* Add type annotation for message */}
                    {ticketDetails.messages && ticketDetails.messages.map((message: ApiTicketMessage) => ( 
                      <div 
                        key={message.id} 
                        className={`p-3 rounded-lg ${
                          message.senderType === 'admin' 
                            ? 'bg-blue-50 border border-blue-100 ml-4' 
                            : message.senderType === 'system'
                              ? 'bg-gray-50 border border-gray-100 text-gray-500 mx-8 text-center text-xs'
                              : 'bg-gray-100 border border-gray-200 mr-4'
                        }`}
                      >
                        <div className={`flex justify-between items-center mb-1 ${message.senderType === 'system' ? 'hidden' : ''}`}>
                          <span className="font-medium text-sm">
                            {message.senderType === 'admin' ? 'Support Agent' : 'You'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(message.createdAt)}
                          </span>
                        </div>
                        <p className={`whitespace-pre-wrap text-sm ${message.senderType === 'system' ? 'italic' : ''}`}>{message.content}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                
                {ticketDetails.ticket && ticketDetails.ticket.status !== 'closed' && (
                  <CardFooter className="border-t pt-4">
                    <div className="flex w-full space-x-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-grow"
                        rows={3}
                      />
                      <Button 
                        onClick={submitMessage} 
                        disabled={addMessageMutation.isPending || !newMessage.trim()}
                        className="self-end"
                      >
                         {addMessageMutation.isPending ? <Spinner size="sm" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            ) : (
               <Card className="h-full flex flex-col justify-center items-center p-12">
                 <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
                 <h3 className="text-lg font-medium text-red-600">Error Loading Ticket</h3>
                 <p className="text-sm text-gray-500">Could not load details for the selected ticket.</p>
               </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}