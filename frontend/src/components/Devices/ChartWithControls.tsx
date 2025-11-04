"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { TemperatureChart } from "./temperature-chart";
import { TemperatureHistory, HumidityHistory } from "@/lib/services/api";

type TimeRange = "1h" | "6h" | "24h" | "7d";

interface ChartWithControlsProps {
  history: TemperatureHistory[] | HumidityHistory[];
  type: "temperature" | "humidity";
  lowThreshold?: number;
  highThreshold?: number;
  sensorLabel: string;
}

export function ChartWithControls({
  history,
  type,
  lowThreshold,
  highThreshold,
  sensorLabel,
}: ChartWithControlsProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-card-foreground">
          {sensorLabel} History
        </h3>
        <div className="flex gap-2">
          <Button
            variant={timeRange === "1h" ? "default" : "outline"}
            size="sm"
            className={`text-xs ${
              timeRange === "1h"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent"
            }`}
            onClick={() => setTimeRange("1h")}
          >
            1h
          </Button>
          <Button
            variant={timeRange === "6h" ? "default" : "outline"}
            size="sm"
            className={`text-xs ${
              timeRange === "6h"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent"
            }`}
            onClick={() => setTimeRange("6h")}
          >
            6h
          </Button>
          <Button
            variant={timeRange === "24h" ? "default" : "outline"}
            size="sm"
            className={`text-xs ${
              timeRange === "24h"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent"
            }`}
            onClick={() => setTimeRange("24h")}
          >
            24h
          </Button>
          <Button
            variant={timeRange === "7d" ? "default" : "outline"}
            size="sm"
            className={`text-xs ${
              timeRange === "7d"
                ? "bg-primary text-primary-foreground"
                : "bg-transparent"
            }`}
            onClick={() => setTimeRange("7d")}
          >
            7d
          </Button>
        </div>
      </div>
      <CardContent>
        <TemperatureChart
          history={history}
          type={type}
          lowThreshold={lowThreshold}
          highThreshold={highThreshold}
          timeRange={timeRange}
        />
      </CardContent>
    </>
  );
}

