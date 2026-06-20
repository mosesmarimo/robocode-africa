import "server-only";
import { apiGetOrNull } from "@/lib/api/client";

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

export type ActiveTenant = {
  name: string;
  slug: string;
  isPlatform: boolean;
};

/** Resolve the active tenant's branding from the backend (host-based). */
export async function getBranding(): Promise<{ brand: BrandTokens; tenant: ActiveTenant | null }> {
  const data = await apiGetOrNull<{ brand: BrandTokens; tenant: ActiveTenant | null }>("/branding");
  return data ?? { brand: DEFAULT_BRAND, tenant: null };
}
