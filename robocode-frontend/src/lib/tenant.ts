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
  primary: "#11315c",
  secondary: "#36b34a",
  accent: "#5fb73a",
  tagline: "Learn Robotics, Coding & AI",
};

// Strict allow-list of CSS colour syntaxes we trust to be injected into a
// <style> block. Anything else (e.g. a tenant trying to break out of the style
// element or smuggle a url()/expression) is rejected so the default is used.
const HEX = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB = /^rgba?\(\s*[\d.]+(?:%?)\s*,\s*[\d.]+(?:%?)\s*,\s*[\d.]+(?:%?)\s*(?:,\s*[\d.]+%?\s*)?\)$/;
const HSL = /^hsla?\(\s*[\d.]+(?:deg)?\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+%?\s*)?\)$/;
const KEYWORD = /^[a-zA-Z]{1,20}$/; // simple colour keywords (e.g. "red", "transparent")

/** Returns the value only if it is a safe CSS colour, else the fallback. */
export function safeColor(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const v = value.trim();
  if (HEX.test(v) || RGB.test(v) || HSL.test(v) || KEYWORD.test(v)) return v;
  return fallback;
}

export function brandFromTenant(branding: unknown): BrandTokens {
  const b = (branding ?? {}) as Partial<BrandTokens>;
  return {
    ...DEFAULT_BRAND,
    ...b,
    // Never trust tenant-supplied colours verbatim — they end up in a <style>.
    primary: safeColor(b.primary, DEFAULT_BRAND.primary),
    secondary: safeColor(b.secondary, DEFAULT_BRAND.secondary),
    accent: safeColor(b.accent, DEFAULT_BRAND.accent),
  };
}

export type ActiveTenant = {
  name: string;
  slug: string;
  isPlatform: boolean;
};

/** Resolve the active tenant's branding from the backend (host-based). */
export async function getBranding(): Promise<{ brand: BrandTokens; tenant: ActiveTenant | null }> {
  const data = await apiGetOrNull<{ brand: BrandTokens; tenant: ActiveTenant | null }>("/branding");
  if (!data) return { brand: DEFAULT_BRAND, tenant: null };
  // Sanitise colours before they ever reach a <style> tag (stored-XSS guard).
  return { ...data, brand: brandFromTenant(data.brand) };
}
