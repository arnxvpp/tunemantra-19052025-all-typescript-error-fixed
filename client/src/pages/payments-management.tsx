import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, Plus, Wallet, CreditCard, DollarSign, Download } from "lucide-react";
import type { PaymentMethod, Withdrawal } from "@shared/schema";
import PaymentMethodsTab from "./payments/payment-methods-tab"; // Assuming this component exists
import { Button } from "@/components/ui/button"; // Assuming Button exists
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Assuming Alert exists
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Import Tabs components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Import Card components

// Define type for balance data
interface BalanceData {
  available: number;
  pending: number;
}

export default function PaymentsManagementPage() {
  const [activeTab, setActiveTab] = useState<"payment-methods" | "withdrawals" | "royalty-splits">("payment-methods");
  
  const { data: paymentMethods, isLoading: loadingMethods } = useQuery<PaymentMethod[]>({
    queryKey: ['/api/payment-methods'],
    // Add queryFn if needed
  });

  const { data: withdrawals, isLoading: loadingWithdrawals } = useQuery<Withdrawal[]>({
    queryKey: ['/api/withdrawals'],
     // Add queryFn if needed
  });

  // Add type annotation for balance query
  const { data: balance, isLoading: loadingBalance } = useQuery<BalanceData>({ 
    queryKey: ['/api/balance'],
     // Add queryFn if needed
     // Example queryFn:
     // queryFn: async () => {
     //   const res = await fetch('/api/balance');
     //   if (!res.ok) throw new Error('Failed to fetch balance');
     //   return res.json();
     // }
  });

  if (loadingMethods || loadingWithdrawals || loadingBalance) {
    return (
      // Use Tailwind for loading state for consistency
      <div className="flex items-center justify-center h-screen"> 
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    // Use Tailwind classes instead of custom c-* classes
    <div className="p-6 space-y-6"> 
      <Card className="mb-4"> {/* Use Card component */}
        <CardHeader className="flex items-center justify-between border-b"> {/* Use CardHeader */}
          <div>
            <CardTitle className="text-lg font-semibold mb-0">Payments & Revenue</CardTitle> {/* Use CardTitle */}
            <CardDescription className="text-sm text-muted-foreground mt-1"> {/* Use CardDescription */}
              Manage your payment methods, withdrawals, and revenue sharing
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="col-span-1">
          <Card className="h-full"> {/* Use Card */}
            <CardContent className="p-4 flex items-center"> {/* Use CardContent */}
              <div className="p-3 mr-3 bg-primary/10 rounded-full">
                <DollarSign className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-0">Available Balance</p>
                <h3 className="text-xl font-bold mb-0">
                  ${balance?.available?.toFixed(2) ?? "0.00"} 
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="h-full"> {/* Use Card */}
            <CardContent className="p-4 flex items-center"> {/* Use CardContent */}
              <div className="p-3 mr-3 bg-yellow-100 rounded-full">
                <Wallet className="text-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-0">Pending Balance</p>
                <h3 className="text-xl font-bold mb-0">
                  ${balance?.pending?.toFixed(2) ?? "0.00"}
                </h3>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="h-full"> {/* Use Card */}
            <CardContent className="p-4 flex items-center justify-between"> {/* Use CardContent */}
              <div className="flex items-center">
                <div className="p-3 mr-3 bg-green-100 rounded-full">
                  <Download className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-muted-foreground text-sm mb-0">Last Withdrawal</p>
                  <h3 className="text-xl font-bold mb-0">
                    {/* Convert amount to number before toFixed */}
                    ${parseFloat(withdrawals?.[0]?.amount || '0').toFixed(2) ?? "0.00"} 
                  </h3>
                </div>
              </div>
              <div>
                 {/* Use optional chaining and default value */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  withdrawals?.[0]?.status === 'completed' ? 'bg-green-100 text-green-800' :
                  withdrawals?.[0]?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  withdrawals?.[0]?.status === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {withdrawals?.[0]?.status ? (withdrawals[0].status.charAt(0).toUpperCase() + withdrawals[0].status.slice(1)) : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mb-4"> {/* Use Card */}
        <CardHeader className="p-0 border-b"> {/* Use CardHeader */}
          {/* Use ShadCN Tabs component */}
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as any)} className="w-full">
             <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="payment-methods">
                   <CreditCard className="mr-2 h-4 w-4" /> Payment Methods
                </TabsTrigger>
                <TabsTrigger value="withdrawals">
                   <Wallet className="mr-2 h-4 w-4" /> Withdrawals
                </TabsTrigger>
                <TabsTrigger value="royalty-splits">
                   <DollarSign className="mr-2 h-4 w-4" /> Royalty Splits
                </TabsTrigger>
             </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="p-6"> {/* Use CardContent */}
           {/* Payment Methods Tab */}
           {activeTab === "payment-methods" && (
             <PaymentMethodsTab />
           )}

           {/* Withdrawals Tab */}
           {activeTab === "withdrawals" && (
             <div className="c-withdrawals-tab space-y-4">
               <div className="flex justify-between items-center">
                 <h5 className="text-lg font-semibold mb-0">Withdrawal History</h5>
                 <Button>
                   <Plus className="mr-2 h-4 w-4" />
                   Request Withdrawal
                 </Button>
               </div>

               {!withdrawals || withdrawals.length === 0 ? (
                 <Card>
                   <CardContent className="text-center p-10">
                     <div className="flex flex-col items-center">
                       <Wallet size={48} className="text-muted-foreground mb-3" />
                       <h4 className="text-xl font-semibold mb-2">No Withdrawals</h4>
                       <p className="text-muted-foreground mb-3">
                         You haven't made any withdrawals yet. Request a withdrawal to receive your earnings.
                       </p>
                       <Button>
                         <Plus className="mr-2 h-4 w-4" />
                         Request Withdrawal
                       </Button>
                     </div>
                   </CardContent>
                 </Card>
               ) : (
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                       <tr>
                         <th scope="col" className="px-6 py-3">ID</th>
                         <th scope="col" className="px-6 py-3">Date</th>
                         <th scope="col" className="px-6 py-3">Amount</th>
                         <th scope="col" className="px-6 py-3">Payment Method</th>
                         <th scope="col" className="px-6 py-3">Status</th>
                         <th scope="col" className="px-6 py-3">Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                       {withdrawals?.map((withdrawal) => (
                         <tr key={withdrawal.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                           <td className="px-6 py-4">#{withdrawal.id}</td>
                           <td className="px-6 py-4">{new Date(withdrawal.createdAt).toLocaleDateString()}</td>
                           {/* Convert amount to number before toFixed */}
                           <td className="px-6 py-4">${parseFloat(withdrawal.amount || '0').toFixed(2)} {withdrawal.currency}</td> 
                           <td className="px-6 py-4">
                             {/* Assuming paymentMethodName exists or needs fetching */}
                             {(withdrawal as any).paymentMethodName || "Default Method"} 
                           </td>
                           <td className="px-6 py-4">
                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                               withdrawal.status === 'completed' ? 'bg-green-100 text-green-800' :
                               withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                               withdrawal.status === 'failed' ? 'bg-red-100 text-red-800' :
                               'bg-gray-100 text-gray-800'
                             }`}>
                               {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                             </span>
                           </td>
                           <td className="px-6 py-4">
                             <Button variant="outline" size="sm">
                               Details
                             </Button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               )}
             </div>
           )}

           {/* Royalty Splits Tab */}
           {activeTab === "royalty-splits" && (
             <div className="c-royalty-splits-tab space-y-4">
               <div className="flex justify-between items-center">
                 <h5 className="text-lg font-semibold mb-0">Revenue Sharing Profiles</h5>
                 <Button>
                   <Plus className="mr-2 h-4 w-4" />
                   Create Split Profile
                 </Button>
               </div>
               
               <Card>
                 <CardContent className="text-center p-10">
                   <div className="flex flex-col items-center">
                     <DollarSign size={48} className="text-muted-foreground mb-3" />
                     <h4 className="text-xl font-semibold mb-2">No Revenue Splits</h4>
                     <p className="text-muted-foreground mb-3">
                       You haven't created any revenue sharing profiles yet. Create a profile to share revenue with collaborators.
                     </p>
                     <Button>
                       <Plus className="mr-2 h-4 w-4" />
                       Create Split Profile
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}
        </CardContent>
      </Card>

      {/* Remove invalid <style jsx> block */}
    </div>
  );
}
