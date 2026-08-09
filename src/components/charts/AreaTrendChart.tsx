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
import {
  CHART_GRID_STROKE,
  CHART_SEMANTIC,
  CHART_TICK,
  CHART_TOOLTIP_LABEL_STYLE,
  CHART_TOOLTIP_STYLE,
} from "./chart-theme";

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
  primaryColor = CHART_SEMANTIC.primary,
  secondaryColor = CHART_SEMANTIC.info,
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
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID_STROKE} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={CHART_TICK}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={CHART_TICK}
          />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            labelStyle={CHART_TOOLTIP_LABEL_STYLE}
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
