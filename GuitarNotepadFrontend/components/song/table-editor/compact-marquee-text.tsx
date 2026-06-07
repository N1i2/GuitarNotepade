"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CompactMarqueeTextProps {
  text: string;
  className?: string;
  widthClassName?: string;
}

export function CompactMarqueeText({
  text,
  className,
  widthClassName = "w-[4.5rem]",
}: CompactMarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    setShouldScroll(measure.offsetWidth > container.clientWidth + 1);
  }, [text, widthClassName]);

  if (!text) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-3.5 shrink-0 overflow-hidden",
        widthClassName,
        className,
      )}
    >
      <span
        ref={measureRef}
        className="pointer-events-none absolute whitespace-nowrap opacity-0"
        aria-hidden
      >
        {text}
      </span>

      {shouldScroll ? (
        <div className="compact-marquee-track absolute inset-y-0 left-0 text-[10px] font-mono leading-none text-muted-foreground">
          <span className="compact-marquee-item">{text}</span>
          <span className="compact-marquee-item" aria-hidden>
            {text}
          </span>
        </div>
      ) : (
        <span className="block h-3.5 truncate text-[10px] font-mono leading-none text-muted-foreground">
          {text}
        </span>
      )}
    </div>
  );
}
