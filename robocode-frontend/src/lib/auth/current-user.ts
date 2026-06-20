import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { apiGetOrNull } from "@/lib/api/client";
import type { Capability } from "@/lib/domain/roles";
import { can } from "@/lib/domain/roles";

/** The authenticated user, as returned by the backend's safe `publicUser` projection. */
export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  tenantId: string;
  isMinor: boolean;
  avatarSeed: string | null;
  roboPoints: number;
  level: number;
  locale: string | null;
  tenant: {
    id: string;
    slug: string;
    name: string;
    isPlatform: boolean;
    branding: unknown;
  } | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const data = await apiGetOrNull<{ user: CurrentUser | null }>("/auth/me");
  return data?.user ?? null;
});

/**
 * For pages under the authenticated shell: returns the active user, or redirects
 * to /login if the session is missing/stale. `redirect()` throws, so non-null.
 */
export async function getPageUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireActiveUser() {
  const user = await requireUser();
  if (user.status !== "active") throw new Error("PENDING_APPROVAL");
  return user;
}

export async function requireCapability(cap: Capability) {
  const user = await requireActiveUser();
  if (!can(user.role, cap)) throw new Error("FORBIDDEN");
  return user;
}
