import { useI18n } from "@/components/providers/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages";

export function useTranslation() {
  const { t, locale, setLocale } = useI18n();
  return { t, locale, setLocale };
}

export type { MessageKey };
