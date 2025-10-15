import { useState } from "react";
import { RightsLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Download, Filter, Plus, FileText, Check, X, AlertCircle, ChevronRight, BarChart, Calendar, Info } from "lucide-react"; // Added Calendar and Info
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { LicenseForm } from "@/components/rights/license-form"; // Assuming this exists
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast"; // Added useToast import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Added Select imports
import { Label } from "@/components/ui/label"; // Added Label import

const mockData = [
  {
    id: "PUB-001",
    title: "Summer Beats Collection",
    publisher: "Sonic Publishing Co.",
    territory: "Global",
    startDate: "2024-01-01",
    endDate: "2025-01-01",
    status: "Active",
    revenue: "$45,230"
  },
  // Add more mock data as needed
];

const columns = [
  { field: 'id', header: 'Agreement ID' },
  { field: 'title', header: 'Title' },
  { field: 'publisher', header: 'Publisher' },
  { field: 'territory', header: 'Territory' },
  { field: 'revenue', header: 'Revenue' },
  { 
    field: 'status', 
    header: 'Status',
    body: (rowData: any) => (
      <Badge variant={rowData.status === 'Active' ? 'default' : 'secondary'} // Use default variant
        className={`capitalize font-medium transition-colors duration-200 ${
          rowData.status === 'Active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-yellow-500/20 text-yellow-500'
        }`}
      >
        {rowData.status}
      </Badge>
    )
  },
  { 
    field: 'actions', 
    header: 'Actions',
    body: (rowData: any) => (
      <div className="flex gap-2">
        <Button variant="outline" size="sm">View</Button>
        <Button variant="outline" size="sm">Edit</Button>
      </div>
    )
  }
];

// Define form schema with Zod
const formSchema = z.object({
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  publisher: z.string().min(2, { message: "Publisher name is required" }),
  territory: z.string().default("Global"),
  startDate: z.string().min(1, { message: "Start date is required" }), // Keep as string for input type="date"
  endDate: z.string().optional(), // Keep as string for input type="date"
  description: z.string().optional(),
  royaltyRate: z.string().optional(),
  agreementType: z.enum(["Standard", "Co-Publishing", "Administration", "Sub-Publishing"]).default("Standard")
});

type FormValues = z.infer<typeof formSchema>;

export default function PublishingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Initialize form with React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      publisher: "",
      territory: "Global",
      startDate: "",
      endDate: "",
      description: "",
      royaltyRate: "",
      agreementType: "Standard"
    }
  });

  // Handle form submission
  const onSubmit = (values: FormValues) => {
    // In a real app, we would save this to the database
    console.log("Form submitted:", values);
    
    toast({
      title: "Agreement created",
      description: "The new publishing agreement has been created successfully."
    });
    
    setDialogOpen(false);
    form.reset();
  };

  return (
    <RightsLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Publishing</h1>
            <p className="text-muted-foreground">Manage your publishing agreements</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} /> New Agreement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-background border border-border shadow-md">
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-foreground font-bold">New Publishing Agreement</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Create a new publishing agreement to manage your music publishing rights.
                </DialogDescription>
              </DialogHeader>
              
              <Alert variant="default" className="bg-blue-100 border-blue-300 text-blue-950 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100">
                <Info className="h-4 w-4" />
                <AlertTitle className="font-medium">Publishing Rights</AlertTitle>
                <AlertDescription className="text-sm">
                  Publishing agreements define how royalties are collected and distributed from your compositions.
                </AlertDescription>
              </Alert>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }: { field: any }) => ( // Add basic type
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Agreement Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Summer Hits Collection" 
                            {...field} 
                            className="bg-background text-foreground border-input focus:border-primary"
                          />
                        </FormControl>
                        <FormDescription className="text-muted-foreground text-xs">
                          The title for this publishing agreement
                        </FormDescription>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="publisher"
                    render={({ field }: { field: any }) => ( // Add basic type
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Publisher *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Publishing company name" 
                            {...field} 
                            className="bg-background text-foreground border-input focus:border-primary"
                          />
                        </FormControl>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="agreementType"
                    render={({ field }: { field: any }) => ( // Add basic type
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Agreement Type</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background text-foreground border-input focus:border-primary">
                              <SelectValue placeholder="Select agreement type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border border-input">
                            <SelectItem value="Standard">Standard</SelectItem>
                            <SelectItem value="Co-Publishing">Co-Publishing</SelectItem>
                            <SelectItem value="Administration">Administration</SelectItem>
                            <SelectItem value="Sub-Publishing">Sub-Publishing</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-muted-foreground text-xs">
                          The type of publishing arrangement
                        </FormDescription>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }: { field: any }) => ( // Add basic type
                        <FormItem>
                          <FormLabel className="text-foreground font-medium">Start Date *</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-foreground" />
                              <Input 
                                type="date" 
                                {...field} 
                                className="bg-background text-foreground border-input focus:border-primary"
                              />
                            </div>
                          </FormControl>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }: { field: any }) => ( // Add basic type
                        <FormItem>
                          <FormLabel className="text-foreground font-medium">End Date</FormLabel>
                          <FormControl>
                            <div className="flex items-center">
                              <Calendar className="mr-2 h-4 w-4 text-foreground" />
                              <Input 
                                type="date" 
                                {...field} 
                                className="bg-background text-foreground border-input focus:border-primary"
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-muted-foreground text-xs">
                            Optional end date
                          </FormDescription>
                          <FormMessage className="text-destructive" />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="territory"
                    render={({ field }: { field: any }) => ( // Add basic type
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Territory</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-background text-foreground border-input focus:border-primary">
                              <SelectValue placeholder="Select territory" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-background border border-input">
                            <SelectItem value="Global">Global</SelectItem>
                            <SelectItem value="United States">United States</SelectItem>
                            <SelectItem value="European Union">European Union</SelectItem>
                            <SelectItem value="Asia">Asia</SelectItem>
                            <SelectItem value="Australia">Australia</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="royaltyRate"
                    render={({ field }: { field: any }) => ( // Add basic type
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Royalty Rate</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 50%" 
                            {...field} 
                            className="bg-background text-foreground border-input focus:border-primary"
                          />
                        </FormControl>
                        <FormDescription className="text-muted-foreground text-xs">
                          The percentage of publishing royalties
                        </FormDescription>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }: { field: any }) => ( // Add basic type
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Description</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Brief description" 
                            {...field} 
                            className="bg-background text-foreground border-input focus:border-primary"
                          />
                        </FormControl>
                        <FormDescription className="text-muted-foreground text-xs">
                          Optional notes about this agreement
                        </FormDescription>
                        <FormMessage className="text-destructive" />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter className="border-t pt-4 mt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)} 
                      type="button"
                      className="border-border hover:bg-muted"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Create Agreement
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Agreements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Publishers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Royalties (YTD)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,230</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 items-center mb-4">
          <Input 
            placeholder="Search agreements..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={16} /> Filter
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download size={16} /> Export
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <DataTable data={mockData} columns={columns} />
          </CardContent>
        </Card>
      </div>
    </RightsLayout>
  );
}
