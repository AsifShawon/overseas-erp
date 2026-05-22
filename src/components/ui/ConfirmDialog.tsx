"use client";

import React from "react";
import { AlertCircle, HelpCircle } from "lucide-react";
import AppModal from "./AppModal";
import AppButton from "./AppButton";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
}: ConfirmDialogProps) {
  return (
    <AppModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex gap-3 items-start">
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${
              isDanger
                ? "bg-rose-50 border-rose-100 text-rose-500 dark:bg-rose-950/20 dark:border-rose-900/30"
                : "bg-indigo-50 border-indigo-100 text-indigo-500 dark:bg-indigo-950/20 dark:border-indigo-900/30"
            }`}
          >
            {isDanger ? (
              <AlertCircle className="h-5 w-5 animate-pulse" />
            ) : (
              <HelpCircle className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-text-muted leading-relaxed font-semibold">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-theme">
          <AppButton variant="secondary" onClick={onClose}>
            {cancelLabel}
          </AppButton>
          <AppButton
            variant={isDanger ? "danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AppButton>
        </div>
      </div>
    </AppModal>
  );
}

export default ConfirmDialog;
