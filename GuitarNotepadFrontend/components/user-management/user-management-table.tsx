"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { ProfileService } from "@/lib/api/profile-service";
import { FiltersForUsers, PaginatedUsers, User } from "@/types/profile";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Users, ShieldAlert } from "lucide-react";
import { UserFilters } from "./user-filters";
import { UserTable } from "./user-table";
import { Pagination } from "./pagination";

export function UserManagementTable() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [filters, setFilters] = useState<FiltersForUsers>({
    page: 1,
    pageSize: 10,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [data, setData] = useState<PaginatedUsers | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await ProfileService.getAllUsers(filters);
      setData(result);
    } catch (error) {
      console.error("Failed to load users:", error);

      toast.error("Failed to load users. Please try again.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<FiltersForUsers>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

const handleToggleBlock = async (user: User, reason?: string, blockedUntil?: Date) => {
  if (!currentUser || user.id === currentUser.id) return;
  
  setIsActionLoading(user.id);
  try {
    if (reason && blockedUntil) {
      await ProfileService.blockUser({
        email: user.email,
        reason,
        blockedUntil: blockedUntil.toISOString()
      });
      toast.success(`User ${user.email} has been blocked`);
    } else {
      await ProfileService.unblockUser(user.email);
      toast.success(`User ${user.email} has been unblocked`);
    }
    
    await loadUsers();
  } catch (error: any) {
    toast.error(error.message || "Failed to manage block");
  } finally {
    setIsActionLoading(null);
  }
};

  const handleToggleRole = async (user: User) => {
    if (!currentUser || user.id === currentUser.id) return;

    setIsActionLoading(user.id);
    try {
      await ProfileService.toggleUserRole(user.email);

      toast.success(`User ${user.email} role has been changed`);

      await loadUsers();
    } catch (error: any) {
      console.error("Failed to toggle role:", error);
      toast.error(error.message || "Failed to change user role", "destructive");
    } finally {
      setIsActionLoading(null);
    }
  };

  const isCurrentUser = (user: User) => currentUser?.id === user.id;

  if (isLoading && !data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.items?.length) {
    return (
      <>
        <UserFilters filters={filters} onFilterChange={handleFilterChange} />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No users found</h3>
            <p className="text-muted-foreground text-center mt-2">
              {Object.values(filters).some(
                (v) => v !== undefined && v !== "" && v !== null
              )
                ? "Try adjusting your filters to find users"
                : "There are no users in the system yet"}
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <UserFilters filters={filters} onFilterChange={handleFilterChange} />

      <Card>
        <CardContent className="p-0">
          <UserTable
            users={data.items}
            currentUserId={currentUser?.id}
            isActionLoading={isActionLoading}
            onToggleBlock={handleToggleBlock}
            onToggleRole={handleToggleRole}
            isCurrentUser={isCurrentUser}
          />
        </CardContent>
      </Card>

      {data.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
            hasPreviousPage={data.hasPreviousPage}
            hasNextPage={data.hasNextPage}
          />
        </div>
      )}

      {currentUser && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert className="h-4 w-4" />
          <span>
            You are viewing as: <strong>{currentUser.nikName}</strong> (
            {currentUser.email})
          </span>
        </div>
      )}
    </>
  );
}
