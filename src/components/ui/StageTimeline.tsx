"use client";

import React from "react";
import { Check, X } from "lucide-react";

export type StageState = "completed" | "current" | "pending" | "blocked";

export interface TimelineStage {
  key: string;
  label: string;
  state: StageState;
}

/**
 * Workflow stage visualiser.
 *
 * Horizontal rail on desktop, vertical rail on mobile — the same data either
 * way. This is presentation only: it never decides which transitions are legal,
 * that stays with the backend workflow rules.
 */
export function StageTimeline({
  stages,
  className = "",
}: {
  stages: TimelineStage[];
  className?: string;
}) {
  return (
    <div className={className}>
      {/* ---------- Desktop: horizontal rail ---------- */}
      <ol className="hidden md:flex md:items-start">
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          return (
            <li key={stage.key} className="flex min-w-0 flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {/* leading connector */}
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 rounded-full ${
                    idx === 0
                      ? "bg-transparent"
                      : connectorTone(stages[idx - 1].state)
                  }`}
                />
                <StageMarker stage={stage} index={idx} />
                {/* trailing connector */}
                <span
                  aria-hidden="true"
                  className={`h-0.5 flex-1 rounded-full ${
                    isLast ? "bg-transparent" : connectorTone(stage.state)
                  }`}
                />
              </div>
              <span
                className={`mt-2 max-w-[92px] break-words px-1 text-center text-[11px] leading-tight ${labelTone(
                  stage.state
                )}`}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* ---------- Mobile: vertical rail ---------- */}
      <ol className="space-y-0 md:hidden">
        {stages.map((stage, idx) => {
          const isLast = idx === stages.length - 1;
          return (
            <li key={stage.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <StageMarker stage={stage} index={idx} />
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={`w-0.5 flex-1 rounded-full ${connectorTone(stage.state)}`}
                    style={{ minHeight: "1.25rem" }}
                  />
                )}
              </div>
              <span
                className={`pb-4 pt-1 text-xs leading-tight ${labelTone(stage.state)}`}
              >
                {stage.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StageMarker({ stage, index }: { stage: TimelineStage; index: number }) {
  const base =
    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold";

  const tone =
    stage.state === "completed"
      ? "border-success-theme bg-success-theme text-white"
      : stage.state === "current"
        ? "border-primary-theme bg-primary-theme text-white"
        : stage.state === "blocked"
          ? "border-danger-theme bg-danger-theme text-white"
          : "border-border-strong bg-surface text-text-soft";

  return (
    <span
      className={`${base} ${tone}`}
      aria-current={stage.state === "current" ? "step" : undefined}
      title={stage.label}
    >
      {stage.state === "completed" ? (
        <Check className="h-3.5 w-3.5" />
      ) : stage.state === "blocked" ? (
        <X className="h-3.5 w-3.5" />
      ) : (
        index + 1
      )}
      <span className="sr-only"> — {stage.state}</span>
    </span>
  );
}

function connectorTone(state: StageState) {
  return state === "completed" ? "bg-success-theme" : "bg-border-theme";
}

function labelTone(state: StageState) {
  switch (state) {
    case "current":
      return "font-semibold text-primary-theme";
    case "completed":
      return "font-medium text-text-muted";
    case "blocked":
      return "font-semibold text-danger-theme";
    default:
      return "text-text-soft";
  }
}

export default StageTimeline;
