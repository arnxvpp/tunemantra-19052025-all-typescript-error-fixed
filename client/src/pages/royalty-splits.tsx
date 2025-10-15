import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Plus } from "lucide-react";
import type { RevenueShare } from "@shared/schema";

export default function RoyaltySplitsPage() {
  const { data: royaltyShares, isLoading, error } = useQuery<RevenueShare[]>({
    queryKey: ['/api/royalty-shares'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load royalty shares</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Royalty Splits</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Split
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {royaltyShares?.map((share) => (
          <Card key={share.id} className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Release ID: {share.releaseId}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  share.isConfirmed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {share.isConfirmed ? 'Confirmed' : 'Pending'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {/* Use correct property name: splitPercentage */}
                Share: {share.splitPercentage}%
              </p>
              <p className="text-xs text-muted-foreground">
                Created: {new Date(share.createdAt).toLocaleDateString()}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
