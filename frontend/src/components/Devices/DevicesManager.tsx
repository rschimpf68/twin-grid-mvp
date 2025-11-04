import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { ChartWithControls } from "./ChartWithControls";
import { DeviceAlerts } from "./device-alerts";
import { fetchDeviceData } from "@/lib/services/api";
import { notFound } from "next/navigation";

export default async function DevicesManager({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch device data using the device ID as-is (e.g., "sensor_001")
  const deviceData = await fetchDeviceData(id);

  if (!deviceData) {
    notFound();
  }

  // Determine sensor type
  const isTemperatureSensor = !!deviceData.temperature;
  const sensorType = isTemperatureSensor ? "temperature" : "humidity";

  // Get current value and data based on sensor type
  const currentValue = isTemperatureSensor
    ? parseFloat(deviceData.temperature?.current.temperature || "0")
    : parseFloat(deviceData.humidity?.current.humidity || "0");

  const stats = isTemperatureSensor
    ? deviceData.temperature?.last50Stats
    : deviceData.humidity?.last50Stats;

  const history = isTemperatureSensor
    ? deviceData.temperature?.history || []
    : deviceData.humidity?.history || [];

  // Format last reading time
  const lastTimestamp = isTemperatureSensor
    ? new Date(
        deviceData.temperature?.current.timestamp || new Date().toISOString()
      )
    : new Date(
        deviceData.humidity?.current.timestamp || new Date().toISOString()
      );
  const now = new Date();
  const diffMs = now.getTime() - lastTimestamp.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const lastReading =
    diffMins < 1
      ? "just now"
      : diffMins === 1
      ? "1 min ago"
      : `${diffMins} mins ago`;

  // Determine thresholds based on sensor type
  const highThreshold = isTemperatureSensor ? 40 : 80; // 40°C for temp, 80% for humidity
  const lowThreshold = isTemperatureSensor ? 25 : 30; // 25°C for temp, 30% for humidity
  const isAboveHigh = currentValue > highThreshold;
  const isBelowLow = currentValue < lowThreshold;

  const unit = isTemperatureSensor ? "°C" : "%";
  const sensorLabel = isTemperatureSensor ? "Temperature" : "Humidity";
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {deviceData.device_id}
              </h1>
              <Badge
                variant="default"
                className="bg-success/15 text-success border-success/40"
              >
                online
              </Badge>
            </div>
            <p className="text-muted-foreground">Last reading: {lastReading}</p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Auto-updating</span>
          </div>
        </div>

        {/* Current Sensor Value Card */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Current {sensorLabel}
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-5xl font-bold ${
                      isAboveHigh
                        ? "text-destructive"
                        : isBelowLow
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    {currentValue.toFixed(2)}
                    {unit}
                  </span>
                  {isAboveHigh && (
                    <Badge
                      variant="destructive"
                      className="bg-destructive/15 text-destructive border-destructive/40"
                    >
                      Above High Threshold
                    </Badge>
                  )}
                  {isBelowLow && (
                    <Badge
                      variant="default"
                      className="bg-primary/15 text-primary border-primary/40"
                    >
                      Below Low Threshold
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right space-y-1">
                {isAboveHigh && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-destructive" />
                      <span className="text-muted-foreground">
                        Threshold:{" "}
                        <span className="text-destructive font-semibold">
                          {highThreshold}
                          {unit}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      +{(currentValue - highThreshold).toFixed(2)}
                      {unit} over limit
                    </div>
                  </>
                )}
                {isBelowLow && (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <TrendingDown className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">
                        Threshold:{" "}
                        <span className="text-primary font-semibold">
                          {lowThreshold}
                          {unit}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {(currentValue - lowThreshold).toFixed(2)}
                      {unit} below limit
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <ChartWithControls
              history={history}
              type={sensorType}
              lowThreshold={lowThreshold}
              highThreshold={highThreshold}
              sensorLabel={sensorLabel}
            />
          </CardHeader>
        </Card>

        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Minimum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-success" />
                <span className="text-2xl font-bold text-card-foreground">
                  {stats?.min.toFixed(2) || "N/A"}
                  {unit}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Maximum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-destructive" />
                <span className="text-2xl font-bold text-card-foreground">
                  {stats?.max.toFixed(2) || "N/A"}
                  {unit}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Average
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold text-card-foreground">
                  {stats?.average ? stats.average.toFixed(2) : "N/A"}
                  {unit}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Total Readings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-bold text-card-foreground">
                {isTemperatureSensor
                  ? deviceData.temperature?.totalCount || 0
                  : deviceData.humidity?.totalCount || 0}
              </span>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                Current
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span
                className={`text-2xl font-bold ${
                  isAboveHigh
                    ? "text-destructive"
                    : isBelowLow
                    ? "text-primary"
                    : "text-card-foreground"
                }`}
              >
                {currentValue.toFixed(2)}
                {unit}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Device Alerts */}
        <DeviceAlerts alerts={deviceData.alerts} />
      </div>
    </div>
  );
}
