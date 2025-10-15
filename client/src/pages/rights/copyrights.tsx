import { useState } from "react";
import { RightsLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Download, Filter, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const mockData = [
  {
    id: "CR-001",
    title: "Midnight Dreams",
    type: "Musical Work",
    registrationDate: "2024-01-15",
    territory: "United States",
    status: "Registered"
  },
  // Add more mock data as needed
];

const columns = [
  { 
    field: 'id', 
    header: 'Registration ID',
    body: (rowData: any) => (
      <div className="font-medium text-primary hover:text-primary/80 cursor-pointer transition-colors">
        {rowData.id}
      </div>
    )
  },
  { 
    field: 'title', 
    header: 'Work Title',
    body: (rowData: any) => (
      <span className="text-foreground/90">{rowData.title}</span>
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
    field: 'registrationDate', 
    header: 'Registration Date',
    body: (rowData: any) => (
      <span className="text-muted-foreground/90">{rowData.registrationDate}</span>
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
      <Badge variant={rowData.status === 'Registered' ? 'default' : 'secondary'}
        className={`capitalize font-medium transition-colors duration-200 ${
          rowData.status === 'Registered' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-yellow-500/20 text-yellow-500'
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
        <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:text-primary transition-colors">
          View
        </Button>
      </div>
    )
  }
];

export default function CopyrightsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <RightsLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Copyrights</h1>
            <p className="text-muted-foreground">Manage your copyright registrations</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
            <Plus size={16} /> Register New Work
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground/90">156</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Registration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">12</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Territories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground/90">24</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Protected Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">144</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 items-center mb-4">
          <Input 
            placeholder="Search copyrights..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm bg-muted/20 hover:bg-muted/30 focus:ring-primary/30"
          />
          <Button variant="outline" className="hover:bg-primary/10 hover:text-primary transition-colors">
            <Filter size={16} /> Filter
          </Button>
          <Button variant="outline" className="hover:bg-primary/10 hover:text-primary transition-colors">
            <Download size={16} /> Export
          </Button>
        </div>

        <Card className="bg-muted/20 border-border/50">
          <CardContent className="pt-6">
            <div className="rounded-md bg-muted/20 p-4">
              <DataTable 
                data={mockData.filter(item =>
                  item.title.toLowerCase().includes(searchTerm.toLowerCase())
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