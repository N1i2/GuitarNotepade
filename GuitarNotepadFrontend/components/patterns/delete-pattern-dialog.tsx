"use client";

import { useState } from "react";
import { Pattern } from "@/types/patterns";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Loader2,
  Trash2,
  Music,
  User,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PatternsService } from "@/lib/api/patterns-service";
import { useAuth } from "@/components/providers/auth-provider";

interface DeletePatternDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pattern: Pattern;
  onSuccess: () => void;
}

export function DeletePatternDialog({
  isOpen,
  onClose,
  pattern,
  onSuccess,
}: DeletePatternDialogProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await PatternsService.deletePattern(pattern.id);
      toast.success(`Pattern "${pattern.name}" deleted successfully`);
      onSuccess();
      onClose();
    } catch (error: unknown) {
      let errorMessage = "Failed to delete pattern";
      if (error && typeof error === "object" && "status" in error) {
        const err = error as { status: number; message?: string };
        if (err.status === 404) {
          errorMessage = "Pattern not found";
        } else if (err.message) {
          errorMessage = err.message;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isCreator = user?.id === pattern.createdByUserId;
  const isAdmin = user?.role === "Admin";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-lg">Delete Pattern</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="pt-2">
              <p>
                Are you sure you want to delete the pattern{" "}
                <span className="font-bold">{pattern.name}</span>? This action
                cannot be undone.
              </p>

              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="flex items-center gap-3 mb-2">
                  <Music className="h-5 w-5 text-muted-foreground" />
                  <div className="font-medium">{pattern.name}</div>
                  <div className="text-sm bg-background px-2 py-1 rounded capitalize">
                    {pattern.isFingerStyle ? "Fingerstyle" : "Strumming"}
                  </div>
                </div>

                <div className="font-mono text-sm bg-background p-2 rounded mb-2">
                  {pattern.pattern}
                </div>

                {pattern.description && (
                  <p className="text-sm text-muted-foreground">
                    {pattern.description}
                  </p>
                )}

                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3" />
                    <span>
                      Created by: {pattern.createdByNikName || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Created:{" "}
                      {new Date(pattern.createdAt).toLocaleDateString()}
                    </span>
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
                      {isCreator && <li>You created this pattern</li>}
                      {isAdmin && <li>You have admin privileges</li>}
                      {!isCreator && !isAdmin && (
                        <li>
                          You do not have permission to delete this pattern
                        </li>
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
            disabled={isLoading || (!isCreator && !isAdmin)}
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
                Delete Pattern
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
