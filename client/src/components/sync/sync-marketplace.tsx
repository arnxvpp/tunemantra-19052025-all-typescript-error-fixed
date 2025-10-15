
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SyncOpportunity {
  id: string;
  title: string;
  type: string;
  budget: string;
  deadline: string;
  status: 'open' | 'closed';
  description: string;
}

export function SyncMarketplace() {
  const opportunities: SyncOpportunity[] = [
    {
      id: '1',
      title: 'TV Commercial Background Music',
      type: 'Commercial',
      budget: '$5,000-$10,000',
      deadline: '2024-03-15',
      status: 'open',
      description: 'Seeking upbeat pop track for national beverage commercial'
    },
    {
      id: '2',
      title: 'Documentary Film Score',
      type: 'Film',
      budget: '$15,000-$25,000',
      deadline: '2024-04-01',
      status: 'open',
      description: 'Nature documentary requiring ambient orchestral pieces'
    },
    {
      id: '3',
      title: 'Mobile Game Soundtrack',
      type: 'Gaming',
      budget: '$8,000-$12,000',
      deadline: '2024-03-30',
      status: 'open',
      description: 'Casual mobile game needs energetic background tracks'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sync Opportunities</h2>
        <Button>Submit Music for Sync</Button>
      </div>

      <div className="grid gap-4">
        {opportunities.map((opportunity) => (
          <Card key={opportunity.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{opportunity.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{opportunity.type}</p>
                </div>
                <Badge variant={opportunity.status === 'open' ? 'default' : 'secondary'}>
                  {opportunity.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>{opportunity.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">{opportunity.budget}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Deadline</p>
                    <p className="font-medium">{opportunity.deadline}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">View Details & Submit</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
