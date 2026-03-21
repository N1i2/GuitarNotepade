"use client";

import { Star } from "lucide-react";
import { Label } from "@/components/ui/label";

interface RatingSelectorProps {
  value?: number;
  onChange: (value: number | undefined) => void;
  label: string;
  disabled?: boolean;
}

export function RatingSelector({
  value,
  onChange,
  label,
  disabled,
}: RatingSelectorProps) {
  const handleStarClick = (starValue: number) => {
    if (disabled) return;
    if (value === starValue) {
      onChange(undefined);
    } else {
      onChange(starValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            disabled={disabled}
            className="focus:outline-none transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Star
              className={`h-6 w-6 ${
                value && star <= value
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            disabled={disabled}
            className="ml-2 text-xs text-muted-foreground hover:text-destructive"
          >
            Clear
          </button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {value ? `${value}/5 selected` : "No rating (optional)"}
      </p>
    </div>
  );
}
