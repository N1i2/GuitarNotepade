"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { ProfileService } from "@/lib/api/profile-service";
import { FiltersForUsers, PaginatedUsers, User } from "@/types/profile";
import { UserTable } from "@/components/user-management/user-table";
import { UserFilters } from "@/components/user-management/user-filters";
import { Pagination } from "@/components/user-management/pagination";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";

export default function UsersPage() {
  const { user, isLoading: authLoading, isGuest } = useAuth();
  const router = useRouter();
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

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await ProfileService.getUsers(filters);
      setData(result);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to load users";
      toast.error(message || "Failed to load users. Please try again.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    if (!authLoading && isGuest) {
      toast.warning("Access denied", {
        description: "Please log in to view users.",
      });
      return;
    }

    if (!authLoading && user && !isGuest) {
      loadUsers();
    }
  }, [authLoading, isGuest, user, router, toast, loadUsers]);

  const handleFilterChange = (newFilters: Partial<FiltersForUsers>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleToggleBlock = async (
    targetUser: User,
    reason?: string,
    blockedUntil?: Date,
  ) => {
    if (!user || user.id === targetUser.id) return;

    setIsActionLoading(targetUser.id);
    try {
      if (reason && blockedUntil) {
        await ProfileService.blockUser({
          email: targetUser.email,
          reason,
          blockedUntil: blockedUntil.toISOString(),
        });
        toast.success(`Blocked ${targetUser.nikName}`);
      } else {
        await ProfileService.unblockUser(targetUser.email);
        toast.success(`Unblocked ${targetUser.nikName}`);
      }
      await loadUsers();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to manage block");
      }
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleToggleRole = async (targetUser: User) => {
    if (!user || user.id === targetUser.id) return;

    setIsActionLoading(targetUser.id);
    try {
      await ProfileService.toggleUserRole(targetUser.email);
      toast.success(`Updated role for ${targetUser.nikName}`);
      await loadUsers();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to change user role");
      }
    } finally {
      setIsActionLoading(null);
    }
  };

  const isCurrentUser = (userItem: User) => user?.id === userItem.id;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground mt-2">
              Browse users and view their profiles.
            </p>
          </div>
          <div className="hidden md:block">
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">User directory</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data ? `${data.totalCount} total users` : "Loading..."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <UserFilters filters={filters} onFilterChange={handleFilterChange} />

        <UserTable
          users={data?.items ?? []}
          currentUserId={user?.id}
          isActionLoading={isActionLoading}
          onToggleBlock={handleToggleBlock}
          onToggleRole={handleToggleRole}
          isSubscribed={() => false}
          isCurrentUser={isCurrentUser}
          showAdminActions={!!user?.role && user.role === "Admin"}
          showSubscribeAction={false}
        />

        {data && data.totalPages > 1 && (
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
      </div>
    </div>
  );
}
