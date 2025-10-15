import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, PlusCircle, Users, Info, Music } from "lucide-react";
import { Link } from "wouter";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Artist type definition
interface Artist {
  id: number;
  name: string;
  genre?: string;
  imageUrl?: string;
  releases?: number;
}

// Demo artists for testing - would be replaced with API data
const DEMO_ARTISTS: Artist[] = [
  {
    id: 1,
    name: "Melodic Skyline",
    genre: "Indie Pop",
    releases: 4,
  },
  {
    id: 2,
    name: "Urban Echoes",
    genre: "Hip Hop",
    releases: 2,
  }
];

export default function ManagedArtistsSummary() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const { getUsageLimit, canAccess } = useFeatureAccess();
  
  // Get artist limit from subscription
  const maxArtists = getUsageLimit("maxArtists");
  const artistsLimit = typeof maxArtists === 'number' ? maxArtists : 1;
  
  // Calculate progress percentage
  const progressPercentage = artistsLimit > 0 
    ? Math.min(Math.round((artists.length / artistsLimit) * 100), 100) 
    : 0;
  
  // In a real implementation, this would fetch from an API
  useEffect(() => {
    // This would be replaced with API data
    setArtists(DEMO_ARTISTS);
  }, []);
  
  // Fix feature access check to use a valid feature type
  if (!canAccess("distribution")) {
    return null;
  }
  
  return (
    <Card className="bg-gradient-to-br from-background to-muted/30 border-2">
      <CardHeader>
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-primary" />
            <CardTitle>Managed Artists</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[280px] p-4">
                  <p className="font-medium mb-1">Account vs. Artist Separation</p>
                  <p className="text-sm">Your user account is separate from the artists you manage. Each subscription tier allows managing a specific number of primary artists.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Link href="/settings/managed-artists">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <span>Manage All</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 mt-1 mb-1 text-sm text-muted-foreground">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Subscription Feature
          </Badge>
          <span>
            {artists.length === 0 
              ? "You haven't added any artists yet" 
              : `${artists.length} of ${artistsLimit} artists on your subscription`}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Explanation of artist management */}
        <div className="bg-muted/30 rounded-lg p-3 border border-dashed">
          <h4 className="text-sm font-medium flex items-center gap-1.5 mb-1">
            <Users className="h-4 w-4 text-primary" />
            What are Managed Artists?
          </h4>
          <p className="text-xs text-muted-foreground">
            Managed Artists represent the actual artists whose music you distribute. Your 
            account manages these artists based on your subscription tier. This simplifies 
            metadata entry and ensures consistent artist information across all releases.
          </p>
        </div>
      
        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span>Artist Limit Usage</span>
            <span className="font-medium">{artists.length}/{artistsLimit}</span>
          </div>
          <Progress value={progressPercentage} className={progressPercentage > 80 ? "bg-amber-100" : ""} />
        </div>
        
        {/* Artists list */}
        {artists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center bg-muted/20 rounded-lg border border-dashed">
            <div className="mb-3 rounded-full bg-primary/10 p-3">
              <Users className="h-8 w-8 text-primary/80" />
            </div>
            <h3 className="text-base font-semibold">No artists added yet</h3>
            <p className="text-sm text-muted-foreground max-w-[18rem] mt-1 mb-3">
              Add artists that you manage to better organize your catalog and simplify release creation
            </p>
            <Link href="/settings/managed-artists">
              <Button size="sm" className="mt-1.5">Add Your First Artist</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-1 bg-muted/10 rounded-lg p-2 border">
            {artists.map((artist, index) => (
              <div key={artist.id}>
                <div className="flex items-center justify-between py-2 px-2 hover:bg-muted/20 rounded-md">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {artist.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                      {artist.imageUrl && (
                        <AvatarImage src={artist.imageUrl} alt={artist.name} />
                      )}
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-1.5">
                        {artist.name}
                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                          {artist.releases || 0} releases
                        </Badge>
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {artist.genre || "No genre specified"}
                      </p>
                    </div>
                  </div>
                  <Link href={`/catalog/releases?artist=${artist.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                  </Link>
                </div>
                {index < artists.length - 1 && <Separator className="my-1" />}
              </div>
            ))}
          </div>
        )}
      </CardContent>
      {artists.length > 0 && (
        <CardFooter className="pt-0">
          <Link href="/settings/managed-artists">
            <Button variant="outline" size="sm" className="w-full flex items-center gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Add Another Artist</span>
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}