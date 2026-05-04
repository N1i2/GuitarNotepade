"use client";

import Link from "next/link";
import { AlertCircle, Music, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LimitWarningAlert({
  message,
  isWarning,
  showLink,
  upgradeHref = "/home/premium",
  upgradeLabel,
}: {
  message: string;
  isWarning: boolean;
  showLink?: boolean;
  upgradeHref?: string;
  upgradeLabel: string;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        isWarning
          ? "border-red-300 bg-red-50 dark:bg-red-950/20"
          : "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {isWarning ? (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-0" />
          ) : (
            <Music className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-0" />
          )}
          <span
            className={`text-sm ${isWarning ? "text-red-700 dark:text-red-300" : "text-blue-700 dark:text-blue-300"}`}
          >
            {message}
          </span>
        </div>
        {showLink && (
          <Link href={upgradeHref} className="flex-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 whitespace-nowrap border-red-300 hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900/30"
            >
              <ExternalLink className="h-3 w-3" />
              {upgradeLabel}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
