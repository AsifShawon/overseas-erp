// src/components/shared/WorkflowStepper.tsx
"use client";

import React, { useState } from "react";
import { WorkflowStage } from "@/lib/mockData";
import { StatusBadge } from "../ui/StatusBadge";
import { useMockAuth } from "@/context/MockAuthContext";
import { Check, AlertCircle, Play } from "lucide-react";
import { useT } from "@/i18n/useT";

interface WorkflowStepperProps {
  currentStage: WorkflowStage;
  onTransition?: (newStage: WorkflowStage, notes: string) => void;
  showActionBox?: boolean;
}

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

const ENUM_STAGE_LIST: WorkflowStage[] = [
  "APPLIED",
  "INTERVIEWED",
  "SELECTED",
  "MEDICAL_WAITING",
  "MEDICAL_FIT",
  "MEDICAL_UNFIT",
  "TRAINING_COMPLETED",
  "VISA_SUBMITTED",
  "VISA_STAMPED",
  "VISA_REJECTED",
  "TICKETED",
  "DEPLOYED",
];

export function WorkflowStepper({ currentStage, onTransition, showActionBox = true }: WorkflowStepperProps) {
  const { user } = useMockAuth();
  const { t, locale } = useT();
  const [transitionNotes, setTransitionNotes] = useState("");
  const [targetStage, setTargetStage] = useState<WorkflowStage>("INTERVIEWED");

  const currentIndex = STAGE_FLOW.indexOf(currentStage);
  const isHalted = currentStage === "MEDICAL_UNFIT" || currentStage === "VISA_REJECTED";

  const handleTransitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onTransition) {
      onTransition(targetStage, transitionNotes || `Transitioned to ${targetStage}`);
      setTransitionNotes("");
    }
  };

  const isStaff = ["Super Admin", "Operations Admin", "HR Officer", "Documentation Officer", "Visa Officer"].includes(
    user.roleName
  );

  return (
    <div className={showActionBox ? "grid grid-cols-1 gap-5 lg:grid-cols-4" : "w-full"}>
      {/* Workflow Stepper Banners */}
      <div className={`rounded-xl border border-border-theme bg-surface p-5 shadow-xs ${showActionBox ? "lg:col-span-3" : "w-full"}`}>
        <div className="flex items-center justify-between border-b border-border-theme pb-3">
          <h3 className="text-sm font-bold text-text-theme">
            {locale === "bn" ? "নিয়োগের অগ্রগতি টাইমলাইন" : "Recruitment Progress Timeline"}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-soft">
              {locale === "bn" ? "বর্তমান:" : "Current:"}
            </span>
            <StatusBadge status={currentStage} />
          </div>
        </div>

        {/* Stepper Pipeline */}
        <div className="mt-6 flex flex-wrap justify-between items-start gap-y-4 gap-x-1 sm:gap-x-2">
          {STAGE_FLOW.map((stage, idx) => {
            const isCompleted = currentIndex > idx;
            const isActive = currentIndex === idx;

            let circleClass = "bg-bg-muted text-text-soft border-border-theme";
            if (isActive) {
              circleClass = "bg-primary-theme text-white border-primary-theme shadow-xs animate-pulse";
            } else if (isCompleted) {
              circleClass = "bg-emerald-500 text-white border-emerald-500";
            }

            const fullLabel = t(`workflow.${stage}`);

            return (
              <div key={stage} className="flex flex-col items-center text-center group relative min-w-[70px] sm:min-w-[80px] flex-1">
                {/* Visual Circle */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-200 ${circleClass}`}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                </div>

                {/* Stepper Label */}
                <span className="mt-2 block text-[11px] font-semibold text-text-soft group-hover:text-text-theme transition-colors leading-tight truncate max-w-[80px]">
                  {fullLabel}
                </span>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-white whitespace-nowrap shadow-md dark:bg-white dark:text-slate-900 z-20">
                  {fullLabel}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Halted Banner */}
        {isHalted && (
          <div className="mt-5 flex gap-3 rounded-lg border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-950/40 dark:bg-rose-950/20">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-rose-900 dark:text-rose-400">
                {locale === "bn" ? "আবেদন পাইপলাইন স্থগিত করা হয়েছে" : "Application Pipeline Halted"}
              </h4>
              <p className="mt-1 text-xs text-rose-700/90 dark:text-rose-400/80 leading-relaxed font-medium">
                {locale === "bn"
                  ? `কমপ্লায়েন্স অডিটের সময় এই আবেদনকারী ${
                      currentStage === "MEDICAL_UNFIT" ? "মেডিকেল আনফিট (MEDICAL UNFIT)" : "ভিসা প্রত্যাখ্যাত (VISA REJECTED)"
                    } হিসেবে চিহ্নিত হয়েছেন। অনুমোদিত কর্মকর্তাদের অনুমতি না দেওয়া পর্যন্ত নিয়োগ প্রক্রিয়া স্থগিত থাকবে।`
                  : `This applicant was flagged ${
                      currentStage === "MEDICAL_UNFIT" ? "MEDICAL UNFIT" : "VISA REJECTED"
                    } during compliance audits. Action is locked until cleared by authorized Officers.`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Staff Action Panel */}
      {showActionBox && (
        <div className="rounded-xl border border-border-theme bg-surface p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="border-b border-border-theme pb-3 text-sm font-bold text-text-theme">
              {locale === "bn" ? "ধাপ পরিবর্তন অ্যাকশন" : "Officer Stage Actions"}
            </h3>

            {isStaff ? (
              <form onSubmit={handleTransitionSubmit} className="mt-3.5 space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-theme">
                    {locale === "bn" ? "লক্ষ্য ধাপ" : "Target Stage"}
                  </label>
                  <select
                    value={targetStage}
                    onChange={(e) => setTargetStage(e.target.value as WorkflowStage)}
                    className="w-full rounded-lg border border-border-theme bg-bg py-2 px-3 text-xs outline-none focus:border-primary-theme text-text-theme font-medium"
                  >
                    {ENUM_STAGE_LIST.map((stageKey) => (
                      <option key={stageKey} value={stageKey}>
                        {t(`workflow.${stageKey}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-theme">
                    {locale === "bn" ? "অডিটিং মন্তব্য" : "Auditing Comments"}
                  </label>
                  <textarea
                    value={transitionNotes}
                    onChange={(e) => setTransitionNotes(e.target.value)}
                    placeholder={locale === "bn" ? "পাসপোর্ট, visa বা ফ্লাইটের মন্তব্য লিখুন..." : "Enter passport, visa, or flight remarks..."}
                    rows={3}
                    className="w-full rounded-lg border border-border-theme bg-bg py-2 px-3 text-xs outline-none focus:border-primary-theme resize-none text-text-theme"
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-theme py-2.5 px-3 text-xs font-bold text-white transition hover:bg-primary-hover shadow-xs cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" /> {locale === "bn" ? "ধাপ পরিবর্তন সম্পাদন করুন" : "Commit Transition"}
                </button>
              </form>
            ) : (
              <div className="mt-4 text-center">
                <p className="text-xs text-text-soft leading-relaxed">
                  {locale === "bn"
                    ? "শুধুমাত্র এজেন্সির কর্মকর্তা কর্মচারীরাই ধাপ পরিবর্তন সম্পাদন করতে পারেন। সোর্সিং এজেন্ট এবং আবেদনকারীদের ক্ষেত্রে শুধুমাত্র রিড-অনলি টাইমলাইন প্রদর্শিত হয়।"
                    : "Only Agency staff can execute workflow state-transitions. Sourced agents and candidates have read-only progress timelines."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default WorkflowStepper;

