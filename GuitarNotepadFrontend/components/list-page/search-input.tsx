"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchInputProps = Omit<React.ComponentProps<"input">, "type">;

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div
      className={cn(
        "flex h-9 w-full min-w-0 items-center rounded-md border border-input bg-transparent shadow-xs dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className,
      )}
    >
      <Search
        className="ml-3 size-4 shrink-0 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        data-slot="search-input"
        className={cn(
          "min-w-0 flex-1 bg-transparent px-2 py-1 text-base outline-none md:text-sm",
          "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        )}
        {...props}
      />
    </div>
  );
}
