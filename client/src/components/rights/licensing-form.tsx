import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const licenseFormSchema = z.object({
  licenseName: z.string().min(1, "License name is required"),
  licenseType: z.enum(["exclusive", "non-exclusive", "mechanical"]),
  territory: z.string().min(1, "Territory is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  terms: z.string().min(1, "Terms are required"),
});

type LicenseFormValues = z.infer<typeof licenseFormSchema>;

export function LicensingForm() {
  const { toast } = useToast();
  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      licenseName: "",
      licenseType: "non-exclusive",
      territory: "",
      startDate: "",
      endDate: "",
      terms: ""
    }
  });

  const onSubmit = async (data: LicenseFormValues) => {
    try {
      const response = await fetch('/api/rights/licenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create license');
      }

      toast({
        title: "Success",
        description: "License has been created successfully",
      });

      form.reset();
    } catch (error) {
      console.error('Failed to create license:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create license. Please try again.",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="licenseName"
          render={({ field }: { field: any }) => ( // Add basic type for field
            <FormItem>
              <FormLabel>License Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter license name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="licenseType"
          render={({ field }: { field: any }) => ( // Add basic type for field
            <FormItem>
              <FormLabel>License Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="exclusive">Exclusive</SelectItem>
                  <SelectItem value="non-exclusive">Non-Exclusive</SelectItem>
                  <SelectItem value="mechanical">Mechanical</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="territory"
          render={({ field }: { field: any }) => ( // Add basic type for field
            <FormItem>
              <FormLabel>Territory</FormLabel>
              <FormControl>
                <Input placeholder="Enter territory (e.g., Worldwide, US, EU)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }: { field: any }) => ( // Add basic type for field
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }: { field: any }) => ( // Add basic type for field
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="terms"
          render={({ field }: { field: any }) => ( // Add basic type for field
            <FormItem>
              <FormLabel>License Terms</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter the terms and conditions of the license"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create License</Button>
      </form>
    </Form>
  );
}