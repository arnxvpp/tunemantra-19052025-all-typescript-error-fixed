import { useQuery } from "@tanstack/react-query";
import { Track } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { CatalogLayout } from "./layout";

export default function TracksPage() {
  const { data: tracks, isLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  if (isLoading) {
    return (
      <CatalogLayout>
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </CatalogLayout>
    );
  }

  return (
    <CatalogLayout>
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Tracks</h2>
        <div className="grid gap-4">
          {tracks?.map((track) => (
            <div key={track.id} className="p-4 bg-zinc-900/50 rounded-lg border border-white/10">
              <h3 className="text-lg font-medium">{track.title}</h3>
              <p className="text-sm text-white/70">{track.artist}</p>
            </div>
          ))}
        </div>
      </div>
    </CatalogLayout>
  );
}
