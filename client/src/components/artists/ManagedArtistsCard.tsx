import { useState } from "react";
import { PlusCircle, Pencil, Trash2, AlertCircle } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "@/lib/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useFeatureAccess } from "@/hooks/use-feature-access";
import { useAuth } from "@/hooks/use-auth";

// Artist schema
const artistSchema = z.object({
  name: z.string().min(2, { message: "Artist name must be at least 2 characters" }),
  genre: z.string().optional(),
  bio: z.string().optional(),
  imageUrl: z.string().optional(),
});

type Artist = z.infer<typeof artistSchema>;

interface ManagedArtistsCardProps {
  artists?: Artist[];
  onAddArtist?: (artist: Artist) => void;
  onEditArtist?: (index: number, artist: Artist) => void;
  onDeleteArtist?: (index: number) => void;
}

export function ManagedArtistsCard({
  artists = [],
  onAddArtist,
  onEditArtist,
  onDeleteArtist,
}: ManagedArtistsCardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentArtistIndex, setCurrentArtistIndex] = useState<number | null>(null);
  
  const { user } = useAuth();
  const { getUsageLimit, isWithinUsageLimit } = useFeatureAccess();
  
  // Get the maximum number of artists allowed
  const maxArtists = getUsageLimit("maxArtists");
  const remainingArtists = typeof maxArtists === 'number' ? maxArtists - artists.length : undefined;
  const canAddMoreArtists = isWithinUsageLimit("maxArtists", artists.length + 1);

  const form = useForm<Artist>({
    resolver: zodResolver(artistSchema),
    defaultValues: {
      name: "",
      genre: "",
      bio: "",
      imageUrl: "",
    },
  });

  // Handle form submission
  const onSubmit = (data: Artist) => {
    if (currentArtistIndex !== null) {
      onEditArtist?.(currentArtistIndex, data);
      setIsEditDialogOpen(false);
      toast({
        title: "Artist updated",
        description: "The artist has been successfully updated.",
      });
    } else {
      onAddArtist?.(data);
      setIsAddDialogOpen(false);
      toast({
        title: "Artist added",
        description: "The new artist has been added to your account.",
      });
    }
    form.reset();
    setCurrentArtistIndex(null);
  };

  // Open edit dialog
  const handleEditClick = (index: number) => {
    const artist = artists[index];
    form.reset(artist);
    setCurrentArtistIndex(index);
    setIsEditDialogOpen(true);
  };

  // Handle delete
  const handleDeleteClick = (index: number) => {
    if (confirm("Are you sure you want to delete this artist?")) {
      onDeleteArtist?.(index);
      toast({
        title: "Artist deleted",
        description: "The artist has been removed from your account.",
      });
    }
  };

  // Close dialogs
  const handleCloseDialog = () => {
    form.reset();
    setCurrentArtistIndex(null);
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Managed Artists</span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                disabled={!canAddMoreArtists}
                onClick={() => {
                  if (!canAddMoreArtists) {
                    toast({
                      title: "Subscription limit reached",
                      description: "You have reached the maximum number of artists for your subscription tier. Please upgrade to add more artists.",
                      variant: "destructive",
                    });
                    return;
                  }
                  setIsAddDialogOpen(true);
                }}
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add Artist</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Artist</DialogTitle>
                <DialogDescription>
                  Enter details about the artist you want to manage on the platform.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Artist Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Artist Name" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name of the artist as it will appear on distributions.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Primary Genre</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Pop, Rock, Hip-Hop" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Artist Bio</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief artist biography" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }: { field: any }) => (
                      <FormItem>
                        <FormLabel>Profile Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="http://example.com/image.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="secondary" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Artist</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          {remainingArtists !== undefined ? (
            <>
              {remainingArtists === 0 ? (
                <span className="text-amber-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  You have reached your limit of {maxArtists} artists
                </span>
              ) : (
                <span>
                  You can manage {maxArtists} artists with your subscription (using {artists.length} of {maxArtists})
                </span>
              )}
            </>
          ) : (
            <span>Add and manage artists for your releases</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {artists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full border border-dashed p-6">
              <PlusCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">No artists yet</h3>
            <p className="text-sm text-muted-foreground max-w-[22rem]">
              You haven't added any artists to manage. Click "Add Artist" to get started.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-3">
            <div className="space-y-3">
              {artists.map((artist, index) => (
                <div key={index} className="group">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={artist.imageUrl || ""} alt={artist.name} />
                        <AvatarFallback>
                          {artist.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-medium">{artist.name}</h4>
                        <p className="text-xs text-muted-foreground">{artist.genre || "No genre specified"}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(index)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(index)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                  {index < artists.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-sm text-muted-foreground">
          Artists are the performers whose music you manage on the platform
        </p>
      </CardFooter>

      {/* Edit Artist Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Artist</DialogTitle>
            <DialogDescription>
              Update the details for this artist.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Artist Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Artist Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="genre"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Primary Genre</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Pop, Rock, Hip-Hop" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Artist Bio</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief artist biography" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="http://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="secondary" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">Update Artist</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}