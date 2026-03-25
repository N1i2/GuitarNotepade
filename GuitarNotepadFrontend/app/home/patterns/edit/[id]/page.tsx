"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { PatternsService } from "@/lib/api/patterns-service";
import { Pattern, UpdatePatternDto } from "@/types/patterns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowLeft, Save, Music, X } from "lucide-react";
import { StrummingEditor } from "@/components/patterns/strumming-editor";
import { FingerStyleEditor } from "@/components/patterns/finger-style-editor";
import { PatternDiagram } from "@/components/patterns/pattern-diagram";
import { FingerStyleDiagram } from "@/components/patterns/finger-style-diagram";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormData {
  name: string;
  description: string;
  isFingerStyle: boolean;
  strummingPattern: string;
  fingerStylePattern: string;
}

interface ValidationErrors {
  name?: string;
  pattern?: string;
  description?: string;
  [key: string]: string | undefined;
}

interface ApiError {
  status?: number;
  message?: string;
}

type FormField = keyof FormData;

export default function EditPatternPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const patternId = params.id as string;

  const [originalPattern, setOriginalPattern] = useState<Pattern | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const toastRef = useRef(toast);
  const routerRef = useRef(router);

  useEffect(() => {
    toastRef.current = toast;
    routerRef.current = router;
  }, [toast, router]);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    isFingerStyle: false,
    strummingPattern: "",
    fingerStylePattern: "",
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  const parseFingerStyleSteps = (pattern: string): string[] => {
    const steps: string[] = [];
    let i = 0;

    while (i < pattern.length) {
      if (pattern[i] === "(") {
        const closeIndex = pattern.indexOf(")", i);
        if (closeIndex === -1) break;
        steps.push(pattern.substring(i, closeIndex + 1));
        i = closeIndex + 1;
      } else {
        steps.push(pattern[i]);
        i++;
      }
    }

    return steps;
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    const activePattern = formData.isFingerStyle
      ? formData.fingerStylePattern
      : formData.strummingPattern;

    if (!formData.name.trim()) {
      errors.name = "Pattern name is required";
    } else if (formData.name.length > 30) {
      errors.name = "Pattern name cannot exceed 30 characters";
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(formData.name)) {
      errors.name =
        "Only letters, numbers, spaces, hyphens and underscores allowed";
    }

    if (!activePattern.trim()) {
      errors.pattern = "Pattern must have at least 1 symbol";
    } else if (formData.isFingerStyle) {
      const steps = parseFingerStyleSteps(activePattern);
      if (steps.length > 32) {
        errors.pattern = "Fingerstyle pattern cannot exceed 32 steps";
      }
      if (!/^[123456.X()]+$/.test(activePattern)) {
        errors.pattern = "Only 1-6, X, ., () symbols allowed for fingerstyle";
      }

      let stack = 0;
      for (let i = 0; i < activePattern.length; i++) {
        if (activePattern[i] === "(") {
          if (stack > 0) {
            errors.pattern = "No nested parentheses allowed";
            break;
          }
          stack++;
        } else if (activePattern[i] === ")") {
          if (stack === 0) {
            errors.pattern = "Invalid parentheses";
            break;
          }
          stack--;
        }
      }
      if (stack !== 0) {
        errors.pattern = "Unclosed parentheses";
      }
    } else {
      if (activePattern.length > 16) {
        errors.pattern = "Strumming pattern cannot exceed 16 symbols";
      }
      if (!/^[DdUuX\-.]+$/.test(activePattern)) {
        errors.pattern =
          "Only D, d, U, u, X, -, . symbols allowed for strumming";
      }
    }

    if (formData.description.length > 500) {
      errors.description = "Description cannot exceed 500 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isFormValid = (): boolean => {
    const activePattern = formData.isFingerStyle
      ? formData.fingerStylePattern
      : formData.strummingPattern;

    const patternValid = formData.isFingerStyle
      ? activePattern.trim().length > 0 &&
        parseFingerStyleSteps(activePattern).length <= 32 &&
        /^[123456.X()]+$/.test(activePattern)
      : activePattern.trim().length > 0 &&
        activePattern.length <= 16 &&
        /^[DdUuX\-.]+$/.test(activePattern);

    return (
      formData.name.trim().length > 0 &&
      formData.name.length <= 30 &&
      /^[a-zA-Z0-9\s\-_]+$/.test(formData.name) &&
      patternValid &&
      formData.description.length <= 500
    );
  };

  const hasChanges = (): boolean => {
    if (!originalPattern) return false;

    return (
      formData.name !== originalPattern.name ||
      formData.description !== (originalPattern.description || "") ||
      formData.isFingerStyle !== originalPattern.isFingerStyle ||
      (formData.isFingerStyle
        ? formData.fingerStylePattern !== originalPattern.pattern
        : formData.strummingPattern !== originalPattern.pattern)
    );
  };

  const hasFieldChanged = (field: FormField): boolean => {
    if (!originalPattern) return false;

    switch (field) {
      case "name":
        return formData.name !== originalPattern.name;
      case "description":
        return formData.description !== (originalPattern.description || "");
      case "isFingerStyle":
        return formData.isFingerStyle !== originalPattern.isFingerStyle;
      case "strummingPattern":
      case "fingerStylePattern":
        const currentPattern = formData.isFingerStyle
          ? formData.fingerStylePattern
          : formData.strummingPattern;
        return currentPattern !== originalPattern.pattern;
      default:
        return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadPattern = async () => {
      if (!patternId) return;

      setIsLoading(true);
      setLoadError(null);

      try {
        const pattern = await PatternsService.getPatternById(patternId);

        if (!isMounted) return;

        setOriginalPattern(pattern);
        setFormData({
          name: pattern.name,
          description: pattern.description || "",
          isFingerStyle: pattern.isFingerStyle,
          strummingPattern: pattern.isFingerStyle ? "" : pattern.pattern,
          fingerStylePattern: pattern.isFingerStyle ? pattern.pattern : "",
        });
      } catch (error: unknown) {
        if (!isMounted) return;

        let errorMessage = "Failed to load pattern";
        const apiError = error as ApiError;

        if (apiError.status !== undefined) {
          if (apiError.status === 404) {
            errorMessage = "Pattern not found";
          } else if (apiError.message) {
            errorMessage = apiError.message;
          }
        }

        setLoadError(errorMessage);
        toastRef.current.error(errorMessage);

        setTimeout(() => {
          routerRef.current.push("/home/patterns");
        }, 100);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadPattern();

    return () => {
      isMounted = false;
    };
  }, [patternId]);

  const updateFormField = (field: FormField, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    setValidationErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleStrummingPatternChange = (newPattern: string) => {
    updateFormField("strummingPattern", newPattern);
  };

  const handleFingerStylePatternChange = (newPattern: string) => {
    updateFormField("fingerStylePattern", newPattern);
  };

  const handlePatternTypeChange = (value: string) => {
    const isFingerStyle = value === "fingerstyle";
    updateFormField("isFingerStyle", isFingerStyle);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSaving(true);
    try {
      const activePattern = formData.isFingerStyle
        ? formData.fingerStylePattern
        : formData.strummingPattern;

      const updateData: UpdatePatternDto = {};

      if (hasFieldChanged("name")) {
        updateData.name = formData.name.trim();
      }

      if (
        hasFieldChanged("strummingPattern") ||
        hasFieldChanged("fingerStylePattern")
      ) {
        updateData.pattern = activePattern;
      }

      if (hasFieldChanged("isFingerStyle")) {
        updateData.isFingerStyle = formData.isFingerStyle;
      }

      if (hasFieldChanged("description")) {
        updateData.description = formData.description.trim() || undefined;
      }

      if (Object.keys(updateData).length === 0) {
        toast.info("No changes detected");
        router.push(
          `/home/patterns/${encodeURIComponent(originalPattern?.name || "")}`,
        );
        return;
      }

      const updatedPattern = await PatternsService.updatePattern(
        patternId,
        updateData,
      );

      toast.success(`Pattern "${updatedPattern.name}" updated successfully!`);

      router.push(`/home/patterns/${encodeURIComponent(updatedPattern.name)}`);
    } catch (error: unknown) {
      let errorMessage = "Failed to update pattern";
      const apiError = error as ApiError;

      if (apiError.status !== undefined) {
        if (apiError.message === null) {
          errorMessage = "Pattern with this name already exists";
        } else if (apiError.status === 403) {
          errorMessage = "You don't have permission to edit this pattern";
          router.push(
            `/home/patterns/${encodeURIComponent(originalPattern?.name || "")}`,
          );
        } else if (apiError.status === 404) {
          errorMessage = "Pattern not found";
          router.push("/home/patterns");
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
      setShowConfirmDialog(false);
    }
  };

  const handleCancel = () => {
    if (!hasChanges()) {
      if (originalPattern) {
        router.push(
          `/home/patterns/${encodeURIComponent(originalPattern.name)}`,
        );
      } else {
        router.push("/home/patterns");
      }
      return;
    }

    if (
      confirm(
        "You have unsaved changes. Are you sure you want to discard them?",
      )
    ) {
      if (originalPattern) {
        router.push(
          `/home/patterns/${encodeURIComponent(originalPattern.name)}`,
        );
      } else {
        router.push("/home/patterns");
      }
    }
  };

  const handleReset = () => {
    if (originalPattern) {
      setFormData({
        name: originalPattern.name,
        description: originalPattern.description || "",
        isFingerStyle: originalPattern.isFingerStyle,
        strummingPattern: originalPattern.isFingerStyle
          ? ""
          : originalPattern.pattern,
        fingerStylePattern: originalPattern.isFingerStyle
          ? originalPattern.pattern
          : "",
      });
      setValidationErrors({});
      toast.info("All changes have been reset");
    }
  };

  const canEdit = user?.id === originalPattern?.createdByUserId;

  if (loadError && !isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Pattern</h3>
            <p className="text-muted-foreground mt-2">{loadError}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/home/patterns")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patterns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!originalPattern) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Pattern not found</h3>
            <p className="text-muted-foreground mt-2">
              The pattern you're trying to edit may have been deleted.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/home/patterns")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patterns
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Permission Denied</h3>
            <p className="text-muted-foreground mt-2">
              You don't have permission to edit this pattern.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() =>
                router.push(
                  `/home/patterns/${encodeURIComponent(originalPattern.name)}`,
                )
              }
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pattern
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activePattern = formData.isFingerStyle
    ? formData.fingerStylePattern
    : formData.strummingPattern;

  const changedFieldsCount = [
    hasFieldChanged("name"),
    hasFieldChanged("description"),
    hasFieldChanged("isFingerStyle"),
    hasFieldChanged("strummingPattern") ||
      hasFieldChanged("fingerStylePattern"),
  ].filter(Boolean).length;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(
                  `/home/patterns/${encodeURIComponent(originalPattern.name)}`,
                )
              }
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Pattern
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Edit Pattern</h1>
            <p className="text-muted-foreground mt-2">
              Edit pattern details for:{" "}
              <span className="font-bold">{originalPattern.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges() && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <X className="h-4 w-4 mr-2" />
                Reset Changes
              </Button>
            )}
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                hasChanges()
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              }`}
            >
              {hasChanges()
                ? `${changedFieldsCount} field${
                    changedFieldsCount > 1 ? "s" : ""
                  } changed`
                : "No changes"}
            </div>
          </div>
        </div>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">
                  Original information
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Created by
                    </div>
                    <div className="font-medium">
                      {originalPattern.createdByNikName || "Unknown"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Created on
                    </div>
                    <div className="font-medium">
                      {new Date(originalPattern.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {originalPattern.updatedAt && (
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Last updated
                      </div>
                      <div className="font-medium">
                        {new Date(
                          originalPattern.updatedAt,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Original pattern:
                </div>
                <div className="font-mono font-bold bg-muted px-3 py-1 rounded">
                  {originalPattern.pattern}
                </div>
                <div className="text-sm bg-background px-2 py-1 rounded capitalize">
                  {originalPattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Pattern Details</CardTitle>
                <CardDescription>
                  Update pattern name, type, pattern, and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Pattern Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Basic Strum, Reggae Pattern, Folk Strum"
                      value={formData.name}
                      onChange={(e) => updateFormField("name", e.target.value)}
                      onBlur={() => validateForm()}
                      aria-invalid={!!validationErrors.name}
                      aria-describedby={
                        validationErrors.name
                          ? "edit-pattern-name-error"
                          : undefined
                      }
                      className={
                        hasFieldChanged("name") ? "border-amber-400" : ""
                      }
                    />
                    {validationErrors.name && (
                      <span
                        id="edit-pattern-name-error"
                        className="text-sm text-red-500"
                      >
                        {validationErrors.name}
                      </span>
                    )}
                    {hasFieldChanged("name") && (
                      <div className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Changed from:{" "}
                        <span className="font-mono">
                          {originalPattern.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="patternType">Pattern Type *</Label>
                    <Select
                      value={
                        formData.isFingerStyle ? "fingerstyle" : "strumming"
                      }
                      onValueChange={handlePatternTypeChange}
                    >
                      <SelectTrigger
                        className={
                          hasFieldChanged("isFingerStyle")
                            ? "border-amber-400"
                            : ""
                        }
                      >
                        <SelectValue placeholder="Select pattern type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="strumming">
                          Strumming Pattern
                        </SelectItem>
                        <SelectItem value="fingerstyle">
                          Fingerstyle Pattern
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {hasFieldChanged("isFingerStyle") && (
                      <div className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Changed from:{" "}
                        <span className="capitalize">
                          {originalPattern.isFingerStyle
                            ? "Fingerstyle"
                            : "Strumming"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Edit Pattern * (max{" "}
                      {formData.isFingerStyle ? "32 steps" : "16 symbols"})
                    </Label>
                    {formData.isFingerStyle ? (
                      <FingerStyleEditor
                        pattern={formData.fingerStylePattern}
                        onPatternChange={handleFingerStylePatternChange}
                      />
                    ) : (
                      <StrummingEditor
                        pattern={formData.strummingPattern}
                        onPatternChange={handleStrummingPatternChange}
                      />
                    )}
                    {validationErrors.pattern && (
                      <span className="text-sm text-red-500">
                        {validationErrors.pattern}
                      </span>
                    )}
                    {hasFieldChanged("strummingPattern") ||
                    hasFieldChanged("fingerStylePattern") ? (
                      <div className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Changed from:{" "}
                        <span className="font-mono">
                          {originalPattern.pattern}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add notes about this pattern, when to use it, tempo suggestions..."
                      className={`min-h-[100px] ${
                        hasFieldChanged("description") ? "border-amber-400" : ""
                      }`}
                      value={formData.description}
                      onChange={(e) =>
                        updateFormField("description", e.target.value)
                      }
                      onBlur={() => validateForm()}
                      aria-invalid={!!validationErrors.description}
                      aria-describedby={
                        validationErrors.description
                          ? "edit-pattern-description-error"
                          : undefined
                      }
                    />
                    <div className="flex justify-between">
                      {validationErrors.description && (
                        <span
                          id="edit-pattern-description-error"
                          className="text-sm text-red-500"
                        >
                          {validationErrors.description}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formData.description.length}/500 characters
                      </p>
                    </div>
                    {hasFieldChanged("description") && (
                      <div className="text-xs text-amber-600">
                        <div className="font-medium mb-1">
                          Original description:
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {originalPattern.description || "(empty)"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      className="flex-1"
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!hasChanges() || isSaving || !isFormValid()}
                      className="flex-1"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {changedFieldsCount > 0
                            ? `Update ${changedFieldsCount} Field${
                                changedFieldsCount > 1 ? "s" : ""
                              }`
                            : "Update Pattern"}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  How your updated pattern will appear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 from-background to-muted/20">
                  {formData.isFingerStyle ? (
                    <FingerStyleDiagram
                      pattern={formData.fingerStylePattern}
                      name={formData.name}
                    />
                  ) : (
                    <PatternDiagram
                      pattern={formData.strummingPattern}
                      name={formData.name}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Current Pattern Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Pattern Notation
                  </div>
                  <div className="font-mono text-xl font-bold bg-muted p-3 rounded text-center break-all">
                    {activePattern || "(empty)"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="font-medium capitalize">
                      {formData.isFingerStyle ? "Fingerstyle" : "Strumming"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Length</div>
                    <div className="font-medium">
                      {formData.isFingerStyle
                        ? `${
                            parseFingerStyleSteps(activePattern).length
                          }/32 steps`
                        : `${activePattern.length}/16 symbols`}
                    </div>
                  </div>
                </div>

                {formData.description && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Description
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap p-3 bg-muted/30 rounded">
                      {formData.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <AlertTriangle className="h-6 w-6 text-primary" />
              </div>
              <AlertDialogTitle>Confirm Update</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Are you sure you want to update this pattern? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Changes summary:</h4>

              {hasFieldChanged("name") && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Pattern name:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      {originalPattern.name}
                    </span>
                    <span>→</span>
                    <span className="font-bold text-primary">
                      {formData.name}
                    </span>
                  </div>
                </div>
              )}

              {hasFieldChanged("isFingerStyle") && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Pattern type:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground line-through capitalize">
                      {originalPattern.isFingerStyle
                        ? "Fingerstyle"
                        : "Strumming"}
                    </span>
                    <span>→</span>
                    <span className="font-bold text-primary capitalize">
                      {formData.isFingerStyle ? "Fingerstyle" : "Strumming"}
                    </span>
                  </div>
                </div>
              )}

              {(hasFieldChanged("strummingPattern") ||
                hasFieldChanged("fingerStylePattern")) && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Pattern:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-mono line-through">
                      {originalPattern.pattern}
                    </span>
                    <span>→</span>
                    <span className="font-bold text-primary font-mono">
                      {activePattern}
                    </span>
                  </div>
                </div>
              )}

              {hasFieldChanged("description") && (
                <div className="py-2">
                  <span className="text-sm">Description updated</span>
                </div>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  {changedFieldsCount > 0
                    ? `Only ${changedFieldsCount} field${
                        changedFieldsCount > 1 ? "s" : ""
                      } will be updated. All users will see the updated version of this pattern.`
                    : "No fields will be updated."}
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              disabled={isSaving || changedFieldsCount === 0}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                `Update ${changedFieldsCount} Field${
                  changedFieldsCount > 1 ? "s" : ""
                }`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
