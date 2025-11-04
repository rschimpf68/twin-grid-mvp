import { fetchDevices, fetchAlerts } from "../lib/services/api";
import { Dashboard } from "@/components/Dashboard/Dashboard";

export default async function Home() {
  const [initialDevices, initialAlerts] = await Promise.all([
    fetchDevices(),
    fetchAlerts(),
  ]);

  return (
    <main className="min-h-screen bg-background p-6">
      <Dashboard
        initialDevices={initialDevices}
        initialAlerts={initialAlerts}
      />
    </main>
  );
}
