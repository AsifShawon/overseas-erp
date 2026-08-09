import React from "react";
import * as Icons from "lucide-react";
import { MetricCard } from "./MetricCard";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  iconName?: keyof typeof Icons;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function StatCard(props: StatCardProps) {
  return <MetricCard {...props} />;
}

export default StatCard;

