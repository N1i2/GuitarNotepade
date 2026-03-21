"use client";

import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  label: string;
  icon?: React.ReactNode;
}

export function RatingDisplay({ rating, label, icon }: RatingDisplayProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-2">
      {icon && <div className="text-muted-foreground">{icon}</div>}
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < fullStars
                ? "text-yellow-500 fill-yellow-500"
                : i === fullStars && hasHalfStar
                  ? "text-yellow-500 fill-yellow-500 half-star"
                  : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
