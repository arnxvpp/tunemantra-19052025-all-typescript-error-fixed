import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SettingsLayout } from "./layout";
// Removed react-helmet dependency
import { queryClient, apiRequest } from "@/lib/queryClient";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { ManagedArtistsCard } from "@/components/artists/ManagedArtistsCard";
import { ArrowRight, InfoIcon } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Link } from "wouter";
import { z } from "zod";

// Artist schema
const artistSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2),
  genre: z.string().optional(),
  bio: z.string().optional(),
  imageUrl: z.string().optional(),
});

type Artist = z.infer<typeof artistSchema>;

// Demo artists for now - would be replaced with API data
const DEMO_ARTISTS: Artist[] = [
  {
    id: 1,
    name: "Melodic Skyline",
    genre: "Indie Pop",
    bio: "Emerging indie pop group with atmospheric soundscapes",
    imageUrl: "/placeholder-artist-1.jpg",
  },
  {
    id: 2,
    name: "Urban Echoes",
    genre: "Hip Hop",
    bio: "Hip hop collective exploring urban themes and experimental beats",
    imageUrl: "/placeholder-artist-2.jpg",
  },
];

export default function ManagedArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const { getUsageLimit, canAccess, getPlanName } = useFeatureAccess();
  
  // In a real implementation, this would fetch from the API
  // const { data: artistsData, isLoading } = useQuery({
  //   queryKey: ['/api/artists/managed'],
  //   queryFn: () => apiRequest('/api/artists/managed'),
  // });
  
  // Simulate loading artists
  useEffect(() => {
    // This would be replaced with real API data
    setArtists(DEMO_ARTISTS);
  }, []);
  
  // This would be a real mutation in the implementation
  const addArtistMutation = useMutation({
    mutationFn: (artist: Artist) => {
      // Simulating API call
      console.log("Adding artist:", artist);
      return Promise.resolve({ ...artist, id: Date.now() });
    },
    onSuccess: (newArtist) => {
      setArtists((prev) => [...prev, newArtist]);
      // queryClient.invalidateQueries({ queryKey: ['/api/artists/managed'] });
    },
    onError: (error) => {
      console.error("Error adding artist:", error);
      toast({
        title: "Failed to add artist",
        description: "There was an error adding the artist. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const editArtistMutation = useMutation({
    mutationFn: ({ index, artist }: { index: number; artist: Artist }) => {
      // Simulating API call
      console.log("Updating artist:", artist);
      return Promise.resolve(artist);
    },
    onSuccess: (updatedArtist, { index }) => {
      setArtists((prev) => {
        const newArtists = [...prev];
        newArtists[index] = updatedArtist;
        return newArtists;
      });
      // queryClient.invalidateQueries({ queryKey: ['/api/artists/managed'] });
    },
    onError: (error) => {
      console.error("Error updating artist:", error);
      toast({
        title: "Failed to update artist",
        description: "There was an error updating the artist. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const deleteArtistMutation = useMutation({
    mutationFn: (index: number) => {
      // Simulating API call
      console.log("Deleting artist at index:", index);
      return Promise.resolve(index);
    },
    onSuccess: (index) => {
      setArtists((prev) => prev.filter((_, i) => i !== index));
      // queryClient.invalidateQueries({ queryKey: ['/api/artists/managed'] });
    },
    onError: (error) => {
      console.error("Error deleting artist:", error);
      toast({
        title: "Failed to delete artist",
        description: "There was an error deleting the artist. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleAddArtist = (artist: Artist) => {
    addArtistMutation.mutate(artist);
  };
  
  const handleEditArtist = (index: number, artist: Artist) => {
    editArtistMutation.mutate({ index, artist });
  };
  
  const handleDeleteArtist = (index: number) => {
    deleteArtistMutation.mutate(index);
  };
  
  return (
    <SettingsLayout>
      {/* Title would be set via document.title if needed */}
      
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Managed Artists</h1>
          <p className="text-muted-foreground">
            Add and manage artists you represent on the platform. Your subscription allows you to manage 
            up to {getUsageLimit("maxArtists")} artists.
          </p>
        </div>
        
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Understanding User Accounts vs. Artists</AlertTitle>
          <AlertDescription>
            Your user account is separate from the artists you manage. You can manage multiple artists based on your 
            subscription tier. When creating releases, you'll be able to select from your managed artists.
          </AlertDescription>
        </Alert>

        {/* Subscription tier info */}
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div>
            <h3 className="text-lg font-medium">Current Plan: {getPlanName()}</h3>
            <p className="text-sm text-muted-foreground">
              You can manage up to {getUsageLimit("maxArtists")} artists with your current subscription.
            </p>
          </div>
          <Link href="/subscription-plans">
            <Button variant="outline" className="flex items-center gap-1">
              <span>Upgrade Plan</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        {/* Main artists management card */}
        <ManagedArtistsCard 
          artists={artists}
          onAddArtist={handleAddArtist}
          onEditArtist={handleEditArtist}
          onDeleteArtist={handleDeleteArtist}
        />
        
        {/* Using artists in releases */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Using Managed Artists in Releases</h2>
          <p className="mb-4">
            When uploading new content, you can select from your managed artists in the "Primary Artist" field. 
            This ensures consistent artist information across all your releases and simplifies the metadata entry process.
          </p>
          <Link href="/upload">
            <Button className="flex items-center gap-1">
              <span>Upload New Content</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>
    </SettingsLayout>
  );
}