"use client";

import React, { useState } from "react";
import { WorkflowStage, WORKFLOW_LABELS } from "@/lib/mockData";
import { StatusBadge } from "../ui/StatusBadge";
import { useMockAuth } from "@/context/MockAuthContext";
import { Check, AlertCircle, Play } from "lucide-react";

interface WorkflowStepperProps {
  currentStage: WorkflowStage;
  onTransition?: (newStage: WorkflowStage, notes: string) => void;
}

// Linear main flow for visual stepper
const STAGE_FLOW: WorkflowStage[] = [
  "APPLIED",
  "INTERVIEWED",
  "SELECTED",
  "MEDICAL_WAITING",
  "MEDICAL_FIT",
  "TRAINING_COMPLETED",
  "VISA_SUBMITTED",
  "VISA_STAMPED",
  "TICKETED",
  "DEPLOYED",
];

export function WorkflowStepper({ currentStage, onTransition }: WorkflowStepperProps) {
  const { user } = useMockAuth();
  const [transitionNotes, setTransitionNotes] = useState("");
  const [targetStage, setTargetStage] = useState<WorkflowStage>("INTERVIEWED");

  // Determine stage visual index
  const currentIndex = STAGE_FLOW.indexOf(currentStage);

  // If index is -1, it means candidate is in a halted state (MEDICAL_UNFIT or VISA_REJECTED)
  const isHalted = currentStage === "MEDICAL_UNFIT" || currentStage === "VISA_REJECTED";

  const handleTransitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onTransition) {
      onTransition(targetStage, transitionNotes || `Mock transitioned to ${targetStage}`);
      setTransitionNotes("");
    }
  };

  // Staff roles that can edit workflows
  const isStaff = ["Super Admin", "Operations Admin", "HR Officer", "Documentation Officer", "Visa Officer"].includes(
    user.roleName
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Workflow Stepper Banners */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 lg:col-span-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Recruitment Progress Timeline</h3>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Current:</span>
            <StatusBadge status={currentStage} />
          </div>
        </div>

        {/* Stepper Pipeline */}
        <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-2">
          {STAGE_FLOW.map((stage, idx) => {
            const isCompleted = currentIndex > idx;
            const isActive = currentIndex === idx;
            const isFuture = currentIndex < idx && !isHalted;
            void isFuture; // referenced for future styling use, suppressed

            let circleClass = "bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700";
            if (isActive) {
              circleClass = "bg-indigo-600 text-white border-indigo-600 animate-pulse shadow-sm shadow-indigo-600/30";
            } else if (isCompleted) {
              circleClass = "bg-emerald-500 text-white border-emerald-500";
            }

            return (
              <div key={stage} className="flex flex-1 flex-col items-center text-center group relative">
                {/* Visual Circle */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-300 ${circleClass}`}
                >
                  {isCompleted ? <Check className="h-4.5 w-4.5" /> : idx + 1}
                </div>

                {/* Stepper Label */}
                <span className="mt-2 block max-w-[90px] text-[10px] font-semibold text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white truncate">
                  {WORKFLOW_LABELS[stage].split(" ")[0]}..
                </span>

                {/* Tooltip containing full display label */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block rounded bg-slate-900 px-2 py-1 text-[9px] text-white whitespace-nowrap shadow-md dark:bg-white dark:text-slate-900 z-10">
                  {WORKFLOW_LABELS[stage]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Halted Banner */}
        {isHalted && (
          <div className="mt-6 flex gap-3 rounded-lg border border-rose-100 bg-rose-50/20 p-4 dark:border-rose-950/20 dark:bg-rose-950/5">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-400">Application Pipeline Halted</h4>
              <p className="mt-1 text-[10px] text-rose-700/80 dark:text-rose-400/80">
                This applicant has flagged {currentStage === "MEDICAL_UNFIT" ? "MEDICAL UNFIT" : "VISA REJECTED"} during compliance audits. Action is locked until cleared by authorized Officers.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Staff Action Panel */}
      <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h3 className="border-b border-slate-100 pb-3 text-xs font-bold text-slate-800 dark:text-slate-200 dark:border-slate-800">
          Officer Stage Actions
        </h3>

        {isStaff ? (
          <form onSubmit={handleTransitionSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Stage</label>
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value as WorkflowStage)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
              >
                {Object.keys(WORKFLOW_LABELS).map((stageKey) => (
                  <option key={stageKey} value={stageKey}>
                    {WORKFLOW_LABELS[stageKey as WorkflowStage]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Auditing Comments</label>
              <textarea
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                placeholder="Enter passport, visa, or flight remarks..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900 resize-none"
              />
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 shadow-sm shadow-indigo-600/30"
            >
              <Play className="h-3.5 w-3.5" /> Commit Transition
            </button>
          </form>
        ) : (
          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-400">
              Only Agency staff can execute workflow state-transitions. Sourced agents and candidates have read-only progress timelines.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
export default WorkflowStepper;
