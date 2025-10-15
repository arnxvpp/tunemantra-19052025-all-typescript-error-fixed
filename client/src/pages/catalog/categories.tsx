
import { CatalogLayout } from "./layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

export default function CategoriesPage() {
  const categories = [
    { name: "Pop", count: 45 },
    { name: "Hip Hop", count: 32 },
    { name: "Rock", count: 28 },
    { name: "Electronic", count: 24 },
    { name: "R&B", count: 19 },
    { name: "Jazz", count: 15 },
    { name: "Classical", count: 12 },
    { name: "Folk", count: 8 }
  ];

  return (
    <CatalogLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Music Categories</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Card key={category.name} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{category.count} tracks</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </CatalogLayout>
  );
}
