"use client";

import React from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  height?: number;
  defaultBarColor?: string;
  horizontal?: boolean;
}

export function BarChart({
  data,
  height = 260,
  defaultBarColor = "#4f46e5",
  horizontal = false,
}: BarChartProps) {
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
        <RechartsBarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 10, right: 15, left: horizontal ? 40 : -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={!horizontal} horizontal={horizontal} stroke="var(--border)" opacity={0.6} />
          {horizontal ? (
            <>
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-soft)" }} />
              <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-soft)" }} width={100} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-soft)" }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--text-soft)" }} />
            </>
          )}
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
          <Bar dataKey="value" radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || defaultBarColor} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BarChart;
