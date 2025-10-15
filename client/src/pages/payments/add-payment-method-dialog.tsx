import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
// Import the correct schema name if it differs in shared/schema.ts
import { InsertPaymentMethod, insertPaymentMethodSchema } from "@shared/schema"; 
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Loader2, Building2, CreditCard } from "lucide-react";
import CoreUIModal from "@/components/ui/core-ui-modal";
import { CoreUIButton } from "@/components/ui/core-ui-button";
import { 
  Form as CoreUIForm,
  FormField as CoreUIFormField,
  FormItem as CoreUIFormItem,
  FormLabel as CoreUIFormLabel,
  FormControl as CoreUIFormControl,
  FormMessage as CoreUIFormMessage
} from "@/components/ui/core-ui-form";

interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define a more specific type for details based on usage
type PaymentDetails = {
  bankAccount?: {
    accountHolderName?: string;
    accountNumber?: string;
    routingNumber?: string;
  };
  paypal?: {
    email?: string;
  };
};

// Adjust InsertPaymentMethod if necessary or create a specific form type
type PaymentMethodFormValues = Omit<InsertPaymentMethod, 'details' | 'userId'> & {
  details: PaymentDetails;
};


export default function AddPaymentMethodDialog({
  open,
  onOpenChange,
}: AddPaymentMethodDialogProps) {
  const [type, setType] = useState<"bank_account" | "paypal">("bank_account");
  const { toast } = useToast();

  // Use the specific form type
  const form = useForm<PaymentMethodFormValues>({ 
    resolver: zodResolver(insertPaymentMethodSchema), // Use the imported schema
    defaultValues: {
      type: "bank_account",
      name: "",
      details: { bankAccount: { accountNumber: "", routingNumber: "", accountHolderName: "" } },
    },
  });

  const addMutation = useMutation({
    // Adjust mutation function type if needed
    mutationFn: async (data: PaymentMethodFormValues) => { 
      // Prepare data for API, ensuring 'details' matches expected structure
      const apiData: InsertPaymentMethod = {
          ...data,
          userId: 0, // Replace with actual user ID from auth context
          details: data.type === 'bank_account' 
              ? { bankAccount: data.details.bankAccount } 
              : { paypal: data.details.paypal }
      };
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });
      if (!response.ok) throw new Error("Failed to add payment method");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({
        title: "Payment method added",
        description: "Your new payment method has been added successfully.",
      });
      onOpenChange(false);
      form.reset();
    },
     onError: (error: any) => { // Add onError handler
        toast({
            title: "Error",
            description: error.message || "Could not add payment method.",
            variant: "destructive",
        });
     }
  });

  // Use the specific form type for onSubmit
  const onSubmit = (data: PaymentMethodFormValues) => { 
    addMutation.mutate(data);
  };

  // Define the modal footer with buttons
  const modalFooter = (
    <>
      <CoreUIButton 
        variant="outline-secondary"
        onClick={() => onOpenChange(false)}
      >
        Cancel
      </CoreUIButton>
      <CoreUIButton
        variant="primary"
        onClick={form.handleSubmit(onSubmit)}
        disabled={addMutation.isPending}
        icon={addMutation.isPending ? <Loader2 className="animate-spin" /> : undefined}
      >
        Add Payment Method
      </CoreUIButton>
    </>
  );

  return (
    <CoreUIModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Payment Method"
      description="Enter your payment details below"
      footer={modalFooter}
      size="sm"
    >
      <CoreUIForm {...form}>
        <form className="space-y-4">
          <CoreUIFormField
            control={form.control}
            name="type"
            render={({ field }: { field: any }) => ( // Add basic type
              <CoreUIFormItem>
                <CoreUIFormLabel>Payment Method Type</CoreUIFormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value: "bank_account" | "paypal") => {
                    field.onChange(value);
                    setType(value);
                    // Reset details when type changes
                    form.setValue('details', value === 'bank_account' 
                        ? { bankAccount: { accountHolderName: "", accountNumber: "", routingNumber: "" } } 
                        : { paypal: { email: "" } });
                  }}
                >
                  <CoreUIFormControl>
                    <SelectTrigger className="form-select">
                      <SelectValue placeholder="Select payment method type" />
                    </SelectTrigger>
                  </CoreUIFormControl>
                  <SelectContent>
                    <SelectItem value="bank_account">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        Bank Account
                      </div>
                    </SelectItem>
                    <SelectItem value="paypal">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        PayPal
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <CoreUIFormMessage />
              </CoreUIFormItem>
            )}
          />

          <CoreUIFormField
            control={form.control}
            name="name"
            render={({ field }: { field: any }) => ( // Add basic type
              <CoreUIFormItem>
                <CoreUIFormLabel>Nickname</CoreUIFormLabel>
                <CoreUIFormControl>
                  <Input className="form-control" placeholder="e.g. Primary Bank Account" {...field} />
                </CoreUIFormControl>
                <CoreUIFormMessage />
              </CoreUIFormItem>
            )}
          />

          {type === "bank_account" ? (
            <>
              <CoreUIFormField
                control={form.control}
                name="details.bankAccount.accountHolderName" // Corrected path
                render={({ field }: { field: any }) => ( // Add basic type
                  <CoreUIFormItem>
                    <CoreUIFormLabel>Account Holder Name</CoreUIFormLabel>
                    <CoreUIFormControl>
                      <Input className="form-control" {...field} />
                    </CoreUIFormControl>
                    <CoreUIFormMessage />
                  </CoreUIFormItem>
                )}
              />
              <CoreUIFormField
                control={form.control}
                name="details.bankAccount.accountNumber" // Corrected path
                render={({ field }: { field: any }) => ( // Add basic type
                  <CoreUIFormItem>
                    <CoreUIFormLabel>Account Number</CoreUIFormLabel>
                    <CoreUIFormControl>
                      <Input className="form-control" type="password" {...field} />
                    </CoreUIFormControl>
                    <CoreUIFormMessage />
                  </CoreUIFormItem>
                )}
              />
              <CoreUIFormField
                control={form.control}
                name="details.bankAccount.routingNumber" // Corrected path
                render={({ field }: { field: any }) => ( // Add basic type
                  <CoreUIFormItem>
                    <CoreUIFormLabel>Routing Number</CoreUIFormLabel>
                    <CoreUIFormControl>
                      <Input className="form-control" {...field} />
                    </CoreUIFormControl>
                    <CoreUIFormMessage />
                  </CoreUIFormItem>
                )}
              />
            </>
          ) : (
            <CoreUIFormField
              control={form.control}
              name="details.paypal.email" // Corrected path
              render={({ field }: { field: any }) => ( // Add basic type
                <CoreUIFormItem>
                  <CoreUIFormLabel>PayPal Email</CoreUIFormLabel>
                  <CoreUIFormControl>
                    <Input className="form-control" type="email" {...field} />
                  </CoreUIFormControl>
                  <CoreUIFormMessage />
                </CoreUIFormItem>
              )}
            />
          )}
        </form>
      </CoreUIForm>
    </CoreUIModal>
  );
}
