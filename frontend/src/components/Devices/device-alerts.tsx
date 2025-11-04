"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DeviceAlert } from "@/lib/services/api";

interface DeviceAlertsProps {
  alerts: DeviceAlert[];
}

const ITEMS_PER_PAGE = 10;

export function DeviceAlerts({ alerts }: DeviceAlertsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  // Helper function to format date
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

  // Helper function to calculate duration
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

  // Helper function to extract temperature from message
  const extractTemperature = (message: string): string | null => {
    const match = message.match(/Temperature ([\d.]+)/);
    return match ? match[1] : null;
  };

  // Pagination logic
  const totalPages = Math.ceil(alerts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAlerts = alerts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (alerts.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Alert History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No alerts found for this device.
          </p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground">
            Alert History ({alerts.length})
          </CardTitle>
          {alerts.length > ITEMS_PER_PAGE && (
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, alerts.length)} of{" "}
              {alerts.length}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {paginatedAlerts.map((alert) => {
            const temp = extractTemperature(alert.message);
            const duration = calculateDuration(
              alert.created_at,
              alert.resolved_at
            );
            return (
              <div
                key={alert.id}
                className="p-4 rounded-lg bg-background border border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      #{alert.id}
                    </span>
                    <Badge
                      variant={alert.is_active ? "destructive" : "default"}
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
                  </div>
                  {alert.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-success border-success/40 hover:bg-success/15 bg-transparent"
                      disabled
                    >
                      Resolve
                    </Button>
                  )}
                </div>

                <p className="text-sm text-card-foreground mb-3">
                  {alert.message}
                </p>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  {temp && (
                    <div>
                      <span className="text-muted-foreground">
                        Temperature:
                      </span>
                      <span className="ml-2 text-destructive font-semibold">
                        {temp}°C
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Threshold:</span>
                    <span className="ml-2 text-card-foreground font-semibold">
                      {alert.threshold_value}°C
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 text-card-foreground">
                      {alert.alert_type.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2 text-card-foreground">
                      {formatDate(alert.created_at)}
                    </span>
                  </div>
                  {alert.resolved_at && (
                    <div>
                      <span className="text-muted-foreground">Resolved:</span>
                      <span className="ml-2 text-card-foreground">
                        {formatDate(alert.resolved_at)}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="ml-2 text-card-foreground">
                      {duration}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {alerts.length > ITEMS_PER_PAGE && (
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
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
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
                        <span key={page} className="px-2 text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
