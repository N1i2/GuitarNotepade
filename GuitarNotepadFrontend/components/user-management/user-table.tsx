"use client";

import { User } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Shield, ShieldOff, UserX, UserCheck, AlertCircle } from "lucide-react";
import { useState } from "react";
import { ActionConfirmationDialog } from "./action-confirmation-dialog";

interface UserTableProps {
  users: User[];
  currentUserId?: string;
  isActionLoading: string | null;
  onToggleBlock: (user: User) => Promise<void>;
  onToggleRole: (user: User) => Promise<void>;
  isCurrentUser: (user: User) => boolean;
}

export function UserTable({
  users,
  currentUserId,
  isActionLoading,
  onToggleBlock,
  onToggleRole,
  isCurrentUser,
}: UserTableProps) {
  const [pendingAction, setPendingAction] = useState<{
    type: "block" | "role";
    user: User;
  } | null>(null);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction.type === "block") {
        await onToggleBlock(pendingAction.user);
      } else {
        await onToggleRole(pendingAction.user);
      }
    } finally {
      setPendingAction(null);
    }
  };

  const getBlockActionText = (user: User) => {
    if (isCurrentUser(user)) return "Cannot block yourself";
    return user.isBlocked ? "Unblock user" : "Block user";
  };

  const getRoleActionText = (user: User) => {
    if (isCurrentUser(user)) return "Cannot change your own role";
    return user.role === "Admin" ? "Remove admin rights" : "Give admin rights";
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-b border-t">
            <TableHead className="border-l pl-6">User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="text-right border-r pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => {
            const isSelf = isCurrentUser(user);
            const isBlockActionLoading = isActionLoading === user.id;
            const isLastRow = index === users.length - 1;
            
            return (
              <TableRow 
                key={user.id} 
                className={`
                  border-b 
                  ${isLastRow ? '' : 'hover:bg-muted/50'} 
                  transition-colors
                `}
              >
                <TableCell className="border-l pl-6 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={user.avatarUrl ? `data:image/jpeg;base64,${user.avatarUrl}` : undefined} 
                        alt={user.nikName}
                      />
                      <AvatarFallback>{getInitials(user.nikName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{user.nikName}</div>
                      {user.bio && (
                        <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {user.bio}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell className="py-3">
                  <div className="font-mono text-sm truncate max-w-[200px]" title={user.email}>
                    {user.email}
                  </div>
                </TableCell>
                
                <TableCell className="py-3">
                  <Badge variant={user.role === "Admin" ? "default" : "secondary"} className="min-w-[70px] justify-center">
                    {user.role === "Admin" ? (
                      <Shield className="h-3 w-3 mr-1" />
                    ) : (
                      <ShieldOff className="h-3 w-3 mr-1" />
                    )}
                    {user.role}
                  </Badge>
                </TableCell>
                
                <TableCell className="py-3">
                  <Badge variant={user.isBlocked ? "destructive" : "outline"} className="min-w-[70px] justify-center">
                    {user.isBlocked ? "Blocked" : "Active"}
                  </Badge>
                </TableCell>
                
                <TableCell className="py-3">
                  <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {new Date(user.createAt).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </TableCell>
                
                <TableCell className="text-right border-r pr-6 py-3">
                  <div className="flex justify-end gap-2">
                    {/* Block/Unblock Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={user.isBlocked ? "default" : "destructive"}
                            size="sm"
                            onClick={() => setPendingAction({ type: "block", user })}
                            disabled={isSelf || isBlockActionLoading}
                            className="w-28"
                          >
                            {isBlockActionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : user.isBlocked ? (
                              <UserCheck className="h-4 w-4 mr-1" />
                            ) : (
                              <UserX className="h-4 w-4 mr-1" />
                            )}
                            {user.isBlocked ? "Unblock" : "Block"}
                          </Button>
                        </TooltipTrigger>
                        {isSelf && (
                          <TooltipContent>
                            <p className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Cannot block yourself
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>

                    {/* Role Toggle Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPendingAction({ type: "role", user })}
                            disabled={isSelf || isBlockActionLoading}
                            className="w-32"
                          >
                            {user.role === "Admin" ? "Remove Admin" : "Make Admin"}
                          </Button>
                        </TooltipTrigger>
                        {isSelf && (
                          <TooltipContent>
                            <p className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Cannot change your own role
                            </p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Confirmation Dialog */}
      <ActionConfirmationDialog
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
        actionType={pendingAction?.type}
        user={pendingAction?.user}
        isLoading={isActionLoading === pendingAction?.user?.id}
      />
    </>
  );
}