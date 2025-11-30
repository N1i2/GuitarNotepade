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

  const authButtonConfig = getAuthButtonConfig();

  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto px-4 sm:px-6 lg:px-30 flex h-14 max-w-screen-2xl items-center justify-between">
        {/* Логотип и навигация */}
        <div className="flex items-center gap-6">
          <span className="text-xl font-bold">GuitarNotepad</span>
          <span className="text-2xl">🎸</span>

          {user && (
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link
                href="/home"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Home
              </Link>
              <Link
                href="/songs"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Songs
              </Link>
              <Link
                href="/chords"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Chords
              </Link>
            </nav>
          )}
        </div>

        {/* Правая часть - кнопки действий */}
        <div className="flex items-center gap-4">
          {user ? (
            // 👇 Для авторизованных пользователей - приветствие слева от кнопки темы
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Hello{user.role == "Admin" ? " admin" : ""}, {user.nikName}
              </span>
              <ThemeToggle />
              <Button asChild variant="outline" size="sm">
                <Link href="/profile">Profile</Link>
              </Button>
            </div>
          ) : (
            // 👇 Для неавторизованных пользователей
            <div className="flex items-center gap-3">
              <ThemeToggle />

              {isAuthPage && authButtonConfig ? (
                // 👇 Одна кнопка на auth страницах
                <Button asChild variant="outline" size="sm">
                  <Link href={authButtonConfig.href}>
                    {authButtonConfig.text}
                  </Link>
                </Button>
              ) : (
                // 👇 Две кнопки на других страницах
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
