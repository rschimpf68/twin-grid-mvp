"use client";

import { useEffect, useState } from "react";
import { fetchDevices } from "../lib/services/api";
import { DeviceCard } from "@/components/DeviceCard";
import { Device } from "@/lib/types/Device";

interface DevicesListProps {
  initialDevices: Device[];
}

export function DevicesList({ initialDevices }: DevicesListProps) {
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;

    const fetchAndSet = async () => {
      try {
        const data = await fetchDevices(abortController.signal);
        if (!isActive) return;
        setDevices(data);
      } catch (err) {
        if (
          typeof err !== "object" ||
          err === null ||
          !("name" in err) ||
          (err as { name?: unknown }).name !== "AbortError"
        ) {
          console.error(err);
        }
      }
    };

    fetchAndSet();
    const interval = setInterval(fetchAndSet, 4000);

    return () => {
      isActive = false;
      abortController.abort();
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      {devices.length === 0 && (
        <p className="text-gray-400">No hay dispositivos conectados...</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {devices.map((d) => (
          <DeviceCard
            key={d.device_id}
            device_id={d.device_id}
            temperature={d.temperature}
            humidity={d.humidity}
            status="normal"
            updated_at={d.updated_at}
          />
        ))}
      </div>
    </>
  );
}
