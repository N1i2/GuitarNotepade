import { useMemo } from "react";
import { toast as sonnerToast } from "sonner";

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
  return useMemo(
    () => ({
      success: (message: string, options?: ToastOptions) =>
        sonnerToast.success(message, options),
      error: (message: string, options?: ToastOptions) =>
        sonnerToast.error(message, options),
      warning: (message: string, options?: ToastOptions) =>
        sonnerToast.warning(message, options),
      info: (message: string, options?: ToastOptions) =>
        sonnerToast.info(message, options),
      loading: (message: string, options?: ToastOptions) =>
        sonnerToast.loading(message, options),
      message: (message: string, options?: ToastOptions) =>
        sonnerToast.message(message, options),
      promise: sonnerToast.promise,
      dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    }),
    [],
  );
};
