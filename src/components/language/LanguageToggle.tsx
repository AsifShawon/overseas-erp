"use client";

import React from "react";
import { useLanguage } from "@/i18n/LanguageContext";

export function LanguageToggle() {
  const { locale, setLocale, mounted } = useLanguage();

  if (!mounted) {
    return (
      <div className="h-7 w-20 animate-pulse rounded-lg bg-bg-muted border border-border-theme"></div>
    );
  }

  return (
    <div className="flex items-center rounded-lg bg-bg-muted p-0.5 border border-border-theme transition-all duration-200">
      <button
        onClick={() => setLocale("bn")}
        type="button"
        className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer select-none ${
          locale === "bn"
            ? "bg-primary-theme text-white shadow-sm"
            : "text-text-soft hover:text-text-theme"
        }`}
      >
        বাংলা
      </button>
      <button
        onClick={() => setLocale("en")}
        type="button"
        className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer select-none ${
          locale === "en"
            ? "bg-primary-theme text-white shadow-sm"
            : "text-text-soft hover:text-text-theme"
        }`}
      >
        EN
      </button>
    </div>
  );
}

export default LanguageToggle;
