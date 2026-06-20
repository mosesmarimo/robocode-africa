import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ROOT_DOMAIN } from "@/lib/domain/constants";

/**
 * Resolve the active tenant from the request host.
 *  - school.robocode.africa  -> tenant with slug "school"
 *  - robocode.africa / localhost -> the platform tenant
 * In dev you can also force a tenant via the `?tenant=slug` cookie/header fallback.
 */
export async function resolveTenantSlug(): Promise<string | null> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").toLowerCase();
  if (!host) return null;
  const rootHost = ROOT_DOMAIN.split(":")[0];
  const hostname = host.split(":")[0];

  // x-tenant header injected by middleware (dev convenience)
  const forced = h.get("x-tenant");
  if (forced) return forced;

  if (hostname === rootHost || hostname === "localhost" || hostname === "127.0.0.1") {
    return null; // platform
  }
  if (hostname.endsWith("." + rootHost)) {
    return hostname.slice(0, -("." + rootHost).length);
  }
  // custom domain
  return `@host:${hostname}`;
}

export async function getActiveTenant() {
  const slug = await resolveTenantSlug();
  if (!slug) {
    return prisma.tenant.findFirst({ where: { isPlatform: true } });
  }
  if (slug.startsWith("@host:")) {
    const hostname = slug.slice("@host:".length);
    const domain = await prisma.domain.findUnique({
      where: { hostname },
      include: { tenant: true },
    });
    return domain?.tenant ?? prisma.tenant.findFirst({ where: { isPlatform: true } });
  }
  return (
    (await prisma.tenant.findUnique({ where: { slug } })) ??
    (await prisma.tenant.findFirst({ where: { isPlatform: true } }))
  );
}

export type BrandTokens = {
  primary: string;
  secondary: string;
  accent: string;
  logoUrl?: string;
  tagline?: string;
};

export const DEFAULT_BRAND: BrandTokens = {
  primary: "#2563ff",
  secondary: "#16c79a",
  accent: "#ffb020",
  tagline: "Learn Robotics, Coding & AI",
};

export function brandFromTenant(branding: unknown): BrandTokens {
  const b = (branding ?? {}) as Partial<BrandTokens>;
  return { ...DEFAULT_BRAND, ...b };
}
