"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { usePathname } from "next/navigation";
import { Shield, Home, User, LogOut, Music } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isAdmin = user?.role === "Admin";

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={user ? "/home" : "/"} className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-foreground via-foreground/80 to-teal-500 dark:to-teal-400 bg-clip-text text-transparent">
              GuitarNotepad
            </span>
            <span className="text-2xl">🎸</span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1 text-sm">
              <Button
                asChild
                variant={pathname === "/home" ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Link href="/home">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
              </Button>

              <Button
                asChild
                variant={pathname === "/home/chords" ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Link href="/home/chords">
                  <Music className="h-4 w-4" />
                  Chords
                </Link>
              </Button>
              
              {isAdmin && (
                <Button
                  asChild
                  variant={pathname === "/home/user-management" ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Link href="/home/user-management">
                    <Shield className="h-4 w-4" />
                    User Management
                  </Link>
                </Button>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={user.avatarUrl ? `data:image/jpeg;base64,${user.avatarUrl}` : undefined} 
                      alt={user.nikName}
                    />
                    <AvatarFallback>{getInitials(user.nikName)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.nikName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${user.role === 'Admin' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300' : 'bg-muted'}`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/home/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              {pathname === "/login" || pathname === "/register" ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={pathname === "/login" ? "/register" : "/login"}>
                    {pathname === "/login" ? "Sign Up" : "Sign In"}
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/register">Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}