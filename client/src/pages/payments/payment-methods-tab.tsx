import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PaymentMethod } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash, CreditCard, Building2, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import AddPaymentMethodDialog from "./add-payment-method-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"; // Import Card components
import { Badge } from "@/components/ui/badge"; // Import Badge

export default function PaymentMethodsTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: paymentMethods, isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
    // Add queryFn if needed
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/payment-methods/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete payment method");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      toast({
        title: "Payment method deleted",
        description: "Your payment method has been removed successfully.",
      });
    },
    onError: (error: any) => { // Add type for error
       toast({
        title: "Error deleting method",
        description: error.message || "Could not delete payment method.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      // Use Tailwind for loading state
      <div className="flex items-center justify-center h-[200px]"> 
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    // Use Tailwind classes and ShadCN components
    <div className="space-y-6"> 
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Your Payment Methods</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Add and manage your payment methods for withdrawals
            </CardDescription>
          </div>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </CardHeader>
      </Card>
      
      {!paymentMethods || paymentMethods.length === 0 ? (
        <Card>
          <CardContent className="text-center p-10">
            <div className="flex flex-col items-center">
              <CreditCard size={48} className="text-muted-foreground mb-3" />
              <h4 className="text-xl font-semibold mb-2">No Payment Methods</h4>
              <p className="text-muted-foreground mb-3">
                You haven't added any payment methods yet. Add a payment method to receive payments.
              </p>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods?.map((method) => (
            <Card key={method.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-center space-x-3 pb-4">
                 {method.type === "bank_account" ? (
                   <Building2 className="h-6 w-6 text-primary" />
                 ) : (
                   <CreditCard className="h-6 w-6 text-primary" />
                 )}
                 <div>
                   <CardTitle className="text-base">{method.name}</CardTitle>
                   <CardDescription className="text-xs">
                     {method.type === "bank_account" ? "Bank Account" : "PayPal"}
                   </CardDescription>
                 </div>
              </CardHeader>
              
              <CardContent className="flex-grow">
                {method.type === "bank_account" ? (
                  <div className="flex justify-between items-center text-sm">
                    <p>
                      <span className="text-muted-foreground">Account ending in</span> 
                      <strong className="ml-1">
                        {/* Safely access nested details */}
                        {(method.details as any)?.bankAccount?.accountNumber?.slice(-4) ?? '****'}
                      </strong>
                    </p>
                    {method.isDefault && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-sm">
                    <p>
                      <span className="text-muted-foreground">PayPal Email:</span> 
                      <strong className="ml-1">
                         {(method.details as any)?.paypal?.email ?? 'N/A'}
                      </strong>
                    </p>
                    {method.isDefault && (
                       <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between items-center border-t pt-4">
                <Button 
                  variant="outline"
                  size="sm"
                  disabled={method.isDefault}
                  onClick={() => {
                    // Set as default logic would go here
                    toast({
                      title: "Method set as default",
                      description: "This payment method is now your default method",
                    });
                  }}
                >
                  Set Default
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(method.id)}
                  disabled={deleteMutation.isPending && deleteMutation.variables === method.id}
                >
                  {deleteMutation.isPending && deleteMutation.variables === method.id ? (
                    <Loader2 className="animate-spin h-4 w-4" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AddPaymentMethodDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
      
      {/* Remove invalid <style jsx> block */}
    </div>
  );
}
