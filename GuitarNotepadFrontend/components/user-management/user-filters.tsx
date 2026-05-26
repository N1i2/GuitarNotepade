"use client";

import { FiltersForUsers } from "@/types/profile";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Shield, ShieldOff, UserCheck, UserX } from "lucide-react";
import { SearchInput } from "@/components/list-page/search-input";
import {
  ListPageFiltersCard,
  ListPageFiltersPanel,
} from "@/components/list-page/list-page-filters";

interface UserFiltersProps {
  filters: FiltersForUsers;
  onFilterChange: (filters: Partial<FiltersForUsers>) => void;
}

export function UserFilters({ filters, onFilterChange }: UserFiltersProps) {
  const isBlockedValue =
    filters.isBlocked === null ? undefined : filters.isBlocked;
  const roleValue = filters.role === null ? undefined : filters.role;

  const handleBlockedToggle = (checked: boolean) => {
    if (checked) {
      onFilterChange({ isBlocked: false });
    } else {
      onFilterChange({ isBlocked: undefined });
    }
  };

  const handleRoleToggle = (checked: boolean) => {
    if (checked) {
      onFilterChange({ role: "User" });
    } else {
      onFilterChange({ role: undefined });
    }
  };

  const getBlockedText = () => {
    if (isBlockedValue === undefined) return "Show blocked users";
    return isBlockedValue
      ? "Show only blocked users"
      : "Show only unblocked users";
  };

  const getRoleText = () => {
    if (roleValue === undefined) return "Show by role";
    return roleValue === "Admin"
      ? "Show only admins"
      : "Show only regular users";
  };

  return (
    <ListPageFiltersCard>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="emailFilter">Email</Label>
          <SearchInput
            id="emailFilter"
            placeholder="Filter by email..."
            value={filters.emailFilter || ""}
            onChange={(e) =>
              onFilterChange({ emailFilter: e.target.value || undefined })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nikNameFilter">Nickname</Label>
          <SearchInput
            id="nikNameFilter"
            placeholder="Filter by nickname..."
            value={filters.nikNameFilter || ""}
            onChange={(e) =>
              onFilterChange({
                nikNameFilter: e.target.value || undefined,
              })
            }
          />
        </div>
      </div>

      <ListPageFiltersPanel title="Filters & Sorting">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="sortBy">Sort by</Label>
            <Select
              value={filters.sortBy || "createdAt"}
              onValueChange={(value: "email" | "nikName" | "createdAt") =>
                onFilterChange({ sortBy: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select sort field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="nikName">Nickname</SelectItem>
                <SelectItem value="createdAt">Registration Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sortOrder">Order</Label>
            <Select
              value={filters.sortOrder || "desc"}
              onValueChange={(value: "asc" | "desc") =>
                onFilterChange({ sortOrder: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="blocked-filter"
              checked={isBlockedValue !== undefined}
              onCheckedChange={handleBlockedToggle}
            />
            <Label
              htmlFor="blocked-filter"
              className="flex cursor-pointer items-center gap-2"
            >
              {isBlockedValue !== undefined &&
                (isBlockedValue ? (
                  <UserX className="h-4 w-4 text-destructive" />
                ) : (
                  <UserCheck className="h-4 w-4 text-green-600" />
                ))}
              {getBlockedText()}
            </Label>

            {isBlockedValue !== undefined && (
              <Switch
                checked={isBlockedValue}
                onCheckedChange={(checked) =>
                  onFilterChange({ isBlocked: checked })
                }
                className="ml-2"
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="role-filter"
              checked={roleValue !== undefined}
              onCheckedChange={handleRoleToggle}
            />
            <Label
              htmlFor="role-filter"
              className="flex cursor-pointer items-center gap-2"
            >
              {roleValue !== undefined &&
                (roleValue === "Admin" ? (
                  <Shield className="h-4 w-4 text-primary" />
                ) : (
                  <ShieldOff className="h-4 w-4 text-muted-foreground" />
                ))}
              {getRoleText()}
            </Label>

            {roleValue !== undefined && (
              <Select
                value={roleValue}
                onValueChange={(value) => onFilterChange({ role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">Regular</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </ListPageFiltersPanel>
    </ListPageFiltersCard>
  );
}
