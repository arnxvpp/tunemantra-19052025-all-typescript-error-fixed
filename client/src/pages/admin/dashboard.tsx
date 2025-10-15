import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Clock, Users, Music, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Platform Overview</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-muted/20 border-border/50 hover:border-primary/50 transition-all">
          <CardHeader className="pb-2">
            <CardDescription>Pending Accounts</CardDescription>
            <CardTitle className="text-2xl">24</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-amber-500">
              <Clock className="mr-1 h-4 w-4" /> Awaiting Review
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/20 border-border/50 hover:border-primary/50 transition-all">
          <CardHeader className="pb-2">
            <CardDescription>Open Tickets</CardDescription>
            <CardTitle className="text-2xl">13</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-red-500">
              <AlertTriangle className="mr-1 h-4 w-4" /> 5 High Priority
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/20 border-border/50 hover:border-primary/50 transition-all">
          <CardHeader className="pb-2">
            <CardDescription>Managed Artists</CardDescription>
            <CardTitle className="text-2xl">318</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-blue-500">
              <Music className="mr-1 h-4 w-4" /> 42 New This Month
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/20 border-border/50 hover:border-primary/50 transition-all">
          <CardHeader className="pb-2">
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-2xl">1,254</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-green-500">
              <CheckCircle className="mr-1 h-4 w-4" /> 89 New Today
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Artist Management Overview Card */}
      <Card className="bg-muted/20 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Artist Management</CardTitle>
            <CardDescription>Artist allocation across subscription tiers</CardDescription>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/admin/managed-artists">
              <ArrowUpRight className="mr-1 h-4 w-4" />
              View Details
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <div className="text-xl font-bold">174</div>
              <div className="text-xs text-muted-foreground">Label Admin</div>
              <div className="text-xs text-muted-foreground">(Max 15/account)</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <div className="text-xl font-bold">96</div>
              <div className="text-xs text-muted-foreground">Artist Manager</div>
              <div className="text-xs text-muted-foreground">(Max 5/account)</div>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <div className="text-xl font-bold">48</div>
              <div className="text-xs text-muted-foreground">Artist</div>
              <div className="text-xs text-muted-foreground">(Max 1/account)</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground border-t pt-2">
            <div className="flex justify-between items-center">
              <span>Accounts at artist limit:</span>
              <span className="font-medium">23</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Accounts near limit (90%+):</span>
              <span className="font-medium text-amber-500">42</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-muted/20 border-border/50">
          <CardHeader>
            <CardTitle>Recent Accounts</CardTitle>
            <CardDescription>Newest account registrations</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-left">Label</th>
                    <th className="px-4 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "John Smith", label: "Indie Records", status: "Pending" },
                    { name: "Maria Garcia", label: "Beats Production", status: "Pending" },
                    { name: "Alex Johnson", label: "Future Music", status: "Pending" },
                    { name: "Taylor Williams", label: "Epic Studios", status: "Approved" }
                  ].map((user, index) => (
                    <tr key={index} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2">{user.name}</td>
                      <td className="px-4 py-2">{user.label}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
                          user.status === "Pending" 
                            ? "bg-amber-100 text-amber-700" 
                            : "bg-green-100 text-green-700"
                        }`}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-muted/20 border-border/50">
          <CardHeader>
            <CardTitle>Urgent Tickets</CardTitle>
            <CardDescription>High priority support tickets</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="rounded-md">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left">Subject</th>
                    <th className="px-4 py-2 text-left">From</th>
                    <th className="px-4 py-2 text-left">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { subject: "Payment issue", from: "Ryan Carter", age: "2h" },
                    { subject: "Release delayed", from: "Emma Thompson", age: "5h" },
                    { subject: "Account access", from: "David Wilson", age: "1d" },
                    { subject: "Missing royalties", from: "Sophie Martinez", age: "2d" }
                  ].map((ticket, index) => (
                    <tr key={index} className="border-b hover:bg-muted/30">
                      <td className="px-4 py-2">{ticket.subject}</td>
                      <td className="px-4 py-2">{ticket.from}</td>
                      <td className="px-4 py-2">{ticket.age}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}