
import { CatalogLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function GenresPage() {
  const genres = [
    { name: "Alternative", count: 25 },
    { name: "Blues", count: 18 },
    { name: "Country", count: 22 },
    { name: "Dance", count: 30 },
    { name: "Funk", count: 15 },
    { name: "Indie", count: 28 },
    { name: "Metal", count: 20 },
    { name: "Soul", count: 16 }
  ];

  return (
    <CatalogLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Music Genres</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {genres.map((genre) => (
            <Card key={genre.name} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">{genre.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{genre.count} tracks</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </CatalogLayout>
  );
}
