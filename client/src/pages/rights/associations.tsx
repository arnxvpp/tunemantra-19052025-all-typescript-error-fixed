
import { RightsLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

const columns = [
  { field: 'id', header: 'Member ID' },
  { field: 'organization', header: 'Organization' },
  { field: 'memberType', header: 'Member Type' },
  { field: 'joinDate', header: 'Join Date' },
  { field: 'territory', header: 'Territory' },
  { field: 'status', header: 'Status' }
];

const data = [
  { id: 'PRO001', organization: 'ASCAP', memberType: 'Writer/Publisher', joinDate: '2024-01-01', territory: 'US', status: 'Active' },
  { id: 'PRO002', organization: 'BMI', memberType: 'Writer', joinDate: '2024-02-01', territory: 'US', status: 'Active' },
  { id: 'PRO003', organization: 'SOCAN', memberType: 'Publisher', joinDate: '2024-03-01', territory: 'Canada', status: 'Pending' }
];

export default function AssociationsPage() {
  return (
    <RightsLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PRO Associations</h1>
            <p className="text-muted-foreground mt-2">Manage your performing rights organization memberships</p>
          </div>
          <Button><Plus className="mr-2 h-4 w-4" /> Add Membership</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Active Memberships</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Pending Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Territories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6">
            <DataTable data={data} columns={columns} />
          </CardContent>
        </Card>
      </div>
    </RightsLayout>
  );
}
