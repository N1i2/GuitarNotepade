"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { PatternsService } from "@/lib/api/patterns-service";
import { Pattern } from "@/types/patterns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Music,
  User,
  Calendar,
  Info,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react";
import { PatternDiagram } from "@/components/patterns/pattern-diagram";
import { FingerStyleDiagram } from "@/components/patterns/finger-style-diagram";
import { DeletePatternDialog } from "@/components/patterns/delete-pattern-dialog";

export default function PatternDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();

  const patternName = decodeURIComponent(params.patternName as string);
  const returnTo = searchParams.get('returnTo');

  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const loadPattern = async () => {
    setIsLoading(true);
    try {
      const data = await PatternsService.getPatternByName(patternName);
      setPattern(data);
    } catch (error: unknown) {
      let errorMessage = "Failed to load pattern";
      if (error && typeof error === "object" && "status" in error) {
        const err = error as { status: number; message?: string };
        if (err.status === 404) {
          errorMessage = `Pattern "${patternName}" not found`;
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPattern();
  }, [patternName]);

  const handleBack = () => {
    if (returnTo === 'song-create') {
      router.push('/home/songs/create');
    } else {
      router.push('/home/patterns');
    }
  };

  const handleEdit = () => {
    if (!pattern) return;
    router.push(`/home/patterns/edit/${pattern.id}?returnTo=${returnTo || ''}`);
  };

  const handleDeleteSuccess = () => {
    toast.success(`Pattern "${pattern?.name}" deleted successfully`);
    if (returnTo === 'song-create') {
      router.push('/home/songs/create');
    } else {
      router.push('/home/patterns');
    }
  };

  const canEdit = pattern && user?.id === pattern.createdByUserId;
  const canDelete =
    pattern && (user?.id === pattern.createdByUserId || user?.role === "Admin");

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

  if (!pattern) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Pattern not found</h3>
            <p className="text-muted-foreground mt-2">
              Pattern "{patternName}" was not found or has been removed.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {pattern.name}
              </h1>
              <Badge variant={pattern.isFingerStyle ? "secondary" : "default"}>
                {pattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLegend(!showLegend)}
              >
                {showLegend ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Hide Legend
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Show Legend
                  </>
                )}
              </Button>

              {canEdit && (
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}

              {canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            {pattern.isFingerStyle
              ? "Fingerstyle pattern for guitar"
              : "Strumming pattern for guitar"}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Pattern Visualization
                </CardTitle>
                <CardDescription>
                  {pattern.isFingerStyle
                    ? "Graphical representation of the fingerstyle pattern"
                    : "Graphical representation of the strumming pattern"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 from-background to-muted/20">
                  {pattern.isFingerStyle ? (
                    <FingerStyleDiagram
                      pattern={pattern.pattern}
                      name={pattern.name}
                    />
                  ) : (
                    <PatternDiagram
                      pattern={pattern.pattern}
                      name={pattern.name}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {showLegend && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Symbol Legend
                  </CardTitle>
                  <CardDescription>
                    Explanation of symbols used in this pattern
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pattern.isFingerStyle ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                          Fingerstyle Notation:
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>
                            • Numbers 1-6 represent guitar strings (1 = High E,
                            6 = Low E)
                          </li>
                          <li>
                            • Parentheses indicate multiple strings played
                            together: (123)
                          </li>
                          <li>• X = percussive scratch/chuck sound</li>
                          <li>• . = mute/pause (dampen all strings)</li>
                          <li>
                            • Example: "1(23)4" means: String 1, then strings
                            2+3 together, then string 4
                          </li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                          Strumming Notation:
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• D = Down strum on all strings</li>
                          <li>• d = Down strum on top strings only</li>
                          <li>• U = Up strum on all strings</li>
                          <li>• u = Up strum on top strings only</li>
                          <li>• X = percussive scratch/chuck sound</li>
                          <li>• - = pause/rest between strums</li>
                          <li>• . = mute strings</li>
                          <li>• Example: "D-D-U-U" is a common pattern</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Pattern Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">
                    Pattern Notation
                  </div>
                  <div className="font-mono text-xl font-bold bg-muted p-3 rounded text-center break-all">
                    {pattern.pattern}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    {pattern.isFingerStyle
                      ? "Fingerstyle notation"
                      : "Strumming notation"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="font-medium">
                      {pattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Length</div>
                    <div className="font-medium">
                      {pattern.isFingerStyle
                        ? `${pattern.pattern.length} symbols`
                        : `${pattern.pattern.length} steps`}
                    </div>
                  </div>
                </div>

                {pattern.description && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Description
                    </div>
                    <p className="text-muted-foreground whitespace-pre-wrap p-3 bg-muted/30 rounded">
                      {pattern.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Created By
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="font-medium">
                    {pattern.createdByNikName || "Unknown"}
                  </div>
                  {user?.id === pattern.createdByUserId && (
                    <Badge variant="outline">You</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created {new Date(pattern.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {pattern.updatedAt &&
                    pattern.updatedAt !== pattern.createdAt && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Updated{" "}
                          {new Date(pattern.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                </div>

                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    <div className="font-medium mb-1">Permissions:</div>
                    <ul className="space-y-1">
                      {user?.id === pattern.createdByUserId && (
                        <li>• You can edit or delete this pattern</li>
                      )}
                      {user?.role === "Admin" &&
                        user?.id !== pattern.createdByUserId && (
                          <li>• As admin, you can delete this pattern</li>
                        )}
                      {!canEdit && !canDelete && (
                        <li>• You can view this pattern</li>
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Practice Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {pattern.isFingerStyle ? (
                    <>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="font-medium mb-1">
                          Fingerstyle Tips:
                        </div>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Start slow, focus on accuracy</li>
                          <li>• Use thumb for bass strings (4-6)</li>
                          <li>• Use index, middle, ring for treble strings</li>
                          <li>• Practice with metronome</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                        <div className="font-medium mb-1">When to use:</div>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Folk and classical music</li>
                          <li>• Solo guitar pieces</li>
                          <li>• Arpeggiated accompaniments</li>
                          <li>• Melody with bass lines</li>
                        </ul>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                        <div className="font-medium mb-1">Strumming Tips:</div>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Keep a steady rhythm</li>
                          <li>• Use wrist motion, not arm</li>
                          <li>• Start with downstrokes only</li>
                          <li>• Add upstrokes gradually</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                        <div className="font-medium mb-1">When to use:</div>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Pop and rock music</li>
                          <li>• Rhythm accompaniment</li>
                          <li>• Songwriting and jamming</li>
                          <li>• Beginner practice</li>
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

      {pattern && (
        <DeletePatternDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          pattern={pattern}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}