"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { ChordsService } from "@/lib/api/chords-service";
import { Chord, UpdateChordDto } from "@/types/chords";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowLeft, Save, Music, X } from "lucide-react";
import { FretboardEditor } from "@/components/chords/fretboard-editor";
import { SVGChordDiagram } from "@/components/chords/svg-chord-diagram";
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

interface EditChordForm {
  name: string;
  fingering: string;
  description: string;
}

export default function EditChordPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const toast = useToast();

  const chordId = params.id as string;
  
  const [originalChord, setOriginalChord] = useState<Chord | null>(null);
  const [form, setForm] = useState<EditChordForm>({
    name: "",
    fingering: "0-0-0-0-0-0",
    description: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadChord = async () => {
      setIsLoading(true);
      try {
        const chord = await ChordsService.getChordById(chordId);
        setOriginalChord(chord);
        setForm({
          name: chord.name,
          fingering: chord.fingering,
          description: chord.description || ""
        });
      } catch (error: any) {
        console.error("Failed to load chord:", error);
        toast.error("Failed to load chord. It may have been deleted.");
        router.push("/home/chords");
      } finally {
        setIsLoading(false);
      }
    };

    loadChord();
  }, [chordId]);

  useEffect(() => {
    if (originalChord) {
      const hasFormChanged = 
        form.name !== originalChord.name ||
        form.fingering !== originalChord.fingering ||
        form.description !== (originalChord.description || "");
      
      setHasChanges(hasFormChanged);
    }
  }, [form, originalChord]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!form.name.trim()) {
      newErrors.name = "Chord name is required";
    } else if (form.name.length > 20) {
      newErrors.name = "Chord name cannot exceed 20 characters";
    }

    if (!form.fingering.trim()) {
      newErrors.fingering = "Fingering is required";
    } else {
      const parts = form.fingering.split('-');
      if (parts.length !== 6) {
        newErrors.fingering = "Fingering must be 6 values separated by hyphens";
      } else {
        for (const part of parts) {
          if (!/^[0-9]{1,2}$|^X$/i.test(part)) {
            newErrors.fingering = "Each value must be a number (0-12) or X";
            break;
          }
          if (part !== 'X' && part !== 'x') {
            const num = parseInt(part, 10);
            if (num > 12) {
              newErrors.fingering = "Fret number cannot exceed 12";
              break;
            }
          }
        }
      }
    }

    if (form.description && form.description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof EditChordForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFingeringChange = (newFingering: string) => {
    handleInputChange("fingering", newFingering);
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
      const updateData: UpdateChordDto = {
        name: form.name,
        fingering: form.fingering,
        description: form.description || undefined 
      };
      
      const updatedChord = await ChordsService.updateChord(chordId, updateData);
      toast.success(`Chord ${updatedChord.name} updated successfully!`);
      
      router.push(`/home/chords/${encodeURIComponent(updatedChord.name)}`);
    } catch (error: any) {
      console.error("Failed to update chord:", error);
      
      if (error.status === 409) {
        toast.error("Chord with this fingering already exists");
      } else {
        toast.error(error.message || "Failed to update chord");
      }
    } finally {
      setIsSaving(false);
      setShowConfirmDialog(false);
    }
  };

  const handleCancel = () => {
    if (!hasChanges) {
      if (originalChord) {
        router.push(`/home/chords/${encodeURIComponent(originalChord.name)}`);
      } else {
        router.push("/home/chords");
      }
      return;
    }

    if (confirm("You have unsaved changes. Are you sure you want to discard them?")) {
      if (originalChord) {
        router.push(`/home/chords/${encodeURIComponent(originalChord.name)}`);
      } else {
        router.push("/home/chords");
      }
    }
  };

  const handleReset = () => {
    if (originalChord) {
      setForm({
        name: originalChord.name,
        fingering: originalChord.fingering,
        description: originalChord.description || ""
      });
      setErrors({});
      toast.info("All changes have been reset");
    }
  };

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

  const canEdit = user?.id === originalChord.createdByUserId || user?.role === "Admin";
  if (!canEdit) {
    toast.error("You don't have permission to edit this chord");
    router.push(`/home/chords/${encodeURIComponent(originalChord.name)}`);
    return null;
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/home/chords/${encodeURIComponent(originalChord.name)}`)}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chord Variations
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Edit Chord</h1>
            <p className="text-muted-foreground mt-2">
              Edit chord details for: <span className="font-bold">{originalChord.name}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <X className="h-4 w-4 mr-2" />
                Reset Changes
              </Button>
            )}
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              hasChanges 
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' 
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
            }`}>
              {hasChanges ? 'Unsaved changes' : 'No changes'}
            </div>
          </div>
        </div>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Original information</div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Created by</div>
                    <div className="font-medium">{originalChord.createdByNikName || "Unknown"}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Created on</div>
                    <div className="font-medium">
                      {new Date(originalChord.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {originalChord.updatedAt && (
                    <div>
                      <div className="text-xs text-muted-foreground">Last updated</div>
                      <div className="font-medium">
                        {new Date(originalChord.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-sm text-muted-foreground">Original fingering:</div>
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
                <div className="space-y-2">
                  <Label htmlFor="name">Chord Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="e.g., Am, C, G7"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                  {form.name !== originalChord.name && (
                    <div className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Changed from: <span className="font-mono">{originalChord.name}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fingering Pattern * (12 frets maximum)</Label>
                  <FretboardEditor
                    fingering={form.fingering} 
                    onFingeringChange={handleFingeringChange}
                  />
                  {errors.fingering && (
                    <p className="text-sm text-destructive">{errors.fingering}</p>
                  )}
                  {form.fingering !== originalChord.fingering && (
                    <div className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Changed from: <span className="font-mono">{originalChord.fingering}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Quick Text Input</Label>
                  <div className="flex gap-2">
                    <Input
                      value={form.fingering}
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
                    Format: 6 values separated by hyphens. Example: Am is <span className="font-mono">0-0-2-2-1-0</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Add notes about this chord variation..."
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-between">
                    {errors.description && (
                      <p className="text-sm text-destructive">{errors.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {form.description.length}/500 characters
                    </p>
                  </div>
                  {originalChord.description && form.description !== originalChord.description && (
                    <div className="text-xs text-amber-600">
                      <div className="font-medium mb-1">Original description:</div>
                      <p className="text-muted-foreground text-xs">
                        {originalChord.description}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex-1"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!hasChanges || isSaving}
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

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>
                  How your updated chord will appear
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center p-4">
                  {form.name && (
                    <div className="mb-6 text-center">
                      <div className="text-4xl font-bold">{form.name}</div>
                      <div className="text-lg text-muted-foreground font-mono mt-2">
                        {form.fingering}
                      </div>
                    </div>
                  )}
                  
                  <SVGChordDiagram
                    fingering={form.fingering}
                    name={form.name}
                  />
                  
                  <div className="mt-8 w-full max-w-md">
                    <div className="grid grid-cols-6 gap-2 mb-4">
                      {form.fingering.split('-').map((value, index) => {
                        const stringNum = 6 - index; 
                        const notes = ['E', 'A', 'D', 'G', 'B', 'E'];
                        return (
                          <div key={index} className="text-center p-2 bg-muted rounded">
                            <div className="text-xs text-muted-foreground">
                              String {stringNum} ({notes[index]})
                            </div>
                            <div className={`font-bold text-sm mt-1 ${
                              value === 'X' ? 'text-red-500' : 
                              value === '0' ? 'text-green-500' : 'text-blue-500'
                            }`}>
                              {value === '0' ? 'Open' : 
                               value === 'X' ? 'Mute' : 
                               `Fret ${value}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {form.description && (
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm font-medium mb-2">Description:</div>
                        <p className="text-muted-foreground text-sm">
                          {form.description}
                        </p>
                      </div>
                    )}
                  </div>
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
              Are you sure you want to update this chord? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Changes summary:</h4>
              
              {form.name !== originalChord.name && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Chord name:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground line-through">
                      {originalChord.name}
                    </span>
                    <span>→</span>
                    <span className="font-bold text-primary">{form.name}</span>
                  </div>
                </div>
              )}
              
              {form.fingering !== originalChord.fingering && (
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-sm">Fingering:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground font-mono line-through">
                      {originalChord.fingering}
                    </span>
                    <span>→</span>
                    <span className="font-bold text-primary font-mono">{form.fingering}</span>
                  </div>
                </div>
              )}
              
              {form.description !== (originalChord.description || "") && (
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
                'Confirm Update'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}