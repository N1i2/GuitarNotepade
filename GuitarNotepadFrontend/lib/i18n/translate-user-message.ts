import { enMessages, type MessageKey } from "@/lib/i18n/messages";
import type { Locale } from "@/lib/i18n/storage";
import {
  TOAST_EXACT_MAP,
  TOAST_PARTIAL_MAP,
  TOAST_TEMPLATE_MAP,
} from "@/lib/i18n/toast-messages";

export type TranslateFn = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

function isMessageKey(value: string): value is MessageKey {
  return value in enMessages;
}

function isAlreadyLocalized(message: string, locale: Locale): boolean {
  if (locale === "ru" && /[а-яА-ЯёЁ]/.test(message)) {
    return true;
  }

  return false;
}

export function translateUserMessage(
  message: string,
  t: TranslateFn,
  locale: Locale,
): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return trimmed;
  }

  if (isAlreadyLocalized(trimmed, locale)) {
    return trimmed;
  }

  if (isMessageKey(trimmed)) {
    return t(trimmed);
  }

  const exactKey = TOAST_EXACT_MAP[trimmed];
  if (exactKey) {
    return t(exactKey);
  }

  for (const template of TOAST_TEMPLATE_MAP) {
    const match = trimmed.match(template.pattern);
    if (match) {
      return t(template.key, template.params(match));
    }
  }

  for (const partial of TOAST_PARTIAL_MAP) {
    if (trimmed.includes(partial.includes)) {
      return t(partial.key);
    }
  }

  return trimmed;
}
