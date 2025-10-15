import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Analytics } from "@shared/schema";

type PlatformData = {
  platform: string;
  streams: number;
};

export function PlatformChart({ data }: { data: Analytics[] }) {
  const platformData: PlatformData[] = data.reduce((acc, curr) => {
    const existing = acc.find(p => p.platform === curr.platform);
    if (existing) {
      existing.streams += curr.streams;
    } else {
      acc.push({ platform: curr.platform, streams: curr.streams });
    }
    return acc;
  }, [] as PlatformData[]);

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Streams by Platform</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={platformData}>
            <XAxis dataKey="platform" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="streams" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
