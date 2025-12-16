"use client";

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

const registerSchema = z
  .object({
    email: z.string().email("Enter a valid email").min(1, "Email is required"),
    nikName: z
      .string()
      .min(3, "Nickname must be at least 3 characters long")
      .max(50, "Nickname is too long"),
    password: z.string().min(1, "Password is required"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .superRefine((data, ctx) => {
    const passwordValidation = validatePassword(data.password);
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
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const { register: registerAuth } = useAuth();
  const router = useRouter();
  const toast = useToast();

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
    const loadingToastId = toast.loading("Creating your account...");

    try {
      await registerAuth(
        values.email,
        values.nikName,
        values.password,
        values.confirmPassword
      );
      toast.dismiss(loadingToastId);
      toast.success("Account created successfully! 🎸", {
        description: `Welcome to GuitarNotepad, ${values.nikName}!`,
        duration: 3000,
      });
      router.push("/home");
    } catch (err: unknown) {
      toast.dismiss(loadingToastId);

      if (err instanceof ApiError || err instanceof Error) {
        const { fieldErrors, generalError } = parseBackendError(err);

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
        toast.error("Registration failed", {
          description: "Please try again later",
        });
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Register</CardTitle>
        <CardDescription>Create your GuitarNotepad account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="nikName">Nickname</Label>
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter a strong password"
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
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
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
            {isSubmitting ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
