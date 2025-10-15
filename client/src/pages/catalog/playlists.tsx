
import { CatalogLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function PlaylistsPage() {
  const playlists = [
    { name: "Top Hits", trackCount: 50 },
    { name: "New Releases", trackCount: 30 },
    { name: "Trending Now", trackCount: 25 },
    { name: "Mood Boosters", trackCount: 40 },
    { name: "Workout Mix", trackCount: 35 },
    { name: "Chill Vibes", trackCount: 45 }
  ];

  return (
    <CatalogLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Playlists</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <Card key={playlist.name} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">{playlist.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{playlist.trackCount} tracks</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </CatalogLayout>
  );
}
