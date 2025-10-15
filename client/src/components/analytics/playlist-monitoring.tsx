
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PlaylistMonitoring() {
  const playlists = [
    {
      name: "New Music Friday",
      platform: "Spotify",
      type: "Editorial",
      followers: "3.5M",
      position: 45,
      trend: "up"
    },
    {
      name: "Pop Rising",
      platform: "Apple Music",
      type: "Editorial",
      followers: "2.1M",
      position: 23,
      trend: "down"
    },
    {
      name: "Viral Hits",
      platform: "Spotify",
      type: "Algorithmic",
      followers: "1.8M",
      position: 12,
      trend: "up"
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Playlist Performance</h2>
      {playlists.map((playlist) => (
        <Card key={playlist.name}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-medium">{playlist.name}</CardTitle>
            <Badge variant={playlist.trend === "up" ? "success" : "destructive"}>
              #{playlist.position}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platform:</span>
                <span>{playlist.platform}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span>{playlist.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Followers:</span>
                <span>{playlist.followers}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
