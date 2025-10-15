import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Withdrawal, PaymentMethod } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, DollarSign } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

export default function WithdrawalsTab() {
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string>();
  const { toast } = useToast();

  const { data: balance } = useQuery<{ available: number }>({
    queryKey: ["/api/balance"],
  });

  const { data: paymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: withdrawals } = useQuery<Withdrawal[]>({
    queryKey: ["/api/withdrawals"],
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { amount: number; paymentMethodId: number }) => {
      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to submit withdrawal request");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
      toast({
        title: "Withdrawal requested",
        description: "Your withdrawal request has been submitted successfully.",
      });
      setAmount("");
      setSelectedMethod(undefined);
    },
  });

  const handleWithdraw = () => {
    if (!selectedMethod || !amount) return;
    withdrawMutation.mutate({
      amount: parseFloat(amount),
      paymentMethodId: parseInt(selectedMethod),
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              ${balance?.available.toFixed(2) || "0.00"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Withdrawal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select
                value={selectedMethod}
                onValueChange={setSelectedMethod}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods?.map((method) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleWithdraw}
              disabled={!amount || !selectedMethod || withdrawMutation.isPending}
            >
              {withdrawMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Request Withdrawal
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Withdrawal History</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawals?.map((withdrawal) => (
                <TableRow key={withdrawal.id}>
                  <TableCell>
                    {format(new Date(withdrawal.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>${withdrawal.amount}</TableCell>
                  <TableCell>
                    {paymentMethods?.find(m => m.id === withdrawal.paymentMethodId)?.name}
                  </TableCell>
                  <TableCell className="capitalize">{withdrawal.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
