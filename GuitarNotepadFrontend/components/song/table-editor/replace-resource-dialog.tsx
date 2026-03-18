"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SongChordDto, SongPatternDto } from "@/types/songs";

interface ReplaceResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: "chord" | "pattern";
  currentResourceId: string;
  currentResourceName: string;
  availableResources: (SongChordDto | SongPatternDto)[];
  onConfirm: (newResourceId: string) => void;
}

export function ReplaceResourceDialog({
  open,
  onOpenChange,
  resourceType,
  currentResourceId,
  currentResourceName,
  availableResources,
  onConfirm,
}: ReplaceResourceDialogProps) {
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");

  const handleConfirm = () => {
    if (selectedResourceId && selectedResourceId !== currentResourceId) {
      onConfirm(selectedResourceId);
    }
    onOpenChange(false);
  };

  const otherResources = availableResources.filter(
    (r) => r.id !== currentResourceId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace {resourceType}</DialogTitle>
          <DialogDescription>
            Replace all occurrences of "{currentResourceName}" with another{" "}
            {resourceType}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Current {resourceType}</Label>
            <div className="p-2 border rounded-md bg-muted">
              {currentResourceName}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Replace with</Label>
            <Select
              value={selectedResourceId}
              onValueChange={setSelectedResourceId}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${resourceType}...`} />
              </SelectTrigger>
              <SelectContent>
                {otherResources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    <div className="flex items-center gap-2">
                      {resourceType === "chord" ? (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: (resource as SongChordDto).color,
                          }}
                        />
                      ) : (
                        <div
                          className="w-3 h-3 rounded border"
                          style={{
                            backgroundColor: (resource as SongPatternDto).color,
                          }}
                        />
                      )}
                      {resource.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedResourceId}>
            Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
