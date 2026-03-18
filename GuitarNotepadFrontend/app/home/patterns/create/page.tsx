"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { PatternsService } from "@/lib/api/patterns-service";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { StrummingEditor } from "@/components/patterns/strumming-editor";
import { PatternDiagram } from "@/components/patterns/pattern-diagram";
import { PatternValidationErrors } from "@/types/patterns";
import { FingerStyleEditor } from "@/components/patterns/finger-style-editor";
import { FingerStyleDiagram } from "@/components/patterns/finger-style-diagram";

interface ExtendedPatternFormData {
  name: string;
  description: string;
  isFingerStyle: boolean;
  strummingPattern: string;
  fingerStylePattern: string;
}

export default function CreatePatternPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ExtendedPatternFormData>({
    name: "",
    description: "",
    isFingerStyle: false,
    strummingPattern: "",
    fingerStylePattern: "",
  });
  const [validationErrors, setValidationErrors] =
    useState<PatternValidationErrors>({});

  const activePattern = formData.isFingerStyle
    ? formData.fingerStylePattern
    : formData.strummingPattern;

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

  const isValidFingerStylePattern = (pattern: string): boolean => {
    let stack = 0;
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === "(") {
        if (stack > 0) return false;
        stack++;
      } else if (pattern[i] === ")") {
        if (stack === 0) return false;
        stack--;
      }
    }
    return stack === 0;
  };

  const validateForm = (): boolean => {
    const errors: PatternValidationErrors = {};

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
      if (!isValidFingerStylePattern(activePattern)) {
        errors.pattern = "Invalid fingerstyle pattern format";
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
    const patternValid = formData.isFingerStyle
      ? activePattern.trim().length > 0 &&
        parseFingerStyleSteps(activePattern).length <= 32 &&
        /^[123456.X()]+$/.test(activePattern) &&
        isValidFingerStylePattern(activePattern)
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

  const updateFormField = <K extends keyof ExtendedPatternFormData>(
    field: K,
    value: ExtendedPatternFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (validationErrors[field]) {
      setValidationErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleStrummingPatternChange = (newPattern: string) => {
    setFormData((prev) => ({ ...prev, strummingPattern: newPattern }));
  };

  const handleFingerStylePatternChange = (newPattern: string) => {
    setFormData((prev) => ({ ...prev, fingerStylePattern: newPattern }));
  };

  const handlePatternTypeChange = (value: string) => {
    const isFingerStyle = value === "fingerstyle";
    updateFormField("isFingerStyle", isFingerStyle);
  };

  const handleBack = () => {
    if (returnTo === 'song-create') {
      router.push('/home/songs/create');
    } else {
      router.push('/home/patterns');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    try {
      const createdPattern = await PatternsService.createPattern({
        name: formData.name.trim(),
        pattern: activePattern,
        isFingerStyle: formData.isFingerStyle,
        description: formData.description.trim() || undefined,
      });

      toast.success(`Pattern "${createdPattern.name}" created successfully!`);
      
      if (returnTo === 'song-create') {
        router.push('/home/songs/create');
      } else {
        router.push(`/home/patterns/${createdPattern.name}`);
      }
    } catch (error: unknown) {
      let errorMessage = "Failed to create pattern";

      if (error && typeof error === "object" && "status" in error) {
        const err = error as { status: number; message?: string };
        if (err.message === null) {
          errorMessage = "Pattern with this name already exists";
        } else {
          errorMessage = err.message ?? "Failed to create pattern";
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    validateForm();
  }, [formData]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Create New Pattern
          </h1>
          <p className="text-muted-foreground mt-2">
            Create a new strumming or fingerstyle pattern for the library
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pattern Details</CardTitle>
                <CardDescription>
                  Enter pattern name and create your pattern
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
                          ? "create-pattern-name-error"
                          : undefined
                      }
                    />
                    {validationErrors.name && (
                      <span
                        id="create-pattern-name-error"
                        className="text-sm text-red-500"
                      >
                        {validationErrors.name}
                      </span>
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
                      <SelectTrigger>
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
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Create Pattern * (max{" "}
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
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-muted-foreground">
                        {formData.isFingerStyle
                          ? "Click cells to toggle notes, drag columns to reorder"
                          : "Drag symbols to reorder, click × to remove"}
                      </p>
                      <div className="text-sm font-mono">
                        {formData.isFingerStyle
                          ? `Steps: ${
                              parseFingerStyleSteps(activePattern).length
                            }/32`
                          : `Length: ${activePattern.length}/16`}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add notes about this pattern, when to use it, tempo suggestions..."
                      className="min-h-[100px]"
                      value={formData.description}
                      onChange={(e) =>
                        updateFormField("description", e.target.value)
                      }
                      onBlur={() => validateForm()}
                      aria-invalid={!!validationErrors.description}
                      aria-describedby={
                        validationErrors.description
                          ? "create-pattern-description-error"
                          : undefined
                      }
                    />
                    <div className="flex justify-between">
                      {validationErrors.description && (
                        <span
                          id="create-pattern-description-error"
                          className="text-sm text-red-500"
                        >
                          {validationErrors.description}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {formData.description.length}/500 characters
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading || !isFormValid()}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Create Pattern
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
                <CardTitle>Pattern Preview</CardTitle>
                <CardDescription>
                  Visual representation of your{" "}
                  {formData.isFingerStyle ? "fingerstyle" : "strumming"} pattern
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  {formData.isFingerStyle ? (
                    <FingerStyleDiagram
                      pattern={formData.fingerStylePattern}
                      name={formData.name || "Untitled Pattern"}
                    />
                  ) : (
                    <PatternDiagram
                      pattern={formData.strummingPattern}
                      name={formData.name || "Untitled Pattern"}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Symbol Legend</CardTitle>
                <CardDescription>
                  Meaning of each symbol in your pattern
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.isFingerStyle ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        {[1, 2, 3, 4, 5, 6].map((num) => (
                          <div
                            key={num}
                            className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
                          >
                            <div className="text-blue-600 dark:text-blue-300 font-bold text-lg">
                              {num}
                            </div>
                            <div>
                              <div className="font-medium">String {num}</div>
                              <div className="text-xs text-muted-foreground">
                                Play string {num}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="text-red-600 dark:text-red-300 font-bold text-lg">
                            X
                          </div>
                          <div>
                            <div className="font-medium">Scratch</div>
                            <div className="text-xs text-muted-foreground">
                              Scratch/chuck sound
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                          <div className="text-amber-600 dark:text-amber-300 font-bold text-lg">
                            .
                          </div>
                          <div>
                            <div className="font-medium">Mute</div>
                            <div className="text-xs text-muted-foreground">
                              Mute all strings
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium mb-2">
                          Fingerstyle Tips:
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Use numbers 1-6 for individual strings</li>
                          <li>• Use parentheses for multiple strings: (123)</li>
                          <li>
                            • Example: "1(23)4" plays string 1, then strings 2+3
                            together, then string 4
                          </li>
                          <li>• Maximum 32 steps</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div className="text-blue-600 font-bold text-lg">
                            D
                          </div>
                          <div>
                            <div className="font-medium">Down All</div>
                            <div className="text-xs text-muted-foreground">
                              Strum all strings down
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <div className="text-blue-500 font-bold text-lg">
                            d
                          </div>
                          <div>
                            <div className="font-medium">Down Top</div>
                            <div className="text-xs text-muted-foreground">
                              Strum top strings down
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="text-green-600 font-bold text-lg">
                            U
                          </div>
                          <div>
                            <div className="font-medium">Up All</div>
                            <div className="text-xs text-muted-foreground">
                              Strum all strings up
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <div className="text-green-500 font-bold text-lg">
                            u
                          </div>
                          <div>
                            <div className="font-medium">Up Top</div>
                            <div className="text-xs text-muted-foreground">
                              Strum top strings up
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <div className="text-red-600 font-bold text-lg">
                            X
                          </div>
                          <div>
                            <div className="font-medium">Scratch</div>
                            <div className="text-xs text-muted-foreground">
                              Scratch/chuck sound
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800/30 rounded">
                          <div className="text-gray-600 font-bold text-lg">
                            -
                          </div>
                          <div>
                            <div className="font-medium">Pause</div>
                            <div className="text-xs text-muted-foreground">
                              Short pause/silence
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
                          <div className="text-amber-600 font-bold text-lg">
                            .
                          </div>
                          <div>
                            <div className="font-medium">Mute</div>
                            <div className="text-xs text-muted-foreground">
                              Mute all strings
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t">
                        <div className="text-sm font-medium mb-2">
                          Strumming Tips:
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Start with simple patterns like "D-D-U-U"</li>
                          <li>• Use "-" for rests between strums</li>
                          <li>• Mix "D" and "d" for dynamic variation</li>
                          <li>• Add "X" for percussive effects</li>
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}