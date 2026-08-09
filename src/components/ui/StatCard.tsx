import React from "react";
import { MetricCard, type MetricCardProps } from "./MetricCard";

/**
 * Back-compatible alias for MetricCard.
 *
 * Kept so the many existing `StatCard` call sites keep working; new code should
 * import MetricCard directly.
 */
export type StatCardProps = MetricCardProps;

export function StatCard(props: StatCardProps) {
  return <MetricCard {...props} />;
}

export default StatCard;
