import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Plus, AlertCircle, Clock, Check, RefreshCcw, Send, Loader2 } from "lucide-react"; // Added Loader2
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Added Alert import

// Define the form schema for creating a new ticket
const newTicketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  category: z.enum(["technical", "billing", "content", "distribution", "other"]),
  priority: z.enum(["low", "medium", "high", "critical"])
});

type NewTicketFormValues = z.infer<typeof newTicketSchema>;

// Define the type of a Support Ticket
type TicketStatus = "open" | "in_progress" | "closed" | "waiting";
type TicketPriority = "low" | "medium" | "high" | "critical";
type TicketCategory = "technical" | "billing" | "content" | "distribution" | "other";

interface TicketMessage {
  id: number;
  sender: string; // Keep sender for display logic if needed
  senderRole?: "user" | "admin" | "system"; // Use senderRole if available
  senderType?: "user" | "admin" | "system"; // Keep senderType if API uses it
  content: string;
  timestamp: string; // Keep timestamp if API uses it
  createdAt: string; // Keep createdAt if API uses it
  attachments?: { name: string, url: string }[];
  senderId?: number; // Keep senderId if API uses it
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

export default function SupportPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTicket, setActiveTicket] = useState<number | null>(null);
  
  // Define types for API responses
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

  // Define TicketMessage structure based on API response
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
        ];
     },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  // Fetch active ticket details with messages
  const { data: ticketDetails, isLoading: isLoadingDetails } = useQuery<TicketDetailsResponse>({ // Ensure queryFn returns TicketDetailsResponse
    queryKey: ['/api/support/tickets', activeTicket],
     queryFn: async (): Promise<TicketDetailsResponse> => { // Return Promise<TicketDetailsResponse>
        if (!activeTicket) {
           // This should not happen if 'enabled' is working correctly, but handle defensively
           throw new Error("No active ticket selected for fetching details."); 
        }
        // Replace with actual API call
         await new Promise(resolve => setTimeout(resolve, 500));
         // Find the ticket from the list for mock data
         const ticket = tickets.find(t => t.id === activeTicket);
         if (!ticket) {
            throw new Error(`Ticket with ID ${activeTicket} not found.`); // Throw if ticket not found
         }
         return { // Mock data - Ensure structure matches TicketDetailsResponse
             ticket: ticket,
             messages: [
                 { id: 101, content: 'Initial message about the upload issue...', senderType: 'user', createdAt: ticket.createdAt, senderId: 1 },
                 { id: 102, content: 'We are looking into this.', senderType: 'admin', createdAt: ticket.updatedAt, senderId: 99 },
             ]
         };
     },
    enabled: activeTicket !== null, // Query runs only when activeTicket is not null
  });
  
  // Create new ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: NewTicketFormValues) => {
      console.log('Submitting ticket data:', data);
      return await apiRequest<TicketResponse, NewTicketFormValues>('/api/support/tickets', 'POST', data);
    },
    onSuccess: (data) => {
      console.log('Ticket created successfully:', data);
      toast({
        title: "Ticket created",
        description: "Your support ticket has been submitted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets'] });
      form.reset();
      setDialogOpen(false);
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
      return await apiRequest<any, { content: string }>(`/api/support/tickets/${ticketId}/messages`, 'POST', { content: message });
    },
    onSuccess: (data) => {
      console.log('Message sent successfully:', data);
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/support/tickets', activeTicket] });
    },
    onError: (error: any) => { // Add type for error
      toast({
        title: "Error",
        description: error?.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Local state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  
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
    if (!newMessage.trim() || !activeTicket) return;
    
    addMessageMutation.mutate({
      ticketId: activeTicket,
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
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case "critical":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    }
  };
  
  const getStatusIcon = (status: TicketStatus) => {
    switch (status) {
      case "open":
        return <AlertCircle className="h-4 w-4" />;
      case "in_progress":
        return <RefreshCcw className="h-4 w-4" />;
      case "waiting":
        return <Clock className="h-4 w-4" />;
      case "closed":
        return <Check className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };
  
  const getCategoryIcon = (category: TicketCategory) => {
    switch (category) {
      case "technical":
        return "💻";
      case "billing":
        return "💰";
      case "content":
        return "🎵";
      case "distribution":
        return "🌐";
      case "other":
        return "❓";
      default:
        return "❓";
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
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
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Support</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="group relative transition-all duration-300 overflow-hidden bg-primary/90 hover:bg-primary text-primary-foreground">
              <span className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors"></span>
              <Plus className="mr-2 h-4 w-4 animate-pulse-gentle group-hover:scale-110 transition-transform duration-200" />
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
                  render={({ field }: { field: any }) => ( 
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
                  render={({ field }: { field: any }) => ( 
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
                  render={({ field }: { field: any }) => ( 
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
                  render={({ field }: { field: any }) => ( 
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
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className={`w-full relative overflow-hidden transition-all duration-300 ${
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>My Tickets</CardTitle>
              <CardDescription>View and manage your support requests</CardDescription>
            </CardHeader>
            <CardContent>
              {tickets && tickets.length > 0 ? (
                <div className="space-y-2">
                  {tickets && tickets.map((ticket: TicketResponse) => (
                    <div 
                      key={ticket.id} 
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-300 transform ${
                        activeTicket === ticket.id 
                          ? 'bg-gray-100 border-gray-300 shadow-md scale-[1.02] border-l-4 border-l-primary' 
                          : 'hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm hover:scale-[1.01] hover:border-l-2 hover:border-l-primary/50'
                      } animate-fadeIn`}
                      onClick={() => {
                        // Add a small delay for visual feedback before changing the content
                        setTimeout(() => {
                          setActiveTicket(ticket.id);
                        }, 150);
                      }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium truncate">{ticket.subject}</h3>
                        <Badge className={getStatusBadgeStyles(ticket.status)}>
                          {getStatusIcon(ticket.status)}
                          <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 mb-1">
                        {getCategoryIcon(ticket.category)} {ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Updated {formatDate(ticket.updatedAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-500">No tickets yet</h3>
                  <p className="mt-1 text-sm text-gray-400">Create a new ticket to get support</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => setDialogOpen(true)}
                variant="outline" 
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" /> New Ticket
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          {/* Check activeTicket first, then isLoadingDetails, then ticketDetails */}
          {!activeTicket ? (
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
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{ticketDetails.ticket.subject}</CardTitle>
                    <CardDescription>
                      {getCategoryIcon(ticketDetails.ticket.category)} {ticketDetails.ticket.category} • 
                      <Badge className={`ml-2 ${getPriorityBadgeStyles(ticketDetails.ticket.priority)}`}>
                        {ticketDetails.ticket.priority}
                      </Badge>
                    </CardDescription>
                  </div>
                  <Badge className={getStatusBadgeStyles(ticketDetails.ticket.status)}>
                    {getStatusIcon(ticketDetails.ticket.status)}
                    <span className="ml-1">{ticketDetails.ticket.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="flex-grow overflow-auto">
                <div className="space-y-4">
                  {/* Add type annotation for message */}
                  {ticketDetails.messages && ticketDetails.messages.map((message: ApiTicketMessage) => ( 
                    <div 
                      key={message.id} 
                      className={`p-4 rounded-lg transition-all duration-300 animate-fadeIn ${
                        message.senderType === 'admin' 
                          ? 'bg-blue-50 border border-blue-100 hover:bg-blue-100 hover:shadow-sm ml-4 relative admin-message' 
                          : message.senderType === 'system'
                            ? 'bg-gray-50 border border-gray-100 text-gray-500 hover:bg-gray-100 mx-8'
                            : 'bg-gray-100 border border-gray-200 hover:bg-gray-200 hover:shadow-sm mr-4 relative user-message'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">
                          {message.senderType === 'admin' ? 'Support Agent' : 'You'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{message.content}</p>
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
  );
}