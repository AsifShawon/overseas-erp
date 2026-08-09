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
import {
  CHART_GRID_STROKE,
  CHART_TICK,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
  chartColor,
} from "./chart-theme";

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
  defaultBarColor,
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
          <CartesianGrid strokeDasharray="3 3" vertical={!horizontal} horizontal={horizontal} stroke={CHART_GRID_STROKE} />
          {horizontal ? (
            <>
              <XAxis type="number" axisLine={false} tickLine={false} tick={CHART_TICK} />
              <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={CHART_TICK} width={100} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={CHART_TICK} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={CHART_TICK} />
            </>
          )}
          <Tooltip
            cursor={{ fill: "var(--bg-muted)", opacity: 0.5 }}
            contentStyle={CHART_TOOLTIP_STYLE}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
          />
          <Bar dataKey="value" radius={horizontal ? [0, 6, 6, 0] : [6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || defaultBarColor || chartColor(index)} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BarChart;
