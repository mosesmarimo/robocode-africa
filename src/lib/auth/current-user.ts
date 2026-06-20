import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { readSession } from "@/lib/auth/session";
import type { Capability } from "@/lib/domain/roles";
import { can } from "@/lib/domain/roles";

export const getCurrentUser = cache(async () => {
  const session = await readSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { tenant: true },
  });
  if (!user || user.status === "suspended" || user.status === "rejected") return null;
  return user;
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/**
 * For pages under the authenticated shell: returns the active user, or redirects
 * to /login if the session is missing/stale (e.g. the user no longer exists).
 * `redirect()` throws, so the return type is non-null.
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
