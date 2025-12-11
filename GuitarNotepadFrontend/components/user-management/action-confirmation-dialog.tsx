"use client";

import { User } from "@/types/profile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2, Shield } from "lucide-react";

interface ActionConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  actionType?: "role";
  user?: User;
  isLoading: boolean;
}

export function ActionConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  actionType,
  user,
  isLoading,
}: ActionConfirmationDialogProps) {
  if (!user) return null; 
  if (actionType && actionType !== "role") return null; 

  const getDialogConfig = () => {
    return {
      title: user.role === "Admin" ? "Remove Admin Rights" : "Give Admin Rights",
      description: user.role === "Admin"
        ? `Are you sure you want to remove administrator rights from ${user.email}? They will lose access to admin features.`
        : `Are you sure you want to make ${user.email} an administrator? They will gain access to admin features.`,
      icon: Shield,
      confirmText: user.role === "Admin" ? "Remove Admin" : "Make Admin",
      confirmVariant: "default" as const,
    };
  };

  const config = getDialogConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900/20">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-lg">{config.title}</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="pt-2">
              <p>{config.description}</p>
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="font-medium">{user.nikName}</div>
                <div className="text-sm text-muted-foreground">{user.email}</div>
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
            variant={config.confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <config.icon className="mr-2 h-4 w-4" />
                {config.confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}