"use client";

import { useTranslation } from "@/hooks/use-translation";

export function SegmentLineBreakHint() {
  const { t } = useTranslation();

  return (
    <div className="mb-3 rounded-lg bg-blue-50 p-3 text-xs dark:bg-blue-900/20">
      <p className="text-blue-800 dark:text-blue-300">
        {t("songEditor.capitalLineBreakHint")}
      </p>
    </div>
  );
}
