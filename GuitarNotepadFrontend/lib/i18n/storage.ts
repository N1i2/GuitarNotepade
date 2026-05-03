export const LOCALE_STORAGE_KEY = "guitar-notepad-locale";

export type Locale = "en" | "ru";

export function readStoredOrDetectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "ru" || stored === "en") return stored;
  const nav = (navigator.language || "").toLowerCase();
  return nav.startsWith("ru") ? "ru" : "en";
}

export function persistLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}
