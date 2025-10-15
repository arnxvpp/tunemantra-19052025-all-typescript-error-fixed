import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const licenseFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.string().min(1, "License type is required"),
  territory: z.string().min(1, "Territory is required"),
  licensee: z.string().min(1, "Licensee is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  initialFee: z.string().optional(),
  royaltyRate: z.string().optional(),
  description: z.string().optional(),
  terms: z.string().min(1, "Terms are required"),
});

type LicenseFormValues = z.infer<typeof licenseFormSchema>;

interface LicenseFormProps {
  onSubmit: (data: LicenseFormValues) => void;
  onCancel: () => void;
}

export function LicenseForm({ onSubmit, onCancel }: LicenseFormProps) {
  const { toast } = useToast();

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      title: "",
      type: "",
      territory: "",
      licensee: "",
      startDate: "",
      endDate: "",
      initialFee: "",
      royaltyRate: "",
      description: "",
      terms: "",
    },
  });

  const handleSubmit = async (data: LicenseFormValues) => {
    try {
      await onSubmit(data);
      toast({
        title: "Success",
        description: "License created successfully",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create license",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }: { field: any }) => ( // Add basic type for field
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter license title" className="focus:ring-primary" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }: { field: any }) => ( // Add basic type for field
              <FormItem>
                <FormLabel>License Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="focus:ring-primary">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="streaming">Streaming</SelectItem>
                    <SelectItem value="sync">Synchronization</SelectItem>
                    <SelectItem value="mechanical">Mechanical</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="print">Print</SelectItem>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="focus:ring-primary">
                      <SelectValue placeholder="Select territory" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="worldwide">Worldwide</SelectItem>
                    <SelectItem value="na">North America</SelectItem>
                    <SelectItem value="eu">Europe</SelectItem>
                    <SelectItem value="asia">Asia</SelectItem>
                    <SelectItem value="custom">Custom Territory</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="licensee"
          render={({ field }: { field: any }) => ( // Add basic type for field
            <FormItem>
              <FormLabel>Licensee</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter licensee name" className="focus:ring-primary" />
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
                  <Input {...field} type="date" className="focus:ring-primary" />
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
                  <Input {...field} type="date" className="focus:ring-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="initialFee"
            render={({ field }: { field: any }) => ( // Add basic type for field
              <FormItem>
                <FormLabel>Initial Fee</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="0.00" className="focus:ring-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="royaltyRate"
            render={({ field }: { field: any }) => ( // Add basic type for field
              <FormItem>
                <FormLabel>Royalty Rate (%)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="0.00" className="focus:ring-primary" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }: { field: any }) => ( // Add basic type for field
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Enter license description" 
                  className="focus:ring-primary min-h-[100px]" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="terms"
          render={({ field }: { field: any }) => ( // Add basic type for field
            <FormItem>
              <FormLabel>Terms & Conditions</FormLabel>
              <FormControl>
                <Textarea 
                  {...field} 
                  placeholder="Enter license terms" 
                  className="focus:ring-primary min-h-[100px]" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            Create License
          </Button>
        </div>
      </form>
    </Form>
  );
}