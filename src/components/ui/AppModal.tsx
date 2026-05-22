"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function AppModal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: AppModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      {/* Backdrop Click Dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal Card Panel */}
      <div
        className={`relative w-full ${sizeClasses[size]} rounded-2xl border border-border-theme bg-surface p-6 shadow-2xl transition-all duration-300 dark:bg-slate-950 animate-in zoom-in-95 duration-200`}
      >
        {/* Header Block */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-theme">
          {title ? (
            <h3 className="text-sm font-bold text-text-theme">{title}</h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-soft hover:bg-bg-muted hover:text-text-theme transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Block */}
        <div className="text-xs text-text-theme">{children}</div>
      </div>
    </div>
  );
}

export default AppModal;
