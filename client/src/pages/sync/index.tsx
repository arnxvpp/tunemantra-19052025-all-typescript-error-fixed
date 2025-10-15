
import { MainLayout } from "@/components/layout/main-layout";
import { SyncMarketplace } from "@/components/sync/sync-marketplace";

export default function SyncPage() {
  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sync Licensing</h1>
          <p className="text-muted-foreground">
            Find sync licensing opportunities for your music
          </p>
        </div>
        <SyncMarketplace />
      </div>
    </MainLayout>
  );
}
