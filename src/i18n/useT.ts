"use client";

import { useLanguage } from "./LanguageContext";
import { bn } from "./locales/bn";
import { en } from "./locales/en";

export function useT() {
  const { locale } = useLanguage();
  const translations = locale === "bn" ? bn : en;

  const t = (key: string, variables?: Record<string, string | number>): string => {
    const parts = key.split(".");
    let current: any = translations;

    for (const part of parts) {
      if (current && typeof current === "object" && part in current) {
        current = current[part];
      } else {
        // Fallback to English dictionary if key is missing in active language
        let enFallback: any = en;
        let foundFallback = true;
        for (const subPart of parts) {
          if (enFallback && typeof enFallback === "object" && subPart in enFallback) {
            enFallback = enFallback[subPart];
          } else {
            foundFallback = false;
            break;
          }
        }
        return foundFallback && typeof enFallback === "string" ? enFallback : key;
      }
    }

    if (typeof current !== "string") {
      return key;
    }

    let text = current;
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }

    return text;
  };

  return { t, locale };
}

export default useT;
