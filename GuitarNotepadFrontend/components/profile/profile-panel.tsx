"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  Upload,
  UserIcon,
  X,
  AlertCircle,
  Shield,
} from "lucide-react";
import { ProfileService } from "@/lib/api/profile-service";
import { updateUserInfo } from "@/types/profile";
import { PasswordStrength } from "../forms/password-strength";
import {
  validatePassword,
  getPasswordStrength,
} from "@/lib/utils/password-validation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const profileSchema = z
  .object({
    nikName: z.string().min(3, "Min 3 chars").max(24, "Max 24 chars"),
    bio: z.string().max(400, "Max 400 chars").optional().or(z.literal("")),
    currentPassword: z.string().optional().or(z.literal("")),
    password: z.string().max(128, "Max 128 chars").optional().or(z.literal("")),
    confirmPassword: z
      .string()
      .max(128, "Max 128 chars")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => !data.password || (!!data.password && !!data.currentPassword),
    { message: "Введите текущий пароль", path: ["currentPassword"] }
  )
  .refine(
    (data) =>
      (!data.currentPassword && !data.password) ||
      data.password === data.confirmPassword,
    { message: "Пароли не совпадают", path: ["confirmPassword"] }
  )
  .refine(
    (data) => {
      if (data.password && data.password.length > 0) {
        const v = validatePassword(data.password);
        return v.isValid;
      }
      return true;
    },
    {
      message: "Слишком слабый пароль",
      path: ["password"],
    }
  );

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfilePanel() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string>("");

  const formDefaults: ProfileFormValues = {
    nikName: user?.nikName || "",
    bio: user?.bio || "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  };

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: formDefaults,
  });

  useEffect(() => {
    if (user) {
      reset({
        nikName: user.nikName || "",
        bio: user.bio || "",
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      if (user.avatarUrl) {
        processAvatarFromBackend(user.avatarUrl);
      } else {
        setAvatarSrc("");
      }
    }
  }, [user, reset]);

  const processAvatarFromBackend = (avatarData: string) => {
    if (!avatarData) {
      setAvatarSrc("");
      return;
    }
    if (avatarData.startsWith("data:")) {
      setAvatarSrc(avatarData);
      return;
    }
    const mimeType = avatarData.startsWith("/9j/")
      ? "image/jpeg"
      : avatarData.startsWith("iVBORw")
      ? "image/png"
      : "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${avatarData}`;
    setAvatarSrc(dataUrl);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (avatarFile) {
      if (!avatarFile.type.startsWith("image/")) {
        setError("nikName", {
          type: "manual",
          message: "Аватар должен быть изображением",
        });
        toast.error("Please select an image file");
        return;
      }
      if (avatarFile.size > 2 * 1024 * 1024) {
        setError("nikName", {
          type: "manual",
          message: "Image must be smaller than 2MB",
        });
        toast.error("Image must be smaller than 2MB");
        return;
      }
    }
    try {
      const payload: updateUserInfo = {
        nikName: data.nikName,
        bio: data.bio,
      };
      if (avatarFile) {
        const base64 = await fileToBase64(avatarFile);
        payload.avatarBase64 = base64;
      }
      if (data.currentPassword && data.password && data.confirmPassword) {
        payload.currentPassword = data.currentPassword;
        payload.newPassword = data.password;
        payload.confirmNewPassword = data.confirmPassword;
      }
      const response = await ProfileService.updateProfile(payload);
      if (response) {
        setUser(response);
        if (response.avatarUrl) {
          processAvatarFromBackend(response.avatarUrl);
        } else {
          setAvatarSrc("");
        }
        setAvatarFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success("Profile updated successfully");
        reset({
          nikName: response.nikName || "",
          bio: response.bio || "",
          currentPassword: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message || "Failed to save profile");
      } else {
        toast.error("Failed to save profile (unexpected error)");
      }
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const MAX_SIZE = 2 * 1024 * 1024;
    if (!file) {
      setAvatarFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Image must be smaller than 2MB");
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </div>
        <Button onClick={logout} variant="outline" size="sm">
          Logout
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All changes are saved automatically when you click "Save Changes"
          </AlertDescription>
        </Alert>
        <form
          className="space-y-8"
          onSubmit={handleSubmit(onSubmit)}
          autoComplete="off"
        >
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Profile Picture</h3>
                <p className="text-sm text-muted-foreground">
                  Upload your profile image
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-16 h-16 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {avatarFile ? "New image selected" : "Current avatar"}
                </p>
              </div>
              <div className="flex-1 space-y-4 min-w-0">
                <div>
                  <Label htmlFor="avatar" className="sr-only">
                    Upload avatar
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("avatar")?.click()}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose Image
                    </Button>
                    <Input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    {avatarFile && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAvatarFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                          if (user?.avatarUrl) {
                            processAvatarFromBackend(user.avatarUrl);
                          } else {
                            setAvatarSrc("");
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {avatarFile && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="truncate">{avatarFile.name}</span>
                      <span className="text-muted-foreground">
                        ({(avatarFile.size / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Recommended: Square image, at least 400×400px. Max 2MB.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="mb-1.5" htmlFor="nikName">
                Nickname
              </Label>
              <Input
                id="nikName"
                {...register("nikName")}
                placeholder="Your nickname"
                aria-invalid={!!errors.nikName}
                aria-describedby={
                  errors.nikName ? "profile-nickname-error" : undefined
                }
              />
              {errors.nikName && (
                <span
                  id="profile-nickname-error"
                  className="text-sm text-red-500 mt-1"
                >
                  {errors.nikName.message}
                </span>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                {...register("bio")}
                placeholder="Tell us about yourself"
                className="min-h-[120px]"
                aria-invalid={!!errors.bio}
                aria-describedby={errors.bio ? "profile-bio-error" : undefined}
              />
              {errors.bio && (
                <span
                  id="profile-bio-error"
                  className="text-sm text-red-500 mt-1"
                >
                  {errors.bio.message}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">Change Password</h3>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="mb-1.5">
                  Current password
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...register("currentPassword")}
                  placeholder="Enter current password"
                  aria-invalid={!!errors.currentPassword}
                  aria-describedby={
                    errors.currentPassword
                      ? "profile-current-password-error"
                      : undefined
                  }
                />
                {errors.currentPassword && (
                  <span
                    id="profile-current-password-error"
                    className="text-sm text-red-500 mt-1"
                  >
                    {errors.currentPassword.message}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    placeholder="Leave empty to keep current"
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "profile-password-error" : undefined
                    }
                  />
                  {errors.password && (
                    <span
                      id="profile-password-error"
                      className="text-sm text-red-500 mt-1"
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
                    {...register("confirmPassword")}
                    placeholder="Confirm new password"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={
                      errors.confirmPassword
                        ? "profile-confirm-password-error"
                        : undefined
                    }
                  />
                  {errors.confirmPassword && (
                    <span
                      id="profile-confirm-password-error"
                      className="text-sm text-red-500 mt-1"
                    >
                      {errors.confirmPassword.message}
                    </span>
                  )}
                </div>
              </div>
              <PasswordStrength password={""} />{" "}
              <p className="text-sm text-muted-foreground">
                Leave password fields empty if you don't want to change it
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              size="lg"
              className="w-full md:w-auto"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <div className="text-sm text-muted-foreground space-y-2">
          <div className="font-medium mb-1">Account Information</div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Email:</span>
            <span className="font-mono">{user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Role:</span>
            <span
              className={`px-2 py-1 rounded text-xs ${
                user?.role === "Admin"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted"
              }`}
            >
              {user?.role}
            </span>
          </div>
          <div>
            <span className="font-semibold">Member since:</span>{" "}
            {user?.createAt
              ? new Date(user.createAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "—"}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

export default ProfilePanel;
