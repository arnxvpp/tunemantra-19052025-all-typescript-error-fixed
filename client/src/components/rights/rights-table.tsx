
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function RightsTable() {
  const [rights] = useState([
    {
      id: 1,
      trackTitle: "Summer Vibes",
      artist: "John Doe",
      type: "Master Rights",
      status: "active",
      expiry: "2025-12-31",
    },
    {
      id: 2,
      trackTitle: "Night Drive",
      artist: "Jane Smith",
      type: "Publishing Rights",
      status: "pending",
      expiry: "2024-06-30",
    },
  ]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Track Title</TableHead>
          <TableHead>Artist</TableHead>
          <TableHead>Rights Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Expiry Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rights.map((right) => (
          <TableRow key={right.id}>
            <TableCell>{right.trackTitle}</TableCell>
            <TableCell>{right.artist}</TableCell>
            <TableCell>{right.type}</TableCell>
            <TableCell>
              <Badge variant={right.status === "active" ? "default" : "secondary"}>
                {right.status}
              </Badge>
            </TableCell>
            <TableCell>{right.expiry}</TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                View Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
