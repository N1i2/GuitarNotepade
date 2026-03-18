"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { ChordsService } from "@/lib/api/chords-service";
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
import { ArrowLeft, Save } from "lucide-react";
import { FretboardEditor } from "@/components/chords/fretboard-editor";
import { SVGChordDiagram } from "@/components/chords/svg-chord-diagram";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const createChordSchema = z.object({
  name: z
    .string()
    .min(1, "Chord name is required")
    .max(20, "Chord name cannot exceed 20 characters"),
  fingering: z
    .string()
    .min(1, "Fingering is required")
    .regex(
      /^[0-9XTx\-]{6,17}$/,
      "Fingering must be 6 values separated by hyphens"
    )
    .refine(
      (value) => {
        const parts = value.split("-");
        if (parts.length !== 6) return false;
        return parts.every((part) => /^[0-9]{1,2}$|^X$/i.test(part));
      },
      { message: "Each value must be a number (0-12) or X" }
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
      { message: "Fret number cannot exceed 12" }
    ),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

type CreateChordFormValues = z.infer<typeof createChordSchema>;

export default function CreateChordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    getValues,
    trigger,
  } = useForm<CreateChordFormValues>({
    resolver: zodResolver(createChordSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      fingering: "0-0-0-0-0-0",
      description: "",
    },
  });

  const currentValues = watch();

  const handleFingeringChange = (newFingering: string) => {
    setValue("fingering", newFingering, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleBack = () => {
    if (returnTo === 'song-create') {
      router.push('/home/songs/create');
    } else {
      router.push('/home/chords');
    }
  };

  const onSubmit = async () => {
    const isValid = await trigger();
    if (!isValid) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const values = getValues();
    setIsLoading(true);
    try {
      const createdChord = await ChordsService.createChord({
        ...values,
        fingering: values.fingering.toUpperCase(),
      });

      toast.success(`Chord ${createdChord.name} created successfully!`);
      
      if (returnTo === 'song-create') {
        router.push('/home/songs/create');
      } else {
        router.push(`/home/chords/${createdChord.name}`);
      }
    } catch (error: unknown) {
      const isApiError =
        error && typeof error === "object" && "status" in error;

      if (isApiError) {
        const apiError = error as { status: number; message?: string };

        if(apiError.message === null){
          toast.error("Chord with this fingering already exists");
        }
        else{
          toast.error(apiError.message || "Failed to create chord");
        }
      } else if (error instanceof Error) {
        toast.error(error.message || "Failed to create chord");
      } else {
        toast.error("Failed to create chord");
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            Create New Chord
          </h1>
          <p className="text-muted-foreground mt-2">
            Create a new chord diagram for the library
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Chord Details</CardTitle>
                <CardDescription>
                  Enter chord name and fingering pattern
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Chord Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Am, C, G7, Dm7"
                      {...register("name")}
                      aria-invalid={!!errors.name}
                      aria-describedby={
                        errors.name ? "create-chord-name-error" : undefined
                      }
                    />
                    {errors.name && (
                      <span
                        id="create-chord-name-error"
                        className="text-sm text-red-500"
                      >
                        {errors.name.message}
                      </span>
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
                          ? "create-chord-description-error"
                          : undefined
                      }
                    />
                    <div className="flex justify-between">
                      {errors.description && (
                        <span
                          id="create-chord-description-error"
                          className="text-sm text-red-500"
                        >
                          {errors.description.message}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {currentValues.description?.length || 0}/500 characters
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
                      onClick={onSubmit}
                      disabled={isLoading || !isValid}
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
                          Create Chord
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
                <CardTitle>Professional Preview</CardTitle>
                <CardDescription>
                  Accurate chord diagram with proper fret positioning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center">
                  <SVGChordDiagram
                    fingering={currentValues.fingering}
                    name={currentValues.name}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}