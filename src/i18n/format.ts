import { Locale } from "./types";

export function formatDate(value: string | Date | null | undefined, locale: Locale): string {
  if (!value) return "N/A";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "N/A";

  const targetLocale = locale === "bn" ? "bn-BD" : "en";
  return new Intl.DateTimeFormat(targetLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined, locale: Locale): string {
  if (!value) return "N/A";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "N/A";

  const targetLocale = locale === "bn" ? "bn-BD" : "en";
  return new Intl.DateTimeFormat(targetLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatNumber(value: number | null | undefined, locale: Locale): string {
  if (value === null || value === undefined) return "0";
  const targetLocale = locale === "bn" ? "bn-BD" : "en";
  return new Intl.NumberFormat(targetLocale).format(value);
}

export function formatCurrency(value: number | null | undefined, currency: string = "BDT", locale: Locale): string {
  if (value === null || value === undefined) return "0";
  const formattedNum = formatNumber(value, locale);
  const symbol = (currency === "BDT" || currency === "USD") ? "৳" : currency;
  return `${symbol}${formattedNum}`;
}
