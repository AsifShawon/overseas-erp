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

  // Support escape key dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",      // 448px
    md: "max-w-xl",      // 576px
    lg: "max-w-3xl",      // 768px (corresponds to 640-760px range)
    xl: "max-w-5xl",      // 1024px
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      {/* Backdrop Click Dismiss */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal Card Panel */}
      <div
        className={`relative w-full mx-4 sm:mx-auto ${sizeClasses[size]} max-h-[90vh] flex flex-col rounded-2xl border border-border-theme bg-surface p-6 md:p-8 shadow-2xl transition-all duration-300 dark:bg-slate-950 animate-in zoom-in-95 duration-200`}
      >
        {/* Header Block */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-border-theme shrink-0">
          {title ? (
            <h3 className="text-lg md:text-xl font-bold text-text-theme leading-normal">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-soft hover:bg-bg-muted hover:text-text-theme transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Block */}
        <div className="flex-1 overflow-y-auto text-[15px] leading-relaxed text-text-theme pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AppModal;
