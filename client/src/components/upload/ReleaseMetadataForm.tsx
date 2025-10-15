import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReleaseSchema, InsertRelease } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
//import { ContentAnalyzer } from "@/components/ai/ContentAnalyzer"; //Commented out as per instructions

const genres = [
  "Pop", "Rock", "Hip Hop", "R&B", "Jazz", "Classical", "Electronic",
  "Country", "Folk", "Latin", "World", "Alternative", "Metal", "Blues"
];

const languages = [
  "English", "Spanish", "French", "German", "Italian", "Portuguese",
  "Japanese", "Korean", "Chinese", "Hindi", "Arabic", "Russian", "Other"
];

export type ReleaseMetadataFormProps = {
  onSubmit: (data: Partial<InsertRelease>) => Promise<void>;
  isSubmitting?: boolean;
};

export function ReleaseMetadataForm({
  onSubmit,
  isSubmitting = false
}: ReleaseMetadataFormProps) {
  const form = useForm<InsertRelease>({
    resolver: zodResolver(insertReleaseSchema),
    defaultValues: {
      title: "",
      artistName: "",
      labelName: "",
      upc: "",
      genre: "",
      language: "",
      releaseDate: new Date(),
      description: "",
      type: "audio" as const,
      status: "draft" as const
    }
  });

  const handleSubmit = async (data: InsertRelease) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }: { field: any }) => ( // Add basic type
              <FormItem>
                <FormLabel>Release Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter release title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="artistName"
            render={({ field }: { field: any }) => ( // Add basic type
              <FormItem>
                <FormLabel>Artist Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter artist name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="genre"
            render={({ field }: { field: any }) => ( // Add basic type
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select genre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre.toLowerCase()}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="language"
            render={({ field }: { field: any }) => ( // Add basic type
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language} value={language.toLowerCase()}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="releaseDate"
            render={({ field }: { field: any }) => ( // Add basic type
              <FormItem className="flex flex-col">
                <FormLabel>Release Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="labelName"
            render={({ field }: { field: any }) => ( // Add basic type
              <FormItem>
                <FormLabel>Label Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter label name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }: { field: any }) => ( // Add basic type
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter release description"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="upc"
          render={({ field }: { field: any }) => ( // Add basic type
            <FormItem>
              <FormLabel>UPC</FormLabel>
              <FormControl>
                <Input placeholder="Enter UPC (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Temporarily comment out the ContentAnalyzer component */}
        {/* <div className="mt-8 mb-6">
          <ContentAnalyzer
            title={form.watch("title")}
            artistName={form.watch("artistName")}
            type={form.watch("type")}
            onAnalysisComplete={(analysis) => {
              form.setValue("genre", analysis.tags.genres[0]?.toLowerCase() || form.getValues("genre"));
              form.setValue("language", analysis.tags.languages[0]?.toLowerCase() || form.getValues("language"));
              form.setValue("contentTags", analysis.tags);
              form.setValue("aiAnalysis", analysis.analysis);
            }}
          />
        </div> */}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Release'
          )}
        </Button>
      </form>
    </Form>
  );
}