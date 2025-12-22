import { cn } from "@/lib/utils";

interface RatingDisplayProps {
  rating?: number;
  maxRating?: number;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function RatingDisplay({
  rating,
  maxRating = 5,
  label,
  icon,
  className,
}: RatingDisplayProps) {
  if (!rating) return null;

  const percentage = (rating / maxRating) * 100;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {icon && <div className="text-muted-foreground">{icon}</div>}

      <div className="flex-1">
        {label && (
          <div className="text-sm font-medium text-muted-foreground mb-1">
            {label}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative flex-1 h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
            {Array.from({ length: maxRating - 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full w-0.5 bg-background"
                style={{ left: `${((i + 1) / maxRating) * 100}%` }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 min-w-[60px]">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {rating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">/ {maxRating}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-1">
          {rating >= 4.5
            ? "Отлично"
            : rating >= 4.0
            ? "Очень хорошо"
            : rating >= 3.0
            ? "Хорошо"
            : rating >= 2.0
            ? "Нормально"
            : "Плохо"}
        </div>
      </div>
    </div>
  );
}

interface RatingSelectorProps {
  value?: number;
  onChange: (value: number) => void;
  label?: string;
  disabled?: boolean;
}

export function RatingSelector({
  value,
  onChange,
  label,
  disabled = false,
}: RatingSelectorProps) {
  const maxRating = 5;

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
      )}

      <div className="flex items-center gap-1">
        {Array.from({ length: maxRating }).map((_, index) => {
          const ratingValue = index + 1;
          const isActive = value ? ratingValue <= value : false;

          return (
            <button
              key={ratingValue}
              type="button"
              disabled={disabled}
              onClick={() => onChange(ratingValue)}
              className={cn(
                "relative p-2 rounded-lg transition-all duration-200",
                "hover:scale-110 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isActive
                  ? "bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold",
                  "border-2 transition-colors",
                  isActive
                    ? "border-blue-300 bg-gradient-to-br from-blue-50 to-white"
                    : "border-transparent"
                )}
              >
                {ratingValue}
              </div>

              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {ratingValue === 1 && "Очень плохо"}
                {ratingValue === 2 && "Плохо"}
                {ratingValue === 3 && "Нормально"}
                {ratingValue === 4 && "Хорошо"}
                {ratingValue === 5 && "Отлично"}
              </div>
            </button>
          );
        })}
      </div>

      {value && (
        <div className="text-xs text-muted-foreground text-center">
          {value === 1 && "Очень плохо"}
          {value === 2 && "Плохо"}
          {value === 3 && "Нормально"}
          {value === 4 && "Хорошо"}
          {value === 5 && "Отлично"}
        </div>
      )}
    </div>
  );
}
