import { useState, useEffect } from "react";
// Removed react-helmet dependency
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MoreHorizontal, 
  Search, 
  Users, 
  Music, 
  AlertTriangle,
  PlusCircle,
  ShieldAlert,
  Trash2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAccounts } from "@/lib/admin-api";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Artist = {
  id: number;
  name: string;
  genre?: string;
  bio?: string;
  image?: string;
  releases: number;
  userId: number;
};

interface UserWithArtists {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  status: string;
  subscription: string;
  artists: Artist[];
  createdAt: string;
}

// Demo data - would be replaced with API data in a real implementation
const DEMO_USERS_WITH_ARTISTS: UserWithArtists[] = [
  {
    id: 1,
    username: "musicpub1",
    email: "john@musicpub.com",
    fullName: "John Publisher",
    role: "label_admin",
    status: "active",
    subscription: "label_admin",
    createdAt: "2024-01-15T09:42:31Z",
    artists: [
      {
        id: 1,
        name: "Melodic Skyline",
        genre: "Indie Pop",
        releases: 12,
        userId: 1
      },
      {
        id: 2,
        name: "Urban Echoes",
        genre: "Hip Hop",
        releases: 8,
        userId: 1
      },
      {
        id: 3,
        name: "Synth Collective",
        genre: "Electronic",
        releases: 5,
        userId: 1
      },
      {
        id: 4,
        name: "Dream Sequence",
        genre: "Ambient",
        releases: 3,
        userId: 1
      },
      {
        id: 5,
        name: "Midnight Blues",
        genre: "Blues",
        releases: 7,
        userId: 1
      }
    ]
  },
  {
    id: 2,
    username: "soloartist",
    email: "jane@example.com",
    fullName: "Jane Smith",
    role: "artist",
    status: "active",
    subscription: "artist",
    createdAt: "2024-02-10T14:21:09Z",
    artists: [
      {
        id: 6,
        name: "Jane Smith",
        genre: "Folk",
        releases: 4,
        userId: 2
      }
    ]
  },
  {
    id: 3,
    username: "artistmgr",
    email: "mike@mgmt.com",
    fullName: "Mike Manager",
    role: "artist_manager",
    status: "active",
    subscription: "artist_manager",
    createdAt: "2024-01-25T11:15:42Z",
    artists: [
      {
        id: 7,
        name: "The Crescendos",
        genre: "Rock",
        releases: 9,
        userId: 3
      },
      {
        id: 8,
        name: "Harmony Heights",
        genre: "Pop",
        releases: 6,
        userId: 3
      }
    ]
  }
];

// Subscription plan limits
const SUBSCRIPTION_LIMITS = {
  free: 1,
  artist: 1,
  artist_manager: 3,
  label_admin: 15
};

