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
  primary: "#2563ff",
  secondary: "#16c79a",
  accent: "#ffb020",
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

  /** Explicit tenant override sent by the web client (dev convenience / subdomain emulation). */
  forcedTenant(req: Request): string {
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
      return hostname.slice(0, -("." + rootHost).length);
    }
    return `@host:${hostname}`;
  }

  async getActiveTenant(host: string, forced?: string) {
    const slug = this.resolveTenantSlug(host, forced);
    if (!slug) {
      return this.prisma.tenant.findFirst({ where: { isPlatform: true } });
    }
    if (slug.startsWith("@host:")) {
      const hostname = slug.slice("@host:".length);
      const domain = await this.prisma.domain.findUnique({
        where: { hostname },
        include: { tenant: true },
      });
      return domain?.tenant ?? (await this.prisma.tenant.findFirst({ where: { isPlatform: true } }));
    }
    return (
      (await this.prisma.tenant.findUnique({ where: { slug } })) ??
      (await this.prisma.tenant.findFirst({ where: { isPlatform: true } }))
    );
  }

  /** Convenience: resolve the active tenant straight from a request. */
  fromRequest(req: Request) {
    return this.getActiveTenant(this.hostFromRequest(req), this.forcedTenant(req));
  }
}
