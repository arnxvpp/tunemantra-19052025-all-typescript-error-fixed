import { AdminDashboardLayout } from "@/components/layout/admin-dashboard-layout";
import AccountsApprovalComponent from "./accounts-approval";

export default function AccountsManagementPage() {
  return (
    <AdminDashboardLayout>
      <AccountsApprovalComponent />
    </AdminDashboardLayout>
  );
}