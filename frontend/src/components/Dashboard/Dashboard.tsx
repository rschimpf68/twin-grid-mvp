"use client";

import { useEffect, useState } from "react";
import { fetchDevices, fetchAlerts, Device, AlertsResponse } from "@/lib/services/api";
import { DeviceCard } from "@/components/DeviceCard";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Activity,
  TrendingUp,
  Thermometer,
  Droplets,
  ArrowRight,
} from "lucide-react";

interface DashboardProps {
  initialDevices: Device[];
  initialAlerts: AlertsResponse | null;
}

export function Dashboard({ initialDevices, initialAlerts }: DashboardProps) {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(initialAlerts);

  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;

    const fetchAndSet = async () => {
      try {
        const [devicesData, alertsResponse] = await Promise.all([
          fetchDevices(abortController.signal),
          fetchAlerts(abortController.signal),
        ]);
        if (!isActive) return;
        setDevices(devicesData);
        if (alertsResponse) {
          setAlertsData(alertsResponse);
        }
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

  // Calculate statistics
  const activeAlerts = alertsData?.data.filter((a) => a.is_active) || [];
  const activeAlertsCount = activeAlerts.length;
  const recentAlerts = alertsData?.data.slice(0, 5) || [];

  const temperatureDevices = devices.filter((d) => d.temperature !== undefined);
  const humidityDevices = devices.filter((d) => d.humidity !== undefined);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            TwinGrid Dashboard ⚡
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring and alert management
          </p>
        </div>
        <Link href="/alerts">
          <Button
            variant="outline"
            className="text-foreground border-border bg-transparent hover:bg-background/50"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            View All Alerts
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Devices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold text-card-foreground">
                {devices.length}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {temperatureDevices.length} temperature, {humidityDevices.length}{" "}
              humidity
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div className="text-2xl font-bold text-destructive">
                {activeAlertsCount}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div className="text-2xl font-bold text-card-foreground">
                {alertsData?.pagination.total || 0}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All time alert history
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="text-2xl font-bold text-success">
                {alertsData?.data.filter((a) => {
                  if (a.is_active || !a.resolved_at) return false;
                  const resolved = new Date(a.resolved_at);
                  const today = new Date();
                  return (
                    resolved.getDate() === today.getDate() &&
                    resolved.getMonth() === today.getMonth() &&
                    resolved.getFullYear() === today.getFullYear()
                  );
                }).length || 0}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Successfully handled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Devices Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Devices</h2>
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          {devices.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No hay dispositivos conectados...
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          )}
        </div>

        {/* Recent Alerts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Recent Alerts
            </h2>
            <Link href="/alerts">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {recentAlerts.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-muted-foreground">No alerts found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentAlerts.map((alert) => {
                    const isTemperature = alert.alert_type.includes("temperature");
                    const extractValue = (message: string) => {
                      const match = message.match(/(?:Temperature|Humidity) ([\d.]+)/);
                      return match ? match[1] : null;
                    };
                    const value = extractValue(alert.message);

                    return (
                      <Link
                        key={alert.id}
                        href={`/devices/${alert.device_id}`}
                        className="block p-4 hover:bg-background/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {isTemperature ? (
                              <Thermometer className="h-4 w-4 text-destructive" />
                            ) : (
                              <Droplets className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono text-xs text-muted-foreground">
                                {alert.device_id}
                              </span>
                              <Badge
                                variant={alert.is_active ? "destructive" : "default"}
                                className={
                                  alert.is_active
                                    ? "bg-destructive/15 text-destructive border-destructive/40"
                                    : "bg-success/15 text-success border-success/40"
                                }
                              >
                                {alert.is_active ? "Active" : "Resolved"}
                              </Badge>
                            </div>
                            <p className="text-sm text-card-foreground truncate">
                              {alert.message}
                            </p>
                            {value && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {value}
                                {isTemperature ? "°C" : "%"} / Threshold:{" "}
                                {alert.threshold_value}
                                {isTemperature ? "°C" : "%"}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.created_at).toLocaleString("es-ES", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

