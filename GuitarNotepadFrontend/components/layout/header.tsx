"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { usePathname } from "next/navigation";

export function Header() {
  const { user } = useAuth();
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";
  const isProfile = pathname === "/home/profile";
  const isAuthPage = isLoginPage || isRegisterPage;

  const getAuthButtonConfig = () => {
    if (isLoginPage) {
      return {
        text: "Register",
        href: "/register",
      };
    }
    if (isRegisterPage) {
      return {
        text: "Login",
        href: "/login",
      };
    }
    return null;
  };

  const getProfileButtonConfig = () =>{
    if(isProfile){
      return {
        text: "Home",
        href: "/home"
      }
    }
    return {
      text: "Profile",
      href: "/home/profile"
    }
  }

  const authButtonConfig = getAuthButtonConfig();
  const profileButtonConfig = getProfileButtonConfig();

  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-20 flex h-25 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold">Your Guitar Notepad</span>

          {user && (
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link
                href="/home"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Home
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Hello{user.role == "Admin" ? " admin" : ""}, {user.nikName}
              </span>
              <ThemeToggle />
              <Button
                asChild
                variant={isProfile ? "default" : "outline"}
                size="sm"
              >
                <Link href={profileButtonConfig.href}>{profileButtonConfig.text}</Link>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {isAuthPage && authButtonConfig ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={authButtonConfig.href}>
                    {authButtonConfig.text}
                  </Link>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
