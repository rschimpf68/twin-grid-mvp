import { fetchDevices } from "../lib/services/api";
import { DevicesList } from "@/components/DevicesList";

export default async function Home() {
  const initialDevices = await fetchDevices();

  return (
    <main className="min-h-screen bg-[#0d1117] text-white p-6">
      <h1 className="text-3xl font-bold pb-5">TwinGrid Dashboard ⚡</h1>
      <DevicesList initialDevices={initialDevices} />
    </main>
  );
}
