/**
 * Shared chart theming.
 *
 * Colours are CSS custom properties rather than literals so every chart follows
 * the light/dark token swap automatically. Browsers resolve `var()` inside SVG
 * presentation attributes, which is how the axis and grid styling already works
 * elsewhere in this codebase.
 */

/** Categorical ramp — use in order; do not invent new hex values per chart. */
export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
] as const;

/** Semantic colours for charts that encode meaning rather than category. */
export const CHART_SEMANTIC = {
  primary: "var(--chart-1)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
  info: "var(--info)",
  neutral: "var(--border-strong)",
} as const;

export const CHART_GRID_STROKE = "var(--chart-grid)";

export const CHART_TICK = {
  fontSize: 11,
  fill: "var(--text-soft)",
} as const;

/** Consistent tooltip chrome across every chart type. */
export const CHART_TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "var(--surface-elevated)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "var(--text)",
  boxShadow: "var(--elev-md)",
  padding: "0.5rem 0.625rem",
};

export const CHART_TOOLTIP_LABEL_STYLE: React.CSSProperties = {
  color: "var(--text-soft)",
  fontSize: "0.6875rem",
  marginBottom: "0.125rem",
};

/** Picks a ramp colour by index, wrapping around for long series. */
export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}
