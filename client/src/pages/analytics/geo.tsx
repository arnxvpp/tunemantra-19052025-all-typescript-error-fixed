import { AnalyticsLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Analytics } from "@shared/schema";

export default function GeoPage() {
  const { data: analytics } = useQuery<Analytics[]>({
    queryKey: ["/api/tracks/analytics"],
  });

  return (
    <AnalyticsLayout>
      <div className="space-y-8">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Geographic distribution visualization will be displayed here
            </div>
          </CardContent>
        </Card>
      </div>
    </AnalyticsLayout>
  );
}