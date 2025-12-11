import { UserManagementTable } from "@/components/user-management/user-management-table";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function UserManagementPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-20 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage users, block/unblock accounts, and assign administrator roles
            </p>
          </div>
          <div className="hidden md:block">
            <Card className="border-primary/20">
              <CardContent className="p-3"> 
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Admin Panel</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1"> 
                  You have full administrative privileges
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <UserManagementTable />
      </div>
    </div>
  );
}