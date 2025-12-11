"use client";

import { useState } from "react";
import { Chord } from "@/types/chords";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2, Trash2, Music } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChordsService } from "@/lib/api/chords-service";
import { useAuth } from "@/components/providers/auth-provider";

interface DeleteChordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chord: Chord;
  onSuccess: () => void;
}

export function DeleteChordDialog({
  isOpen,
  onClose,
  chord,
  onSuccess,
}: DeleteChordDialogProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await ChordsService.deleteChord(chord.id);
      toast.success(`Chord ${chord.name} deleted successfully`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to delete chord:", error);
      toast.error(error.message || "Failed to delete chord");
    } finally {
      setIsLoading(false);
    }
  };

  const isCreator = user?.id === chord.createdByUserId;
  const isAdmin = user?.role === "Admin";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-lg">Delete Chord</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="pt-2">
              <p>
                Are you sure you want to delete the chord{" "}
                <span className="font-bold">{chord.name}</span> with fingering{" "}
                <span className="font-mono font-bold">{chord.fingering}</span>?
                This action cannot be undone.
              </p>
              
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3 mb-2">
                  <Music className="h-5 w-5 text-muted-foreground" />
                  <div className="font-medium">{chord.name}</div>
                  <div className="font-mono text-sm bg-background px-2 py-1 rounded">
                    {chord.fingering}
                  </div>
                </div>
                
                {chord.description && (
                  <p className="text-sm text-muted-foreground">
                    {chord.description}
                  </p>
                )}
                
                <div className="mt-2 text-xs text-muted-foreground">
                  <div>Created by: {chord.createdByNikName || "Unknown"}</div>
                  <div>
                    Created: {new Date(chord.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      Permissions:
                    </p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {isCreator && (
                        <li>You created this chord</li>
                      )}
                      {isAdmin && (
                        <li>You have admin privileges</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
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
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Chord
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}