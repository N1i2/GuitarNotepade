"use client";

import { useState, useMemo, memo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Filter, Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SongChordDto, SongPatternDto } from "@/types/songs";

type ResourceType = "chord" | "pattern";

interface AdvancedResourceSelectProps {
  type: ResourceType;
  value?: string;
  onChange: (value: string | undefined) => void;
  resources: (SongChordDto | SongPatternDto)[];
  placeholder?: string;
  disabled?: boolean;
  currentColor?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  filters?: {
    fingering?: string;
  };
  onFiltersChange?: (filters: { fingering?: string }) => void;
}

const arePropsEqual = (
  prevProps: AdvancedResourceSelectProps,
  nextProps: AdvancedResourceSelectProps,
) => {
  return (
    prevProps.type === nextProps.type &&
    prevProps.value === nextProps.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.currentColor === nextProps.currentColor &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.filters?.fingering === nextProps.filters?.fingering &&
    prevProps.resources === nextProps.resources &&
    prevProps.onChange === nextProps.onChange &&
    prevProps.onSearchChange === nextProps.onSearchChange &&
    prevProps.onFiltersChange === nextProps.onFiltersChange
  );
};

export const AdvancedResourceSelect = memo(function AdvancedResourceSelect({
  type,
  value,
  onChange,
  resources,
  placeholder = "Select...",
  disabled,
  currentColor,
  searchQuery: externalSearchQuery,
  onSearchChange,
  filters: externalFilters,
  onFiltersChange,
}: AdvancedResourceSelectProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [internalFilters, setInternalFilters] = useState<{
    fingering?: string;
  }>({});
  const [filterOpen, setFilterOpen] = useState(false);

  const searchQuery =
    externalSearchQuery !== undefined
      ? externalSearchQuery
      : internalSearchQuery;
  const filters =
    externalFilters !== undefined ? externalFilters : internalFilters;

  const handleSearchChange = (query: string) => {
    if (onSearchChange) {
      onSearchChange(query);
    } else {
      setInternalSearchQuery(query);
    }
  };

  const handleFiltersChange = (newFilters: { fingering?: string }) => {
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
  };

  const clearFilters = () => {
    handleSearchChange("");
    handleFiltersChange({});
    setFilterOpen(false);
  };

  const filteredResources = useMemo(() => {
    let filtered = [...resources];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => r.name.toLowerCase().includes(query));
    }

    if (type === "chord" && filters.fingering) {
      filtered = (filtered as SongChordDto[]).filter((chord) =>
        chord.fingering.includes(filters.fingering!),
      );
    }

    return filtered;
  }, [resources, searchQuery, filters, type]);

  const groupedResources = useMemo(() => {
    const groups: Record<string, typeof filteredResources> = {};

    filteredResources.forEach((resource) => {
      const firstChar = resource.name[0].toUpperCase();
      if (!groups[firstChar]) {
        groups[firstChar] = [];
      }
      groups[firstChar].push(resource);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredResources]);

  const selectedResource = resources.find((r) => r.id === value);

  return (
    <div className="space-y-2">
      <Select
        value={value || "none"}
        onValueChange={(val) => onChange(val === "none" ? undefined : val)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>
            {selectedResource && (
              <div className="flex items-center gap-2">
                {type === "chord" ? (
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: currentColor }}
                  />
                ) : (
                  <div
                    className="w-3 h-3 rounded border shrink-0"
                    style={{ backgroundColor: currentColor }}
                  />
                )}
                <span className="truncate">{selectedResource.name}</span>
                {type === "chord" && (
                  <span className="text-xs text-muted-foreground font-mono truncate">
                    {(selectedResource as SongChordDto).fingering}
                  </span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="p-0 w-[320px]">
          <div className="p-2 border-b">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={`Search ${type}s...`}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 h-9"
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
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-3">
                      <h4 className="font-medium">Filter Chords</h4>

                      <div className="space-y-2">
                        <label className="text-sm text-muted-foreground">
                          Fingering contains:
                        </label>
                        <Input
                          placeholder="e.g., 002210"
                          value={filters.fingering || ""}
                          onChange={(e) =>
                            handleFiltersChange({
                              ...filters,
                              fingering: e.target.value,
                            })
                          }
                          className="font-mono"
                        />
                      </div>

                      {(searchQuery || filters.fingering) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="w-full"
                        >
                          <X className="h-4 w-4 mr-2" />
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
                <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No {type}s found</p>
                {searchQuery && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleSearchChange("")}
                    className="mt-2"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div>
                <SelectItem value="none" className="border-b">
                  <div className="flex items-center gap-2 py-1">
                    <X className="h-4 w-4" />
                    <span>None</span>
                  </div>
                </SelectItem>

                {groupedResources.map(([letter, items]) => (
                  <div key={letter}>
                    <div className="px-2 py-1 bg-muted/50 text-xs font-medium sticky top-0 z-10">
                      {letter}
                    </div>
                    {items.map((resource) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        <div className="flex items-center gap-2 py-1 min-w-[200px]">
                          {type === "chord" ? (
                            <>
                              <div
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{
                                  backgroundColor: (resource as SongChordDto)
                                    .color,
                                }}
                              />
                              <span className="font-medium">
                                {resource.name}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono ml-auto">
                                {(resource as SongChordDto).fingering}
                              </span>
                            </>
                          ) : (
                            <>
                              <div
                                className="w-3 h-3 rounded border shrink-0"
                                style={{
                                  backgroundColor: (resource as SongPatternDto)
                                    .color,
                                }}
                              />
                              <span className="font-medium">
                                {resource.name}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs ml-auto"
                              >
                                {(resource as SongPatternDto).isFingerStyle
                                  ? "Finger"
                                  : "Strum"}
                              </Badge>
                            </>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-2 border-t text-xs text-muted-foreground bg-muted/20">
            {filteredResources.length} of {resources.length} {type}s
            {searchQuery && ` • Filtered by "${searchQuery}"`}
            {filters.fingering && ` • Fingering: ${filters.fingering}`}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}, arePropsEqual);
