import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, subMonths } from 'date-fns';
import { apiRequest } from '@/lib/queryClient';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter, // Import TableFooter
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import {
  DollarSign,
  Users,
  ChevronRight,
  Download,
  AlertCircle,
  CheckCircle2,
  PieChart as PieChartIcon,
  FileText,
  Calculator,
  Loader2 // Import Loader2
} from 'lucide-react';

// Types
interface RoyaltySplit {
  id: number;
  trackId: number;
  recipientName: string;
  recipientEmail: string;
  percentage: number;
  royaltyType: string;
  paymentDetails: any | null;
  createdAt: string;
}

interface RoyaltyCalculation {
  totalRoyalties: number;
  royaltiesByTrack: {
    trackId: number;
    title: string;
    totalRevenue: number;
    splits: {
      splitId: number;
      recipientName: string;
      recipientEmail: string;
      percentage: number;
      royaltyType: string;
      amount: number;
    }[];
  }[];
  royaltiesByType: Record<string, number>;
  paymentStatus: string;
  calculationPeriod?: {
    startDate: string;
    endDate: string;
  };
}

interface Track {
  id: number;
  title: string;
  artistName: string;
  releaseId: number;
}

// Form schemas
const royaltySplitSchema = z.object({
  trackId: z.number(),
  recipientName: z.string().min(1, "Recipient name is required"),
  recipientEmail: z.string().email("Invalid email address"),
  percentage: z.number().min(0.01).max(100, "Percentage must be between 0.01 and 100"),
  royaltyType: z.string(),
  paymentDetails: z.any().optional()
});

const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date()
});

// Chart colors
const CHART_COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777'];

const RoyaltyManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);
  const [isAddingSplit, setIsAddingSplit] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: subMonths(new Date(), 3),
    endDate: new Date()
  });

  // Set up form for adding royalty splits
  const form = useForm<z.infer<typeof royaltySplitSchema>>({
    resolver: zodResolver(royaltySplitSchema),
    defaultValues: {
      trackId: 0,
      recipientName: '',
      recipientEmail: '',
      percentage: 0,
      royaltyType: 'performance'
    },
  });

  // Date range form for calculating royalties
  const dateRangeForm = useForm<z.infer<typeof dateRangeSchema>>({
    resolver: zodResolver(dateRangeSchema),
    defaultValues: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    },
  });

  // Queries
  const { data: tracksData, isLoading: tracksLoading } = useQuery({
    queryKey: ['/api/tracks'],
    queryFn: () => apiRequest<{ data: Track[] }>('/api/tracks')
  });

  const { data: royaltyData, isLoading: royaltyLoading, refetch: refetchRoyalties } = useQuery({
    queryKey: ['/api/royalties/calculate', dateRange],
    queryFn: () => apiRequest<{ data: RoyaltyCalculation }>(`/api/royalties/calculate?startDate=${dateRange.startDate.toISOString()}&endDate=${dateRange.endDate.toISOString()}`)
  });

  const { data: splitsData, isLoading: splitsLoading, refetch: refetchSplits } = useQuery({
    queryKey: ['/api/royalties/splits', selectedTrackId],
    queryFn: () => selectedTrackId ? 
      apiRequest<{ data: RoyaltySplit[] }>(`/api/royalties/splits/${selectedTrackId}`) : 
      Promise.resolve({ data: [] }),
    enabled: !!selectedTrackId
  });

  // Mutations
  const createSplitMutation = useMutation({
    mutationFn: (data: z.infer<typeof royaltySplitSchema>) => 
      apiRequest('/api/royalties/splits', { method: 'POST', data }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Royalty split created successfully',
      });
      setIsAddingSplit(false);
      form.reset();
      if (selectedTrackId) {
        queryClient.invalidateQueries({ queryKey: ['/api/royalties/splits', selectedTrackId] });
        refetchSplits();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create royalty split',
        variant: 'destructive'
      });
    }
  });

  const deleteSplitMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/royalties/splits/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Royalty split deleted successfully',
      });
      if (selectedTrackId) {
        queryClient.invalidateQueries({ queryKey: ['/api/royalties/splits', selectedTrackId] });
        refetchSplits();
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete royalty split',
        variant: 'destructive'
      });
    }
  });

  const processPaymentsMutation = useMutation({
    mutationFn: (dates: { startDate: Date; endDate: Date }) => 
      apiRequest('/api/royalties/process-payments', { 
        method: 'POST', 
        data: {
          startDate: dates.startDate.toISOString(),
          endDate: dates.endDate.toISOString()
        }
      }),
    onSuccess: (data: any) => { // Add type for data if known
      toast({
        title: 'Payment Processing',
        description: data.message || 'Royalty payments have been processed successfully',
      });
      setPaymentProcessing(false);
      refetchRoyalties();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process payments',
        variant: 'destructive'
      });
      setPaymentProcessing(false);
    }
  });

  // Event handlers
  const onSplitSubmit = (data: z.infer<typeof royaltySplitSchema>) => {
    createSplitMutation.mutate(data);
  };

  const handleDeleteSplit = (id: number) => {
    if (confirm('Are you sure you want to delete this royalty split?')) {
      deleteSplitMutation.mutate(id);
    }
  };

  const handleTrackSelect = (trackId: number) => {
    setSelectedTrackId(trackId);
    form.setValue('trackId', trackId);
  };

  const handleDateRangeSubmit = (data: z.infer<typeof dateRangeSchema>) => {
    setDateRange({
      startDate: data.startDate,
      endDate: data.endDate
    });
    refetchRoyalties();
  };

  const handleProcessPayments = () => {
    setPaymentProcessing(true);
    processPaymentsMutation.mutate({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  };

  // Prepare chart data
  const royaltyTypeData = royaltyData?.data?.royaltiesByType ? 
    Object.entries(royaltyData.data.royaltiesByType).map(([type, amount], index) => ({
      name: type,
      value: amount,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    })) : [];

  const isRoyaltyDataAvailable = royaltyData?.data && royaltyData.data.totalRoyalties > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Royalty Management</h2>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => setActiveTab('calculate')} variant="outline">
            <Calculator className="mr-2 h-4 w-4" /> Calculate Royalties
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="splits">Royalty Splits</TabsTrigger>
          <TabsTrigger value="calculate">Calculate</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Royalties</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${isRoyaltyDataAvailable ? royaltyData.data.totalRoyalties.toFixed(2) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">
                  For period {format(dateRange.startDate, 'MMM d, yyyy')} - {format(dateRange.endDate, 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                {isRoyaltyDataAvailable && royaltyData.data.paymentStatus === 'ready_for_payment' ? (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">
                  {isRoyaltyDataAvailable ? 
                    royaltyData.data.paymentStatus.replace(/_/g, ' ') : 
                    'No data'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRoyaltyDataAvailable && royaltyData.data.paymentStatus === 'ready_for_payment' ? 
                    'Royalties ready to be processed' : 
                    'No pending royalty payments'
                  }
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isRoyaltyDataAvailable ? 
                    new Set(royaltyData.data.royaltiesByTrack.flatMap(track => 
                      track.splits.map(split => split.recipientName)
                    )).size : 
                    0
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique royalty recipients
                </p>
              </CardContent>
            </Card>
          </div>
          
          {isRoyaltyDataAvailable ? (
            <div className="grid gap-4 mt-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Royalty Distribution by Type</CardTitle>
                  <CardDescription>How your royalties are distributed by type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={royaltyTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {royaltyTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Top Earning Tracks</CardTitle>
                  <CardDescription>Your highest revenue generating tracks</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Track</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Splits</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {royaltyData.data.royaltiesByTrack
                          .sort((a, b) => b.totalRevenue - a.totalRevenue)
                          .slice(0, 5)
                          .map((track) => (
                            <TableRow key={track.trackId}>
                              <TableCell>{track.title}</TableCell>
                              <TableCell className="text-right">${track.totalRevenue.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{track.splits.length}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>No Royalty Data Available</CardTitle>
                <CardDescription>
                  There is no royalty data available for the selected period.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>This could be because:</p>
                <ul className="list-disc pl-6 mt-2">
                  <li>Your music hasn't generated any revenue yet</li>
                  <li>You haven't set up royalty splits for your tracks</li>
                  <li>The selected date range doesn't include any revenue data</li>
                </ul>
                <Button onClick={() => setActiveTab('splits')} className="mt-4">
                  Set Up Royalty Splits
                </Button>
              </CardContent>
            </Card>
          )}
          
          {isRoyaltyDataAvailable && royaltyData.data.paymentStatus === 'ready_for_payment' && (
            <Card className="mt-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="mr-2 h-5 w-5 text-yellow-600" />
                  Pending Royalty Payments
                </CardTitle>
                <CardDescription>
                  You have royalty payments that are ready to be processed.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Total amount: ${royaltyData.data.totalRoyalties.toFixed(2)}</p>
                <p className="mt-2">
                  This will distribute payments to {new Set(royaltyData.data.royaltiesByTrack.flatMap(track => 
                    track.splits.map(split => split.recipientName)
                  )).size} recipients according to their royalty splits.
                </p>
                <Button 
                  onClick={handleProcessPayments} 
                  className="mt-4" 
                  disabled={paymentProcessing}
                >
                  {paymentProcessing ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                  ) : (
                    'Process Payments'
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="splits">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Select Track</CardTitle>
                <CardDescription>Choose a track to manage its royalty splits.</CardDescription>
              </CardHeader>
              <CardContent>
                {tracksLoading ? (
                  <p>Loading tracks...</p>
                ) : tracksData?.data && tracksData.data.length > 0 ? (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {tracksData.data.map((track) => (
                        <Button
                          key={track.id}
                          variant={selectedTrackId === track.id ? 'secondary' : 'ghost'}
                          className="w-full justify-start"
                          onClick={() => handleTrackSelect(track.id)}
                        >
                          {track.title} - {track.artistName}
                        </Button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p>No tracks found.</p>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                {selectedTrackId ? (
                  <div>
                    <CardTitle>
                      Royalty Splits for "{tracksData?.data?.find(t => t.id === selectedTrackId)?.title}"
                    </CardTitle>
                    <CardDescription>Manage how royalties are distributed for this track.</CardDescription>
                  </div>
                ) : (
                  <CardTitle>Select a Track</CardTitle>
                )}
                {selectedTrackId && (
                  <Dialog open={isAddingSplit} onOpenChange={setIsAddingSplit}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="mt-2">Add Split</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Royalty Split</DialogTitle>
                        <DialogDescription>
                          Define a recipient and their percentage share for this track.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSplitSubmit)} className="space-y-4">
                          {/* Form fields for adding a split */}
                          <FormField
                            control={form.control}
                            name="recipientName"
                            render={({ field }: { field: any }) => ( // Add basic type
                              <FormItem>
                                <FormLabel>Recipient Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter recipient's name" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="recipientEmail"
                            render={({ field }: { field: any }) => ( // Add basic type
                              <FormItem>
                                <FormLabel>Recipient Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Enter recipient's email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="percentage"
                            render={({ field }: { field: any }) => ( // Add basic type
                              <FormItem>
                                <FormLabel>Percentage (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.01" placeholder="e.g., 50.00" {...field} 
                                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name="royaltyType"
                            render={({ field }: { field: any }) => ( // Add basic type
                              <FormItem>
                                <FormLabel>Royalty Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select royalty type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="performance">Performance</SelectItem>
                                    <SelectItem value="mechanical">Mechanical</SelectItem>
                                    <SelectItem value="sync">Synchronization</SelectItem>
                                    <SelectItem value="print">Print</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddingSplit(false)}>Cancel</Button>
                            <Button type="submit" disabled={createSplitMutation.isPending}>
                              {createSplitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Add Split
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                {selectedTrackId ? (
                  splitsLoading ? (
                    <p>Loading splits...</p>
                  ) : splitsData?.data && splitsData.data.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recipient</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Percentage</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {splitsData.data.map((split) => (
                          <TableRow key={split.id}>
                            <TableCell>{split.recipientName}</TableCell>
                            <TableCell>{split.recipientEmail}</TableCell>
                            <TableCell>{split.royaltyType}</TableCell>
                            <TableCell className="text-right">{split.percentage.toFixed(2)}%</TableCell>
                            <TableCell className="text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDeleteSplit(split.id)}
                                disabled={deleteSplitMutation.isPending && deleteSplitMutation.variables === split.id}
                              >
                                {deleteSplitMutation.isPending && deleteSplitMutation.variables === split.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  'Delete'
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={3}>Total</TableCell>
                          <TableCell className="text-right">
                            {splitsData.data.reduce((sum, split) => sum + split.percentage, 0).toFixed(2)}%
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  ) : (
                    <p>No royalty splits defined for this track.</p>
                  )
                ) : (
                  <p>Select a track to view and manage its royalty splits.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="calculate">
          <Card>
            <CardHeader>
              <CardTitle>Calculate Royalties</CardTitle>
              <CardDescription>Calculate royalties based on a selected date range.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...dateRangeForm}>
                <form onSubmit={dateRangeForm.handleSubmit(handleDateRangeSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={dateRangeForm.control}
                      name="startDate"
                      render={({ field }: { field: any }) => ( // Add basic type
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            {/* Replace Input with DatePicker if available */}
                            <Input type="date" {...field} 
                              value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={dateRangeForm.control}
                      name="endDate"
                      render={({ field }: { field: any }) => ( // Add basic type
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} 
                              value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                              onChange={(e) => field.onChange(new Date(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={royaltyLoading}>
                    {royaltyLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Recalculate Royalties
                  </Button>
                </form>
              </Form>
              
              {royaltyLoading && <p className="mt-4">Calculating...</p>}
              
              {isRoyaltyDataAvailable && (
                <div className="mt-6 space-y-4">
                  <Separator />
                  <h3 className="text-lg font-semibold">Calculation Results</h3>
                  <p>Total Royalties for Period: ${royaltyData.data.totalRoyalties.toFixed(2)}</p>
                  {/* Display more details from royaltyData if needed */}
                  <Button 
                    onClick={handleProcessPayments} 
                    disabled={paymentProcessing || royaltyData.data.paymentStatus !== 'ready_for_payment'}
                  >
                    {paymentProcessing ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      'Process Payments for this Period'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="statements">
          <Card>
            <CardHeader>
              <CardTitle>Royalty Statements</CardTitle>
              <CardDescription>Download your royalty statements.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-6 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  Statement generation feature coming soon.
                </p>
                <Button className="mt-4" disabled>
                  <Download className="mr-2 h-4 w-4" /> Download Sample
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoyaltyManagement;