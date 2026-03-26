"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ChordsService } from "@/lib/api/chords-service";
import { Chord, UpdateChordDto } from "@/types/chords";
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
import { useAuth } from "@/components/providers/auth-provider";
import { FretboardEditor } from "@/components/chords/fretboard-editor";
import { SVGChordDiagram } from "@/components/chords/svg-chord-diagram";
import { Play, Loader2 } from "lucide-react";
import { chordAudioService } from "@/lib/services/chord-audio-service";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const editChordSchema = z.object({
  name: z
    .string()
    .min(1, "Chord name is required")
    .max(20, "Chord name cannot exceed 20 characters"),
  fingering: z
    .string()
    .min(1, "Fingering is required")
    .regex(
      /^[0-9XTx\-]{6,17}$/,
      "Fingering must be 6 values separated by hyphens",
    )
    .refine(
      (value) => {
        const parts = value.split("-");
        if (parts.length !== 6) return false;
        return parts.every((part) => /^[0-9]{1,2}$|^X$/i.test(part));
      },
      { message: "Each value must be a number (0-12) or X" },
    )
    .refine(
      (value) => {
        const parts = value.split("-");
        return parts.every((part) => {
          if (/^X$/i.test(part)) return true;
          const num = parseInt(part, 10);
          return num <= 12;
        });
      },
      { message: "Fret number cannot exceed 12" },
    ),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

type EditChordFormValues = z.infer<typeof editChordSchema>;

export default function EditChordPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const chordId = params.id as string;

  const [originalChord, setOriginalChord] = useState<Chord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const toastRef = useRef(toast);
  const routerRef = useRef(router);

  useEffect(() => {
    toastRef.current = toast;
    routerRef.current = router;
  }, [toast, router]);

  const {
    register,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
    setValue,
    getValues,
    trigger,
  } = useForm<EditChordFormValues>({
    resolver: zodResolver(editChordSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      fingering: "0-0-0-0-0-0",
      description: "",
    },
  });

  const currentValues = watch();

  useEffect(() => {
    let isMounted = true;

    const loadChord = async () => {
      if (!chordId) return;

      setIsLoading(true);
      setLoadError(null);

      try {
        const chord = await ChordsService.getChordById(chordId);

        if (!isMounted) return;

        setOriginalChord(chord);
        reset({
          name: chord.name,
          fingering: chord.fingering,
          description: chord.description || "",
        });
      } catch (error: unknown) {
        if (!isMounted) return;

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load chord. It may have been deleted.";

        setLoadError(errorMessage);
        toastRef.current.error(errorMessage);

        setTimeout(() => {
          routerRef.current.push("/home/chords");
        }, 100);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadChord();

    return () => {
      isMounted = false;
    };
  }, [chordId, reset]);

  const handleFingeringChange = (newFingering: string) => {
    setValue("fingering", newFingering, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSubmit = async () => {
    const isValid = await trigger();
    if (!isValid) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSaving(true);
    try {
      const values = getValues();
      const updateData: UpdateChordDto = {
        name: values.name,
        fingering: values.fingering.toUpperCase(),
        description: values.description || undefined,
      };

      const updatedChord = await ChordsService.updateChord(chordId, updateData);
      toast.success(`Chord ${updatedChord.name} updated successfully!`);

      router.push(`/home/chords/${encodeURIComponent(updatedChord.name)}`);
    } catch (error: unknown) {
      const isApiError =
        error && typeof error === "object" && "status" in error;

      if (isApiError) {
        const apiError = error as { status: number; message?: string };
        if (apiError.message === null) {
          toast.error("Chord with this fingering already exists");
        } else {
          toast.error(apiError.message || "Failed to create chord");
        }
      } else if (error instanceof Error) {
        toast.error(error.message || "Failed to update chord");
      } else {
        toast.error("Failed to update chord");
      }
    } finally {
      setIsSaving(false);
      setShowConfirmDialog(false);
    }
  };

  const handleCancel = () => {
    if (!isDirty) {
      if (originalChord) {
        router.push(`/home/chords/${encodeURIComponent(originalChord.name)}`);
      } else {
        router.push("/home/chords");
      }
      return;
    }

    if (
      confirm(
        "You have unsaved changes. Are you sure you want to discard them?",
      )
    ) {
      if (originalChord) {
        router.push(`/home/chords/${encodeURIComponent(originalChord.name)}`);
      } else {
        router.push("/home/chords");
      }
    }
  };

  const handleReset = () => {
    if (originalChord) {
      reset({
        name: originalChord.name,
        fingering: originalChord.fingering,
        description: originalChord.description || "",
      });
      toast.info("All changes have been reset");
    }
  };

  const handlePlayChord = async () => {
    const fingering = getValues().fingering;
    if (!fingering || fingering === "0-0-0-0-0-0") {
      toast.error("Please set a fingering pattern first");
      return;
    }

    setIsPlayingAudio(true);
    try {
      await chordAudioService.generateChordAudio(fingering);
    } catch (error) {
      console.error("Failed to play chord audio:", error);
      toast.error("Failed to generate chord audio");
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const canEdit =
    user?.id === originalChord?.createdByUserId || user?.role === "Admin";

  if (loadError && !isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Chord</h3>
            <p className="text-muted-foreground mt-2">{loadError}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/home/chords")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chords
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

  if (!originalChord) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Chord not found</h3>
            <p className="text-muted-foreground mt-2">
              The chord you're trying to edit may have been deleted.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/home/chords")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chords
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
              You don't have permission to edit this chord.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() =>
                router.push(
                  `/home/chords/${encodeURIComponent(originalChord.name)}`,
                )
              }
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chord
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                router.push(
                  `/home/chords/${encodeURIComponent(originalChord.name)}`,
                )
              }
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chord Variations
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Edit Chord</h1>
            <p className="text-muted-foreground mt-2">
              Edit chord details for:{" "}
              <span className="font-bold">{originalChord.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isDirty && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                <X className="h-4 w-4 mr-2" />
                Reset Changes
              </Button>
            )}
            <div
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                isDirty
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
              }`}
            >
              {isDirty ? "Unsaved changes" : "No changes"}
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
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Created by
                    </div>
                    <div className="font-medium">
                      {originalChord.createdByNikName || "Unknown"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Created on
                    </div>
                    <div className="font-medium">
                      {new Date(originalChord.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {originalChord.updatedAt && (
                    <div>
                      <div className="text-xs text-muted-foreground">
                        Last updated
                      </div>
                      <div className="font-medium">
                        {new Date(originalChord.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">
                  Original fingering:
                </div>
                <div className="font-mono font-bold bg-muted px-3 py-1 rounded">
                  {originalChord.fingering}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Edit Chord Details</CardTitle>
                <CardDescription>
                  Update chord name, fingering pattern, and description
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Chord Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Am, C, G7"
                      {...register("name")}
                      aria-invalid={!!errors.name}
                      aria-describedby={
                        errors.name ? "edit-page-name-error" : undefined
                      }
                    />
                    {errors.name && (
                      <span
                        id="edit-page-name-error"
                        className="text-sm text-red-500"
                      >
                        {errors.name.message}
                      </span>
                    )}
                    {currentValues.name !== originalChord.name && (
                      <div className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Changed from:{" "}
                        <span className="font-mono">{originalChord.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Fingering Pattern * (12 frets maximum)</Label>
                    <FretboardEditor
                      fingering={currentValues.fingering}
                      onFingeringChange={handleFingeringChange}
                    />
                    {errors.fingering && (
                      <span className="text-sm text-red-500">
                        {errors.fingering.message}
                      </span>
                    )}
                    {currentValues.fingering !== originalChord.fingering && (
                      <div className="text-xs text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Changed from:{" "}
                        <span className="font-mono">
                          {originalChord.fingering}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Quick Text Input</Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentValues.fingering}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          if (/^[0-9X\-]*$/.test(value) && value.length <= 17) {
                            handleFingeringChange(value);
                          }
                        }}
                        placeholder="Format: 0-0-2-2-1-0"
                        className="font-mono text-center text-lg h-12"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Format: 6 values separated by hyphens. Example: Am is{" "}
                      <span className="font-mono">0-0-2-2-1-0</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add notes about this chord variation..."
                      className="min-h-[100px]"
                      {...register("description")}
                      aria-invalid={!!errors.description}
                      aria-describedby={
                        errors.description
                          ? "edit-page-description-error"
                          : undefined
                      }
                    />
                    <div className="flex justify-between">
                      {errors.description && (
                        <span
                          id="edit-page-description-error"
                          className="text-sm text-red-500"
                        >
                          {errors.description.message}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {currentValues.description?.length || 0}/500 characters
                      </p>
                    </div>
                    {originalChord.description &&
                      currentValues.description !==
                        originalChord.description && (
                        <div className="text-xs text-amber-600">
                          <div className="font-medium mb-1">
                            Original description:
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {originalChord.description}
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
                      disabled={!isDirty || isSaving || !isValid}
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
                          Update Chord
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
                  How your updated chord will appear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <SVGChordDiagram
                    fingering={currentValues.fingering}
                    name={currentValues.name}
                  />

                  <Button
                    onClick={handlePlayChord}
                    disabled={
                      isPlayingAudio ||
                      !currentValues.fingering ||
                      currentValues.fingering === "0-0-0-0-0-0"
                    }
                    className="w-full max-w-xs"
                    variant="outline"
                  >
                    {isPlayingAudio ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Playing chord...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Play chord sound
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Click to hear how this chord sounds on guitar
                  </p>
                </div>
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
              Are you sure you want to update this chord? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Changes summary:</h4>

              {currentValues.name !== originalChord.name && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Chord name:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      {originalChord.name}
                    </span>
                    <span>→</span>
                    <span className="font-bold text-primary">
                      {currentValues.name}
                    </span>
                  </div>
                </div>
              )}

              {currentValues.fingering !== originalChord.fingering && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Fingering:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-mono line-through">
                      {originalChord.fingering}
                    </span>
                    <span>→</span>
                    <span className="font-bold text-primary font-mono">
                      {currentValues.fingering}
                    </span>
                  </div>
                </div>
              )}

              {currentValues.description !==
                (originalChord.description || "") && (
                <div className="py-2">
                  <span className="text-sm">Description updated</span>
                </div>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  Note: All users will see the updated version of this chord.
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSubmit}
              disabled={isSaving}
              className="bg-primary hover:bg-primary/90"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                "Confirm Update"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
