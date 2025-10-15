import { useState, useEffect } from "react";
import { RightsLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Filter, Plus, FileText, Check, X, AlertCircle, ChevronRight, BarChart } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import { LicenseForm } from "@/components/rights/license-form";

export default function LicensesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [location] = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.split('?')[1]);
    if (queryParams.get("action") === "new") {
      setIsAddDialogOpen(true);
    }
  }, [location]);

  function onSubmit(data: any) {
    console.log(data);
    setIsAddDialogOpen(false);
  }

  const mockData = [
    {
      id: "L001",
      title: "Streaming License - Summer Hits",
      type: "Streaming",
      licensee: "Spotify",
      startDate: "2024-01-01",
      endDate: "2025-01-01",
      territory: "Worldwide",
      status: "active",
      revenue: "$12,500",
      lastUpdated: "2024-02-25"
    },
    {
      id: "L002",
      title: "Sync License - Commercial Use",
      type: "Synchronization",
      licensee: "ABC Studios",
      startDate: "2024-02-01",
      endDate: "2024-12-31",
      territory: "North America",
      status: "pending",
      revenue: "$8,000",
      lastUpdated: "2024-02-24"
    }
  ];

  const columns = [
    {
      field: 'id',
      header: 'License ID',
      body: (rowData: any) => (
        <div className="font-medium text-primary hover:text-primary/80 cursor-pointer transition-colors">
          {rowData.id}
        </div>
      )
    },
    {
      field: 'title',
      header: 'Title',
      body: (rowData: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground/90">{rowData.title}</span>
          {rowData.status === 'pending' && (
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      )
    },
    {
      field: 'type',
      header: 'Type',
      body: (rowData: any) => (
        <span className="text-muted-foreground/90">{rowData.type}</span>
      )
    },
    {
      field: 'licensee',
      header: 'Licensee',
      body: (rowData: any) => (
        <span className="text-muted-foreground/90">{rowData.licensee}</span>
      )
    },
    {
      field: 'startDate',
      header: 'Start Date',
      body: (rowData: any) => (
        <span className="text-muted-foreground/90">
          {format(new Date(rowData.startDate), 'MMM dd, yyyy')}
        </span>
      )
    },
    {
      field: 'endDate',
      header: 'End Date',
      body: (rowData: any) => (
        <span className="text-muted-foreground/90">
          {format(new Date(rowData.endDate), 'MMM dd, yyyy')}
        </span>
      )
    },
    {
      field: 'territory',
      header: 'Territory',
      body: (rowData: any) => (
        <span className="text-muted-foreground/90">{rowData.territory}</span>
      )
    },
    {
      field: 'status',
      header: 'Status',
      body: (rowData: any) => (
        <Badge
          variant={rowData.status === 'active' ? 'default' : 'secondary'}
          className={`capitalize font-medium transition-colors duration-200 ${
            rowData.status === 'active' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-yellow-500/20 text-yellow-500'
          }`}
        >
          {rowData.status === 'active' ? (
            <Check className="w-3 h-3 mr-1" />
          ) : (
            <X className="w-3 h-3 mr-1" />
          )}
          {rowData.status}
        </Badge>
      )
    },
    {
      field: 'actions',
      header: 'Actions',
      body: (rowData: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <FileText className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <RightsLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Licenses</h1>
            <p className="text-muted-foreground">
              Manage your music licenses
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
                <Plus className="mr-2 h-4 w-4" />
                New License
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New License</DialogTitle>
              </DialogHeader>
              <LicenseForm 
                onSubmit={onSubmit}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Licenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">24</div>
              <p className="text-xs text-muted-foreground mt-1">+2 this month</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Revenue Generated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">$45,230</div>
              <p className="text-xs text-muted-foreground mt-1">+12.5% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">3</div>
              <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">2</div>
              <p className="text-xs text-muted-foreground mt-1">Within 30 days</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/20 border-border/50">
          <CardContent className="pt-6">
            <Tabs defaultValue="all" className="mb-6">
              <TabsList className="bg-muted/30">
                <TabsTrigger value="all">All Licenses</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="expired">Expired</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-2">
                <Input
                  placeholder="Search licenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-[300px] bg-muted/20 hover:bg-muted/30 focus:ring-primary/30"
                />
                <Button variant="outline" className="hover:bg-primary/10 hover:text-primary transition-colors">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                <Button variant="outline" className="hover:bg-primary/10 hover:text-primary transition-colors">
                  <BarChart className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </div>
              <Button variant="outline" className="hover:bg-primary/10 hover:text-primary transition-colors">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
            <div className="rounded-md bg-muted/20 p-4">
              <DataTable
                data={mockData.filter(item =>
                  item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.licensee.toLowerCase().includes(searchTerm.toLowerCase())
                )}
                columns={columns}
                // Remove className prop, styling should be handled within DataTable or via column definitions
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </RightsLayout>
  );
}