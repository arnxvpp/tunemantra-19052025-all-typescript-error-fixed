import React, { useState, useMemo, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form"; // Removed useWatch
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Added CardDescription
// import { DatePicker } from "@/components/ui/date-picker"; // Assuming this component exists and works
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IsrcImportTool } from "./IsrcImportTool"; // Assuming this component exists
import { MultiContributorField } from "./MultiContributorField"; // Assuming this component exists
import { TooltipLabel } from "@/components/ui/tooltip-label"; // Assuming this component exists
import { musicGenres, genreCategories, indianSubgenres as indianSubgenresList, indianSubgenreCategories } from "@/lib/music-genres";
import { CalendarIcon } from "lucide-react"; // Added missing import
import { cn } from "@/lib/utils"; // Added missing import
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Added missing import
import { Calendar } from "@/components/ui/calendar"; // Added missing import
import { format } from 'date-fns'; // Added missing import

// Define industry-standard metadata schema
const metadataSchema = z.object({
  // Basic Release Information
  releaseTitle: z.string().min(1, "Release title is required"),
  version: z.string().optional(),
  releaseType: z.enum(["Album", "Single", "EP", "Compilation", "Remix"]),
  // primaryArtist: z.string().min(1, "Primary artist is required"), // Replaced by array
  primaryArtists: z.array(z.string().min(1, "Artist name is required")).nonempty("At least one primary artist is required"),
  featuringArtists: z.array(z.string()).optional().default([]),
  // composers: z.array(z.string().min(1, "Composer name is required")).nonempty("At least one composer is required"), // Replaced by string
  composer: z.string().min(1, "Composer is required").describe("Separate multiple composers with commas"),
  // arrangers: z.array(z.string()).optional().default([]), // Replaced by string
  arranger: z.string().optional().describe("Separate multiple arrangers with commas"),
  // producers: z.array(z.string()).optional().default([]), // Replaced by string
  producer: z.string().optional().describe("Separate multiple producers with commas"),
  // lyricists: z.array(z.string().min(1, "Lyricist name is required")).nonempty("At least one lyricist is required"), // Replaced by string
  lyricist: z.string().min(1, "Lyricist is required").describe("Separate multiple lyricists with commas"),
  label: z.string().min(1, "Label name is required"),
  catalogNumber: z.string().min(1, "Catalog number is required"),
  upc: z.string()
    .min(12, "UPC must be at least 12 characters")
    .max(13, "UPC must be at most 13 characters")
    .regex(/^\d+$/, "UPC must contain only digits")
    .optional(),
  
  // Rights and Ownership
  publishingRights: z.string().min(1, "Publishing rights holder is required"),
  copyrightYear: z.string()
    .regex(/^\d{4}$/, "Copyright year must be a 4-digit year")
    .min(1, "Copyright year is required"),
  copyrightOwner: z.string().min(1, "Copyright owner is required"),
  masterRightsOwner: z.string().min(1, "Master rights owner is required"),
  
  // Categorization
  primaryGenre: z.string().min(1, "Primary genre is required"),
  indianSubgenre: z.string().optional(),
  secondaryGenre: z.string().optional(),
  tags: z.string().optional(),
  moods: z.string().optional(),
  
  // Release Dates
  originalReleaseDate: z.date({
    required_error: "Original release date is required",
  }),
  digitalReleaseDate: z.date({
    required_error: "Digital release date is required",
  }),
  
  // Parental Advisory
  parentalAdvisory: z.boolean().default(false),
  
  // Marketing and Presentation
  artistBio: z.string().optional(),
  releaseDescription: z.string().optional(),
  marketingStatement: z.string().optional(),
  sellingPoints: z.string().optional(),
  pressQuote: z.string().optional(),
  
  // Territories and Exclusions
  territories: z.enum(["Worldwide", "Select Territories"]),
  territoryExclusions: z.string().optional(),
  
  // Language Information
  originalLanguage: z.string().min(1, "Original language is required"),
  lyricsLanguage: z.string().optional(),
  
  // Additional Identifiers
  ean: z.string().optional(),
  grid: z.string().optional(),
  
  // External Links
  officialArtistWebsite: z.string().url().optional().or(z.literal('')),
  artistSocialMedia: z.string().optional(),
  
  // Additional fields for completeness
  productionYear: z.string().optional(),
  pLine: z.string().optional(),
  cLine: z.string().optional(),
  
  // Legal Verification
  clearanceConfirmation: z.boolean().refine(val => val === true, { message: "Clearance confirmation is required" }),
  licensingConfirmation: z.boolean().refine(val => val === true, { message: "Licensing confirmation is required" }),
  agreementConfirmation: z.boolean().refine(val => val === true, { message: "Agreement confirmation is required" }),
});

