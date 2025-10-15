import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { RevenueShare } from "@shared/schema";

export default function RoyaltySplitsTab() {
  const [isAddingShare, setIsAddingShare] = useState(false);
  
  const { data: revenueShares, isLoading } = useQuery<RevenueShare[]>({
    queryKey: ["/api/revenue-shares"],
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Royalty Splits</h2>
          <p className="text-muted-foreground">Manage revenue sharing with collaborators</p>
        </div>
        <Dialog open={isAddingShare} onOpenChange={setIsAddingShare}>
          <DialogTrigger asChild>
            <Button>Add Revenue Share</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Revenue Share</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="release">Release</Label>
                <Input id="release" placeholder="Select release" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collaborator">Collaborator</Label>
                <Input id="collaborator" placeholder="Enter collaborator email or username" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="percentage">Share Percentage</Label>
                <Input id="percentage" type="number" min="0" max="100" placeholder="Enter percentage" />
              </div>
              <Button className="w-full">Save Revenue Share</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Revenue Shares</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Release</TableHead>
                <TableHead>Collaborator</TableHead>
                <TableHead>Share %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueShares?.map((share) => (
                <TableRow key={share.id}>
                  <TableCell>{share.releaseId}</TableCell>
                  <TableCell>{share.userId}</TableCell>
                  {/* Use correct property name: splitPercentage */}
                  <TableCell>{share.splitPercentage}%</TableCell>
                  <TableCell>{share.isConfirmed ? "Confirmed" : "Pending"}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
