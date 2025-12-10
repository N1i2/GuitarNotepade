"use client";

import { FiltersForUsers } from "@/types/profile";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Filter, Shield, ShieldOff, UserCheck, UserX } from "lucide-react";

interface UserFiltersProps {
  filters: FiltersForUsers;
  onFilterChange: (filters: Partial<FiltersForUsers>) => void;
}

export function UserFilters({ filters, onFilterChange }: UserFiltersProps) {
  const isBlockedValue = filters.isBlocked === null ? undefined : filters.isBlocked;
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
    return isBlockedValue ? "Show only blocked users" : "Show only unblocked users";
  };

  const getRoleText = () => {
    if (roleValue === undefined) return "Show by role";
    return roleValue === "Admin" ? "Show only admins" : "Show only regular users";
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <h3 className="font-semibold">Filters & Sorting</h3>
          </div>

          {/* Сортировка сверху */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort by</Label>
              <Select
                value={filters.sortBy || "createdAt"}
                onValueChange={(value) => onFilterChange({ sortBy: value as any })}
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

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Order</Label>
              <Select
                value={filters.sortOrder || "desc"}
                onValueChange={(value) => onFilterChange({ sortOrder: value as any })}
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

            {/* Email Filter */}
            <div className="space-y-2">
              <Label htmlFor="emailFilter">Email</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="emailFilter"
                  placeholder="Filter by email..."
                  value={filters.emailFilter || ""}
                  onChange={(e) => onFilterChange({ emailFilter: e.target.value || undefined })}
                  className="pl-8"
                />
              </div>
            </div>

            {/* NikName Filter */}
            <div className="space-y-2">
              <Label htmlFor="nikNameFilter">Nickname</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="nikNameFilter"
                  placeholder="Filter by nickname..."
                  value={filters.nikNameFilter || ""}
                  onChange={(e) => onFilterChange({ nikNameFilter: e.target.value || undefined })}
                  className="pl-8"
                />
              </div>
            </div>
          </div>

          {/* Фильтры с возможностью переключения */}
          <div className="flex flex-wrap gap-4 pt-0">
            {/* Blocked Filter */}
            <div className="flex items-center space-x-2">
              <Switch
                id="blocked-filter"
                checked={isBlockedValue !== undefined}
                onCheckedChange={handleBlockedToggle}
              />
              <Label htmlFor="blocked-filter" className="cursor-pointer flex items-center gap-2">
                {isBlockedValue !== undefined && (
                  isBlockedValue ? (
                    <UserX className="h-4 w-4 text-destructive" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-green-600" />
                  )
                )}
                {getBlockedText()}
              </Label>
              
              {/* Переключатель для blocked */}
              {isBlockedValue !== undefined && (
                <Switch
                  checked={isBlockedValue}
                  onCheckedChange={(checked) => onFilterChange({ isBlocked: checked })}
                  className="ml-2"
                />
              )}
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-2">
              <Switch
                id="role-filter"
                checked={roleValue !== undefined}
                onCheckedChange={handleRoleToggle}
              />
              <Label htmlFor="role-filter" className="cursor-pointer flex items-center gap-2">
                {roleValue !== undefined && (
                  roleValue === "Admin" ? (
                    <Shield className="h-4 w-4 text-primary" />
                  ) : (
                    <ShieldOff className="h-4 w-4 text-muted-foreground" />
                  )
                )}
                {getRoleText()}
              </Label>
              
              {/* Переключатель для role */}
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
        </div>
      </CardContent>
    </Card>
  );
}