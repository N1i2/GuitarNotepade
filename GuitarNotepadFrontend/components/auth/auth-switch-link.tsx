"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";

type AuthSwitchLinkProps = {
  variant: "login" | "register";
};

export function AuthSwitchLink({ variant }: AuthSwitchLinkProps) {
  const { t } = useTranslation();

  if (variant === "login") {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">
          {t("auth.login.noAccount")}{" "}
          <Link href="/register" className="text-primary hover:underline">
            {t("auth.signUp")}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-muted-foreground">
        {t("auth.register.hasAccount")}{" "}
        <Link href="/login" className="text-primary hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </div>
  );
}
