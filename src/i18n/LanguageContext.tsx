"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Locale } from "./types";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("bn");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read user setting on load, default strictly to Bangla ("bn")
    const storedLocale = localStorage.getItem("overseas-erp-locale") as Locale | null;
    if (storedLocale === "en") {
      setLocaleState("en");
    } else {
      setLocaleState("bn");
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("overseas-erp-locale", newLocale);
  };

  const toggleLocale = () => {
    const nextLocale = locale === "bn" ? "en" : "bn";
    setLocale(nextLocale);
  };

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    if (locale === "bn") {
      root.setAttribute("lang", "bn-BD");
    } else {
      root.setAttribute("lang", "en");
    }
  }, [locale, mounted]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, toggleLocale, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
