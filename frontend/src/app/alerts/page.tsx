import { fetchAlerts } from "@/lib/services/api";
import { AlertsList } from "@/components/Alerts/AlertsList";
import { notFound } from "next/navigation";

export default async function AlertsPage() {
  const alertsData = await fetchAlerts();

  if (!alertsData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <AlertsList initialAlerts={alertsData} />
    </div>
  );
}


