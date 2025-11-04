"use client";

import { useEffect, useState } from "react";
import { fetchAlerts, AlertsResponse } from "@/lib/services/api";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Thermometer,
  Droplets,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface AlertsListProps {
  initialAlerts: AlertsResponse;
}

const ITEMS_PER_PAGE = 20;

export function AlertsList({ initialAlerts }: AlertsListProps) {
  const [alertsData, setAlertsData] = useState<AlertsResponse>(initialAlerts);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deviceFilter, setDeviceFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all-types");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;

    const fetchAndSet = async () => {
      try {
        const data = await fetchAlerts(abortController.signal);
        if (!isActive || !data) return;
        setAlertsData(data);
        setCurrentPage(1); // Reset to first page on new data
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

  // Helper functions
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const calculateDuration = (
    createdAt: string,
    resolvedAt: string | null
  ): string => {
    const created = new Date(createdAt);
    const resolved = resolvedAt ? new Date(resolvedAt) : new Date();
    const diffMs = resolved.getTime() - created.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h ${diffMins % 60}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    } else if (diffMins > 0) {
      return `${diffMins}m ${diffSecs % 60}s`;
    } else {
      return `${diffSecs}s`;
    }
  };

  const extractValue = (
    message: string
  ): { value: number; unit: string } | null => {
    const tempMatch = message.match(/Temperature ([\d.]+)/);
    if (tempMatch) {
      return { value: parseFloat(tempMatch[1]), unit: "°C" };
    }
    const humMatch = message.match(/Humidity ([\d.]+)%/);
    if (humMatch) {
      return { value: parseFloat(humMatch[1]), unit: "%" };
    }
    return null;
  };

  // Filter alerts
  const filteredAlerts = alertsData.data.filter((alert) => {
    // Status filter
    if (statusFilter === "active" && !alert.is_active) return false;
    if (statusFilter === "resolved" && alert.is_active) return false;

    // Device filter
    if (deviceFilter !== "all" && alert.device_id !== deviceFilter)
      return false;

    // Type filter
    if (
      typeFilter === "temperature" &&
      !alert.alert_type.includes("temperature")
    )
      return false;
    if (typeFilter === "humidity" && !alert.alert_type.includes("humidity"))
      return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = alert.id.toString().includes(query);
      const matchesDevice = alert.device_id.toLowerCase().includes(query);
      const matchesMessage = alert.message.toLowerCase().includes(query);
      if (!matchesId && !matchesDevice && !matchesMessage) return false;
    }

    return true;
  });

  // Get unique devices for filter
  const uniqueDevices = Array.from(
    new Set(alertsData.data.map((alert) => alert.device_id))
  ).sort();

  // Statistics
  const activeAlerts = alertsData.data.filter((a) => a.is_active).length;
  const resolvedAlerts = alertsData.data.filter((a) => !a.is_active).length;

  // Calculate average resolution time for resolved alerts
  const resolvedAlertsWithDuration = alertsData.data
    .filter((a) => !a.is_active && a.resolved_at)
    .map((a) => {
      const created = new Date(a.created_at);
      const resolved = new Date(a.resolved_at!);
      return resolved.getTime() - created.getTime();
    });

  const avgResolutionMs =
    resolvedAlertsWithDuration.length > 0
      ? resolvedAlertsWithDuration.reduce((a, b) => a + b, 0) /
        resolvedAlertsWithDuration.length
      : 0;

  const avgResolutionMins = Math.floor(avgResolutionMs / 60000);
  const avgResolutionSecs = Math.floor((avgResolutionMs % 60000) / 1000);
  const avgResolutionTime =
    avgResolutionMins > 0
      ? `${avgResolutionMins}m ${avgResolutionSecs}s`
      : `${avgResolutionSecs}s`;

  // Find device with most alerts
  const deviceAlertCounts = alertsData.data.reduce((acc, alert) => {
    acc[alert.device_id] = (acc[alert.device_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topDevice =
    Object.entries(deviceAlertCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "N/A";

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, deviceFilter, typeFilter, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Alert Management
          </h1>
          <p className="text-muted-foreground">
            Centralized alert monitoring and resolution
          </p>
        </div>
        <Link href="/">
          <Button
            variant="outline"
            className="text-foreground border-border bg-transparent"
          >
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {activeAlerts}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Resolved Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {resolvedAlerts}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully handled
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Avg Resolution Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {avgResolutionTime}
            </div>
            <p className="text-xs text-muted-foreground">All resolved alerts</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Top Device
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-card-foreground">
              {topDevice}
            </div>
            <p className="text-xs text-muted-foreground">Most alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by device ID or alert ID..."
                className="pl-9 bg-background text-foreground border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background text-foreground border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alerts</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="resolved">Resolved Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deviceFilter} onValueChange={setDeviceFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-background text-foreground border-border">
                <SelectValue placeholder="Device" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                {uniqueDevices.map((device) => (
                  <SelectItem key={device} value={device}>
                    {device}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px] bg-background text-foreground border-border">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-types">All Types</SelectItem>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="humidity">Humidity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-card-foreground">
              Alert History ({filteredAlerts.length} of{" "}
              {alertsData.pagination.total})
            </CardTitle>
            {filteredAlerts.length > ITEMS_PER_PAGE && (
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-
                {Math.min(endIndex, filteredAlerts.length)} of{" "}
                {filteredAlerts.length}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {paginatedAlerts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No alerts found matching the filters.
            </p>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedAlerts.map((alert) => {
                  const valueInfo = extractValue(alert.message);
                  const isTemperature =
                    alert.alert_type.includes("temperature");
                  return (
                    <div
                      key={alert.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-background border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-sm text-muted-foreground">
                            #{alert.id}
                          </span>
                          <Link
                            href={`/devices/${alert.device_id}`}
                            className="font-mono text-sm text-primary hover:underline"
                          >
                            {alert.device_id}
                          </Link>
                          <Badge
                            variant={
                              alert.is_active ? "destructive" : "default"
                            }
                            className={
                              alert.is_active
                                ? "bg-destructive/15 text-destructive border-destructive/40"
                                : "bg-success/15 text-success border-success/40"
                            }
                          >
                            {alert.is_active ? (
                              <>
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Resolved
                              </>
                            )}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="text-muted-foreground border-border"
                          >
                            {alert.alert_type.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-card-foreground">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          {valueInfo && (
                            <div className="flex items-center gap-1">
                              {isTemperature ? (
                                <Thermometer className="h-3 w-3" />
                              ) : (
                                <Droplets className="h-3 w-3" />
                              )}
                              <span className="text-destructive font-semibold">
                                {valueInfo.value.toFixed(2)}
                                {valueInfo.unit}
                              </span>
                              <span>
                                / {alert.threshold_value}
                                {isTemperature ? "°C" : "%"} threshold
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Created: {formatDate(alert.created_at)}</span>
                          </div>
                          {alert.resolved_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>
                                Resolved: {formatDate(alert.resolved_at)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span>
                              Duration:{" "}
                              {calculateDuration(
                                alert.created_at,
                                alert.resolved_at
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      {alert.is_active && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success border-success/40 hover:bg-success/15 bg-transparent"
                          disabled
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {filteredAlerts.length > ITEMS_PER_PAGE && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="bg-transparent"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>

                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => {
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <Button
                                key={page}
                                variant={
                                  currentPage === page ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => goToPage(page)}
                                className={
                                  currentPage === page
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-transparent"
                                }
                              >
                                {page}
                              </Button>
                            );
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span
                                key={page}
                                className="px-2 text-muted-foreground"
                              >
                                ...
                              </span>
                            );
                          }
                          return null;
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="bg-transparent"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
