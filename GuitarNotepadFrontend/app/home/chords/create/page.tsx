"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { ChordsService } from "@/lib/api/chords-service";
import { CreateChordDto } from "@/types/chords";
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
import { ArrowLeft, Save, Music } from "lucide-react";
import { FretboardEditor } from "@/components/chords/fretboard-editor";
import { ChordDiagram } from "@/components/chords/chord-diagram";
import { SVGChordDiagram } from "@/components/chords/svg-chord-diagram";

export default function CreateChordPage() {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState<CreateChordDto>({
    name: "",
    fingering: "0-0-0-0-0-0",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
      const parts = form.fingering.split("-");
      if (parts.length !== 6) {
        newErrors.fingering = "Fingering must be 6 values separated by hyphens";
      } else {
        for (const part of parts) {
          if (!/^[0-9]{1,2}$|^X$/i.test(part)) {
            newErrors.fingering = "Each value must be a number (0-12) or X";
            break;
          }
          if (part !== "X" && part !== "x") {
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsLoading(true);
    try {
      const createdChord = await ChordsService.createChord({
        ...form,
        fingering: form.fingering.toUpperCase(),
      });

      toast.success(`Chord ${createdChord.name} created successfully!`);
      router.push(`/home/chords/${encodeURIComponent(createdChord.name)}`);
    } catch (error: any) {
      console.error("Failed to create chord:", error);

      if (error.status === 409) {
        toast.error("Chord with this fingering already exists");
      } else {
        toast.error(error.message || "Failed to create chord");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFingeringChange = (newFingering: string) => {
    setForm({ ...form, fingering: newFingering });
    if (errors.fingering) {
      setErrors({ ...errors, fingering: "" });
    }
  };

  const handleQuickInput = (fingering: string) => {
    setForm({ ...form, fingering });
    setErrors({});
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/home/chords")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chords
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              Create New Chord
            </h1>
            <p className="text-muted-foreground mt-2">
              Create a new chord diagram for the library
            </p>
          </div>
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
                <div className="space-y-2">
                  <Label htmlFor="name">Chord Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    placeholder="e.g., Am, C, G7, Dm7"
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Fingering Pattern * (12 frets maximum)</Label>
                  <FretboardEditor
                    fingering={form.fingering}
                    onFingeringChange={handleFingeringChange}
                  />
                  {errors.fingering && (
                    <p className="text-sm text-destructive">
                      {errors.fingering}
                    </p>
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
                    Format: 6 values separated by hyphens. Example: Am is{" "}
                    <span className="font-mono">0-0-2-2-1-0</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Add notes about this chord variation..."
                    className="min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.description?.length || 0}/500 characters
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => router.push("/home/chords")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
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

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Preview</CardTitle>
                <CardDescription>
                  Accurate chord diagram with proper fret positioning
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
                      {[1, 2, 3, 4, 5, 6].map((stringNum) => {
                        const value =
                          form.fingering.split("-")[stringNum - 1] || "0";
                        return (
                          <div
                            key={stringNum}
                            className="text-center p-2 bg-muted rounded"
                          >
                            <div className="text-xs text-muted-foreground">
                              String {stringNum}
                            </div>
                            <div
                              className={`font-bold ${
                                value === "X"
                                  ? "text-red-500"
                                  : value === "0"
                                  ? "text-green-500"
                                  : "text-blue-500"
                              }`}
                            >
                              {value === "0"
                                ? "Open"
                                : value === "X"
                                ? "Mute"
                                : `Fret ${value}`}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {form.description && (
                      <div className="p-4 border rounded-lg">
                        <div className="text-sm font-medium mb-2">Notes:</div>
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
    </div>
  );
}
