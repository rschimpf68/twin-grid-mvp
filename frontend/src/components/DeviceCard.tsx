import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Thermometer, Droplets } from "lucide-react";

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
    <Link href={`/devices/${device_id}`}>
      <Card className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer hover:shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold font-mono text-card-foreground">
              {device_id}
            </h2>
            <Badge
              variant={status === "critical" ? "destructive" : "default"}
              className={
                status === "critical"
                  ? "bg-destructive/15 text-destructive border-destructive/40"
                  : "bg-success/15 text-success border-success/40"
              }
            >
              {status === "critical" ? "Critical" : "Normal"}
            </Badge>
          </div>

          <div className="space-y-2 mb-3">
            {temperature !== undefined && (
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-destructive" />
                <span className="text-sm text-muted-foreground">
                  Temperature:{" "}
                  <strong className="text-card-foreground">{temperature.toFixed(2)}°C</strong>
                </span>
              </div>
            )}

            {humidity !== undefined && (
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  Humidity:{" "}
                  <strong className="text-card-foreground">{humidity.toFixed(2)}%</strong>
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Last update:{" "}
              {updated_at
                ? new Date(updated_at).toLocaleString("es-ES", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "N/A"}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
