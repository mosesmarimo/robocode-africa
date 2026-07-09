import { Injectable } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../prisma/prisma.service";
import { ROOT_DOMAIN } from "../domain/constants";

export type BrandTokens = {
  primary: string;
  secondary: string;
  accent: string;
  logoUrl?: string;
  tagline?: string;
};

export const DEFAULT_BRAND: BrandTokens = {
  primary: "#11315c",
  secondary: "#36b34a",
  accent: "#5fb73a",
  tagline: "Learn Robotics, Coding & AI",
};

export function brandFromTenant(branding: unknown): BrandTokens {
  const b = (branding ?? {}) as Partial<BrandTokens>;
  return { ...DEFAULT_BRAND, ...b };
}

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /** The original browser host, forwarded by the web client (x-forwarded-host) or proxy (host). */
  hostFromRequest(req: Request): string {
    const forwarded = (req.headers["x-forwarded-host"] as string) || "";
    const host = forwarded || (req.headers["host"] as string) || "";
    return host.toLowerCase();
  }

  /** Explicit tenant override (dev-only convenience for subdomain emulation on localhost). */
  forcedTenant(req: Request): string {
    // Gate on an EXPLICIT opt-in flag rather than the mere absence of
    // NODE_ENV==="production" — a single missing env var must not silently
    // enable client-controlled tenant selection in production.
    if (process.env.ALLOW_TENANT_OVERRIDE !== "true") return "";
    return ((req.headers["x-tenant"] as string) || "").toLowerCase();
  }

  resolveTenantSlug(host: string, forced?: string): string | null {
    if (forced) return forced;
    if (!host) return null;
    const rootHost = ROOT_DOMAIN.split(":")[0];
    const hostname = host.split(":")[0];
    if (hostname === rootHost || hostname === "localhost" || hostname === "127.0.0.1") {
      return null; // platform
    }
    if (hostname.endsWith("." + rootHost)) {
      const sub = hostname.slice(0, -("." + rootHost).length);
      // Reserved infra subdomains are the platform itself (api host, www) — they
      // must not be treated as a school slug (would break the API/mobile login).
      if (sub === "www" || sub === "api") return null;
      return sub;
    }
    return `@host:${hostname}`;
  }

  async getActiveTenant(host: string, forced?: string) {
    const slug = this.resolveTenantSlug(host, forced);
    // Only the actual root/localhost host (slug === null) falls back to platform.
    if (!slug) {
      return this.prisma.tenant.findFirst({ where: { isPlatform: true } });
    }
    if (slug.startsWith("@host:")) {
      const hostname = slug.slice("@host:".length);
      // Only VERIFIED custom domains resolve a tenant — otherwise any school_admin
      // could register someone else's hostname and hijack tenant resolution.
      // An unmatched custom hostname resolves to no tenant (null), NOT platform.
      const domain = await this.prisma.domain.findFirst({
        where: { hostname, verified: true },
        include: { tenant: true },
      });
      return domain?.tenant ?? null;
    }
    // An unknown subdomain resolves to no tenant (null) rather than silently
    // routing the request into the platform tenant (login/signup confusion).
    return this.prisma.tenant.findUnique({ where: { slug } });
  }

  /** Convenience: resolve the active tenant straight from a request. */
  fromRequest(req: Request) {
    return this.getActiveTenant(this.hostFromRequest(req), this.forcedTenant(req));
  }
}
