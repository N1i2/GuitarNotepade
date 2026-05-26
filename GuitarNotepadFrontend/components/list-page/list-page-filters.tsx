"use client";

import * as React from "react";
import { Eye, EyeOff, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/hooks/use-translation";
import { cn } from "@/lib/utils";

export function ListPageFiltersCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card>
      <CardContent className={cn("space-y-4 pt-6", className)}>
        {children}
      </CardContent>
    </Card>
  );
}

export function ListPageFiltersPanel({
  title,
  children,
  footer,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <h3 className="text-sm font-semibold">{title ?? t("common.filters")}</h3>
      {children}
      {footer}
    </div>
  );
}

export function ListPageActionsBar({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center",
        left ? "sm:justify-between" : "sm:justify-end",
      )}
    >
      {left ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          {left}
        </div>
      ) : null}
      {right ? (
        <div className="flex items-center gap-2 sm:ml-auto">{right}</div>
      ) : null}
    </div>
  );
}

export function ListPageOnlyMineFilter({
  id,
  checked,
  onCheckedChange,
  disabled,
  label,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
        disabled={disabled}
      />
      <Label
        htmlFor={id}
        className={cn(
          "cursor-pointer text-sm font-medium",
          disabled && "text-muted-foreground",
        )}
      >
        <div className="flex items-center gap-2">
          {checked ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span>{label}</span>
        </div>
      </Label>
    </div>
  );
}

export function ListPageCountBadge({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Badge variant="outline" className="hidden md:flex">
      {icon}
      {children}
    </Badge>
  );
}

export function ListPageCreateButton({
  label,
  onClick,
  disabled,
  title,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <Button
      onClick={onClick}
      variant="default"
      className="w-full sm:w-auto"
      disabled={disabled}
      title={title}
    >
      <Plus className="mr-2 h-4 w-4" />
      {label}
    </Button>
  );
}
