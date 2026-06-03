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

  // Determine stage visual index
  const currentIndex = STAGE_FLOW.indexOf(currentStage);

  // If index is -1, it means candidate is in a halted state (MEDICAL_UNFIT or VISA_REJECTED)
  const isHalted = currentStage === "MEDICAL_UNFIT" || currentStage === "VISA_REJECTED";

  const handleTransitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onTransition) {
      onTransition(targetStage, transitionNotes || `Transitioned to ${targetStage}`);
      setTransitionNotes("");
    }
  };

  // Staff roles that can edit workflows
  const isStaff = ["Super Admin", "Operations Admin", "HR Officer", "Documentation Officer", "Visa Officer"].includes(
    user.roleName
  );

  return (
    <div className={showActionBox ? "grid grid-cols-1 gap-6 lg:grid-cols-4" : "w-full"}>
      {/* Workflow Stepper Banners */}
      <div className={`rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 ${showActionBox ? "lg:col-span-3" : "w-full"}`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <h3 className="text-[17px] font-bold text-slate-800 dark:text-slate-200">
            {locale === "bn" ? "নিয়োগের অগ্রগতি টাইমলাইন" : "Recruitment Progress Timeline"}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm font-semibold text-slate-400">
              {locale === "bn" ? "বর্তমান:" : "Current:"}
            </span>
            <StatusBadge status={currentStage} className="text-xs md:text-sm px-2.5 py-0.5" />
          </div>
        </div>

        {/* Stepper Pipeline */}
        <div className="mt-8 flex flex-wrap justify-center lg:flex-nowrap lg:justify-between items-start gap-y-6 gap-x-2 md:gap-x-4 lg:gap-x-1.5">
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

            const fullLabel = t(`workflow.${stage}`);

            return (
              <div key={stage} className="flex flex-col items-center text-center group relative min-w-[85px] lg:min-w-[55px] xl:min-w-[70px] flex-1">
                {/* Visual Circle */}
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${circleClass}`}
                >
                  {isCompleted ? <Check className="h-4.5 w-4.5" /> : idx + 1}
                </div>

                {/* Stepper Label */}
                <span className="mt-2 block text-[11px] sm:text-xs lg:text-[12px] xl:text-[13px] font-semibold text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white whitespace-normal leading-relaxed">
                  {fullLabel}
                </span>

                {/* Tooltip containing full display label */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block rounded bg-slate-900 px-3 py-1.5 text-xs text-white whitespace-nowrap shadow-md dark:bg-white dark:text-slate-900 z-10">
                  {fullLabel}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Halted Banner */}
        {isHalted && (
          <div className="mt-6 flex gap-3.5 rounded-xl border border-rose-100 bg-rose-50/20 p-5 dark:border-rose-950/20 dark:bg-rose-950/5">
            <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
            <div>
              <h4 className="text-sm md:text-base font-bold text-rose-900 dark:text-rose-400">
                {locale === "bn" ? "আবেদন পাইপলাইন স্থগিত করা হয়েছে" : "Application Pipeline Halted"}
              </h4>
              <p className="mt-1.5 text-xs md:text-sm text-rose-700/80 dark:text-rose-400/80 leading-relaxed">
                {locale === "bn"
                  ? `কমপ্লায়েন্স অডিটের সময় এই আবেদনকারী ${
                      currentStage === "MEDICAL_UNFIT" ? "মেডিকেল আনফিট (MEDICAL UNFIT)" : "ভিসা প্রত্যাখ্যাত (VISA REJECTED)"
                    } হিসেবে চিহ্নিত হয়েছেন। অনুমোদিত কর্মকর্তাদের অনুমতি না দেওয়া পর্যন্ত নিয়োগ প্রক্রিয়া স্থগিত থাকবে।`
                  : `This applicant has flagged ${
                      currentStage === "MEDICAL_UNFIT" ? "MEDICAL UNFIT" : "VISA REJECTED"
                    } during compliance audits. Action is locked until cleared by authorized Officers.`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Staff Action Panel */}
      {showActionBox && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between">
          <div>
            <h3 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-800 dark:text-slate-200 dark:border-slate-800">
              {locale === "bn" ? "ধাপ পরিবর্তন অ্যাকশন" : "Officer Stage Actions"}
            </h3>

            {isStaff ? (
              <form onSubmit={handleTransitionSubmit} className="mt-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-theme">
                    {locale === "bn" ? "লক্ষ্য ধাপ" : "Target Stage"}
                  </label>
                  <select
                    value={targetStage}
                    onChange={(e) => setTargetStage(e.target.value as WorkflowStage)}
                    className="w-full rounded-xl border border-border-theme bg-slate-50 py-3 px-4 text-[15px] leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 text-text-theme"
                  >
                    {ENUM_STAGE_LIST.map((stageKey) => (
                      <option key={stageKey} value={stageKey}>
                        {t(`workflow.${stageKey}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-text-theme">
                    {locale === "bn" ? "অডিটিং মন্তব্য" : "Auditing Comments"}
                  </label>
                  <textarea
                    value={transitionNotes}
                    onChange={(e) => setTransitionNotes(e.target.value)}
                    placeholder={locale === "bn" ? "পাসপোর্ট, visa বা ফ্লাইটের মন্তব্য লিখুন..." : "Enter passport, visa, or flight remarks..."}
                    rows={3}
                    className="w-full rounded-xl border border-border-theme bg-slate-50 py-3 px-4 text-[15px] leading-relaxed outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-950 resize-none text-text-theme"
                  />
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 px-4 text-[15px] font-bold text-white transition hover:bg-indigo-700 shadow-sm shadow-indigo-600/30 cursor-pointer"
                >
                  <Play className="h-4 w-4" /> {locale === "bn" ? "ধাপ পরিবর্তন সম্পাদন করুন" : "Commit Transition"}
                </button>
              </form>
            ) : (
              <div className="mt-6 text-center">
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
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
