"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { enMessages, ruMessages, type MessageKey } from "@/lib/i18n/messages";
import {
  type Locale,
  persistLocale,
  readStoredOrDetectLocale,
} from "@/lib/i18n/storage";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const next = readStoredOrDetectLocale();
    setLocaleState(next);
    document.documentElement.lang = next;
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: MessageKey) => {
      const table = locale === "ru" ? ruMessages : enMessages;
      return table[key] ?? enMessages[key];
    },
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  if (!ready) {
    return (
      <I18nContext.Provider
        value={{
          locale: "en",
          setLocale,
          t: (key) => enMessages[key],
        }}
      >
        {children}
      </I18nContext.Provider>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
