import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentMethodsTab from "./payment-methods-tab";
import WithdrawalsTab from "./withdrawals-tab";
import RoyaltySplitsTab from "./royalty-splits-tab";

export default function PaymentsPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments & Revenue</h1>
        <p className="text-muted-foreground">
          Manage your payment methods, withdrawals, and revenue sharing
        </p>
      </div>

      <Tabs defaultValue="payment-methods" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="royalty-splits">Royalty Splits</TabsTrigger>
        </TabsList>

        <TabsContent value="payment-methods" className="space-y-4">
          <PaymentMethodsTab />
        </TabsContent>

        <TabsContent value="withdrawals" className="space-y-4">
          <WithdrawalsTab />
        </TabsContent>

        <TabsContent value="royalty-splits" className="space-y-4">
          <RoyaltySplitsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}