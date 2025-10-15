import React, { useState, useEffect } from "react"; // Added useEffect
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/upload/avatar-upload"; // Assuming this component exists
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react"; // Added Loader2 import
import type { User } from '@/types/user'; // Import User type for clarity

// Align role enum with useAuth/schema roles
// Remove clientId and taxInformation as they don't exist on the User type from useAuth
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters").optional().nullable(), // Allow null/optional
  phoneNumber: z.string().optional().nullable(),
  entityName: z.string().optional().nullable(),
  // Role might not be directly editable or part of this form's responsibility
  // role: z.enum(["admin", "label", "artist_manager", "artist", "team_member"]), 
  // Add avatarUrl if it should be part of the form data being submitted
  avatarUrl: z.string().url().optional().nullable(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettings() {
  // Remove updateUser from useAuth destructuring if not provided
  const { user, refreshUser } = useAuth(); 
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    // Provide default structure for nested objects
    // Remove clientId and taxInformation defaults
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
      entityName: user?.entityName || "",
      // role: user?.role && ["admin", "label", "artist_manager", "artist", "team_member"].includes(user.role) 
      //       ? user.role as ProfileFormValues['role'] 
      //       : "artist", 
      avatarUrl: user?.avatarUrl || "",
    },
  });

  // Reset form when user data changes (e.g., after refresh)
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || "",
        email: user.email || "",
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        entityName: user.entityName || "",
        // role: user.role && ["admin", "label", "artist_manager", "artist", "team_member"].includes(user.role) 
        //       ? user.role as ProfileFormValues['role'] 
        //       : "artist",
        avatarUrl: user.avatarUrl || "",
        // Remove clientId and taxInformation
      });
    }
  }, [user, form]);


  if (!user) return null; // Or show a loading/login state

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    console.log("Submitting profile data:", data); // Log data for now
    try {
      // Replace with actual API call to update profile
      // await apiService.user.updateProfile(data); 
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Profile updated (Simulated)",
        description: "Your profile has been updated successfully",
      });
      refreshUser(); // Refresh user data in auth context
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
   const handleAvatarUploadComplete = async (url: string) => {
     setIsSubmitting(true);
     try {
       // Call API to update only the avatar URL
       // await apiService.user.updateProfile({ avatarUrl: url }); 
       await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
       toast({ title: "Avatar updated" });
       refreshUser(); // Refresh user data
     } catch (error) {
        toast({ title: "Avatar update failed", variant: "destructive" });
     } finally {
       setIsSubmitting(false);
     }
   };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profile Settings</h2>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Avatar</CardTitle>
              <CardDescription>
                Your profile picture will be visible to other users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {/* Handle null avatarUrl */}
                  <AvatarImage src={user.avatarUrl || undefined} /> 
                  <AvatarFallback className="text-lg">
                    {getInitials(user.fullName || user.username)}
                  </AvatarFallback>
                </Avatar>
                <AvatarUpload
                  currentAvatarUrl={user.avatarUrl || undefined} // Pass undefined if null
                  onUploadComplete={handleAvatarUploadComplete} 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      {/* Handle null value for input */}
                      <Input {...field} value={field.value ?? ''} /> 
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                       {/* Handle null value for input */}
                      <Input type="tel" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="entityName"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Entity Name</FormLabel>
                    <FormControl>
                       {/* Handle null value for input */}
                      <Input {...field} placeholder="Business or Artist Name" value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Remove Client ID field as it's not on User type */}
              {/* <FormField
                control={form.control}
                name="clientId" 
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Client ID</FormLabel>
                    <FormControl>
                      <Input {...field} disabled value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription>
                      Your unique client identifier
                    </FormDescription>
                  </FormItem>
                )}
              /> */}

              {/* Display Role (read-only) */}
               <FormItem>
                 <FormLabel>Role</FormLabel>
                 <Input value={user.role} disabled />
                 <FormDescription>Your current account role.</FormDescription>
               </FormItem>
              {/* Remove Role FormField as it's not editable here and type mismatch */}
              {/* <FormField
                control={form.control}
                name="role"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value} 
                      disabled // Make role read-only
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="label">Label</SelectItem>
                        <SelectItem value="artist_manager">Artist Manager</SelectItem>
                        <SelectItem value="artist">Artist</SelectItem>
                        <SelectItem value="team_member">Team Member</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </CardContent>
          </Card>

          {/* Remove Tax Information Card as it's not on User type */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Tax Information</CardTitle>
              <CardDescription>
                Required for payment processing and tax reporting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="taxInformation.taxId"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Tax ID / SSN</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxInformation.businessType"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ''} 
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                        <SelectItem value="llc">LLC</SelectItem>
                        <SelectItem value="corporation">Corporation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxInformation.address"
                render={({ field }: { field: any }) => ( 
                  <FormItem>
                    <FormLabel>Business Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Full business address" value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card> */}

          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}