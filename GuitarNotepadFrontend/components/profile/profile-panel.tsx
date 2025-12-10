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

export function ProfilePanel() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nikName: "",
    bio: "",
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string[] }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string>("");

  useEffect(() => {
    if (user) {
      setForm({
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
  }, [user]);

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

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string[] } = {};

    if (form.currentPassword || form.password || form.confirmPassword) {
      if (!form.currentPassword) {
        newErrors.currentPassword = [
          "Current password is required to change password",
        ];
      }

      if (!form.password) {
        newErrors.password = ["New password is required"];
      }

      if (!form.confirmPassword) {
        newErrors.confirmPassword = ["Please confirm your new password"];
      }

      if (form.currentPassword && form.password && form.confirmPassword) {
        const passwordValidation = validatePassword(form.password);
        if (!passwordValidation.isValid) {
          newErrors.password = passwordValidation.errors;
        }

        if (form.password !== form.confirmPassword) {
          newErrors.confirmPassword = ["Passwords do not match"];
        }

        const { strength } = getPasswordStrength(form.password);
        if (strength === "very-weak" || strength === "weak") {
          if (!newErrors.password) newErrors.password = [];
          newErrors.password.push(
            "Password is too weak. Please choose a stronger password."
          );
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSaving(true);

    try {
      if (form.currentPassword && !form.password) {
        toast.error("Enter your new password please");
        setIsSaving(false);
        return;
      } else if (form.password && !form.currentPassword) {
        toast.error("Enter your current password please");
        setIsSaving(false);
        return;
      }

      const payload: updateUserInfo = {
        nikName: form.nikName,
        bio: form.bio,
      };

      if (avatarFile) {
        const base64 = await fileToBase64(avatarFile);
        payload.avatarBase64 = base64;
      }

      if (form.currentPassword && form.password && form.confirmPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.password;
        payload.confirmNewPassword = form.confirmPassword;
      }

      const response = await ProfileService.updateProfile(payload);

      if (response) {
        setUser(response);

        if (response.avatarUrl) {
          processAvatarFromBackend(response.avatarUrl);
        } else {
          setAvatarSrc("");
        }

        setForm((prev) => ({
          ...prev,
          nikName: response.nikName || "",
          bio: response.bio || "",
          password: "",
          confirmPassword: "",
        }));

        setAvatarFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }

        setErrors({});

        toast.success("Profile updated successfully");
      }
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error?.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    clearFieldError(field);
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
        {/* Информационное сообщение */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            All changes are saved automatically when you click "Save Changes"
          </AlertDescription>
        </Alert>

        {/* Avatar в карточке */}
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

                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
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
          {/* Nickname */}
          <div className="space-y-2">
            <Label className="mb-1.5" htmlFor="nikName">
              Nickname
            </Label>
            <Input
              id="nikName"
              value={form.nikName}
              onChange={(e) => handleInputChange("nikName", e.target.value)}
              placeholder="Your nickname"
            />
            {errors.nikName && (
              <div className="text-sm text-red-500 mt-1">
                {errors.nikName.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label className="mb-1.5" htmlFor="bio">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={form.bio}
              onChange={(e) => handleInputChange("bio", e.target.value)}
              placeholder="Tell us about yourself"
              className="min-h-[120px]"
            />
          </div>
        </div>

        {/* Passwords */}
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
                value={form.currentPassword}
                onChange={(e) =>
                  handleInputChange("currentPassword", e.target.value)
                }
                placeholder="Enter current password"
              />
              {errors.currentPassword && (
                <div className="text-sm text-red-500 mt-1">
                  {errors.currentPassword.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="mb-1.5" htmlFor="password">
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Leave empty to keep current"
                />
                {errors.password && (
                  <div className="text-sm text-red-500 mt-1">
                    {errors.password.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="mb-1.5" htmlFor="confirmPassword">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm new password"
                />
                {errors.confirmPassword && (
                  <div className="text-sm text-red-500 mt-1">
                    {errors.confirmPassword.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <PasswordStrength password={form.password} />

            <p className="text-sm text-muted-foreground">
              Leave password fields empty if you don&apos;t want to change it
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="w-full md:w-auto"
          >
            {isSaving ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
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
