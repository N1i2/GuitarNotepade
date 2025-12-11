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
  const [form, setForm] = useState<UpdateChordDto>({
    name: chord.name,
    fingering: chord.fingering,
    description: chord.description || "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: chord.name,
        fingering: chord.fingering,
        description: chord.description || "",
      });
      setErrors({});
    }
  }, [isOpen, chord]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!form.name?.trim()) {
      newErrors.name = "Chord name is required";
    } else if (form.name.length > 20) {
      newErrors.name = "Chord name cannot exceed 20 characters";
    }

    if (!form.fingering?.trim()) {
      newErrors.fingering = "Fingering is required";
    } else if (form.fingering.length !== 6) {
      newErrors.fingering = "Fingering must be exactly 6 characters";
    } else if (!/^[0-9XTx]+$/.test(form.fingering)) {
      newErrors.fingering = "Fingering can only contain digits 0-9, X (mute), or T (thumb)";
    }

    if (form.description && form.description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof UpdateChordDto, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    try {
      const updatedChord = await ChordsService.updateChord(chord.id, form);
      onSuccess(updatedChord);
      onClose();
    } catch (error: any) {
      console.error("Failed to update chord:", error);
      
      if (error.status === 409) {
        setErrors({ fingering: "Chord with this fingering already exists" });
        toast.error("Chord with this fingering already exists");
      } else {
        toast.error(error.message || "Failed to update chord");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFingeringChange = (index: number, value: string) => {
    const newFingering = form.fingering!.split("");
    newFingering[index] = value;
    handleInputChange("fingering", newFingering.join(""));
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
                fingering={form.fingering || "000000"} 
                name={form.name || "Chord"}
                size="md"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Chord Name *</Label>
              <Input
                id="name"
                value={form.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., Am, C, G7"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
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
                    {form.fingering}
                  </div>
                </div>
                
                <div className="grid grid-cols-6 gap-2">
                  {[5, 4, 3, 2, 1, 0].map((stringIndex) => (
                    <div key={stringIndex} className="space-y-1">
                      <div className="text-xs text-center text-muted-foreground">
                        String {6 - stringIndex}
                      </div>
                      <Input
                        value={form.fingering?.[stringIndex] || "0"}
                        onChange={(e) => handleFingeringChange(stringIndex, e.target.value)}
                        maxLength={1}
                        className="text-center font-mono h-10"
                        placeholder="0"
                      />
                      <div className="text-xs text-center text-muted-foreground">
                        {form.fingering?.[stringIndex] === "0" ? "Open" :
                         form.fingering?.[stringIndex] === "X" || form.fingering?.[stringIndex] === "x" ? "Mute" :
                         `Fret ${form.fingering?.[stringIndex]}`}
                      </div>
                    </div>
                  ))}
                </div>
                
                {errors.fingering && (
                  <p className="text-sm text-destructive">{errors.fingering}</p>
                )}
                
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
                value={form.description || ""}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Add notes about this chord variation..."
                className="min-h-[100px]"
              />
              <div className="flex justify-between">
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
                <p className="text-xs text-muted-foreground ml-auto">
                  {form.description?.length || 0}/500 characters
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
            disabled={isLoading}
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
      </DialogContent>
    </Dialog>
  );
}