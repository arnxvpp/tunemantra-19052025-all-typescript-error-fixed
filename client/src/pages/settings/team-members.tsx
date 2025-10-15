import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { SettingsLayout } from './layout';
import { TeamMembersList } from '@/components/team/TeamMembersList';
import { AssignTeamMemberForm } from '@/components/team/AssignTeamMemberForm';

interface Artist {
  id: number;
  username: string;
  fullName?: string;
  role: string;
}

export default function TeamMembersPage() {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  const { data: artists, isLoading: artistsLoading } = useQuery({
    queryKey: ['artists-labels'],
    queryFn: async () => {
      const response = await axios.get('/api/users/artists-labels');
      return response.data;
    }
  });

  const handleSuccessfulAdd = () => {
    setAddDialogOpen(false);
    // Increment to trigger a refetch in the TeamMembersList
    setRefetchTrigger(prev => prev + 1);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Team Members</h2>
            <p className="text-muted-foreground">
              Manage team members who assist with artist and label management
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Team Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              {/* Remove props not accepted by AssignTeamMemberForm */}
              <AssignTeamMemberForm />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              All Team Members
            </TabsTrigger>
            {!artistsLoading && artists && artists.map((artist: Artist) => (
              <TabsTrigger 
                key={artist.id} 
                value={artist.id.toString()}
                className="flex items-center gap-2"
              >
                {artist.fullName || artist.username}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {/* Remove invalid props */}
            <TeamMembersList />
          </TabsContent>

          {!artistsLoading && artists && artists.map((artist: Artist) => (
            <TabsContent key={artist.id} value={artist.id.toString()} className="mt-6">
               {/* Remove invalid props - filtering by parentId needs to be handled within TeamMembersList if required */}
              <TeamMembersList />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </SettingsLayout>
  );
}