type MetadataFormValues = z.infer<typeof metadataSchema>;

// Track-specific schema for track details
const trackSchema = z.object({
  trackNumber: z.string().regex(/^\d+$/, "Track number must be a positive integer"),
  trackTitle: z.string().min(1, "Track title is required"),
  version: z.string().optional(),
  // primaryArtist: z.string().min(1, "Primary artist is required"), // Replaced by array
  primaryArtists: z.array(z.string().min(1, "Artist name is required")).nonempty("At least one primary artist is required"),
  featuringArtists: z.array(z.string()).optional().default([]),
  // producers: z.array(z.string()).optional().default([]), // Replaced by string
  producer: z.string().optional().describe("Separate multiple producers with commas"),
  // composers: z.array(z.string().min(1, "Composer name is required")).nonempty("At least one composer is required"), // Replaced by string
  composer: z.string().min(1, "Composer is required").describe("Separate multiple composers with commas"),
  // lyricists: z.array(z.string().min(1, "Lyricist name is required")).nonempty("At least one lyricist is required"), // Replaced by string
  lyricist: z.string().min(1, "Lyricist is required").describe("Separate multiple lyricists with commas"),
  // arrangers: z.array(z.string()).optional().default([]), // Replaced by string
  arranger: z.string().optional().describe("Separate multiple arrangers with commas"),
  isrc: z.string()
    .regex(/^[A-Z]{2}[A-Z0-9]{3}\d{7}$/, "ISRC must be in the format XX-XXX-YY-NNNNN")
    .optional(),
  duration: z.string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, "Duration must be in the format HH:MM:SS")
    .min(1, "Duration is required"),
  explicitLyrics: z.boolean().default(false),
  languageOfPerformance: z.string().min(1, "Language of performance is required"),
  trackGenre: z.string().min(1, "Track genre is required"),
  bpm: z.string()
    .regex(/^\d+$/, "BPM must be a positive integer")
    .optional(),
  instrumentalOnly: z.boolean().default(false),
  lyricsExcerpt: z.string().optional(),
  originalReleaseDate: z.date().optional(),
  availableSeparately: z.boolean().default(false),
  preOrderOnly: z.boolean().default(false),
  streamingOnly: z.boolean().default(false),
});

type TrackFormValues = z.infer<typeof trackSchema>;

interface MetadataRequirementFormProps {
  onSubmit: (data: MetadataFormValues, tracks: TrackFormValues[]) => Promise<void>;
  existingData?: {
    metadata?: Partial<MetadataFormValues>;
    tracks?: Partial<TrackFormValues>[];
  };
}

// Helper to safely split comma-separated strings into arrays
const splitContributors = (value: string | undefined | null): string[] => {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(s => s.length > 0);
};

