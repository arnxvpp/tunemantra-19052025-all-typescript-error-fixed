import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PlayCircle, DollarSign, Music2 } from "lucide-react";

type StatsData = {
  totalStreams: number;
  totalRevenue: number;
  totalTracks: number;
};

export function StatsCards({ data }: { data: StatsData }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[
        {
          title: "Total Streams",
          value: data.totalStreams.toLocaleString(),
          description: "Across all platforms",
          icon: PlayCircle,
        },
        {
          title: "Total Revenue",
          value: `$${(data.totalRevenue / 100).toFixed(2)}`,
          description: "All time earnings",
          icon: DollarSign,
        },
        {
          title: "Total Tracks",
          value: data.totalTracks,
          description: "In your catalog",
          icon: Music2,
        },
      ].map(({ title, value, description, icon: Icon }) => (
        <Card key={title} className="group relative overflow-hidden backdrop-blur-sm bg-background/95 border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>

          <CardContent className="relative">
            <div className="text-2xl font-bold tracking-tight group-hover:translate-x-0.5 transition-transform">
              {value}
            </div>
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}