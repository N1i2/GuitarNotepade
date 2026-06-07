"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Filter, Music, ChevronDown, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SongChordDto, SongPatternDto } from "@/types/songs";
import { PatternPreviewSnippet } from "./pattern-preview-snippet";
import { CompactMarqueeText } from "./compact-marquee-text";
import { cn } from "@/lib/utils";

type ResourceType = "chord" | "pattern";

interface AdvancedResourceSelectProps {
  type: ResourceType;
  value?: string;
  onChange: (value: string | undefined) => void;
  resources: (SongChordDto | SongPatternDto)[];
  placeholder?: string;
  disabled?: boolean;
  currentColor?: string;
}

export function AdvancedResourceSelect({
  type,
  value,
  onChange,
  resources,
  placeholder = "Select...",
  disabled,
  currentColor,
}: AdvancedResourceSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fingeringFilter, setFingeringFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  const selectedResource = resources.find((resource) => resource.id === value);

  const filteredResources = useMemo(() => {
    let filtered = [...resources];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((resource) =>
        resource.name.toLowerCase().includes(query),
      );
    }

    if (type === "chord" && fingeringFilter.trim()) {
      filtered = (filtered as SongChordDto[]).filter((chord) =>
        chord.fingering.includes(fingeringFilter),
      );
    }

    return filtered;
  }, [resources, searchQuery, fingeringFilter, type]);

  const groupedResources = useMemo(() => {
    const groups: Record<string, typeof filteredResources> = {};

    filteredResources.forEach((resource) => {
      const firstChar = resource.name[0]?.toUpperCase() || "#";
      if (!groups[firstChar]) {
        groups[firstChar] = [];
      }
      groups[firstChar].push(resource);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredResources]);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery("");
      setFingeringFilter("");
      setFilterOpen(false);
    }
  };

  const handleSelect = (resourceId?: string) => {
    onChange(resourceId);
    setOpen(false);
    setSearchQuery("");
    setFingeringFilter("");
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFingeringFilter("");
    setFilterOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between px-3 font-normal",
            !selectedResource && "text-muted-foreground",
          )}
        >
          <span className="flex min-w-0 items-center gap-2 overflow-hidden">
            {selectedResource ? (
              <>
                {type === "chord" ? (
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: currentColor }}
                  />
                ) : (
                  <span
                    className="size-3 shrink-0 rounded border"
                    style={{ backgroundColor: currentColor }}
                  />
                )}
                <span className="truncate">{selectedResource.name}</span>
                {type === "chord" && (
                  <CompactMarqueeText
                    text={(selectedResource as SongChordDto).fingering}
                    widthClassName="w-[4.5rem]"
                  />
                )}
                {type === "pattern" && (
                  <PatternPreviewSnippet
                    pattern={(selectedResource as SongPatternDto).pattern}
                    isFingerStyle={
                      (selectedResource as SongPatternDto).isFingerStyle
                    }
                    widthClassName="w-[5.5rem]"
                  />
                )}
              </>
            ) : (
              <span className="truncate">{placeholder}</span>
            )}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[320px] p-0"
        align="start"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div
          className="border-b p-2"
          onPointerDown={(event) => event.preventDefault()}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${type}s...`}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-9 pl-8"
                autoFocus
              />
            </div>

            {type === "chord" && (
              <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-64"
                  align="end"
                  onOpenAutoFocus={(event) => event.preventDefault()}
                >
                  <div
                    className="space-y-3"
                    onPointerDown={(event) => event.preventDefault()}
                  >
                    <h4 className="font-medium">Filter Chords</h4>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">
                        Fingering contains:
                      </label>
                      <Input
                        placeholder="e.g., 002210"
                        value={fingeringFilter}
                        onChange={(event) =>
                          setFingeringFilter(event.target.value)
                        }
                        className="font-mono"
                        autoFocus
                      />
                    </div>
                    {(searchQuery || fingeringFilter) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="w-full"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear filters
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <ScrollArea className="h-[350px]">
          {filteredResources.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Music className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No {type}s found</p>
              {searchQuery && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="mt-2"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="p-1">
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm hover:bg-accent",
                  !value && "bg-accent",
                )}
                onClick={() => handleSelect(undefined)}
              >
                <X className="h-4 w-4" />
                <span>None</span>
                {!value && <Check className="ml-auto h-4 w-4" />}
              </button>

              {groupedResources.map(([letter, items]) => (
                <div key={letter}>
                  <div className="sticky top-0 z-10 bg-muted/50 px-2 py-1 text-xs font-medium">
                    {letter}
                  </div>
                  {items.map((resource) => {
                    const isSelected = value === resource.id;

                    return (
                      <button
                        key={resource.id}
                        type="button"
                        className={cn(
                          "flex w-full rounded-sm px-2 py-2 text-left text-sm hover:bg-accent",
                          isSelected && "bg-accent",
                        )}
                        onClick={() => handleSelect(resource.id)}
                      >
                        {type === "chord" ? (
                          <div className="flex w-full items-center gap-2">
                            <span
                              className="size-3 shrink-0 rounded-full"
                              style={{
                                backgroundColor: (resource as SongChordDto)
                                  .color,
                              }}
                            />
                            <span className="shrink-0 font-medium">
                              {resource.name}
                            </span>
                            <CompactMarqueeText
                              text={(resource as SongChordDto).fingering}
                              widthClassName="w-[5.5rem]"
                              className="ml-auto"
                            />
                            {isSelected && (
                              <Check className="ml-2 h-4 w-4 shrink-0" />
                            )}
                          </div>
                        ) : (
                          <div className="flex w-full flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 shrink-0 rounded border"
                                style={{
                                  backgroundColor: (
                                    resource as SongPatternDto
                                  ).color,
                                }}
                              />
                              <span className="font-medium">
                                {resource.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="ml-auto text-xs"
                              >
                                {(resource as SongPatternDto).isFingerStyle
                                  ? "Finger"
                                  : "Strum"}
                              </Badge>
                              {isSelected && (
                                <Check className="h-4 w-4 shrink-0" />
                              )}
                            </div>
                            <PatternPreviewSnippet
                              pattern={(resource as SongPatternDto).pattern}
                              isFingerStyle={
                                (resource as SongPatternDto).isFingerStyle
                              }
                              widthClassName="w-[8rem]"
                              className="pl-5"
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="border-t bg-muted/20 p-2 text-xs text-muted-foreground">
          {filteredResources.length} of {resources.length} {type}s
          {searchQuery && ` • Filtered by "${searchQuery}"`}
          {fingeringFilter && ` • Fingering: ${fingeringFilter}`}
        </div>
      </PopoverContent>
    </Popover>
  );
}
