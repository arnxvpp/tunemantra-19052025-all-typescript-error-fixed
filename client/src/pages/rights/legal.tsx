import { RightsLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RightsLegalPage() {
  return (
    <RightsLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Legal</h1>
          <p className="text-muted-foreground">
            Manage legal documents and agreements
          </p>
        </div>

        <Card className="bg-muted/20 hover:bg-muted/30 transition-all duration-200 border-border/50">
          <CardHeader>
            <CardTitle className="text-foreground/90">Legal Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground/90">
              Legal document management features coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </RightsLayout>
  );
}