export default function ManagedArtistsAdminPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<UserWithArtists[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithArtists | null>(null);
  
  // In a real implementation, this would fetch from the API
  // const { data: usersData, isLoading } = useQuery({
  //   queryKey: ['/api/admin/users-with-artists'],
  //   enabled: true,
  // });
  
  // Simulate loading users with artists
  useEffect(() => {
    // This would be replaced with real API data
    const data = DEMO_USERS_WITH_ARTISTS;
    setFilteredUsers(data);
  }, []);
  
  // Filter users based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(DEMO_USERS_WITH_ARTISTS);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = DEMO_USERS_WITH_ARTISTS.filter(user => 
      user.username.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.fullName && user.fullName.toLowerCase().includes(query)) ||
      user.artists.some(artist => artist.name.toLowerCase().includes(query))
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery]);
  
  // Get subscription limit for a role
  const getArtistLimit = (role: string): number => {
    return SUBSCRIPTION_LIMITS[role as keyof typeof SUBSCRIPTION_LIMITS] || 1;
  };
  
  // Check if user is over their artist limit
  const isOverLimit = (user: UserWithArtists): boolean => {
    const limit = getArtistLimit(user.subscription);
    return user.artists.length > limit;
  };
  
  return (
    <div className="p-6 space-y-6">
      {/* Title would be set via document.title if needed */}
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Managed Artists</h1>
          <p className="text-muted-foreground">
            View and manage artists for all users on the platform
          </p>
        </div>
      </div>
      
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users or artists..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users and their artists */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Users and Their Managed Artists</CardTitle>
            <CardDescription>
              View all users and the artists they manage based on their subscription
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Artists</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback>
                              {user.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span>{user.fullName || user.username}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.subscription.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{user.artists.length}</span>
                          <span className="text-xs text-muted-foreground">
                            of {getArtistLimit(user.subscription)}
                          </span>
                          {isOverLimit(user) && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.status === 'active' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedUser(user)}
                          className="flex items-center gap-1"
                        >
                          <span>View Details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* User details panel */}
        <Card>
          <CardHeader>
            <CardTitle>Artist Details</CardTitle>
            <CardDescription>
              {selectedUser ? `Viewing artists managed by ${selectedUser.fullName || selectedUser.username}` : "Select a user to view their artists"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedUser ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No User Selected</h3>
                <p className="text-sm text-muted-foreground max-w-[250px]">
                  Select a user from the table to view details about the artists they manage
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* User info */}
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback>
                      {selectedUser.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-medium">{selectedUser.fullName || selectedUser.username}</h3>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="capitalize">
                        {selectedUser.role.replace('_', ' ')}
                      </Badge>
                      <Badge
                        variant={selectedUser.status === 'active' ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {selectedUser.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Artist limit indicator */}
                <div className="p-4 border rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Artist Management Limit</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold">
                        {selectedUser.artists.length} / {getArtistLimit(selectedUser.subscription)}
                      </span>
                      <span className="text-sm ml-2">artists</span>
                    </div>
                    {isOverLimit(selectedUser) && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Over Limit</span>
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Artists list */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Managed Artists</h4>
                  {selectedUser.artists.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <Music className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No artists added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedUser.artists.map((artist) => (
                        <div key={artist.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>
                                {artist.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h5 className="font-medium">{artist.name}</h5>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">{artist.genre || "No genre"}</span>
                                <span className="text-xs">•</span>
                                <span className="text-xs text-muted-foreground">{artist.releases} releases</span>
                              </div>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>View Releases</DropdownMenuItem>
                              <DropdownMenuItem>Edit Artist</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Delete Artist
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Management actions */}
                <div className="space-y-2 pt-4">
                  <h4 className="text-sm font-medium mb-2">Management Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="w-full flex items-center gap-1">
                      <PlusCircle className="h-4 w-4" />
                      <span>Add Artist</span>
                    </Button>
                    {isOverLimit(selectedUser) && (
                      <Button variant="outline" size="sm" className="w-full flex items-center gap-1">
                        <ShieldAlert className="h-4 w-4" />
                        <span>Fix Limit Issue</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Artist Distribution Analytics</CardTitle>
          <CardDescription>Overview of artists across subscription tiers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(SUBSCRIPTION_LIMITS).map(([tier, limit]) => {
              const usersInTier = filteredUsers.filter(u => u.subscription === tier);
              const artistCount = usersInTier.reduce((sum, user) => sum + user.artists.length, 0);
              const overLimitCount = usersInTier.filter(user => user.artists.length > limit).length;
              
              return (
                <Card key={tier} className="p-4">
                  <h3 className="font-semibold capitalize mb-2">{tier.replace('_', ' ')} Tier</h3>
                  <div className="text-2xl font-bold mb-1">{usersInTier.length}</div>
                  <p className="text-sm text-muted-foreground mb-3">accounts</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold">{artistCount}</div>
                      <p className="text-sm text-muted-foreground">artists</p>
                    </div>
                    {overLimitCount > 0 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{overLimitCount} over limit</span>
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}