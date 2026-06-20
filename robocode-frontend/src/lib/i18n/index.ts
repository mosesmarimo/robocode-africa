/**
 * i18n core — importable from both server and client components.
 *
 * Server-only helper (getLocale) lives at the bottom, guarded by a
 * try/catch import of next/headers so tree-shaking works cleanly and
 * client bundles never include next/headers.
 *
 * Usage (server):  const locale = await getLocale();
 * Usage (client):  const locale = useLocale();
 */

import { DICT, LOCALES } from "./dictionaries";
export type { LocaleCode } from "./dictionaries";
export { LOCALES, DICT };

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";

export const RTL_LOCALES: Locale[] = ["ar"];

/** Is the given locale right-to-left? */
export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

/**
 * Translate a key for the given locale, falling back to English then the key.
 * Safe to call from both server and client.
 */
export function t(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return DICT[locale]?.[key] ?? DICT[DEFAULT_LOCALE]?.[key] ?? key;
}

/** Validate and coerce a raw string into a known Locale (or DEFAULT_LOCALE). */
export function coerceLocale(raw: string | null | undefined): Locale {
  if (!raw) return DEFAULT_LOCALE;
  const found = LOCALES.find((l) => l.code === raw);
  return found ? (found.code as Locale) : DEFAULT_LOCALE;
}

// ---------------------------------------------------------------------------
// Server-side helper — reads the "rc_locale" cookie via next/headers.
// Only usable in Server Components / Route Handlers / Server Actions.
// ---------------------------------------------------------------------------

/**
 * Read the current locale from the "rc_locale" cookie.
 * Must only be called from server components or server actions.
 */
export async function getLocale(): Promise<Locale> {
  try {
    // Dynamic import keeps next/headers out of client bundles entirely.
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const raw = jar.get("rc_locale")?.value;
    return coerceLocale(raw);
  } catch {
    // Fallback: running in a context where next/headers is unavailable.
    return DEFAULT_LOCALE;
  }
}
