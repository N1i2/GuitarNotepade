"use client";

import { useState, useEffect } from "react";
import { Chord, UpdateChordDto } from "@/types/chords";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Save, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChordsService } from "@/lib/api/chords-service";
import { ChordDiagram } from "./chord-diagram";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const editChordSchema = z.object({
  name: z.string()
    .min(1, "Chord name is required")
    .max(20, "Chord name cannot exceed 20 characters"),
  fingering: z.string()
    .min(1, "Fingering is required")
    .regex(/^[0-9XTx]{6}$/, "Fingering must be exactly 6 characters containing only digits 0-9, X (mute), or T (thumb)"),
  description: z.string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .or(z.literal(''))
});

type EditChordFormValues = z.infer<typeof editChordSchema>;

interface EditChordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chord: Chord;
  onSuccess: (updatedChord: Chord) => void;
}

export function EditChordDialog({
  isOpen,
  onClose,
  chord,
  onSuccess,
}: EditChordDialogProps) {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    formState: { errors, isDirty, isValid },
    reset,
    watch,
    getValues,
    trigger,
    setValue
  } = useForm<EditChordFormValues>({
    resolver: zodResolver(editChordSchema),
    mode: "onBlur",
    defaultValues: {
      name: chord.name,
      fingering: chord.fingering,
      description: chord.description || "",
    }
  });

  const fingering = watch("fingering");

  useEffect(() => {
    if (isOpen) {
      reset({
        name: chord.name,
        fingering: chord.fingering,
        description: chord.description || "",
      });
    }
  }, [isOpen, chord, reset]);

  const handleFingeringChange = (index: number, value: string) => {
    const currentFingering = watch("fingering") || "";
    const newFingering = currentFingering.split("");
    newFingering[index] = value;
    setValue("fingering", newFingering.join(""), { shouldDirty: true, shouldValidate: true });
  };

  const handleSubmit = async () => {
    const isValid = await trigger();
    if (!isValid) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    try {
      const values = getValues();
      const updateData: UpdateChordDto = values;
      
      const updatedChord = await ChordsService.updateChord(chord.id, updateData);
      onSuccess(updatedChord);
      onClose();
      toast.success("Chord updated successfully");
    } catch (error: unknown) {
      console.error("Failed to update chord:", error);
      
      const isApiError = error && typeof error === 'object' && 'status' in error;
      
      if (isApiError) {
        const apiError = error as { status: number; message?: string };
        if (apiError.status === 409) {
          toast.error("Chord with this fingering already exists");
        } else {
          toast.error(apiError.message || "Failed to update chord");
        }
      } else if (error instanceof Error) {
        toast.error(error.message || "Failed to update chord");
      } else {
        toast.error("Failed to update chord");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Music className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-lg">Edit Chord</DialogTitle>
          </div>
          <DialogDescription>
            Update the chord details and fingering pattern
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="border rounded-lg p-4 bg-gradient-to-b from-background to-muted/20">
            <h3 className="text-sm font-medium mb-3">Preview</h3>
            <div className="flex flex-col items-center">
              <ChordDiagram 
                fingering={fingering || "000000"} 
                name={watch("name") || "Chord"}
                size="md"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Chord Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Am, C, G7"
                {...register('name')}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'edit-chord-name-error' : undefined}
              />
              {errors.name && <span id="edit-chord-name-error" className="text-sm text-red-500">{errors.name.message}</span>}
              <p className="text-xs text-muted-foreground">
                Format: A-G, optional #/b, optional extensions (m, 7, maj, etc.)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Fingering Pattern *</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">From 6th string to 1st:</div>
                  <div className="font-mono text-lg font-bold bg-muted px-3 py-1 rounded">
                    {fingering}
                  </div>
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {[5, 4, 3, 2, 1, 0].map((stringIndex) => (
                    <div key={stringIndex} className="space-y-1">
                      <div className="text-xs text-center text-muted-foreground">
                        String {6 - stringIndex}
                      </div>
                      <Input
                        value={fingering?.[stringIndex] || "0"}
                        onChange={(e) => handleFingeringChange(stringIndex, e.target.value)}
                        maxLength={1}
                        className="text-center font-mono h-10"
                        placeholder="0"
                      />
                      <div className="text-xs text-center text-muted-foreground">
                        {fingering?.[stringIndex] === "0" ? "Open" :
                         fingering?.[stringIndex] === "X" || fingering?.[stringIndex] === "x" ? "Mute" :
                         `Fret ${fingering?.[stringIndex]}`}
                      </div>
                    </div>
                  ))}
                </div>
                
                {errors.fingering && <span className="text-sm text-red-500">{errors.fingering.message}</span>}
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Enter 0 for open string</p>
                  <p>• Enter X or x for muted string</p>
                  <p>• Enter 1-9 for fret position</p>
                  <p>• Example: Am chord is "002210"</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add notes about this chord variation..."
                className="min-h-[100px]"
                {...register('description')}
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'edit-chord-description-error' : undefined}
              />
              <div className="flex justify-between">
                {errors.description && <span id="edit-chord-description-error" className="text-sm text-red-500">{errors.description.message}</span>}
                <p className="text-xs text-muted-foreground ml-auto">
                  {(watch("description")?.length || 0)}/500 characters
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm">
                <div className="font-medium mb-1">Original Information</div>
                <div className="text-muted-foreground space-y-1">
                  <div>Created by: {chord.createdByNikName || "Unknown"}</div>
                  <div>Created: {new Date(chord.createdAt).toLocaleDateString()}</div>
                  {chord.updatedAt && (
                    <div>Last updated: {new Date(chord.updatedAt).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !isDirty || !isValid}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}