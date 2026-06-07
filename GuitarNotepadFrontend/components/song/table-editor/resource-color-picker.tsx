"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_COLORS } from "@/lib/song-segment-utils";
import { cn } from "@/lib/utils";

interface ResourceColorPickerProps {
  type: "chord" | "pattern";
  currentColor?: string;
  usedColors: string[];
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

export function ResourceColorPicker({
  type,
  currentColor,
  usedColors,
  onColorChange,
  disabled,
}: ResourceColorPickerProps) {
  const palette = ALL_COLORS;
  const [open, setOpen] = useState(false);

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    setOpen(false);
  };

  return (
    <div
      className="shrink-0"
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            onPointerDown={(event) => event.stopPropagation()}
            className={cn(
              "size-6 shrink-0 rounded-full border-2 border-background ring-1 ring-border transition-opacity",
              disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:opacity-80",
              type === "pattern" && "rounded-md",
            )}
            style={{ backgroundColor: currentColor || "#ccc" }}
            title="Change color"
          />
        </PopoverTrigger>
        <PopoverContent
          className="w-64"
          align="start"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <p className="mb-2 text-xs text-muted-foreground">
            {type === "chord"
              ? "Border color for this chord"
              : "Background color for this pattern"}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {palette.map((color) => {
              const isCurrent = currentColor === color;
              const isUsed =
                usedColors.includes(color) && color !== currentColor;

              return (
                <button
                  key={color}
                  type="button"
                  disabled={isUsed}
                  className={cn(
                    "h-8 rounded-md border-2 transition-all",
                    isCurrent && "ring-2 ring-offset-2 ring-primary",
                    isUsed && "cursor-not-allowed opacity-40",
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                />
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
