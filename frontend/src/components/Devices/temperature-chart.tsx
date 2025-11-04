"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { TemperatureHistory, HumidityHistory } from "@/lib/services/api";

type TimeRange = "1h" | "6h" | "24h" | "7d";

interface SensorChartProps {
  history: TemperatureHistory[] | HumidityHistory[];
  type: "temperature" | "humidity";
  lowThreshold?: number;
  highThreshold?: number;
  timeRange?: TimeRange;
}

export function TemperatureChart({
  history,
  type,
  lowThreshold,
  highThreshold,
  timeRange = "24h",
}: SensorChartProps) {
  // Filter and transform history data based on time range
  const now = new Date();
  const cutoffTimes = {
    "1h": new Date(now.getTime() - 60 * 60 * 1000),
    "6h": new Date(now.getTime() - 6 * 60 * 60 * 1000),
    "24h": new Date(now.getTime() - 24 * 60 * 60 * 1000),
    "7d": new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
  };

  const cutoffTime = cutoffTimes[timeRange];
  const filteredHistory = history.filter((item) => {
    const itemTime = new Date(item.time);
    return itemTime >= cutoffTime;
  });

  // Format time string based on time range
  const formatTime = (date: Date): string => {
    switch (timeRange) {
      case "1h":
        // For 1h, show HH:MM
        return `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      case "6h":
        // For 6h, show HH:MM (every hour)
        return `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      case "24h":
        // For 24h, show every 6 hours: HH:00
        return `${date.getHours().toString().padStart(2, "0")}:00`;
      case "7d":
        // For 7d, show DD/MM HH:00 (every day)
        return `${date.getDate().toString().padStart(2, "0")}/${(
          date.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")} ${date.getHours().toString().padStart(2, "0")}:00`;
      default:
        return `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
    }
  };

  // Transform history data for the chart
  const data = filteredHistory
    .map((item) => {
      const date = new Date(item.time);
      const timeStr = formatTime(date);
      const value =
        type === "temperature"
          ? parseFloat((item as TemperatureHistory).temperature)
          : parseFloat((item as HumidityHistory).humidity);
      return {
        time: timeStr,
        value: value,
        fullTime: item.time,
        timestamp: date.getTime(),
      };
    })
    .reverse(); // Reverse to show oldest to newest

  // For 24h range, filter to show every 6 hours
  // For 7d range, filter to show one point per day
  let filteredData = data;
  if (timeRange === "24h") {
    // Show points at 00:00, 06:00, 12:00, 18:00 (or closest available within 1 hour)
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
    const targetHours = [0, 6, 12, 18];
    filteredData = sortedData.filter((item) => {
      const date = new Date(item.timestamp);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      // Include if hour is 0, 6, 12, or 18 and minutes are within first hour
      return targetHours.includes(hours) && minutes < 60;
    });
    // If no exact matches, include first, last, and points approximately every 6 hours
    if (filteredData.length < 2 && sortedData.length > 0) {
      filteredData = [sortedData[0]];
      let lastAddedTime = sortedData[0].timestamp;
      for (let i = 1; i < sortedData.length; i++) {
        const hoursDiff =
          (sortedData[i].timestamp - lastAddedTime) / (1000 * 60 * 60);
        if (hoursDiff >= 5.5) {
          filteredData.push(sortedData[i]);
          lastAddedTime = sortedData[i].timestamp;
        }
      }
      // Always include last point
      if (
        sortedData.length > 1 &&
        filteredData[filteredData.length - 1].timestamp !==
          sortedData[sortedData.length - 1].timestamp
      ) {
        filteredData.push(sortedData[sortedData.length - 1]);
      }
    } else {
      // Always include first and last points
      if (sortedData.length > 0) {
        const first = sortedData[0];
        const last = sortedData[sortedData.length - 1];
        if (
          filteredData.length === 0 ||
          filteredData[0].timestamp !== first.timestamp
        ) {
          filteredData.unshift(first);
        }
        if (
          filteredData[filteredData.length - 1].timestamp !== last.timestamp
        ) {
          filteredData.push(last);
        }
      }
    }
  } else if (timeRange === "7d") {
    // Show one point per day
    filteredData = data.filter((item, index, arr) => {
      if (index === 0 || index === arr.length - 1) return true;
      const prevTimestamp = arr[index - 1].timestamp;
      const daysDiff = (item.timestamp - prevTimestamp) / (1000 * 60 * 60 * 24);
      return daysDiff >= 1;
    });
  } else if (timeRange === "6h") {
    // Show every hour
    filteredData = data.filter((item, index, arr) => {
      if (index === 0 || index === arr.length - 1) return true;
      const prevTimestamp = arr[index - 1].timestamp;
      const hoursDiff = (item.timestamp - prevTimestamp) / (1000 * 60 * 60);
      return hoursDiff >= 1;
    });
  } else if (timeRange === "1h") {
    // Show every 10 minutes
    filteredData = data.filter((item, index, arr) => {
      if (index === 0 || index === arr.length - 1) return true;
      const prevTimestamp = arr[index - 1].timestamp;
      const minsDiff = (item.timestamp - prevTimestamp) / (1000 * 60);
      return minsDiff >= 10;
    });
  }

  // Calculate domain based on filtered data (use original data for better scale)
  const values = filteredHistory.map((item) =>
    type === "temperature"
      ? parseFloat((item as TemperatureHistory).temperature)
      : parseFloat((item as HumidityHistory).humidity)
  );
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const padding = (maxValue - minValue) * 0.1 || 5;
  const yMin = Math.max(0, Math.floor(minValue - padding));
  const yMax = Math.ceil(maxValue + padding);

  const unit = type === "temperature" ? "°C" : "%";
  const label = type === "temperature" ? "Temperature" : "Humidity";

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={filteredData}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.24 0 0)" />
        <XAxis
          dataKey="time"
          stroke="oklch(0.60 0 0)"
          tick={{ fill: "oklch(0.60 0 0)", fontSize: 12 }}
          tickLine={{ stroke: "oklch(0.24 0 0)" }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          stroke="oklch(0.60 0 0)"
          tick={{ fill: "oklch(0.60 0 0)", fontSize: 12 }}
          tickLine={{ stroke: "oklch(0.24 0 0)" }}
          domain={[yMin, yMax]}
          label={{
            value: `${label} (${unit})`,
            angle: -90,
            position: "insideLeft",
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(0.16 0 0)",
            border: "1px solid oklch(0.24 0 0)",
            borderRadius: "0.5rem",
            color: "oklch(0.98 0 0)",
          }}
          labelStyle={{ color: "oklch(0.60 0 0)" }}
          formatter={(value: number) => [`${value.toFixed(2)}${unit}`, label]}
          labelFormatter={(label) => `Time: ${label}`}
        />
        {highThreshold && (
          <ReferenceLine
            y={highThreshold}
            stroke="oklch(0.55 0.24 25)"
            strokeDasharray="3 3"
            label={{
              value: `High Threshold (${highThreshold}${unit})`,
              fill: "oklch(0.55 0.24 25)",
              fontSize: 12,
              position: "top",
            }}
          />
        )}
        {lowThreshold && (
          <ReferenceLine
            y={lowThreshold}
            stroke="oklch(0.65 0.22 250)"
            strokeDasharray="3 3"
            label={{
              value: `Low Threshold (${lowThreshold}${unit})`,
              fill: "oklch(0.65 0.22 250)",
              fontSize: 12,
              position: "top",
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke="oklch(0.65 0.22 250)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
