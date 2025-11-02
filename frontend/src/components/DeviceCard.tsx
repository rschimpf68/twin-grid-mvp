type Props = {
  device_id: string;
  temperature?: number;
  humidity?: number;
  status: "normal" | "critical";
  updated_at: string | null;
};

export const DeviceCard = ({
  device_id,
  temperature,
  humidity,
  status,
  updated_at,
}: Props) => {
  return (
    <div
      className={`p-4 rounded-xl shadow-md border transition
       ${
         status === "critical"
           ? "border-red-500 bg-red-900/40"
           : "border-green-500 bg-green-900/20"
       }`}
    >
      <h2 className="text-xl font-semibold">📟 {device_id}</h2>

      <div className="mt-2">
        {temperature !== undefined && (
          <p>
            🌡️ Temp: <strong>{temperature}°C</strong>
          </p>
        )}

        {humidity !== undefined && (
          <p>
            💧 Hum: <strong>{humidity}%</strong>
          </p>
        )}
      </div>

      <p className="text-xs mt-3 opacity-60">
        Última act: {updated_at ?? "N/A"}
      </p>
    </div>
  );
};
