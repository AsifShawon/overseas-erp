"use client";

import React, { useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

export interface DropdownItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface DropdownMenuProps {
  items: DropdownItem[];
  /** Custom trigger. Defaults to a kebab icon button. */
  trigger?: React.ReactNode;
  align?: "left" | "right";
  ariaLabel?: string;
}

/**
 * Kebab / overflow menu used for table row actions, so rows never carry five
 * competing buttons. Closes on outside click and on Escape.
 */
export function DropdownMenu({
  items,
  trigger,
  align = "right",
  ariaLabel = "Open actions menu",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex h-8 w-8 items-center justify-center rounded-md text-text-soft transition-colors hover:bg-bg-muted hover:text-text-theme cursor-pointer"
      >
        {trigger || <MoreVertical className="h-4 w-4" />}
      </button>

      {open && (
        <div
          role="menu"
          className={`app-popover-enter absolute z-30 mt-1 min-w-44 overflow-hidden rounded-md border border-border-theme bg-surface-elevated py-1 shadow-md ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                  item.danger
                    ? "text-danger-theme hover:bg-danger-soft"
                    : "text-text-muted hover:bg-bg-muted hover:text-text-theme"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DropdownMenu;
