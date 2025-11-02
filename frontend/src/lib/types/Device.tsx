export interface Device {
  device_id: string;
  temperature?: number;
  humidity?: number;
  updated_at: string | null;
}
