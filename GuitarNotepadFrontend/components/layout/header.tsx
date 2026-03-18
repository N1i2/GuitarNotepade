"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { usePathname } from "next/navigation";
import {
  Home,
  User,
  LogOut,
  ListMusic,
  Hand,
  FileMusic,
  FileText,
  Bell,
  Menu,
  Users,
  BookOpen,
  Star,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/use-notifications";

function NotificationBell() {
  const { unreadCount } = useNotifications(true);

  return (
    <Button asChild variant="ghost" size="sm" className="relative">
      <Link href="/home/messages" className="flex items-center">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-[10px]">
            {unreadCount}
          </Badge>
        )}
      </Link>
    </Button>
  );
}

export function Header() {
  const { user, isGuest, isAdmin, logout, isLoading } = useAuth();
  const pathname = usePathname();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-20 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">GuitarNotepad</span>
            <span className="text-2xl">🎸</span>
          </div>
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/home" className="flex items-center gap-2">
            <span className="text-xl font-bold text-teal-500 dark:text-teal-400">
              GuitarNotepad
            </span>
            <span className="text-2xl">🎸</span>
          </Link>

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
                <Hand className="h-4 w-4" />
                Chords
              </Link>
            </Button>

            <Button
              asChild
              variant={pathname === "/home/patterns" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Link href="/home/patterns">
                <ListMusic className="h-4 w-4" />
                Patterns
              </Link>
            </Button>

            <Button
              asChild
              variant={pathname === "/home/songs" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <Link href="/home/songs">
                <FileMusic className="h-4 w-4" />
                Songs
              </Link>
            </Button>

            {!isGuest && (
              <>
                <Button
                  asChild
                  variant={pathname === "/home/albums" ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Link href="/home/albums">
                    <FileText className="h-4 w-4" />
                    Albums
                  </Link>
                </Button>

                <Button
                  asChild
                  variant={pathname === "/home/users" ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Link href="/home/users">
                    <Users className="h-4 w-4" />
                    Users
                  </Link>
                </Button>

                <Button
                  asChild
                  variant={
                    pathname === "/home/subscriptions" ? "default" : "ghost"
                  }
                  size="sm"
                  className="gap-2"
                >
                  <Link href="/home/subscriptions">
                    <BookOpen className="h-4 w-4" />
                    Subscriptions
                  </Link>
                </Button>

                <Button
                  asChild
                  variant={pathname === "/home/premium" ? "default" : "ghost"}
                  size="sm"
                  className="gap-2"
                >
                  <Link href="/home/premium">
                    <Star className="h-4 w-4" />
                    Premium
                  </Link>
                </Button>
              </>
            )}
          </nav>

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="p-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/home" className="flex items-center gap-2">
                    <Home className="h-4 w-4" /> Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/home/chords" className="flex items-center gap-2">
                    <Hand className="h-4 w-4" /> Chords
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/home/patterns"
                    className="flex items-center gap-2"
                  >
                    <ListMusic className="h-4 w-4" /> Patterns
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/home/songs" className="flex items-center gap-2">
                    <FileMusic className="h-4 w-4" /> Songs
                  </Link>
                </DropdownMenuItem>
                {!isGuest && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/home/albums"
                        className="flex items-center gap-2"
                      >
                        <FileText className="h-4 w-4" /> Albums
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/home/users"
                        className="flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" /> Users
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/home/subscriptions"
                        className="flex items-center gap-2"
                      >
                        <BookOpen className="h-4 w-4" /> Subscriptions
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/home/premium"
                        className="flex items-center gap-2"
                      >
                        <Star className="h-4 w-4" /> Premium
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/home/messages"
                        className="flex items-center gap-2"
                      >
                        <Bell className="h-4 w-4" /> Messages
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isGuest ? (
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
          ) : (
            <>
              <NotificationBell />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={
                          user?.avatarUrl
                            ? `data:image/jpeg;base64,${user.avatarUrl}`
                            : undefined
                        }
                        alt={user?.nikName}
                      />
                      <AvatarFallback>
                        {user?.nikName ? getInitials(user.nikName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.nikName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            isAdmin
                              ? "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300"
                              : "bg-muted"
                          }`}
                        >
                          {user?.role}
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
                  <DropdownMenuItem
                    onClick={logout}
                    className="cursor-pointer text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex flex-col mr-5">
                <span className="text-sm font-medium leading-none">
                  {user?.nikName}
                </span>
                <span className="text-xs leading-none text-muted-foreground">
                  {user?.role}
                </span>
              </div>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
