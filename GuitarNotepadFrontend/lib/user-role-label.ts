import type { MessageKey } from "@/lib/i18n/messages";
import type { UserProfileResponse } from "@/types/profile";

export function getAccountRoleKey(
  user: UserProfileResponse | null | undefined,
): MessageKey {
  if (!user || user.role === "Guest") {
    return "common.role.guest";
  }

  if (user.role === "Admin") {
    return "common.role.admin";
  }

  if (user.hasPremium) {
    return "common.role.premium";
  }

  return "common.role.user";
}
