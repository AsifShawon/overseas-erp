"use client";

import React from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Accessible label — falls back to the placeholder. */
  ariaLabel?: string;
}

/** The single search field style used across every list screen. */
export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
  ariaLabel,
}: SearchInputProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-soft"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        className="h-9 w-full rounded-md border border-input-border bg-input-bg pl-8.5 pr-8 text-xs text-text-theme"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-sm text-text-soft transition-colors hover:bg-bg-muted hover:text-text-theme cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
