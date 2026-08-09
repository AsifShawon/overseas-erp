"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface AreaTrendDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
}

interface AreaTrendChartProps {
  data: AreaTrendDataPoint[];
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
  primaryName?: string;
  secondaryName?: string;
}

export function AreaTrendChart({
  data,
  height = 260,
  primaryColor = "#4f46e5",
  secondaryColor = "#0284c7",
  primaryName = "Count",
  secondaryName = "Target",
}: AreaTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-xs text-text-soft">
        No chart data available
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={primaryColor} stopOpacity={0.35} />
              <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
            </linearGradient>
            {data[0]?.secondaryValue !== undefined && (
              <linearGradient id="secondaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.0} />
              </linearGradient>
            )}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--text-soft)" }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "var(--text-soft)" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--border)",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              color: "var(--text)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            name={primaryName}
            stroke={primaryColor}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#primaryGradient)"
          />
          {data[0]?.secondaryValue !== undefined && (
            <Area
              type="monotone"
              dataKey="secondaryValue"
              name={secondaryName}
              stroke={secondaryColor}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#secondaryGradient)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AreaTrendChart;
