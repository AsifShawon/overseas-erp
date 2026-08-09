// src/components/shared/WorkflowStepper.tsx
"use client";

import React, { useState } from "react";
import { WorkflowStage } from "@/lib/mockData";
import { StatusBadge } from "../ui/StatusBadge";
import { AppCard, AppCardHeader } from "../ui/AppCard";
import { AppButton } from "../ui/AppButton";
import { StageTimeline, type TimelineStage } from "../ui/StageTimeline";
import { useMockAuth } from "@/context/MockAuthContext";
import { AlertCircle, Play } from "lucide-react";
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

export function WorkflowStepper({
  currentStage,
  onTransition,
  showActionBox = true,
}: WorkflowStepperProps) {
  const { user } = useMockAuth();
  const { t, locale } = useT();
  const [transitionNotes, setTransitionNotes] = useState("");
  const [targetStage, setTargetStage] = useState<WorkflowStage>("INTERVIEWED");

  const currentIndex = STAGE_FLOW.indexOf(currentStage);
  const isHalted =
    currentStage === "MEDICAL_UNFIT" || currentStage === "VISA_REJECTED";

  const handleTransitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onTransition) {
      onTransition(targetStage, transitionNotes || `Transitioned to ${targetStage}`);
      setTransitionNotes("");
    }
  };

  const isStaff = [
    "Super Admin",
    "Operations Admin",
    "HR Officer",
    "Documentation Officer",
    "Visa Officer",
  ].includes(user.roleName);

  /*
   * Derive display state per stage. When the pipeline is halted the stage the
   * candidate reached is marked blocked; this is presentation only and does not
   * affect which transitions the backend permits.
   */
  const stages: TimelineStage[] = STAGE_FLOW.map((stage, idx) => {
    let state: TimelineStage["state"] = "pending";
    if (isHalted && idx === Math.max(currentIndex, 0)) {
      state = "blocked";
    } else if (currentIndex > idx) {
      state = "completed";
    } else if (currentIndex === idx) {
      state = "current";
    }
    return { key: stage, label: t(`workflow.${stage}`), state };
  });

  return (
    <div className={showActionBox ? "grid grid-cols-1 gap-4 lg:grid-cols-3" : "w-full"}>
      <AppCard className={showActionBox ? "lg:col-span-2" : "w-full"}>
        <AppCardHeader
          title={
            locale === "bn" ? "নিয়োগের অগ্রগতি" : "Recruitment Progress"
          }
          action={<StatusBadge status={currentStage} />}
        />

        <StageTimeline stages={stages} className="mt-6" />

        {isHalted && (
          <div
            role="alert"
            className="mt-5 flex gap-2.5 rounded-md border border-danger-theme/25 bg-danger-soft p-3.5"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger-theme" />
            <div>
              <h4 className="text-xs font-semibold text-danger-theme">
                {locale === "bn"
                  ? "আবেদন পাইপলাইন স্থগিত"
                  : "Pipeline halted"}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-danger-theme/90">
                {locale === "bn"
                  ? `কমপ্লায়েন্স যাচাইয়ে এই আবেদনকারী ${
                      currentStage === "MEDICAL_UNFIT"
                        ? "মেডিকেল আনফিট"
                        : "ভিসা প্রত্যাখ্যাত"
                    } হিসেবে চিহ্নিত। অনুমোদিত কর্মকর্তা ছাড়পত্র না দেওয়া পর্যন্ত প্রক্রিয়া স্থগিত থাকবে।`
                  : `This applicant was flagged ${
                      currentStage === "MEDICAL_UNFIT"
                        ? "MEDICAL UNFIT"
                        : "VISA REJECTED"
                    } during compliance review. Progress is locked until cleared by an authorised officer.`}
              </p>
            </div>
          </div>
        )}
      </AppCard>

      {showActionBox && (
        <AppCard>
          <AppCardHeader
            title={locale === "bn" ? "ধাপ পরিবর্তন" : "Stage Actions"}
          />

          {isStaff ? (
            <form onSubmit={handleTransitionSubmit} className="mt-4 space-y-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="target-stage"
                  className="block text-xs font-medium text-text-theme"
                >
                  {locale === "bn" ? "লক্ষ্য ধাপ" : "Target stage"}
                </label>
                <select
                  id="target-stage"
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as WorkflowStage)}
                  className="h-9.5 w-full rounded-md border border-input-border bg-input-bg px-3 text-xs text-text-theme"
                >
                  {ENUM_STAGE_LIST.map((stageKey) => (
                    <option key={stageKey} value={stageKey}>
                      {t(`workflow.${stageKey}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="transition-notes"
                  className="block text-xs font-medium text-text-theme"
                >
                  {locale === "bn" ? "মন্তব্য" : "Remarks"}
                </label>
                <textarea
                  id="transition-notes"
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  placeholder={
                    locale === "bn"
                      ? "পাসপোর্ট, ভিসা বা ফ্লাইট সংক্রান্ত মন্তব্য..."
                      : "Passport, visa or flight remarks..."
                  }
                  rows={3}
                  className="w-full resize-none rounded-md border border-input-border bg-input-bg px-3 py-2 text-xs text-text-theme"
                />
                <p className="text-[11px] leading-relaxed text-text-soft">
                  {locale === "bn"
                    ? "কিছু ধাপে ডকুমেন্ট বা মন্তব্য বাধ্যতামূলক; সার্ভার তা যাচাই করবে।"
                    : "Some stages require documents or remarks — the server validates this."}
                </p>
              </div>

              <AppButton type="submit" className="w-full">
                <Play className="h-3.5 w-3.5" />
                {locale === "bn" ? "ধাপ পরিবর্তন করুন" : "Commit transition"}
              </AppButton>
            </form>
          ) : (
            <p className="mt-4 text-xs leading-relaxed text-text-soft">
              {locale === "bn"
                ? "শুধুমাত্র এজেন্সির কর্মকর্তারা ধাপ পরিবর্তন করতে পারেন। এজেন্ট ও প্রার্থীদের জন্য টাইমলাইন রিড-অনলি।"
                : "Only agency staff can execute workflow transitions. Agents and candidates see a read-only timeline."}
            </p>
          )}
        </AppCard>
      )}
    </div>
  );
}

export default WorkflowStepper;
