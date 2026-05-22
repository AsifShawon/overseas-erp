"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import AppModal from "./AppModal";
import AppButton from "./AppButton";
import AppInput from "./AppInput";

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (val: string) => void;
  title: string;
  description: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
}

export function PromptDialog({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  placeholder = "Enter value...",
  defaultValue = "",
  confirmLabel = "Submit",
  cancelLabel = "Cancel",
  isDanger = false,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError(null);
    }
  }, [isOpen, defaultValue]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("This field is required.");
      return;
    }
    onSubmit(trimmed);
  };

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-text-muted leading-relaxed font-semibold">
            {description}
          </p>
        </div>

        <div className="space-y-1">
          <textarea
            required
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder={placeholder}
            rows={3}
            className="w-full rounded-xl border border-border-theme bg-white px-3.5 py-2 text-xs text-text-theme placeholder:text-text-soft outline-none transition-all focus:border-primary-theme focus:ring-1 focus:ring-primary-theme dark:bg-slate-900"
          />
          {error && (
            <p className="text-[10px] text-danger-theme font-semibold">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-theme">
          <AppButton variant="secondary" type="button" onClick={onClose}>
            {cancelLabel}
          </AppButton>
          <AppButton
            variant={isDanger ? "danger" : "primary"}
            type="submit"
            disabled={!value.trim()}
          >
            {confirmLabel}
          </AppButton>
        </div>
      </form>
    </AppModal>
  );
}

export default PromptDialog;
