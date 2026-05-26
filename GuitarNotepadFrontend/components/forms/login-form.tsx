"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast } from "@/lib/utils/error-parser";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("auth.validation.emailInvalid")),
        password: z.string().min(1, t("auth.validation.passwordEmpty")),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginFormValues) => {
    const loadingToastId = toast.loading(t("auth.login.loadingToast"));
    try {
      await login(values.email, values.password);
      toast.dismiss(loadingToastId);
      toast.success(t("auth.login.successToast"));
      router.push("/home");
    } catch (err) {
      toast.dismiss(loadingToastId);
      showErrorToast(err, toast);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">{t("auth.login.title")}</CardTitle>
        <CardDescription>{t("auth.login.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.login.email")}</Label>
            <Input
              id="email"
              autoComplete="username"
              type="email"
              placeholder="m@example.com"
              {...register("email")}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "login-email-error" : undefined}
            />
            {errors.email && (
              <span id="login-email-error" className="text-red-500 text-xs">
                {errors.email.message}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "login-password-error" : undefined
              }
            />
            {errors.password && (
              <span id="login-password-error" className="text-red-500 text-xs">
                {errors.password.message}
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
              ? t("auth.login.submitting")
              : t("auth.login.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
