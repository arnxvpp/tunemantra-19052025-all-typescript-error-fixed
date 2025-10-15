import { RightsLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RightsTable } from "@/components/rights/rights-table";
import { LicensingForm } from "@/components/rights/licensing-form";

export default function RightsOverviewPage() {
  return (
    <RightsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Rights Management</h1>
          <p className="text-muted-foreground">
            Manage your music rights and licensing
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground/90">123</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Licensed Tracks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground/90">89</div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">12</div>
              <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">3</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-muted/20 border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground/90">Rights Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="rounded-md bg-muted/20 p-4">
                <RightsTable />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 border-border/50">
            <CardHeader>
              <CardTitle className="text-foreground/90">Create License</CardTitle>
            </CardHeader>
            <CardContent>
              <LicensingForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </RightsLayout>
  );
}