export function MetadataRequirementForm({ onSubmit, existingData }: MetadataRequirementFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("release");
  const [tracks, setTracks] = useState<TrackFormValues[]>(existingData?.tracks as TrackFormValues[] || []);
  const [isEditingTrack, setIsEditingTrack] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  
  // Indian subgenre related state
  const [showIndianSubgenres, setShowIndianSubgenres] = useState(false);
  const [indianSubgenres, setIndianSubgenres] = useState<{ value: string; label: string }[]>([]);
  
  // Get user details for pre-filling the form
  const userFullName = user?.fullName || user?.username || "";
  const userLabel = user?.entityName || "";
  const currentYear = new Date().getFullYear().toString();
  
  // Form for release metadata
  const releaseForm = useForm<MetadataFormValues>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      releaseTitle: existingData?.metadata?.releaseTitle || "",
      version: existingData?.metadata?.version || "",
      releaseType: existingData?.metadata?.releaseType || "Album",
      primaryArtists: existingData?.metadata?.primaryArtists || [""], 
      featuringArtists: existingData?.metadata?.featuringArtists || [],
      composer: existingData?.metadata?.composer || "", 
      lyricist: existingData?.metadata?.lyricist || "", 
      arranger: existingData?.metadata?.arranger || "",
      producer: existingData?.metadata?.producer || "",
      label: existingData?.metadata?.label || userLabel, 
      catalogNumber: existingData?.metadata?.catalogNumber || "",
      upc: existingData?.metadata?.upc || "",
      publishingRights: existingData?.metadata?.publishingRights || userLabel || userFullName,
      copyrightYear: existingData?.metadata?.copyrightYear || currentYear,
      copyrightOwner: existingData?.metadata?.copyrightOwner || userLabel || userFullName, 
      masterRightsOwner: existingData?.metadata?.masterRightsOwner || userLabel || userFullName, 
      primaryGenre: existingData?.metadata?.primaryGenre || "",
      indianSubgenre: existingData?.metadata?.indianSubgenre || "",
      secondaryGenre: existingData?.metadata?.secondaryGenre || "",
      tags: existingData?.metadata?.tags || "",
      moods: existingData?.metadata?.moods || "",
      originalReleaseDate: existingData?.metadata?.originalReleaseDate || new Date(),
      digitalReleaseDate: existingData?.metadata?.digitalReleaseDate || new Date(),
      parentalAdvisory: existingData?.metadata?.parentalAdvisory || false,
      artistBio: existingData?.metadata?.artistBio || "",
      releaseDescription: existingData?.metadata?.releaseDescription || "",
      marketingStatement: existingData?.metadata?.marketingStatement || "",
      sellingPoints: existingData?.metadata?.sellingPoints || "",
      pressQuote: existingData?.metadata?.pressQuote || "",
      territories: existingData?.metadata?.territories || "Worldwide",
      territoryExclusions: existingData?.metadata?.territoryExclusions || "",
      originalLanguage: existingData?.metadata?.originalLanguage || "",
      lyricsLanguage: existingData?.metadata?.lyricsLanguage || "",
      ean: existingData?.metadata?.ean || "",
      grid: existingData?.metadata?.grid || "",
      officialArtistWebsite: existingData?.metadata?.officialArtistWebsite || "",
      artistSocialMedia: existingData?.metadata?.artistSocialMedia || "",
      productionYear: existingData?.metadata?.productionYear || currentYear,
      pLine: existingData?.metadata?.pLine || `℗ ${currentYear} ${userLabel || userFullName}`,
      cLine: existingData?.metadata?.cLine || `© ${currentYear} ${userLabel || userFullName}`,
      clearanceConfirmation: existingData?.metadata?.clearanceConfirmation || false,
      licensingConfirmation: existingData?.metadata?.licensingConfirmation || false,
      agreementConfirmation: existingData?.metadata?.agreementConfirmation || false,
    }
  });
  
  // Form for track metadata
  const trackForm = useForm<TrackFormValues>({
    resolver: zodResolver(trackSchema),
    defaultValues: {
      trackNumber: "",
      trackTitle: "",
      version: "",
      primaryArtists: [releaseForm.getValues().primaryArtists?.[0] || ""], // Default to first release artist
      featuringArtists: [],
      producer: "", 
      composer: releaseForm.getValues().composer || "", 
      lyricist: releaseForm.getValues().lyricist || "", 
      arranger: "",
      isrc: "",
      duration: "",
      explicitLyrics: false,
      languageOfPerformance: releaseForm.getValues().originalLanguage || "",
      trackGenre: releaseForm.getValues().primaryGenre || "",
      bpm: "",
      instrumentalOnly: false,
      lyricsExcerpt: "",
      originalReleaseDate: releaseForm.getValues().originalReleaseDate || undefined,
      availableSeparately: false,
      preOrderOnly: false,
      streamingOnly: false,
    }
  });
  
  // Handle release form submission
  const onReleaseSubmit = async (data: MetadataFormValues) => {
    try {
      if (tracks.length === 0) {
        toast({
          title: "No tracks added",
          description: "Please add at least one track before submitting",
          variant: "destructive",
        });
        return;
      }
      
      if (!data.clearanceConfirmation || !data.licensingConfirmation || !data.agreementConfirmation) {
        toast({
          title: "Legal confirmation required",
          description: "You must confirm all legal requirements",
          variant: "destructive",
        });
        return;
      }
      
      await onSubmit(data, tracks);
      
      toast({
        title: "Metadata submitted",
        description: "Your release metadata has been successfully submitted",
      });
    } catch (error) {
      console.error("Error submitting metadata:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your metadata",
        variant: "destructive",
      });
    }
  };
  
  // Handle track form submission
  const onTrackSubmit = (data: TrackFormValues) => {
    if (currentTrackIndex !== null) {
      // Edit existing track
      const updatedTracks = [...tracks];
      updatedTracks[currentTrackIndex] = data;
      setTracks(updatedTracks);
    } else {
      // Add new track
      setTracks([...tracks, data]);
    }
    
    // Reset form and state
    const releasePrimaryArtists = releaseForm.getValues().primaryArtists;
    const releaseComposers = releaseForm.getValues().composer;
    const releaseLyricists = releaseForm.getValues().lyricist;
    
    trackForm.reset({
      trackNumber: (tracks.length + (currentTrackIndex === null ? 1 : 0) + 1).toString(), // Auto-increment track number
      trackTitle: "",
      version: "",
      primaryArtists: releasePrimaryArtists || [""], // Use the release primary artists
      featuringArtists: [],
      composer: releaseComposers || "", // Use the release composers
      lyricist: releaseLyricists || "", // Use the release lyricists
      producer: "",
      arranger: "",
      isrc: "",
      duration: "",
      trackGenre: releaseForm.getValues().primaryGenre || "",
      languageOfPerformance: releaseForm.getValues().originalLanguage || "",
      explicitLyrics: false,
      instrumentalOnly: false,
      lyricsExcerpt: "",
      originalReleaseDate: releaseForm.getValues().originalReleaseDate || undefined,
      availableSeparately: false,
      preOrderOnly: false,
      streamingOnly: false,
    });
    setIsEditingTrack(false);
    setCurrentTrackIndex(null);
    
    toast({
      title: currentTrackIndex !== null ? "Track updated" : "Track added",
      description: currentTrackIndex !== null ? "The track has been updated" : "The track has been added to your release",
    });
    setActiveTab("track"); // Switch back to track list after adding/editing
  };
  
  // Edit a track
  const editTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsEditingTrack(true);
    const trackData = tracks[index];
    trackForm.reset({
      ...trackData,
      // Use correct property names from trackSchema
      primaryArtists: trackData.primaryArtists || [""], 
      featuringArtists: trackData.featuringArtists || [],
      composer: trackData.composer || "",
      lyricist: trackData.lyricist || "",
      producer: trackData.producer || "",
      arranger: trackData.arranger || "",
    });
    setActiveTab("track");
  };
  
  // Remove a track
  const removeTrack = (index: number) => {
    const updatedTracks = [...tracks];
    updatedTracks.splice(index, 1);
    setTracks(updatedTracks);
    
    toast({
      title: "Track removed",
      description: "The track has been removed from your release",
    });
  };
  
  // Add a new track
  const addNewTrack = () => {
    setIsEditingTrack(false);
    setCurrentTrackIndex(null);
    
    // Get data from the release form
    const releasePrimaryArtists = releaseForm.getValues().primaryArtists;
    const releaseComposers = releaseForm.getValues().composer;
    const releaseLyricists = releaseForm.getValues().lyricist;
    const releaseGenre = releaseForm.getValues().primaryGenre;
    const releaseLang = releaseForm.getValues().originalLanguage;
    const releaseDate = releaseForm.getValues().originalReleaseDate;
    
    trackForm.reset({
      trackNumber: (tracks.length + 1).toString(),
      trackTitle: "",
      version: "",
      primaryArtists: releasePrimaryArtists || [""], 
      featuringArtists: [],
      composer: releaseComposers || "", 
      lyricist: releaseLyricists || "", 
      producer: "",
      arranger: "",
      isrc: "",
      duration: "",
      trackGenre: releaseGenre || "",
      languageOfPerformance: releaseLang || "",
      explicitLyrics: false,
      instrumentalOnly: false,
      lyricsExcerpt: "",
      originalReleaseDate: releaseDate || undefined,
      availableSeparately: false,
      preOrderOnly: false,
      streamingOnly: false,
    });
    setActiveTab("track");
  };
  
  // Watch for primary genre changes and show Indian subgenres when relevant
  const primaryGenre = releaseForm.watch("primaryGenre");
  
  useEffect(() => {
    // Use genreCategories.indian from music-genres.ts for consistent categorization
    const indianGenres = genreCategories.indian.map(genre => genre.value);
    
    // Check if the selected genre is an Indian music genre
    if (indianGenres.includes(primaryGenre)) {
      setShowIndianSubgenres(true);
      setIndianSubgenres(indianSubgenresList);
    } else {
      setShowIndianSubgenres(false);
      // Clear the Indian subgenre value if the primary genre is changed to a non-Indian genre
      if (releaseForm.getValues().indianSubgenre) {
        releaseForm.setValue("indianSubgenre", "");
      }
    }
  }, [primaryGenre, releaseForm]);
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="release">Release Information</TabsTrigger>
          <TabsTrigger value="track">Track Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="release" className="space-y-4 py-4">
          <Form {...releaseForm}>
            <form onSubmit={releaseForm.handleSubmit(onReleaseSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Release Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={releaseForm.control}
                      name="releaseTitle"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The official title of your music release">Release Title</TooltipLabel>
                          <FormControl>
                            <Input placeholder="My Amazing Album" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="version"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Version (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Deluxe Edition, Remix, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="releaseType"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The format or type of your music release (Album, Single, etc.)">Release Type</TooltipLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a release type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Album">Album</SelectItem>
                              <SelectItem value="Single">Single</SelectItem>
                              <SelectItem value="EP">EP</SelectItem>
                              <SelectItem value="Compilation">Compilation</SelectItem>
                              <SelectItem value="Remix">Remix</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="primaryArtists" 
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Primary Artist(s)"
                          required={true}
                          value={field.value || [""]} 
                          onChange={(value) => field.onChange(value)}
                          placeholder="Artist Name"
                          description="Main performing artist(s) for the release"
                        />
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="featuringArtists"
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Featuring Artists"
                          required={false}
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Featured Artist Name"
                          description="Artists featured on this release"
                        />
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="label"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The record label releasing this music">Label</TooltipLabel>
                          <FormControl>
                            <Input placeholder="Record Label Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="catalogNumber"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The label's internal catalog number for this release">Catalog Number</TooltipLabel>
                          <FormControl>
                            <Input placeholder="e.g., CAT12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="upc"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel tooltip="Universal Product Code (UPC/EAN/GTIN) for the release (12-13 digits)">UPC/EAN (Optional)</TooltipLabel>
                          <FormControl>
                            <Input placeholder="Enter 12 or 13 digit code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contributors</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={releaseForm.control}
                      name="composer"
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Composer(s)"
                          required={true}
                          value={splitContributors(field.value)} 
                          onChange={(arr) => field.onChange(arr.join(', '))} 
                          placeholder="Composer Name"
                          description="Writer(s) of the music"
                        />
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="lyricist"
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Lyricist(s)"
                          required={true}
                          value={splitContributors(field.value)} 
                          onChange={(arr) => field.onChange(arr.join(', '))} 
                          placeholder="Lyricist Name"
                          description="Writer(s) of the lyrics"
                        />
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="arranger"
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Arranger(s)"
                          required={false}
                          value={splitContributors(field.value)} 
                          onChange={(arr) => field.onChange(arr.join(', '))} 
                          placeholder="Arranger Name"
                          description="Person(s) who arranged the music"
                        />
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="producer"
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Producer(s)"
                          required={false}
                          value={splitContributors(field.value)} 
                          onChange={(arr) => field.onChange(arr.join(', '))} 
                          placeholder="Producer Name"
                          description="Person(s) who produced the recording"
                        />
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rights & Ownership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={releaseForm.control}
                      name="publishingRights"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The entity holding the publishing rights (e.g., Publisher Name)">Publishing Rights Holder (P-Line)</TooltipLabel>
                          <FormControl>
                            <Input placeholder="Publisher Name / Copyright Holder" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={releaseForm.control}
                      name="copyrightYear"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The year the copyright was established (YYYY)">Copyright Year (©)</TooltipLabel>
                          <FormControl>
                            <Input type="number" placeholder="YYYY" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={releaseForm.control}
                      name="copyrightOwner"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The owner of the composition copyright (e.g., Songwriter, Publisher)">Copyright Owner (©)</TooltipLabel>
                          <FormControl>
                            <Input placeholder="Copyright Owner Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={releaseForm.control}
                      name="masterRightsOwner"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The owner of the sound recording copyright (e.g., Artist, Label)">Master Rights Owner (℗)</TooltipLabel>
                          <FormControl>
                            <Input placeholder="Master Recording Owner Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={releaseForm.control}
                      name="pLine"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>P-Line (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder={`℗ ${currentYear} ${userLabel || userFullName}`} {...field} />
                          </FormControl>
                           <FormDescription>Formatted P-Line text (e.g., ℗ 2024 Label Name)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={releaseForm.control}
                      name="cLine"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>C-Line (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder={`© ${currentYear} ${userLabel || userFullName}`} {...field} />
                          </FormControl>
                           <FormDescription>Formatted C-Line text (e.g., © 2024 Publisher Name)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Categorization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={releaseForm.control}
                      name="primaryGenre"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The main genre that best describes the release">Primary Genre</TooltipLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select primary genre" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                              {Object.entries(genreCategories).map(([category, genres]) => (
                                <React.Fragment key={category}>
                                  <SelectItem value={category} disabled className="font-bold">{category.charAt(0).toUpperCase() + category.slice(1)}</SelectItem>
                                  {genres.map((genre) => (
                                    <SelectItem key={genre.value} value={genre.value} className="pl-6">
                                      {genre.label}
                                    </SelectItem>
                                  ))}
                                </React.Fragment>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {showIndianSubgenres && (
                      <div className="col-span-1">
                        <FormField
                          control={releaseForm.control}
                          name="indianSubgenre"
                          render={({ field }: { field: any }) => ( 
                            <FormItem>
                              <FormLabel>Indian Subgenre (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select Indian subgenre" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[300px] overflow-y-auto">
                                  {Object.entries(indianSubgenreCategories).map(([category, subgenres]) => (
                                    <React.Fragment key={category}>
                                      <SelectItem value={category} disabled className="font-bold">{category}</SelectItem>
                                      {subgenres.map((subgenre) => (
                                        <SelectItem key={subgenre.value} value={subgenre.value} className="pl-6">
                                          {subgenre.label}
                                        </SelectItem>
                                      ))}
                                    </React.Fragment>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <FormField
                      control={releaseForm.control}
                      name="secondaryGenre"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Secondary Genre (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select secondary genre" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                              <SelectItem value="">None</SelectItem>
                              {musicGenres.map((genre) => (
                                <SelectItem key={genre.value} value={genre.value}>
                                  {genre.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="tags"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Tags / Keywords (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Comma-separated tags (e.g., chill, upbeat, instrumental)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="moods"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Moods (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Comma-separated moods (e.g., happy, sad, energetic)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={releaseForm.control}
                      name="parentalAdvisory"
                      render={({ field }: { field: any }) => ( 
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Parental Advisory</FormLabel>
                            <FormDescription>
                              Does this release contain explicit content?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Release Dates & Territories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={releaseForm.control}
                      name="originalReleaseDate"
                      render={({ field }: { field: any }) => ( 
                        <FormItem className="flex flex-col">
                          <TooltipLabel required tooltip="The date the release was first made available anywhere">Original Release Date</TooltipLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={releaseForm.control}
                      name="digitalReleaseDate"
                      render={({ field }: { field: any }) => ( 
                        <FormItem className="flex flex-col">
                          <TooltipLabel required tooltip="The date the release should go live on digital platforms">Digital Release Date</TooltipLabel>
                           <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={releaseForm.control}
                      name="territories"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="Where should this release be distributed?">Distribution Territories</TooltipLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select distribution territories" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Worldwide">Worldwide</SelectItem>
                              <SelectItem value="Select Territories">Select Territories</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {releaseForm.watch("territories") === "Select Territories" && (
                      <FormField
                        control={releaseForm.control}
                        name="territoryExclusions"
                        render={({ field }: { field: any }) => ( 
                          <FormItem>
                            <FormLabel>Excluded Territories (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter comma-separated country codes (e.g., US, CA, GB)"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              List countries where this release should NOT be distributed.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Language & Identifiers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={releaseForm.control}
                      name="originalLanguage"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The primary language of the release title and metadata">Metadata Language</TooltipLabel>
                          <FormControl>
                            <Input placeholder="e.g., English, Hindi" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={releaseForm.control}
                      name="lyricsLanguage"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Lyrics Language (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Language of the lyrics, if different" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={releaseForm.control}
                      name="ean"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>EAN (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="European Article Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={releaseForm.control}
                      name="grid"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>GRid (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Global Release Identifier" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={releaseForm.control}
                      name="productionYear"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Production Year (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="YYYY" {...field} />
                          </FormControl>
                          <FormDescription>Year the sound recording was produced</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Marketing & Presentation (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={releaseForm.control}
                      name="artistBio"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Artist Biography</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Brief biography of the primary artist" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={releaseForm.control}
                      name="releaseDescription"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Release Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Description of the release for stores" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={releaseForm.control}
                      name="marketingStatement"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Marketing Statement</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Key marketing points for this release" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={releaseForm.control}
                      name="sellingPoints"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Selling Points</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Unique selling points (bullet points recommended)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={releaseForm.control}
                      name="pressQuote"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Press Quote</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Notable press quote about the artist or release" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={releaseForm.control}
                      name="officialArtistWebsite"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Official Artist Website</FormLabel>
                          <FormControl>
                            <Input type="url" placeholder="https://artistwebsite.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={releaseForm.control}
                      name="artistSocialMedia"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Artist Social Media Links</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Comma-separated links (e.g., Instagram, Twitter)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Legal Confirmation</CardTitle>
                  <CardDescription>Please confirm the following legal requirements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={releaseForm.control}
                    name="clearanceConfirmation"
                    render={({ field }: { field: any }) => ( 
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Sample Clearance</FormLabel>
                          <FormDescription>
                            I confirm that all samples used in this release have been legally cleared.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={releaseForm.control}
                    name="licensingConfirmation"
                    render={({ field }: { field: any }) => ( 
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Licensing</FormLabel>
                          <FormDescription>
                            I confirm that I hold all necessary licenses for the distribution of this content.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={releaseForm.control}
                    name="agreementConfirmation"
                    render={({ field }: { field: any }) => ( 
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Distribution Agreement</FormLabel>
                          <FormDescription>
                            I agree to the terms and conditions of the distribution agreement.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-between">
                 <Button type="button" variant="outline" onClick={() => setActiveTab("track")}>
                  Manage Tracks ({tracks.length})
                </Button>
                <Button type="submit">Submit Release Metadata</Button>
              </div>
            </form>
          </Form>
        </TabsContent>
        
        <TabsContent value="track" className="space-y-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle>{isEditingTrack ? "Edit Track" : "Add New Track"}</CardTitle>
              <CardDescription>
                {isEditingTrack ? "Update the details for this track." : "Add details for a new track in this release."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...trackForm}>
                <form onSubmit={trackForm.handleSubmit(onTrackSubmit)} className="space-y-6">
                  {/* Track Form Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={trackForm.control}
                      name="trackNumber"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The track number within the release">Track Number</TooltipLabel>
                          <FormControl>
                            <Input type="number" placeholder="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trackForm.control}
                      name="trackTitle"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The official title of the track">Track Title</TooltipLabel>
                          <FormControl>
                            <Input placeholder="My Awesome Song" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={trackForm.control}
                      name="version"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>Version (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Radio Edit, Instrumental, etc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trackForm.control}
                      name="primaryArtists"
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Primary Artist(s)"
                          required={true}
                          value={field.value || [""]}
                          onChange={field.onChange}
                          placeholder="Artist Name"
                          description="Main artist(s) for this track"
                        />
                      )}
                    />
                    <FormField
                      control={trackForm.control}
                      name="featuringArtists"
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Featuring Artists"
                          required={false}
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Featured Artist Name"
                          description="Artists featured on this track"
                        />
                      )}
                    />
                     <FormField
                      control={trackForm.control}
                      name="composer"
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Composer(s)"
                          required={true}
                          value={splitContributors(field.value)}
                          onChange={(arr) => field.onChange(arr.join(', '))}
                          placeholder="Composer Name"
                          description="Writer(s) of the music for this track"
                        />
                      )}
                    />
                     <FormField
                      control={trackForm.control}
                      name="lyricist"
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Lyricist(s)"
                          required={true}
                          value={splitContributors(field.value)}
                          onChange={(arr) => field.onChange(arr.join(', '))}
                          placeholder="Lyricist Name"
                          description="Writer(s) of the lyrics for this track"
                        />
                      )}
                    />
                     <FormField
                      control={trackForm.control}
                      name="producer"
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Producer(s)"
                          required={false}
                          value={splitContributors(field.value)}
                          onChange={(arr) => field.onChange(arr.join(', '))}
                          placeholder="Producer Name"
                          description="Producer(s) of this track recording"
                        />
                      )}
                    />
                     <FormField
                      control={trackForm.control}
                      name="arranger"
                      render={({ field }: { field: any }) => ( 
                        <MultiContributorField
                          label="Arranger(s)"
                          required={false}
                          value={splitContributors(field.value)}
                          onChange={(arr) => field.onChange(arr.join(', '))}
                          placeholder="Arranger Name"
                          description="Arranger(s) of the music for this track"
                        />
                      )}
                    />
                    <FormField
                      control={trackForm.control}
                      name="isrc"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel tooltip="International Standard Recording Code (e.g., US-S1Z-99-00001)">ISRC (Optional)</TooltipLabel>
                          <FormControl>
                            <Input placeholder="XX-XXX-YY-NNNNN" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trackForm.control}
                      name="duration"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="Track duration in HH:MM:SS format">Duration</TooltipLabel>
                          <FormControl>
                            <Input placeholder="00:03:30" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trackForm.control}
                      name="trackGenre"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The primary genre of this specific track">Track Genre</TooltipLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select track genre" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                              {musicGenres.map((genre) => (
                                <SelectItem key={genre.value} value={genre.value}>
                                  {genre.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trackForm.control}
                      name="languageOfPerformance"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <TooltipLabel required tooltip="The language used in the track's performance/lyrics">Language of Performance</TooltipLabel>
                          <FormControl>
                            <Input placeholder="e.g., English, Spanish" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trackForm.control}
                      name="bpm"
                      render={({ field }: { field: any }) => ( 
                        <FormItem>
                          <FormLabel>BPM (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="120" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={trackForm.control}
                      name="originalReleaseDate"
                      render={({ field }: { field: any }) => ( 
                        <FormItem className="flex flex-col">
                          <FormLabel>Track Original Release Date (Optional)</FormLabel>
                           <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>If different from the main release date</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Checkboxes */}
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={trackForm.control}
                        name="explicitLyrics"
                        render={({ field }: { field: any }) => ( 
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Explicit Lyrics</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={trackForm.control}
                        name="instrumentalOnly"
                        render={({ field }: { field: any }) => ( 
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Instrumental Only</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={trackForm.control}
                        name="availableSeparately"
                        render={({ field }: { field: any }) => ( 
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Available Separately</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={trackForm.control}
                        name="preOrderOnly"
                        render={({ field }: { field: any }) => ( 
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Pre-Order Only</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                       <FormField
                        control={trackForm.control}
                        name="streamingOnly"
                        render={({ field }: { field: any }) => ( 
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Streaming Only</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={trackForm.control}
                      name="lyricsExcerpt"
                      render={({ field }: { field: any }) => ( 
                        <FormItem className="md:col-span-2">
                          <FormLabel>Lyrics Excerpt (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter a short excerpt of the lyrics" 
                              className="resize-none h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Action Buttons */}
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setActiveTab("release")}>
                      Back to Release Info
                    </Button>
                    <Button type="submit">
                      {isEditingTrack ? "Update Track" : "Add Track"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {tracks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Track List ({tracks.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tracks.map((track, index) => (
                    <div key={index} className="flex justify-between items-center border p-3 rounded-md">
                      <div>
                        <span className="font-medium">{track.trackNumber}. {track.trackTitle}</span>
                        <span className="text-sm text-muted-foreground ml-2">({track.duration})</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => editTrack(index)}>Edit</Button>
                        <Button variant="destructive" size="sm" onClick={() => removeTrack(index)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" onClick={addNewTrack}>Add Another Track</Button>
                </div>
                {/* ISRC Import Tool */}
                <div className="mt-6 p-4 border rounded-md">
                   <h4 className="text-lg font-semibold mb-3">Assign ISRCs</h4>
                    <IsrcImportTool
                      // Map tracks to the structure expected by IsrcImportTool
                      tracks={tracks.map((track, index) => ({
                        id: index, // Use index as the temporary ID
                        trackNumber: track.trackNumber,
                        trackTitle: track.trackTitle,
                        primaryArtist: Array.isArray(track.primaryArtists) ? track.primaryArtists.join(', ') : '',
                        isrc: track.isrc || ''
                        // Add isrcStatus if needed by IsrcImportTool, default to 'pending' maybe?
                        // isrcStatus: 'pending'
                      }))}
                      onAssignIsrc={async (trackId, isrc) => { // trackId here is the index
                        const updatedTracks = [...tracks];
                        if (updatedTracks[trackId]) {
                          updatedTracks[trackId].isrc = isrc;
                          setTracks(updatedTracks);
                          // Update form only if currently editing this track
                          if (currentTrackIndex === trackId) {
                             trackForm.setValue(`isrc`, isrc); 
                          }
                        }
                      }}
                      onBulkAssignIsrc={async (assignments) => {
                        const updatedTracks = [...tracks];
                        assignments.forEach(a => {
                           if (updatedTracks[a.trackId]) { // trackId is index here
                             updatedTracks[a.trackId].isrc = a.isrc;
                           }
                        });
                        setTracks(updatedTracks);
                        toast({ title: "ISRCs assigned", description: `${assignments.length} ISRCs were assigned.` });
                      }}
                    />
                  </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MetadataRequirementForm;