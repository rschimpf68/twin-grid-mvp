export interface DevicesResponse {
  success: boolean;
  data: Device[];
  count: number;
}

export interface Device {
  device_id: string;
  temperature?: number;
  humidity?: number;
  updated_at: string | null;
}

export async function fetchDevices(signal?: AbortSignal): Promise<Device[]> {
   try {
      const res = await fetch("http://192.168.0.110:3001/api/devices", {
         // `next` options are ignored on the client; keeping for possible server usage
         next: { revalidate: 5 },
         signal,
      });

      if (!res.ok) {
         console.error(`Failed to fetch devices: ${res.status}`);
         return [];
      }

      const json: DevicesResponse = await res.json();

      console.log("devices fetched", json);

      // Return the data array from the response
      return json.data ?? [];
   } catch (err: unknown) {
      // If aborted, return current-safe empty list
      if (
         typeof err === "object" &&
         err !== null &&
         "name" in err &&
         (err as { name?: unknown }).name === "AbortError"
      ) {
         return [];
      }
      console.error("Error fetching devices:", err);
      return [];
   }
}

export interface DeviceAlert {
  id: number;
  device_id: string;
  alert_type: string;
  message: string;
  threshold_value: string;
  created_at: string;
  resolved_at: string | null;
  is_active: boolean;
}

export interface AlertsResponse {
  success: boolean;
  data: DeviceAlert[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export async function fetchAlerts(signal?: AbortSignal): Promise<AlertsResponse | null> {
   try {
      const res = await fetch("http://192.168.0.110:3001/api/alerts", {
         next: { revalidate: 5 },
         signal,
      });

      if (!res.ok) {
         console.error(`Failed to fetch alerts: ${res.status}`);
         return null;
      }

      const json: AlertsResponse = await res.json();

      console.log("alerts fetched", json);

      return json;
   } catch (err: unknown) {
      // If aborted, return null
      if (
         typeof err === "object" &&
         err !== null &&
         "name" in err &&
         (err as { name?: unknown }).name === "AbortError"
      ) {
         return null;
      }
      console.error("Error fetching alerts:", err);
      return null;
   }
}

export interface SensorHistory {
  time: string;
  temperature?: string;
  humidity?: string;
}

export interface TemperatureHistory {
  time: string;
  temperature: string;
}

export interface HumidityHistory {
  time: string;
  humidity: string;
}

export interface Last50Stats {
  min: number;
  max: number;
  average: number | null;
}

export interface DeviceData {
  device_id: string;
  alerts: DeviceAlert[];
  temperature?: {
    history: TemperatureHistory[];
    last50Stats: Last50Stats;
    totalCount: number;
    current: {
      temperature: string;
      timestamp: string;
    };
  };
  humidity?: {
    history: HumidityHistory[];
    last50Stats: Last50Stats;
    totalCount: number;
    current: {
      humidity: string;
      timestamp: string;
    };
  };
}

export async function fetchDeviceData(deviceId: string, signal?: AbortSignal): Promise<DeviceData | null> {
   try {
      const res = await fetch(`http://192.168.0.110:3001/api/devices/${deviceId}`, {
         next: { revalidate: 5 },
         signal,
      });

      if (!res.ok) {
         console.error(`Failed to fetch device data: ${res.status}`);
         return null;
      }

      const json = await res.json();

      console.log("device data fetched", json);

      return json.data ?? null;
   } catch (err: unknown) {
      // If aborted, return null
      if (
         typeof err === "object" &&
         err !== null &&
         "name" in err &&
         (err as { name?: unknown }).name === "AbortError"
      ) {
         return null;
      }
      console.error("Error fetching device data:", err);
      return null;
   }
}