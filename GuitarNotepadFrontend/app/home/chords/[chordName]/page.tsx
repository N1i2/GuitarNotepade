"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { ChordsService } from "@/lib/api/chords-service";
import { Chord, PaginatedChords } from "@/types/chords";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Trash2, 
  Music, 
  User,
  Calendar,
  ArrowLeft
} from "lucide-react";
import { ChordDiagram } from "@/components/chords/chord-diagram";
import { DeleteChordDialog } from "@/components/chords/delete-chord-dialog";
import { EditChordDialog } from "@/components/chords/edit-chord-dialog";

export default function ChordVariationsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const toast = useToast();

  const chordName = decodeURIComponent(params.chordName as string);
  
  const [variations, setVariations] = useState<PaginatedChords | null>(null);
  const [currentVariation, setCurrentVariation] = useState<Chord | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

 const loadVariations = async () => {
    setIsLoading(true);
    try {
      const data = await ChordsService.getChordsByExactName(chordName, 1, 100);
      setVariations(data);
      
      if (data.items.length > 0) {
        setCurrentVariation(data.items[0]);
        setCurrentIndex(0);
      } else {
        toast.warning(`No variations found for chord "${chordName}"`);
      }
    } catch (error: any) {
      console.error("Failed to load chord variations:", error);
      toast.error("Failed to load chord variations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVariations();
  }, [chordName]);

  const handlePrevious = () => {
    if (!variations || currentIndex <= 0) return;
    
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    setCurrentVariation(variations.items[newIndex]);
  };

  const handleNext = () => {
    if (!variations || currentIndex >= variations.items.length - 1) return;
    
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    setCurrentVariation(variations.items[newIndex]);
  };

  const handleEdit = () => {
    if (!currentVariation) return;
    setEditDialogOpen(true);
  };

  const handleDelete = () => {
    if (!currentVariation) return;
    setDeleteDialogOpen(true);
  };

  const handleEditSuccess = (updatedChord: Chord) => {
    setCurrentVariation(updatedChord);

    if (variations) {
      const updatedItems = variations.items.map(item => 
        item.id === updatedChord.id ? updatedChord : item
      );
      setVariations({ ...variations, items: updatedItems });
    }
    toast.success("Chord updated successfully");
  };

  const handleDeleteSuccess = () => {
    
    if (variations) {
      const updatedItems = variations.items.filter(item => item.id !== currentVariation?.id);
      setVariations({ ...variations, items: updatedItems, totalCount: variations.totalCount - 1 });
      
      if (updatedItems.length > 0) {
        const newIndex = Math.min(currentIndex, updatedItems.length - 1);
        setCurrentIndex(newIndex);
        setCurrentVariation(updatedItems[newIndex]);
      } else {
        router.push("/home/chords");
      }
    }
    toast.success("Chord deleted successfully");
  };

  const parseFingering = (fingering: string): string[] => {
    if (!fingering) return Array(6).fill('0');
    
    let values: string[];
    
    if (fingering.includes('-')) {
      values = fingering.split('-');
    } else {
      values = fingering.split('');
    }
    
    while (values.length < 6) {
      values.push('0');
    }
    
    return values.slice(0, 6);
  };

  const strings = [
    { number: 6, note: "E" }, 
    { number: 5, note: "A" }, 
    { number: 4, note: "D" }, 
    { number: 3, note: "G" }, 
    { number: 2, note: "B" }, 
    { number: 1, note: "E" }, 
  ];

  const canEdit = currentVariation && user?.id === currentVariation.createdByUserId;
  const canDelete = currentVariation && (
    user?.id === currentVariation.createdByUserId || user?.role === "Admin"
  );

  const currentFingeringValues = currentVariation ? parseFingering(currentVariation.fingering) : [];

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

  if (!currentVariation || !variations || variations.items.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No variations found</h3>
            <p className="text-muted-foreground mt-2">
              No variations found for chord "{chordName}"
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
              {chordName} Variations
            </h1>
            <p className="text-muted-foreground mt-2">
              Explore different fingerings for the {chordName} chord
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Variation {currentIndex + 1} of {variations.items.length}
            </Badge>
          </div>
        </div>

        <Card className="border-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-4xl font-bold">
                  {currentVariation.name}
                </CardTitle>
                <CardDescription>
                  Fingering: <span className="font-mono font-bold">{currentVariation.fingering}</span>
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-2">

                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/home/chords/edit/${currentVariation.id}`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}


                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  disabled={currentIndex === variations.items.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="border rounded-lg p-6 bg-gradient-to-b from-background to-muted/20">
                  <h3 className="text-lg font-semibold mb-4">Chord Diagram</h3>
                  <div className="flex justify-center">
                    <ChordDiagram
                      fingering={currentVariation.fingering}
                      size="lg"
                    />
                  </div>
                </div>
              
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Created By
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{currentVariation.createdByNikName || "Unknown"}</div>
                        {user?.id === currentVariation.createdByUserId && (
                          <Badge variant="outline">You</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Created {new Date(currentVariation.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">Fingering Details</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Fingering Pattern</div>
                        <div className="font-mono text-2xl font-bold bg-muted p-3 rounded text-center">
                          {currentVariation.fingering}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Reading from 6th string (thickest) to 1st string (thinnest)
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-6 gap-2 pt-4">
                        {strings.map((string, index) => {
                          const fretValue = currentFingeringValues[index];
                          
                          return (
                            <div key={string.number} className="text-center">
                              <div className="text-xs text-muted-foreground">
                                String {string.number} ({string.note})
                              </div>
                              <div className={`text-lg font-bold p-2 rounded ${
                                fretValue === '0' ? 'bg-teal-100 dark:bg-teal-900/30' :
                                fretValue === 'X' || fretValue === 'x' ? 'bg-gray-100 dark:bg-gray-800' :
                                'bg-primary/10'
                              }`}>
                                {fretValue}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-6 border rounded-lg p-4">
                        <h4 className="font-medium mb-3 text-center">String by string breakdown:</h4>
                        <div className="space-y-2">
                          {strings.map((string, index) => {
                            const fretValue = currentFingeringValues[index];
                            const action = 
                              fretValue === '0' ? 'Open' : 
                              fretValue === 'X' || fretValue === 'x' ? 'Muted' : 
                              `Fret ${fretValue}`;
                            
                            return (
                              <div key={string.number} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
                                <div className="flex items-center gap-2">
                                  <div className="font-mono bg-muted px-2 py-1 rounded text-sm">
                                    {string.note}
                                  </div>
                                  <span className="text-sm">String {string.number}</span>
                                </div>
                                <div className="font-medium">
                                  {action}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-muted/30 rounded text-sm">
                        <div className="font-medium mb-1">Example for "002210":</div>
                        <div className="font-mono space-y-1">
                          <div>6th string (E): {currentFingeringValues[0] || '0'} → {currentFingeringValues[0] === '0' ? 'Open' : `Fret ${currentFingeringValues[0]}`}</div>
                          <div>5th string (A): {currentFingeringValues[1] || '0'} → {currentFingeringValues[1] === '0' ? 'Open' : `Fret ${currentFingeringValues[1]}`}</div>
                          <div>4th string (D): {currentFingeringValues[2] || '0'} → {currentFingeringValues[2] === '0' ? 'Open' : `Fret ${currentFingeringValues[2]}`}</div>
                          <div>3rd string (G): {currentFingeringValues[3] || '0'} → {currentFingeringValues[3] === '0' ? 'Open' : `Fret ${currentFingeringValues[3]}`}</div>
                          <div>2nd string (B): {currentFingeringValues[4] || '0'} → {currentFingeringValues[4] === '0' ? 'Open' : `Fret ${currentFingeringValues[4]}`}</div>
                          <div>1st string (E): {currentFingeringValues[5] || '0'} → {currentFingeringValues[5] === '0' ? 'Open' : `Fret ${currentFingeringValues[5]}`}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {currentVariation.description && (
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">Description</h3>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {currentVariation.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">All Variations</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {variations.items.map((variation, index) => (
                        <div
                          key={variation.id}
                          className={`flex items-center justify-between p-3 rounded cursor-pointer transition-colors ${
                            index === currentIndex
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => {
                            setCurrentIndex(index);
                            setCurrentVariation(variation);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="font-mono font-medium">{variation.fingering}</div>
                            {variation.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {variation.description}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(variation.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {currentVariation && (
        <>
          <EditChordDialog
            isOpen={editDialogOpen}
            onClose={() => setEditDialogOpen(false)}
            chord={currentVariation}
            onSuccess={handleEditSuccess}
          />
          
          <DeleteChordDialog
            isOpen={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
            chord={currentVariation}
            onSuccess={handleDeleteSuccess}
          />
        </>
      )}
    </div>
  );
}