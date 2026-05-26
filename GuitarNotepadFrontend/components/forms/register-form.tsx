"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  validatePassword,
  validatePasswordMatch,
} from "@/lib/utils/password-validation";
import { PasswordStrength } from "./password-strength";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/api/client";
import { parseBackendError, showErrorToast } from "@/lib/utils/error-parser";
import { useTranslation } from "@/hooks/use-translation";

type RegisterFormValues = {
  email: string;
  nikName: string;
  password: string;
  confirmPassword: string;
};

export function RegisterForm() {
  const { register: registerAuth } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();

  const passwordMessages = useMemo(
    () => ({
      minLength: t("auth.validation.passwordMinLength"),
      uppercase: t("auth.validation.passwordUppercase"),
      lowercase: t("auth.validation.passwordLowercase"),
      number: t("auth.validation.passwordNumber"),
      special: t("auth.validation.passwordSpecial"),
      common: t("auth.validation.passwordCommon"),
    }),
    [t],
  );

  const registerSchema = useMemo(
    () =>
      z
        .object({
          email: z
            .string()
            .email(t("auth.validation.emailInvalid"))
            .min(1, t("auth.validation.emailRequired")),
          nikName: z
            .string()
            .min(3, t("auth.validation.nicknameMin"))
            .max(50, t("auth.validation.nicknameMax")),
          password: z.string().min(1, t("auth.validation.passwordRequired")),
          confirmPassword: z
            .string()
            .min(1, t("auth.validation.confirmRequired")),
        })
        .superRefine((data, ctx) => {
          const passwordValidation = validatePassword(
            data.password,
            passwordMessages,
          );
          if (!passwordValidation.isValid) {
            passwordValidation.errors.forEach((error) => {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: error,
                path: ["password"],
              });
            });
          }

          if (!validatePasswordMatch(data.password, data.confirmPassword)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t("auth.validation.passwordMismatch"),
              path: ["confirmPassword"],
            });
          }
        }),
    [t, passwordMessages],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      nikName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = watch("password");

  const onSubmit = async (values: RegisterFormValues) => {
    const loadingToastId = toast.loading(t("auth.register.loadingToast"));

    try {
      await registerAuth(
        values.email,
        values.nikName,
        values.password,
        values.confirmPassword,
      );
      toast.dismiss(loadingToastId);
      toast.success(t("auth.register.successTitle"), {
        description: t("auth.register.successDescription").replace(
          "{name}",
          values.nikName,
        ),
        duration: 3000,
      });
      router.push("/home");
    } catch (err: unknown) {
      toast.dismiss(loadingToastId);

      if (err instanceof ApiError || err instanceof Error) {
        const { fieldErrors } = parseBackendError(err);

        if (Object.keys(fieldErrors).length > 0) {
          Object.entries(fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof RegisterFormValues, {
              type: "manual",
              message: messages.join(", "),
            });
          });
        }

        showErrorToast(err, toast);
      } else {
        toast.error(t("auth.register.failed"), {
          description: t("auth.register.failedDescription"),
        });
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t("auth.register.title")}</CardTitle>
        <CardDescription>{t("auth.register.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.login.email")}</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
            />
            {errors.email && (
              <span id="register-email-error" className="text-sm text-red-500">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="nikName">{t("auth.register.nickname")}</Label>
            <Input
              id="nikName"
              type="text"
              placeholder="guitar_hero"
              {...register("nikName")}
              aria-invalid={!!errors.nikName}
              aria-describedby={
                errors.nikName ? "register-nikname-error" : undefined
              }
            />
            {errors.nikName && (
              <span
                id="register-nikname-error"
                className="text-sm text-red-500"
              >
                {errors.nikName.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t("auth.register.passwordPlaceholder")}
              {...register("password")}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "register-password-error" : undefined
              }
            />
            <PasswordStrength password={password} />
            {errors.password && (
              <span
                id="register-password-error"
                className="text-sm text-red-500"
              >
                {errors.password.message}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("auth.register.confirmPassword")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t("auth.register.confirmPlaceholder")}
              {...register("confirmPassword")}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword
                  ? "register-confirm-password-error"
                  : undefined
              }
            />
            {errors.confirmPassword && (
              <span
                id="register-confirm-password-error"
                className="text-sm text-red-500"
              >
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting
              ? t("auth.register.submitting")
              : t("auth.register.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
