"use client";

import { useCallback, useMemo } from "react";
import { toast as sonnerToast } from "sonner";
import { useI18n } from "@/components/providers/i18n-provider";
import { translateUserMessage } from "@/lib/i18n/translate-user-message";

export interface ToastOptions {
  className?: string;
  closeButton?: boolean;
  description?: string;
  descriptionClassName?: string;
  style?: React.CSSProperties;
  cancelButtonStyle?: React.CSSProperties;
  actionButtonStyle?: React.CSSProperties;
  duration?: number;
  unstyled?: boolean;
  classNames?: Record<string, string>;
  closeButtonAriaLabel?: string;
  toasterId?: string;
}

export interface ToastInterface {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  loading: (message: string, options?: ToastOptions) => string | number;
  message: (message: string, options?: ToastOptions) => void;
  promise: typeof sonnerToast.promise;
  dismiss: (id?: string | number) => string | number;
}

export const useToast = (): ToastInterface => {
  const { t, locale } = useI18n();

  const localize = useCallback(
    (message: string) => translateUserMessage(message, t, locale),
    [t, locale],
  );

  const localizeOptions = useCallback(
    (options?: ToastOptions): ToastOptions | undefined => {
      if (!options?.description) {
        return options;
      }

      return {
        ...options,
        description: localize(options.description),
      };
    },
    [localize],
  );

  return useMemo(
    () => ({
      success: (message: string, options?: ToastOptions) =>
        sonnerToast.success(localize(message), localizeOptions(options)),
      error: (message: string, options?: ToastOptions) =>
        sonnerToast.error(localize(message), localizeOptions(options)),
      warning: (message: string, options?: ToastOptions) =>
        sonnerToast.warning(localize(message), localizeOptions(options)),
      info: (message: string, options?: ToastOptions) =>
        sonnerToast.info(localize(message), localizeOptions(options)),
      loading: (message: string, options?: ToastOptions) =>
        sonnerToast.loading(localize(message), localizeOptions(options)),
      message: (message: string, options?: ToastOptions) =>
        sonnerToast.message(localize(message), localizeOptions(options)),
      promise: sonnerToast.promise,
      dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    }),
    [localize, localizeOptions],
  );
};
